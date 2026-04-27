// Drop-mine loop: mines any nearby rock until inventory fills, drops only
// ore (keeps starter gear and pickaxe), repeats. Mirrors the woodcutting
// pattern — same shape, different verbs — to validate the cross-bot
// promotion path.
//
// Deployed by: bun orchestrator/deploy.ts mining <bot-name>
// Then run from rs-sdk: bun bots/<bot-name>/mining.ts

import { runScript } from '../../sdk/runner';
import { startHeartbeat } from './heartbeat';

const ROCK_PATTERN = /rocks?/i;
const ORE_PATTERN = /(ore|copper|tin)$/i;
const MAX_INVENTORY = 28;

await runScript(async (ctx) => {
    const { bot, sdk } = ctx;

    await bot.skipTutorial();

    const stopHeartbeat = startHeartbeat(sdk, { task: 'mining' });
    try {
        while (true) {
            const inv = sdk.getInventory();
            if (inv.length >= MAX_INVENTORY) {
                const dropped = await dropAllOre(sdk);
                if (dropped === 0) {
                    console.log('Inventory full and no ore to drop. Stopping.');
                    break;
                }
                console.log(`Dropped ${dropped} ore, continuing`);
                continue;
            }
            const rock = sdk.findNearbyLoc(ROCK_PATTERN);
            if (!rock) {
                console.log('No rock nearby, exiting');
                break;
            }
            const result = await bot.interactLoc(rock, 'mine');
            if (!result.success) {
                console.log(`mine failed: ${result.message}`);
                break;
            }
        }
    } finally {
        stopHeartbeat();
    }
}, {
    timeout: 5 * 60_000,
});

async function dropAllOre(sdk: any): Promise<number> {
    let dropped = 0;
    while (true) {
        const ore = sdk.getInventory().find((i: any) => ORE_PATTERN.test(i.name));
        if (!ore) return dropped;
        await sdk.sendDropItem(ore.slot);
        dropped++;
    }
}
