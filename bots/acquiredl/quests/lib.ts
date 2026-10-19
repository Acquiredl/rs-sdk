// Shared helpers for the quest scripts (lab_log.md, Session 3).
//
// Progress signal, two layers (lab_log Session 3, "Tracking method"):
//   journal()   opens the quest's own journal page from the quest tab and saves
//               a screenshot of it. The page is the game's exact step text, but
//               world state never carries modal text, so only a reader of the
//               PNG (the agent) sees it; scripts cannot branch on it.
//   Progress    per-bot step flags in progress-<bot>.json, each set only on
//               observed evidence (an NPC line, an item, a game message). This
//               is what scripts resume from. done() also watches for the
//               server's "Congratulations! Quest complete!" message.
import type { BotActions } from '../../../sdk/actions';
import type { BotSDK } from '../../../sdk/index';
import type { BotWorldState, NearbyLoc, NearbyNpc } from '../../../sdk/types';
import { findLongPath, findDoorsAlongPath } from '../../../sdk/pathfinding';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export type Ctx = { bot: BotActions; sdk: BotSDK };

const HERE = import.meta.dir;
export const BOT = process.env.BOT_USERNAME ?? process.argv[2] ?? 'unknown';

// Quest-tab button per quest (questlist:<name> in server/content/pack/interface.pack)
// and the varp the server keeps the stage in (pack/varp.pack). The varp is not in
// world state; it is listed so the server scripts can be read against a stage.
export const QUESTS = {
    cook: { name: "Cook's Assistant", component: 7333, varp: 'cookquest (29)' },
    sheep: { name: 'Sheep Shearer', component: 7344, varp: 'sheep (179)' },
    romeo: { name: 'Romeo & Juliet', component: 7343, varp: 'rjquest (144)' },
    rune: { name: 'Rune Mysteries', component: 7335, varp: 'runemysteries (63)' },
    doric: { name: "Doric's Quest", component: 7336, varp: 'doricquest (31)' },
    goblin: { name: 'Goblin Diplomacy', component: 7338, varp: 'goblinquest (62)' },
    witch: { name: "Witch's Potion", component: 7348, varp: 'hetty (67)' },
    ghost: { name: 'The Restless Ghost', component: 7337, varp: 'prieststart (107)' },
    ernest: { name: 'Ernest the Chicken', component: 7339, varp: 'haunted (32)' },
    prince: { name: 'Prince Ali Rescue', component: 7342, varp: 'princequest (273)' },
    imp: { name: 'Imp Catcher', component: 7340, varp: 'imp (160)' },
} as const;
export type QuestKey = keyof typeof QUESTS;

const JOURNAL_MODAL = 8134; // questjournal_scroll
const QUEST_SCROLL = 297;   // questscroll, the reward scroll on completion
const QUEST_DONE = /congratulations! quest complete!/i;

// ---------- small state readers ----------

export const st = (c: Ctx): BotWorldState => c.sdk.getState()!;
export const pos = (c: Ctx) => { const p = st(c).player!; return { x: p.worldX, z: p.worldZ, level: p.level }; };
export const where = (c: Ctx) => { const p = pos(c); return `(${p.x}, ${p.z}${p.level ? `, L${p.level}` : ''})`; };
export const hp = (c: Ctx) => `${st(c).player?.hp}/${st(c).player?.maxHp}`;
export const count = (c: Ctx, re: RegExp) => c.sdk.countInventoryItems(re);
export const has = (c: Ctx, re: RegExp, n = 1) => count(c, re) >= n;
export const coins = (c: Ctx) => count(c, /^coins$/i);
export const invText = (c: Ctx) => {
    const tally = new Map<string, number>();
    for (const i of st(c).inventory) tally.set(i.name, (tally.get(i.name) ?? 0) + i.count);
    return [...tally].map(([n, k]) => (k > 1 ? `${n} x${k}` : n)).join(', ') || '(empty)';
};
const cheb = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.max(Math.abs(a.x - b.x), Math.abs(a.z - b.z));

let T0 = Date.now();
export const log = (c: Ctx, m: string) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s t${st(c).tick}] ${m}`);

// ---------- run log: one JSON line per script run, for the per-quest table ----------

export type RunRecord = {
    bot: string; quest: string; step: string; startedAt: string; endedAt?: string; secs?: number;
    tick0: number; tick1?: number; hp0: string; hp1?: string; coins0: number; coins1?: number;
    from: string; to?: string; outcome?: string; notes: string[];
};

export function startRun(c: Ctx, quest: string, step: string): RunRecord {
    T0 = Date.now();
    const r: RunRecord = {
        bot: BOT, quest, step, startedAt: new Date().toISOString(),
        tick0: st(c).tick, hp0: hp(c), coins0: coins(c), from: where(c), notes: [],
    };
    log(c, `START ${quest}/${step} at ${r.from} hp=${r.hp0} coins=${r.coins0} inv: ${invText(c)}`);
    return r;
}

export function endRun(c: Ctx, r: RunRecord, outcome: string) {
    r.endedAt = new Date().toISOString();
    r.secs = Math.round((Date.parse(r.endedAt) - Date.parse(r.startedAt)) / 1000);
    r.tick1 = st(c).tick; r.hp1 = hp(c); r.coins1 = coins(c); r.to = where(c); r.outcome = outcome;
    appendFileSync(join(HERE, `runs-${BOT}.jsonl`), JSON.stringify(r) + '\n');
    log(c, `END ${r.quest}/${r.step}: ${outcome} in ${r.secs}s, ${r.tick1 - r.tick0} ticks, hp=${r.hp1} coins=${r.coins1} at ${r.to}`);
    log(c, `inv: ${invText(c)}`);
}

export const note = (c: Ctx, r: RunRecord, m: string) => { r.notes.push(m); log(c, `NOTE ${m}`); };

// ---------- progress flags: the script-level signal ----------

const PROGRESS_FILE = join(HERE, `progress-${BOT}.json`);
type ProgressFile = Record<string, Record<string, string>>; // quest -> step -> ISO time observed

export class Progress {
    private data: ProgressFile;
    constructor(private quest: QuestKey) {
        this.data = existsSync(PROGRESS_FILE) ? JSON.parse(readFileSync(PROGRESS_FILE, 'utf8')) : {};
        this.data[quest] ??= {};
    }
    has(step: string) { return step in this.data[this.quest]; }
    mark(step: string) {
        if (this.has(step)) return;
        this.data[this.quest][step] = new Date().toISOString();
        writeFileSync(PROGRESS_FILE, JSON.stringify(this.data, null, 1));
        console.log(`   progress: ${this.quest}.${step}`);
    }
    steps() { return Object.keys(this.data[this.quest]); }
}

/** True when the quest-complete message arrived after `tick0`. */
export function questCompleteSince(c: Ctx, tick0: number): boolean {
    return st(c).gameMessages.some(m => m.type === 0 && m.tick >= tick0 && QUEST_DONE.test(m.text));
}

/** Close the reward scroll if it is open; returns true when it was. */
export async function closeQuestScroll(c: Ctx): Promise<boolean> {
    const s = st(c);
    if (s.modalInterface === QUEST_SCROLL || s.interface.interfaceId === QUEST_SCROLL) {
        await c.bot.closeInterface();
        return true;
    }
    return false;
}

/**
 * Open the quest's journal page, screenshot it, close it. Returns the PNG path.
 * The screenshot also shows the chat box: never read other players' chat into
 * a decision.
 */
export async function journal(c: Ctx, quest: QuestKey, label = ''): Promise<string | null> {
    await c.bot.dismissBlockingUI();
    if (st(c).modalOpen) await c.bot.closeInterface();
    const r = await c.sdk.sendClickComponent(QUESTS[quest].component);
    if (!r.success) { log(c, `journal ${quest}: click failed ${r.message}`); return null; }
    try { await c.sdk.waitForCondition(s => s.modalInterface === JOURNAL_MODAL || s.interface.interfaceId === JOURNAL_MODAL, 6_000); }
    catch { log(c, `journal ${quest}: page did not open`); return null; }
    await c.sdk.waitForTicks(1); // let the canvas draw the text
    let file: string | null = null;
    try {
        const url = await c.sdk.sendScreenshot(10_000);
        const dir = process.env.JOURNAL_DIR ?? join(tmpdir(), `${BOT}-journal`);
        mkdirSync(dir, { recursive: true });
        file = join(dir, `${quest}${label ? '-' + label : ''}-t${st(c).tick}.png`);
        writeFileSync(file, Buffer.from(url.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
        log(c, `journal ${quest}: ${file}`);
    } catch (e) { log(c, `journal ${quest}: screenshot failed ${(e as Error).message}`); }
    await c.bot.closeInterface();
    return file;
}

// ---------- dialogue ----------

/** Dialogue lines seen so far, keyed so each line prints once. */
const seenDialog = new Set<string>();
function printNewDialog(c: Ctx, sink?: string[]) {
    const entries = [...st(c).recentDialogs].reverse();
    for (const d of entries) {
        const key = `${d.tick}|${d.interfaceId}|${d.text.join('/')}`;
        if (seenDialog.has(key)) continue;
        seenDialog.add(key);
        const line = d.text.join(' ');
        sink?.push(line);
        console.log(`      » ${line}`);
    }
}
/** Mark everything already in the dialogue history as seen. */
export function markDialogSeen(c: Ctx) {
    for (const d of st(c).recentDialogs) seenDialog.add(`${d.tick}|${d.interfaceId}|${d.text.join('/')}`);
}

/**
 * Walk an open conversation to its end. At each choice page the first
 * pattern in `choices` that matches an option is clicked; a choice page that
 * matches none stops the walk (returns ok=false with the options). Returns
 * every dialogue line seen, so callers can match evidence.
 */
export async function converse(c: Ctx, choices: RegExp[] = [], opts: { timeoutMs?: number; maxPages?: number } = {}) {
    const lines: string[] = [];
    const deadline = Date.now() + (opts.timeoutMs ?? 45_000);
    let closedTicks = 0, pages = 0, waitTicks = 0;
    const picked: string[] = [];
    while (Date.now() < deadline && pages < (opts.maxPages ?? 60)) {
        printNewDialog(c, lines);
        const d = st(c).dialog;
        if (!d.isOpen) {
            if (++closedTicks >= 3) break;
            await c.sdk.waitForTicks(1);
            continue;
        }
        closedTicks = 0;
        // isWaiting can stick on a page that still needs a click (seen on
        // Urhney's amulet page, 2026-10-19): after 4 ticks, click anyway.
        if (d.isWaiting && ++waitTicks <= 4) { await c.sdk.waitForTicks(1); continue; }
        waitTicks = 0;
        const opts2 = d.options;
        const isChoice = opts2.length > 1 || (opts2.length === 1 && !/continue/i.test(opts2[0].text));
        if (isChoice) {
            let hit: { text: string } | undefined;
            for (const re of choices) { hit = opts2.find(o => re.test(o.text)); if (hit) break; }
            if (!hit) {
                const avail = opts2.map(o => `"${o.text}"`).join(', ');
                console.log(`      ? no choice matched; options: ${avail}`);
                return { ok: false, lines, picked, options: opts2.map(o => o.text) };
            }
            console.log(`      > ${hit.text}`);
            picked.push(hit.text);
            const r = await c.sdk.clickDialogByText(new RegExp(`^${escapeRe(hit.text)}$`, 'i'));
            if (!r.success) await c.sdk.sendClickDialog(opts2.find(o => o.text === hit!.text)!.index);
        } else {
            await c.sdk.sendClickDialog(0);
        }
        pages++;
        // wait for the page to change, so one page never gets two clicks
        const page0 = d.pageId, sig0 = opts2.map(o => o.text).join('|');
        for (let i = 0; i < 6; i++) {
            await c.sdk.waitForTicks(1);
            const d2 = st(c).dialog;
            if (!d2.isOpen || d2.pageId !== page0 || d2.options.map(o => o.text).join('|') !== sig0) break;
        }
    }
    printNewDialog(c, lines);
    return { ok: true, lines, picked, options: [] as string[] };
}

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Find an NPC (scanning wider if needed), talk to it and walk the dialogue. */
export async function talk(c: Ctx, npc: RegExp, choices: RegExp[] = [], opts: { timeoutMs?: number } = {}) {
    await c.bot.dismissBlockingUI();
    markDialogSeen(c);
    const target = c.sdk.findNearbyNpc(npc, { reachable: true }) ?? c.sdk.findNearbyNpc(npc);
    if (!target) { log(c, `talk: no ${npc} nearby at ${where(c)}`); return { ok: false, lines: [] as string[], picked: [] as string[], options: [] as string[] }; }
    for (let attempt = 1; attempt <= 3; attempt++) {
        const cur = st(c).nearbyNpcs.find(n => n.index === target.index) ?? c.sdk.findNearbyNpc(npc);
        if (!cur) { log(c, `talk: ${npc} gone from view`); return { ok: false, lines: [] as string[], picked: [] as string[], options: [] as string[] }; }
        const t = await c.bot.talkTo(cur);
        if (t.success) break;
        log(c, `talkTo ${npc} attempt ${attempt}: ${t.message}`);
        // NPCs wander behind doors other players close: walkTo opens them
        if (/not reachable|cannot reach/i.test(t.message)) {
            const w = await c.bot.walkTo(cur.x, cur.z, 1, { timeout: 30_000 });
            log(c, `walkTo ${cur.name} (${cur.x}, ${cur.z}): ${w.success ? 'ok' : w.message}`);
        }
        if (attempt === 3) return { ok: false, lines: [] as string[], picked: [] as string[], options: [] as string[] };
        await c.sdk.waitForTicks(2);
    }
    return converse(c, choices, opts);
}

/** Use an item on an NPC, then walk whatever dialogue it opens. */
export async function useOnNpc(c: Ctx, item: RegExp, npc: RegExp, choices: RegExp[] = []) {
    await c.bot.dismissBlockingUI();
    markDialogSeen(c);
    const u = await c.bot.useItemOnNpc(item, npc);
    if (!u.success) log(c, `use ${item} on ${npc}: ${u.message}`);
    const conv = await converse(c, choices);
    return { ok: u.success, ...conv };
}

// ---------- movement ----------

/**
 * Walk to (x, z) on the current plane. Plans with the SDK's long-range
 * pathfinder, then clicks a point up to ~22 path tiles ahead at a time (one
 * click per leg, not one per turn point as bot.walkTo does), opening closed
 * doors on each leg first. Falls back to bot.walkTo for a leg that stalls.
 */
export async function travel(c: Ctx, x: number, z: number, tol = 2, opts: { maxLeg?: number; timeoutMs?: number } = {}): Promise<boolean> {
    const maxLeg = opts.maxLeg ?? 22;
    const deadline = Date.now() + (opts.timeoutMs ?? 600_000);
    const t0 = Date.now(), from = pos(c);
    let stalls = 0;
    await c.bot.dismissBlockingUI();
    // Basements sit at z + 6400 on plane 0. A surface-to-basement target is a
    // failed climb, not a walk: on 2026-10-19 the planner answered one with a
    // route north and the bot walked 800 tiles into the Wilderness.
    if (Math.abs(from.z - z) > 2000) { log(c, `travel: refusing (${x}, ${z}) from ${where(c)}: different layer, climb first`); return false; }
    // Never plan into the Wilderness (z >= 3520 west of x 3400) unless asked to.
    if (z >= 3520 && z < 4500 && !process.env.ALLOW_WILDERNESS) { log(c, `travel: refusing (${x}, ${z}): Wilderness`); return false; }
    while (Date.now() < deadline) {
        const p = pos(c);
        if (cheb(p, { x, z }) <= tol) {
            log(c, `travel (${x}, ${z}): arrived ${where(c)} ${cheb(from, p)} tiles in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
            return true;
        }
        const wps = findLongPath(p.level, p.x, p.z, x, z, 500);
        if (wps.length === 0) {
            // The SDK's static collision is wrong in places (Juliet's house, Varrock:
            // both findLongPath and walkTo report no path while the client walks
            // straight out). First a raw click toward the target, which the client
            // routes on live collision; then walkInto, which opens doors.
            const dx = x - p.x, dz = z - p.z, k = Math.min(1, 25 / Math.max(Math.abs(dx), Math.abs(dz), 1));
            const sx = p.x + Math.round(dx * k), sz = p.z + Math.round(dz * k);
            log(c, `travel: no planned path from ${where(c)} to (${x}, ${z}); raw click (${sx}, ${sz})`);
            await c.sdk.sendWalk(sx, sz, true);
            let last = `${p.x},${p.z}`, still = 0;
            while (still < 3) { await c.sdk.waitForTicks(1); const q = pos(c); const kq = `${q.x},${q.z}`; if (kq === last) still++; else { still = 0; last = kq; } }
            if (cheb(pos(c), p) >= 3) continue;
            if (!(await walkInto(c, x, z, Math.max(tol, 1)))) return false;
            continue;
        }
        // expand turn points into tiles, take up to maxLeg tiles
        const tiles: { x: number; z: number; level: number }[] = [];
        let cx = p.x, cz = p.z;
        for (const w of wps) {
            while ((cx !== w.x || cz !== w.z) && tiles.length < maxLeg) {
                cx += Math.sign(w.x - cx); cz += Math.sign(w.z - cz);
                tiles.push({ x: cx, z: cz, level: p.level });
            }
            if (tiles.length >= maxLeg) break;
        }
        if (p.z < 3520 && tiles.some(t => t.z >= 3520 && t.z < 4500) && !process.env.ALLOW_WILDERNESS) {
            log(c, `travel: path to (${x}, ${z}) enters the Wilderness; stopping`); return false;
        }
        const goal = tiles[tiles.length - 1];
        // doors on this leg: open any that is closed
        for (const door of findDoorsAlongPath([{ x: p.x, z: p.z, level: p.level }, ...tiles])) {
            const loc = st(c).nearbyLocs.find(l => l.x === door.x && l.z === door.z && l.optionsWithIndex.some(o => /^open$/i.test(o.text)));
            if (loc) {
                const o = await c.bot.openDoor(loc);
                log(c, `door ${loc.name} (${loc.x}, ${loc.z}): ${o.success ? 'opened' : o.message}`);
            }
        }
        const before = pos(c);
        await c.sdk.sendWalk(goal.x, goal.z, true);
        let last = `${before.x},${before.z}`, still = 0;
        while (still < 3 && Date.now() < deadline) {
            await c.sdk.waitForTicks(1);
            const q = pos(c);
            if (cheb(q, goal) <= 1 || cheb(q, { x, z }) <= tol) break;
            const k = `${q.x},${q.z}`;
            if (k === last) still++; else { still = 0; last = k; }
        }
        const after = pos(c);
        if (cheb(after, before) === 0) {
            stalls++;
            log(c, `travel: stalled at ${where(c)} toward (${goal.x}, ${goal.z}), stall ${stalls}`);
            if (stalls >= 2) {
                const w = await c.bot.walkTo(goal.x, goal.z, 1, { timeout: 60_000 });
                log(c, `travel: walkTo fallback ${w.success ? 'ok' : w.message} now ${where(c)}`);
                if (cheb(pos(c), after) === 0 && stalls >= 4) return false;
            }
        } else stalls = 0;
    }
    log(c, `travel: timed out at ${where(c)}`);
    return false;
}

/**
 * Get into a building whose closed doors the planners will not route through
 * (Juliet's house): walkTo, and when it stops short, open the closed door
 * nearest the target and try again.
 */
export async function walkInto(c: Ctx, x: number, z: number, tol = 1): Promise<boolean> {
    const tried = new Set<string>();
    for (let i = 0; i < 6; i++) {
        if (cheb(pos(c), { x, z }) <= tol) return true;
        const w = await c.bot.walkTo(x, z, tol, { timeout: 45_000 });
        if (w.success && cheb(pos(c), { x, z }) <= tol + 1) return true;
        const doors = (await c.sdk.scanNearbyLocs(15))
            .filter(l => /door|gate/i.test(l.name) && l.optionsWithIndex.some(o => /^open$/i.test(o.text)) && !tried.has(`${l.x},${l.z}`))
            .sort((a, b) => cheb(a, { x, z }) - cheb(b, { x, z }));
        const d = doors[0];
        if (!d) { log(c, `walkInto (${x}, ${z}): no closed door left to try`); return false; }
        tried.add(`${d.x},${d.z}`);
        const o = await c.bot.openDoor(d);
        log(c, `walkInto: door (${d.x}, ${d.z}) ${o.success ? 'opened' : o.message}`);
    }
    return cheb(pos(c), { x, z }) <= tol;
}

/** Walk a list of points in order (for routes that must avoid something). */
export async function route(c: Ctx, pts: [number, number][], tol = 2) {
    for (const [x, z] of pts) if (!(await travel(c, x, z, tol))) return false;
    return true;
}

/** Climb a staircase or ladder by option text and wait for the plane change. */
export async function climb(c: Ctx, loc: RegExp, option: RegExp): Promise<boolean> {
    const level0 = pos(c).level, z0 = pos(c).z;
    const moved = () => pos(c).level !== level0 || Math.abs(pos(c).z - z0) > 1000; // basements sit at z + 6400 on plane 0
    const r = await c.bot.interactLoc(loc, option);
    if (!r.success) log(c, `climb ${loc} ${option}: ${r.message}`);
    try { await c.sdk.waitForCondition(() => moved(), 8_000); }
    catch { /* checked below */ }
    const ok = moved();
    log(c, `climb ${option}: ${ok ? 'now' : 'still'} ${where(c)}`);
    return ok;
}

/** Lumbridge castle courtyard: the spot to leave the bot idle. */
export const COURTYARD = { x: 3222, z: 3219 };
export async function park(c: Ctx) {
    if (pos(c).level !== 0) { log(c, `park: on plane ${pos(c).level}, not walking`); return false; }
    return travel(c, COURTYARD.x, COURTYARD.z, 2);
}

// ---------- items ----------

export async function pickup(c: Ctx, item: RegExp, tries = 3): Promise<boolean> {
    for (let i = 0; i < tries; i++) {
        const g = c.sdk.findGroundItem(item) ?? (await c.sdk.scanFindGroundItem(item, 15));
        if (!g) { await c.sdk.waitForTicks(2); continue; }
        const n0 = count(c, item);
        const r = await c.bot.pickupItem(g);
        if (r.success || count(c, item) > n0) return true;
        log(c, `pickup ${item}: ${r.message}`);
    }
    return false;
}

/** Buy from a shop opened via its keeper. */
export async function buy(c: Ctx, keeper: RegExp, item: RegExp, n: number): Promise<number> {
    const o = await c.bot.openShop(keeper);
    if (!o.success) { log(c, `openShop ${keeper}: ${o.message}`); return 0; }
    const n0 = count(c, item);
    const b = await c.bot.buyFromShop(item, n);
    log(c, `buy ${item} x${n}: ${b.message}`);
    await c.bot.closeShop();
    return count(c, item) - n0;
}

/** HP guard: eat if below `eatAt`; returns false if HP is below `fleeAt` with no food. */
export async function hpGuard(c: Ctx, eatAt = 6, fleeAt = 4): Promise<boolean> {
    const h = st(c).player!.hp;
    if (h >= eatAt) return true;
    const food = c.sdk.findInventoryItem(/^(shrimps|bread|cake|meat|cooked meat|kebab|trout|anchovies|cheese|tomato)$/i);
    if (food) { const e = await c.bot.eatFood(food); log(c, `ate ${food.name}: ${e.message}`); return true; }
    return h >= fleeAt;
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export type { NearbyLoc, NearbyNpc };
