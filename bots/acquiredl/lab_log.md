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

## Session 3 (2026-10-19 evening): 11 quests, iteration zero

### Goal
- Complete Cook's Assistant, Sheep Shearer, Romeo & Juliet, Rune Mysteries, Doric's Quest, Goblin Diplomacy, Witch's Potion, The Restless Ghost, Ernest the Chicken, Prince Ali Rescue and Imp Catcher, and leave scripts a fresh character can run faster. Start: courtyard (3222, 3219), HP 11/11, combat 5, 0 coins, inventory sword, shield, pickaxe, hammer.
- Hiscores before the first quest (https://rs-sdk-demo.fly.dev/hiscores/player/acquiredl): Overall 95, time 25m, Quest Points "-". That 25m is stale: the server writes skills and overall playtime only at logout (the lite runner's logout before the browser handover). Quest points refresh on the 15-minute autosave (`LoginServer.ts` `updateQuestHiscore`), with playtime stamped when the total changes.

### Tracking method: the quest journal, read from a screenshot
- What works with the least code: click the quest's button in the quest tab with `sdk.sendClickComponent(id)`. The server's `[if_button,questlist:<quest>]` script writes the journal page and opens it as modal 8134 (`questjournal_scroll`). `sdk.sendScreenshot()` then returns the game canvas, page included. `quests/lib.ts` `journal()` does click, wait for modal 8134, screenshot to a PNG in the temp folder, close: about 10 lines. `quests/journal.ts acquiredl cook sheep ...` (or `all`) runs it from the shell.
- Button ids (`server/content/pack/interface.pack`): cook 7333, runemysteries 7335, doric 7336, priest (Restless Ghost) 7337, gobdip 7338, haunted (Ernest) 7339, imp 7340, prince 7342, romeojuliet 7343, sheep 7344, hetty (Witch's Potion) 7348.
- What it gives: the game's own step text, the same function of the stage varp and the inventory that a player reads. Example, Cook's at stage 0: "I can start this quest by speaking to the Cook in the Kitchen on the ground floor of Lumbridge Castle"; after the hand-in, the whole text struck through and "QUEST COMPLETE!".
- What it cannot tell you:
  - Scripts cannot read it. World state carries no modal text: `state.interface` lists clickable options only (the journal has one, "Close Window"), and `recentDialogs` covers the chat box, not modals. Only a reader of the PNG (the agent) sees the text.
  - No varps in world state either, so the stage number itself is never visible.
  - Items in the bank do not count; the journal strikes an item only when it is in the inventory.
  - The screenshot also shows the chat box with other players' lines. Ruling (2): never read those into a decision. The PNGs stay in the temp folder, never in git.
  - It needs a live client: the operator's tab, not an offline check.
- What scripts use instead, layered on top: per-bot step flags in `quests/progress-<bot>.json`, each set only on observed evidence (an NPC line matched in `recentDialogs`, an item appearing, a game message), and the server's "Congratulations! Quest complete!" game message for done (`questCompleteSince()`), plus the reward scroll (modal 297). Every quest script screenshots the journal at the end of each run, so each step leaves one PNG of the game's own view.
- External check: quest points on the hiscores page, at most 15 minutes behind.

### Facts that changed the plan (all read from `server/content`, notes in the session's side-notes folder)
- Quest XP is 25x too: Cook's gives 7,500 Cooking XP (Cooking 30 from 1), Restless Ghost 28,125 Prayer XP (Prayer about 47, so combat level jumps), Sheep 3,750 Crafting.
- Aggression rule (`Npc.ts`): an NPC with a huntmode attacks when the player's combat level is at most twice its own. At combat 5, every level-3+ hunter attacks.
- No bank in Lumbridge; no dairy cow (any Cow gives milk); the Restless ghost appears only when the coffin is opened or searched; the skull is a floor item in the Wizard Tower basement and taking it spawns a lvl 13 skeleton.
- Goblin Diplomacy must start with the Port Sarim bartender; goblin mail only drops (7.8% village goblins, 3.9% others). Imp beads drop 3.9% each colour (about 53 kills for all four). Rat's tail only drops after Witch's Potion starts.
- Prince Ali: Hassan gives a free Jug of water per talk at stage 0; the key imprint works only at stage exactly 20; Joe needs all 3 beers at once; Keli respawns about 60 s after being tied.
- Mining rocks are all named "Rocks". Rimmington mine holds clay, copper, tin and iron together, the only place near here with all four.

### Helpers (`bots/acquiredl/quests/`)
- `lib.ts`: `journal()`, `Progress` flags, `startRun`/`endRun` (one JSON line per run in `runs-<bot>.jsonl`), `converse()` (walks a dialogue, clicking the first matching choice pattern per page, printing every line), `talk()`, `travel()` (plans with `findLongPath`, clicks a point up to 22 tiles ahead, opens closed doors on each leg, about 0.33 s a tile against about 1 s for `bot.walkTo`), `climb()`, `pickup()`, `buy()`, `park()`.
- `places.ts`: named spots, `castleTo(level)`, `tollGate()`. `fight.ts`, `gather.ts`, `buy.ts`, `go.ts`, `shop_peek.ts`, `runs_table.ts` (prints the per-quest table from the run log).

### Session 3 incidents (in order)
1. Client dropped mid-dialogue with Osman (Al Kharid): `waitForTicks(1) safety timeout`, then "Nothing is logged into the game as 'acquiredl'". The operator logged the tab back in about 5 minutes later; the bot stood where it was.
2. Osman's menu looped: `converse()` clicks the first pattern that matches, and "What is the first thing I must do?" came before "Okay, I better go find some things." The bot left through the gate with stage 20 unset: one extra toll round trip (20 gp). Fix: closing option first in every choice list.
3. Wilderness walk. At the Wizard Tower the basement ladder climb failed, and `travel()` then planned on the surface to the basement coordinates (z 9571): the planner answered with a route north, and the bot walked 800 tiles to (3178, 3966), deep Wilderness. It walked back to (3180, 3505) with HP 3/13 and ate. Cause of the climb failure: the ladder sits behind the tower's diagonal west Door (3107, 3162), which spawns closed. Fixes: `travel()` refuses a target more than 2,000 z away and any route into the Wilderness; `towerWestRoom()` opens that door first.
4. Juliet's house, Varrock: the SDK's static collision says the house and garden are sealed (both `findLongPath` and `bot.walkTo` find no path out), while a raw `sendWalk` click walks straight out on the live map. Fix: `travel()` tries a raw click toward the target before giving up.
5. Death 1, Draynor jail: talking to Lady Keli for the key imprint, standing inside the north door. The jail guards (lvl 26, attack at any level) took HP 14 to 0 in about 10 s. Lost at the jail: 42 coins, blonde wig, pink skirt, bronze bar, soft clay, research package, skull, pickaxe, tinderbox, 5 kebabs and more. Kept: Ghostspeak amulet, bronze sword, rope. Death drops last 200 ticks (`^lootdrop_duration`); not recovered.
6. Death 2, Draynor Manor closet: using the key on the closet door put the bot next to the lvl 25 skeleton, which killed it (HP 14) during the rubber-tube pickup. Lost: spade, pressure gauge, key, bread, shrimps, tools.
7. Response: combat training before any more danger. 48 goblins east of Lumbridge in three rounds (Defence, then Strength, then Attack) in about 11 minutes: combat 9 to 36 (Attack 33, Strength 31, Defence 31, HP 33) and 56 coins from goblin drops. No goblin mail in 48 kills (3.9% each: a 15% chance of none).

### Stopped by the operator (19:24, 2026-10-19), 3 of 11 quests done
The operator called the run here, to start a fresh character with what is learned. Hiscores after: Quest Points 7 (stamped at playtime 3h 43m 42s), Overall 266 (stamped at 3h 08m 15s, written when the tab dropped). Before the first quest the page showed Overall 95 at 25m, a stale stamp from the browser handover.

### Per-quest table (local time; from `quests/runs-acquiredl.jsonl` via `runs_table.ts`)
Ticks are game ticks (about 0.35 s each on this server). "Runs" counts script runs; "not ok" includes runs that worked but whose evidence check missed (noted per quest below).

| Quest | Status at stop | First run | Last run | Script time | Runs (not ok) | Ticks | Coins | Bought / gathered |
|---|---|---|---|---|---|---|---|---|
| Cook's Assistant | **done** 17:04 | 16:43 | 17:04 | 7 min | 6 (2) | 1210 | 0 | pot 1, bucket 2 (store); wheat, egg (chicken pen), milk (any cow) |
| Sheep Shearer | **done** 17:22 | 17:05 | 17:22 | 13 min | 6 (2) | 2600 | +60 | shears 1; 20 wool sheared, spun at the castle |
| Romeo & Juliet | **done** 18:17 | 17:59 | 18:17 | 11 min | 13 (5) | 2140 | 0 | cadava berries (ground, SE Varrock) |
| Rune Mysteries | stage 3; package lost in death 1 | 16:46 | 18:24 | 9 min | 4 (2) | 1704 | 0 | none |
| The Restless Ghost | stage 4; skull lost in death 1 | 16:47 | 18:25 | 7 min | 4 (1) | 1240 | 0 | none |
| Imp Catcher | started, 0 beads | 18:25 | 18:27 | 2 min | 2 (1) | 355 | 0 | none |
| Prince Ali Rescue | stage 20; holding blonde wig, rope, flour, ashes, 2 jugs of water | 17:33 | 19:06 | 16 min | 18 (5) | 3196 | -58 | tolls 40, kebabs 6, skirt 2, dye 5 twice; all lost once in death 1 |
| Ernest the Chicken | stage 2; holding spade, key, gauge, tube; oil can left | 18:35 | 19:22 | 11 min | 17 (7) | 2205 | 0 | none (all in the manor) |
| Witch's Potion | not started; burnt meat banked | 17:27 | 17:30 | 3 min | 2 (0) | 426 | 0 | raw rat meat (giant rat), burnt on the castle range |
| Doric's Quest | not started | - | - | - | - | - | - | - |
| Goblin Diplomacy | not started; 2 goblin mail held | - | - | - | - | - | - | 2 goblin mail from 48 Lumbridge goblins |
| (prep, banking) | | 16:41 | 19:00 | 5 min | 10 (0) | 873 | +29 | sold the wooden shield (8), bank coins (33) |
| (combat training) | | 18:46 | 18:57 | 11 min | 3 (0) | 2104 | +56 | 48 goblins: coins and 2 goblin mail |

Where the 2 h 40 min went, roughly: quest steps that worked, about 70 min; recovery from the two deaths (re-buying, re-gathering, re-doing Ernest's first half), about 30 min; the Wilderness walk and back, about 6 min; Juliet's house and the tower ladder door, about 15 min; the lever basement, about 20 min; the client drop, about 5 min. The rest is walking between hubs at about 0.35 to 0.5 s a tile.

Depended on acquiredl's levels: Mining 55 made the clay and tin one click each, Smithing 45 the bronze bar, Firemaking 33 the ashes. A fresh character needs only level 1 for all three, so nothing here blocks iteration one. Everything else started at level 1 here too.

### Post-mortem, quest by quest
- **Cook's Assistant (7 min of script, could be about 5).** Lost time: the flour bin's first Empty after a hopper run did nothing twice (a retry fixes it), and milking failed four times on a cow other players had killed (target by name, not by index). Fresh character: take the kitchen pot, use the kit bucket; mill first, then the egg and a cow, which sit next to each other east of the river; one Cook visit at the end. Do it first: the reward (Cooking 30) makes cooking food on the castle range safe.
- **Sheep Shearer (13 min, could be about 7).** Lost time: 15 shears on already-shorn sheep at about 15 s each (fixed: unshorn sheep are npc id 43), and spinning batches that Crafting level-ups break after 1 or 2 balls, with about 18 s to reopen the menu each time. Fresh character: shear and spin 20 for Fred in one round; Prince Ali's 7 extra balls in a second round only when the wig and rope are next.
- **Romeo & Juliet (11 min, could be about 6).** Lost time: the SDK's static collision seals Juliet's house (both planners say "no path" while a raw click walks out); the way in is the north door (3160, 3440). Fresh character: Juliet first ("I guess I could find him."), Thessalia's pink skirt (2 gp, for Prince Ali) on the way to Romeo, Lawrence, the SE berry patch, the Apothecary twice, Juliet, Romeo.
- **Rune Mysteries (not finished).** The Duke step took 1 min. The tower's basement ladder sits behind the closed diagonal door (3107, 3162): with it shut the climb fails silently. Fresh character: Duke, Sedridor, Aubury, Sedridor; pair the two tower visits with the skull and with Mizgog.
- **The Restless Ghost (not finished).** Aereck, Urhney and the ghost took 6 min. The skull trip was clean once the tower door was open (skeleton spawned; the bot left by the ladder at HP 12/13). The skull was then carried around and lost in a death. Fresh character: go straight from the skull to the coffin; the Prayer XP (28,125, about level 47) is worth having before anything dangerous.
- **Imp Catcher (not finished).** Started only. Beads drop from any imp even before the quest starts, 3.9% per colour: kill every imp met on the way, all session long, rather than one long hunt at the end.
- **Prince Ali Rescue (not finished).** Two things cost the most: Osman's menu looped (the choice-order bug) and cost a second toll round trip, and death 1 in the jail took every gathered item. Fresh character: gather everything for stages 20 to 30 before talking to Hassan (wool, onions, flour, redberries, ashes, water, clay, bronze bar, skirt, 3 beers, rope); talk to Hassan for free jugs of water while at stage 0; do the Keli imprint only with combat about 30 and food.
- **Ernest the Chicken (not finished).** Death 2 at the closet skeleton (lvl 25) at combat 9. After training, every part came in one pass except the oil can: the SDK's planners route through the basement's closed puzzle doors and stop short. `basement.ts` (raw interactions, each step verified) works; lever state at the stop: A up, B up, C up, D down, E down, F down, bot in the east room.
- **Witch's Potion, Doric's Quest, Goblin Diplomacy (not started).** Burnt meat is banked (cook raw rat meat, then use the cooked meat on a range again). Two goblin mail came from the training goblins.

### Feed-forward: what the next character must know on day one
1. **Train combat before any quest that enters danger.** 48 Lumbridge goblins (lvl 2, max hit 1, east of the castle) took combat 9 to 36 in 11 minutes at 25x XP, Defence first, and paid 56 gp plus 2 goblin mail. Both deaths this session (the Draynor jail guards, lvl 26; the manor closet skeleton, lvl 25) came from skipping this. Wield the sword first: `fight.ts` punched for 16 kills.
2. **Death keeps 3 items and drops the rest for 200 ticks** where you died, next to whatever killed you. Nothing came back.
3. **Progress signal:** `quests/journal.ts acquiredl <quest>` screenshots the quest's own journal page (scripts cannot read it; the agent can). Scripts resume from `progress-<bot>.json` flags. Write each flag's evidence check from the server's own lines (`server/content/scripts`), not from a walkthrough: three false "not confirmed" results this session came from guessed wording.
4. **Read the quest scripts in `server/content/scripts/quests/` and `areas/` before writing a quest.** They hold every option text, item location and stage rule; the four `quests/facts/quest-facts-*.md` notes summarise them.
5. **Dialogue choices:** `converse()` clicks the first pattern that matches, so list the closing option first ("Okay, I better go find some things." before "What is the first thing I must do?").
6. **Walking:** `travel()` runs at about 0.35 to 0.5 s a tile. It refuses basement coordinates from the surface and routes into the Wilderness (one bad climb walked the bot 800 tiles north). Known collision traps: Juliet's house (static map wrong; enter by the north door), the Wizard Tower's diagonal door (3107, 3162), the Draynor Manor front door (one way; use the back door at (3123, 3360)), the lever basement (planners fail; use raw interactions).
7. **Money:** sell the starter wooden shield on day one (8 gp); goblins drop coins; Doric pays 180 and Ernest 300. Prices: pot 1, jug 1, bucket 2, shears 1, tinderbox 1 (Lumbridge store); bronze pickaxe 1 (Bob's Axes); pink skirt 2 (Thessalia); kebab 1 (Al Kharid); dyes 5 (Aggie); toll 10 each way until Prince Ali stage 100.
8. **Free items:** a pot on the castle kitchen floor; the kitchen sink fills jugs; Hassan gives a jug of water per talk at stage 0; logs beside Aggie's house burn to ashes; Barbarian Village has 3 beers on the ground; cadava berries and redberries lie SE of Varrock (about 60 s respawn).
9. **Mining:** every rock is named "Rocks": pick by loc id (clay 2108/2109, copper 2090/2091, tin 2094/2095, iron 2092/2093). Rimmington mine has all four.
10. **Order sketch for iteration one:** shield sale and store; Cook's; goblin training (Defence, Strength, Attack to about 30); Sheep (+7 extra balls); Restless Ghost start; Duke; Wizard Tower (Sedridor, skull, Mizgog); coffin; Ernest; Draynor (Ned, Aggie) and Port Sarim (bartender, Betty, Wydin); Rimmington (Hetty, rat, Doric's ores, clay, copper, tin); Falador (Wyson, furnace, Doric); Goblin Village; Varrock (Aubury, skirt, berries, Juliet); Prince Ali's Al Kharid trips; imps whenever seen.

### Where things stand
- Bot: Draynor Manor lever basement, east room, about (3107, 9766), HP 33/33, combat 36. Not parked: the operator stopped the run here. Levers: A up, B up, C up, D down, E down, F down. To finish Ernest's oil can from this state: `basement.ts acquiredl P:C D:1to2 D:2to3 P:E D:2to3 D:2to5 D:5to8 D:8to9 G:` then out by the ladder (`L:up`) and the secret-room lever (3096, 3357).
- Inventory: 45 coins, 2 goblin mail, rope, pot of flour, tinderbox, 2 jugs of water, shears, bronze pickaxe, blonde wig, ashes, spade, key, pressure gauge, 3 onions, rubber tube. Worn: bronze sword, Ghostspeak amulet. Bank: burnt meat, 3 onions, hammer, 20 iron and 12 bronze daggers, runes, starter kit.

## Iteration 1 (2026-10-19 evening): Acquiredl1, same 11 quests, fed iteration zero

### Setup
- Fresh character `Acquiredl1`, made with `bun bots/create-bot.ts Acquiredl1 --hide-chat` (public chat off). Its client is a second browser tab opened by the operator. Its files (bot.env, the template lab log) sit in the git-ignored `bots/Acquiredl1/`; its run log, progress flags and these notes live here, beside the shared scripts.
- Every quest script takes the bot name as its first argument and keeps per-bot files (`runs-Acquiredl1.jsonl`, `progress-Acquiredl1.json`).
- Trap found before the first run: `runScript` loads a `bot.env` sitting next to the script before it looks at the bot-name argument, so any script directly in `bots/acquiredl/` drives acquiredl whatever name is passed. Run Acquiredl1 only from `bots/acquiredl/quests/` (no bot.env there). `quests/tutorial.ts` replaces the old `skip_tutorial.ts` for that reason.
- Changes fed in from iteration zero: `fight.ts` wields the pack's sword and shield first; the shield is kept for training and the store is paid from goblin coins.

### Plan (from the iteration zero feed-forward)
1. Tutorial skip.
2. Goblins east of Lumbridge: Defence, Strength, Attack about 16 kills each, imps included for beads.
3. Store (shears, jug, tinderbox), Cook's Assistant, Sheep Shearer with 7 extra balls, onions.
4. Restless Ghost start, Duke, Wizard Tower (Sedridor, skull, Mizgog), coffin.
5. Draynor: Ernest, Ned, Aggie; then Port Sarim, Rimmington, Falador, Goblin Village, Varrock, Al Kharid as in the order sketch.
