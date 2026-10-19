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

## Session 2 (2026-10-19): Smithing 1 to 40

### Goal
- Smithing 40 (37,224 XP), strategy left to the session. Start: courtyard (3223, 3221), HP 11/11, combat 5, Smithing 1, Mining 1, 0 coins, 9 free slots.

### What the numbers say (read from `server/content`, the game's own data)
- XP is stored in tenths and multiplied by 25. Bronze bar: 155 smelting + 312.5 smithing = 467.5 per bar (2 ores). Iron bar: 312.5 smelting, but `smelting.rs2` fails 50% of the time without a ring of forging (members only), so about 156 per ore; smithing an iron bar gives 625. Iron is about 469 XP per ore, bronze about 234. Steel (1 iron + 2 coal, Smithing 30) is about 458 per ore: no better than iron and needs coal.
- Smithing 15 (2,411 XP), the iron gate, is about 6 bronze bars away. Mining 15 is about 6 ores away (437.5 per copper or tin).
- Anvil make-10 (`inv_button3`) runs as one protected delay, 3 ticks per item, so level-up dialogs should not break it. Furnace make-10 runs on a weak queue, which a level-up might break: measure.
- Placements, from the map files (`maps/*.jm2`):
  - SE Varrock mine (3286, 3365): 9 copper, 6 tin, 4 iron.
  - Furnaces: Lumbridge (3226, 3255), Al Kharid (3272, 3185), Falador (2975, 3368). None in Varrock.
  - Anvils: Varrock west smithy (3188, 3423) x3, Horvik's (3229, 3438) x4, SE Varrock (3247, 3404) x2.
  - Varrock east bank booths (3253, 3419), west bank (3186, 3441).
- Aggressive NPCs near the route (huntmode cowardly/ranged, so they attack combat 5): dark wizards lvl 7 and 20 at (3227, 3369), range 5; a black bear lvl 19 spawning at (3296, 3347), 18 tiles south of the mine, hunt range 1; a mugger lvl 6 at (3249, 3391), between the mine and the east bank; 9 scorpions lvl 14 in the Al Kharid mine.

### Plan
1. Coins: pickpocket men in the courtyard (3 gp each) for about 10 gp, then buy a hammer (1 gp) at the Lumbridge General Store (3210, 3244).
2. Equip the bronze sword and wooden shield (two slots back, and armed against the mugger). Walk to the Varrock east bank by an east route that stays 15+ tiles from the dark wizards and the bear, and bank everything but pickaxe, hammer and food.
3. Bronze loop, once: mine 12 copper + 12 tin, walk to the Lumbridge furnace, smelt 12 bars, walk to the SE Varrock anvils (3247, 3404), smith them (make-10). Expected: Smithing about 20, Mining about 27.
4. Iron loop until 40: mine a full load of iron at the same mine, smelt at Lumbridge (about half succeed), smith at the SE Varrock anvils, bank products at the east bank. About 11,000 Smithing XP per 24-ore load, so 3 loops.
5. Every script prints HP at start and end and stops below 6 HP. The bot is parked in the courtyard at every break.

### Alternatives rejected
- Al Kharid (furnace beside the bank, mine to the north): 9 aggressive lvl 14 scorpions in the mine and a 10 gp toll, and no anvil nearby. Too dangerous at combat 5.
- Falador (furnace, Rimmington mine, Thurgo's anvil): 250+ tiles from here and no gain over Lumbridge-Varrock.
- Bronze all the way: about 80 bars, 160 ores, about 7 loops against about 4 with iron. Kept as the fallback if the 4 iron rocks are contested by other bots.
- Steel at 30: needs Mining 30 for coal and 3 ores per bar for no gain per ore. Rejected.
- Buying ore or bars: no coins, and general stores pay near 0. Rejected.
- Smelting with only the 9 free slots: a third of a load per trip. Bank the starter kit first.

### What would change the plan
- Iron rocks always taken: stay on bronze, or try the SW Varrock iron (3177, 3369), which sits 50 tiles west of the dark wizards.
- The SE Varrock anvils turn out to be indoors or locked: use the west smithy (3188, 3423) and the west bank.
- Furnace make-10 breaks on every level-up: re-issue per bar and count the overhead.
