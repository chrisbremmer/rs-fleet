# Fleet Scoreboard

Append-only baseline log per bot per skill. Maintained by the
`fleet-diagnostician` subagent (see `.claude/agents/fleet-diagnostician.md`).

A baseline is added or updated only when a run is clearly stable
(≥3 minutes of growing `xpDelta`) **and** the new rate either fills an
empty slot or improves an existing baseline by ≥10%.

| Date (UTC)         | Bot       | Skill        | Script           | XP/min | Notes |
|--------------------|-----------|--------------|------------------|--------|-------|
| _no entries yet_   |           |              |                  |        |       |
