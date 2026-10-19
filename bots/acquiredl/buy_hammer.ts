// Buy a hammer (1 gp) at the Lumbridge General Store and wield the bronze
// sword and wooden shield, freeing two slots and arming the bot for the
// mugger on the Varrock route.
import { runScript } from '../../sdk/runner';

const STORE = { x: 3211, z: 3246 };

await runScript(async ({ bot, sdk }) => {
    const p0 = sdk.getState()!.player;
    console.log(`start: pos=(${p0.worldX}, ${p0.worldZ}) hp=${p0.hp}/${p0.maxHp} coins=${sdk.findInventoryItem(/^coins$/i)?.count ?? 0}`);

    for (const item of [/^bronze sword$/i, /^wooden shield$/i]) {
        const e = await bot.equipItem(item);
        console.log(`equip ${item}: ${e.success} ${e.message}`);
    }

    if (!sdk.findInventoryItem(/^hammer$/i)) {
        const w = await bot.walkTo(STORE.x, STORE.z, 3);
        const p = sdk.getState()!.player;
        console.log(`walk: ${w.success} ${w.message} now (${p.worldX}, ${p.worldZ})`);
        const o = await bot.openShop(/shop keeper|shop assistant/i);
        console.log(`openShop: ${o.success} ${o.message}`);
        const stock = sdk.getState()!.shop?.shopItems?.map(i => `${i.name}x${i.count}`).join(', ');
        console.log(`stock: ${stock}`);
        const b = await bot.buyFromShop(/^hammer$/i, 1);
        console.log(`buy hammer: ${b.success} ${b.message}`);
        await bot.closeShop();
    }

    const s = sdk.getState()!;
    console.log(`end: pos=(${s.player.worldX}, ${s.player.worldZ}) hp=${s.player.hp}/${s.player.maxHp} hammer=${!!sdk.findInventoryItem(/^hammer$/i)} coins=${sdk.findInventoryItem(/^coins$/i)?.count ?? 0} inv=${s.inventory.length}/28`);
    console.log(`worn: ${s.equipment?.map(i => i.name).join(', ')}`);
}, { timeout: 90_000, printState: false });
