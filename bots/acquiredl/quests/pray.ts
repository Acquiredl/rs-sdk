// Recharge prayer at the Lumbridge church altar (3243, 3205), the only altar
// near Draynor (none in map squares 47-49 x 49-52). Climbs out of a basement first.
// Usage: bun bots/acquiredl/quests/pray.ts <bot>
import { runScript } from '../../../sdk/runner';
import { travel, climb, pos, log, where } from './lib';

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    if (pos(c).z > 9000) await climb(c, /^ladder$/i, /^climb-up$/i);
    if (pos(c).z > 3150 && pos(c).z < 3175 && pos(c).x < 3120) await travel(c, 3109, 3170, 1); // out of the Wizard Tower first
    await travel(c, 3241, 3206, 2);
    const p0 = sdk.getPrayerState()?.prayerPoints;
    const r = await bot.interactLoc(/^altar$/i, /^pray-at$/i);
    await sdk.waitForTicks(3);
    log(c, `altar: ${r.message}; prayer ${p0} -> ${sdk.getPrayerState()?.prayerPoints} at ${where(c)}`);
}, { timeout: 400_000, printState: false });
