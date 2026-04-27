// Sample library script — chops a configured tree until inventory full,
// emitting heartbeats so the fleet status command can watch it.
//
// Deployed by: bun orchestrator/deploy.ts woodcutting <bot-name>
// Then run from rs-sdk: bun bots/<bot-name>/woodcutting.ts

import { runScript } from '../../sdk/runner';
import { startHeartbeat } from './heartbeat';

const TREE_PATTERN = /^tree$/i;
const MAX_INVENTORY = 28;

await runScript(async (ctx) => {
    const { bot, sdk } = ctx;

    await bot.skipTutorial();

    const stopHeartbeat = startHeartbeat(sdk, { task: 'woodcutting' });
    try {
        while (true) {
            const inv = sdk.getInventory();
            if (inv.length >= MAX_INVENTORY) {
                console.log('Inventory full, exiting');
                break;
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
