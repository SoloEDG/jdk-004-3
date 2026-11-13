import type { GameDoc, FrameEvents, RunRecord, RunStats } from "../../../shared/types";
function emptyStats(): RunStats {
  return {
    kills: 0,
    damage: 0,
    taken: 0,
    healed: 0,
    collected: 0,
    shots: 0,
    byWeapon: { pulse: 0, orbit: 0, nova: 0 },
  };
}
/** 遥测先交接给各自角色面板，再汇总成全局统计，归属清晰可核对。 */
export function applyEvents(doc: GameDoc, events: FrameEvents): void {
  const totals = emptyStats();
  for (const panel of doc.panels) {
    const e = events.perPlayer[panel.id];
    panel.stats.kills += e.kills.length;
    panel.stats.damage += e.damage;
    panel.stats.taken += e.taken;
    panel.stats.healed += e.healed;
    panel.stats.shots += e.shots;
    panel.stats.collected += e.collected;
    for (const weapon of ["pulse", "orbit", "nova"] as const) {
      const value = e.weaponDamage[weapon] || 0;
      panel.stats.byWeapon[weapon] += value;
      totals.byWeapon[weapon] += value;
    }
    totals.kills += e.kills.length;
    totals.damage += e.damage;
    totals.taken += e.taken;
    totals.healed += e.healed;
    totals.shots += e.shots;
    totals.collected += e.collected;
  }
  doc.stats = totals;
}
export function makeRecord(doc: GameDoc): RunRecord {
  const topLevel = Math.max(...doc.panels.map((p) => p.level));
  const weapons = doc.panels.flatMap((p) =>
    p.weapons.map((w) => `${p.id + 1}:${w.id}:${w.level}`),
  );
  return {
    id: `${doc.initialSeed}-${Date.now().toString(36)}`,
    mode: doc.mode,
    duration: doc.time,
    wave: doc.wave,
    level: topLevel,
    kills: doc.stats.kills,
    damage: Math.round(doc.stats.damage),
    weapons,
    victory: doc.victory,
  };
}
