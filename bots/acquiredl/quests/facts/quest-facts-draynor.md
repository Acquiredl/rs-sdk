# Quest facts: Ernest the Chicken, Imp Catcher, Witch's Potion

Source: `server/content` scripts, configs and maps, read 2026-10-19. Coords are (x, z, plane). Every chat or mesbox screen is click-to-continue; only the listed choices need a click. Bit = 1 means the lever is down. Aggression rule (engine `Npc.ts`): a "cowardly" NPC hunts you only if your combat level is at most 2 × its level. NPCs with no `huntmode` never attack first.

## 1. Ernest the Chicken (`%haunted`, `%haunted_manor_fountain_poisoned`, `%ernestlever`)

**Stages**
| `%haunted` | Set by | Journal |
|---|---|---|
| 0 | none | Talk to Veronica outside Draynor Manor. No requirements. |
| 1 | Veronica, choice 1 | Find Ernest, who went into the manor. |
| 2 | Oddenstein, first talk | Ernest is a chicken. Bring Oil can, Pressure gauge, Rubber tube (each is struck through while carried). |
| 3 | Oddenstein, with all 3 items | Complete. |

`%haunted_manor_fountain_poisoned` goes 0→1 when Poisoned fish food is used on the fountain, and it is permanent. `%ernestlever` holds the six lever bits (A=0 … F=5). It is perm, so it survives logout, and it resets only when you climb the basement ladder up.

**NPCs**
- **Veronica**: (3110, 3330, 0), standing in the grounds' gate gap, wander 2. Op: Talk-to.
- **Professor Oddenstein**: (3110, 3367, 2), wander 2. Op: Talk-to.
- **Ernest** (a chicken, no ops): (3110, 3366, 2).

**Dialogue**
1. Veronica: "Aha, sounds like a quest. I'll help." (stage 1)
2. Oddenstein: "I'm looking for a guy called Ernest." then "Change him back this instant!" (or "I'm glad Veronica didn't actually get engaged to a chicken."). This sets stage 2 and ends the conversation.
3. Talk to Oddenstein again with all three items: no choices. Turn-in and reward follow.

**Items.** None of these sources checks the quest stage, so all can be collected before talking to Veronica. They are ground spawns except where noted.
- **Spade**: (3120, 3359, 0), in the manor storeroom. Other spades: (2981, 3369, 0) in Falador, and (3218, 3412, 1).
- **Key** ("Key", `closet_key`): from the **Compost heap** at (3084, 3360), 2x2, in the west garden. Its "Search" op only gives "I'm not looking through that with my hands!", so **use the Spade on the heap**. You get a key only if you hold none and the quest is not complete.
- **Rubber tube**: (3111, 3367, 0), inside the closet. The closet **Door** is at (3107, 3367), on the east wall of that tile. Its "Open" op says "The door is locked." from **both sides**. Use the Key on it to enter, and again to leave. The key is not consumed. A **Skeleton** (level 25, HP 17, huntrange 1) spawns at (3110, 3367), right beside the tube, and it is aggressive to combat 5.
- **Poison**: (3097, 3366, 0), in a small store off the kitchen. Its Door (3099, 3366) is entered from the north. The kitchen holds a passive Witch (level 25).
- **Fish food**: (3108, 3356, 1). On floor 1, go through the Door at (3116, 3361) from the north.
- **Poisoned fish food**: use Poison on Fish food, either order.
- **Pressure gauge**: the **Fountain** at (3087, 3334), 2x2, op "Search". Searching before you poison it costs 1 HP and gives no gauge. Use Poisoned fish food on it, then Search. You can hold only one gauge at a time.
- **Oil can**: (3092, 9755, 0), in the lever basement (below).

**Manor routing** (checked with collision BFS)
- **Front "Large door"** at (3108/3109, 3353), op "Open". It opens only when the player's z ≤ 3353, which is outside, on the *south*. From inside it says "The doors won't open."
- **Back "Door"** at (3123, 3360), `hauntedbackdoor`, is an ordinary two-way door. From outside, stand at (3123, 3361). **Use it for both entry and exit.** Outside route from the gate: go north up the middle, then east along z ≈ 3352, then north along x ≈ 3127–3129, then west at z 3362.
- Rooms from the back door:
  - The storeroom (spade) leads through Door (3119, 3356) to the east-wing corridor.
  - The corridor wraps round the north hall (z 3369–3373). It also holds "Stairs" Walk-Down at (3115, 3357), the crypt, which is not needed.
  - From the corridor:
    - Door (3106, 3368) leads south to the central hall, with the "Staircase" Walk-up at (3108, 3363) and the closet door.
    - Door (3101, 3371) leads west to the kitchen.
    - Door (3103, 3363) leads south to the bookcase room.
  - The entrance hall joins the central hall through Door (3109, 3358).
- **Floor 1**: walk west from the stair landing (about (3108, 3366)) to the "Staircase" at (3104, 3362, 1), op Climb-up. That reaches floor 2 at (3105, 3364). Go through Door (3108, 3364, 2), then reach Oddenstein.
- **Secret room**: Search either "Bookcase" at (3097, 3358) or (3097, 3359) from the **east** side. From the west it silently does nothing. You are moved to (3096, 3358). Inside, "Ladder" (3092, 3362) Climb-down goes to the basement at (3116, 9754). To get out, use "Lever" (3096, 3357) Pull, which puts you at (3098, 3358). The script has a "todo: borked" note on the bookcase's door animation; the teleport itself runs (confidence: medium).

**Basement lever puzzle.** Levers have ops Pull and Inspect; Inspect reports up or down. All doors are named "Door", op "Open", and walk you through. The map gives one start room (old rooms 7 and 8 together) and one east room (old rooms 1 and 4 together).

A BFS over the scripted door rules gives this shortest solution:
1. In the start room: Lever A (3108, 9745) down, Lever B (3118, 9752) down.
2. Door (3108, 9758) to the east room. Lever D (3108, 9767) down.
3. Door (3105, 9760) to the centre room, then Door (3102, 9758) back to the start room. You cannot return through (3108, 9758): it needs D up.
4. Lever A up, Lever B up.
5. Door (3102, 9758), then Door (3100, 9760), then Door (3097, 9763) to the NW room. Lever E (3097, 9767) down, Lever F (3096, 9765) down.
6. Door (3100, 9765), then Door (3105, 9765) to the east room. Lever C (3112, 9760) down.
7. Door (3105, 9765), then Door (3100, 9765) to the NW room. Lever E up.
8. Door (3100, 9765), then Door (3102, 9763), then Door (3102, 9758) to the start room.
9. Door (3100, 9755) to the SW room. Take the Oil can. Go back through Door (3100, 9755).
10. "Ladder" (3117, 9754), Climb-up, lands at (3092, 3361). Then Pull the lever to leave the secret room.

Final state: A up, B up, C down, D down, E up, F down. The basement has passive rats and spiders.

**Dangers in the grounds**
- **"Tree" NPCs** (`nasty_tree`): huntrange 1, aggressive at any level, no attack op, strength 20, so they likely hit 2–3 (medium).
  - Positions: (3103, 3347), (3107, 3337), (3107, 3342), (3107, 3344), (3108, 3346), (3111, 3339), (3111, 3348), (3115, 3344), (3120, 3344), (3122, 3335).
  - Walking north from the gate: x = 3109 is clear except at z 3346. Shift to x = 3110 for z 3345–3347.
- **Vine zone**: x 3112–3121, z 3336–3345. It does 1 damage every 5 ticks while you stand in it.
- Giant spiders (level 2) do not hunt combat 5. Ghosts on floor 1 are passive.

**Rewards**: 4 QP and 300 coins. No skill requirements.

## 2. Imp Catcher (`%imp`)

**Stages**
| `%imp` | Set by | Journal |
|---|---|---|
| 0 | none | Talk to Wizard Mizgog in the Wizards' Tower. |
| 1 | Mizgog | Kill imps for the black, red, white and yellow beads (each struck through while carried). |
| 2 | Mizgog, with all 4 beads | Complete. |

**Wizard Mizgog**: (3103, 3163, 2), wander 0, op Talk-to.
- Start: "Give me a quest!" then "Give me a quest please."
- Turn-in: talk with all four beads; there are no choices.

**Route** (checked with BFS)
1. Tower "Door" (3109, 3166), entered from (3109, 3167).
2. Diagonal "Door" (3107, 3162) into the west room.
3. "Staircase" (3103, 3159, 0), Climb-up.
4. "Staircase" (3103, 3159, 1). Use **op2 Climb-up**; op1 "Climb" asks up or down.
5. You arrive at (3104, 3161, 2), in the same room as Mizgog.

The wizards on the ground floor and floor 1 are passive, level 9. The **Lesser demon** (level 82, aggressive) is in a 12-tile pen at (3108–3112, 3156–3158, 2) that does not connect to Mizgog's room.

**Imp** (`imp`): level 2, HP 8.
- Attack, strength and defence default; every bonus is −42.
- Never aggressive, and `givechase=false`. Respawn is 100 ticks.
- **Teleports up to 20 tiles:**
  - on a timer (70 ticks after spawn, then every 50–200 ticks), with a 50% chance each time, when it has been out of combat for 8 ticks;
  - on **10% of hits that leave it alive, misses included**.
- With max hit 1, expect most fights to be broken off.

**Drops.** Each kill rolls `random(128)`, and nothing drops unless you dealt the most damage.
- Ashes are always dropped.
- Black bead 0–4, red 5–9, white 10–14, yellow 15–19: **5/128 ≈ 3.9% each**.
- Beads land on the ground and last 200 ticks.
- Beads are tradeable, are not tied to the quest, and can be banked early.
- The expected number of kills to collect all four is **≈ 53**.

**F2P imp spawns.** There are 47 in all maps; they wander 25 tiles.
| Area | Spawns |
|---|---|
| Lumbridge | (3217, 3226) by the castle; (3214, 3281); (3240, 3307); (3299, 3273) |
| Draynor | (3073, 3250), village: 1 |
| Falador | (2951, 3360); (2947, 3329); south farm cluster of 3 at (3009, 3307), (3011, 3314), (3015, 3314); (2941, 3236) north of Rimmington |
| Varrock | (3177, 3405); (3238, 3390); (3246, 3458); north cluster of 3 at (3213, 3502), (3234, 3506), (3261, 3514) |
| Also | Champions' Guild area (3205, 3355); Edgeville 4: (3073, 3498), (3078, 3499), (3078, 3461), (3134, 3487) |

**Rewards**: 1 QP, 875 Magic XP (`stat_advance 8750` in tenths), Amulet of accuracy. No requirements. Partial bead hand-ins are refused.

## 3. Witch's Potion (`%hetty`)

**Stages**
| `%hetty` | Set by | Journal |
|---|---|---|
| 0 | none | Speak to Hetty in Rimmington. |
| 1 | Hetty | Bring an onion, a rat's tail, burnt meat, an eye of newt (each struck through while carried). |
| 2 | Hetty, with all 4 | Drink from the cauldron. |
| 3 | Drinking from the cauldron | Complete. |

**Hetty**: (2968, 3206, 0), inside her house. The Door is at (2965, 3206) on the west wall. The **Cauldron** at (2967, 3205) has op "Drink From".
- Dialogue: "I am in search of a quest." then "Yes help me become one with my darker side."
- Turn-in: talk with all four items. There are no choices, and the items are taken.
- Then use "Drink From" on the Cauldron.

**Items**
- **Onion**: the loc "Onion" has op **2** "Pick" and no op1. It respawns after 50 ticks.
  - Rimmington field: 15 onions at x 2946–2954 (even x) and z 3249/3251/3253, unfenced.
  - Lumbridge farm: 12 onions at (3188–3191, 3266–3268), fenced, with "Gate" (3186, 3268/3269) on the west side.
- **Rat's tail**: dropped only by NPC type `rat` ("Rat", level 1, HP 2, passive). Giant rats do not drop it.
  - It drops 100% of the time, as a ground item, only while `%hetty` is 1 or 2, and only if you have no tail in your inventory or bank.
  - Rats: Rimmington storeroom, 4 rats at (2953–2960, 3202–3205), Door (2956, 3205) entered from the north; west of Lumbridge castle, 4 rats at (3191–3197, 3204–3206); Port Sarim, 5 rats at (3011–3015, 3182–3194); Draynor Manor, (3099, 3366) and (3101, 3355), plus 8 in the basement.
- **Burnt meat**: needs raw beef or raw rat meat.
  - A giant rat ("Giant rat", level 3, passive; 4 of them at (3192–3197, 3201–3207) west of Lumbridge) drops raw rat meat 100%. Cows (level 2, passive) drop raw beef 100%.
  - Use the meat on the Lumbridge castle range at (3212, 3215), `cooksquestrange`. At Cooking 1 it cooks with about 54% chance and burns otherwise.
  - **Using Cooked meat on any range or fire always gives Burnt meat** (table row `cooking_burn_meat`, chance 1/1). So two uses at most.
  - Raw chicken gives *burnt chicken*, which does not count.
  - Hetty also has an outdoor range at (2970, 3209), used from (2970, 3210).
- **Eye of newt**: Betty at (3012, 3259), Port Sarim, "Betty's Magic Emporium". Op3 Trade, or Talk-to then "Can I see your wares?". **3 gp**, stock 300. There are no F2P ground spawns.

**Rewards**: 1 QP, 325 Magic XP. No requirements.

## Cross-quest notes for a 0-coin bot at (3222, 3219)
- **Order**: do Ernest first. Its 300 gp pays for the eye of newt.
- **Start Witch's Potion before killing rats.** Burnt meat, onion and eye of newt can be gathered first.
- Ernest's items can be gathered before Veronica. Oddenstein must still be talked to twice: once at stage 1, then the turn-in at stage 2.
- **No partial deliveries** in any of the three quests: everything must be in the inventory at once.
- **Repo note `learnings/draynor-manor.md`:**
  - Confirmed: the one-way front door, the escape doors (3119, 3356) and (3123, 3360), and the crypt stairs (3115, 3357) to (3077, 9771).
  - Wrong: it calls the outside the "north" side. The door opens from the **south**.
  - Missing: it does not say that the back door works from outside, which makes the front door unnecessary.
