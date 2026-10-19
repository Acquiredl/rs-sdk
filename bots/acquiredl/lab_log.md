# acquiredl Lab Log

## Session 1 (2026-10-19): first run setup

### Goals
- Get the environment running end to end: deps, lite client, state check, tutorial skip.

### Observations
- Root deps were already installed; `server/webclient` was not. `bun install` there pulled 127 packages in about a second.
- Lite client: `cd server/webclient && bun src/lite/runner.ts acquiredl`. It logs in to rs-sdk-demo.fly.dev, then connects to the gateway on port 7443. About 15 to 20 s passed before "Gateway connected, registering as 'acquiredl'".
- The fresh character started on the character-design modal (interface 3559) on Tutorial Island at (3094, 3106).
- `bot.skipTutorial()` (run from `skip_tutorial.ts`) accepted the design modal and finished after 3 dialog clicks. Landed in Lumbridge at (3222, 3222).
- Starter kit, 18 of 28 slots: bronze axe, bronze pickaxe, bronze dagger, bronze sword, wooden shield, shortbow, 25 bronze arrows, tinderbox, small fishing net, bucket, pot, shrimps, bread, runes (25 air, 15 mind, 6 water, 4 earth, 2 body). All skills 1, HP 10.
- `sdk/cli.ts` printed "Took N damage" lines under Player (from `state.combatEvents`, type `damage_taken`) while the raw player state had hp 10/10, combat.inCombat false and lastDamageTick -1. The spawn tile had 20+ other players on it; the events look like hitsplats from other entities, not ours. Not a threat.
- One `cli.ts` call failed with "Failed to connect to wss://rs-sdk-demo.fly.dev/gateway: Connection timeout" right after a script's runner disconnected. The retry worked and the lite client never dropped.
- `runScript` closes its own SDK socket when the script ends. The lite client is unaffected and keeps the character logged in.
- The lite client wrote its archive cache to `server/webclient/undefined/.cache/` (15 MB). `lite/session.ts:109` defaults cacheDir to `${process.env.HOME}/.cache/rs-sdk-lite`, and Windows shells set USERPROFILE, not HOME. Harmless; the folder shows as untracked, so it must stay out of commits. Workaround: set HOME before starting the runner, or pass cacheDir.

### Next Steps
- Pick a first grind. Woodcutting at the Lumbridge trees with the bronze axe is the obvious one; `script.ts` already chops one tree.
- Public chat stays off (SHOW_CHAT=false) until it is turned on as a deliberate experiment.

### Possible SDK Bugs or Improvements:
- `state.combatEvents` carries `damage_taken` events that did not touch the player (hp full, lastDamageTick -1). Printed by `sdk/formatter.ts` under Player. Reproduce on a quiet tile before filing.
- Gateway connect timeout on cli.ts immediately after a runner disconnect. Transient; one retry fixed it.
- Lite client cache lands in a folder literally named `undefined` under `server/webclient/` on Windows (HOME unset). Fix is `os.homedir()` in `lite/session.ts:109`. Bug report filed this session.
