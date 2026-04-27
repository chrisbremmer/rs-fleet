# rs-fleet

Fleet orchestration layer for the [rs-sdk](../rs-sdk) bot benchmark.

This repo holds your scaled bot infrastructure: a shared script library, fleet
manager, promotion pipeline, and aggregated learnings. It sits as a sibling
to `rs-sdk`, so you can pull upstream SDK updates without merge pain.

```
~/Repos/
  rs-sdk/             # upstream fork — bot configs live here (bots/{name}/)
  rs-fleet/           # this repo — orchestration, scripts, learnings
```

## Layout

| Path | Purpose |
|------|---------|
| `orchestrator/` | TypeScript tools that run *outside* the game: deploy, status, promote |
| `scripts/lib/` | Promoted, parameterized scripts. Copied into `rs-sdk/bots/{name}/` by `deploy` |
| `fleet/` | Fleet-wide state: `goals.json`, `status.md`, scoreboard |
| `learnings/` | Your own aggregated notes (separate from the upstream `rs-sdk/wiki/`) |

## Workflow

```bash
# Single bot:
bun orchestrator/deploy.ts woodcutting mybot
cd ../rs-sdk && bun bots/mybot/woodcutting.ts

# Whole fleet (driven by fleet/goals.json):
bun orchestrator/fleet.ts up      # deploy + launch all bots in parallel; Ctrl+C to stop the fleet
bun orchestrator/fleet.ts deploy  # deploy only, no launch

# Watch the fleet (in any pane):
bun orchestrator/status.ts
```

`fleet up` stays attached and streams every bot's stdout into the same
terminal. For 2–5 bots that's the right scale; daemonization can come
later if you start running 10+ bots.

## Promotion

Scripts start in `rs-sdk/bots/{name}/experimental/`. After two consecutive
5-minute runs at stable XP/min on two different bots, run
`bun orchestrator/promote.ts <script>` to copy them into `scripts/lib/`.
That's the only way the library grows.

## Configuration

- `RS_SDK_PATH` env var overrides the assumed `../rs-sdk` location.
