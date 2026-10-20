// Ernest the Chicken lever basement, one verified token at a time (see the
// door rules in ernest-the-chicken.ts). Stops at the first failure and prints
// what it learned, so a run can be steered from the real lever state.
// Tokens: P:X pull lever X, I:X inspect lever X, D:1to2 go through a door,
//         L:up / L:down puzzle ladder, G:oil can pick up, R: pull the secret-room
//         lever (3096, 3357) to leave the room behind the bookcase.
// Usage: bun bots/acquiredl/quests/basement.ts acquiredl P:F D:2to3 D:1to2 I:C ...
import { runScript } from '../../../sdk/runner';
import { st, pos, log, pickup, climb, type Ctx } from './lib';

const LEVERS: Record<string, [number, number]> = { A: [3108, 9745], B: [3118, 9752], C: [3112, 9760], D: [3108, 9767], E: [3097, 9767], F: [3096, 9765] };
const DOORS: Record<string, [number, number]> = {
    '1to2': [3105, 9765], '2to3': [3100, 9765], '4to5': [3105, 9760], '5to6': [3100, 9760], '8to9': [3100, 9755],
    '2to5': [3102, 9763], '3to6': [3097, 9763], '4to7': [3108, 9758], '5to8': [3102, 9758],
};
const lastTick = (c: Ctx) => Math.max(0, ...st(c).gameMessages.map(m => m.tick));
async function raw(c: Ctx, x: number, z: number, op: RegExp) {
    const l = (await c.sdk.scanNearbyLocs(20)).find(v => v.x === x && v.z === z);
    const o = l?.optionsWithIndex.find(v => op.test(v.text));
    if (!l || !o) return false;
    await c.sdk.sendInteractLoc(l.x, l.z, l.id, o.opIndex);
    return true;
}
async function reply(c: Ctx, t0: number, re: RegExp, ticks = 15) {
    for (let i = 0; i < ticks; i++) {
        const m = st(c).gameMessages.find(g => g.tick > t0 && re.test(g.text));
        if (m) return m.text;
        await c.sdk.waitForTicks(1);
    }
    return '';
}

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    log(c, `at (${pos(c).x}, ${pos(c).z})`);
    for (const tok of process.argv.slice(3)) {
        const [kind, arg] = tok.split(':');
        const t0 = lastTick(c), p0 = pos(c);
        let ok = false, what = '';
        if (kind === 'P' || kind === 'I') {
            const [x, z] = LEVERS[arg];
            if (await raw(c, x, z, kind === 'P' ? /^pull$/i : /^inspect$/i)) what = await reply(c, t0, /lever|can't reach/i);
            ok = /lever/i.test(what) && !/can't reach/i.test(what);
        } else if (kind === 'D') {
            const [x, z] = DOORS[arg];
            if (await raw(c, x, z, /^open$/i)) {
                for (let i = 0; i < 15 && !ok; i++) {
                    await sdk.waitForTicks(1);
                    what = st(c).gameMessages.find(g => g.tick > t0 && /locked|can't reach/i.test(g.text))?.text ?? '';
                    if (what) break;
                    const p = pos(c);
                    if ((p0.x - x) * (p.x - x) < 0 || (p0.z - z) * (p.z - z) < 0 || (i > 4 && Math.abs(p.x - p0.x) + Math.abs(p.z - p0.z) >= 2)) ok = true;
                }
            }
            what ||= ok ? 'through' : 'no crossing';
        } else if (kind === 'L') {
            if (arg === 'up') { await sdk.sendWalk(3116, 9755, true); await sdk.waitForTicks(6); }
            ok = await climb(c, /^ladder$/i, arg === 'up' ? /^climb-up$/i : /^climb-down$/i);
            what = ok ? 'climbed' : 'failed';
        } else if (kind === 'R') {
            if (await raw(c, 3096, 3357, /^pull$/i)) for (let i = 0; i < 8 && pos(c).x < 3098; i++) await sdk.waitForTicks(1);
            ok = pos(c).x >= 3098; what = ok ? 'out of the secret room' : 'still inside';
        } else if (kind === 'G') {
            ok = await pickup(c, /^oil can$/i); what = ok ? 'got the oil can' : 'no oil can';
        }
        log(c, `${tok}: ${what} -> (${pos(c).x}, ${pos(c).z})`);
        if (!ok) { log(c, `stopped at ${tok}`); break; }
    }
}, { timeout: 600_000, printState: false });
