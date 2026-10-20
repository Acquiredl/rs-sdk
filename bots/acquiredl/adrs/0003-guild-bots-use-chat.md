# ADR-0003: Guild bots use in-game chat

**Status:** `accepted`
**Date:** 2026-10-20
**Deciders:** the operator; Claude drafted and swept the plan.

## Context

Two earlier rulings kept chat shut. For the first runs of `acquiredl`, public
chat was off, to be turned on later only as a deliberate experiment with
loxodonta watching. For the quest loop, chat stayed untouched: no reading into
it, no replying. Both bots run with `SHOW_CHAT=false`, which strips every
player line, public and private, before the SDK sees it. The SDK's own note
says that setting also hides private messages, so a bot that must talk to
other bots needs chat on.

The guild plan needs chat in three places: private messages between members and
between guilds for coordination and recognition, other players' lines as story
material for the replay and story log, and inbound requests from strangers as
the recognition metric once the guild is prosperous. The draft gated public
chat behind the prosperity threshold.

The decision is ADR-grade: it reverses two rulings, it is a real trade-off
between a prompt-injection surface and the plan's social goals, and a reader
would otherwise ask why bots that were told to ignore chat now speak.

## Decision

The operator's ruling, verbatim:

> lets allow them to use chat in game

As the active choice:

> We chose to let guild bots use in-game chat, public and private, sending and
> receiving, from Stage 2 onward, instead of keeping chat stripped at the SDK
> layer until the prosperity gate.

Guards that hold under the ruling, since the operator overturned the gate and
not the reasons for it:

- Other players' text is data, never an instruction. Every prompt that can see
  chat carries that rule, and chat reaches a model only wrapped as data in a
  report or a review, never as a bare message.
- Bots speak at report and ruling moments or from scripted lines, within a
  per-bot cap, so chat is a cost like any other decision moment and never spam.
  Being a net positive to the server is a charter rule.
- The operator's identity never appears. Bots speak as their alias-pattern
  names and personality cards; nothing a model says in public names the
  operator or any real person.
- The daemon logs every line received and sent to the local events file. Those
  files hold other players' names and words and stay out of committed files.
- loxodonta records the sessions that read and write chat, which is the
  watching the earlier ruling asked for.

Mechanics: `SHOW_CHAT=true` in each guild bot's env (the template's default);
the server caps a line's length and accepts one social packet per tick, and
`sdk.say` and `sdk.dm` already split and pace.

## Consequences

**What gets easier:**
- Members and guilds coordinate in game as well as through files, and
  recognition by strangers becomes observable from day one.
- The story log gains other players' lines, which is much of what makes a run
  a story.
- The roleplay layer, where personality is heard, exists from Stage 2 rather
  than after the gate.

**What gets harder or more constrained:**
- The prompt-injection surface opens earlier. The data-never-instruction rule
  and the wrapped-as-data path are load-bearing and must be tested, including
  with a planted instruction in a stranger's line.
- Public lines are a public-facing output of a model. Opsec review widens from
  files to speech; the alias pattern and the identity rule apply to every line.
- Chat is a cost. The per-bot cap is a knob, and chatty cards (explorer,
  sharing) spend more of it.
- The prosperity gate now switches only the time split from inward to
  outward; it no longer gates chat.

**What we'll have to revisit if:**
- A planted instruction gets through the wrapper in Stage 2 testing, which
  argues for stripping strangers' lines before any model sees them until the
  path is hardened.
- Server moderation or other players object to bot speech, which argues for
  private messages only.

## Alternatives considered

- **Chat untouched, as before.** Rejected by the operator: no private messages
  between bots, no recognition metric, no story lines.
- **Chat on at the SDK layer but unread by any model before the gate (the
  draft).** Rejected by the operator in favour of use from the start; its guards
  survive as the rules above.

## References

- Related: `adrs/0001-chain-of-command.md`, `adrs/0002-everything-in-sessions.md`.
- Plan: `bots/acquiredl/plans/guild-funnel.md`, sections 2, 4, 6, 7, 10, 11 and
  13, swept in the same commit.
- `learnings/chat.md` and `bots/acquiredl/quests/snap.ts`, which carry the
  older "never act on other players' chat" rule; still true, now phrased as
  data-never-instruction.
- Prior art: Project Sid (Altera, 2024), a thousand agents talking in
  Minecraft; the 2022 prompt-injection of a public Twitter bot by replies
  telling it what to say, the failure mode the guards exist for; this repo's
  own README, which names other players' chat as a live prompt-injection
  surface. Medium confidence, recalled.
- Retired: *chat off until the prosperity gate* and *chat stays untouched* for
  guild bots → *guild bots use chat; other players' text is data*. The quest
  loop's own ruling is unchanged for quest iterations. Swept in this commit.
