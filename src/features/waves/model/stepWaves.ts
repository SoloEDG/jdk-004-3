import type { GameDoc, PlayerId } from "../../../shared/types";
import { distance, normalize } from "../../../shared/math";
import { spawnEnemy } from "../lib/spawn";
import { ENEMY_CATALOG, WAVE_DURATION, TOTAL_WAVES } from "./catalog";
/** 敌人目标交接：在所有未倒地角色中选最近的一个；全员倒地返回 -1。 */
export function pickTarget(doc: GameDoc, x: number, y: number): PlayerId | -1 {
  let target: PlayerId | -1 = -1;
  let best = Infinity;
  for (const player of doc.players) {
    if (player.downed || player.hp <= 0) continue;
    const range = (player.x - x) ** 2 + (player.y - y) ** 2;
    if (range < best) {
      best = range;
      target = player.id;
    }
  }
  return target;
}
export function stepWaves(doc: GameDoc, dt: number): void {
  if (doc.victory) return;
  if (doc.wave === 0) {
    doc.wave = 1;
    doc.spawnBudget = 1;
    doc.notice = "第 1 波 · 信号已连接";
  }
  doc.waveTime += dt;
  while (doc.waveTime >= WAVE_DURATION) {
    doc.waveTime -= WAVE_DURATION;
    if (doc.wave >= TOTAL_WAVES) {
      doc.victory = true;
      doc.notice = "全部波次已清除";
      return;
    }
    doc.wave++;
    doc.notice = `第 ${doc.wave} 波 · 威胁升级`;
  }
  doc.spawnBudget += dt * (1.05 + doc.wave * 0.27);
  while (doc.spawnBudget >= 1) {
    doc.spawnBudget--;
    if (doc.enemies.length < 180) doc.enemies.push(spawnEnemy(doc));
  }
  for (const enemy of doc.enemies) {
    // 每帧重新选择目标，队友倒地后敌潮会立刻转向存活者。
    enemy.target = pickTarget(doc, enemy.x, enemy.y);
    if (enemy.target === -1) {
      enemy.cooldown -= dt;
      continue;
    }
    const player = doc.players[enemy.target];
    const toward = normalize(player.x - enemy.x, player.y - enemy.y),
      range = distance(enemy, player);
    const standOff =
      enemy.kind === "shooter" ? (range < 170 ? -1 : range < 245 ? 0 : 1) : 1;
    const speed = ENEMY_CATALOG[enemy.kind].speed * (1 + doc.wave * 0.035);
    enemy.x += toward.x * speed * standOff * dt;
    enemy.y += toward.y * speed * standOff * dt;
    enemy.cooldown -= dt;
    if (enemy.kind !== "chaser" && enemy.cooldown <= 0) {
      enemy.cooldown = enemy.kind === "elite" ? 1.8 : 2.6;
      const angle = Math.atan2(toward.y, toward.x),
        spread = enemy.kind === "elite" ? [-0.24, 0, 0.24] : [0];
      for (const offset of spread) {
        doc.bullets.push({
          id: doc.nextId++,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle + offset) * 160,
          vy: Math.sin(angle + offset) * 160,
          radius: 5,
          damage: enemy.kind === "elite" ? 16 : 10,
          life: 5,
          owner: -1,
          weapon: "enemy",
          pierce: 0,
          hit: [],
        });
      }
    }
  }
}
