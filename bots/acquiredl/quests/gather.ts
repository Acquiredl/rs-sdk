// Gather a field item until the bot holds N of it.
// Usage: bun bots/acquiredl/quests/gather.ts acquiredl <quest> <what> <n>
//   what: onion-lumbridge | onion-rimmington | wheat
// Onion locs have op2 "Pick" only and respawn in 50 ticks.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, travel, count, log, pickup, type Ctx } from './lib';
import { P } from './places';

const [quest, what, nStr] = process.argv.slice(3);
const N = Number(nStr ?? 1);
const SPOTS: Record<string, { at: { x: number; z: number }; loc: RegExp; op: RegExp; item: RegExp }> = {
    'onion-lumbridge': { at: P.onionsLumbridge, loc: /^onion$/i, op: /^pick$/i, item: /^onion$/i },
    'onion-rimmington': { at: { x: 2950, z: 3251 }, loc: /^onion$/i, op: /^pick$/i, item: /^onion$/i },
    wheat: { at: P.wheat, loc: /^wheat$/i, op: /^pick$/i, item: /^grain$/i },
};
// Ground spawns (picked up, ~60 s respawn): no loc involved.
const GROUND: Record<string, { at: { x: number; z: number }; item: RegExp }> = {
    redberries: { at: P.berries, item: /^redberries$/i },   // (3267, 3371) (3271, 3366) (3278, 3374)
    cadava: { at: P.berries, item: /^cadava berries$/i },   // (3266, 3361) (3273, 3375) (3277, 3370)
    beer: { at: { x: 3079, z: 3441 }, item: /^beer$/i },    // Barbarian Village (3077, 3439) (3077, 3443) (3080, 3441)
};

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const g = GROUND[what];
    if (g) {
        const r = startRun(c, quest, `gather-${what}`);
        await travel(c, g.at.x, g.at.z, 2);
        for (let i = 0; count(c, g.item) < N && i < N * 4; i++) {
            const n0 = count(c, g.item);
            await pickup(c, g.item, 2);
            if (count(c, g.item) === n0) await sdk.waitForTicks(8); // wait for a respawn
        }
        endRun(c, r, count(c, g.item) >= N ? 'ok' : `have ${count(c, g.item)}/${N}`);
        return;
    }
    const s = SPOTS[what];
    if (!s) { console.log(`unknown: ${what}; known: ${[...Object.keys(SPOTS), ...Object.keys(GROUND)].join(' ')}`); return; }
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
