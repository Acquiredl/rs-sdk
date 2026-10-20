// Drop every inventory item matching each regex (frees slots for wool, ore).
// Usage: bun bots/acquiredl/quests/drop.ts <bot> "^earth rune$" "^iron ore$:1" ...
// A ":n" suffix drops at most n (iteration 1: a bare "^iron ore$" dropped all three, not the spare).
import { runScript } from '../../../sdk/runner';
import { invText, log } from './lib';

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    for (const arg of process.argv.slice(3)) {
        const m = arg.match(/^(.*):(\d+)$/);
        const re = new RegExp(m ? m[1] : arg, 'i');
        for (let i = 0; i < (m ? Number(m[2]) : 28); i++) {
            const it = sdk.findInventoryItem(re);
            if (!it) break;
            await sdk.sendDropItem(it.slot);
            await sdk.waitForTicks(1);
        }
    }
    log(c, `inv: ${invText(c)}`);
}, { timeout: 60_000, printState: false });
