// Promote an experimental script from rs-sdk/bots/{name}/experimental/ into
// scripts/lib/. Promotion is the only way the shared library grows — the
// rule is "two stable 5-min runs across two different bots." This script
// just does the copy; you make the judgment call.
//
// Usage: bun orchestrator/promote.ts <bot-name> <script-name>

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const [botName, scriptName] = process.argv.slice(2);
if (!botName || !scriptName) {
    console.error('Usage: bun orchestrator/promote.ts <bot-name> <script-name>');
    process.exit(1);
}

const fleetRoot = resolve(import.meta.dir, '..');
const sdkRoot = process.env.RS_SDK_PATH
    ? resolve(process.env.RS_SDK_PATH)
    : resolve(fleetRoot, '..', 'rs-sdk');

const src = resolve(sdkRoot, 'bots', botName, 'experimental', `${scriptName}.ts`);
const dst = resolve(fleetRoot, 'scripts/lib', `${scriptName}.ts`);

if (!existsSync(src)) {
    console.error(`Experimental script not found: ${src}`);
    process.exit(1);
}
if (existsSync(dst)) {
    console.error(`Library already has ${scriptName}.ts. Edit it directly or delete it first.`);
    process.exit(1);
}

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);

console.log(`Promoted ${scriptName} → ${dst}`);
console.log('Commit it: cd', fleetRoot, "&& git add scripts/lib && git commit -m 'promote:", scriptName + "'");
