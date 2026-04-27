// Aggregate heartbeats from all bots in rs-sdk/bots/ and print a fleet summary.
//
// Usage: bun orchestrator/status.ts

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const fleetRoot = resolve(import.meta.dir, '..');
const sdkRoot = process.env.RS_SDK_PATH
    ? resolve(process.env.RS_SDK_PATH)
    : resolve(fleetRoot, '..', 'rs-sdk');
const botsDir = resolve(sdkRoot, 'bots');

interface Heartbeat {
    ts: number;
    task: string;
    worldX: number | null;
    worldZ: number | null;
    invCount: number;
    invDelta: number;
    xpDelta: Record<string, number>;
    dialogOpen: boolean;
}

const now = Date.now();
const rows: Array<{
    bot: string;
    task: string;
    ageS: number;
    pos: string;
    inv: string;
    xpRate: string;
    flag: string;
}> = [];

for (const name of readdirSync(botsDir)) {
    if (name.startsWith('_') || name.startsWith('.')) continue;
    const logPath = resolve(botsDir, name, 'heartbeat.log');
    if (!existsSync(logPath)) continue;

    const lines = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    if (lines.length === 0) continue;
    const lastLine = lines[lines.length - 1];
    if (!lastLine) continue;

    let last: Heartbeat;
    try {
        last = JSON.parse(lastLine) as Heartbeat;
    } catch {
        continue;
    }

    const ageS = Math.round((now - last.ts) / 1000);
    const firstLine = lines[0];
    const first = firstLine ? (JSON.parse(firstLine) as Heartbeat) : last;
    const elapsedMin = Math.max((last.ts - first.ts) / 60_000, 0.0001);
    const topSkill = Object.entries(last.xpDelta).sort((a, b) => b[1] - a[1])[0];
    const xpRate = topSkill
        ? `${topSkill[0]} ${(topSkill[1] / elapsedMin).toFixed(1)} xp/m`
        : '—';

    let flag = '';
    if (ageS > 90) flag = 'STALL';
    else if (last.dialogOpen) flag = 'DIALOG';
    else if (last.invCount >= 28) flag = 'INV-FULL';

    rows.push({
        bot: name,
        task: last.task,
        ageS,
        pos: last.worldX !== null ? `${last.worldX},${last.worldZ}` : '?',
        inv: `${last.invCount}/28`,
        xpRate,
        flag,
    });
}

if (rows.length === 0) {
    console.log(`No heartbeats found under ${botsDir}/*/heartbeat.log`);
    process.exit(0);
}

console.log(
    'BOT'.padEnd(14),
    'TASK'.padEnd(16),
    'AGE'.padStart(5),
    'POS'.padEnd(11),
    'INV'.padEnd(6),
    'RATE'.padEnd(20),
    'FLAG',
);
for (const r of rows) {
    console.log(
        r.bot.padEnd(14),
        r.task.padEnd(16),
        `${r.ageS}s`.padStart(5),
        r.pos.padEnd(11),
        r.inv.padEnd(6),
        r.xpRate.padEnd(20),
        r.flag,
    );
}
