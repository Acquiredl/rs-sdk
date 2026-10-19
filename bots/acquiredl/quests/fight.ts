// Kill NPCs and loot their drops: giant rats (raw rat meat), rats (rat's tail),
// imps (beads, ashes), goblins (goblin mail).
// Usage: bun bots/acquiredl/quests/fight.ts acquiredl <quest> <npcRegex> <kills> [lootRegex] [x z]
// Env: STYLE=Strength|Attack|Defence (default Strength: at 25x XP a few kills
// lift max hit from 1), MIN_HP (default 5: eat, or stop when no food),
// FIGHT_MS (default 300 s), STOP_ON=regex: stop once an item matching it is held,
// UNTIL_ALL=regex1,regex2,...: stop once one of each is held (imp beads).
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, pickup, hpGuard, count, has, st, log, pos, type Ctx } from './lib';

const [quest, npcStr, killsStr, lootStr, xs, zs] = process.argv.slice(3);
const NPC = new RegExp(npcStr, 'i');
const KILLS = Number(killsStr ?? 1);
const LOOT = lootStr ? new RegExp(lootStr, 'i') : null;
const SPOT = xs ? { x: Number(xs), z: Number(zs) } : null;
const STYLE = process.env.STYLE ?? 'Strength';
const MIN_HP = Number(process.env.MIN_HP ?? 5);
const FIGHT_MS = Number(process.env.FIGHT_MS ?? 300_000);
const STOP_ON = process.env.STOP_ON ? new RegExp(process.env.STOP_ON, 'i') : null;
const UNTIL_ALL = process.env.UNTIL_ALL ? process.env.UNTIL_ALL.split(',').map(s => new RegExp(s, 'i')) : null;

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, quest, `fight-${npcStr}`);
    const t0 = Date.now();
    const style = st(c).combatStyle?.styles.find(s => s.trainsSkills.includes(STYLE));
    if (style && st(c).combatStyle?.currentStyle !== style.index) { await sdk.sendSetCombatStyle(style.index); await sdk.waitForTicks(1); }
    if (SPOT) await travel(c, SPOT.x, SPOT.z, 3);
    const done = () => (STOP_ON && has(c, STOP_ON)) || (UNTIL_ALL && UNTIL_ALL.every(re => has(c, re)));
    let kills = 0, fights = 0, lost = 0;
    while (kills < KILLS && Date.now() - t0 < FIGHT_MS && !done()) {
        if (!(await hpGuard(c, MIN_HP, MIN_HP))) { note(c, r, `hp ${st(c).player!.hp}, no food: stopping`); break; }
        if (st(c).inventory.length >= 28 && LOOT) { note(c, r, 'inventory full'); break; }
        const npc = st(c).nearbyNpcs
            .filter(n => NPC.test(n.name) && n.reachable !== false && n.optionsWithIndex.some(o => /^attack$/i.test(o.text)))
            .filter(n => !n.inCombat || n.targetIndex === -1)
            .sort((a, b) => a.distance - b.distance)[0];
        if (!npc) {
            if (SPOT && Math.max(Math.abs(pos(c).x - SPOT.x), Math.abs(pos(c).z - SPOT.z)) > 6) await travel(c, SPOT.x, SPOT.z, 3);
            await sdk.waitForTicks(3);
            continue;
        }
        fights++;
        const a = await bot.attack(npc);
        if (!a.success && a.reason !== 'died') { log(c, `attack ${npc.name} (${npc.x}, ${npc.z}): ${a.message}`); await sdk.waitForTicks(2); continue; }
        // follow the fight until the npc is gone or we have been idle a while
        let lastX = npc.tileX ?? npc.x, lastZ = npc.tileZ ?? npc.z, idle = 0, killed = false;
        const fightT0 = Date.now();
        while (Date.now() - fightT0 < 60_000) {
            await sdk.waitForTicks(1);
            const now = st(c).nearbyNpcs.find(n => n.index === npc.index);
            if (!now || now.hp === 0) { killed = true; break; }
            const jumped = Math.max(Math.abs((now.tileX ?? now.x) - lastX), Math.abs((now.tileZ ?? now.z) - lastZ)) > 4;
            lastX = now.tileX ?? now.x; lastZ = now.tileZ ?? now.z;
            if (jumped) { // imps teleport: chase if still close, else drop it
                if (now.distance <= 12 && now.reachable !== false) { await bot.attack(now); continue; }
                lost++; break;
            }
            if (!st(c).player!.combat?.inCombat && !now.inCombat) { if (++idle > 6) { await bot.attack(now); idle = 0; } } else idle = 0;
            if (!(await hpGuard(c, MIN_HP, MIN_HP))) break;
        }
        if (!killed) continue;
        kills++;
        await sdk.waitForTicks(2);
        if (LOOT) {
            const drops = (await sdk.scanGroundItems(6)).filter(g => LOOT.test(g.name) && Math.max(Math.abs(g.x - lastX), Math.abs(g.z - lastZ)) <= 2);
            for (const g of drops) { const ok = await pickup(c, new RegExp(`^${g.name}$`, 'i'), 2); log(c, `loot ${g.name}: ${ok}`); }
        }
        log(c, `kill ${kills}/${KILLS} ${npc.name}; hp=${st(c).player!.hp} str=${sdk.getSkill('Strength')?.baseLevel} att=${sdk.getSkill('Attack')?.baseLevel}${LOOT ? ` loot held=${count(c, LOOT)}` : ''}`);
    }
    note(c, r, `kills ${kills}, fights ${fights}, lost to teleports ${lost}`);
    endRun(c, r, kills >= KILLS || done() ? 'ok' : `stopped at ${kills}/${KILLS}`);
}, { timeout: FIGHT_MS + 180_000, printState: false });
