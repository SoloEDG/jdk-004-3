import type {
  GameDoc,
  FrameEvents,
  PlayerPanel,
} from "../../../shared/types";
import { random, distance, normalize } from "../../../shared/math";
import { grantExperience } from "./experience";
import { healPlayer } from "../../combat/model/health";
export function generateDrops(doc: GameDoc, events: FrameEvents): void {
  for (const perPlayer of events.perPlayer) {
    for (const { enemy } of perPlayer.kills) {
      doc.drops.push({
        id: doc.nextId++,
        x: enemy.x,
        y: enemy.y,
        kind: "xp",
        value: enemy.kind === "elite" ? 10 : enemy.kind === "shooter" ? 3 : 2,
        life: 45,
      });
      const roll = random(doc);
      if (roll < 0.055)
        doc.drops.push({
          id: doc.nextId++,
          x: enemy.x + 8,
          y: enemy.y,
          kind: "heal",
          value: 18,
          life: 20,
        });
      else if (roll < 0.07)
        doc.drops.push({
          id: doc.nextId++,
          x: enemy.x - 8,
          y: enemy.y,
          kind: "magnet",
          value: 1,
          life: 20,
        });
    }
  }
}
/** 当前可以拾取的角色：倒地者离线，不参与经验/治疗分配。 */
function activeCollectors(doc: GameDoc) {
  return doc.players.filter((p) => !p.downed && p.hp > 0);
}
/**
 * 经验平均分配：一枚晶体由拾取者触发，但经验在所有在线角色间平分，
 * 不再由最后拾取者独享，从规则上消除抢晶体。
 */
function shareExperience(doc: GameDoc, value: number): void {
  const collectors = activeCollectors(doc);
  if (!collectors.length) return;
  const share = value / collectors.length;
  for (const player of collectors) grantExperience(doc, doc.panels[player.id], share);
}
export function collectDrops(
  doc: GameDoc,
  events: FrameEvents,
  dt: number,
): void {
  const magnets = new Set<number>();
  for (const drop of doc.drops) {
    drop.life -= dt;
    if (drop.life < 0) continue;
    let collector = null as null | (typeof doc.players)[number];
    for (const player of activeCollectors(doc)) {
      const panel = doc.panels[player.id];
      const pickupRadius = 65 + (panel.upgrades.magnet || 0) * 35;
      if (distance(drop, player) < pickupRadius) {
        collector = player;
        break;
      }
    }
    if (collector) {
      const range = distance(drop, collector);
      const toward = normalize(
        collector.x - drop.x,
        collector.y - drop.y,
      );
      const travel = Math.min(range, 360 * dt);
      drop.x += toward.x * travel;
      drop.y += toward.y * travel;
      if (distance(drop, collector) <= collector.radius + 9) {
        const panel = doc.panels[collector.id];
        const panelEvents = events.perPlayer[collector.id];
        drop.life = -1;
        panelEvents.collected++;
        if (drop.kind === "xp") shareExperience(doc, drop.value);
        if (drop.kind === "heal") {
          // 治疗归属拾取者自己的机体面板，不会奶到队友。
          const healed = healPlayer(doc, collector.id, drop.value);
          panelEvents.healed += healed;
        }
        if (drop.kind === "magnet") magnets.add(collector.id);
      }
    }
  }
  if (magnets.size) {
    for (const drop of doc.drops) {
      if (drop.life < 0 || drop.kind !== "xp") continue;
      const trigger = [...magnets][0];
      drop.life = -1;
      events.perPlayer[trigger].collected++;
      // 磁铁吸取的晶体同样走平均分配。
      shareExperience(doc, drop.value);
    }
  }
  doc.drops = doc.drops.filter((d) => d.life >= 0);
}
