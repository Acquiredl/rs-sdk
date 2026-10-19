// Open the nearest shop and print its stock with buy/sell prices, plus what
// it would pay for each inventory item. Buys and sells nothing.
// Usage: bun bots/acquiredl/quests/shop_peek.ts acquiredl [keeperRegex]
import { runScript } from '../../../sdk/runner';
import { hp, where, log } from './lib';

const KEEPER = new RegExp(process.argv[3] ?? 'shop ?keeper|shop assistant', 'i');

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    log(c, `at ${where(c)} hp=${hp(c)}`);
    const o = await bot.openShop(KEEPER);
    if (!o.success) { log(c, `openShop: ${o.message}`); return; }
    const s = sdk.getState()!.shop;
    console.log(`shop: ${s.title}`);
    for (const i of s.shopItems) console.log(`  ${i.name} x${i.count}: buy ${i.buyPrice} sell ${i.sellPrice} (base ${i.baseCost})`);
    console.log('player items:');
    for (const i of s.playerItems) console.log(`  ${i.name} x${i.count}: shop pays ${i.sellPrice}`);
    await bot.closeShop();
}, { timeout: 60_000, printState: false });
