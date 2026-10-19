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

### Woodcutting runs (same day)
- `woodcut.ts`: walk to the Lumbridge trees at (3195, 3220), chop the nearest reachable tree in a loop. `WOODCUT_MS` sets the length; `WOODCUT_FULL=burn` lights the logs with the tinderbox when the inventory fills and keeps going. Default on full is stop.
- 30 s run: the walk from the courtyard took 22.6 s, then 2 chops gave 2 logs and 1,250 Woodcutting XP.
- 2 min run: 9 chops, 9 logs, no failures. Inventory filled at 57 s; burning 10 logs took 59 s (about 6 s per log, 1,000 Firemaking XP each). Woodcutting 1 to 29, Firemaking 1 to 33.
- XP rates look like 25x OSRS: a regular log gives 625 XP (OSRS 25), burning one gives 1,000 (OSRS 40). Levels come fast, so plan around unlocks rather than grind time.
- Between the two runs the idle bot was attacked at (3194, 3225): HP 9/10 to 6/11, Attack 1 to 7 (600 XP), HP level 10 to 11, combat level 3 to 5. Auto-retaliate won the fight. Giant rats (lvl 3) roam the tree cluster, and a Bear (lvl 21) stood about 10 tiles from (3185, 3220) at the cluster's west edge. A bear would kill this character. Do not leave the bot idle there; `walk_to.ts` takes it back to the courtyard.
- A player said "??" in public chat during the run. Chat stays off; no reply.
- A level-up dialog was open after the run. Every `bot.*` action dismisses it, so the next script picks up fine.

### Next Steps
- Keep chopping on the east side of the cluster, away from the bear. Oaks (Varrock, (3190, 3458)) are already unlocked at Woodcutting 29.
- Decide what to do with logs: burn (current), bank at Lumbridge castle upstairs, or fletch (knife needed).
- Public chat stays off (SHOW_CHAT=false) until it is turned on as a deliberate experiment.

### Possible SDK Bugs or Improvements:
- `state.combatEvents` carries `damage_taken` events that did not touch the player (hp full, lastDamageTick -1). Printed by `sdk/formatter.ts` under Player. Reproduce on a quiet tile before filing.
- Gateway connect timeout on cli.ts immediately after a runner disconnect. Transient; one retry fixed it.
- Lite client cache lands in a folder literally named `undefined` under `server/webclient/` on Windows (HOME unset). Fix is `os.homedir()` in `lite/session.ts:109`. Bug report filed this session.
