// Gather a field item until the bot holds N of it.
// Usage: bun bots/acquiredl/quests/gather.ts acquiredl <quest> <what> <n>
//   what: onion-lumbridge | onion-rimmington | wheat
// Onion locs have op2 "Pick" only and respawn in 50 ticks.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, travel, count, log, type Ctx } from './lib';
import { P } from './places';

const [quest, what, nStr] = process.argv.slice(3);
const N = Number(nStr ?? 1);
const SPOTS: Record<string, { at: { x: number; z: number }; loc: RegExp; op: RegExp; item: RegExp }> = {
    'onion-lumbridge': { at: P.onionsLumbridge, loc: /^onion$/i, op: /^pick$/i, item: /^onion$/i },
    'onion-rimmington': { at: { x: 2950, z: 3251 }, loc: /^onion$/i, op: /^pick$/i, item: /^onion$/i },
    wheat: { at: P.wheat, loc: /^wheat$/i, op: /^pick$/i, item: /^grain$/i },
};

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const s = SPOTS[what];
    if (!s) { console.log(`unknown: ${what}; known: ${Object.keys(SPOTS).join(' ')}`); return; }
    const r = startRun(c, quest, `gather-${what}`);
    await travel(c, s.at.x, s.at.z, 2);
    for (let i = 0; count(c, s.item) < N && i < N * 5; i++) {
        const n0 = count(c, s.item);
        const loc = sdk.findNearbyLoc(s.loc, { reachable: true, withOption: s.op });
        if (!loc) { await sdk.waitForTicks(5); continue; }
        const o = await bot.interactLoc(loc, s.op);
        try { await sdk.waitForCondition(st => st.inventory.filter(x => s.item.test(x.name)).reduce((a, x) => a + x.count, 0) > n0, 5_000); } catch { log(c, `${what}: ${o.message}`); }
    }
    endRun(c, r, count(c, s.item) >= N ? 'ok' : `have ${count(c, s.item)}/${N}`);
}, { timeout: 600_000, printState: false });
