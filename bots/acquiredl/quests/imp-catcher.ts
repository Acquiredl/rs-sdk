// Imp Catcher (server: quests/quest_imp; varp imp 160: 1 started, 2 done).
// Wizard Mizgog (3103, 3163, plane 2 of the Wizard Tower) wants one black,
// red, white and yellow bead, all at once. Imps (lvl 2, HP 8, never
// aggressive) drop each colour 5/128 (3.9%), plus ashes always; about 53
// kills for all four on average. Imps teleport up to 20 tiles on 10% of hits
// and on a timer. Beads are not quest-gated: kill imps whenever one is near.
// Hunting: fight.ts acquiredl imp "^imp$" 99 "bead|^ashes$" x z with
//   UNTIL_ALL="^black bead$,^red bead$,^white bead$,^yellow bead$"
// Spawns (wander 25): Lumbridge (3217, 3226) (3214, 3281) (3240, 3307) (3299, 3273);
// Draynor (3073, 3250); Falador (2951, 3360) (2947, 3329), farm cluster
// (3009-3015, 3307-3314), (2941, 3236); Varrock (3177, 3405) (3238, 3390)
// (3246, 3458), north cluster (3213-3261, 3502-3514); (3205, 3355).
// Usage: bun bots/acquiredl/quests/imp-catcher.ts acquiredl [start|finish]
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, climb, has, pos, st, journal, questCompleteSince, closeQuestScroll, type Ctx } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'auto';
const BEADS = [/^black bead$/i, /^red bead$/i, /^white bead$/i, /^yellow bead$/i];

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('imp');
    const step = STEP !== 'auto' ? STEP : !p.has('started') ? 'start' : 'finish';
    const r = startRun(c, 'imp', step);
    note(c, r, `beads held: ${BEADS.filter(b => has(c, b)).length}/4`);
    if (step === 'finish' && !BEADS.every(b => has(c, b))) { endRun(c, r, 'not all beads'); return; }
    await toMizgog(c);
    const tick0 = st(c).tick;
    const t = await talk(c, /^wizard mizgog$/i, [/^give me a quest!$/i, /^give me a quest please\.$/i]);
    if (t.lines.some(l => /bead/i.test(l))) p.mark('started');
    await sdk.waitForTicks(3);
    if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
    await fromTop(c);
    await journal(c, 'imp', step);
    endRun(c, r, (step === 'start' ? p.has('started') : p.has('complete')) ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });

/** Tower door (3109, 3166) -> diagonal door (3107, 3162) -> Staircase (3103, 3159) up twice. */
export async function toMizgog(c: Ctx) {
    if (pos(c).z > 9000) { await travel(c, 3104, 9575, 1); await climb(c, /^ladder$/i, /^climb-up$/i); }
    if (pos(c).level === 0) { await travel(c, 3104, 3160, 1); }
    while (pos(c).level < 2) if (!(await climb(c, /^staircase$/i, /^climb-up$/i))) break;
    await travel(c, 3103, 3162, 2);
}
async function fromTop(c: Ctx) {
    while (pos(c).level > 0) { await travel(c, 3104, 3160, 2); if (!(await climb(c, /^staircase$/i, /^climb-down$/i))) break; }
}
