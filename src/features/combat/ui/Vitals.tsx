import type { GameDoc, PlayerPanel } from "../../../shared/types";
import { RESCUE_TIME } from "../../../shared/types";
function PlayerVitals({ doc, panel }: { doc: GameDoc; panel: PlayerPanel }) {
  const player = doc.players[panel.id];
  return (
    <div className={`vitals player-vitals p${panel.id + 1}`}>
      <div className="section-caption">
        <span>
          <i className="player-dot" style={{ background: panel.color }} />
          {panel.name}
          {player.downed && <em className="downed-tag">待救援</em>}
        </span>
        <span className="mono">
          {Math.ceil(player.hp)} <small>/ {player.maxHp}</small>
        </span>
      </div>
      <div className="bar health">
        <i
          style={{
            width: `${(player.hp / player.maxHp) * 100}%`,
            background: panel.color,
          }}
        />
      </div>
      {player.downed && (
        <div className="bar rescue">
          <i
            style={{
              width: `${Math.min(100, (player.rescueProgress / RESCUE_TIME) * 100)}%`,
            }}
          />
        </div>
      )}
      <div className="vitals-foot">
        <span className="status-dot" />{" "}
        {player.downed
          ? "等待队友进入危险区"
          : player.hp > 30
            ? "生命信号稳定"
            : "警告 · 装甲受损"}
        <span>MK.0{panel.id + 1}</span>
      </div>
    </div>
  );
}
export function Vitals({ doc }: { doc: GameDoc }) {
  return (
    <>
      {doc.panels.map((panel: PlayerPanel) => (
        <PlayerVitals key={panel.id} doc={doc} panel={panel} />
      ))}
    </>
  );
}
