import type { GameDoc, PlayerId } from "../../../shared/types";
/**
 * 伤害只结算到指定角色面板：倒地、无敌期间不重复扣血。
 * 护甲强化读取该角色自己的升级，不与队友共享。
 */
export function hurtPlayer(
  doc: GameDoc,
  id: PlayerId,
  damage: number,
): number {
  const player = doc.players[id];
  const panel = doc.panels[id];
  if (!player || player.invincible > 0 || player.hp <= 0) return 0;
  const armor = panel.upgrades.armor || 0;
  const taken = Math.min(
    player.hp,
    Math.max(1, damage * (1 - armor * 0.12)),
  );
  player.hp -= taken;
  player.invincible = 0.65;
  if (player.hp <= 0) {
    player.hp = 0;
    player.downed = true;
    player.rescueProgress = 0;
  }
  return taken;
}
/** 治疗同样归属到具体面板，且不能超过该角色自己的生命上限。 */
export function healPlayer(doc: GameDoc, id: PlayerId, amount: number): number {
  const player = doc.players[id];
  if (!player || player.hp <= 0) return 0;
  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + amount);
  return player.hp - before;
}
