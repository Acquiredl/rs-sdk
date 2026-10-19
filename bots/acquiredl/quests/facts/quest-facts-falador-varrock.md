# Quest facts: Goblin Diplomacy, Doric's Quest, Romeo & Juliet

Source: `server/content` (scripts, pack, maps). Coordinates are world (x, z, plane). Aggression rule from the engine (`Npc.ts:1011`): an NPC with a huntmode attacks when the player's combat level is at most 2x the NPC's level. For the bot (cb 5), anything level 3 or higher with a huntmode is hostile. Default NPC wanderrange is 5.

Varp ids: `doricquest` = 31, `goblinquest` = 62, `rjquest` = 144.

---

## 1. Goblin Diplomacy (`goblinquest`, done = 6)

**Stages**
| Varp | Set by | Journal |
|---|---|---|
| 0 | - | Start by talking to the Bartender in Port Sarim |
| 1 | Bartender, "Not very busy in here today, is it?" | Investigate the goblins arguing over armour colour |
| 2 | General, option 3 | Bring Orange Goblin Armour |
| 3 | General, holding orange mail (consumed) | Bring Blue Goblin Armour |
| 4 | General, holding blue mail (consumed) | Bring Brown (plain) Goblin Armour |
| 5 -> 6 | General, holding plain mail (consumed); completes via queue | Quest complete |

**The bartender is mandatory.** At varp 0 both generals say three lines and end with "Go away, human, we busy." The stage switch has no case 0, so the conversation just stops. The generals alone cannot start it.

**NPCs**
- Bartender (`rustyanchor_bartender`), (3045, 3257, 0), Rusty Anchor in Port Sarim, wanderrange 0, Talk-to. Other NPCs named "Bartender" exist, so pick by coordinates. The inn doors at (3053, 3255) and (3053, 3259) spawn open.
- General Wartface (2957, 3511, 0) and General Bentnoze (2958, 3511, 0), both Talk-to, wanderrange 3. They are inside the hut behind a closed double "Large door" at (2957, 3509) and (2958, 3509).
- Aggie (3086, 3259, 0) in Draynor, Talk-to, wanderrange 1. Her house doors (3088, 3258) and (3092, 3255) spawn closed.
- Wyson the gardener (3027, 3379, 0) in Falador park, Talk-to.

**Dialogue path**
1. Bartender: "Not very busy in here today, is it?" sets varp 1. Avoid "Could I buy a beer please?".
2. Either general: three lines play, then pick "Do you want me to pick an armour colour for you?" (option 3) to set varp 2. Options 1 and 2 only loop back to the same menu.
3. Talk to a general again, once per hand-in, with no menu each time:
   - varp 2 + Orange goblin mail -> 3
   - varp 3 + Blue goblin mail -> 4
   - varp 4 + Goblin mail -> 5, then complete.

   All three mails can be carried at once. Three talks in a row finish the quest. Each talk first replays the generals' opening lines.

**Items**
- **Goblin mail** (obj 288, "Goblin mail"). It is not a ground spawn anywhere, and no crate or search gives it. The only source is NPC drops:
  - Goblin Village goblins (`goblin_greenarmour` and `goblin_redarmour`, "Goblin" lvl 5, HP 12, not aggressive, 21 spawns around x 2951-2964, z 3481-3514): **10/128 (7.8%)**.
  - Ordinary goblins (lvl 2, HP 5; east of Lumbridge at x 3244-3262, z 3218-3252, and at 3141-3146, 3227-3261) and armed goblins (lvl 5): **5/128 (3.9%)**.
  - The drop requires the bot to be the "hero" (it dealt the most damage). For 3 mails, expect about 38 village kills or about 77 kills of ordinary goblins.
- **Orange goblin mail** and **Blue goblin mail**: use the dye on the mail, or the mail on the dye. Both directions work. Message: "You dye the goblin armour orange."
- **Orange dye**: Aggie cannot make it. Use Red dye on Yellow dye (either way round); there is no skill requirement.
- **Aggie's dyes**, 5 coins each:
  - Red dye = 3 Redberries.
  - Yellow dye = 2 Onions.
  - Blue dye = 2 Woad leaves.

  Fastest route: **use the ingredient on Aggie**. That skips all menus and makes the dye if you have the items and 5 coins. Talking route: "Can you make dyes for me please?" -> "What do you need to make red dye?" -> "Okay, make me some red dye please." (same pattern for yellow and blue). **Never pick "You mad old witch, you can't help me."** It fines 5 coins (holding 21-100) or 20 coins (holding 101+).
- **Woad leaves** (Wyson only): "I'm looking for woad leaves." -> "How about 20 coins?" gives **2 leaves for 20 coins**. "How about 15 coins?" gives 1 leaf. The 5 and 10 coin offers are refused.
- **Redberries**:
  - Free ground spawns south-east of Varrock: (3267, 3371), (3271, 3366), (3278, 3374), each 1 berry, respawning about 60 s after pickup.
  - Shop: Wydin's Food Store in Port Sarim (Trade, op3), base 3 gp, stock 1.
- **Onions**: Pick option (op2) on the "Onion" loc.
  - Lumbridge field (3188-3191, 3266-3268) behind a closed Gate at (3186, 3268/3269), about 55 tiles from the start point.
  - Rimmington field (2946-2954, 3249/3251/3253).
- **Coins: 35 total** (20 for Wyson + 3 x 5 for Aggie). The bot has 0. Doric pays 180, so do Doric first.

**Rewards**: 5 QP, 200 Crafting XP, 1 Gold bar. No skill requirements.

---

## 2. Doric's Quest (`doricquest`, done = 100)

**Stages**
| Varp | Journal |
|---|---|
| 0 | Talk to Doric north of Falador |
| 10 | Bring 6 Clay, 4 Copper ore, 2 Iron ore (each line strikes through once you hold enough) |
| 100 | Complete; Doric's anvils are usable |

**Doric**: (2952, 3451, 0), Talk-to. His house doors (2949, 3450) and (2952, 3453) spawn closed. Doric's anvils at (2950, 3451/3452) are locked until the quest is done ("You must complete Doric's Quest to use this anvil."). Clicking an anvil with Doric nearby also opens his dialogue.

**Dialogue path**
1. "I wanted to use your anvils." -> "Yes, I will get you materials." sets varp 10. The anvil entry also works: "Sorry, would it be OK if I used your anvils?" -> "Yes, I will get you materials."
2. Talk again while holding **6 Clay, 4 Copper ore and 2 Iron ore, unnoted**. There is no menu. They are removed and the quest completes.
3. **Click through every line.** The 180 coins come after the "I can spare you some coins for your trouble." line. The completion is queued separately, so walking off mid-dialogue still completes the quest but loses the coins.

The ores can be mined before starting; mining is not gated by the quest. Taking all 12 items on the first visit means both talks happen in one trip. Clay must be raw "Clay", not soft clay.

**Mines** (every rock's display name is just **"Rocks"**, ops Mine and Prospect, so select by loc id or coordinates). Level requirements: clay 1, copper 1, iron 15. Mining 55 is fine. Rock respawn: clay 6 ticks, copper 10, iron 20.

- **Dwarven Mine via Ice Mountain (closest, about 70 tiles from Doric)**:
  - Entrance: Trapdoor (loc 1570, "Climb-down") at (3019, 3450, 0), inside a hut with doors at (3015, 3453) and (3016, 3453). It leads to a Ladder (3019, 9850, "Climb-up").
  - North cluster: Copper (2091) at (3030, 9825), (3030, 9826), (3033, 9828). Iron (2093) at (3032, 9826), (3033, 9825).
  - Clay (2108/2109) at (3028, 9808), (3030, 9809), (3030, 9810).
  - East cluster: Clay (2108) at (3053, 9818), (3054, 9819). Iron (2092) at (3053, 9822), (3054, 9828).
  - **Hazard: 13 Scorpions (lvl 14) and 2 King Scorpions (lvl 32), all aggressive to cb 5** (huntrange 2, wanderrange 12/8), spawning at x 3038-3056, z 9767-9802. The west clay rocks are within a scorpion's wander range. The north copper/iron rocks and the east clay/iron rocks are mostly beyond it.
- **Rimmington mine (about 210 tiles south)**: Clay (2986, 3239), (2987, 3240). Copper (2976-2979, 3245-3248), 5 rocks. Iron (2968-2971, 3237-3242) and (2981-2982, 3233-3234).
- **Varrock** (near the bank, about 300 tiles from Doric):
  - SW mine: Clay (3179, 3371), (3180, 3372), (3183, 3377). Iron (3175, 3366/3368), (3181, 3373). A Mugger (lvl 6, aggressive) spawns right there at (3175, 3361).
  - SE mine: Copper, 9 rocks at (3282-3290, 3361-3368). Iron (3285-3288, 3368-3370).
- Avoid the clay at (2937-2943, 3282-3285): aggressive Hobgoblins (lvl 28) roam x 2905-2920.

**Rewards**: 1 QP, 1300 Mining XP, 180 coins, anvil access. No skill requirement.

---

## 3. Romeo & Juliet (`rjquest`, done = 100)

**Stages**
| Varp | Set by | Journal |
|---|---|---|
| 0 | - | Start with Romeo in Varrock Square |
| 10 | Romeo | Speak to Juliet, west Varrock |
| 20 | Juliet (gives "Message") | Take the message to Romeo |
| 30 | Romeo | Find Father Lawrence |
| 40 | Father Lawrence | Find the Apothecary for a cadava potion |
| 50 | Apothecary | Find cadava berries / take them to the Apothecary / take the potion to Juliet |
| 60 | Juliet (potion consumed) | Tell Romeo |
| 100 | Romeo | Complete |

**Shortcut: Juliet can start the quest.** At varp 0 her menu includes "I guess I could find him." (option 3). It gives the Message and sets varp **20** directly, which skips the first Romeo visit. Romeo at 20 also deletes the message without checking you hold it.

**NPCs** (all Talk-to)
- Juliet: (3158, 3425, **plane 1**), wanderrange 5.
  - Ground-floor doors: (3155, 3428), (3155, 3433), (3160, 3432); closed.
  - Staircase (1722, "Climb-up") at (3156, 3435, 0).
  - Upstairs doors: (3156, 3431, 1) and (3159, 3427, 1); closed. She is in the south room.
- Romeo: (3211, 3425, 0) in Varrock Square, wanderrange 5.
- Father Lawrence: (3254, 3475, 0), Varrock church, wanderrange 3. The church's large doors spawn open.
- Apothecary: (3195, 3404, 0), SW Varrock. Door (3195, 3399) spawns closed; door (3192, 3403) spawns open.

**Dialogue path**
1. Juliet: "I guess I could find him." -> 20. Avoid "I think you could do better.", which ends the talk.
2. Romeo: no menu -> 30.
3. Father Lawrence: no menu -> 40.
4. Apothecary: no menu -> 50. Talk again holding Cadava berries to get a "Cadava potion" (1 berry used).
5. Juliet: no menu, potion handed over -> 60.
6. Romeo: no menu -> complete.

If you start with Romeo instead, pick "Can I help find her for you?", which gives varp 10 with no second menu.

**Cadava berries**:
- These are **ground items, not a bush**: (3266, 3361), (3273, 3375), (3277, 3370), each 1 berry, respawning about 60 s after pickup.
- There is no pickup gate and no gloves check (Lawrence's "you will need gloves" line is flavour only). **They can be taken before the quest.**
- The redberry spawns are in the same patch, so one detour covers both quests.

**Rewards**: 5 QP only (no XP, no items). No skill requirements.

---

## Dangers (hostile to cb 5)

- **Dark wizards, stone circle south of Varrock**:
  - 9 lvl 7 at x 3223-3232, z 3363-3374 (magic, huntrange 3, wander 3).
  - 2 lvl 20 at (3225, 3374) and (3230, 3365) (huntrange 5).
  - Keep x ≥ 3242 through z 3355-3382. The berry patch is about 35 tiles east.
- **Muggers** (lvl 6, huntrange 5, wander 12):
  - (3249, 3391), on the bank-to-berries walk.
  - (3175, 3361), at the Varrock SW mine.
  - (3018, 3185), south Port Sarim.
- **Giant rats** (lvl 6, huntrange 1): (3264, 3383) and (3266, 3381) next to the berry patch; also the Lumbridge swamp (x 3200-3215, z 3172-3195).
- **Bears** (lvl 19, huntrange 1, wander 12): (2965, 3465), (2966, 3474), (2967, 3480), (2979, 3501). These sit **on the walk from Doric to Goblin Village** and are the biggest threat to an HP 11 bot. Another bear at (3296, 3347) roams up to z 3359, south of the berries.
- **Monks of Zamorak** (lvl 17/22, huntrange 1): x 2931-2940, z 3514-3517, at the west edge of Goblin Village.
- **Highwaymen** (lvl 5, huntrange 5, wander 8): (3007, 3273) and (3009, 3280) on the Port Sarim to Falador road; (3110, 3295) north of Draynor.
- **Draynor dark wizards** (lvl 7): (3084, 3236) and (3085, 3238), about 8 tiles from Draynor bank. Pass at z ≥ 3246 heading to Aggie.
- **Jail guards** (lvl 26, line-of-sight aggressive) at x 3109-3127, z 3237-3249, inside the Draynor jail. The door at (3128, 3246) spawns closed.
- Not aggressive: all goblins, dwarves, Falador guards and knights. Giant spiders (lvl 2) are not a threat at cb 5.

## Ordering suggestions

- **Doric first**: about 2 minutes of mining for a fast 1 QP, 1300 Mining XP, and the 180 coins that pay for Goblin Diplomacy's 35-coin cost.
- Pick up the redberries and cadava berries in one stop south-east of Varrock.
- The onions (Lumbridge) can be picked any time.
- Woad leaves and Aggie need coins.
- The bartender must come before any general.
- The R&J berries can be held from the start.
