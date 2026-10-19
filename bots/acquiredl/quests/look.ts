// Print nearby doors, stairs, ladders (or locs matching LOOK) with coords and
// options, and nearby NPCs, from live state. Read-only.
// Usage: LOOK="door|stair|ladder" RADIUS=12 bun bots/acquiredl/quests/look.ts acquiredl
import { runScript } from '../../../sdk/runner';
import { st, where, hp } from './lib';

const RE = new RegExp(process.env.LOOK ?? 'door|stair|ladder|gate|trapdoor', 'i');
const RADIUS = Number(process.env.RADIUS ?? 12);

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    console.log(`at ${where(c)} hp=${hp(c)}`);
    const locs = (await sdk.scanNearbyLocs(RADIUS)).filter(l => RE.test(l.name));
    for (const l of locs.sort((a, b) => a.distance - b.distance))
        console.log(`  loc ${l.name} id=${l.id} (${l.x}, ${l.z}) d=${l.distance} [${l.optionsWithIndex.map(o => o.text).join('/')}]`);
    for (const n of st(c).nearbyNpcs.filter(n => n.distance <= RADIUS))
        console.log(`  npc ${n.name} lvl=${n.combatLevel} id=${n.id} (${n.x}, ${n.z}) d=${n.distance} reachable=${n.reachable}`);
}, { timeout: 30_000, printState: false });
