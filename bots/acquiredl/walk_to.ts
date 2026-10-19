// Walk acquiredl to a tile. WALK_X / WALK_Z default to the Lumbridge castle
// courtyard, the spot to leave the bot idle (only rats and men roam there).
import { runScript } from '../../sdk/runner';

const X = Number(process.env.WALK_X ?? 3222);
const Z = Number(process.env.WALK_Z ?? 3222);

await runScript(async ({ bot, sdk }) => {
    const p0 = sdk.getState()!.player;
    console.log(`from (${p0.worldX}, ${p0.worldZ}) hp=${p0.hp}/${p0.maxHp} to (${X}, ${Z})`);
    const r = await bot.walkTo(X, Z, 3);
    const p = sdk.getState()!.player;
    console.log(`walkTo: success=${r.success} ${r.message}; now (${p.worldX}, ${p.worldZ}) hp=${p.hp}/${p.maxHp}`);
}, { timeout: 90_000, printState: false });
