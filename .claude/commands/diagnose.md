---
description: Diagnose current bot fleet state — stalled bots, XP regressions, suggested next actions.
---

Invoke the `fleet-diagnostician` subagent to assess the current state of
the bot fleet. The subagent will read heartbeat logs, lab logs, goals,
the scoreboard, and the upstream `rs-sdk/learnings/` files; then output a
one-screen diagnosis in the format defined in its system prompt.

It may append to `fleet/scoreboard.md` if it observes a clearly stable
run that fills or improves an existing baseline. It may not deploy,
promote, or edit scripts — those remain user-approved actions.

After the diagnosis lands, summarize what changed since the last
diagnosis in one sentence.
