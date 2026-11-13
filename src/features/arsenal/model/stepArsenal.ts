import type { GameDoc, Input, PlayerFrameEvents } from "../../../shared/types";
import { fire, nearestTarget } from "../lib/projectiles";
import { WEAPON_CATALOG } from "./catalog";
/**
 * 每名存活玩家独立结算自己的装备冷却与开火；
 * 强化（火力/射速/穿透）只读取该角色面板，倒地角色停火。
 */
export function stepArsenal(
  doc: GameDoc,
  inputs: Input[],
  dt: number,
  events: PlayerFrameEvents[],
): void {
  for (const player of doc.players) {
    if (player.downed) continue;
    const panel = doc.panels[player.id];
    const input = inputs[player.id];
    const target = nearestTarget(doc, player.id),
      aim = input.firing ? input.aim : target || input.aim;
    const angle = Math.atan2(aim.y - player.y, aim.x - player.x);
    const power = 1 + (panel.upgrades.power || 0) * 0.2,
      haste = 1 + (panel.upgrades.haste || 0) * 0.13;
    for (const weapon of panel.weapons) {
      weapon.cooldown -= dt;
      if (weapon.cooldown > 0) continue;
      weapon.cooldown = Math.max(
        0.08,
        WEAPON_CATALOG[weapon.id].interval /
          haste /
          (1 + (weapon.level - 1) * 0.12),
      );
      const damage =
        (weapon.id === "pulse" ? 16 : weapon.id === "orbit" ? 13 : 12) *
        power *
        (1 + (weapon.level - 1) * 0.3);
      if (weapon.id === "pulse") {
        const count = weapon.level >= 4 ? 3 : weapon.level >= 2 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          fire(
            doc,
            player.id,
            "pulse",
            angle + (i - (count - 1) / 2) * 0.12,
            damage,
            440,
            panel.upgrades.pierce || 0,
          );
          events[player.id].shots++;
        }
      } else {
        const count =
          weapon.id === "orbit" ? 4 + weapon.level : 10 + weapon.level * 2;
        for (let i = 0; i < count; i++) {
          fire(
            doc,
            player.id,
            weapon.id,
            doc.time * 0.8 + (i * Math.PI * 2) / count,
            damage,
            weapon.id === "orbit" ? 150 : 240,
            weapon.id === "orbit" ? 3 : 1,
          );
          events[player.id].shots++;
        }
      }
    }
  }
}
