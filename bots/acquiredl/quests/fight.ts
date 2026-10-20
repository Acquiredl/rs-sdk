// Kill NPCs and loot their drops: giant rats (raw rat meat), rats (rat's tail),
// imps (beads, ashes), goblins (goblin mail).
// Usage: bun bots/acquiredl/quests/fight.ts acquiredl <quest> <npcRegex> <kills> [lootRegex] [x z]
// Env: STYLE=Strength|Attack|Defence (default Strength: at 25x XP a few kills
// lift max hit from 1), MIN_HP (default 5: eat, or stop when no food),
// FIGHT_MS (default 300 s), STOP_ON=regex: stop once an item matching it is held,
// UNTIL_ALL=regex1,regex2,...: stop once one of each is held (imp beads).
// SPOTS="x,z;x,z;...": rotate to the next spot after IDLE_TICKS (default 15)
// with no target in view (imps are spread one or three to a spawn).
// MAX_Z (default 3517): never target an NPC at or past the Wilderness line.
// Touch quests/STOP-<bot> to end a run cleanly (its run record still gets written).
import { runScript } from '../../../sdk/runner';
import { startRun, endRun, note, travel, pickup, hpGuard, count, has, st, log, pos, BOT, type Ctx } from './lib';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

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
const SPOTS = (process.env.SPOTS ?? '').split(';').filter(Boolean).map(p => { const [x, z] = p.split(',').map(Number); return { x, z }; });
const IDLE_TICKS = Number(process.env.IDLE_TICKS ?? 15);
const MAX_Z = Number(process.env.MAX_Z ?? 3517);
const STOP_FILE = join(import.meta.dir, `STOP-${BOT}`);

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const r = startRun(c, quest, `fight-${npcStr}`);
    const t0 = Date.now();
    // wield what the pack holds: iteration zero punched its first 16 goblins
    for (const re of [/(sword|scimitar)$/i, /shield$/i]) {
        const it = sdk.findInventoryItem(re);
        if (it) { const e = await bot.equipItem(it); log(c, `wield ${it.name}: ${e.message}`); }
    }
    const style = st(c).combatStyle?.styles.find(s => s.trainsSkills.includes(STYLE));
    if (style && st(c).combatStyle?.currentStyle !== style.index) { await sdk.sendSetCombatStyle(style.index); await sdk.waitForTicks(1); }
    if (SPOT) await travel(c, SPOT.x, SPOT.z, 3);
    const done = () => (STOP_ON && has(c, STOP_ON)) || (UNTIL_ALL && UNTIL_ALL.every(re => has(c, re)));
    let kills = 0, fights = 0, lost = 0, idleTicks = 0, spotIdx = 0;
    if (existsSync(STOP_FILE)) unlinkSync(STOP_FILE);
    while (kills < KILLS && Date.now() - t0 < FIGHT_MS && !done()) {
        if (existsSync(STOP_FILE)) { unlinkSync(STOP_FILE); note(c, r, 'stopped by STOP file'); break; }
        if (!(await hpGuard(c, MIN_HP, MIN_HP))) { note(c, r, `hp ${st(c).player!.hp}, no food: stopping`); break; }
        if (st(c).inventory.length >= 28 && LOOT) { note(c, r, 'inventory full'); break; }
        const npc = st(c).nearbyNpcs
            .filter(n => NPC.test(n.name) && n.reachable !== false && n.z <= MAX_Z && n.optionsWithIndex.some(o => /^attack$/i.test(o.text)))
            .filter(n => !n.inCombat || n.targetIndex === -1)
            .sort((a, b) => a.distance - b.distance)[0];
        if (!npc) {
            if (SPOTS.length && (idleTicks += 3) >= IDLE_TICKS) {
                spotIdx = (spotIdx + 1) % SPOTS.length; idleTicks = 0;
                log(c, `nothing in view: on to spot ${spotIdx} (${SPOTS[spotIdx].x}, ${SPOTS[spotIdx].z})`);
                await travel(c, SPOTS[spotIdx].x, SPOTS[spotIdx].z, 3);
                continue;
            }
            if (!SPOTS.length && SPOT && Math.max(Math.abs(pos(c).x - SPOT.x), Math.abs(pos(c).z - SPOT.z)) > 6) await travel(c, SPOT.x, SPOT.z, 3);
            await sdk.waitForTicks(3);
            continue;
        }
        idleTicks = 0;
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
            for (const g of drops) {
                const ok = await pickup(c, new RegExp(`^${g.name}$`, 'i'), 2);
                log(c, `loot ${g.name}: ${ok}`);
                if (/bead/i.test(g.name)) note(c, r, `${g.name} at kill ${kills} (${ok ? 'taken' : 'missed'})`);
            }
        }
        log(c, `kill ${kills}/${KILLS} ${npc.name}; hp=${st(c).player!.hp} str=${sdk.getSkill('Strength')?.baseLevel} att=${sdk.getSkill('Attack')?.baseLevel}${LOOT ? ` loot held=${count(c, LOOT)}` : ''}`);
    }
    note(c, r, `kills ${kills}, fights ${fights}, lost to teleports ${lost}`);
    endRun(c, r, kills >= KILLS || done() ? 'ok' : `stopped at ${kills}/${KILLS}`);
}, { timeout: FIGHT_MS + 180_000, printState: false });
