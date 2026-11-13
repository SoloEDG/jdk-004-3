import type { GameDoc } from "../../../shared/types";
import { UPGRADE_CATALOG } from "../model/catalog";
import { currentUpgradePanel } from "../model/choices";
export function UpgradeDialog({
  doc,
  choose,
}: {
  doc: GameDoc;
  choose: (id: string) => void;
}) {
  const panel = currentUpgradePanel(doc);
  if (!panel) return null;
  const turn = doc.upgradeQueue.indexOf(panel.id) + 1;
  return (
    <div className="overlay">
      <div className="upgrade-dialog">
        <div className="eyebrow">EVOLUTION AVAILABLE</div>
        <h2>
          <span style={{ color: panel.color }}>{panel.name}</span>
          的进化选择
        </h2>
        <p>
          等级 {panel.level} · 战场已冻结
          {doc.mode === "coop" && ` · 轮到第 ${turn} 位玩家`}
        </p>
        <div className="upgrade-options">
          {panel.choices.map((id) => {
            const u = UPGRADE_CATALOG.find((u) => u.id === id);
            if (!u) return null;
            return (
              <button key={id} onClick={() => choose(id)}>
                <span className="upgrade-symbol">✧</span>
                <small>{u.category}</small>
                <h3>{u.name}</h3>
                <p>{u.description}</p>
                <span className="choose-label">选择升级 ↗</span>
              </button>
            );
          })}
        </div>
        <small className="muted">
          {doc.mode === "coop"
            ? "两人依次完成选择后战场才会解冻 · 经验由全队平均分配"
            : "武器与被动升级可叠加 · 同时获得多个等级会依次选择"}
        </small>
      </div>
    </div>
  );
}
