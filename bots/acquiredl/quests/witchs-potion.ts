// Witch's Potion (server: quests/quest_hetty; varp hetty 67: 1 started, 2 items given, 3 done).
// Steps: meat (burn raw meat: cook it, then use the cooked meat on a range
// again, which always burns) -> start (Hetty, Rimmington) -> newt (Betty,
// Port Sarim, 3 gp) -> tail (a plain "Rat" drops a tail 100%, only once the
// quest is started) -> finish (Hetty takes all four at once, then Drink From
// the cauldron). Raw meat: a giant rat west of Lumbridge castle drops raw rat
// meat (fight.ts), or a cow drops raw beef. Raw chicken burns to the wrong item.
// Usage: bun bots/acquiredl/quests/witchs-potion.ts acquiredl [step]
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, has, st, log, journal, questCompleteSince, closeQuestScroll, markDialogSeen, converse, type Ctx } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'auto';
const BURNT = /^burnt meat$/i, RAW = /^raw (rat meat|beef)$/i, COOKED = /^cooked meat$/i;
const HETTY = { x: 2967, z: 3206 };     // inside her house, door (2965, 3206) on the west wall
const BETTY = { x: 3013, z: 3258 };     // Betty's Magic Emporium, Port Sarim
const RIMMINGTON_RATS = { x: 2956, z: 3204 }; // storeroom, door (2956, 3205) entered from the north

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('witch');
    const step = STEP !== 'auto' ? STEP
        : !has(c, BURNT) && (has(c, RAW) || has(c, COOKED)) ? 'meat'
        : !p.has('started') ? 'start'
        : !has(c, /^eye of newt$/i) ? 'newt'
        : !has(c, /^rat's tail$/i) ? 'tail'
        : 'finish';
    const r = startRun(c, 'witch', step);
    let ok = false;

    if (step === 'meat') {
        // Lumbridge castle "Cooking range" (3212, 3215), usable after Cook's Assistant;
        // otherwise the Range at (3230, 3196) or Hetty's range (2970, 3209).
        const lumbridge = Math.abs(st(c).player!.worldX - P.cook.x) < 80;
        if (lumbridge) await travel(c, P.cook.x + 2, P.cook.z, 1);
        for (let i = 0; i < 4 && !has(c, BURNT); i++) {
            const item = sdk.findInventoryItem(COOKED) ?? sdk.findInventoryItem(RAW);
            const range = sdk.findNearbyLoc(/^(cooking range|range|fire)$/i);
            if (!item || !range) { note(c, r, `meat: item=${item?.name} range=${range?.name}`); break; }
            const u = await bot.useItemOnLoc(item, range);
            await sdk.waitForTicks(4);
            await bot.dismissBlockingUI();
            log(c, `${item.name} on ${range.name}: ${u.message}; now ${st(c).inventory.filter(x => /meat|beef/i.test(x.name)).map(x => x.name).join(', ')}`);
        }
        ok = has(c, BURNT);
    } else if (step === 'start' || step === 'finish') {
        await travel(c, HETTY.x, HETTY.z, 2);
        const tick0 = st(c).tick;
        const t = await talk(c, /^hetty$/i, [/^i am in search of a quest\.$/i, /^yes help me become one with my darker side\.$/i]);
        if (t.lines.some(l => /onion|rat's tail|eye of newt|burnt meat|got those ingredients/i.test(l))) p.mark('started');
        if (step === 'finish' && !has(c, /^eye of newt$/i)) {
            p.mark('given');
            markDialogSeen(c);
            const d = await bot.interactLoc(/^cauldron$/i, /^drink from$/i);
            log(c, `cauldron: ${d.message}`);
            await converse(c, []);
            await sdk.waitForTicks(3);
            if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
        }
        if (!t.ok) note(c, r, `dialogue stopped: ${t.options.join(' | ')}`);
        ok = step === 'start' ? p.has('started') : p.has('complete');
    } else if (step === 'newt') {
        await travel(c, BETTY.x, BETTY.z, 2);
        const o = await bot.openShop(/^betty$/i);
        if (o.success) {
            const b = await bot.buyFromShop(/^eye of newt$/i, 1);
            note(c, r, `eye of newt: ${b.message}`);
            await bot.closeShop();
        } else note(c, r, `openShop Betty: ${o.message}`);
        ok = has(c, /^eye of newt$/i);
    } else if (step === 'tail') {
        note(c, r, 'run fight.ts for the tail: fight.ts acquiredl witch "^rat$" 1 "^rat\'s tail$" 2956 3203');
    }
    await journal(c, 'witch', step);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });
