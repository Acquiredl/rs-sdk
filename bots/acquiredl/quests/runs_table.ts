// Summarise runs-<bot>.jsonl into the per-quest table for the lab log:
// first start, last end, wall-clock span, ticks summed over runs, run count,
// failed runs, coins in and out. Offline, no game client needed.
// Usage: bun bots/acquiredl/quests/runs_table.ts acquiredl
import { readFileSync } from 'fs';
import { join } from 'path';
import type { RunRecord } from './lib';

const bot = process.argv[2] ?? 'acquiredl';
const rows: RunRecord[] = readFileSync(join(import.meta.dir, `runs-${bot}.jsonl`), 'utf8')
    .split('\n').filter(Boolean).map(l => JSON.parse(l));

const byQuest = new Map<string, RunRecord[]>();
for (const r of rows) byQuest.set(r.quest, [...(byQuest.get(r.quest) ?? []), r]);

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
console.log('| Quest | Start | End | Span | Script time | Ticks | Runs | Not ok | Coins net |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const [q, rs] of byQuest) {
    const start = rs[0].startedAt, end = rs[rs.length - 1].endedAt ?? start;
    const span = Math.round((Date.parse(end) - Date.parse(start)) / 60_000);
    const secs = rs.reduce((a, r) => a + (r.secs ?? 0), 0);
    const ticks = rs.reduce((a, r) => a + ((r.tick1 ?? r.tick0) - r.tick0), 0);
    const bad = rs.filter(r => !/^(ok|done|complete)/i.test(r.outcome ?? '')).length;
    const net = rs.reduce((a, r) => a + ((r.coins1 ?? r.coins0) - r.coins0), 0);
    console.log(`| ${q} | ${hhmm(start)} | ${hhmm(end)} | ${span} min | ${Math.round(secs / 60)} min | ${ticks} | ${rs.length} | ${bad} | ${net >= 0 ? '+' : ''}${net} |`);
}
console.log('\nRuns:');
for (const r of rows) console.log(`  ${hhmm(r.startedAt)} ${r.quest}/${r.step}: ${r.outcome} (${r.secs}s, ${(r.tick1 ?? r.tick0) - r.tick0} ticks, hp ${r.hp0}->${r.hp1}, coins ${r.coins0}->${r.coins1})${r.notes.length ? '\n      ' + r.notes.join('\n      ') : ''}`);
