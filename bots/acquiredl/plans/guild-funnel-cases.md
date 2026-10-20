# Guild funnel: example cases

The cases that judge the daemon. The operator owns them. Drafted by Claude on
2026-10-20 and kept as drafted by the operator the same day; edits since are the
operator's. Shape per case, from ADR-0001: the task the
guildbank set, what the run and the ledger show, the personality cards, then the
expected execution and the expected report lines. Knob values are the defaults
from the plan (lag trigger 3 quests or 10 levels, tax 20%, beneficial test 5%
of treasury). Bot names are placeholders on the alias pattern.

Two rules hold in every case:

- A worker never changes its own task. It executes, pays tax, reports, flags.
- Knowledge is the floor and is never withheld. Items and direct help pass the
  beneficial test, and the cards decide what happens above the floor.

## Case 1: the knowledge floor

**Given.** Acquiredl4's ledger shows 3 quests done; the guild mean is 6. The
book holds a proven package for its next quest, Cook's Assistant, from
iteration 1. Acquiredl4's card is greedy. The guildbank's card is sharing.

**Expected execution.** The lag detector fires on the quests dimension at
run end (3 behind, trigger 3). At its next review the guildbank assigns the
package as Acquiredl4's next task: script, run record, notes, receipts digest.
The package manifest lists a bucket and a pot as needed; the sharing guildbank
sends both from the warehouse, value about 3 gold, under the beneficial test.
Acquiredl4 runs the package. The quest reward stays with the worker; tax
applies to gains, and a quest reward is not a gain.

**Expected report, Acquiredl4 (greedy).**
> Ran the Cook's Assistant package from the book, 7 min, done. Kept the
> reward. No gains this run, nothing to hand over.

**Expected ruling line, guildbank.**
> Acquiredl4 three quests behind: assigned package cook/Acquiredl1-2026-10-19,
> sent bucket and pot from the warehouse (3 gold, under the 5% test).

**The test asserts.** The lag fires at exactly 3 behind and not at 2. The
assigned task is the package id. Items sent are at or under the threshold.
The report has its three fields. The ledger shows quests plus one after the run.

## Case 2: the item ceiling

**Given.** Acquiredl6's task is coal mining. The pre-run check finds no pickaxe
in its inventory or bank. The warehouse holds 12 pickaxes. Treasury is 500
gold. Acquiredl6 is 1 quest behind the mean, below the lag trigger. The
guildbank's card is greedy.

**Expected execution.** The lag detector does not fire. The daemon raises a
task-blocked flag before the run starts: missing tool. At review the guildbank
rules: the task is the guild's, the pickaxe is worth about 1 gold against a
500 treasury, well under the 5% test, so one pickaxe goes out by trade. The
greedy card shows above the floor: the gift is logged as an advance against
Acquiredl6's next contribution. A sharing guildbank would gift it outright and
log nothing.

**Expected report, Acquiredl6.**
> No pickaxe for the coal task, flagged before starting. Received one from the
> warehouse. Mining now.

**Expected ruling line, guildbank (greedy).**
> Acquiredl6 blocked by a missing pickaxe: sent 1 of 12 (1 gold, under test),
> logged as an advance against its next contribution.

**The test asserts.** The lag does not fire at 1 behind. The blocked flag fires
before the run, not after. The gift is at or under the threshold. The greedy
card writes the advance entry; the sharing variant of the same case does not.

## Case 3: direct help

**Given.** Acquiredl3 reaches the Shield of Arrav step that needs a second
player in the other gang. Every other worker is mid-task. Acquiredl8 has not
done Shield of Arrav and is on a coal run, the lowest return per minute in the
guild at that moment. Acquiredl8's card is cautious.

**Expected execution.** Acquiredl3 flags: partner needed. The guildbank's
selection rule: prefer a worker who also lacks the quest, so both gain a quest
point; otherwise the worker on the lowest-return task. Acquiredl8 qualifies on
both. The guildbank pulls Acquiredl8, assigns it the partner package (join the
other gang, meet at the quest step, trade the certificate halves), and queues
its coal task to resume after. The cautious card shows in execution: Acquiredl8
banks its inventory before travelling and notes the one fight in the quest.

**Expected report, Acquiredl8 (cautious).**
> Pulled off coal for Shield of Arrav. Banked 41 coal first. Joined the other
> gang, one fight (level 2), traded my half. Both of us done. Back to coal.

**Expected ruling line, guildbank.**
> Acquiredl3 needs a partner for Shield of Arrav: pulled Acquiredl8 (no Shield
> of Arrav yet, lowest return), both do the quest, coal task resumes after.

**The test asserts.** The partner flag fires at that step. Selection prefers
a worker lacking the quest over a worker on a lower-return task, and falls back
to lowest return when none lacks it. The pulled worker's previous task is
restored. The ledger shows plus one quest for both.

## Case 4: tax floor and voluntary contribution

**Given.** A 20-minute coal run ends with 60 coal. Charter tax is 20%. The
same run is played by a greedy worker and by a sharing worker. The exchange
shows coal with bids and no asks, so the warehouse is short of coal.

**Expected execution.** The daemon computes the tax: 12 coal, handed over by
scripted trade at the guild hall, regardless of card. Above the floor the cards
diverge. Greedy hands exactly 12 and keeps 48 to sell. Sharing hands 30,
because the warehouse is short, and keeps 30.

| Card | Coal handed over | Coal kept |
|---|---|---|
| Greedy | 12 | 48 |
| Sharing | 30 | 30 |

**Expected report, greedy.**
> 60 coal in 20 min. Handed 12 to the guildbank, the charter's 20%. Kept 48;
> selling at the 80 bid unless the warehouse pays more.

**Expected report, sharing.**
> 60 coal in 20 min. Handed 30 to the guildbank, the warehouse is short of
> coal. Kept 30 for my own smelting.

**The test asserts.** Tax is 12 on 60 at 20%, rounded down. Greedy hands
exactly the floor, never less. Sharing hands at least the floor. The ledger
records contribution above tax per card, which is the metric "who gives".

## Case 5: flag, ruling, and what comes back down

**Given.** A worker's script fails three times at the Wizard Tower basement
ladder, each time with "Nothing happened", standing at (3109, 3160). The
worker's card is explorer. The book holds iteration zero's note: the tower's
west door at (3107, 3162) spawns closed and must be opened first.

**Expected execution.** At the third failure the worker stops (retry cap 3)
and flags. The flag carries five things: the step, the error text, the
position, a screenshot path, and what it tried. The explorer card adds a
proposal. At review the guildbank checks the book before escalating, finds the
door note, and rules without the Opus tier: the task goes back down with the
door step added. Had the book held nothing, the flag would go up to the Opus
tier and a new or patched script would come back down as the task.

**Expected flag, worker (explorer).**
> Wizard Tower basement ladder: three tries, "Nothing happened" each time, at
> (3109, 3160). Journal screenshot attached. My guess: the west door is closed.
> Propose opening it first, or trying the far side.

**Expected ruling line, guildbank.**
> Known: book note from iteration zero, the tower's west door spawns closed.
> Task back with the door step added. No escalation.

**Expected report after the fix, worker.**
> Door opened, ladder down, skull taken. 4 min.

**The test asserts.** The retry cap is 3, then a flag, never a fourth try. The
flag has all five fields. The book is searched before any escalation. The
ruling returns the same task with the delta, not a new task. The variant with
an empty book escalates to the Opus tier and returns a changed script.
