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
    { name: 'anvil', x: 3247, z: 3405 },
] as const;
type Node = typeof CHAIN[number]['name'];

const KEEP = /^(bronze pickaxe|hammer|coins|shrimps|bread)$/i;
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
            for (let attempt = 1; attempt <= 3; attempt++) {
                if (checkSafety) await safety();
                const w = await bot.walkTo(n.x, n.z, 3);
                const q = st().player;
                const d = Math.hypot(q.worldX - n.x, q.worldZ - n.z);
                if (d <= 5) break;
                log(`walk to ${n.name} attempt ${attempt}: ${w.message}, still ${d.toFixed(0)} tiles away at ${pos()}`);
                if (attempt === 3) throw new Error(`could not reach ${n.name}`);
            }
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
        const names = [...new Set(st().inventory.filter(i => !KEEP.test(i.name) && !ORE_OR_BAR.test(i.name)).map(i => i.name))];
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

    async function smeltStep() {
        await walkNode('furnace');
        let ok = 0, failed = 0;
        const s0 = Date.now();
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
            if (!u.success) { log(`use ${ore.name} on furnace: ${u.message}`); failed++; if (failed > 5) break; continue; }
            try {
                await sdk.waitForCondition(s => s.inventory.filter(i => /^(copper ore|iron ore)$/i.test(i.name)).reduce((a, i) => a + i.count, 0) < before, 8_000);
            } catch { log('ore did not go in 8 s'); failed++; if (failed > 5) break; continue; }
            if (count(/ bar$/i) > bars0) ok++; else failed++;
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

    try {
        let steps = 0;
        while (Date.now() - t0 < LOOP_MS && steps < 20) {
            steps++;
            const inv = st().inventory;
            const bars = count(/^(bronze|iron) bar$/i);
            const pairs = Math.min(count(/^copper ore$/i), count(/^tin ore$/i));
            const iron = lvl('Smithing') >= 15 ? count(/^iron ore$/i) : 0;
            const junk = inv.filter(i => !KEEP.test(i.name) && !ORE_OR_BAR.test(i.name)).length;
            const full = inv.length >= 28;
            if (bars > 0) await smithStep();
            else if (junk > 0 && (full || pairs + iron === 0)) await bankStep();
            else if (pairs + iron > 0 && (full || nearestIndex() <= 1)) await smeltStep();
            else if (!full) await mineStep();
            else throw new Error(`stuck: full inventory with nothing to smelt or bank (${inv.map(i => i.name).join(', ')})`);
        }
    } catch (e) {
        if (!(e instanceof Stop)) console.log(`error: ${(e as Error).message}`);
    }

    if (PARK) await walkNode('courtyard', false).catch(e => console.log(`park failed: ${e.message}`));
    const s = st();
    console.log(`end: pos=${pos()} hp=${s.player.hp}/${s.player.maxHp} smithing=${lvl('Smithing')} (+${xp('Smithing') - smXp0}) mining=${lvl('Mining')} (+${xp('Mining') - mnXp0}) inv=${s.inventory.length}/28 in ${el()}`);
    console.log(`inv: ${s.inventory.map(i => `${i.name}${i.count > 1 ? 'x' + i.count : ''}`).join(', ')}`);
}, { timeout: LOOP_MS + 600_000, printState: false });
