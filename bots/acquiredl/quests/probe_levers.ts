// Ernest the Chicken basement: Inspect every lever (raw op) and print its state, or "can't reach".
// Usage: bun bots/acquiredl/quests/probe_levers.ts acquiredl
import { runScript } from '../../../sdk/runner';
const LEVERS: Record<string, [number, number]> = { A: [3108, 9745], B: [3118, 9752], C: [3112, 9760], D: [3108, 9767], E: [3097, 9767], F: [3096, 9765] };
await runScript(async ({ sdk }) => {
    const p = sdk.getState()!.player!;
    console.log(`at (${p.worldX}, ${p.worldZ})`);
    const locs = await sdk.scanNearbyLocs(20);
    for (const [k, [x, z]] of Object.entries(LEVERS)) {
        const l = locs.find(v => v.x === x && v.z === z);
        const op = l?.optionsWithIndex.find(o => /inspect/i.test(o.text));
        if (!l || !op) { console.log(`${k}: not found (${l?.optionsWithIndex.map(o => o.text).join('/')})`); continue; }
        const t0 = Math.max(0, ...sdk.getState()!.gameMessages.map(m => m.tick));
        await sdk.sendInteractLoc(l.x, l.z, l.id, op.opIndex);
        let msg = '';
        for (let i = 0; i < 14 && !msg; i++) { await sdk.waitForTicks(1); msg = sdk.getState()!.gameMessages.find(m => m.tick > t0 && /lever is|can't reach/i.test(m.text))?.text ?? ''; }
        const q = sdk.getState()!.player!;
        console.log(`${k}: ${msg || 'no reply'} (now ${q.worldX}, ${q.worldZ})`);
    }
}, { timeout: 200_000, printState: false });
