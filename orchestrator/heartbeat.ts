// Self-contained heartbeat helper. Copied into rs-sdk/bots/{name}/ alongside
// any deployed script — no rs-fleet imports, only node stdlib.
//
// Usage inside a bot script:
//
//   import { startHeartbeat } from './heartbeat';
//   const stop = startHeartbeat(sdk, { task: 'woodcutting' });
//   try { /* script work */ } finally { stop(); }

import { appendFileSync } from 'node:fs';

export interface HeartbeatOpts {
    task: string;
    intervalMs?: number;
    logPath?: string;
}

export function startHeartbeat(sdk: any, opts: HeartbeatOpts): () => void {
    const intervalMs = opts.intervalMs ?? 30_000;
    const logPath = opts.logPath ?? './heartbeat.log';

    const startInv = countInventory(sdk);
    const startXp = snapshotXp(sdk);

    const emit = () => {
        try {
            const state = sdk.getState?.();
            if (!state) return;
            const xpDelta: Record<string, number> = {};
            const nowXp = snapshotXp(sdk);
            for (const [name, xp] of Object.entries(nowXp)) {
                const start = startXp[name] ?? xp;
                if (xp !== start) xpDelta[name] = xp - start;
            }
            const line = JSON.stringify({
                ts: Date.now(),
                task: opts.task,
                worldX: state.player?.worldX ?? null,
                worldZ: state.player?.worldZ ?? null,
                invCount: countInventory(sdk),
                invDelta: countInventory(sdk) - startInv,
                xpDelta,
                dialogOpen: !!state.dialog?.isOpen,
            });
            appendFileSync(logPath, line + '\n');
        } catch {
            // Heartbeat must never crash the bot script.
        }
    };

    emit();
    const handle = setInterval(emit, intervalMs);
    return () => {
        clearInterval(handle);
        emit();
    };
}

function snapshotXp(sdk: any): Record<string, number> {
    const out: Record<string, number> = {};
    try {
        const skills = sdk.getState?.()?.skills ?? [];
        for (const s of skills) {
            if (s?.name && typeof s.xp === 'number') out[s.name] = s.xp;
        }
    } catch {}
    return out;
}

function countInventory(sdk: any): number {
    try {
        const inv = sdk.getInventory?.() ?? [];
        return Array.isArray(inv) ? inv.length : 0;
    } catch {
        return 0;
    }
}
