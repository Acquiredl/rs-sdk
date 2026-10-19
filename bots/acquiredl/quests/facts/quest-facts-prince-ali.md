# Prince Ali Rescue: server facts

Sources: `scripts/quests/quest_prince/`, `area_alkharid/scripts/{hassan,osman,border_gate}.rs2`, `area_draynor/scripts/{leela,lady_keli,joe_guard,prince_ali,ned,aggie}.rs2`, maps `m48_50`, `m51_49`, `m51_50`. Coordinates are (x, z, plane).

## 1. Stages (`%princequest`)
| val | set by | journal |
|---|---|---|
| 0 | none | Speak to Hassan in Al-Kharid Palace |
| 10 | Hassan, option 1 | Go and speak to Osman |
| 20 | Osman, "Okay, I better go find some things." | Talk to Leela, plus a checklist (key, rope, skin paste, skirt, wig) that strikes each item **held in the inventory** |
| 30 | Leela, while holding Bronze key + blonde Wig + Pink skirt + Paste (rope NOT needed) | Deal with the Guard, find his weakness |
| 40 | Joe drinks 3 beers | Deal with Lady Keli using rope |
| 50 | Rope used on Lady Keli | Free the prince and give him the disguise |
| 100 | Prince takes the disguise and key | Return to Hassan |
| 110 | Hassan pays | QUEST COMPLETE |

`%prince_keystatus`: 0 = none, 1 = Osman took the print and bar, 2 = Leela handed over the key. If the key is lost, Leela sells a new one for 15 coins on the spot. Osman also takes 15 coins but sets the status back to 1, so you then collect the key from Leela.

## 2. NPCs (spawn; every one has op1 Talk-to)
- **Hassan** (923): (3302,3163,0), inside the Al Kharid palace.
- **Osman** (924): (3286,3180,0), outside the palace to the NW.
- **Leela** (915): (3113,3263,0), N of the Draynor jail. Wanders up to 5 tiles.
- **Ned** (918): (3100,3258,0), in his Draynor house.
- **Aggie** (922): (3086,3259,0), in her Draynor house.
- **Lady Keli** (919): (3128,3244,0), inside the jail. respawnrate 100 ticks (~60 s).
- **Joe** (916): (3123,3245,0), inside the jail, just N of the cell door.
- **Prince Ali** (920, `prince_ali_prison`): (3123,3242,0), inside the cell. Wanders 2 tiles.
- **Border Guard**: `borderguard1` (925) at (3267,3226) and (3267,3229) on the Lumbridge side; `borderguard2` (926) at (3268,3226) and (3268,3229).
- **Bartender** (every pub uses this name; a beer costs 2 coins and each conversation buys one):
  - Rusty Anchor, Port Sarim (3045,3257): "Could I buy a beer please?"
  - Blue Moon, Varrock (3226,3399): "A glass of your finest ale please."
  - Dancing Donkey (3268,3393): "Yes please!"
  - Jolly Boar (3277,3488): "I'll have a beer please."

**Toll gate.** Talk to a Border Guard, or Open the Gate while standing next to a guard (`border_gate_toll_left/right` at (3268,3227) and (3268,3228)). The choices are "No thank you, I'll walk around." / "Who does my money go to?" / "Yes, ok.". The toll is 10 coins each way. It becomes **free from stage 100**, before the reward is claimed.

## 3. Dialogue paths (option labels are verbatim)
- **Hassan (stage 0):** "Can I help you? You must need some help here in the desert." sets stage 10. "It's just too hot here. How can you stand it?" gives a **free Jug of water** if you have a free slot. That option repeats while the stage is 0.
- **Osman (stage 10):** "What is the first thing I must do?" (or "What is the second thing you need?"), then "Okay, I better go find some things." sets stage 20.
- **Ned, wig (stage 20 to 99 only):** "Ned, could you make other things from wool?", then "How about some sort of wig?", then "I have that now. Please, make me a wig." Needs 3 Ball of wool; that last option only appears with 3 or more. Gives a grey **Wig** (id 2421).
- **Ned, rope (any stage):** "Yes, I would like some rope.", then "I have some balls of wool. Could you make me some rope?" (shown only with 4 or more wool, uses 4), or "Okay, please sell me some rope." (15 coins). Watch out: the sell option is listed first, even when you carry wool.
- **Aggie, yellow dye (any stage):** use an Onion on Aggie (needs 2 Onion and 5 coins).
- **Blonde wig:** use the Yellow dye on the Wig (either direction works). Message: "You dye the wig blonde." The result is a Wig with **id 2419**; both wigs have the display name "Wig".
- **Aggie, skin paste (stage 20 to 99 only):** "Could you think of a way to make skin paste?" (the first of 5 options), then "Yes please. Mix me some skin paste." It needs Redberries + Pot of flour + Ashes + (Bucket of water or Jug of water) and **no coins**. One of each is consumed, and **the pot and the bucket/jug are not returned**; a bucket is used before a jug. Result: **Paste**.
  - Never pick "You mad old witch, you can't help me.": it fines 5 coins (21 to 100 held), 20 coins (101+), or takes your Pot of flour.
- **Soft clay:** use Clay with a Jug, Bucket or Bowl of water (either direction). You get Soft clay and the empty container back.
- **Lady Keli, imprint (stage exactly 20, Soft clay in the inventory):** "Heard of you? You are famous in RuneScape!", then "What is your latest plan then?", then "Can you be sure they will not try to get him out?", then "Could I see the key please?", then "Could I touch the key for a moment?". That last option only appears at stage 20 with soft clay; otherwise she says "run along". The clay becomes a **Key print**.
- **Osman (stages 20 to 50, keystatus 0):** talk to him while holding the Key print + Bronze bar; both are taken. Using either item on him at stage 20 also works.
- **Leela:** one talk does three things in order: (a) hands over the **Bronze key** if keystatus is 1; (b) charges for a lost key; (c) at stage 20, if the inventory holds key + blonde wig + Pink skirt + Paste, sets stage 30. All of this can happen in a single conversation.
- **Joe (stage 30):** "I have some beer here, fancy one?" (or use a Beer on him).
  - He drinks 1, then takes 2 more only if **at least 2 are still held**, which sets stage 40.
  - With 1 or 2 beers, one is drunk and **wasted**, and nothing changes.
  - Before stage 30, using a beer on him is refused and the beer is kept.
  - The drunk state never wears off; it is just the stage value.
- **Tie Keli:** use the Rope on Lady Keli at stage 40. This consumes the rope, removes Keli and sets stage 50. At stages 10 to 30 you get "You cannot tie Keli up until you have all equipment and disabled the guard!" and keep the rope. Re-tying with another rope works at stage 50.
- **Cell door:** use the Bronze key on the **Prison Door** at (3123,3243) **while standing north of it** (z ≥ 3244, e.g. 3123,3244). This teleports you into the cell and you keep the key.
  - If Lady Keli is **within 10 tiles** (she respawns ~60 s after being tied) or the stage is ≤ 40, it fails with "You'd better get rid of Lady Keli before trying to go through there."
  - Open from outside gives "The door is locked."; Open from inside works freely.
- **Prince Ali (stage 50):** Talk-to, holding the **Bronze key + blonde Wig + Pink skirt + Paste**. All four are taken, stage 100 is set, and he vanishes. If any item is missing, three chat lines play and then **it stops silently**. Using the skirt, wig or paste on him does the same thing.
- **Hassan (stage 100):** Talk-to pays the reward.

## 4. Items (exact names; prices at full shop stock)
- **Ball of wool** ×3 for the wig, +4 for rope instead of paying 15 coins.
  - Use Shears on a Sheep in Fred's field (3193–3210, 3259–3274).
  - Spin it at the Spinning wheel (op Spin) at (3209,3212,1) in Lumbridge castle.
- **Onion** ×2: Onion loc, op Pick, at Fred's farm (3188–3191, 3266–3268), 12 plants that respawn in 50 ticks. Also in Rimmington (2946–2954, 3249–3253).
- **Redberries** ×1: **this version has no bushes.** Ground spawns at (3267,3371), (3271,3366) and (3278,3374) SE of Varrock. Wydin's Food Store in Port Sarim (Wydin at 3014,3204) sells them for 3 coins, stock 1.
- **Pot of flour:** Wydin, 10 coins (stock 3). Or use the mill:
  1. Pick Wheat at (3158–3160, 3297–3305).
  2. Climb the Ladder at (3164,3307) to plane 2.
  3. Use the Grain on the Hopper at (3166,3307,2), then Operate the Hopper controls at (3166,3305,2).
  4. Use the Flour bin at (3166,3307,0) (op Empty) while holding a Pot.
  - A Pot lies on the Lumbridge kitchen floor at (3210,3212).
- **Water:**
  - A Jug lies on the floor at (3212,3212) in the Lumbridge kitchen.
  - Buckets lie at (3225,3294) and (3307,3195).
  - The general store sells a Jug for 1 coin and a Bucket for 2.
  - Fill them at the Fountains (3221,3210) and (3221,3226), or the kitchen Sink at (3205,3215).
  - Hassan gives a free Jug of water, and one lies on the ground at (3302,3170).
- **Ashes:** no ground spawn in the area. Burn Logs: the fire burns 100 to 199 ticks, then Ashes stay on that tile for 100 ticks.
  - Logs lie at **(3089,3265) and (3089,3266), next to Aggie**, and on Lumbridge castle plane 2 at (3205–3209, 3224–3226).
  - Tinderbox: 1 coin at the Lumbridge general store (3209,3247).
- **Clay:** the "Rocks" are `clayrock1/2`, op Mine. Varrock SW mine at (3179–3183, 3371–3377); Rimmington at (2986–2987, 3239–3240).
- **Bronze bar:** smelt 1 Copper ore + 1 Tin ore at the Lumbridge furnace (3226,3255).
  - Varrock E mine: copper/tin at (3282–3290, 3361–3368).
  - Al Kharid mine: copper/tin at (3296–3302, 3314–3318).
- **Rope:** Ned, 15 coins or 4 wool. No shop in this region sells it.
- **Beer** ×3: 2 coins per pub (see section 2), or **3 free ground spawns at Barbarian Village**: (3077,3439), (3077,3443), (3080,3441). The barbarians there are not aggressive.
- **Pink skirt:** **needed.** Thessalia, Varrock west (3204,3417), op Trade, 2 coins. The Fancy dress shop owner (3281,3398) also sells it for 2 coins.
- **Coins:**
  - Minimum about 47: toll 40 for 4 paid crossings, yellow dye 5, skirt 2, using the free beers, wool, the mill and the ground berries.
  - Buying everything is about 90.
  - The general store pays about 40% of an item's cost, e.g. 3 coins for a Bronze bar.

## 5. Dangers, doors
- **Jail guard** (×4): level 26, 32 HP, aggressive melee within 5 tiles, max hit ~3 every 5 ticks.
  - Their hunt mode has `check_nottoostrong=off`, so **they attack at any level**.
  - Spawns: (3109,3237) and (3120,3238) south of the jail; **(3121,3249) and (3127,3248), 2 tiles from the jail entrance**. They wander up to 5 tiles and respawn in 60 ticks.
  - At combat 5 / 11 HP, bring food.
  - Talking to Keli at stage ≥ 50 makes her shout "Guards kill this stranger!!", and a guard within 7 tiles attacks.
- **Dark wizards** (levels 7 and 20, magic, attack combat 5) at (3223–3232, 3363–3374), on the Lumbridge to Varrock road. Detour around them.
- **Doors:**
  - Jail **Door** (3128,3246), north wall, op Open. **Prison Door** (3123,3243).
  - Aggie's Door (3088,3258); Ned's Door (3101,3258).
  - Palace **Large door** pairs at (3298,3171–3172), (3287,3171–3172) and (3292–3293,3167).

## 6. Rewards
700 coins, 3 quest points, free use of the toll gate. No XP.

## 7. Order
- **Any time:** wool (7), onions, yellow dye, Pink skirt, Soft clay, Bronze bar, Rope, Beers, Ashes, Pot of flour, Redberries, water, Hassan's jugs (stage 0).
- **Strict order:**
  1. Hassan (10).
  2. Osman (20).
  3. Wig (Ned) and Paste (Aggie); Keli imprint (stage = 20 only).
  4. Osman with print + bar.
  5. Leela: the key, then stage 30 if the 4 disguise items are held.
  6. Joe with 3 beers (40).
  7. Rope on Keli (50).
  8. **Within ~60 s:** key on the Prison Door, then Talk-to the Prince (100).
  9. Hassan (110).
  - That is 2 paid Al Kharid round trips; the third is free.
- **Batching with other quests:**
  - Sheep Shearer: shear 27 wool (20 + 7).
  - Cook's Assistant: use the mill twice with two pots; keep a separate bucket, since paste eats its water container.
  - Goblin Diplomacy: starts with the Rusty Anchor bartender ("Not very busy in here today, is it?"), the same bartender who sells beer. Aggie's dyes: yellow ×2 (4 onions), red ×1 (3 redberries), blue (2 woad leaves). Prince Ali needs a 4th redberry for the paste.
- **Don't** use a Pot of flour on water (it opens the dough menu and spends both).
