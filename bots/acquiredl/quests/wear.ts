// Wield/wear items by name and print combat skills and the current style.
// Usage: bun bots/acquiredl/quests/wear.ts acquiredl "bronze sword" "ghostspeak amulet"
import { runScript } from '../../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
    for (const name of process.argv.slice(3)) {
        const re = new RegExp(`^${name}$`, 'i');
        if (sdk.findInventoryItem(re)) { const e = await bot.equipItem(re); console.log(`${name}: ${e.message}`); }
    }
    const s = sdk.getState()!;
    console.log(`combat ${s.player!.combatLevel}; ${['Attack', 'Strength', 'Defence', 'Hitpoints', 'Prayer', 'Magic', 'Ranged'].map(k => `${k} ${sdk.getSkill(k)?.baseLevel}`).join(', ')}`);
    console.log(`style ${s.combatStyle?.currentStyle}: ${s.combatStyle?.styles.map(x => `${x.index}=${x.name}(${x.trainsSkills.join('+')})`).join(' ')}`);
    console.log(`worn: ${s.equipment.map(i => i.name).join(', ')}`);
}, { timeout: 30_000, printState: false });
