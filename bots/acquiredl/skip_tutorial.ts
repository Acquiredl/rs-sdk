// One-off: get acquiredl off Tutorial Island. Run once after character creation.
import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    const before = sdk.getState();
    console.log(`Before: pos=(${before?.player.worldX}, ${before?.player.worldZ}) modal=${before?.modalOpen} iface=${before?.modalInterface} dialog=${before?.dialog.isOpen}`);

    const result = await bot.skipTutorial();
    console.log(`skipTutorial: success=${result.success} message=${result.message}`);

    await sdk.waitForTicks(3);
    const after = sdk.getState();
    console.log(`After: pos=(${after?.player.worldX}, ${after?.player.worldZ}) modal=${after?.modalOpen} dialog=${after?.dialog.isOpen}`);
}, {
    timeout: 180_000,
});
