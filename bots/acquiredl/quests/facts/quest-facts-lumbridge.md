# Lumbridge quest facts (from server/content, rev 289)

Coordinates are x, z, plane. Option labels are verbatim from the scripts; "continue" means a plain chat line. XP: `stat_advance` is in tenths, and the engine multiplies it by `node.xpRate`, which defaults to 25 (`engine/src/util/WorldConfig.ts`, env `NODE_XPRATE`). Levels below assume a fresh skill and use this server's 2^(L/10) curve.

**General**
- There is no bank in Lumbridge castle. The nearest bank is Draynor (booth around 3091,3241).
- The castle stairs are "Staircase" at 3204,3207 and 3204,3229. On plane 0 use `Climb-up`. On plane 1 use `Climb-up` or `Climb-down`, never `Climb`, which opens a menu. Ladders work the same way.
- Aggression rule: an NPC with `huntmode=cowardly` attacks you within its `huntrange` unless your combat level is more than twice its level.
- The Lumbridge General Store has a Shop keeper (3209,3247) and a Shop assistant (3212,3247), both with the `Trade` op. Full-stock prices: Pot 1 gp, Shears 1 gp, Bucket 2 gp.

## 1. Cook's Assistant

**Stages** (varp `cookquest`, id 29)
- 0: not started. The journal says to talk to the Cook.
- 1: started. The journal lists milk, egg and flour, and strikes out each one that is in the inventory.
- 2: complete.

**NPC:** Cook at 3209,3215,0 (ground-floor kitchen), op `Talk-to`. The kitchen doors are at 3208,3211 and 3215,3211.

**Dialogue**
- Start: `What's wrong?`, then `Yes, I'll help you.`. The varp is set when you click the choice.
- Branches:
  - `You don't look very happy.` gives a second chance at `What's wrong?`.
  - `Nice hat!` and `Well you could give me all your money!` end the conversation.
  - `No, I don't feel like it. Maybe later.` ends it with no progress.
- Turn-in: `Talk-to`, continue only. All three items must be in the inventory at the same time; there is no partial delivery. The game shows "You give some milk, an egg and some flour to the cook."

**Items** (all of them can be gathered before starting)

| Item | Source |
|---|---|
| Pot | Ground spawn in the kitchen at 3210,3212,0 (respawns in about 60 s). Also the general store, or the Varrock bank. |
| Bucket | Ground spawn in the castle cellar at 3216,9625,0, on a table. To get there, open the kitchen "Trapdoor" at 3209,3216 (`Open`, then `Climb-down`); the ladder back up is at 3209,9616 (`Climb-up`). Second spawn at 3225,3294,0, on a crate in the farmhouse (door 3230,3291). Also the store. |
| Egg | Ground spawns at 3226,3301,0 and 3229,3299,0 in the chicken pen. They respawn in 25 ticks (15 s). Chickens do not drop eggs. |
| Bucket of milk | Use the Bucket on **any** "Cow"; there is no Dairy cow in this revision. Message: "You milk the cow." The nearest cows are at 3243,3289, 3244,3289, 3247,3284 and 3243,3295, and there are more past the gate at 3253,3266. |
| Pot of flour | Pick "Wheat" (op `Pick`) in the field at 3153–3164, 3291–3306 (gate at 3162,3290). Wheat regrows in 20 ticks. Then go into the mill (Large door at 3166,3302) and climb the "Ladder" at 3164,3307 to plane 2. Use Grain on the "Hopper" at 3166,3307,2 ("You put the grain in the hopper."). Use `Operate` on "Hopper controls" at 3166,3305,2 ("...The grain slides down the chute."). Go back down and use `Empty` on the "Flour bin" at 3166,3307,0 while holding a pot ("You fill a pot with flour from the bin."). The hopper holds one grain per operation. The flour bin is a per-player varp that stores up to 30 flour. |

**Reward:** 300 base Cooking XP, so **7,500** at 25× (Cooking 30 from fresh). 1 QP. You also get permission to use the Cook's range.

## 2. Sheep Shearer

**Stages** (varp `sheep`, id 179)
- 0: not started.
- 1–20: started. The value goes up by 1 per ball handed in. The journal says "need 20-(v-1) more".
- 22: complete.

**NPC:** Fred the Farmer at 3189,3273,0, op `Talk-to`, inside his house (doors at 3188,3272 and 3189,3275; yard gate at 3186,3268).

**Dialogue**
- Start: `I'm looking for a quest.`, then `Yes okay. I can do that.`.
- The varp is set only after Fred's last line, "Ok I'll see you when you have some wool.", so continue through it.
- Branches:
  - `What do you mean, The Thing?` and `That doesn't sound a very exciting quest.` cost one or two lines, then the same yes option comes back.
  - `Erm, I'm a bit worried about this thing.` and `No, I'll give it a miss.` end the conversation with no progress.
- Turn-in: `Talk-to`, with no choices.
  - Fred takes **one ball per tick** ("You give Fred a ball of wool.") and closes the dialog while he does it. Wait on the ball count, not on the dialog.
  - **Partial deliveries are kept** in the varp.
  - The 20th ball triggers "I have your last ball of wool." and completes the quest.
  - Fred accepts balls of wool only, not raw wool.

**Items**
- **Shears:** ground spawn at **3152,3306,0**, by the haystacks next to the mill and wheat field. Another spawn at 3126,3356. The store sells them for 1 gp.
- **Sheep:** 16 "Sheep" in the pen at 3193–3210, 3259–3274. The pen has a Gate at 3213,3261–62 and a "Stile" at 3197,3276 (`Climb-over`).
  - Sheep have **no op**: use the Shears on a Sheep.
  - Each attempt has a 25% chance of "The sheep manages to get away from you!".
  - Success shows "You get some wool." in an objbox.
  - A shorn sheep regrows after 100 ticks.
- **Spinning wheel:** 3209,3212, **plane 1** of the castle (south stairs, then the door at 3207,3210 or 3207,3214).
  - `Spin` opens the "What would you like to spin?" menu with Wool and Flax, each with Make 1/5/10/X.
  - Using Wool on the wheel spins one ball per use.
  - Message: "You spin the wool into a nice ball of wool."
  - No level requirement. Each ball gives 2.5 XP before the multiplier.
  - Spinning can trigger a random event.
- Inventory: 20 wool plus the shears takes 21 slots.

**Shortcuts:** you can shear and spin before starting the quest.

**Reward:** 60 coins and 150 base Crafting XP, so **3,750** at 25× (Crafting 22 from fresh). The 20 spins add another 1,250. 1 QP.

## 3. The Restless Ghost

**Stages** (varp `prieststart`, id 107)
- 0: not started.
- 1: find Father Urhney.
- 2: have the amulet, talk to the ghost.
- 3: the ghost told you about the skull, so search the Wizard Tower.
- 4: skull taken.
- 5: complete.

**NPCs**

| NPC | Where | Ops |
|---|---|---|
| Father Aereck | 3244,3206,0, in the church. Large doors at 3243–44,3216; side door at 3238,3210. | Talk-to |
| Father Urhney | 3235,3153,0, in a shack **due south** of the castle (door 3234,3156). He wanders up to 5 tiles. | Talk-to |
| Restless ghost | **Not a static spawn.** He appears at 3249,3194 for 100 ticks whenever anyone opens, closes or searches the "Coffin" at 3249,3192,0 (crypt door 3247,3193). | Talk-to |
| Skeleton | Spawned by taking the skull (see below). | Attack |

**Dialogue**
1. **Aereck:** `I'm looking for a quest!` (the label ends in "!"). The varp is set at once; the rest is continue.
2. **Urhney:** `Father Aereck sent me to talk to you.`, then `He's got a ghost haunting his graveyard.`.
   - You get the Ghostspeak amulet; keep a slot free.
   - The other option, `You mean he gets himself into lots of problems?`, gets there with one extra line.
   - If you lose the amulet, a new option `I've lost the amulet.` appears.
3. **Ghost:** first **wear** the amulet (`Wear`). Without it you get "Wooo" chatter: harmless, but it gets you nowhere.
   - `Open` the Coffin, then use `Talk-to` on the Restless ghost.
   - Pick `Yep, now tell me what the problem is.` and continue. The varp becomes 3 just before "It is so dull being a ghost...".
   - Alternative: `Wow, this amulet works!`, then `Yes, ok. Do you know why you're a ghost?`.
   - Avoid `No, you sound like you're speaking nonsense to me.`. After it, `No I can't.` ends with no progress; `Yep, clever aren't I?` recovers.
4. **Skull:** a ground item "Skull" at **3120,9567,0** in the Wizard Tower basement, op `Take`.
   - Before stage 3, taking it is refused with "That skull looks scary...".
   - Taking it shows "Out of nowhere a skeleton appears!".
5. **Finish:** at the Coffin, use `Open` if it is shut (otherwise you get "Maybe I should open it first."), then use the Skull on the open Coffin. The ghost does not need to be there. Using the skull on the ghost fails with "It goes right through him."

**Dangers**
- **Skull skeleton:** level 13, 18 HP, attack 10, strength 11, defence 7. It spawns at 3120,9565 and **attacks at once**, then lasts 500 ticks (5 min). Escape up the "Ladder" at 3103,9576 (`Climb-up`), through the Door at 3108,9570.
- **Giant rats:** level 6, `cowardly`, huntrange 1, so they attack combat 12 or lower. They are in the swamp at 3200–3215, 3172–3195.
- **Wizards:** level 9 (in the tower, and one at 3109,9558 in the basement). They have no huntmode, so they are passive.
- **Wizard Tower access:** the ladder down is "Ladder" at 3104,3162,0 (`Climb-down`). Doors are at 3109,3166, 3111,3163 and 3107,3162.

**Reward:** 1,125 base Prayer XP, so **28,125** at 25× (Prayer 47 from fresh). 1 QP. No skill requirements.

## 4. Rune Mysteries

**Stages** (varp `runemysteries`, id 63)
- 0: not started.
- 1: have the Air talisman.
- 2: gave the talisman but said no to the package.
- 3: have the Research package.
- 4: gave the package to Aubury.
- 5: have the Notes.
- 6: complete.

**NPCs**

| NPC | Where | Ops |
|---|---|---|
| Duke Horacio | 3212,3220,**1** | Talk-to |
| Sedridor (the head wizard) | 3103,9571,0, **in the Wizard Tower basement**, near the ladder at 3103,9576 | Talk-to, Teleport |
| Aubury | 3253,3402,0, Varrock rune shop (door 3253,3399 starts open) | Talk-to, Trade, Teleport |

**Dialogue**
1. **Duke:** `Have you any quests for me?`, then `Sure, no problem.`. You get the Air talisman. Choosing `Not right now.` gives no progress.
2. **Sedridor:** `I'm looking for the head wizard.`, then `Ok, here you are.`, then a long speech, then `Yes, certainly.`. You get the Research package.
   - `No, I'll only give it to the head wizard.` costs about 5 extra lines and still works.
   - `No, I'm busy.` leaves you at stage 2; talking again replays the speech.
3. **Aubury:** `Talk-to`, then `I have been sent here with a package for you.`. This option appears only when the package is in the inventory. Using the package on Aubury also works.
   - Then use `Talk-to` again right away; there is no waiting period.
   - That conversation has no choices and gives you the Notes.
4. **Sedridor:** `Talk-to`, continue through about 20 pages (or use the Notes on him). The Notes must be in the inventory; if they are in the bank he only says "Sure, I'll go and get them from the bank." The Air talisman is handed back.

**Lost items:** the Duke, Sedridor and Aubury each hand out a replacement if you lose theirs.

**Reward:** **no XP at all**. You get the Air talisman back, 1 QP, and essence-mine teleports from Sedridor and Aubury.

## Routing notes

- Both Wizard Tower quests use the same basement. On one trip you can give Sedridor the talisman and take the skull, but only if the ghost talk (stage 3) is already done.
- After that trip: go to the coffin, then Varrock (Aubury twice, plus the bank with the pot, bucket and 8 coins), then back to Sedridor.
- Cook's and Sheep can share one loop that needs 0 coins:
  1. Kitchen pot.
  2. Cellar bucket.
  3. Shears at 3152,3306, by the mill.
  4. Wheat, then hopper, then flour bin.
  5. Egg and cow by the chicken pen.
  6. Sheep pen.
  7. Castle wheel on plane 1.
  8. Fred.
- Giant spiders (level 2, aggressive to combat 4 or lower, huntrange 1) sit at 3200,3238 and 3203,3239, just north of the castle.
