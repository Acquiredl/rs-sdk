# ADR-0001: Decisions come from the top

**Status:** `accepted`
**Date:** 2026-10-20
**Deciders:** the operator, restating in their own words; Claude drafted and swept the plan.

## Context

The guild-funnel plan (`bots/acquiredl/plans/guild-funnel.md`) runs several bots
under a credit cap, with cheap models grinding and dearer models thinking. The
unit of cost is the decision moment: tokens are spent only when a model is
consulted, never while a script runs. The draft placed a decision moment at
every worker's script end, where a Haiku model chose the bot's next move from a
fixed menu, and escalated upward only when stuck. That scattered decisions
across the fleet, made personality a bias on a menu, and cost one model call per
worker per run.

The decision was ADR-grade on all three triggers: hard to reverse once the
daemon, the tests and the personality cards are built around it; surprising to
a reader who expects agents to be autonomous; and a real trade-off between
worker initiative and command discipline.

## Decision

The operator's ruling, verbatim:

> decisions come from the top. if something is flagged from lower down the
> chain it is escalated up to be ruled on and then sent back down. Like a real
> guild with real workers. They have set goals sent to them by their bosses.
> bosses will ask for reports, so they can update their tasks as needed

As the active choice:

> We chose a chain of command, where the Opus tier sets goals for the
> guildbank, the guildbank sets tasks for workers, workers execute, report and
> flag, flags go up to be ruled on and rulings come back down as updated tasks,
> instead of each worker choosing its own next move from a menu at script end.

## Consequences

**What gets easier:**
- Cost. One guildbank review covers every worker's report; a worker's tokens
  are its report, with narration only on flagged runs. Most decision moments
  move to the boss and happen in batches.
- Accountability. Every change of task traces to a ruling, so a replay can
  show who decided what and why.
- Personality gets a realistic home: not a menu bias, but the gap between the
  order and the execution. Contribution above the tax, the beneficial test,
  what a worker flags, and how it words its report.
- The report is the story log. Layer 3 of the replay section and the worker's
  report are one artefact.
- Tests become "task plus run plus personality card gives this execution and
  this report", which is what the operator's example cases must now cover.

**What gets harder or more constrained:**
- Workers never improvise. New ideas enter only as flags and leave only as
  rulings, so the alternative-ideas guild depends on its escalation budget.
- Latency. A flagged worker waits for a ruling; at its cap it reruns its last
  task. A slow or absent guildbank idles its workers.
- The guildbank is a single point of failure for its guild.
- Report honesty becomes something to measure. A worker's report is the boss's
  only view, and personality may colour it; the ledger (zero tokens, from
  state) is the check against the report.

**What we'll have to revisit if:**
- Decision latency starves workers in Stage 2, which argues for a larger
  standing task list per worker rather than per-run assignment.
- Rulings happen somewhere loxodonta cannot record (ADR-0002, API versus
  sessions, still open as of this writing).

## Alternatives considered

- **Worker menu choice at script end (the draft).** Rejected: decisions
  scattered across the fleet, personality reduced to a menu bias, one model
  call per worker per run.
- **A fully autonomous agent per bot, each on an Opus-class session.** Rejected:
  cost, and no shared discipline for a guild to form around.
- **No model below the Opus tier, pure scripts.** Rejected: no report in the
  bot's own voice, no judgment about what to flag.

## References

- Plan: `bots/acquiredl/plans/guild-funnel.md`, sections 3, 5, 7 and 13,
  swept in the same commit as this ADR.
- Prior art: management by exception (Taylor, 1911), where routine stays
  below and only deviations go up; mission command, where goals come from
  above and execution is local; the principal-agent problem, for reports
  whose honesty the principal must check. Medium confidence, recalled.
- Glossary terms added: *report moment* (a worker's one model call per run),
  *ruling* (a decision sent back down the chain). No `GLOSSARY.md` exists for
  this folder yet; the plan carries the terms until one does.
- Retired: *menu of moves* and *worker decision moment* → *report moment*;
  *decisions come from the top*. Swept from the plan in this commit.
