// Goblin Diplomacy (server: quests/quest_gobdip; varp goblinquest 62: 1 bartender, 2 generals,
// 3 orange given, 4 blue given, 5-6 done).
// Must start with the Port Sarim bartender: at stage 0 the generals only say
// "Go away, human, we busy." Goblin mail only drops from goblins (7.8% in
// Goblin Village, 3.9% elsewhere; fight.ts). Dyes from Aggie, 5 gp each, by
// using the ingredient on her: red = 3 redberries, yellow = 2 onions, blue =
// 2 woad leaves (Wyson, Falador park: 2 for 20 gp). Orange = red dye on yellow
// dye. All three mails can be carried at once: three talks finish it.
// Steps: bartender, beer (BEERS=n, 2 gp each, for Prince Ali), woad, dyes, mail, generals.
// Usage: bun bots/acquiredl/quests/goblin-diplomacy.ts <bot> <step>
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, has, count, st, log, journal, questCompleteSince, closeQuestScroll, useOnNpc, walkInto, type Ctx, type RunRecord } from './lib';
import { P } from './places';

const STEP = process.argv[3] ?? 'bartender';
const MAIL = /^goblin mail$/i, ORANGE = /^orange goblin mail$/i, BLUE = /^blue goblin mail$/i;

const STEPS: Record<string, (c: Ctx, r: RunRecord, p: Progress) => Promise<boolean>> = {
    async bartender(c, r, p) {
        await walkInto(c, P.rustyAnchor.x, P.rustyAnchor.z, 2);
        const t = await talk(c, /^bartender$/i, [/^not very busy in here today, is it\?$/i]);
        if (t.lines.some(l => /goblin|armour|general/i.test(l))) p.mark('started');
        return p.has('started');
    },
    async beer(c, r) {
        const n = Number(process.env.BEERS ?? 3);
        await walkInto(c, P.rustyAnchor.x, P.rustyAnchor.z, 2);
        for (let i = 0; i < n * 2 && count(c, /^beer$/i) < n; i++) await talk(c, /^bartender$/i, [/^could i buy a beer please\?$/i]);
        note(c, r, `beers: ${count(c, /^beer$/i)}`);
        return count(c, /^beer$/i) >= n;
    },
    async woad(c) {
        await travel(c, P.wyson.x, P.wyson.z, 3);
        await talk(c, /^wyson the gardener$/i, [/^i'm looking for woad leaves\.$/i, /^how about 20 coins\?$/i]);
        return count(c, /^woad leaf$/i) >= 2;
    },
    async dyes(c, r) {
        await travel(c, P.aggie.x, P.aggie.z, 2);
        const want: [RegExp, RegExp, number][] = [[/^redberries$/i, /^red dye$/i, 3], [/^onion$/i, /^yellow dye$/i, 2], [/^woad leaf$/i, /^blue dye$/i, 2]];
        for (const [ingr, dye, n] of want) {
            if (has(c, dye) || has(c, /^orange dye$/i) && /red|yellow/.test(dye.source)) continue;
            if (count(c, ingr) < n) { note(c, r, `need ${n} of ${ingr}`); continue; }
            await useOnNpc(c, ingr, /^aggie$/i, []);
            log(c, `${dye.source}: ${has(c, dye)}`);
        }
        const red = c.sdk.findInventoryItem(/^red dye$/i), yellow = c.sdk.findInventoryItem(/^yellow dye$/i);
        if (red && yellow) { await c.sdk.sendUseItemOnItem(red.slot, yellow.slot); await c.sdk.waitForTicks(2); }
        note(c, r, `orange=${has(c, /^orange dye$/i)} blue=${has(c, /^blue dye$/i)}`);
        return has(c, /^orange dye$/i) && has(c, /^blue dye$/i);
    },
    async mail(c, r) {
        for (const [dye, out] of [[/^orange dye$/i, ORANGE], [/^blue dye$/i, BLUE]] as const) {
            if (has(c, out)) continue;
            const d = c.sdk.findInventoryItem(dye), m = c.sdk.findInventoryItem(MAIL);
            if (!d || !m) { note(c, r, `missing ${dye.source} or goblin mail`); continue; }
            await c.sdk.sendUseItemOnItem(d.slot, m.slot);
            await c.sdk.waitForTicks(2);
        }
        return has(c, ORANGE) && has(c, BLUE) && has(c, MAIL);
    },
    async generals(c, r, p) {
        await walkInto(c, P.goblinGenerals.x, P.goblinGenerals.z, 2);
        const tick0 = st(c).tick;
        for (let i = 0; i < 5 && !questCompleteSince(c, tick0); i++) {
            const t = await talk(c, /^general (wartface|bentnoze)$/i, [/^do you want me to pick an armour colour for you\?$/i]);
            if (!t.lines.length) break;
            await c.sdk.waitForTicks(2);
            log(c, `held: orange=${has(c, ORANGE)} blue=${has(c, BLUE)} plain=${count(c, MAIL)}`);
            if (!has(c, ORANGE) && !has(c, BLUE) && !has(c, MAIL) && i > 0) break;
        }
        await c.sdk.waitForTicks(3);
        if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
        return p.has('complete');
    },
};

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('goblin');
    const r = startRun(c, 'goblin', STEP);
    const ok = STEPS[STEP] ? await STEPS[STEP](c, r, p) : false;
    if (ok) p.mark(STEP);
    await journal(c, 'goblin', STEP);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });
