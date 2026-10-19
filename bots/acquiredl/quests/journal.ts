// Screenshot one or more quest journal pages: the step-level progress signal.
// Usage: bun bots/acquiredl/quests/journal.ts acquiredl cook [sheep ...]   (or "all")
// Prints the PNG paths; read them as images. See lib.ts journal().
import { runScript } from '../../../sdk/runner';
import { QUESTS, type QuestKey, journal, hp, where, log } from './lib';

const keys = process.argv.slice(3);
const list = (keys[0] === 'all' ? Object.keys(QUESTS) : keys) as QuestKey[];

await runScript(async ({ bot, sdk }) => {
    const c = { bot, sdk };
    log(c, `at ${where(c)} hp=${hp(c)}`);
    for (const k of list) {
        if (!(k in QUESTS)) { console.log(`unknown quest ${k}; keys: ${Object.keys(QUESTS).join(' ')}`); continue; }
        await journal(c, k);
    }
}, { timeout: 30_000 + list.length * 15_000, printState: false });
