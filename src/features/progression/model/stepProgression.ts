import type { GameDoc, FrameEvents } from "../../../shared/types";
import { generateDrops, collectDrops } from "../lib/drops";
import { queueUpgrades } from "./choices";
export function stepProgression(
  doc: GameDoc,
  events: FrameEvents,
  dt: number,
): void {
  generateDrops(doc, events);
  collectDrops(doc, events, dt);
  if (!doc.victory) queueUpgrades(doc);
}
