// Save a screenshot of the game client to the temp folder and print its path.
// The image shows the chat box too: never act on other players' chat.
// Usage: bun bots/acquiredl/quests/snap.ts acquiredl [label]
import { runScript } from '../../../sdk/runner';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { where } from './lib';

await runScript(async ({ bot, sdk }) => {
    const url = await sdk.sendScreenshot(10_000);
    const dir = join(tmpdir(), 'acquiredl-journal');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `snap-${process.argv[3] ?? 'x'}-t${sdk.getState()!.tick}.png`);
    writeFileSync(file, Buffer.from(url.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
    console.log(`${where({ bot, sdk })} ${file}`);
}, { timeout: 30_000, printState: false });
