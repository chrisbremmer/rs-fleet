// Drop-chop woodcutting loop: chops the configured tree until inventory
// fills, drops only logs (keeps starter gear and other items), repeats.
// This is the standard low-level WC XP/min strategy — no bank trip cost.
//
// Deployed by: bun orchestrator/deploy.ts woodcutting <bot-name>
// Then run from rs-sdk: bun bots/<bot-name>/woodcutting.ts

import { runScript } from '../../sdk/runner';
import { startHeartbeat } from './heartbeat';

const TREE_PATTERN = /^tree$/i;
const LOG_PATTERN = /^logs?$/i;
const MAX_INVENTORY = 28;

await runScript(async (ctx) => {
    const { bot, sdk } = ctx;

    await bot.skipTutorial();

    const stopHeartbeat = startHeartbeat(sdk, { task: 'woodcutting' });
    try {
        while (true) {
            const inv = sdk.getInventory();
            if (inv.length >= MAX_INVENTORY) {
                const dropped = await dropAllLogs(sdk);
                if (dropped === 0) {
                    console.log('Inventory full and no logs to drop. Stopping.');
                    break;
                }
                console.log(`Dropped ${dropped} logs, continuing`);
                continue;
            }
            const tree = sdk.findNearbyLoc(TREE_PATTERN);
            if (!tree) {
                console.log('No tree nearby, exiting');
                break;
            }
            const result = await bot.chopTree(tree);
            if (!result.success) {
                console.log(`chopTree failed: ${result.message}`);
                break;
            }
        }
    } finally {
        stopHeartbeat();
    }
}, {
    timeout: 5 * 60_000,
});

async function dropAllLogs(sdk: any): Promise<number> {
    let dropped = 0;
    while (true) {
        const log = sdk.getInventory().find((i: any) => LOG_PATTERN.test(i.name));
        if (!log) return dropped;
        await sdk.sendDropItem(log.slot);
        dropped++;
    }
}
