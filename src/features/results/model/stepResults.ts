import type { GameDoc, FrameEvents } from "../../../shared/types";
import { applyEvents, makeRecord } from "./ledger";
import { saveRecords } from "../lib/storage";
export function stepResults(doc: GameDoc, events: FrameEvents): void {
  if (doc.phase === "ended") return;
  applyEvents(doc, events);
  // 双人模式：一方倒下仍可被救援，只有双方同时倒下才结算。
  const allDown = doc.players.every((p) => p.hp <= 0 || p.downed);
  if (!allDown && !doc.victory) return;
  // 结算前冻结战场，保证重复帧幂等。
  doc.phase = "ended";
  doc.upgradeQueue = [];
  for (const panel of doc.panels) panel.choices = [];
  doc.notice = doc.victory ? "撤离成功 · 信号保全" : "信号中断 · 再次连接";
  doc.records = [makeRecord(doc), ...doc.records].slice(0, 20);
  saveRecords(doc.records);
}
