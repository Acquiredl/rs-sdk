// Prince Ali Rescue (server: quests/quest_prince; varp princequest 273, prince_keystatus 274).
// Strict order: start (Hassan 10, Osman 20) -> wig/paste/imprint at Draynor
// (only from stage 20; the imprint only AT stage 20) -> osman (key print +
// bronze bar) -> leela (hands the key; stage 30 if key + blonde wig + pink
// skirt + paste are held) -> rescue (3 beers to Joe at once -> 40; rope on
// Lady Keli -> 50; key on the Prison Door from the north within ~60 s,
// before Keli respawns; talk to the prince with key + wig + skirt + paste
// -> 100) -> finish (Hassan; the toll gate is free from stage 100).
// Steps can be named: start kebabs wig rope dye ashes paste clay imprint osman leela rescue finish.
// Usage: bun bots/acquiredl/quests/prince-ali-rescue.ts acquiredl <step>
// Items: 7 balls of wool (3 wig, 4 rope; or rope for 15 gp), 2 onions + 5 gp
// (yellow dye), redberries, pot of flour, ashes, water (bucket or jug: the
// paste eats it), clay + water (soft clay, the container comes back), bronze
// bar, pink skirt (Thessalia, Varrock, 2 gp), 3 beers, about 50 gp in tolls.
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, has, count, coins, st, log, pickup, journal, questCompleteSince, closeQuestScroll, useOnNpc, markDialogSeen, converse, type Ctx, type RunRecord } from './lib';
import { P, tollGate } from './places';

const STEP = process.argv[3] ?? 'auto';
const KEBABS = Number(process.env.KEBABS ?? 8);
const WIG = /^wig$/i, PASTE = /^paste$/i, SKIRT = /^pink skirt$/i, KEY = /^bronze key$/i, PRINT = /^key print$/i;

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('prince');
    const r = startRun(c, 'prince', STEP);
    let ok = false;
    switch (STEP) {
        case 'start': ok = await start(c, r, p); break;
        case 'kebabs': ok = await kebabs(c, r); break;
        case 'wig': ok = await ned(c, r, 'wig'); break;
        case 'rope': ok = await ned(c, r, 'rope'); break;
        case 'dye': ok = await dyeWig(c, r); break;
        case 'ashes': ok = await ashes(c, r); break;
        case 'paste': ok = await paste(c, r); break;
        case 'clay': ok = await softClay(c, r); break;
        case 'bar': ok = await bronzeBar(c, r); break;
        case 'imprint': ok = await imprint(c, r, p); break;
        case 'osman': ok = await osman(c, r, p); break;
        case 'leela': ok = await leela(c, r, p); break;
        case 'rescue': ok = await rescue(c, r, p); break;
        case 'finish': ok = await finish(c, r, p); break;
        default: note(c, r, `unknown step ${STEP}`);
    }
    await journal(c, 'prince', STEP);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 1_200_000, printState: false });

async function start(c: Ctx, r: RunRecord, p: Progress) {
    if (!(await tollGate(c, true))) { note(c, r, 'toll gate failed'); return false; }
    if (!p.has('started')) {
        await travel(c, P.hassan.x, P.hassan.z, 3);
        // stage 0 only: "It's just too hot here..." gives a free Jug of water each time
        for (let i = 0; i < 2; i++) {
            const t = await talk(c, /^hassan$/i, [/^it's just too hot here\. how can you stand it\?$/i]);
            log(c, `jugs of water: ${count(c, /^jug of water$/i)} (${t.picked.join(' / ')})`);
        }
        const t = await talk(c, /^hassan$/i, [/^can i help you\? you must need some help here in the desert\.$/i]);
        if (t.lines.some(l => /osman/i.test(l))) p.mark('started');
    }
    await travel(c, P.osman.x, P.osman.z, 3);
    // converse() clicks the FIRST pattern that matches an option: the closing option goes first,
    // or the menu loops first/second forever (2026-10-19, run 2)
    const o = await talk(c, /^osman$/i, [/^okay, i better go find some things\.$/i, /^what is the first thing i must do\?$/i, /^what is the second thing you need\?$/i]);
    if (o.picked.some(x => /okay, i better go find some things/i.test(x))) p.mark('osman');
    await kebabs(c, r);
    await tollGate(c, false);
    return p.has('osman');
}

async function kebabs(c: Ctx, r: RunRecord) {
    if (KEBABS <= 0) return true;
    await travel(c, P.kebabSeller.x, P.kebabSeller.z, 3);
    const n0 = count(c, /^kebab$/i);
    for (let i = 0; i < KEBABS && coins(c) > 0 && st(c).inventory.length < 28; i++) {
        await talk(c, /^kebab seller$/i, [/^yes please\.$/i]);
    }
    note(c, r, `kebabs bought: ${count(c, /^kebab$/i) - n0}`);
    return count(c, /^kebab$/i) > n0;
}

async function ned(c: Ctx, r: RunRecord, what: 'wig' | 'rope') {
    await travel(c, P.ned.x, P.ned.z, 2);
    const before = what === 'wig' ? count(c, WIG) : count(c, /^rope$/i);
    const choices = what === 'wig'
        ? [/^ned, could you make other things from wool\?$/i, /^how about some sort of wig\?$/i, /^i have that now\. please, make me a wig\.$/i]
        : [/^yes, i would like some rope\.$/i, /^i have some balls of wool\. could you make me some rope\?$/i];
    const t = await talk(c, /^ned$/i, choices);
    if (!t.ok) note(c, r, `ned stopped: ${t.options.join(' | ')}`);
    const after = what === 'wig' ? count(c, WIG) : count(c, /^rope$/i);
    return after > before;
}

/** Yellow dye from Aggie (use an onion on her: 2 onions + 5 gp), then dye the wig blonde. */
async function dyeWig(c: Ctx, r: RunRecord) {
    if (!has(c, /^yellow dye$/i)) {
        await travel(c, P.aggie.x, P.aggie.z, 2);
        const u = await useOnNpc(c, /^onion$/i, /^aggie$/i, []);
        note(c, r, `onion on Aggie: ${u.ok}; yellow dye=${has(c, /^yellow dye$/i)}`);
    }
    if (!has(c, /^yellow dye$/i) || !has(c, WIG)) return false;
    const dye = c.sdk.findInventoryItem(/^yellow dye$/i)!, wig = c.sdk.findInventoryItem(WIG)!;
    const n0 = count(c, /^yellow dye$/i);
    await c.sdk.sendUseItemOnItem(dye.slot, wig.slot);
    try { await c.sdk.waitForCondition(s => s.inventory.filter(i => /^yellow dye$/i.test(i.name)).length < n0, 5_000); } catch { /* checked */ }
    const blonde = count(c, /^yellow dye$/i) < n0;
    if (blonde) new Progress('prince').mark('blonde-wig');
    note(c, r, `dye wig: ${blonde ? 'blonde' : 'no change'}`);
    return blonde;
}

/** Ashes: light the logs that lie beside Aggie's house and wait for the fire to burn out. */
async function ashes(c: Ctx, r: RunRecord) {
    if (has(c, /^ashes$/i)) return true;
    if (!has(c, /^logs$/i)) {
        await travel(c, P.logsByAggie.x, P.logsByAggie.z, 2);
        await pickup(c, /^logs$/i);
    }
    if (!has(c, /^logs$/i)) { note(c, r, 'no logs'); return false; }
    const b = await c.bot.burnLogs(/^logs$/i);
    note(c, r, `burn logs: ${b.message}`);
    const here = { x: st(c).player!.worldX, z: st(c).player!.worldZ };
    // the fire burns 100-199 ticks, then leaves ashes for 100 ticks
    for (let i = 0; i < 24 && !has(c, /^ashes$/i); i++) {
        await c.sdk.waitForTicks(10);
        const a = (await c.sdk.scanGroundItems(4)).find(g => /^ashes$/i.test(g.name));
        if (a) { await pickup(c, /^ashes$/i); break; }
    }
    log(c, `ashes: ${has(c, /^ashes$/i)} near (${here.x}, ${here.z})`);
    return has(c, /^ashes$/i);
}

async function paste(c: Ctx, r: RunRecord) {
    const need = [/^redberries$/i, /^pot of flour$/i, /^ashes$/i, /^(bucket|jug) of water$/i];
    const missing = need.filter(re => !has(c, re));
    if (missing.length) { note(c, r, `paste missing: ${missing.join(' ')}`); return false; }
    await travel(c, P.aggie.x, P.aggie.z, 2);
    const t = await talk(c, /^aggie$/i, [/^could you think of a way to make skin paste\?$/i, /^yes please\. mix me some skin paste\.$/i]);
    if (!t.ok) note(c, r, `aggie stopped: ${t.options.join(' | ')}`);
    return has(c, PASTE);
}

/** Bronze bar: copper ore used on the Lumbridge furnace (3226, 3255) with tin held. Smithing 1 is enough. */
async function bronzeBar(c: Ctx, r: RunRecord) {
    if (has(c, /^bronze bar$/i)) return true;
    if (!has(c, /^copper ore$/i) || !has(c, /^tin ore$/i)) { note(c, r, 'bar needs copper and tin ore'); return false; }
    await travel(c, 3227, 3254, 2);
    const furnace = c.sdk.findNearbyLoc(/^furnace$/i);
    if (!furnace) { note(c, r, 'no furnace in view'); return false; }
    const u = await c.bot.useItemOnLoc(/^copper ore$/i, furnace);
    try { await c.sdk.waitForCondition(s => s.inventory.some(i => /^bronze bar$/i.test(i.name)), 10_000); } catch { /* checked */ }
    note(c, r, `smelt: ${u.message}; bar=${has(c, /^bronze bar$/i)}`);
    return has(c, /^bronze bar$/i);
}

/** Soft clay: clay on a jug/bucket of water (the container comes back empty). */
async function softClay(c: Ctx, r: RunRecord) {
    const clay = c.sdk.findInventoryItem(/^clay$/i), water = c.sdk.findInventoryItem(/^(jug|bucket) of water$/i);
    if (!clay || !water) { note(c, r, `soft clay: clay=${!!clay} water=${!!water}`); return false; }
    await c.sdk.sendUseItemOnItem(clay.slot, water.slot);
    try { await c.sdk.waitForCondition(s => s.inventory.some(i => /^soft clay$/i.test(i.name)), 5_000); } catch { /* checked */ }
    return has(c, /^soft clay$/i);
}

/** Lady Keli, at stage exactly 20 with soft clay: the clay becomes a Key print. */
async function imprint(c: Ctx, r: RunRecord, p: Progress) {
    if (!has(c, /^soft clay$/i)) { note(c, r, 'no soft clay'); return false; }
    await travel(c, 3128, 3247, 1);           // outside the jail's north door (3128, 3246)
    const t = await talk(c, /^lady keli$/i, [
        /^heard of you\? you are famous in runescape!$/i, /^what is your latest plan then\?$/i,
        /^can you be sure they will not try to get him out\?$/i, /^could i see the key please\?$/i,
        /^could i touch the key for a moment\?$/i]);
    if (!t.ok) note(c, r, `keli stopped: ${t.options.join(' | ')}`);
    if (has(c, PRINT)) p.mark('print');
    return has(c, PRINT);
}

async function osman(c: Ctx, r: RunRecord, p: Progress) {
    if (!has(c, PRINT) || !has(c, /^bronze bar$/i)) { note(c, r, `osman needs print=${has(c, PRINT)} bar=${has(c, /^bronze bar$/i)}`); return false; }
    if (!(await tollGate(c, true))) return false;
    await travel(c, P.osman.x, P.osman.z, 3);
    await talk(c, /^osman$/i, []);
    const ok = !has(c, PRINT);
    if (ok) p.mark('key-ordered');
    await tollGate(c, false);
    return ok;
}

async function leela(c: Ctx, r: RunRecord, p: Progress) {
    await travel(c, P.leela.x, P.leela.z, 3);
    const t = await talk(c, /^leela$/i, []);
    if (has(c, KEY)) p.mark('key');
    if (t.lines.some(l => /guard|joe/i.test(l)) && has(c, KEY)) p.mark('stage30');
    note(c, r, `key=${has(c, KEY)} wig=${has(c, WIG)} skirt=${has(c, SKIRT)} paste=${has(c, PASTE)}`);
    return has(c, KEY);
}

async function rescue(c: Ctx, r: RunRecord, p: Progress) {
    if (count(c, /^beer$/i) < 3 && !p.has('joe')) { note(c, r, `need 3 beers, have ${count(c, /^beer$/i)}`); return false; }
    await travel(c, 3127, 3247, 1);
    if (!p.has('joe')) {
        const t = await talk(c, /^joe$/i, [/^i have some beer here, fancy one\?$/i]);
        if (count(c, /^beer$/i) === 0) p.mark('joe');
        note(c, r, `joe: beers left ${count(c, /^beer$/i)}; ${t.lines.slice(-1)[0] ?? ''}`);
        if (!p.has('joe')) return false;
    }
    if (!p.has('keli-tied')) {
        const u = await useOnNpc(c, /^rope$/i, /^lady keli$/i, []);
        if (!has(c, /^rope$/i)) p.mark('keli-tied');
        note(c, r, `rope on Keli: ${u.ok} rope left=${has(c, /^rope$/i)}`);
        if (!p.has('keli-tied')) return false;
    }
    // Keli respawns about 60 s after being tied: get through the door now
    await travel(c, P.jailNorth.x, P.jailNorth.z, 0);
    const door = c.sdk.findNearbyLoc(/^prison door$/i);
    if (door) {
        markDialogSeen(c);
        const u = await c.bot.useItemOnLoc(KEY, door);
        log(c, `key on prison door: ${u.message} now (${st(c).player!.worldX}, ${st(c).player!.worldZ})`);
        await converse(c, []);
    }
    const t = await talk(c, /^prince ali$/i, []);
    if (!has(c, SKIRT) && !has(c, PASTE)) p.mark('freed');
    note(c, r, `prince: freed=${p.has('freed')}; ${t.lines.slice(-1)[0] ?? ''}`);
    // the cell door opens freely from inside
    const d2 = c.sdk.findNearbyLoc(/^prison door$/i, { withOption: /^open$/i });
    if (d2) await c.bot.openDoor(d2);
    await travel(c, 3128, 3250, 2);
    return p.has('freed');
}

async function finish(c: Ctx, r: RunRecord, p: Progress) {
    if (!(await tollGate(c, true))) return false;
    await travel(c, P.hassan.x, P.hassan.z, 3);
    const tick0 = st(c).tick;
    await talk(c, /^hassan$/i, []);
    await c.sdk.waitForTicks(3);
    if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
    await tollGate(c, false);
    return p.has('complete');
}
