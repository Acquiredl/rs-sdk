// Sell and buy at one shop in one visit (iteration 1: a fresh character sells
// the starter junk for coins and buys shears on the way to the mill).
// Usage: bun bots/acquiredl/quests/store.ts <bot> <quest> s:<name>[:n|all] b:<name>[:n] ...
// SHOP_X/SHOP_Z default to the Lumbridge General Store (3211, 3244); KEEPER
// (regex) defaults to general-store keepers. Names are matched whole, any case.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, count, coins, type Ctx } from './lib';

const [quest, ...ops] = process.argv.slice(3);
const KEEPER = new RegExp(process.env.KEEPER ?? 'shop ?keeper|shop assistant', 'i');
const AT = { x: Number(process.env.SHOP_X ?? 3211), z: Number(process.env.SHOP_Z ?? 3244) };

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, quest ?? 'prep', 'store');
    await travel(c, AT.x, AT.z, 3);
    const o = await bot.openShop(KEEPER);
    if (!o.success) { endRun(c, r, `openShop failed: ${o.message}`); return; }
    let all = true;
    for (const op of ops) {
        const [kind, name, n] = op.split(':');
        const re = new RegExp(`^${name}$`, 'i');
        const n0 = count(c, re), c0 = coins(c);
        if (kind === 's') {
            const s = await bot.sellToShop(re, n === 'all' || n === undefined ? 'all' : Number(n));
            note(c, r, `sell ${name}: ${s.success ? 'ok' : s.message} (+${coins(c) - c0} gp)`);
        } else {
            const want = Number(n ?? 1);
            const b = await bot.buyFromShop(re, want);
            note(c, r, `buy ${name} x${want}: ${b.success ? 'ok' : b.message} (${coins(c) - c0} gp)`);
            if (count(c, re) - n0 < want) all = false;
        }
    }
    await bot.closeShop();
    note(c, r, `coins ${coins(c)}, inventory ${sdk.getState()!.inventory.length}/28`);
    endRun(c, r, all ? 'ok' : 'partial');
}, { timeout: 300_000, printState: false });
