import type { GameDoc, PlayerPanel } from "../../../shared/types";
import { xpRequired } from "../lib/experience";
function PlayerExperience({ panel }: { panel: PlayerPanel }) {
  return (
    <div className={`experience player-xp p${panel.id + 1}`}>
      <div className="xp-level mono" style={{ color: panel.color }}>
        P{panel.id + 1} · LV. {panel.level.toString().padStart(2, "0")}
      </div>
      <div className="xp-track">
        <i
          style={{
            width: `${Math.min(100, (panel.xp / xpRequired(panel.level)) * 100)}%`,
            background: panel.color,
          }}
        />
      </div>
      <span className="mono">
        {Math.floor(panel.xp)} / {xpRequired(panel.level)} XP
      </span>
    </div>
  );
}
export function ExperienceBar({ doc }: { doc: GameDoc }) {
  return (
    <div className={`experience-stack ${doc.mode}`}>
      {doc.panels.map((panel) => (
        <PlayerExperience key={panel.id} panel={panel} />
      ))}
    </div>
  );
}
