# ADR-0002: Every model moment runs in a Claude Code session

**Status:** `accepted`
**Date:** 2026-10-20
**Deciders:** the operator, restating in their own words; Claude drafted and swept the plan.

## Context

Under ADR-0001 the guild has three kinds of model moment: a worker's report at
run end (Haiku), the guildbank's reviews and rulings on a cadence (Sonnet), and
the Opus tier's rulings, which already live in a Claude Code session with the
operator. Where the first two run was open, with three terms in play:

- Dollars. The API bills per token on a separate key; sessions run on the Max
  plan the operator already pays for.
- Metering. The API meters each call exactly; sessions show plan usage per
  window and context size per session.
- Receipts. loxodonta records Claude Code tool calls and nothing a daemon does
  through the API.

The draft recommended a split: rulings in sessions, reports through the API.

Facts checked on 2026-10-20: this app's prompt cache lives for one hour, so a
session woken at least that often reads its context from cache; the built-in
`/loop` runs a session on an interval; the Anthropic Directory lists "Cache
Caffeine", which pokes a session before its cache expires and books a wake
after a usage reset, and "Cache TTL Timer", a countdown in the prompt footer;
machine sleep is covered by the app's keep-awake request or the keep-awake plugin.

## Decision

The operator's ruling, verbatim:

> everything in sessions, theres a way to keep sessions warm so that they stay
> cached. I think theres a claude mod that can help us with this

As the active choice:

> We chose to run every model moment, worker reports, guildbank reviews and
> rulings, and Opus rulings, in Claude Code sessions on the plan, kept warm
> inside the prompt cache, instead of calling Haiku and Sonnet through the API
> from the daemon or splitting by tier.

Shape, per guild: one Sonnet guildbank session and one Haiku reports session,
each on a `/loop` cadence inside the one-hour cache lifetime, under the Opus
session. The reports session writes every worker's report in a batch from the
finished run records. A session per worker is not needed, because workers do
not decide (ADR-0001). Sessions exchange work through the task board files, and
a boss can message a session directly through the app's session messaging.

## Consequences

**What gets easier:**
- Every report and every ruling is recorded by loxodonta, so the decision
  trail and the knowledge packages' receipts come for free.
- One billing line. No API key, no second meter.
- The chain of command maps onto linked sessions: the Opus session starts the
  guildbank session and can message it; the guildbank reads the reports
  session's output.

**What gets harder or more constrained:**
- Metering is per session, not per report. Effort in the experiment's score
  becomes plan usage per session per day, read from the usage card and the
  per-session context size, priced at API rates as the proxy.
- The fleet shares the 5-hour and weekly windows with the operator's own work.
  A fleet budget knob (share of the 5-hour window) is needed, and two guilds in
  parallel double the session count.
- A gap over an hour re-caches a large context on the next wake. Cadence stays
  at or under an hour, or Cache Caffeine pokes across the gap.
- Sessions need the machine awake and the app running; overnight runs need the
  keep-awake request or plugin.
- The daemon's own script runs remain unrecorded until loxodonta can take
  receipts from a process. That gap is unchanged by this decision.

**What we'll have to revisit if:**
- The plan windows throttle the fleet in Stage 2, which argues for fewer,
  larger batches per wake rather than a shorter cadence.
- loxodonta learns to record a process, which reopens the API for reports on
  cost grounds alone.

## Alternatives considered

- **Everything through the API from the daemon.** Rejected: no receipts for
  reports or rulings.
- **Split by tier, rulings in sessions and reports through the API (the
  draft).** Rejected by the operator in favour of one substrate with everything
  recorded, now that cache warmth removes most of the per-wake cost.

## References

- Related: `adrs/0001-chain-of-command.md`.
- Plan: `bots/acquiredl/plans/guild-funnel.md`, sections 3, 5, 6, 7, 8, 11 and
  13, swept in the same commit as this ADR.
- Prior art: serverless keep-warm pings, where a scheduled poke keeps a cold
  start from ever happening; recorders placed where decisions happen rather
  than where work happens. Medium confidence, recalled.
- Glossary terms added: *reports session* (one Haiku session per guild that
  writes all workers' reports), *cadence* (how often a boss session wakes).
- Retired: *API tier for reports* → *everything in sessions*. Swept from the
  plan in this commit.
