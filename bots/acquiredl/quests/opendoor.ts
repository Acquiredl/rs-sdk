// Open the door or gate at (x, z) with bot.openDoor (walks to it first).
// Usage: bun bots/acquiredl/quests/opendoor.ts acquiredl X Z
import { runScript } from '../../../sdk/runner';
const [x, z] = process.argv.slice(3).map(Number);
await runScript(async ({ bot, sdk }) => {
    const locs = await sdk.scanNearbyLocs(25);
    const d = locs.find(l => l.x === x && l.z === z && /door|gate/i.test(l.name));
    if (!d) { console.log('no door there'); return; }
    const o = await bot.openDoor(d);
    const p = sdk.getState()!.player!;
    console.log(`open (${x}, ${z}): ${o.success} ${o.message}; now (${p.worldX}, ${p.worldZ})`);
}, { timeout: 90_000, printState: false });
