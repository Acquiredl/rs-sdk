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

### Setup runs
- `pickpocket.ts` (30 s): 23 attempts on courtyard men, 1 logged success, 17 stuns, 5 server rejections; ended with 6 coins (9 by the next script, so a late success landed after the log line). HP 11 to 8 from stuns. The stun results arrived 0.2 s apart at times, faster than a real stun, so the result probably reads a stale "stunned" message: unverified, noted for later.
- `buy_hammer.ts`: equipped bronze sword and wooden shield, walked to the Lumbridge General Store, bought a hammer for 1 gp. 8 coins left, inventory 19/28.
- `route_check.ts`: offline route preview with the SDK's own pathfinder (`findLongPath`), no client needed. The direct Lumbridge to Varrock east bank route (243 tiles) goes through the south gate 14 tiles from the dark wizard spawn, and the anvil-to-furnace leg does too. The east-side chain courtyard, furnace (3229, 3256), (3240, 3290), (3262, 3322), (3271, 3345), mine (3284, 3366), (3290, 3388), (3276, 3425), bank (3254, 3424), anvil (3247, 3405) is 331 tiles and keeps 32+ tiles from the wizards and scorpions, 18 from the bear spawn, 14 from the mugger.
- `smith_loop.ts`: the main loop, step picked from the inventory (smith if bars, bank if junk and nothing to smelt, smelt if ore and full, else mine). First run (one step: bank the kit) was stopped by the operator after it had walked to (3267, 3334) on the chain. Walked back to the courtyard with `walk_to.ts`.

### Paused for the browser handover
- the operator is moving the game client from the lite runner to their own browser tab. Rule from here: never start or restart the lite runner; scripts drive whichever client is attached. Bot parked at (3224, 3221), HP 11/11.
- Next: once `cli.ts` shows state from the browser client, rerun `LOOP_MS=1 bun bots/acquiredl/smith_loop.ts` to bank the kit, then short mining runs to measure ore per minute.

### Runs on the browser client (from 14:43)
- the operator's browser tab took over at 14:40 to 14:43. Watch for fresh state, not just any state: for the first two minutes `cli.ts` served the lite client's last state with a STALE warning, which looks like "In Game: true". A two-step walk in the courtyard confirmed scripts drive the browser client.
- Bank the kit (one step): 377 s to walk the chain courtyard to bank with `bot.walkTo`, 116 s to deposit 14 kinds (about 8 s each). Left: pickaxe, hammer, shrimps, bread, coins.
- Bronze trip, Mining 1 to 34: 22 ores in about 4.5 min of mining (5.6/min early, 4.4/min later). Most tries came back "rejected" in 1 to 2 s: other players emptying the rocks first. Cheap.
- Walking fix. `bot.walkTo` stops at every turn point: about 1 s per tile. A test click of 10 tiles took 5.7 s, run flag or not. One `sendWalk` click per chain node runs: mine to furnace 42 s, furnace to anvils 70 s once the anvil door (3248, 3411) is opened explicitly. That door cost about 60 s each way while `walkTo` handled it.
- Smelting bronze by using copper on the furnace: 11 bars in 125 s (11.4 s a bar), no failures, Smithing 1 to 14.
- Smithing at the SE Varrock anvils with make-10 (component 1119, option 3): 10 bronze daggers in 28 s, then Smithing 25. Level-up dialogs do not break it.
- Iron trips, Mining 34 to 55: 2.9, 2.6, 2.7, 1.9, then 1.0 ore a minute as more players crowded the 4 iron rocks. Iron smelting failed exactly half the time: 7 bars from 17 ores by hand, 13 from 26 with the make-10 dialog.
- Furnace make-10: `bot.interactLoc(furnace, 'Smelt')` reports "Nothing happened", yet the dialog ("Smelt 10 Iron" and so on) opens 2 ticks after a plain `sendInteractLoc`. Clicking by text works. Level-ups break the weak queue: 26 ores went in as batches of 8, 4, 3, 10 and 1, about 5 s an ore with re-opens.
- The browser client went quiet 5 times for a few seconds ("waitForTicks(1) safety timeout - no state updates received"). The loop now waits for fresh state and redoes the step, up to 3 times a run. Twice it hit the final park; `walk_to.ts` finished it.

### Pivot that mattered: the level curve
- The plan aimed at 37,224 XP, the OSRS figure for level 40. This engine builds its table with 2^(L/10) where OSRS uses 2^(L/7) (`server/engine/src/engine/entity/Player.ts`, `levelExperience`), so level 40 is 15,789 XP. Every logged level fits that table. Found when Smithing read 39 at 15,767 XP with 13 iron bars still to smith.
- Result: Smithing 1 to 45 (23,892 XP) in one bronze trip and two iron trips, about 75 min from the handover. Mining 1 to 55 on the way. HP never fell below 8.

### Where things stand
- Bot parked in the courtyard (3223, 3221), HP 11/11. Inventory: bronze pickaxe, hammer. Worn: bronze sword, wooden shield. Varrock east bank holds the starter kit, food, 8 coins, 11 bronze and 23 iron daggers.
- `smith_loop.ts` resumes from the inventory. `METAL=iron` with steel unlocked at 30 is open: steel needs coal (Mining 30, have 55) and the nearest coal is not on this chain.

### Next steps
- Sell the 23 iron daggers for coins (a general store or a weapon shop, watching the overstock rule in `learnings/shops.md`) and buy a better pickaxe: iron mining here is limited by contested rocks, though, not pick speed.
- Smithing 45 to 50 opens mithril; steel at 30 is open now but needs coal. Both mean a new mine on the chain.
- `bots/acquiredl/README.md` still says "no run yet". the operator's file: left untouched.

### Possible SDK bugs or improvements
- `bot.interactLoc(furnace, /smelt/i)` returns "Nothing happened" although the smelting dialog opens 2 ticks later. Workaround: `sendInteractLoc`, wait for a dialog option, `clickDialogByText(/^smelt 10 iron$/i)`.
- `bot.walkTo` walks turn point to turn point and stops at each: about 1 s a tile on open ground, against about 0.3 s for one click to a point 20 to 40 tiles away.
- `pickpocketNpc` sometimes returned "stunned" 0.2 s apart, faster than a real stun. Unverified, not filed.
