# rs-fleet — orchestration for rs-sdk bots

You are working in the **fleet orchestration repo**, sibling to `rs-sdk`.
This repo holds the shared script library, fleet manager, and promotion
pipeline for the rs-sdk bot benchmark. The SDK itself, bot configs, and
the MCP server live in `../rs-sdk` — do not modify those from here.

## What lives where

| Repo | Owns |
|------|------|
| `../rs-sdk` | SDK code, MCP server, `bots/{name}/` configs, upstream `wiki/` |
| this repo | `scripts/lib/`, `fleet/`, `learnings/`, `orchestrator/` |

## The flow

1. Bot scripts get *deployed* (copied) from `scripts/lib/` into
   `../rs-sdk/bots/{name}/` by `orchestrator/deploy.ts`. The bot then runs
   them with `bun bots/{name}/{script}.ts` from inside `rs-sdk`.
2. Long-running scripts call `startHeartbeat(sdk, { task })` (from the
   deployed `heartbeat.ts`) to emit JSONL to `./heartbeat.log`.
3. `orchestrator/status.ts` aggregates heartbeats across all bots.
4. Experimental scripts live in `../rs-sdk/bots/{name}/experimental/`.
   They get *promoted* to `scripts/lib/` once they survive two stable
   5-min runs on two different bots.

## Fleet-wide ops

`fleet/goals.json` maps `botName -> { script }`. `orchestrator/fleet.ts`
reads it and provides:

- `bun orchestrator/fleet.ts deploy` — deploys every bot's assigned script
- `bun orchestrator/fleet.ts up` — deploy + launch all bots in parallel,
  attached, Ctrl+C to stop the fleet

Missing bot dirs are skipped with a warning naming the create-bot command
to run. Don't auto-create bots from this script — credential generation
should remain explicit.

## Conventions

- **Never** import from rs-sdk via relative path here — orchestrator code
  doesn't run inside the game. Shell out via `bun` instead, or read state
  files (`heartbeat.log`, `bot.env`).
- Scripts in `scripts/lib/` import the SDK runner via `../../sdk/runner`,
  matching the path layout *they will have after deploy*. They live in
  this repo as templates, but are designed to run from
  `rs-sdk/bots/{name}/`.
- `heartbeat.ts` is self-contained (only `node:fs`) so it can be copied
  alongside any script without dragging dependencies.

## RS_SDK_PATH

The orchestrator assumes `../rs-sdk`. Override with `RS_SDK_PATH` env var
if your layout differs.
