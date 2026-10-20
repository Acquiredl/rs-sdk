// Romeo & Juliet (server: quests/quest_romeojuliet; varp rjquest 144: 20/30/40/50/60/100).
// Juliet can start it: "I guess I could find him." gives the Message and sets
// stage 20, skipping the first Romeo visit. Then Romeo -> Father Lawrence ->
// Apothecary (talk; talk again holding Cadava berries for the potion) ->
// Juliet (takes the potion) -> Romeo. No menus after Juliet's first.
// Cadava berries are ground items SE of Varrock (3266, 3361) (3273, 3375)
// (3277, 3370), about 60 s respawn, pickable before the quest. Dark wizards
// (stone circle x 3223-3232, z 3363-3374) attack a low-level bot: approach
// the berries from the east.
// Usage: bun bots/acquiredl/quests/romeo-and-juliet.ts acquiredl [step]
//   steps: berries juliet romeo lawrence apothecary potion juliet2 romeo2 (auto runs them in order)
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, climb, has, pos, st, log, pickup, journal, questCompleteSince, closeQuestScroll, walkInto, type Ctx } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'auto';
const CADAVA = /^cadava berries$/i;
const ORDER = ['berries', 'juliet', 'romeo', 'lawrence', 'apothecary', 'potion', 'juliet2', 'romeo2'];

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('romeo');
    const steps = STEP === 'auto' ? ORDER.filter(s => !p.has(s)) : [STEP];
    for (const step of steps) {
        const r = startRun(c, 'romeo', step);
        const ok = await run(c, p, step);
        if (ok) p.mark(step);
        await journal(c, 'romeo', step);
        endRun(c, r, ok ? 'ok' : 'not confirmed');
        if (!ok) break;
    }
}, { timeout: 1_800_000, printState: false });

async function run(c: Ctx, p: Progress, step: string): Promise<boolean> {
    switch (step) {
        case 'berries': {
            if (has(c, CADAVA)) return true;
            await travel(c, P.berries.x, P.berries.z, 3);
            for (let i = 0; i < 6 && !has(c, CADAVA); i++) { await pickup(c, CADAVA, 1); if (!has(c, CADAVA)) await c.sdk.waitForTicks(10); }
            return has(c, CADAVA);
        }
        case 'juliet': case 'juliet2': {
            await toJuliet(c);
            const t = await talk(c, /^juliet$/i, [/^i guess i could find him\.$/i]);
            const ok = step === 'juliet' ? has(c, /^message$/i) : !has(c, /^cadava potion$/i);
            await fromJuliet(c);
            return ok && t.lines.length > 0;
        }
        case 'romeo': case 'romeo2': {
            await travel(c, P.varrockSquare.x, P.varrockSquare.z, 4);
            const tick0 = st(c).tick;
            const t = await talk(c, /^romeo$/i, [/^can i help find her for you\?$/i]);
            if (step === 'romeo2') { await c.sdk.waitForTicks(3); if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); return true; } return false; }
            return t.lines.some(l => /father lawrence/i.test(l)) || !has(c, /^message$/i);
        }
        case 'lawrence': {
            await travel(c, P.lawrence.x, P.lawrence.z, 3);
            const t = await talk(c, /^father lawrence$/i, []);
            return t.lines.some(l => /apothecary|potion to make her appear dead/i.test(l));
        }
        case 'apothecary': case 'potion': {
            await travel(c, P.apothecary.x, P.apothecary.z, 2);
            const t = await talk(c, /^apothecary$/i, []);
            return step === 'apothecary' ? t.lines.some(l => /cadava/i.test(l)) || has(c, /^cadava potion$/i) : has(c, /^cadava potion$/i);
        }
    }
    log(c, `unknown step ${step}`);
    return false;
}

/** Juliet is on plane 1 of the house west of Varrock: Staircase (3156, 3435), doors on both floors. */
async function toJuliet(c: Ctx) {
    if (pos(c).level === 1) return;
    // The house's doors (3155, 3428) (3160, 3432) (3155, 3433) spawn closed and the
    // long-range planner finds no way in. Iteration 1: walkInto tried those
    // five doors first (~165 s per visit) before the north door (3160, 3440),
    // the one that works, so open that one first. Untested as written.
    await travel(c, 3160, 3442, 1);
    const north = (await c.sdk.scanNearbyLocs(5)).find(l => l.x === 3160 && l.z === 3440 && l.optionsWithIndex.some(o => /^open$/i.test(o.text)));
    if (north) { const o = await c.bot.openDoor(north); log(c, `Juliet north door: ${o.success ? 'opened' : o.message}`); }
    const w = await walkInto(c, P.julietStairs.x, P.julietStairs.z - 1, 1);
    log(c, `to Juliet's stairs: ${w ? 'ok' : 'failed'} at (${pos(c).x}, ${pos(c).z})`);
    await climb(c, /^staircase$/i, /^climb-up$/i);
    await walkInto(c, 3158, 3426, 2);
}
async function fromJuliet(c: Ctx) {
    if (pos(c).level === 0) return;
    await walkInto(c, 3156, 3434, 2);
    await climb(c, /^staircase$/i, /^climb-down$/i);
}
