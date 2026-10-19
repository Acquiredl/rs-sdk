// Raw client walk: one sendWalk click per point (the client routes on live
// collision), waiting until the player stops. For spots where the SDK's
// static planner disagrees with the live map (Juliet's house, 2026-10-19).
// Usage: bun bots/acquiredl/quests/rawwalk.ts acquiredl X,Z [X,Z ...]
import { runScript } from '../../../sdk/runner';
import { where } from './lib';

const pts = process.argv.slice(3).map(a => a.split(',').map(Number));
await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    for (const [x, z] of pts) {
        await sdk.sendWalk(x, z, true);
        let last = where(c), still = 0;
        while (still < 4) { await sdk.waitForTicks(1); const now = where(c); if (now === last) still++; else { still = 0; last = now; } }
        console.log(`click (${x}, ${z}) -> ${where(c)}`);
    }
}, { timeout: 120_000, printState: false });
