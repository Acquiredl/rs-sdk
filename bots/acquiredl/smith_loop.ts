// Smithing loop for acquiredl (lab_log.md, Session 2): mine at the SE Varrock
// mine, smelt at the Lumbridge furnace, smith daggers at the SE Varrock anvils,
// bank the daggers at Varrock east bank. Each step is picked from the
// inventory, so the script resumes wherever the last run stopped.
//
// Env: LOOP_MS run length (default 60 s; checked between steps, so a walk or
// a smithing batch can overrun it), METAL=bronze|iron|auto (auto: iron once
// Smithing and Mining are 15), PARK=1 walks to the courtyard at the end.
import { runScript } from '../../sdk/runner';

const LOOP_MS = Number(process.env.LOOP_MS ?? 60_000);
const METAL_ENV = process.env.METAL ?? 'auto';
const PARK = process.env.PARK === '1';
const EAT_AT = 6;      // eat below this
const FLEE_AT = 4;     // no food and below this: walk to the courtyard and stop

// One chain of waypoints, Lumbridge to the anvils, east of the dark wizards
// (3227, 3369). Checked with route_check.ts: 32+ tiles from wizards and
// scorpions, 18 from the black bear spawn (3296, 3347).
const CHAIN = [
    { name: 'courtyard', x: 3222, z: 3222 },
    { name: 'furnace', x: 3229, z: 3256 },
    { name: 'road1', x: 3240, z: 3290 },
    { name: 'road2', x: 3262, z: 3322 },
    { name: 'road3', x: 3271, z: 3345 },
    { name: 'mine', x: 3284, z: 3366 },
    { name: 'east1', x: 3290, z: 3388 },
    { name: 'east2', x: 3276, z: 3425 },
    { name: 'bank', x: 3254, z: 3424 },
    { name: 'anvildoor', x: 3247, z: 3413 },
    { name: 'anvil', x: 3247, z: 3405 },
] as const;
type Node = typeof CHAIN[number]['name'];

// Food and coins went to the bank on the iron trips: 26 ore slots, not 23.
const KEEP = /^(bronze pickaxe|hammer)$/i;
const ORE_OR_BAR = /(ore|bar)$/i;

class Stop extends Error {}

await runScript(async ({ bot, sdk }) => {
    const t0 = Date.now();
    const el = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
    const st = () => sdk.getState()!;
    const count = (re: RegExp) => sdk.countInventoryItems(re);
    const lvl = (s: string) => sdk.getSkill(s)?.baseLevel ?? sdk.getSkill(s)?.level ?? 1;
    const xp = (s: string) => sdk.getSkillXp(s) ?? 0;
    const pos = () => { const p = st().player; return `(${p.worldX}, ${p.worldZ})`; };
    const log = (m: string) => console.log(`[${el()}] ${m} hp=${st().player.hp} run=${st().player.runEnergy ?? '?'}`);

    const smXp0 = xp('Smithing'), mnXp0 = xp('Mining');
    const p0 = st().player;
    console.log(`start: pos=${pos()} hp=${p0.hp}/${p0.maxHp} smithing=${lvl('Smithing')} (${smXp0}) mining=${lvl('Mining')} (${mnXp0}) inv=${st().inventory.length}/28`);

    async function safety() {
        const hp = st().player.hp;
        if (hp >= EAT_AT) return;
        const food = sdk.findInventoryItem(/^(shrimps|bread)$/i);
        if (food) { const e = await bot.eatFood(food); log(`ate ${food.name}: ${e.message}`); return; }
        if (hp < FLEE_AT) {
            log(`hp ${hp}, no food: retreating to the courtyard`);
            await walkNode('courtyard', false);
            throw new Stop('retreated');
        }
    }

    function nearestIndex(): number {
        const p = st().player;
        let best = 0, bd = Infinity;
        CHAIN.forEach((n, i) => { const d = Math.hypot(p.worldX - n.x, p.worldZ - n.z); if (d < bd) { bd = d; best = i; } });
        return best;
    }

    // One click per chain node (legs are under 45 tiles, inside the client's
    // scene). bot.walkTo stops at every turn point and measured about 1 s per
    // tile against 0.57 s for a plain click; the run flag does nothing here.
    async function fastWalk(x: number, z: number): Promise<boolean> {
        const dist = () => { const p = st().player; return Math.max(Math.abs(p.worldX - x), Math.abs(p.worldZ - z)); };
        for (let click = 0; click < 4; click++) {
            if (dist() <= 2) return true;
            const r = await sdk.sendWalk(x, z, true);
            if (!r.success) return false;
            let last = pos(), still = 0;
            while (still < 3) {
                await sdk.waitForTicks(1);
                if (dist() <= 2) return true;
                const now = pos();
                if (now === last) still++; else { still = 0; last = now; }
            }
        }
        return dist() <= 2;
    }

    // The anvil building's door (3248, 3411), found with findDoorsAlongPath.
    // Closed, it turns a click into a walkTo fallback costing about 60 s.
    async function openAnvilDoor() {
        const door = st().nearbyLocs.find(l => l.x === 3248 && l.z === 3411 && l.optionsWithIndex.some(o => /^open$/i.test(o.text)));
        if (!door) return;
        const r = await bot.openDoor(door);
        log(`anvil door: ${r.success ? 'opened' : r.message}`);
    }

    async function walkNode(target: Node, checkSafety = true) {
        const ti = CHAIN.findIndex(n => n.name === target);
        let i = nearestIndex();
        const p = st().player;
        const atStart = Math.hypot(p.worldX - CHAIN[i].x, p.worldZ - CHAIN[i].z) <= 4;
        // Step onto the chain first unless already on a node.
        const path: number[] = atStart ? [] : [i];
        while (i !== ti) { i += Math.sign(ti - i); path.push(i); }
        for (const k of path) {
            const n = CHAIN[k];
            const legT0 = Date.now(), from = st().player;
            for (let attempt = 1; attempt <= 3; attempt++) {
                if (checkSafety) await safety();
                if (n.name === 'anvil' || CHAIN[k + 1]?.name === 'anvil' || n.name === 'anvildoor') await openAnvilDoor();
                if (attempt === 1 && await fastWalk(n.x, n.z)) break;
                const w = await bot.walkTo(n.x, n.z, 3);
                const q = st().player;
                const d = Math.hypot(q.worldX - n.x, q.worldZ - n.z);
                if (d <= 5) break;
                log(`walk to ${n.name} attempt ${attempt}: ${w.message}, still ${d.toFixed(0)} tiles away at ${pos()}`);
                if (attempt === 3) throw new Error(`could not reach ${n.name}`);
            }
            const to = st().player;
            const tiles = Math.max(Math.abs(to.worldX - from.worldX), Math.abs(to.worldZ - from.worldZ));
            console.log(`   leg ${n.name}: ~${tiles} tiles (straight) in ${((Date.now() - legT0) / 1000).toFixed(1)}s`);
        }
        log(`at ${target} ${pos()}`);
    }

    function metal(): 'bronze' | 'iron' {
        if (METAL_ENV === 'bronze' || METAL_ENV === 'iron') return METAL_ENV;
        return lvl('Smithing') >= 15 && lvl('Mining') >= 15 ? 'iron' : 'bronze';
    }

    async function bankStep() {
        await walkNode('bank');
        const o = await bot.openBank();
        if (!o.success) throw new Error(`openBank: ${o.message}`);
        const stray = metal() === 'iron' ? /^(copper ore|tin ore)$/i : /^$/;
        const names = [...new Set(st().inventory.filter(i => !KEEP.test(i.name) && (!ORE_OR_BAR.test(i.name) || stray.test(i.name))).map(i => i.name))];
        for (const name of names) {
            const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const d = await bot.depositItem(new RegExp(`^${esc}$`, 'i'), -1);
            if (!d.success) log(`deposit ${name}: ${d.message}`);
        }
        await bot.closeBank();
        log(`banked ${names.length} kinds; inv=${st().inventory.length}/28`);
    }

    async function mineStep() {
        await walkNode('mine');
        const m = metal();
        let mined = 0, fails = 0;
        const mt0 = Date.now();
        while (st().inventory.length < 28 && Date.now() - t0 < LOOP_MS) {
            await safety();
            let want: RegExp;
            if (m === 'iron') want = /iron ore/i;
            else want = count(/^copper ore$/i) <= count(/^tin ore$/i) ? /copper ore/i : /tin ore/i;
            let rock = sdk.findNearbyLoc(want, { reachable: true, withOption: /^mine$/i });
            if (!rock && m === 'bronze') {
                // the other bronze ore keeps the trip moving; the pair evens out later
                want = /copper ore/i.test(want.source) ? /tin ore/i : /copper ore/i;
                rock = sdk.findNearbyLoc(want, { reachable: true, withOption: /^mine$/i });
            }
            if (!rock) { await sdk.waitForTicks(2); continue; }
            const r = await bot.mineRock(rock, { timeout: 20_000 });
            if (r.success) mined++; else fails++;
            if (!r.success || mined % 5 === 0) log(`mine ${rock.name} (${rock.x},${rock.z}): ${r.success ? 'ok' : r.reason} ${r.success ? '' : r.message} cu=${count(/^copper ore$/i)} tin=${count(/^tin ore$/i)} fe=${count(/^iron ore$/i)} mining=${lvl('Mining')}`);
        }
        const secs = (Date.now() - mt0) / 1000;
        log(`mined ${mined} (${fails} fails) in ${secs.toFixed(0)}s, ${(mined / secs * 60).toFixed(1)}/min; inv=${st().inventory.length}/28`);
    }

    const oreCount = () => count(/^(copper ore|iron ore)$/i);

    // Furnace Smelt dialog, make-10. bot.interactLoc reports "Nothing happened"
    // here: the dialog (options "Smelt 10 Iron" etc.) opens 2 ticks after a plain
    // sendInteractLoc but is not one of the effects it waits for (probe, 2026-10-19).
    // The batch runs on a weak queue; stop when the ore stops going in.
    async function smeltBatch(m: 'bronze' | 'iron'): Promise<number> {
        await bot.dismissBlockingUI();
        const furnace = sdk.findNearbyLoc(/^furnace$/i, { withOption: /smelt/i });
        const op = furnace?.optionsWithIndex.find(o => /smelt/i.test(o.text));
        if (!furnace || !op) return 0;
        await sdk.sendInteractLoc(furnace.x, furnace.z, furnace.id, op.opIndex);
        const label = new RegExp(`^smelt 10 ${m}$`, 'i');
        try { await sdk.waitForCondition(s => s.dialog.isOpen && s.dialog.options.some(o => label.test(o.text)), 8_000); }
        catch { log('smelting dialog did not open'); return 0; }
        const ore0 = oreCount();
        const c = await sdk.clickDialogByText(label);
        if (!c.success) { log(`click Smelt 10: ${c.message}`); return 0; }
        let last = ore0, idle = 0;
        while (idle < 8 && last > 0) {
            await sdk.waitForTicks(1);
            const now = oreCount();
            if (now < last) { last = now; idle = 0; } else idle++;
        }
        return ore0 - last;
    }

    async function smeltStep() {
        await walkNode('furnace');
        let ok = 0, failed = 0;
        const s0 = Date.now();
        const bars0 = count(/ bar$/i), ores0 = oreCount();
        for (let batch = 0; batch < 6 && oreCount() > 0; batch++) {
            const m = count(/^iron ore$/i) > 0 && lvl('Smithing') >= 15 ? 'iron' : 'bronze';
            if (m === 'bronze' && count(/^tin ore$/i) === 0) break;
            const used = await smeltBatch(m);
            log(`batch ${batch + 1}: ${used} ore in; bars=${count(/ bar$/i)} smithing=${lvl('Smithing')}`);
            if (used === 0) break;
        }
        if (oreCount() < ores0) {
            ok = count(/ bar$/i) - bars0; failed = ores0 - oreCount() - ok;
        }
        let errors = 0;
        while (Date.now() - t0 < LOOP_MS + 120_000) {
            await safety();
            const m = count(/^iron ore$/i) > 0 && lvl('Smithing') >= 15 ? 'iron' : 'bronze';
            const ore = m === 'iron' ? sdk.findInventoryItem(/^iron ore$/i)
                : (count(/^tin ore$/i) > 0 ? sdk.findInventoryItem(/^copper ore$/i) : null);
            if (!ore) break;
            const furnace = sdk.findNearbyLoc(/^furnace$/i, { withOption: /smelt/i });
            if (!furnace) throw new Error('no furnace with a Smelt option nearby');
            const before = count(/^(copper ore|iron ore)$/i), bars0 = count(/ bar$/i);
            const u = await bot.useItemOnLoc(ore, furnace);
            if (!u.success) { log(`use ${ore.name} on furnace: ${u.message}`); if (++errors > 5) break; continue; }
            try {
                await sdk.waitForCondition(s => s.inventory.filter(i => /^(copper ore|iron ore)$/i.test(i.name)).reduce((a, i) => a + i.count, 0) < before, 8_000);
            } catch { log('ore did not go in 8 s'); if (++errors > 5) break; continue; }
            if (count(/ bar$/i) > bars0) ok++; else failed++; // impure iron
        }
        const secs = (Date.now() - s0) / 1000;
        log(`smelted ${ok} bars (${failed} failed or impure) in ${secs.toFixed(0)}s; smithing=${lvl('Smithing')} (${xp('Smithing')})`);
    }

    async function smithStep() {
        await walkNode('anvil');
        const s0 = Date.now();
        let made = 0;
        while (count(/^(bronze|iron) bar$/i) > 0) {
            await safety();
            await bot.dismissBlockingUI();
            const bar = sdk.findInventoryItem(/^(bronze|iron) bar$/i)!;
            const metalName = bar.name.split(' ')[0].toLowerCase();
            const anvil = sdk.findNearbyLoc(/^anvil$/i, { reachable: true });
            if (!anvil) throw new Error('no reachable anvil nearby');
            const bars0 = count(/^(bronze|iron) bar$/i);
            const u = await sdk.sendUseItemOnLoc(bar.slot, anvil.x, anvil.z, anvil.id);
            if (!u.success) throw new Error(`use bar on anvil: ${u.message}`);
            try { await sdk.waitForCondition(s => !!s.interface?.isOpen && s.interface.interfaceId === 994, 8_000); }
            catch { log('smithing interface did not open'); continue; }
            // dagger: component 1119 slot 0; option 3 is make-10 (smithing.rs2 inv_button3)
            await sdk.sendClickComponentWithOption(1119, 3, 0);
            // wait until the batch stops: bars gone, 10 made, or no change for 8 ticks
            let last = bars0, idle = 0;
            while (idle < 8) {
                await sdk.waitForTicks(1);
                const now = count(/^(bronze|iron) bar$/i);
                if (now < last) { last = now; idle = 0; } else idle++;
                if (now === 0 || bars0 - now >= 10) break;
            }
            made += bars0 - last;
            log(`smithed ${bars0 - last} ${metalName} daggers; smithing=${lvl('Smithing')} (${xp('Smithing')})`);
            if (bars0 === last) { log('no progress at the anvil; stopping this step'); break; }
        }
        log(`smith step: ${made} items in ${((Date.now() - s0) / 1000).toFixed(0)}s`);
    }

    // The browser client can go quiet for a few seconds (seen 2026-10-19,
    // "waitForTicks(1) safety timeout"); wait for fresh state and redo the step.
    let gaps = 0;
    async function rideOutGap(e: Error): Promise<boolean> {
        if (!/no state updates|stale|not connected|disconnect/i.test(e.message) || ++gaps > 3) return false;
        log(`state gap (${e.message}); waiting for fresh state, gap ${gaps}/3`);
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 2_000));
            if (sdk.getStateAge() < 3_000) return true;
        }
        return false;
    }

    try {
        let steps = 0;
        do {
            steps++;
            try { await oneStep(); }
            catch (e) { if (e instanceof Stop || !(await rideOutGap(e as Error))) throw e; }
        } while (Date.now() - t0 < LOOP_MS && steps < 20);
    } catch (e) {
        if (!(e instanceof Stop)) console.log(`error: ${(e as Error).message}`);
    }

    async function oneStep() {
        const inv = st().inventory;
        const bars = count(/^(bronze|iron) bar$/i);
        const pairs = Math.min(count(/^copper ore$/i), count(/^tin ore$/i));
        const iron = lvl('Smithing') >= 15 ? count(/^iron ore$/i) : 0;
        const junk = inv.filter(i => !KEEP.test(i.name) && !ORE_OR_BAR.test(i.name)).length;
        const full = inv.length >= 28;
        const atFurnace = nearestIndex() <= 1;
        const pastBank = nearestIndex() >= CHAIN.findIndex(n => n.name === 'bank');
        if (pairs + iron > 0 && atFurnace) await smeltStep();
        else if (bars > 0) await smithStep();
        else if (junk > 0 && (full || pairs + iron === 0 || pastBank)) await bankStep();
        else if (pairs + iron > 0 && full) await smeltStep();
        else if (!full) await mineStep();
        else throw new Error(`stuck: full inventory with nothing to smelt or bank (${inv.map(i => i.name).join(', ')})`);
    }

    if (PARK) await walkNode('courtyard', false).catch(e => console.log(`park failed: ${e.message}`));
    const s = st();
    console.log(`end: pos=${pos()} hp=${s.player.hp}/${s.player.maxHp} smithing=${lvl('Smithing')} (+${xp('Smithing') - smXp0}) mining=${lvl('Mining')} (+${xp('Mining') - mnXp0}) inv=${s.inventory.length}/28 in ${el()}`);
    console.log(`inv: ${s.inventory.map(i => `${i.name}${i.count > 1 ? 'x' + i.count : ''}`).join(', ')}`);
}, { timeout: LOOP_MS + 600_000, printState: false });
