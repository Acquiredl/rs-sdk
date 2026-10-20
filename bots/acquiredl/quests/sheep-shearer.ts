// Sheep Shearer (server: quests/quest_sheep; varp sheep 179, 1-21 = balls given + 1, 22 = done).
// Steps: start (Fred) -> shear (use Shears on a Sheep; sheep have no op, 25%
// escape, regrow in 100 ticks) -> spin (castle Spinning wheel, plane 1) ->
// deliver (Fred takes one ball per tick and keeps partial counts).
// Usage: bun bots/acquiredl/quests/sheep-shearer.ts acquiredl [step]
// WOOL=n sets how much wool+balls to hold after shearing (default: free slots,
// max 20). Prince Ali needs 7 more balls (3 wig, 4 rope): KEEP=7 on a later
// shear+spin round. Needs shears (1 gp, general store; or the ground spawn by
// the mill at (3152, 3306)). Reward 60 coins, 3,750 Crafting XP at 25x.
import { runScript } from '../../../sdk/runner';
import { Progress, startRun, endRun, note, talk, travel, has, count, st, log, journal, questCompleteSince, closeQuestScroll, type Ctx } from './lib';
import { P, castleTo } from './places';

const STEP = process.argv[3] ?? 'auto';
const WOOL = /^wool$/i, BALL = /^ball of wool$/i;

await runScript(async ({ bot, sdk }) => {
    const c: Ctx = { bot, sdk };
    const p = new Progress('sheep');
    const free = () => 28 - st(c).inventory.length;
    const target = Number(process.env.WOOL ?? Math.min(20, count(c, WOOL) + count(c, BALL) + free()));
    const step = STEP !== 'auto' ? STEP
        : !p.has('started') ? 'start'
        : p.has('complete') ? 'shear'
        : count(c, WOOL) + count(c, BALL) < target ? 'shear'
        : has(c, WOOL) ? 'spin'
        : 'deliver';
    const r = startRun(c, 'sheep', step);
    let ok = false;

    if (step === 'start' || step === 'deliver') {
        await travel(c, P.fred.x, P.fred.z, 2);
        const tick0 = st(c).tick, balls0 = count(c, BALL);
        const t = await talk(c, /^fred the farmer$/i, [/^i'm looking for a quest\.$/i, /^yes okay\. i can do that\.$/i]);
        if (t.lines.some(l => /see you when you have some wool|how are you doing getting those balls/i.test(l))) p.mark('started');
        // Fred takes the balls one per tick with the dialogue closed: wait on the count
        let last = count(c, BALL), idle = 0;
        while (step === 'deliver' && last > 0 && idle < 6) {
            await sdk.waitForTicks(1);
            const now = count(c, BALL);
            if (now < last) { last = now; idle = 0; } else idle++;
            if (st(c).dialog.isOpen) await t2(c);
        }
        if (step === 'deliver') note(c, r, `gave ${balls0 - count(c, BALL)} balls`);
        await sdk.waitForTicks(2);
        if (questCompleteSince(c, tick0)) { await closeQuestScroll(c); p.mark('complete'); }
        ok = step === 'start' ? p.has('started') : (p.has('complete') || count(c, BALL) < balls0);
    } else if (step === 'shear') {
        ok = await shear(c, target);
    } else if (step === 'spin') {
        ok = await spin(c); // STAY=1 stays on plane 1 for the Duke (Rune Mysteries)
        if (!process.env.STAY) await castleTo(c, 0);
    }
    await journal(c, 'sheep', step);
    endRun(c, r, ok ? 'ok' : 'not confirmed');
}, { timeout: 900_000, printState: false });

async function t2(c: Ctx) { await c.sdk.sendClickDialog(0); }

async function shear(c: Ctx, target: number): Promise<boolean> {
    await travel(c, P.sheepPen.x, P.sheepPen.z, 4);
    let tries = 0, escapes = 0;
    const t0 = Date.now();
    while (count(c, WOOL) + count(c, BALL) < target && tries < target * 4 && st(c).inventory.length < 28) {
        // Unshorn sheep only: both kinds are named "Sheep", but the unshorn type
        // is npc id 43 (sheepunsheered) and the shorn one 42. Without this
        // filter, round one (2026-10-19) spent 15 tries x ~15 s on shorn sheep.
        const sheep = st(c).nearbyNpcs.filter(n => n.id === 43 && n.reachable !== false).sort((a, b) => a.distance - b.distance)[0];
        if (!sheep) { await c.sdk.waitForTicks(3); continue; }
        tries++;
        const w0 = count(c, WOOL);
        const u = await c.bot.useItemOnNpc(/^shears$/i, sheep, { timeout: 5_000 });
        try { await c.sdk.waitForCondition(s => s.inventory.filter(i => WOOL.test(i.name)).length > w0 || s.gameMessages.some(m => /gets? away/i.test(m.text) && m.tick >= st(c).tick - 1), 4_000); } catch { /* counted below */ }
        if (count(c, WOOL) === w0) { escapes++; if (!u.success) log(c, `shear: ${u.message}`); }
        await c.bot.dismissBlockingUI();
    }
    log(c, `sheared to ${count(c, WOOL)} wool in ${tries} tries (${escapes} no wool) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    return count(c, WOOL) + count(c, BALL) >= target;
}

async function spin(c: Ctx): Promise<boolean> {
    if (!(await castleTo(c, 1))) return false;
    await travel(c, P.spinningWheel.x, P.spinningWheel.z, 2);
    const t0 = Date.now();
    for (let batch = 0; batch < 30 && has(c, WOOL); batch++) { // level-ups break a batch: re-open
        const w0 = count(c, WOOL);
        await c.bot.dismissBlockingUI();
        const wheel = c.sdk.findNearbyLoc(/^spinning wheel$/i);
        if (!wheel) { log(c, 'no spinning wheel in view'); return false; }
        const op = wheel.optionsWithIndex.find(o => /^spin$/i.test(o.text));
        await c.sdk.sendInteractLoc(wheel.x, wheel.z, wheel.id, op?.opIndex ?? 1);
        try { await c.sdk.waitForCondition(s => s.dialog.isOpen && s.dialog.options.length > 1, 8_000); }
        catch { log(c, 'spin menu did not open'); continue; }
        const opts = st(c).dialog.options;
        if (batch === 0) log(c, `spin menu: ${opts.map(o => `${o.index}:${o.text}`).join(' | ')}`);
        // four buttons per product (Make 1/5/10/X); wool is the first product
        const make10 = opts.find(o => /^make 10/i.test(o.text)) ?? opts.find(o => /10/.test(o.text));
        if (!make10) { log(c, 'no Make 10 option'); return false; }
        await c.sdk.clickDialogByText(new RegExp(`^${make10.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        let last = w0, idle = 0;
        while (idle < 8 && last > 0) {
            await c.sdk.waitForTicks(1);
            const now = count(c, WOOL);
            if (now < last) { last = now; idle = 0; } else idle++;
        }
        log(c, `batch ${batch + 1}: spun ${w0 - last}; balls=${count(c, BALL)}`);
        if (last === w0) break;
    }
    log(c, `spun to ${count(c, BALL)} balls in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    return !has(c, WOOL);
}
