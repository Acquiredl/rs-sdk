// Day-one prep at the Lumbridge General Store (3211, 3244): make sure the bot
// holds shears, a bucket and a pot. With too few coins, sell the starter
// wooden shield (the store pays 8 gp; prices seen 2026-10-19: pot 1, shears 1,
// bucket 2). A fresh character's starter kit already has the pot and bucket;
// acquiredl's are banked in Varrock, so it buys them here.
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, coins, has, log, type Ctx } from './lib';

const STORE = { x: 3211, z: 3244 };
const WANT: [RegExp, string, number][] = [[/^shears$/i, 'Shears', 1], [/^bucket$/i, 'Bucket', 2], [/^pot$/i, 'Pot', 1]];

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, 'prep', 'store');
    const missing = WANT.filter(([re]) => !has(c, re));
    if (missing.length === 0) { endRun(c, r, 'nothing to buy'); return; }
    await travel(c, STORE.x, STORE.z, 3);
    const o = await bot.openShop(/shop ?keeper|shop assistant/i);
    if (!o.success) { endRun(c, r, `openShop failed: ${o.message}`); return; }
    const cost = missing.reduce((a, [, , p]) => a + p, 0);
    if (coins(c) < cost && has(c, /^wooden shield$/i)) {
        const s = await bot.sellToShop(/^wooden shield$/i, 1);
        note(c, r, `sold wooden shield: ${s.message}; coins ${coins(c)}`);
    }
    for (const [re, name] of missing) {
        const b = await bot.buyFromShop(re, 1);
        note(c, r, `buy ${name}: ${b.success ? 'ok' : b.message}`);
    }
    await bot.closeShop();
    log(c, `coins now ${coins(c)}`);
    endRun(c, r, WANT.every(([re]) => has(c, re)) ? 'ok' : 'incomplete');
}, { timeout: 180_000, printState: false });
