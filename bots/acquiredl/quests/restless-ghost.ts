// The Restless Ghost (server: quests/quest_priest; varp prieststart 107).
// Steps: aereck (Lumbridge church) -> urhney (Ghostspeak amulet, shack south of
// the castle) -> ghost (wear amulet, open the coffin, talk to the ghost that
// appears) -> skull (Wizard Tower basement floor item; taking it spawns a
// lvl 13 skeleton that attacks at once, so leave up the ladder) -> finish
// (open coffin, use the skull on it). Reward 28,125 Prayer XP at this
// server's 25x rate, which lifts combat level: do it early.
// Usage: bun bots/acquiredl/quests/restless-ghost.ts acquiredl [step]
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, climb, has, pos, st, log, pickup, journal, questCompleteSince, closeQuestScroll, markDialogSeen, converse, type Ctx } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'auto';
const AMULET = /^ghostspeak amulet$/i;

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('ghost');
    if (has(c, AMULET) || sdk.findEquipmentItem(AMULET)) p.mark('amulet');
    const step = STEP !== 'auto' ? STEP
        : !p.has('started') ? 'aereck'
        : !p.has('amulet') ? 'urhney'
        : !p.has('told') ? 'ghost'
        : !has(c, /^skull$/i) && !p.has('complete') ? 'skull'
        : 'finish';
    const r = startRun(c, 'ghost', step);
    let ok = false;
    if (sdk.findInventoryItem(/^bronze sword$/i)) await bot.equipItem(/^bronze sword$/i);

    if (step === 'aereck') {
        await travel(c, P.church.x, P.church.z, 3);
        const t = await talk(c, /^father aereck$/i, [/^i'm looking for a quest!$/i]);
        if (t.lines.some(l => /father urhney|ghost/i.test(l))) { p.mark('started'); ok = true; }
        if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
    } else if (step === 'urhney') {
        await travel(c, P.urhney.x, P.urhney.z, 3);
        const t = await talk(c, /^father urhney$/i, [/^father aereck sent me to talk to you\.$/i, /^he's got a ghost haunting his graveyard\.$/i, /^i've lost the amulet\.$/i]);
        if (has(c, AMULET)) { p.mark('amulet'); ok = true; }
        if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
    } else if (step === 'ghost') {
        if (has(c, AMULET)) { const e = await bot.equipItem(AMULET); log(c, `wear amulet: ${e.message}`); }
        await travel(c, P.coffin.x, P.coffin.z, 2);
        await openCoffin(c);
        let ghost = null;
        for (let i = 0; i < 10 && !ghost; i++) { await sdk.waitForTicks(1); ghost = sdk.findNearbyNpc(/^restless ghost$/i); }
        if (!ghost) { note(c, r, 'no ghost appeared after opening the coffin'); }
        else {
            const t = await talk(c, /^restless ghost$/i, [/^yep, now tell me what the problem is\.$/i, /^yes, ok\. do you know why you're a ghost\?$/i, /^wow, this amulet works!$/i, /^yep, clever aren't i\?$/i]);
            if (t.lines.some(l => /skull|wizard/i.test(l))) { p.mark('told'); ok = true; }
            if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
        }
    } else if (step === 'skull') {
        if (pos(c).z < 9000) {
            await travel(c, P.towerLadderDown.x + 1, P.towerLadderDown.z + 1, 2);
            await climb(c, /^ladder$/i, /^climb-down$/i);
        }
        await travel(c, P.skull.x, P.skull.z + 1, 1);
        const got = await pickup(c, /^skull$/i);
        log(c, `skull: ${got ? 'taken' : 'not taken'} hp=${st(c).player!.hp}`);
        if (got) { p.mark('skull'); ok = true; }
        // the skeleton (lvl 13) attacks at once: leave by the ladder at (3103, 9576)
        await travel(c, 3104, 9575, 1);
        await climb(c, /^ladder$/i, /^climb-up$/i);
    } else if (step === 'finish') {
        await travel(c, P.coffin.x, P.coffin.z, 2);
        await openCoffin(c);
        const tick0 = st(c).tick;
        markDialogSeen(c);
        const coffin = sdk.findNearbyLoc(/^coffin$/i);
        const u = coffin ? await bot.useItemOnLoc(/^skull$/i, coffin) : { success: false, message: 'no coffin' };
        log(c, `skull on coffin: ${u.message}`);
        await converse(c, []);
        await sdk.waitForTicks(3);
        if (questCompleteSince(c, tick0) || !has(c, /^skull$/i)) { await closeQuestScroll(c); p.mark('complete'); ok = true; }
    }
    await journal(c, 'ghost', step);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });

async function openCoffin(c: Ctx) {
    const coffin = c.sdk.findNearbyLoc(/^coffin$/i);
    if (!coffin) { log(c, 'no coffin in view'); return; }
    const opts = coffin.optionsWithIndex.map(o => o.text).join('/');
    if (coffin.optionsWithIndex.some(o => /^open$/i.test(o.text))) {
        const o = await c.bot.interactLoc(coffin, /^open$/i);
        log(c, `coffin (${opts}) open: ${o.message}`);
    } else if (coffin.optionsWithIndex.some(o => /^search$/i.test(o.text))) {
        const o = await c.bot.interactLoc(coffin, /^search$/i); // already open: searching also calls the ghost
        log(c, `coffin (${opts}) search: ${o.message}`);
    }
    await c.sdk.waitForTicks(2);
}
