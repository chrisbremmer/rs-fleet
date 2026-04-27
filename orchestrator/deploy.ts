// Deploy a script from scripts/lib/ into a bot's directory in rs-sdk.
// Also copies orchestrator/heartbeat.ts alongside so the script can import it.
//
// Usage: bun orchestrator/deploy.ts <script-name> <bot-name>

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const [scriptName, botName] = process.argv.slice(2);
if (!scriptName || !botName) {
    console.error('Usage: bun orchestrator/deploy.ts <script-name> <bot-name>');
    process.exit(1);
}

const fleetRoot = resolve(import.meta.dir, '..');
const sdkRoot = process.env.RS_SDK_PATH
    ? resolve(process.env.RS_SDK_PATH)
    : resolve(fleetRoot, '..', 'rs-sdk');

const src = resolve(fleetRoot, 'scripts/lib', `${scriptName}.ts`);
const heartbeatSrc = resolve(fleetRoot, 'orchestrator/heartbeat.ts');
const botDir = resolve(sdkRoot, 'bots', botName);
const dst = resolve(botDir, `${scriptName}.ts`);
const heartbeatDst = resolve(botDir, 'heartbeat.ts');

if (!existsSync(src)) {
    console.error(`Script not found: ${src}`);
    process.exit(1);
}
if (!existsSync(botDir)) {
    console.error(`Bot directory not found: ${botDir}`);
    console.error(`Create it first with: cd ${sdkRoot} && bun bots/create-bot.ts ${botName}`);
    process.exit(1);
}

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
copyFileSync(heartbeatSrc, heartbeatDst);

console.log(`Deployed ${scriptName} → ${dst}`);
console.log(`Heartbeat helper → ${heartbeatDst}`);
console.log(`Run with: cd ${sdkRoot} && bun bots/${botName}/${scriptName}.ts`);
