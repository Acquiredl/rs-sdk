// Cook's Assistant (server: quests/quest_cook, area_lumbridge/cook.rs2; varp cookquest 29).
// The Cook takes milk, egg and pot of flour in one hand-in, all in the
// inventory together, and only once the quest is started. Items can be
// gathered first. Steps: start, flour, egg, milk, finish ('gather' = the three).
// Usage: bun bots/acquiredl/quests/cooks-assistant.ts acquiredl [step]
// Needs: a pot and a bucket (starter kit, or 1 + 2 gp at the general store).
// FLOURS=2 makes a second pot of flour (Prince Ali's skin paste) if a second
// pot is held. Reward: 7,500 Cooking XP at this server's 25x.
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, climb, has, count, pos, st, log, pickup, journal, questCompleteSince, closeQuestScroll, type Ctx } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'auto';
const FLOURS = Number(process.env.FLOURS ?? 1);
const FLOUR = /^pot of flour$/i, EGG = /^egg$/i, MILK = /^bucket of milk$/i;

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('cook');
    const step = STEP !== 'auto' ? STEP
        : !p.has('started') ? 'start'
        : !(has(c, FLOUR) && has(c, EGG) && has(c, MILK)) ? 'gather'
        : 'finish';
    const r = startRun(c, 'cook', step);
    let ok = false;

    if (step === 'start' || step === 'finish') {
        await travel(c, P.cook.x, P.cook.z, 3);
        const tick0 = st(c).tick;
        const t = await talk(c, /^cook$/i, [/^what's wrong\?$/i, /^yes, i'll help you\.$/i]);
        if (t.lines.some(l => /i need milk, an egg and flour|how are you getting on/i.test(l))) p.mark('started');
        if (questCompleteSince(c, tick0) || t.lines.some(l => /i am saved, thank you/i.test(l))) {
            await sdk.waitForTicks(2); await closeQuestScroll(c); p.mark('complete');
        }
        if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
        // free kitchen floor spawns: the second pot makes Prince Ali's flour, the jug carries his water
        if (step === 'start') for (const it of [/^pot$/i, /^jug$/i]) if (c.sdk.findGroundItem(it)) note(c, r, `kitchen ${it.source}: ${await pickup(c, it, 2)}`);
        ok = p.has(step === 'start' ? 'started' : 'complete');
    } else if (step === 'bin') {
        // flour already milled (the bin keeps up to 30 per player): Empty it into each held pot
        await travel(c, P.millDoor.x, P.millDoor.z - 1, 1);
        await travel(c, 3165, 3306, 1);
        for (let i = 0; i < 6 && has(c, /^pot$/i); i++) {
            const e = await c.bot.interactLoc(/^flour bin$/i, /^empty$/i);
            await sdk.waitForTicks(2);
            log(c, `flour bin: ${e.message}; flour=${count(c, FLOUR)}`);
        }
        ok = has(c, FLOUR);
    } else {
        const want = step === 'gather' ? ['flour', 'egg', 'milk'] : [step];
        if (want.includes('flour') && count(c, FLOUR) < FLOURS) await flour(c, r);
        if (want.includes('egg') && !has(c, EGG)) await egg(c);
        if (want.includes('milk') && !has(c, MILK)) await milk(c);
        ok = (!want.includes('flour') || has(c, FLOUR)) && (!want.includes('egg') || has(c, EGG)) && (!want.includes('milk') || has(c, MILK));
    }
    await journal(c, 'cook', step);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });

/** Wheat field -> hopper (plane 2) -> controls -> flour bin (plane 0), once per pot. */
async function flour(c: Ctx, r: ReturnType<typeof startRun>) {
    const pots = Math.min(FLOURS - count(c, FLOUR), count(c, /^pot$/i));
    if (pots <= 0) { note(c, r, 'no empty pot for flour'); return; }
    await travel(c, P.wheat.x, P.wheat.z, 3);
    for (let i = 0; count(c, /^grain$/i) < pots && i < pots * 4; i++) {
        const w = await c.bot.interactLoc(/^wheat$/i, /^pick$/i);
        await c.sdk.waitForTicks(3);
        log(c, `pick wheat: ${w.message}; grain=${count(c, /^grain$/i)}`);
    }
    await travel(c, P.millDoor.x, P.millDoor.z - 1, 1);
    await travel(c, 3165, 3306, 1);
    while (pos(c).level < 2) if (!(await climb(c, /^ladder$/i, /^climb-up$/i))) break;
    for (let i = 0; i < pots && has(c, /^grain$/i); i++) {
        const hopper = c.sdk.findNearbyLoc(/^hopper$/i);
        if (!hopper) { note(c, r, 'no hopper in view'); break; }
        const u = await c.bot.useItemOnLoc(/^grain$/i, hopper);
        log(c, `grain on hopper: ${u.message}`);
        await c.sdk.waitForTicks(2);
        const o = await c.bot.interactLoc(/^hopper controls$/i, /^operate$/i);
        log(c, `operate controls: ${o.message}`);
        await c.sdk.waitForTicks(3);
    }
    while (pos(c).level > 0) if (!(await climb(c, /^ladder$/i, /^climb-down$/i))) break;
    // the bin's Empty sometimes does nothing ("Nothing happened"); the flour stays in the bin, so retry
    const target = count(c, FLOUR) + pots;
    for (let i = 0; i < pots * 3 && count(c, FLOUR) < target && has(c, /^pot$/i); i++) {
        const n0 = count(c, FLOUR);
        const e = await c.bot.interactLoc(/^flour bin$/i, /^empty$/i);
        try { await c.sdk.waitForCondition(s => s.inventory.filter(x => FLOUR.test(x.name)).length > n0, 5_000); } catch { /* logged below */ }
        log(c, `flour bin: ${e.message}; flour=${count(c, FLOUR)}`);
    }
}

/** Eggs lie in the chicken pen east of the river and respawn in 15 s. */
async function egg(c: Ctx) {
    await travel(c, P.chickenPen.x, P.chickenPen.z, 2);
    for (let i = 0; i < 4 && !has(c, EGG); i++) {
        await pickup(c, EGG);
        if (!has(c, EGG)) await c.sdk.waitForTicks(5);
    }
    log(c, `egg: ${has(c, EGG)}`);
}

/** Any "Cow" gives milk to a bucket. Other players kill these cows all the
 * time, so target by name (nearest live cow), never by a remembered index. */
async function milk(c: Ctx) {
    if (!c.sdk.findNearbyNpc(/^cow$/i, { reachable: true })) await travel(c, P.cows.x, P.cows.z, 3);
    for (let i = 0; i < 6 && !has(c, MILK); i++) {
        if (!c.sdk.findNearbyNpc(/^cow$/i, { reachable: true })) { await c.sdk.waitForTicks(3); continue; }
        const u = await c.bot.useItemOnNpc(/^bucket$/i, /^cow$/i);
        await c.sdk.waitForTicks(3);
        log(c, `bucket on cow: ${u.message}; milk=${has(c, MILK)}`);
    }
}
