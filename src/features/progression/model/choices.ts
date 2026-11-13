import type { GameDoc, PlayerId, PlayerPanel, WeaponId } from "../../../shared/types";
import { random } from "../../../shared/math";
import { UPGRADE_CATALOG } from "./catalog";
/** 升级选项从该角色自己的升级/装备进度中生成，两人互不干扰。 */
export function rollChoices(doc: GameDoc, panel: PlayerPanel): void {
  const available = UPGRADE_CATALOG.filter(
    (u) => u.id !== "recovery" && (panel.upgrades[u.id] || 0) < u.max,
  ).map((u) => u.id);
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(random(doc) * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  panel.choices = available.slice(0, 3);
  // 所有有限升级升满后，紧急修复保证排队的等级仍可消费。
  if (!panel.choices.length) panel.choices = ["recovery"];
}
/**
 * 任一人升级都会冻结整场战斗，并把待选角色排进队列；
 * 队列按入队顺序依次处理两人的选择，全部完成后才解冻。
 */
export function queueUpgrades(doc: GameDoc): void {
  if (doc.phase !== "playing" || doc.upgradeQueue.length) return;
  const queue: PlayerId[] = [];
  for (const panel of doc.panels) {
    // 倒地的一方离线，不能持续获得等级：其待处理等级留到被救起后再冻结选择。
    const player = doc.players[panel.id];
    if (panel.pendingLevels > 0 && !player.downed) queue.push(panel.id);
  }
  if (!queue.length) return;
  doc.upgradeQueue = queue;
  rollChoices(doc, doc.panels[queue[0]]);
  doc.phase = "upgrade";
  doc.notice = "战场冻结 · 进化选择";
}
export function currentUpgradePanel(doc: GameDoc): PlayerPanel | undefined {
  const id = doc.upgradeQueue[0];
  return id === undefined ? undefined : doc.panels[id];
}
export function chooseUpgrade(doc: GameDoc, id: string): void {
  if (doc.phase !== "upgrade") return;
  const panel = currentUpgradePanel(doc);
  if (!panel || !panel.choices.includes(id) || panel.pendingLevels <= 0) return;
  const player = doc.players[panel.id];
  if (id === "recovery") {
    player.hp = Math.min(player.maxHp, player.hp + 30);
  } else {
    const definition = UPGRADE_CATALOG.find((u) => u.id === id);
    if (!definition || (panel.upgrades[id] || 0) >= definition.max) return;
    panel.upgrades[id] = (panel.upgrades[id] || 0) + 1;
    if (id === "speed") player.speed += 190 * 0.12;
    if (id === "vitality") {
      player.maxHp += 20;
      player.hp = Math.min(player.maxHp, player.hp + 20);
    }
    if (id === "pulse" || id === "orbit" || id === "nova") {
      const weapon = panel.weapons.find((w) => w.id === id);
      if (weapon) weapon.level++;
      else panel.weapons.push({ id: id as WeaponId, level: 1, cooldown: 0 });
    }
  }
  panel.pendingLevels--;
  panel.choices = [];
  if (panel.pendingLevels > 0) {
    // 同一角色连升多级：继续冻结，依次选择。
    rollChoices(doc, panel);
    return;
  }
  doc.upgradeQueue.shift();
  const next = currentUpgradePanel(doc);
  if (next) {
    // 轮到队友处理其升级选择，战场保持冻结。
    rollChoices(doc, next);
    return;
  }
  doc.phase = "playing";
  doc.notice = "升级完成 · 继续战斗";
}
