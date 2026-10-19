// Eat until HP reaches EAT_TO (default max - 2) or the food runs out.
// Usage: bun bots/acquiredl/quests/eat.ts acquiredl
import { runScript } from '../../../sdk/runner';
import { st, hp, where, log } from './lib';

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    const max = st(c).player!.maxHp;
    const to = Number(process.env.EAT_TO ?? max - 2);
    log(c, `at ${where(c)} hp=${hp(c)}; in combat=${st(c).player!.combat?.inCombat}`);
    for (let i = 0; i < 10 && st(c).player!.hp < to; i++) {
        const food = sdk.findInventoryItem(/^(kebab|shrimps|bread|cake|cooked meat|trout|anchovies|cheese)$/i);
        if (!food) { log(c, 'no food left'); break; }
        const e = await bot.eatFood(food);
        log(c, `ate ${food.name}: ${e.message} hp=${hp(c)}`);
    }
    const near = st(c).nearbyNpcs.filter(n => n.distance <= 6 && n.combatLevel > 0).map(n => `${n.name}(${n.combatLevel})@${n.distance}`).join(', ');
    log(c, `hp=${hp(c)} nearby: ${near || 'none'}`);
}, { timeout: 60_000, printState: false });
