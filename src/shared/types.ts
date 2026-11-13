export type Vec = { x: number; y: number };
export type Phase = "ready" | "playing" | "paused" | "upgrade" | "ended";
export type WeaponId = "pulse" | "orbit" | "nova";
/** 0 = 玩家一（WASD），1 = 玩家二（方向键）；-1 表示无归属（敌方实体）。 */
export type PlayerId = 0 | 1;
export type GameMode = "solo" | "coop";
export interface Player extends Vec {
  id: PlayerId;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  invincible: number;
  /** 倒地（等待救援）标记；单人模式倒地即结算，双人模式可被队友拉起。 */
  downed: boolean;
  /** 当前被救援的累计进度（秒），离开救援范围会清零。 */
  rescueProgress: number;
}
export interface Enemy extends Vec {
  id: number;
  kind: "chaser" | "shooter" | "elite";
  hp: number;
  maxHp: number;
  radius: number;
  cooldown: number;
  /** 当前锁定的玩家，由敌潮每帧重新分配；无人可锁定时为 -1。 */
  target: PlayerId | -1;
}
export interface Bullet extends Vec {
  id: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  /** 玩家弹幕携带归属面板 id，敌方为 -1。 */
  owner: PlayerId | -1;
  weapon: WeaponId | "enemy";
  pierce: number;
  hit: number[];
}
export interface Drop extends Vec {
  id: number;
  kind: "xp" | "heal" | "magnet";
  value: number;
  life: number;
}
export interface Weapon {
  id: WeaponId;
  level: number;
  cooldown: number;
}
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: string;
  max: number;
}
export interface RunStats {
  kills: number;
  damage: number;
  taken: number;
  healed: number;
  collected: number;
  shots: number;
  byWeapon: Record<WeaponId, number>;
}
/** 每个角色独立的成长面板：装备、升级、经验与个人遥测都归属到这里。 */
export interface PlayerPanel {
  id: PlayerId;
  name: string;
  color: string;
  weapons: Weapon[];
  upgrades: Record<string, number>;
  choices: string[];
  xp: number;
  level: number;
  pendingLevels: number;
  stats: RunStats;
}
export interface RunRecord {
  id: string;
  mode: GameMode;
  duration: number;
  wave: number;
  level: number;
  kills: number;
  damage: number;
  weapons: string[];
  victory: boolean;
}
export interface GameDoc {
  version: 2;
  mode: GameMode;
  seed: number;
  initialSeed: number;
  nextId: number;
  phase: Phase;
  time: number;
  players: Player[];
  /** 与 players 一一对应的角色面板。 */
  panels: PlayerPanel[];
  /** 升级冻结期间等待处理选择的玩家队列，保证两人依次选择。 */
  upgradeQueue: PlayerId[];
  enemies: Enemy[];
  bullets: Bullet[];
  drops: Drop[];
  /** 两名玩家共享的同一波敌潮进度。 */
  wave: number;
  waveTime: number;
  spawnBudget: number;
  /** 汇总遥测，每帧由各角色面板聚合，供结算与界面使用。 */
  stats: RunStats;
  records: RunRecord[];
  notice: string;
  victory: boolean;
}
export interface Input {
  x: number;
  y: number;
  aim: Vec;
  firing: boolean;
}
export interface KillEvent {
  enemy: Enemy;
  weapon: WeaponId;
  /** 完成击杀的角色面板，用于伤害/击杀归属交接。 */
  owner: PlayerId;
}
export interface PlayerFrameEvents {
  kills: KillEvent[];
  damage: number;
  taken: number;
  healed: number;
  shots: number;
  collected: number;
  weaponDamage: Partial<Record<WeaponId, number>>;
}
export interface FrameEvents {
  perPlayer: PlayerFrameEvents[];
}
export const WIDTH = 1000;
export const HEIGHT = 650;
/** 救援需要在危险区内持续停留的秒数。 */
export const RESCUE_TIME = 2.5;
/** 队友救援的有效范围（危险区半径）。 */
export const RESCUE_RADIUS = 70;
/** 救援成功后恢复的生命值。 */
export const RESCUE_HEAL = 40;
export const PLAYER_COLORS = ["#cdfedc", "#9ecbff"] as const;
export const PLAYER_NAMES = ["先驱者 01", "先驱者 02"] as const;
