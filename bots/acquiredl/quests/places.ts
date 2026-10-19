// Named spots and safe routes for the quest scripts. Coordinates come from the
// server's own map and script files (server/content), read 2026-10-19; plane 0
// unless a `level` is given. Dangers are the NPCs that attack a combat-5 bot
// (an NPC with a huntmode attacks when the player's combat level is at most
// twice its own).
import { travel, route, climb, pos, log, converse, markDialogSeen, type Ctx } from './lib';

export const P = {
    courtyard: { x: 3222, z: 3219 },
    cook: { x: 3209, z: 3214 },
    castleStairsS: { x: 3205, z: 3209 },   // "Staircase" loc at (3204, 3207), all three planes
    duke: { x: 3212, z: 3220, level: 1 },
    spinningWheel: { x: 3209, z: 3213, level: 1 },
    generalStore: { x: 3211, z: 3244 },
    church: { x: 3243, z: 3207 },           // Father Aereck, doors (3243-44, 3216)
    urhney: { x: 3235, z: 3153 },           // shack due south of the castle, door (3234, 3156)
    coffin: { x: 3249, z: 3193 },           // "Coffin" (3249, 3192), crypt door (3247, 3193)
    fred: { x: 3189, z: 3273 },             // in his house, doors (3188, 3272) and (3189, 3275)
    sheepPen: { x: 3203, z: 3267 },         // 16 sheep, x 3193-3210, z 3259-3274; gate (3213, 3261)
    wheat: { x: 3158, z: 3298 },            // field x 3153-3164, z 3291-3306, gate (3162, 3290)
    millDoor: { x: 3166, z: 3301 },         // Large door (3166, 3302); ladder (3164, 3307)
    hopper: { x: 3166, z: 3306, level: 2 }, // "Hopper" (3166, 3307), "Hopper controls" (3166, 3305)
    flourBin: { x: 3166, z: 3306 },         // "Flour bin" (3166, 3307), op Empty
    chickenPen: { x: 3228, z: 3300 },       // eggs on the ground at (3226, 3301) and (3229, 3299)
    cows: { x: 3244, z: 3289 },             // any "Cow" gives milk; there is no dairy cow
    onionsLumbridge: { x: 3189, z: 3267 },  // "Onion" locs x 3188-3191, z 3266-3268, gate (3186, 3268)
    alKharidGate: { x: 3267, z: 3228 },
    // Al Kharid (Al-Kharid warriors in the palace are passive)
    hassan: { x: 3301, z: 3164 },           // inside the palace; Large doors (3292-93, 3167), (3298, 3171-72)
    osman: { x: 3286, z: 3180 },            // outside the palace, to the NW
    kebabSeller: { x: 3273, z: 3180 },      // "Kebab seller": 1 gp, "Yes please."
    // Draynor village (Prince Ali)
    ned: { x: 3100, z: 3257 },              // door (3101, 3258)
    leela: { x: 3113, z: 3263 },
    jailNorth: { x: 3123, z: 3244 },        // inside the jail, north of the Prison Door (3123, 3243); jail door (3128, 3246)
    logsByAggie: { x: 3089, z: 3265 },      // ground "Logs" (3089, 3265) and (3089, 3266)
    // Draynor and the Wizard Tower
    draynorBank: { x: 3092, z: 3245 },      // dark wizards (lvl 7) at (3084-3085, 3236-3238): stay at z >= 3246
    aggie: { x: 3086, z: 3259 },            // doors (3088, 3258), (3092, 3255)
    wizardTower: { x: 3109, z: 3168 },      // doors (3109, 3166), (3111, 3163), (3107, 3162)
    towerLadderDown: { x: 3104, z: 3162 },  // "Ladder" Climb-down
    sedridor: { x: 3103, z: 9571 },         // basement; ladder up (3103, 9576)
    skull: { x: 3120, z: 9567 },            // ground item "Skull"; taking it spawns a lvl 13 skeleton
    // Varrock
    varrockSquare: { x: 3212, z: 3424 },    // Romeo
    julietStairs: { x: 3156, z: 3434 },     // Staircase (3156, 3435); Juliet (3158, 3425) on plane 1
    apothecary: { x: 3195, z: 3404 },
    aubury: { x: 3253, z: 3402 },
    lawrence: { x: 3254, z: 3475 },
    berries: { x: 3270, z: 3368 },          // cadava (3266, 3361) (3273, 3375) (3277, 3370); redberries (3267, 3371) (3271, 3366) (3278, 3374)
    varrockEastBank: { x: 3253, z: 3420 },
    // Falador side
    wyson: { x: 3027, z: 3379 },
    doric: { x: 2951, z: 3450 },            // doors (2949, 3450), (2952, 3453)
    goblinGenerals: { x: 2957, z: 3512 },   // behind Large doors (2957-58, 3509)
    iceMountainTrapdoor: { x: 3019, z: 3451 },
    rustyAnchor: { x: 3045, z: 3257 },      // Port Sarim bartender
} as const;

/** Lumbridge castle: south staircase between planes 0, 1 and 2. */
export async function castleTo(c: Ctx, level: number): Promise<boolean> {
    for (let i = 0; i < 4 && pos(c).level !== level; i++) {
        await travel(c, P.castleStairsS.x, P.castleStairsS.z, 2);
        const up = pos(c).level < level;
        if (!(await climb(c, /^staircase$/i, up ? /^climb-up$/i : /^climb-down$/i))) {
            log(c, `castleTo ${level}: climb failed at ${pos(c).level}`);
            return false;
        }
    }
    return pos(c).level === level;
}

/** Lumbridge to the Varrock south-east, east of the dark wizards (stone circle
 * x 3223-3232, z 3363-3374) and the Lumbridge goblins. Checked in Session 2. */
export const LUMBRIDGE_TO_VARROCK_EAST: [number, number][] = [
    [3229, 3256], [3240, 3290], [3262, 3322], [3271, 3345], [3276, 3365],
];

/** Lumbridge to Draynor along the north road (z >= 3246 at the Draynor end). */
export const LUMBRIDGE_TO_DRAYNOR: [number, number][] = [
    [3200, 3247], [3150, 3250], [3105, 3250],
];

/**
 * Cross the Al Kharid toll gate (10 gp each way; free from Prince Ali stage
 * 100). Open the gate next to a Border Guard, answer "Yes, ok.", and the
 * server moves the player through. `into` = true heads east into Al Kharid.
 */
export async function tollGate(c: Ctx, into: boolean): Promise<boolean> {
    const inside = () => pos(c).x >= 3268;
    if (inside() === into) return true;
    await travel(c, into ? 3267 : 3268 + 1, 3227, 1);
    for (let attempt = 0; attempt < 3 && inside() !== into; attempt++) {
        markDialogSeen(c);
        const gate = c.sdk.findNearbyLoc(/^gate$/i, { withOption: /^open$/i });
        if (!gate) { log(c, 'toll gate not in view'); return false; }
        await c.bot.interactLoc(gate, /^open$/i);
        await converse(c, [/^yes, ok\.$/i]);
        try { await c.sdk.waitForCondition(() => inside() === into, 6_000); } catch { /* retried */ }
    }
    log(c, `toll gate: ${inside() === into ? 'through' : 'NOT through'} at ${pos(c).x}, ${pos(c).z}`);
    return inside() === into;
}

/**
 * Wizard Tower ground floor, west room: the basement ladder (3104, 3162) and
 * the staircase (3103, 3159) sit behind the diagonal Door (3107, 3162), which
 * spawns closed. With it shut, interacting with the ladder walks the bot round
 * the outside of the wall and reports "Nothing happened" (2026-10-19).
 */
export async function towerWestRoom(c: Ctx): Promise<void> {
    if (pos(c).z > 9000 || pos(c).level > 0) return;
    await travel(c, 3108, 3163, 1);
    const door = (await c.sdk.scanNearbyLocs(6)).find(l => l.x === 3107 && l.z === 3162 && l.optionsWithIndex.some(o => /^open$/i.test(o.text)));
    if (door) { const o = await c.bot.openDoor(door); log(c, `tower west door: ${o.success ? 'opened' : o.message}`); }
}

export { travel, route };
