// Rune Mysteries (server: quests/quest_runemysteries; varp runemysteries 63).
// Steps: duke (Air talisman, Lumbridge castle plane 1) -> sedridor (talisman for
// the Research package, Wizard Tower basement) -> aubury (package, then talk
// again for the Notes, Varrock rune shop) -> finish (Notes to Sedridor).
// No items, no coins, no levels. Each NPC replaces a lost item.
// Usage: bun bots/acquiredl/quests/rune-mysteries.ts acquiredl [step]
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, climb, has, pos, journal, questCompleteSince, closeQuestScroll, type Ctx } from './lib';
import { P, castleTo } from './places';

const STEP = process.argv[3] ?? 'auto';

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('rune');
    const step = STEP !== 'auto' ? STEP
        : !p.has('talisman') && !has(c, /^air talisman$/i) ? 'duke'
        : !p.has('package') && !has(c, /^research package$/i) ? 'sedridor'
        : !p.has('notes') && !has(c, /^notes$/i) ? 'aubury'
        : 'finish';
    const r = startRun(c, 'rune', step);
    let ok = false;

    if (step === 'duke') {
        if (!(await castleTo(c, 1))) { endRun(c, r, 'stairs failed'); return; }
        await travel(c, P.duke.x, P.duke.z, 3);
        const t = await talk(c, /^duke horacio$/i, [/^have you any quests for me\?$/i, /^sure, no problem\.$/i]);
        if (has(c, /^air talisman$/i)) { p.mark('talisman'); ok = true; }
        if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
        await castleTo(c, 0);
    } else if (step === 'sedridor' || step === 'finish') {
        await toSedridor(c);
        const tick0 = sdk.getState()!.tick;
        const t = await talk(c, /^sedridor$/i, [/^i'm looking for the head wizard\.$/i, /^ok, here you are\.$/i, /^yes, certainly\.$/i], { timeoutMs: 90_000 });
        if (step === 'sedridor' && has(c, /^research package$/i)) { p.mark('package'); ok = true; }
        if (step === 'finish' && (questCompleteSince(c, tick0) || !has(c, /^notes$/i))) {
            await sdk.waitForTicks(2); await closeQuestScroll(c); p.mark('complete'); ok = true;
        }
        if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
    } else if (step === 'aubury') {
        await travel(c, P.aubury.x, P.aubury.z, 3);
        const t1 = await talk(c, /^aubury$/i, [/^i have been sent here with a package for you\.$/i]);
        if (!has(c, /^research package$/i)) p.mark('gave-package');
        const t2 = await talk(c, /^aubury$/i, []);
        if (has(c, /^notes$/i)) { p.mark('notes'); ok = true; }
        if (!t1.ok || !t2.ok) note(c, r, `dialogue stopped: ${[...t1.options, ...t2.options].join(' | ')}`);
    }
    await journal(c, 'rune', step);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });

/** Into the Wizard Tower basement next to Sedridor. */
export async function toSedridor(c: Ctx) {
    if (pos(c).z > 9000) { await travel(c, P.sedridor.x, P.sedridor.z, 3); return; }
    await travel(c, P.towerLadderDown.x + 1, P.towerLadderDown.z + 1, 2);
    await climb(c, /^ladder$/i, /^climb-down$/i);
    await travel(c, P.sedridor.x, P.sedridor.z, 3);
}
