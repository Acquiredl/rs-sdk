// Mine N ores of one kind near a spot. Every rock is named "Rocks": pick by loc id.
// Usage: bun bots/acquiredl/quests/mine.ts acquiredl <quest> <clay|copper|tin|iron> <n> [x z]
// Spots: Varrock SE mine (3286, 3365): copper, tin, iron; Varrock SW mine
// (3180, 3372): clay, tin, iron (a mugger, lvl 6, spawns at (3175, 3361));
// Rimmington (2977, 3240): all four.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, count, st, log, type Ctx } from './lib';

const IDS: Record<string, number[]> = { clay: [2108, 2109], copper: [2090, 2091], tin: [2094, 2095], iron: [2092, 2093] };
const ORE: Record<string, RegExp> = { clay: /^clay$/i, copper: /^copper ore$/i, tin: /^tin ore$/i, iron: /^iron ore$/i };
const [quest, kind, nStr, xs, zs] = process.argv.slice(3);
const N = Number(nStr ?? 1);

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, quest, `mine-${kind}`);
    if (xs) await travel(c, Number(xs), Number(zs), 3);
    const t0 = Date.now();
    let fails = 0;
    while (count(c, ORE[kind]) < N && Date.now() - t0 < 300_000 && st(c).inventory.length < 28 && fails < 12) {
        const rock = (await sdk.scanNearbyLocs(15)).filter(l => IDS[kind].includes(l.id) && l.optionsWithIndex.some(o => /^mine$/i.test(o.text)))
            .sort((a, b) => a.distance - b.distance)[0];
        if (!rock) { fails++; await sdk.waitForTicks(4); continue; }
        const m = await bot.mineRock(rock, { timeout: 20_000 });
        if (!m.success) { fails++; log(c, `mine (${rock.x}, ${rock.z}): ${m.message}`); }
    }
    note(c, r, `${kind}: ${count(c, ORE[kind])}/${N} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    endRun(c, r, count(c, ORE[kind]) >= N ? 'ok' : 'short');
}, { timeout: 420_000, printState: false });
