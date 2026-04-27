# rs-fleet Roadmap

Where we are, where we're going, and what we're deliberately not building yet.

## Current state (2026-04-27)

- **Repos**: `rs-fleet` (this) sibling to `rs-sdk` fork. Pull upstream cleanly.
- **Orchestration**: `deploy`, `promote`, `status`, `fleet (up|deploy)` commands. Heartbeat helper is type-safe and self-contained.
- **Library scripts**: `woodcutting.ts`, `mining.ts` — drop-loop pattern.
- **Bots**: `wcbot01` created, has run woodcutting, but no clean XP/min measurement yet (heartbeat pre-dates the `.experience` fix). `mnbot01` not yet created.
- **Agentic layer**: rung 1 shipped — `fleet-diagnostician` subagent + `/diagnose` command. Read-only.

## Phases

### Phase 0 — Foundation (✅ DONE)
- Two-repo split, deploy pipeline, heartbeat helper, fleet command, sample scripts.

### Phase 1 — Real measurement (🔜 NEXT)
**Goal**: Have validated XP/min baselines for 2+ skills on 2+ bots.

- [ ] Create `mnbot01`; run `fleet up`; capture clean heartbeats with the fixed helper
- [ ] Establish first scoreboard baseline for `woodcutting` (wcbot01) and `mining` (mnbot01)
- [ ] First `/diagnose` run after a real session — exercises rung 1, finds gaps in the agent prompt
- [ ] Promote `woodcutting.ts` and `mining.ts` once they each survive 2 stable 5-min runs across 2 bots (the cross-bot gate)

**Success criteria**: scoreboard has at least two non-empty rows; `/diagnose` produces a useful one-screen report after a real run.

### Phase 2 — Skill coverage
**Goal**: Library covers the four highest-leverage skills.

- [ ] `combat.ts` — auto-attack a target type with food + retreat threshold (cite `learnings/combat.md`)
- [ ] `fishing.ts` + `cooking.ts` paired — feeds the combat loop
- [ ] `banking.ts` helper — opens bank, deposits a pattern, returns to a saved location (cite `learnings/banking.md`, `learnings/walking.md`)
- [ ] Parameterize scripts: target patterns and waypoints via env vars or per-bot config, so one library script serves many bots/locations

**Success criteria**: 4+ scripts in `scripts/lib/`, each with at least one bot running it stably.

### Phase 3 — Supervised improvement (rung 2 of agentic layer)
**Goal**: Agents propose script changes; humans approve.

- [ ] `script-improver` subagent in `.claude/agents/` — reads diagnosis, drafts a change in `bots/{name}/experimental/`, runs a 5-minute trial, reports a verdict
- [ ] `/improve <bot>` slash command — orchestrates: diagnose → improver → measure → report
- [ ] `fleet/decisions.md` — append-only log of every proposal (accepted or rejected) with reason. The audit trail.
- [ ] **Hard promotion gate**: `promote.ts` refuses unless scoreboard shows the new script measured better than the lib version on 2 bots

**Success criteria**: at least one human-approved promotion came from an agent-drafted change. The decisions log shows "rejected" entries too — not just accepts.

### Phase 4 — Autonomous loop (rung 3)
**Goal**: Self-improvement runs unattended.

- [ ] `CronCreate` schedules `/improve-fleet` every N minutes
- [ ] Auto-promotion only when: measured improvement ≥ +10% AND no error-rate regression AND scoreboard agrees across 2 bots
- [ ] **Token-budget gate** on the cron — abort the loop if interactive Claude usage approaches plan cap (verify whether scheduled remote agents share the Max plan pool — open question)
- [ ] Daily summary digest written to `fleet/decisions.md`

**Success criteria**: 7 days of unattended operation produces a net positive change in scoreboard XP/min and no manual interventions besides reviewing the digest.

### Phase 5 — Multi-bot synergy
**Goal**: Bots cooperate, not just run in parallel.

- [ ] Logistics bot — picks up dropped logs/ore from specialists, banks them
- [ ] Cross-bot signaling via `fleet/coord.json` (e.g. "wcbot01 has logs queued at 3220,3245")
- [ ] Combat skiller pipeline: fisher → cooker → combat bot uses the food
- [ ] Long-running progression goals: "get wcbot01 to WC 60", agent breaks this into sub-grinds and switches scripts when level thresholds are crossed

**Success criteria**: a multi-bot configuration produces a higher *fleet-aggregate* XP/min than the same number of bots running independently.

## Things deliberately not on the roadmap (yet)

- **Daemonized supervisor / launchd integration** — premature until 5+ bots running unattended is the norm. `fleet up` attached is fine for current scale.
- **Web dashboard** — terminal `status.ts` + `/diagnose` covers it. Don't build UI for an audience of one.
- **Cross-account coordination / multi-machine** — irrelevant until single-machine throughput is a constraint.
- **Generalized "any skill" scripts** — drop-loop pattern works for low-level WC/mining; combat and banking will need their own shapes. Don't try to abstract before the second concrete instance.
- **Lint rules enforcing the promotion gate** — convention in CLAUDE.md is enough until it's been violated.

## Open questions

- **Do scheduled remote agents share the Claude Code Max plan token pool?** Material for Phase 4 sizing. Worth one-line check in Claude Code docs before relying on cron-based autonomy.
- **What's the actual XP/min ceiling on plain trees?** Need a clean run to know — Phase 1 deliverable.
- **Does `bot.interactLoc(rock, 'mine')` use the right option string?** First mnbot01 run will tell us. If wrong, learn what the actual option string is from `learnings/mining.md` or the loc's `optionsWithIndex`.

## Next 3 concrete actions

1. `cd ~/Repos/rs-sdk && bun bots/create-bot.ts mnbot01`
2. `cd ~/Repos/rs-fleet && bun orchestrator/fleet.ts up` — let it run 5+ minutes
3. In another shell: `/diagnose` — first real exercise of rung 1
