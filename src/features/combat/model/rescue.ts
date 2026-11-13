import type { GameDoc, Player, PlayerFrameEvents } from "../../../shared/types";
import {
  RESCUE_HEAL,
  RESCUE_RADIUS,
  RESCUE_TIME,
} from "../../../shared/types";
import { distance } from "../../../shared/math";
/**
 * 双人救援：倒地者进入危险区，存活队友进入范围并持续停留才能拉起。
 * 队友一旦离开范围，救援进度立即中断清零；双方同时倒地时无人可救援。
 */
export function stepRescue(
  doc: GameDoc,
  events: PlayerFrameEvents[],
  dt: number,
): void {
  if (doc.mode !== "coop") return;
  const downed = doc.players.filter((p) => p.downed);
  for (const victim of downed) {
    const rescuer = doc.players.find(
      (p) => p.id !== victim.id && !p.downed && p.hp > 0,
    );
    if (!rescuer || distance(rescuer, victim) > RESCUE_RADIUS) {
      // 离开危险区：连续救援被打断，进度归零。
      victim.rescueProgress = 0;
      continue;
    }
    victim.rescueProgress += dt;
    if (victim.rescueProgress >= RESCUE_TIME) revive(doc, victim, rescuer, events);
  }
}
function revive(
  doc: GameDoc,
  victim: Player,
  rescuer: Player,
  events: PlayerFrameEvents[],
): void {
  victim.downed = false;
  victim.rescueProgress = 0;
  victim.invincible = 1.2;
  // 救援拉起发生在倒地状态解除的瞬间，直接恢复固定生命值并计入该角色治疗遥测。
  const healed = Math.min(RESCUE_HEAL, victim.maxHp - victim.hp);
  victim.hp += healed;
  events[victim.id].healed += healed;
  doc.notice = `${doc.panels[victim.id].name} 已被 ${doc.panels[rescuer.id].name} 拉起`;
}
