// Pickpocket men in the Lumbridge castle courtyard for coins (learnings/thieving.md).
// Stops at PICK_GP coins (default 10), after PICK_MS (default 30 s), or below MIN_HP.
import { runScript } from '../../sdk/runner';

const TARGET_GP = Number(process.env.PICK_GP ?? 10);
const DURATION_MS = Number(process.env.PICK_MS ?? 30_000);
const MIN_HP = 6;

await runScript(async ({ bot, sdk }) => {
    const start = Date.now();
    const coins = () => sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
    const p0 = sdk.getState()!.player;
    console.log(`start: pos=(${p0.worldX}, ${p0.worldZ}) hp=${p0.hp}/${p0.maxHp} coins=${coins()} thXp=${sdk.getSkillXp('Thieving')}`);

    let ok = 0, tries = 0;
    const fails: Record<string, number> = {};
    while (Date.now() - start < DURATION_MS && coins() < TARGET_GP) {
        const hp = sdk.getState()!.player.hp;
        if (hp < MIN_HP) { console.log(`hp ${hp} below ${MIN_HP}, stopping`); break; }
        const man = sdk.findNearbyNpc(/^man$/i, { reachable: true });
        if (!man) { console.log('no reachable man nearby'); await sdk.waitForTicks(2); continue; }
        tries++;
        const r = await bot.pickpocketNpc(man);
        if (r.success) ok++; else fails[r.reason ?? r.message] = (fails[r.reason ?? r.message] ?? 0) + 1;
        console.log(`[${((Date.now() - start) / 1000).toFixed(1)}s] ${r.success ? 'ok' : 'fail'} ${r.reason ?? ''} ${r.message} coins=${coins()} hp=${sdk.getState()!.player.hp}`);
    }

    const p1 = sdk.getState()!.player;
    console.log(`end: pos=(${p1.worldX}, ${p1.worldZ}) hp=${p1.hp}/${p1.maxHp} coins=${coins()} thXp=${sdk.getSkillXp('Thieving')}`);
    console.log(`pickpockets: ${ok}/${tries} ok in ${((Date.now() - start) / 1000).toFixed(1)}s; fails=${JSON.stringify(fails)}`);
}, { timeout: DURATION_MS + 60_000, printState: false });
