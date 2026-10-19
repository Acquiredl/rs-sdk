// Use an inventory item on a nearby loc N times (fill jugs at a sink, etc.).
// Usage: bun bots/acquiredl/quests/useon.ts acquiredl <itemRegex> <locRegex> [times] [x z]
import { runScript } from '../../../sdk/runner';
import { travel, invText, log } from './lib';

const [item, loc, times, xs, zs] = process.argv.slice(3);
await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    if (xs) await travel(c, Number(xs), Number(zs), 2);
    for (let i = 0; i < Number(times ?? 1); i++) {
        const target = sdk.findNearbyLoc(new RegExp(loc, 'i'));
        if (!target || !sdk.findInventoryItem(new RegExp(item, 'i'))) { log(c, `missing item or loc`); break; }
        const u = await bot.useItemOnLoc(new RegExp(item, 'i'), target);
        await sdk.waitForTicks(2);
        log(c, `${item} on ${target.name} (${target.x}, ${target.z}): ${u.message}`);
    }
    log(c, `inv: ${invText(c)}`);
}, { timeout: 120_000, printState: false });
