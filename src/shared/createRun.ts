import type {
  GameDoc,
  GameMode,
  Player,
  PlayerId,
  PlayerPanel,
  RunRecord,
  RunStats,
} from "./types";
import { PLAYER_COLORS, PLAYER_NAMES } from "./types";
function emptyStats(): RunStats {
  return {
    kills: 0,
    damage: 0,
    taken: 0,
    healed: 0,
    collected: 0,
    shots: 0,
    byWeapon: { pulse: 0, orbit: 0, nova: 0 },
  };
}
export function createPlayer(id: PlayerId): Player {
  return {
    id,
    x: id === 0 ? 460 : 540,
    y: 325,
    hp: 100,
    maxHp: 100,
    speed: 190,
    radius: 12,
    invincible: 0,
    downed: false,
    rescueProgress: 0,
  };
}
export function createPanel(id: PlayerId): PlayerPanel {
  return {
    id,
    name: PLAYER_NAMES[id],
    color: PLAYER_COLORS[id],
    weapons: [{ id: "pulse", level: 1, cooldown: 0 }],
    upgrades: {},
    choices: [],
    xp: 0,
    level: 1,
    pendingLevels: 0,
    stats: emptyStats(),
  };
}
export function createRun(
  seed = 204004,
  records: RunRecord[] = [],
  mode: GameMode = "solo",
): GameDoc {
  const count = mode === "coop" ? 2 : 1;
  const players: Player[] = [];
  const panels: PlayerPanel[] = [];
  for (let i = 0; i < count; i++) {
    players.push(createPlayer(i as PlayerId));
    panels.push(createPanel(i as PlayerId));
  }
  // 单人时唯一角色居中部署；双人时两名角色分列中心两侧。
  if (mode === "solo") players[0].x = 500;
  return {
    version: 2,
    mode,
    seed,
    initialSeed: seed,
    nextId: 1,
    phase: "ready",
    time: 0,
    players,
    panels,
    upgradeQueue: [],
    enemies: [],
    bullets: [],
    drops: [],
    wave: 0,
    waveTime: 0,
    spawnBudget: 0,
    stats: emptyStats(),
    records,
    notice: mode === "coop" ? "等待接入双人战场" : "等待接入战场",
    victory: false,
  };
}
