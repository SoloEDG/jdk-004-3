import type { GameDoc, PlayerPanel } from "../../../shared/types";
export const xpRequired = (level: number): number => 12 + (level - 1) * 7;
/** 经验只写入指定角色面板；升级在该面板上排队，等待战场冻结后选择。 */
export function grantExperience(
  doc: GameDoc,
  panel: PlayerPanel,
  value: number,
): void {
  panel.xp += value;
  while (panel.xp >= xpRequired(panel.level)) {
    panel.xp -= xpRequired(panel.level);
    panel.level++;
    panel.pendingLevels++;
  }
}
