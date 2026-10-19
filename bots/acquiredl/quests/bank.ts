// Bank at a named bank: deposit and withdraw by item name.
// Usage: bun bots/acquiredl/quests/bank.ts acquiredl <bank> [d:<regex>[:n]] [w:<regex>[:n]] ...
//   bank: varrock-west (3185, 3436) | varrock-east (3253, 3420) | draynor (3092, 3245) | falador-west (2946, 3368) | falador-east (3013, 3356)
//   d:shears  deposits all shears;  w:coins:8  withdraws 8 coins;  n defaults to all.
// Prints the bank's contents once open. The bank is one store across all booths.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, st, count, type Ctx } from './lib';

const BANKS: Record<string, { x: number; z: number }> = {
    'varrock-west': { x: 3185, z: 3438 }, 'varrock-east': { x: 3253, z: 3421 },
    draynor: { x: 3092, z: 3245 }, 'falador-west': { x: 2946, z: 3369 }, 'falador-east': { x: 3013, z: 3357 },
};
const [where, ...ops] = process.argv.slice(3);

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, process.env.QUEST ?? 'prep', `bank-${where}`);
    const b = BANKS[where];
    if (!b) { endRun(c, r, `unknown bank ${where}`); return; }
    await travel(c, b.x, b.z, 3);
    const o = await bot.openBank();
    if (!o.success) { endRun(c, r, `openBank: ${o.message}`); return; }
    console.log(`bank: ${sdk.getBankItems().map(i => `${i.name}${i.count > 1 ? ' x' + i.count : ''}`).join(', ')}`);
    for (const op of ops) {
        const [kind, name, n] = op.split(':');
        const re = new RegExp(`^${name}$`, 'i');
        if (kind === 'd') {
            const d = await bot.depositItem(re, n ? Number(n) : -1);
            note(c, r, `deposit ${name}: ${d.message}`);
        } else if (kind === 'w') {
            const item = sdk.getBankItems().find(i => re.test(i.name));
            if (!item) { note(c, r, `withdraw ${name}: not in bank`); continue; }
            const w = await bot.withdrawItem(item.slot, n ? Number(n) : -1);
            note(c, r, `withdraw ${name}: ${w.message}`);
        }
    }
    await bot.closeBank();
    note(c, r, `inventory ${st(c).inventory.length}/28, coins ${count(c, /^coins$/i)}`);
    endRun(c, r, 'ok');
}, { timeout: 600_000, printState: false });
