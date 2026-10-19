// Doric's Quest (server: quests/quest_doric; varp doricquest 31: 10 started, 100 done).
// Doric (2952, 3451) north of Falador wants 6 clay, 4 copper ore, 2 iron ore,
// unnoted, all at once. Mining is not gated by the quest, so mine first and
// do both talks in one visit. Click through the whole hand-in: the 180 coins
// come after "I can spare you some coins for your trouble."
// Usage: bun bots/acquiredl/quests/dorics-quest.ts acquiredl [mine|doric]
// mine: Rimmington mine, the one place near here with clay, copper, tin and
// iron together. Every rock is named "Rocks": pick by loc id. Iron needs
// Mining 15 (a fresh character mines clay and copper first, then iron at 15;
// at 25x XP that is about 6 ores). EXTRA_CLAY / EXTRA_COPPER / TIN add ore
// for Prince Ali (1 clay for soft clay; 1 copper + 1 tin for the bronze bar).
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, has, count, st, log, journal, questCompleteSince, closeQuestScroll, type Ctx } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'auto';
const RIMMINGTON_MINE = { x: 2977, z: 3240 };
const ROCK_IDS: Record<string, number[]> = { clay: [2108, 2109], copper: [2090, 2091], tin: [2094, 2095], iron: [2092, 2093] };
const ORE: Record<string, RegExp> = { clay: /^clay$/i, copper: /^copper ore$/i, tin: /^tin ore$/i, iron: /^iron ore$/i };

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('doric');
    const want: Record<string, number> = {
        clay: 6 + Number(process.env.EXTRA_CLAY ?? 0),
        copper: 4 + Number(process.env.EXTRA_COPPER ?? 0),
        iron: 2,
        tin: Number(process.env.TIN ?? 0),
    };
    const short = () => Object.entries(want).filter(([k, n]) => count(c, ORE[k]) < n);
    const step = STEP !== 'auto' ? STEP : short().length ? 'mine' : 'doric';
    const r = startRun(c, 'doric', step);
    let ok = false;

    if (step === 'mine') {
        await travel(c, RIMMINGTON_MINE.x, RIMMINGTON_MINE.z, 3);
        const t0 = Date.now();
        let fails = 0;
        while (short().length && Date.now() - t0 < 600_000 && st(c).inventory.length < 28) {
            // iron last: it needs Mining 15
            const [kind] = short().sort((a, b) => (a[0] === 'iron' ? 1 : 0) - (b[0] === 'iron' ? 1 : 0))[0];
            const rocks = (await sdk.scanNearbyLocs(20)).filter(l => ROCK_IDS[kind].includes(l.id) && l.optionsWithIndex.some(o => /^mine$/i.test(o.text)));
            const rock = rocks.sort((a, b) => a.distance - b.distance)[0];
            if (!rock) { log(c, `no ${kind} rock in view`); await sdk.waitForTicks(4); if (++fails > 15) break; continue; }
            const m = await bot.mineRock(rock, { timeout: 20_000 });
            if (!m.success) { fails++; log(c, `mine ${kind} (${rock.x}, ${rock.z}): ${m.message}`); }
        }
        note(c, r, `held: ${Object.keys(want).map(k => `${k} ${count(c, ORE[k])}/${want[k]}`).join(', ')} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
        ok = short().length === 0;
    } else {
        await travel(c, P.doric.x, P.doric.z, 2);
        const tick0 = st(c).tick, coins0 = count(c, /^coins$/i);
        const t = await talk(c, /^doric$/i, [/^i wanted to use your anvils\.$/i, /^yes, i will get you materials\.$/i]);
        if (t.lines.some(l => /clay|copper|iron/i.test(l))) p.mark('started');
        if (count(c, /^clay$/i) >= 6 && p.has('started') && !questCompleteSince(c, tick0)) {
            await talk(c, /^doric$/i, []);   // the hand-in talk: no menu
        }
        await sdk.waitForTicks(3);
        if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
        note(c, r, `coins ${coins0} -> ${count(c, /^coins$/i)}`);
        ok = p.has('complete');
    }
    await journal(c, 'doric', step);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });
