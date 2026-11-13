import type { GameDoc, PlayerPanel, WeaponId } from "../../../shared/types";
const names: Record<WeaponId, [string, string, string]> = {
  pulse: ["脉冲射线", "PULSE RIFLE", "⌁"],
  orbit: ["轨道刃", "ORBITAL BLADE", "◎"],
  nova: ["新星爆发", "NOVA BURST", "✳"],
};
function PlayerArsenal({ panel }: { panel: PlayerPanel }) {
  return (
    <div className={`player-arsenal p${panel.id + 1}`}>
      <div className="section-caption">
        <span>
          <i className="player-dot" style={{ background: panel.color }} />
          {panel.name}
        </span>
        <span className="mono muted">{panel.weapons.length} / 3</span>
      </div>
      <div className="weapons">
        {(["pulse", "orbit", "nova"] as WeaponId[]).map((id) => {
          const w = panel.weapons.find((w) => w.id === id);
          return (
            <div className={`weapon ${w ? "" : "locked"}`} key={id}>
              <div className={`weapon-icon ${id}`}>{names[id][2]}</div>
              <div>
                <strong>{names[id][0]}</strong>
                <small>{names[id][1]}</small>
              </div>
              <span className="weapon-level">
                {w ? `Lv.${w.level}` : "未装配"}
              </span>
              {w && (
                <div className="level-pips">
                  {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} className={i < w.level ? "active" : ""} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function ArsenalPanel({ doc }: { doc: GameDoc }) {
  return (
    <section className="panel">
      <div className="section-caption">
        <span>武器系统</span>
        <span className="mono muted">{doc.mode === "coop" ? "双人配装" : "单人配装"}</span>
      </div>
      {doc.panels.map((panel) => (
        <PlayerArsenal key={panel.id} panel={panel} />
      ))}
      <div className="hint">
        ↗ 各自自动锁定最近目标
        <br />
        <span>升级时选择新武器，两名角色独立构筑火力组合。</span>
      </div>
    </section>
  );
}
