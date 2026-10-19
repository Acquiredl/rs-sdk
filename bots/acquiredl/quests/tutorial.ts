// Get a fresh character off Tutorial Island (bot.skipTutorial), then print
// where it landed and its starter kit. Run once after character creation.
// Lives in quests/ on purpose: a script directly in bots/acquiredl/ loads
// acquiredl's own bot.env before it looks at the bot name argument.
// Usage: bun bots/acquiredl/quests/tutorial.ts <bot>
import { runScript } from '../../../sdk/runner';
import { where, hp, invText, log } from './lib';

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    log(c, `before: ${where(c)} hp=${hp(c)} modal=${sdk.getState()!.modalInterface}`);
    if (sdk.getState()!.player!.worldX > 3150 && sdk.getState()!.player!.worldZ > 3150) { log(c, 'already off the island'); return; }
    const r = await bot.skipTutorial();
    log(c, `skipTutorial: ${r.success} ${r.message}`);
    await sdk.waitForTicks(3);
    log(c, `after: ${where(c)} hp=${hp(c)} inv: ${invText(c)}`);
}, { timeout: 180_000, printState: false });
