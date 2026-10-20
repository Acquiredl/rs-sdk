// Get out of a fight: Protect from Melee on, walk to (x, z), eat on the way
// below EAT_AT, prayer off on arrival. Usage: bun .../flee.ts <bot> x z
import { runScript } from '../../../sdk/runner';
import { travel, hpGuard, protectMelee, hp, where, log } from './lib';

const [xs, zs] = process.argv.slice(3);
await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    log(c, `flee from ${where(c)} hp=${hp(c)}`);
    await protectMelee(c, true);
    await sdk.sendWalk(Number(xs), Number(zs), true);
    await hpGuard(c, Number(process.env.EAT_AT ?? 18), 1);
    await travel(c, Number(xs), Number(zs), 2);
    await hpGuard(c, Number(process.env.EAT_AT ?? 18), 1);
    await protectMelee(c, false);
    log(c, `now ${where(c)} hp=${hp(c)} in combat=${sdk.getState()!.player!.combat?.inCombat}`);
}, { timeout: 120_000, printState: false });
