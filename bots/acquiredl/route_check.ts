// Offline route preview: no game client needed. Runs the SDK's own long-range
// pathfinder over a chain of legs and reports length and the closest approach
// to each known aggressive spawn (spawn points from server/content/maps).
// Usage: bun bots/acquiredl/route_check.ts 3211,3246 3253,3419 [more points]
import { findLongPath } from '../../sdk/pathfinding';

const DANGERS = [
    { name: 'dark wizards (7, 20)', x: 3227, z: 3369 },
    { name: 'black bear (19)', x: 3296, z: 3347 },
    { name: 'mugger (6) south', x: 3249, z: 3391 },
    { name: 'mugger (6) west', x: 3175, z: 3361 },
    { name: 'brown bear (21)', x: 3167, z: 3228 },
    { name: 'scorpions (14)', x: 3299, z: 3298 },
];

const pts = process.argv.slice(2).map(a => { const [x, z] = a.split(',').map(Number); return { x, z }; });
let total = 0;
const closest = DANGERS.map(d => ({ ...d, min: Infinity, at: '' }));
for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const wps = findLongPath(0, a.x, a.z, b.x, b.z, 500);
    const end = wps[wps.length - 1];
    const reached = end && end.x === b.x && end.z === b.z;
    // waypoints are turn points; walk them tile by tile
    let cx = a.x, cz = a.z, tiles = 0;
    for (const w of wps) {
        while (cx !== w.x || cz !== w.z) {
            cx += Math.sign(w.x - cx); cz += Math.sign(w.z - cz); tiles++;
            for (const c of closest) {
                const d = Math.max(Math.abs(cx - c.x), Math.abs(cz - c.z));
                if (d < c.min) { c.min = d; c.at = `(${cx}, ${cz})`; }
            }
        }
    }
    total += tiles;
    console.log(`leg ${a.x},${a.z} -> ${b.x},${b.z}: ${tiles} tiles, ${wps.length} turns, reached=${reached}${reached ? '' : ` ended (${end?.x}, ${end?.z})`}`);
    console.log(`   turns: ${wps.map(w => `${w.x},${w.z}`).join(' ')}`);
}
console.log(`total ${total} tiles (~${Math.round(total * 0.6)} s walking, ~${Math.round(total * 0.3)} s running)`);
for (const c of closest) console.log(`  closest to ${c.name} at (${c.x}, ${c.z}): ${c.min} tiles, at ${c.at}`);
