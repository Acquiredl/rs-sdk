// Ernest the Chicken (server: quests/quest_haunted; varp haunted 32: 1 Veronica, 2 Oddenstein, 3 done).
// No items to bring, no coins: every part is in Draynor Manor. Reward 300 gp.
// Steps (run in order, or name one):
//   veronica  start at the manor gate (3110, 3330)
//   enter     around the grounds to the BACK door (3123, 3360), which works both
//             ways; the front Large door only opens from outside and traps you
//   oddenstein  plane 2 via the central Staircase (3108, 3363) and the west
//             Staircase (3104, 3362, plane 1): "I'm looking for a guy called Ernest."
//   spade     ground item, storeroom (3120, 3359)
//   poison    ground item (3097, 3366), store off the kitchen
//   fishfood  ground item (3108, 3356, plane 1)
//   gauge     outside: poisoned fish food on the Fountain (3087, 3334), then Search
//   key       outside: Spade on the Compost heap (3084, 3360) ("Search" refuses)
//   oilcan    Bookcase (3097, 3358) searched from the east -> Ladder (3092, 3362)
//             down -> 6-lever puzzle -> Oil can (3092, 9755)
//   tube      Key on the closet Door (3107, 3367) both ways; a lvl 25 Skeleton
//             stands next to the Rubber tube (3111, 3367): bring food
//   finish    Oddenstein with all three parts
// Dangers outside: "Tree" NPCs (attack at any level, hit 2-3) at x 3103-3122,
// z 3335-3348; walking x 3109 (x 3110 for z 3345-3347) passes them; vines
// (1 damage per 5 ticks) at x 3112-3121, z 3336-3345.
// Usage: bun bots/acquiredl/quests/ernest-the-chicken.ts acquiredl <step>
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, climb, has, pos, st, log, pickup, journal, questCompleteSince, closeQuestScroll, hpGuard, markDialogSeen, converse, walkInto, type Ctx, type RunRecord } from './lib';

const STEP = process.argv[3] ?? 'veronica';

const GATE = { x: 3110, z: 3331 };
// outside path around the manor to the back door, clear of the trees and vines
const TO_BACK_DOOR: [number, number][] = [[3109, 3338], [3109, 3344], [3110, 3347], [3109, 3352], [3118, 3352], [3128, 3352], [3128, 3362], [3123, 3361]];

async function door(c: Ctx, x: number, z: number) {
    const d = (await c.sdk.scanNearbyLocs(8)).find(l => l.x === x && l.z === z && /door/i.test(l.name) && l.optionsWithIndex.some(o => /^open$/i.test(o.text)));
    if (d) { const o = await c.bot.openDoor(d); log(c, `door (${x}, ${z}): ${o.success ? 'opened' : o.message}`); }
}
const inside = (c: Ctx) => { const p = pos(c); return p.x >= 3097 && p.x <= 3127 && p.z >= 3354 && p.z <= 3373; };

async function walkPts(c: Ctx, pts: [number, number][]) {
    for (const [x, z] of pts) {
        await hpGuard(c, 7, 1);
        await c.sdk.sendWalk(x, z, true);
        let last = '', still = 0;
        for (let i = 0; i < 40 && still < 3; i++) {
            await c.sdk.waitForTicks(1);
            const k = `${pos(c).x},${pos(c).z}`;
            if (k === last) still++; else { still = 0; last = k; }
            if (Math.max(Math.abs(pos(c).x - x), Math.abs(pos(c).z - z)) <= 1) break;
        }
    }
}

const STEPS: Record<string, (c: Ctx, r: RunRecord, p: Progress) => Promise<boolean>> = {
    async veronica(c) {
        await travel(c, GATE.x, GATE.z - 2, 2);
        const t = await talk(c, /^veronica$/i, [/^aha, sounds like a quest\. i'll help\.$/i]);
        return t.lines.some(l => /ernest|manor|went in/i.test(l)) || t.picked.length > 0;
    },
    async enter(c) {
        if (inside(c)) return true;
        await travel(c, GATE.x, GATE.z - 1, 1);
        await walkPts(c, TO_BACK_DOOR);
        await door(c, 3123, 3360);
        await walkPts(c, [[3123, 3359]]);
        log(c, `inside=${inside(c)} at (${pos(c).x}, ${pos(c).z}) hp=${st(c).player!.hp}`);
        return inside(c);
    },
    async spade(c) {
        if (has(c, /^spade$/i)) return true;
        await walkInto(c, 3120, 3358, 1);
        return pickup(c, /^spade$/i);
    },
    async poison(c) {
        if (has(c, /^poison$/i) || has(c, /^poisoned fish food$/i)) return true;
        await walkInto(c, 3099, 3368, 1);   // north of the store door (3099, 3366)
        await door(c, 3099, 3366);
        await walkInto(c, 3097, 3366, 1);
        return pickup(c, /^poison$/i);
    },
    async oddenstein(c, r, p) {
        await toTop(c);
        const tick0 = st(c).tick;
        const t = await talk(c, /^professor oddenstein$/i, [/^i'm looking for a guy called ernest\.$/i, /^change him back this instant!$/i]);
        if (t.lines.some(l => /oil can|pressure gauge|rubber tub|run off with some vital bits/i.test(l))) p.mark('told');
        await c.sdk.waitForTicks(3);
        if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
        return p.has('told') || p.has('complete');
    },
    async fishfood(c) {
        if (has(c, /fish food$/i)) return true;
        if (pos(c).level !== 1) await toPlane(c, 1);
        await walkInto(c, 3116, 3362, 1, );  // north of the Door (3116, 3361, plane 1)
        await door(c, 3116, 3361);
        await walkInto(c, 3108, 3357, 1);
        const ok = await pickup(c, /^fish food$/i);
        if (ok && has(c, /^poison$/i)) await mix(c);
        return ok;
    },
    async gauge(c) {
        if (has(c, /^pressure gauge$/i)) return true;
        if (!has(c, /^poisoned fish food$/i) && has(c, /^poison$/i) && has(c, /^fish food$/i)) await mix(c);
        await leave(c);
        await travel(c, 3089, 3335, 1);
        const fountain = c.sdk.findNearbyLoc(/^fountain$/i);
        if (!fountain) return false;
        if (has(c, /^poisoned fish food$/i)) {
            const u = await c.bot.useItemOnLoc(/^poisoned fish food$/i, fountain);
            log(c, `fish food on fountain: ${u.message}`);
            await converse(c, []);
        }
        const s = await c.bot.interactLoc(fountain, /^search$/i);
        log(c, `search fountain: ${s.message}`);
        await converse(c, []);
        // the gauge arrives a few ticks after the search message
        try { await c.sdk.waitForCondition(s => s.inventory.some(i => /^pressure gauge$/i.test(i.name)), 6_000); } catch { /* checked */ }
        return has(c, /^pressure gauge$/i);
    },
    async key(c) {
        if (has(c, /^key$/i)) return true;
        if (inside(c)) await leave(c);
        await travel(c, 3086, 3361, 1);
        const heap = c.sdk.findNearbyLoc(/^compost heap$/i);
        if (!heap || !has(c, /^spade$/i)) return false;
        markDialogSeen(c);
        const u = await c.bot.useItemOnLoc(/^spade$/i, heap);
        log(c, `spade on heap: ${u.message}`);
        await converse(c, []);
        await c.sdk.waitForTicks(2);
        return has(c, /^key$/i);
    },
    async tube(c) {
        if (has(c, /^rubber tube$/i)) return true;
        if (!inside(c)) await STEPS.enter(c, null as never, null as never);
        await walkInto(c, 3106, 3367, 0);
        const d = (await c.sdk.scanNearbyLocs(5)).find(l => l.x === 3107 && l.z === 3367 && /door/i.test(l.name));
        if (!d || !has(c, /^key$/i)) return false;
        await hpGuard(c, 9, 1);
        const u = await c.bot.useItemOnLoc(/^key$/i, d);
        log(c, `key on closet door: ${u.message} now (${pos(c).x}, ${pos(c).z})`);
        await hpGuard(c, 7, 1);
        const got = await pickup(c, /^rubber tube$/i);
        await hpGuard(c, 7, 1);
        const d2 = (await c.sdk.scanNearbyLocs(5)).find(l => /door/i.test(l.name) && Math.abs(l.x - 3107) <= 1 && Math.abs(l.z - 3367) <= 1);
        if (d2) { const u2 = await c.bot.useItemOnLoc(/^key$/i, d2); log(c, `key out: ${u2.message} now (${pos(c).x}, ${pos(c).z})`); }
        return got;
    },
    async oilcan(c) { return oilcan(c); },
    async finish(c, r, p) { return STEPS.oddenstein(c, r, p); },
};

async function mix(c: Ctx) {
    const a = c.sdk.findInventoryItem(/^poison$/i), b = c.sdk.findInventoryItem(/^fish food$/i);
    if (!a || !b) return;
    await c.sdk.sendUseItemOnItem(a.slot, b.slot);
    await c.sdk.waitForTicks(2);
    log(c, `poisoned fish food: ${has(c, /^poisoned fish food$/i)}`);
}

/** Up the central Staircase (3108, 3363) to plane 1. */
async function toPlane(c: Ctx, level: number) {
    for (let i = 0; i < 3 && pos(c).level < level; i++) {
        if (pos(c).level === 0) { await walkInto(c, 3108, 3362, 1); await climb(c, /^staircase$/i, /^walk-up$/i); }
        else if (pos(c).level === 1) { await walkInto(c, 3105, 3362, 1); await climb(c, /^staircase$/i, /^climb-up$/i); }
    }
    while (pos(c).level > level) {
        await climb(c, /^staircase$/i, /^(walk-down|climb-down)$/i);
        if (pos(c).level > level) break;
    }
}
async function toTop(c: Ctx) {
    if (!inside(c) && pos(c).level === 0) await STEPS.enter(c, null as never, null as never);
    await toPlane(c, 2);
    await door(c, 3108, 3364);
    await walkInto(c, 3109, 3366, 1);
}
/** Out through the back door; it opens from both sides. */
async function leave(c: Ctx) {
    while (pos(c).level > 0) {
        const before = pos(c).level;
        if (pos(c).level === 2) await walkInto(c, 3105, 3364, 1);
        else await walkInto(c, 3107, 3363, 1);
        await climb(c, /^staircase$/i, /^(climb-down|walk-down)$/i);
        if (pos(c).level === before) break;
    }
    if (!inside(c)) return;
    await walkInto(c, 3123, 3359, 0);
    await door(c, 3123, 3360);
    await walkPts(c, [[3123, 3362], [3128, 3362], [3128, 3352]]);
}

// Lever basement, from the server's door rules (BFS solution, side notes).
async function lever(c: Ctx, x: number, z: number) {
    const l = (await c.sdk.scanNearbyLocs(12)).find(v => v.x === x && v.z === z && /lever/i.test(v.name));
    if (!l) { log(c, `no lever at (${x}, ${z})`); return; }
    const o = await c.bot.interactLoc(l, /^pull$/i);
    await c.sdk.waitForTicks(2);
    await converse(c, []);
    log(c, `lever (${x}, ${z}): ${o.message}`);
}
async function bdoor(c: Ctx, x: number, z: number) {
    const d = (await c.sdk.scanNearbyLocs(12)).find(v => v.x === x && v.z === z && /door/i.test(v.name));
    if (!d) { log(c, `no basement door at (${x}, ${z})`); return; }
    const before = `${pos(c).x},${pos(c).z}`;
    const o = await c.bot.interactLoc(d, /^open$/i);
    await c.sdk.waitForTicks(3);
    await converse(c, []);
    log(c, `door (${x}, ${z}): ${o.message}; ${before} -> ${pos(c).x},${pos(c).z}`);
}
async function oilcan(c: Ctx): Promise<boolean> {
    if (has(c, /^oil can$/i)) return true;
    if (pos(c).z < 9000) {
        if (!inside(c)) await STEPS.enter(c, null as never, null as never);
        while (pos(c).level > 0) await climb(c, /^staircase$/i, /^(walk-down|climb-down)$/i);
        await walkInto(c, 3098, 3358, 0);
        const bc = (await c.sdk.scanNearbyLocs(5)).find(l => /bookcase/i.test(l.name) && l.x === 3097 && (l.z === 3358 || l.z === 3359));
        if (!bc) { log(c, 'no bookcase'); return false; }
        await c.bot.interactLoc(bc, /^search$/i);
        await c.sdk.waitForTicks(3);
        log(c, `bookcase: now (${pos(c).x}, ${pos(c).z})`);
        await climb(c, /^ladder$/i, /^climb-down$/i);
        if (pos(c).z < 9000) return false;
    }
    // A (3108, 9745) B (3118, 9752) C (3112, 9760) D (3108, 9767) E (3097, 9767) F (3096, 9765)
    await lever(c, 3108, 9745); await lever(c, 3118, 9752);        // A down, B down
    await bdoor(c, 3108, 9758); await lever(c, 3108, 9767);        // east room, D down
    await bdoor(c, 3105, 9760); await bdoor(c, 3102, 9758);        // centre, back to start
    await lever(c, 3108, 9745); await lever(c, 3118, 9752);        // A up, B up
    await bdoor(c, 3102, 9758); await bdoor(c, 3100, 9760); await bdoor(c, 3097, 9763); // to NW room
    await lever(c, 3097, 9767); await lever(c, 3096, 9765);        // E down, F down
    await bdoor(c, 3100, 9765); await bdoor(c, 3105, 9765);        // to east room
    await lever(c, 3112, 9760);                                     // C down
    await bdoor(c, 3105, 9765); await bdoor(c, 3100, 9765);        // to NW room
    await lever(c, 3097, 9767);                                     // E up
    await bdoor(c, 3100, 9765); await bdoor(c, 3102, 9763); await bdoor(c, 3102, 9758); // to start
    await bdoor(c, 3100, 9755);                                     // SW room
    const got = await pickup(c, /^oil can$/i);
    await bdoor(c, 3100, 9755);
    await walkInto(c, 3117, 9755, 1);
    await climb(c, /^ladder$/i, /^climb-up$/i);
    const lv = (await c.sdk.scanNearbyLocs(5)).find(l => /lever/i.test(l.name));
    if (lv) { await c.bot.interactLoc(lv, /^pull$/i); await c.sdk.waitForTicks(3); }
    log(c, `out of the secret room: (${pos(c).x}, ${pos(c).z})`);
    return got;
}

// Runs last: the step table above must exist before the runner calls into it.
await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('ernest');
    for (const re of [/^bronze sword$/i, /^ghostspeak amulet$/i]) if (sdk.findInventoryItem(re)) await bot.equipItem(re);
    const r = startRun(c, 'ernest', STEP);
    let ok = false;
    try { ok = await STEPS[STEP](c, r, p); }
    catch (e) { note(c, r, `error: ${(e as Error).message}`); }
    if (ok) p.mark(STEP);
    await journal(c, 'ernest', STEP);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 1_200_000, printState: false });
