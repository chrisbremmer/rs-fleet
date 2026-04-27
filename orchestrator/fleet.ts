// Fleet-wide operations driven by fleet/goals.json.
//
//   bun orchestrator/fleet.ts deploy   # copy each bot's lib script + heartbeat
//   bun orchestrator/fleet.ts up       # deploy, then launch every bot in parallel
//
// `up` stays attached: stdout/stderr from all bots stream into this
// terminal, and Ctrl+C kills the whole fleet. For 2-5 bots that's the
// right ergonomic — daemonization is unnecessary ceremony at this scale.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const fleetRoot = resolve(import.meta.dir, '..');
const sdkRoot = process.env.RS_SDK_PATH
    ? resolve(process.env.RS_SDK_PATH)
    : resolve(fleetRoot, '..', 'rs-sdk');
const goalsPath = resolve(fleetRoot, 'fleet/goals.json');

interface Goals {
    bots: Record<string, { script: string }>;
}

const cmd = process.argv[2];
if (!cmd || !['deploy', 'up'].includes(cmd)) {
    console.error('Usage: bun orchestrator/fleet.ts <deploy|up>');
    process.exit(1);
}

if (!existsSync(goalsPath)) {
    console.error(`Missing ${goalsPath}`);
    process.exit(1);
}

const goals = JSON.parse(readFileSync(goalsPath, 'utf8')) as Goals;
const entries = Object.entries(goals.bots ?? {});
if (entries.length === 0) {
    console.error('fleet/goals.json has no bots configured');
    process.exit(1);
}

// --- deploy phase: always runs, both for `deploy` and `up` ---
const deployScript = resolve(fleetRoot, 'orchestrator/deploy.ts');
const deployable: Array<[string, string]> = [];
for (const [bot, { script }] of entries) {
    const botDir = resolve(sdkRoot, 'bots', bot);
    if (!existsSync(botDir)) {
        console.warn(
            `SKIP ${bot}: bot directory missing. Create with:\n` +
                `  cd ${sdkRoot} && bun bots/create-bot.ts ${bot}`,
        );
        continue;
    }
    const result = Bun.spawnSync({
        cmd: ['bun', deployScript, script, bot],
        cwd: fleetRoot,
        stdout: 'inherit',
        stderr: 'inherit',
    });
    if (result.exitCode !== 0) {
        console.error(`deploy failed for ${bot}`);
        process.exit(1);
    }
    deployable.push([bot, script]);
}

if (cmd === 'deploy') {
    console.log(`\nDeployed ${deployable.length} bot(s).`);
    process.exit(0);
}

// --- launch phase ---
if (deployable.length === 0) {
    console.error('Nothing to launch.');
    process.exit(1);
}

const children = deployable.map(([bot, script]) => {
    const child = Bun.spawn({
        cmd: ['bun', `bots/${bot}/${script}.ts`],
        cwd: sdkRoot,
        stdout: 'inherit',
        stderr: 'inherit',
    });
    console.log(`Launched ${bot} → ${script}.ts (pid ${child.pid})`);
    return { bot, child };
});

const shutdown = () => {
    console.log('\nShutting down fleet...');
    for (const { child } of children) {
        try {
            child.kill();
        } catch {}
    }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await Promise.all(children.map((c) => c.child.exited));
console.log('All bots exited.');
