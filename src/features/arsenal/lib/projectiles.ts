import type { GameDoc, PlayerId, Vec, WeaponId } from "../../../shared/types";
export function fire(
  doc: GameDoc,
  owner: PlayerId,
  weapon: WeaponId,
  angle: number,
  damage: number,
  speed: number,
  pierce: number,
): void {
  const origin = doc.players[owner];
  doc.bullets.push({
    id: doc.nextId++,
    x: origin.x,
    y: origin.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: weapon === "nova" ? 6 : 4,
    damage,
    life: weapon === "orbit" ? 1.25 : 2.1,
    owner,
    weapon,
    pierce,
    hit: [],
  });
}
/** 自动索敌以该角色自身位置为基准，两名玩家可以分别锁定不同目标。 */
export function nearestTarget(doc: GameDoc, owner: PlayerId): Vec | undefined {
  const origin = doc.players[owner];
  let best: Vec | undefined,
    bestSquared = Infinity;
  for (const e of doc.enemies) {
    if (e.hp <= 0) continue;
    const n = (e.x - origin.x) ** 2 + (e.y - origin.y) ** 2;
    if (n < bestSquared) {
      best = e;
      bestSquared = n;
    }
  }
  return best;
}
