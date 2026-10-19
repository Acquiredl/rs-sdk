// Walk to a tile with lib.ts travel(), or park in the courtyard.
// Usage: bun bots/acquiredl/quests/go.ts acquiredl X Z     |   ... go.ts acquiredl park
import { runScript } from '../../../sdk/runner';
import { travel, park, hp, where, log } from './lib';

const [a, b] = process.argv.slice(3);

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    log(c, `from ${where(c)} hp=${hp(c)} run=${sdk.getState()!.player!.runEnergy}`);
    const ok = a === 'park' || a === undefined ? await park(c) : await travel(c, Number(a), Number(b), 2);
    log(c, `${ok ? 'arrived' : 'NOT arrived'} ${where(c)} hp=${hp(c)} run=${sdk.getState()!.player!.runEnergy}`);
}, { timeout: 660_000, printState: false });
