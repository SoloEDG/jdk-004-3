import type { GameDoc } from "../../../shared/types";
import { formatTime } from "../../../shared/math";
export function ResultDialog({
  doc,
  restart,
}: {
  doc: GameDoc;
  restart: () => void;
}) {
  const topLevel = Math.max(...doc.panels.map((p) => p.level));
  return (
    <div className="overlay">
      <div className="result-dialog">
        <div className="eyebrow">
          MISSION {doc.victory ? "COMPLETE" : "ENDED"} ·{" "}
          {doc.mode === "coop" ? "双人协作" : "单人行动"}
        </div>
        <h2>{doc.victory ? "信号已送达。" : "信号暂时中断。"}</h2>
        <p>每一次坠落，都是下一次进化的起点。</p>
        <div className="result-grid">
          <div>
            <strong>{formatTime(doc.time)}</strong>
            <small>生存时间</small>
          </div>
          <div>
            <strong>{doc.stats.kills}</strong>
            <small>击败敌人</small>
          </div>
          <div>
            <strong>{topLevel}</strong>
            <small>最高等级</small>
          </div>
        </div>
        {doc.mode === "coop" && (
          <div className="coop-result-levels">
            {doc.panels.map((panel) => (
              <span key={panel.id} style={{ color: panel.color }}>
                {panel.name} · LV.{panel.level} · 击杀 {panel.stats.kills}
              </span>
            ))}
          </div>
        )}
        <div className="damage-breakdown">
          {Object.entries(doc.stats.byWeapon).map(([key, value]) => (
            <div key={key}>
              <span>{key.toUpperCase()}</span>
              <span>{Math.round(value)} DMG</span>
            </div>
          ))}
        </div>
        <button className="primary" onClick={restart}>
          重新接入 ↗
        </button>
        <p className="tiny">本地已记录 {doc.records.length} 次行动</p>
      </div>
    </div>
  );
}
