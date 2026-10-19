// Buy items from a shop: walk to SHOP_X/SHOP_Z if given, open the keeper, buy.
// Usage: SHOP_X=3211 SHOP_Z=3244 bun bots/acquiredl/quests/buy.ts acquiredl <quest> "pot:1" "tinderbox:1"
// KEEPER (regex) defaults to general-store keepers. Logged as a run of <quest>/buy.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, count, coins, type Ctx } from './lib';

const [quest, ...wants] = process.argv.slice(3);
const KEEPER = new RegExp(process.env.KEEPER ?? 'shop ?keeper|shop assistant', 'i');

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, quest ?? 'prep', 'buy');
    if (process.env.SHOP_X) await travel(c, Number(process.env.SHOP_X), Number(process.env.SHOP_Z), 3);
    const o = await bot.openShop(KEEPER);
    if (!o.success) { endRun(c, r, `openShop failed: ${o.message}`); return; }
    let all = true;
    for (const w of wants) {
        const [name, n] = w.split(':');
        const re = new RegExp(`^${name}$`, 'i');
        const n0 = count(c, re);
        const b = await bot.buyFromShop(re, Number(n ?? 1));
        note(c, r, `buy ${name} x${n ?? 1}: ${b.message} (now ${count(c, re)}, coins ${coins(c)})`);
        if (count(c, re) - n0 < Number(n ?? 1)) all = false;
    }
    await bot.closeShop();
    endRun(c, r, all ? 'ok' : 'partial');
}, { timeout: 300_000, printState: false });
