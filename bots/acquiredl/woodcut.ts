// Woodcutting at the Lumbridge tree cluster (learnings/woodcutting.md).
// Run length comes from WOODCUT_MS (default 30 s). When the inventory fills,
// WOODCUT_FULL=burn lights the logs with the tinderbox (Firemaking XP) and
// keeps chopping; the default stops. The bot never drops anything.
import { runScript } from '../../sdk/runner';

const DURATION_MS = Number(process.env.WOODCUT_MS ?? 30_000);
const ON_FULL = process.env.WOODCUT_FULL ?? 'stop';
const TREE_AREA = { x: 3195, z: 3220 };
const MAX_DRIFT = 15;

await runScript(async ({ bot, sdk }) => {
    const start = Date.now();
    const deadline = start + DURATION_MS;
    const s0 = sdk.getState()!;
    const logs0 = sdk.countInventoryItems(/logs/i);
    const xp0 = sdk.getSkillXp('Woodcutting');
    console.log(`start: pos=(${s0.player.worldX}, ${s0.player.worldZ}) hp=${s0.player.hp}/${s0.player.maxHp} logs=${logs0} wcXp=${xp0} inv=${s0.inventory.length}/28`);

    const distToArea = () => {
        const p = sdk.getState()!.player;
        return Math.hypot(p.worldX - TREE_AREA.x, p.worldZ - TREE_AREA.z);
    };

    if (distToArea() > MAX_DRIFT) {
        console.log(`walking to tree area (${TREE_AREA.x}, ${TREE_AREA.z}), ${distToArea().toFixed(0)} tiles away`);
        const w = await bot.walkTo(TREE_AREA.x, TREE_AREA.z, 5);
        const p = sdk.getState()!.player;
        console.log(`walkTo: success=${w.success} ${w.message} now at (${p.worldX}, ${p.worldZ}) after ${((Date.now() - start) / 1000).toFixed(1)}s`);
    }

    let attempts = 0, chopped = 0;
    const failures: Record<string, number> = {};
    while (Date.now() < deadline) {
        if (sdk.getState()!.inventory.length >= 28) {
            if (ON_FULL !== 'burn') { console.log('inventory full, stopping'); break; }
            let burned = 0;
            while (sdk.countInventoryItems(/logs/i) > 0 && Date.now() < deadline) {
                const b = await bot.burnLogs();
                if (!b.success) { console.log(`burn failed: ${b.message}`); break; }
                burned++;
            }
            const fm = sdk.getSkillXp('Firemaking');
            console.log(`[${((Date.now() - start) / 1000).toFixed(1)}s] inventory full: burned ${burned} logs, fmXp=${fm}`);
            continue;
        }
        if (distToArea() > MAX_DRIFT) { await bot.walkTo(TREE_AREA.x, TREE_AREA.z, 5); }
        const tree = sdk.findNearbyLoc(/^tree$/i, { reachable: true });
        if (!tree) { console.log('no reachable tree nearby'); await bot.walkTo(TREE_AREA.x, TREE_AREA.z, 3); continue; }
        attempts++;
        const r = await bot.chopTree(tree);
        if (r.success) chopped++; else failures[r.message] = (failures[r.message] ?? 0) + 1;
        console.log(`[${((Date.now() - start) / 1000).toFixed(1)}s] chop (${tree.x},${tree.z}) ${tree.distance}t: ${r.success ? 'ok' : 'fail'} ${r.message} hp=${sdk.getState()!.player.hp}`);
    }

    const s1 = sdk.getState()!;
    const logs1 = sdk.countInventoryItems(/logs/i);
    const xp1 = sdk.getSkillXp('Woodcutting');
    console.log(`end: pos=(${s1.player.worldX}, ${s1.player.worldZ}) hp=${s1.player.hp}/${s1.player.maxHp} logs=${logs1} (+${logs1 - logs0}) wcXp=${xp1} (+${xp1 - xp0}) inv=${s1.inventory.length}/28`);
    console.log(`chops: ${chopped}/${attempts} ok in ${((Date.now() - start) / 1000).toFixed(1)}s; failures=${JSON.stringify(failures)}`);
}, {
    timeout: DURATION_MS + 60_000,
    printState: false,
});
