import type { GameDoc, Input } from "../shared/types";
import { stepCombat } from "../features/combat";
import { stepWaves } from "../features/waves";
import { stepArsenal } from "../features/arsenal";
import { stepProgression } from "../features/progression";
import { stepResults } from "../features/results";
/** 两名玩家共享同一份敌潮、弹幕与掉落，输入按面板 id 分别传入。 */
export function simulate(doc: GameDoc, inputs: Input[], dt: number) {
  if (doc.phase !== "playing") return;
  doc.time += dt;
  stepWaves(doc, dt);
  const events = stepCombat(doc, inputs, dt);
  stepArsenal(doc, inputs, dt, events.perPlayer);
  stepProgression(doc, events, dt);
  stepResults(doc, events);
}
