// Print prayer state and Prayer skill. Usage: bun .../prayinfo.ts <bot>
import { runScript } from '../../../sdk/runner';
await runScript(async ({ sdk }) => {
    const p = sdk.getPrayerState();
    console.log(`prayer points ${p?.prayerPoints} level ${p?.prayerLevel} active ${sdk.getActivePrayers().join(',') || 'none'}; skill ${JSON.stringify(sdk.getSkill('Prayer'))}`);
    console.log(sdk.getState()!.gameMessages.slice(-4).map(m => `${m.tick} ${m.text}`).join('\n'));
}, { timeout: 30_000, printState: false });
