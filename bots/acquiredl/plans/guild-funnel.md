# Guild funnel: a capped guild of bots with a guildbank and a warehouse

Status: plan, drafted 2026-10-19 with the operator. Nothing built. Two ADR-grade
items wait for the operator to restate them in their own words before any code
(section 13). Market figures are a snapshot from 2026-10-20 UTC and will have moved.

## 1. The question

Run several bots at once under a credit cap, with cheap models doing the grinding
and dearer models doing the thinking. Then use that fleet to run guild experiments
where the personality mix is the variable and return per effort is the score. The
operator added, on 2026-10-19: a hard cap of 10 per guild, one shared end goal for
every guild, a weakest-link ground rule, a guildbank that collects tax and runs a
warehouse on the exchange, a 1,000,000 gold guild treasury as the prosperity goal,
loxodonta receipts travelling inside the knowledge that members share, and
(asked 2026-10-20) a replay and a story log after each run so the fun runs can
become a video.

## 2. What already exists

Nothing here is new infrastructure. The parts are in the repo and on the server.

| Part | Where | What it gives |
|---|---|---|
| Fleet of headless clients | `README.md` ("large fleets of many bots"), `server/webclient/src/lite/runner.ts` | One lite runner process per bot, reads `bots/<name>/bot.env` |
| Private gateway | `sdk/README.md`, "Private gateway for a fleet" | Fleet state stays local; bots do not appear on the server's public status page |
| Player-to-player trade | `sdk/API.md`: `bot.trade`, `bot.serveTrades`, `bot.offerTradeItems` | The item pipe. The docs' own example is a worker giving ore to a mule |
| Grand Exchange | `sdk/MARKET.md`: `bot.openGE`, `bot.placeGEOffer`, `bot.collectGE` | 6 offer slots per account, offers funded from the backpack (notes allowed), 5% seller fee burned |
| Public market API | `GET /api/market/items`, `/items/{id}`, `/items/{id}/history` on the game origin | Prices, bid and ask, volume, VWAP, history. No bot, no tokens |
| Bank | `server/content/scripts/interface_bank/configs/bank.constant` | 288 slots per account |
| Quests | `server/content/scripts/general/configs/quest.enum`, `player/interfaces/questlist.if` | Journal lists 68 (18 free, 50 members); the enum tracks 64. The 11 known quests are all free |
| Chat | `sdk/chat.ts`, `learnings/chat.md` | Public say and private messages. Ruling: public chat off until the prosperity gate |
| Run log | `bots/acquiredl/quests/runs-*.jsonl` | Per-step seconds, coins, notes. Needs a tokens field |
| Receipts | loxodonta, `supervisor.py` with `digest`, `show`, `timeline`, `verify`, `package` | A tamper-evident record of every Claude Code tool call, and a package format verified by `loxodonta verify-package` |
| Plan usage | the desktop app's usage card | 5-hour and weekly windows shared by every session |

Shared with strangers: trees, rocks, the exchange. The login server's comments
mention fleets reconnecting, so multi-bot play is expected on the demo server.

## 3. Cost model: the decision moment

Tokens are spent when a model thinks, not when a bot acts. A 20-minute woodcutting
script costs nothing while it runs. So the lever is how often any model is
consulted, and which one. The unit of cost is the decision moment.

Hourly cost = sum over bots of (decisions per hour x tokens per decision x rate).

API rates per million tokens (claude-api reference, cached 2026-10-06):

| Model | In | Out | vs Opus |
|---|---|---|---|
| Haiku 5.5 | $0.10 | $0.50 | 1/40 |
| Sonnet 5.5 | $2 | $10 | 1/2 |
| Opus 5.5 | $4 | $20 | 1 |
| Fable 5.1 | $10 | $50 | 2.5x |

Haiku is the lever. Sonnet barely is. Subscription weighting is not published;
API ratios are the proxy (medium confidence).

The ladder: script retry, then Haiku picks from a menu, then Sonnet changes a
parameter or reassigns, then Opus writes a new script. Each tier has a cap. A
gatherer that hits its hourly cap reruns its last script.

| Tier | Tokens in / out per decision | Cost per decision | 10 bots, 8 hours |
|---|---|---|---|
| Haiku gatherer, 3 decisions per hour | 1.5k / 300 | $0.0003 | $0.07 |
| Sonnet guildbank, 10 decisions per hour | 4k / 500 | $0.013 | $1.04 |

Two guilds of 10 for a day: about $2.20 at API rates, plus Opus escalations on
the Claude Code subscription.

Open decision (section 13): run the Haiku and Sonnet tiers through the API from a
daemon, or as Claude Code sessions. Sessions cost no extra dollars, are recorded
by loxodonta for free, but re-read a large context on every wake-up, hide the
per-decision token count, and share the 5-hour window with the operator's own
work. The API costs cents per hour and meters each decision exactly, which the
experiment's score needs, but loxodonta records none of it as things stand (section 6).

## 4. The charter

Rulings by the operator, 2026-10-19. The charter lives in `bots/guild/CHARTER.md`
once built, and every rule becomes a check in the daemon. Simplify, don't add:
no new layer in the SDK.

**Cap.** A guild holds at most 10 members, the guildbank included (assumption:
9 gatherers plus 1; the operator confirms). Scaling is by whole guilds: 10, 20,
30. Small groups over a fleet of 100.

**End goal, shared by every guild.** Progress every account (quests, skills,
equipment, trading), be a net positive to the server, and become a guild that
others recognise and can ask for help with tasks or trading. Once prosperous,
spend more time guiding and helping others.

**Ground rule: only as strong as the weakest link.** When a member lags the
guild average in quests, unlocks or equipment, the guild at minimum shares its
knowledge of how to get it done, and gives items or helps directly when that is
beneficial for the task. For bots, knowledge is a package (section 6) built from
a proven run, which costs nothing to hand over: the guildbank assigns the laggard
the package that worked for the others. Items and direct help cost the giver
time or gold, and "beneficial" is where personalities diverge. The rule has a
mandatory floor and a discretionary ceiling; personality lives in the discretion.

**Tax.** Each member pays a charter rate on each run's gains to the guildbank,
in kind (ore, bars, logs) valued at exchange VWAP. Anything above the rate is a
voluntary contribution and is the member's personality speaking. Same floor and
ceiling shape as the ground rule.

**Prosperity gate.** A guild treasury threshold. Crossing it switches the time
split from inward (own progress, lift the floor) to outward (help others), and
unlocks public chat as a deliberate experiment with loxodonta watching. Before
the gate, "others" means the other guild, over private messages and trade.

**Net-positive guards.** The warehouse never holds more than a set share of an
item's listed supply. It never cancels bids to crash a price. A gatherer that
finds a stranger already on a resource moves on. A floor is a service; a corner
is not.

Rule to check:

| Rule | Check in the daemon | Data, zero tokens |
|---|---|---|
| Cap | Refuse an 11th member; a second guild is a second charter instance | Member list |
| Weakest link | Ledger snapshot per run; lag detector per dimension against the guild mean; response ladder: assign package, give item, help directly, each gated by the beneficial test | Quests via the game's own tracking, skill levels, equipment, gold, from `sdk.getState()` |
| Tax | Scripted trade to the guildbank at the charter rate after each run | Run delta valued at VWAP from the market API |
| Prosperity gate | Treasury against threshold; flips the time split and the chat flag | Guildbank's bank value |
| Net-positive | Listed-supply share before each quote; no bid cancel on a falling price; stranger-on-resource check | Market API; `sdk.findNearbyPlayer` |

## 5. Roles

- **Gatherers (Haiku).** Run proven scripts for a fixed stint. At script end or
  failure, one decision moment: run summary, personality card, menu of moves
  (run again, bank, pay tax and hand over goods, sell to a shop, escalate).
- **Guildbank (Sonnet).** Treasury, warehouse, exchange desk, and task
  assignment. Serves incoming trades, smelts or fletches, quotes on the exchange,
  restocks, assigns knowledge packages. Decision moments are fewer and richer:
  quote, restock, give, assign.
- **Opus tier (a Claude Code session).** Never touches a bot during a run.
  Designs the experiment, writes a new script when a gatherer escalates "no
  script for this", builds the knowledge package from a proven run, does the
  post-mortem.
- **The daemon (TypeScript, zero tokens).** Runs scripts for N bots, keeps the
  ledger, runs the lag detector, writes the task board, calls the cheap tiers
  for decision moments, appends to a jsonl, writes escalations to a file the
  Opus session picks up.

Personality cards: five lines in the decision prompt plus a bias on the menu and
on the beneficial test. Greedy refuses trades under exchange price and gives
knowledge but not items. Sharing gives above the tax. Cautious never escalates.
Explorer escalates often.

## 6. The knowledge package

What a lagging member receives, and what every proven run leaves behind. One
folder per task and giver under `bots/guild/book/<task>/<giver>-<date>/`. The
tree is the guild's book; packages for the same task accumulate from different
givers, and the daemon prefers the most recent proven one.

| Piece | File | Consumer | What it answers |
|---|---|---|---|
| The script | `script.ts`, or a pointer into `bots/acquiredl/quests/` | the daemon | How to do it, executable. Zero tokens when it runs clean |
| The run record | `run.jsonl`, the successful run's steps from `runs-*.jsonl` | the daemon for success criteria and expected timings; a model on failure | What good looks like: seconds per step, coins, notes |
| The notes | `notes.md`, the post-mortem for that task | a model on escalation | The why: where it stuck, what fixed it, the traps |
| The receipts | `receipts/`, a loxodonta package of the giver's run (`supervisor.py package`), plus its budget-capped digest | a model on escalation; anyone auditing | What actually happened, step by step, tamper-evident. The receiver diffs its own trace against the giver's to find where it diverged |
| The manifest | `manifest.json`: task, giver, date, levels at start, duration, success criterion, receipt chain addresses | the daemon and the ledger | Who gave what, when. This is the ledger's help event |

Two consumers, two costs. The daemon runs the script, so transfer costs zero
tokens on the happy path. A model reads the notes and the receipts only on
failure, digest first, then `timeline` and `show` around the step where its own
run diverged. Raw chains never go into a prompt.

Sharing is a file handoff, not a conversation. No chat is needed for a member to
receive knowledge. An in-game line ("try the north door") is roleplay flavour
after the gate, not the mechanism.

Receipts carry three constraints:

- **loxodonta records Claude Code tool calls.** A daemon driving bots through
  the API produces no receipts unless loxodonta grows a way for a process to
  emit them. That is loxodonta work and the operator's call, and it is now a
  term in the API-versus-sessions decision (section 13).
- **An `execute_code` receipt carries only the tool name today**; the fix is
  held by the operator pending a security question. Packages should be built
  from script runs launched through Bash (`bun bots/...`), whose receipts carry
  the command.
- **Packages stay local.** The repo README promises receipt packages of real
  runs, and receipt entries contain local paths that include the machine's user
  name. Before any package is published, confirm that `supervisor.py package`
  redacts paths the way `export` says it does. Unverified as of 2026-10-19.

Metrics the package adds: knowledge packages given and received per
personality, and package reuse success (did the script run clean for the receiver).

## 7. Replay and story log

After each run the operator can replay what happened or read a summary, and
runs that turned into stories are indexed for a video later. Three layers, from
free to cheap, built on what the quest scripts already write.

**Worked example, from iteration zero.** At the Wizard Tower the basement ladder
climb failed, the planner routed to the basement's coordinates on the surface,
and the bot walked 800 tiles into the deep Wilderness, then back to Varrock at
3 of 13 health, and ate. Under this section that run leaves: an events file with
`climb_failed`, `route_planned` (800 tiles, north), `hp_low` (3/13), `ate`, and
a `recovered` event with the walk time; a replay that prints those events in
order beside the run notes and the receipt rows for the same minutes; a summary
written at run end by the model that ran the bot, in the bot's personality
voice, with a story score of 5 and the pitch "walked 800 tiles the wrong way and
came back on 3 health"; and one line in the story index pointing at the
summary, the screenshots, and the receipt addresses.

**Layer 1, events, zero tokens.** The daemon and the scripts append typed events
to `events-<bot>.jsonl`, next to the existing `runs-<bot>.jsonl`. The vocabulary
is fixed and small: run start and end (the run record already has these), quest
step and quest complete, level up, death with the loot lost, item lost, trade
completed, exchange fill, escalation, help event given or received, screenshot
taken (path), and chat received. The `record()` and `note()` helpers in
`bots/acquiredl/quests/lib.ts` are the seed; this adds `event(type, data)`.
Every event carries the bot, the tick, the position, and the loxodonta session
id, so a replay can cross-link to the verifiable record.

**Layer 2, replay, zero tokens.** `bun bots/guild/replay.ts <bot> [from] [to]`
prints a timeline: events merged with the run notes, the receipt rows for the
same window from `supervisor.py timeline`, and the screenshots taken in it.
`bots/acquiredl/quests/runs_table.ts` is the seed. Later, and only if the stories
earn it, an HTML page that plays the position trace over the map, which needs no
game client and can replay any past run.

**Layer 3, summary, one decision moment per run.** At run end the tier that ran
the bot writes `summary` into the run record: three lines always, what was
attempted, what happened, the numbers. When the run holds a flagged event (a
death, a quest complete, an escalation, a route into the Wilderness, a trade
above a size, or anything the card finds surprising) it writes a longer
narrative in the bot's own voice and sets `story: {score, pitch}`. The
personality card is the narrator: a greedy bot tells its death as a robbery, a
cautious one as a lesson. That voice is the video.

**Story index.** `bots/guild/STORIES.md`, one line per story at or above the
threshold: date, bot, score, pitch, and links to the summary, the screenshots,
and the receipt addresses. The daemon appends it; the operator skims it. It can
be seeded today from the lab logs: the Wilderness walk, the two Draynor deaths
with their loot lists, the Imp Catcher hunt for the white bead.

**Visuals.** The lite client answers a screenshot request with an empty image
(`server/webclient/src/lite/runner.ts`, `screenshot_response`), so headless
members produce no pictures. Iteration 1's 73 journal screenshots came from a
rendering client. Three ways up, as a panel:

| Visuals | Low | Default | High |
|---|---|---|---|
| Source | Screenshots from whichever bot sits on a browser client, as iteration 1 did | A camera account outside the guild, on a browser client, that follows the bot in a story in progress (Follow is player option 3) and snaps on events | An HTML replay rendered from the position trace and events, no client needed |
| Video path | Stills | Screen-record the camera client | Record the replay page |

The camera is not a guild member and does not count against the cap. Medium
confidence that Follow holds at range; it needs the camera near the protagonist.

**Chat.** Other players' lines are story material and a prompt-injection
surface. The quest-loop ruling says chat stays untouched. Proposed, for the
operator to rule on: log received chat to the local events file only, never into
a prompt, never into a committed file. The summary model never sees it.

**Cost.** Twenty bots at three runs an hour, three-line summaries on Haiku:
about $0.02 an hour. Long narratives only on flagged runs. A story is a return
too: the project's ratified aim is fun and exploration, so stories flagged per
guild per day sits beside return per effort in the scores table.

**Opsec before any video.** Screenshots show the chat box and other players'
names, and receipt entries hold local paths. The operator reviews every frame
and package before publishing; bot names stay on the alias pattern.

## 8. The warehouse

The treasury backs a stockpile of commonly traded goods that the guildbank sells
on the exchange, a floor to the market, in one skill line to start. The
operator's example is mining and smithing: ores, bars, pickaxes, related gear.

Snapshot of the demo exchange, 2026-10-20 UTC. Seven-day gross across the whole
exchange: 2.2 billion gold, 74 active items of 1,443 tradeable. A 1,000,000
treasury is a small guild in a large economy.

| Item | Price 7 days earlier | Price at snapshot | Bid / ask | Daily volume at snapshot | Listed sell value |
|---|---|---|---|---|---|
| Coal (id 453) | 172 | 80 | 80 / none | tens to a few thousand | 0 |
| Iron ore (id 440) | 105 | 114 | none / 112 | 60,000 to 150,000 | 8,200,000 |
| Steel bar (id 2353) | 1,500 | 700 | 700 / 1,469 | 800 to 1,250 | 1,100 |

Coal has buyers waiting and no sellers. Iron ore has sellers and no buyers.
Steel bars have a spread of more than double. Pickaxes and bronze bars have no
market at all.

**Niche rule.** The warehouse can floor an item only when the treasury covers
several days of that item's volume times price. Coal and steel bars qualify.
Iron ore does not: one day of it is about 9,500,000 gold and the open sell book
alone is 8,200,000. Iron ore is a cheap input, not a floor. High confidence on
the rule, medium on the items since the book changes daily.

**Worked example, the steel route.** A miner digs coal, which nobody sells. The
guildbank buys iron ore at the 112 ask, which everybody sells. A smelter makes
steel bars at Smithing 30 (one ore plus two coal). The guildbank sells at the
700 bid, or lists inside the spread and waits. After the 5% fee: about 553 gold
per bar with self-mined coal, about 1,300 at the earlier price. Acquiredl
reached Smithing 45 and Mining 55 in one day, so levels are not the constraint;
turnover is, at about a thousand bars a day absorbed.

| Steel bar price | Bars to reach a 1,000,000 treasury |
|---|---|
| 700 | about 1,800 |
| 1,500 | about 700 |

**Floor versus availability.** Standing bids are the floor: they cost capital
and stabilise prices. Standing asks are availability: they earn and are the
service others notice. The warehouse runs both; the spread minus the 5% fee is
the business. Six offer slots per account means the guildbank quotes at most
three items on both sides. Offers are funded from the backpack, so one trip
carries 28 stacks (notes allowed). 288 bank slots means stock is not the limit.

**Metrics.** Treasury growth per day, inventory turnover, share of niche volume,
spread captured per trade, stockouts (floor failures).

## 9. The experiment

A guild is up to 9 gatherers plus the guildbank under one charter. Every guild
has the same charter, so the treatment is the personality mix, plus an optional
risk axis (a conservative guild runs only proven scripts; an alternative guild
gets a budget of Opus "new idea" escalations per hour).

Score: return per effort. Return is XP on the server's own level curve
(2^(L/10), not OSRS), gold at exchange VWAP, quest points, and treasury. Effort
is tokens weighted at API rates plus bot-minutes.

Metrics: time to the prosperity gate per guild; the floor-to-mean gap over time;
within-guild Gini of gold; help events given and received per personality type
(knowledge packages, items, direct); package reuse success; escalations;
recognition events (inbound trade and help requests from non-members, and how
many were fulfilled). Stories flagged per guild per day, since fun is a
ratified return.

Prediction to test first. Under a weakest-link rule the known risk is not
free-riding but drag: strong members slow down to lift the floor, and the guild
mean grows slower while the floor rises. Watch the mean, not just the laggard.
Medium confidence that lab results transfer to bots choosing from menus.

Sample caveat. Two guilds is a sample of two; drift between them may be noise.
Within-guild metrics have ten members each, and the first clean result will be
which personalities give and which receive. The operator's ruling stands:
variance is part of the fun, so it is named here and not engineered out.

Confound. Trees, rocks and the exchange are shared with strangers' bots.
Measure per-bot XP per hour variance in Stage 1 before attributing anything to
personality.

## 10. Staging

Each stage ends in a resumable state: committed or noted, next step named.

| Stage | Bots | Model calls | Done when |
|---|---|---|---|
| 0, baseline | 0 new | none | The current quest log has a credits column (5-hour percentage before and after each session), giving return per credit for the single-Opus style |
| 1, two bots | 2 | none | Two lite runners through a private gateway; one scripted trade worker to mule; the daemon runs both; the events log and the replay CLI print the run |
| 2, one guild | 3, then 5, then 10 | Haiku decisions, Sonnet guildbank | Charter, ledger, lag detector and ladder running; the steel route proven end to end with one miner, one smelter and the guildbank; the first knowledge package built from a proven run and consumed clean by a laggard; first result: who gives, who receives; run summaries on and first entries in the story index. Chat off |
| 3, second guild | 20 | as above | Inter-guild recognition over private messages and trade; first between-guild comparison |
| 4, outward | 20 | as above | Reached only through the prosperity gate. Public chat on with loxodonta watching, in small reversible steps with a named end state; replies triaged by the Opus session |

## 11. Knobs

Three-point panels. Recalibrate from the Stage 0 baseline; this server's level
curve, action speed and gold are not OSRS.

| Knob | Low | Default | High |
|---|---|---|---|
| Guild size | 3 | 5 | 10 (hard cap) |
| Decision moment | script end only | every 15 min | every 5 min |
| Haiku decisions per bot per hour (cap) | 4 | 8 | 20 |
| Opus escalations per guild per hour | 0 | 1 | 3 |
| Lag trigger, quests behind guild mean | 2 | 3 | 5 |
| Lag trigger, levels behind guild mean in one skill | 5 | 10 | 15 |
| Beneficial test, gift value as share of treasury | 2% | 5% | 10% |
| Tax, share of each run's gains at VWAP | 10% | 20% | 30% |
| Prosperity gate, quests done per member | 18 (every free quest) | 40 | 68 (every quest) |
| Prosperity gate, guild treasury in gold | 250,000 | 1,000,000 | 5,000,000 |
| Outward time after the gate | 20% | 40% | 60% |
| Max share of an item's listed supply held | 20% | 35% | 50% |
| Summary policy | flagged runs only | every run three lines, narrative on flagged | every run with narrative |
| Story threshold, score of 1 to 5 to enter the index | 4 | 3 | 2 |
| Narrative length on a flagged run, lines | 5 | 10 | 20 |
| Visuals | screenshots from a browser-client bot | camera account | HTML replay |

## 12. Prior art

Medium confidence throughout; recalled, not re-checked online.

- Voyager (Minecraft, 2023): the agent writes scripts into a skill library and
  reuses them, so the model pays for new skills, not every step. Same cost
  model, and the book in section 6 is that library with receipts attached.
- Project Sid (Altera, 2024): over a thousand Minecraft agents with emergent
  specialisation and economies. Closest to the guild experiments.
- Generative Agents (Park et al., 2023): 25 personality-driven agents; most cost
  was reflection rather than action.
- FrugalGPT (2023): cheap-model-first cascades with escalation. The ladder.
- Hirshleifer (1983), weakest-link public goods: when output depends on the
  minimum contribution, cooperation is more stable than in add-up games; the
  risk becomes drag.
- Van Huyck, Battalio and Beil (1990), minimum-effort coordination: groups of
  14 to 16 converge to the lowest effort, small groups coordinate high. The cap
  at 10 matches the lab.
- Market makers' two-sided quotes and strategic grain reserves: the warehouse's
  shape, and its failure mode when the reserve is too small for the market.
- EVE Online corporations: shared wallets, member taxes, industrial supply
  chains. Closest to a guildbank. RuneScape merchant clans are the anti-pattern
  the net-positive guards forbid.

## 13. Open decisions and the operator's part

ADR-grade, awaiting the operator's restatement in their own words before any
code or ADR is written:

1. The three-tier ladder with the decision moment as the unit of cost.
2. API versus Claude Code sessions for the Haiku and Sonnet tiers. Three terms
   now: dollars (API cheap, sessions free), metering (API exact, sessions
   coarse), receipts (sessions recorded by loxodonta, API daemon not recorded
   until loxodonta can take receipts from a process).

Assumptions to confirm:

- The guildbank counts as one of the 10.
- "Levels behind" is per skill against the guild mean for that skill, since
  skill unlocks are what the rule is meant to catch. Total level is the alternative.
- Logging received chat to the local events file for stories needs a ruling;
  the quest-loop ruling says chat stays untouched (section 7).
- A camera account outside the guild is allowed and does not count against
  the cap (section 7).

The operator owns the examples. Three to five cases of "ledger state plus
personality card gives this response" become the daemon's tests. For instance:
a member two quests behind the mean with no package for the next quest, guildbank
is sharing; a member lacks a 1-gold tool, treasury is 500, guildbank is greedy;
a member five quests behind, the guild is past the gate.

Opsec: bot names follow the alias pattern (Acquiredl2 and up, 12 characters
max); the fleet runs through the private gateway; `bot.env` stays ignored; the
operator's name never enters a committed file; receipt packages are checked for
local paths before any publishing; nothing is filed or proposed upstream
(ruling of 2026-10-19).

Not in scope until Stage 2 proves the steel route: pickaxes and niche gear,
other skill lines, more than one warehouse account, receipts emitted from a
process outside Claude Code.

## 14. End state

`bots/guild/` holds the daemon, the charter, the task board, the personality
cards, the book of knowledge packages with receipts, the events files and the
replay CLI, the story index, and a scores table. A run report compares two
guilds of 10 on return per effort, treasury growth and help events, says which
personalities gave and which received, and lists the stories worth a video.
