import { createRun } from "../src/shared/createRun";
import { simulate } from "../src/app/simulate";
const idle = { x: 0, y: 0, aim: { x: 500, y: 325 }, firing: false };
// 单人模式 10 秒
const solo = createRun(204004, [], "solo");
solo.phase = "playing";
for (let i = 0; i < 60 * 10; i++) simulate(solo, [idle], 1 / 60);
console.log(
  "solo:",
  JSON.stringify({
    phase: solo.phase,
    players: solo.players.length,
    time: solo.time.toFixed(1),
    wave: solo.wave,
    enemies: solo.enemies.length,
    hp: solo.players[0].hp.toFixed(0),
    level: solo.panels[0].level,
    kills: solo.stats.kills,
    collected: solo.stats.collected,
  }),
);
// 双人模式 30 秒
const coop = createRun(204004, [], "coop");
coop.phase = "playing";
for (let i = 0; i < 60 * 30; i++) simulate(coop, [idle, idle], 1 / 60);
console.log(
  "coop:",
  JSON.stringify({
    phase: coop.phase,
    players: coop.players.length,
    time: coop.time.toFixed(1),
    wave: coop.wave,
    enemies: coop.enemies.length,
    hp: coop.players.map((p) => Math.round(p.hp)),
    downed: coop.players.map((p) => p.downed),
    levels: coop.panels.map((p) => p.level),
    xp: coop.panels.map((p) => Math.round(p.xp)),
    kills: coop.panels.map((p) => p.stats.kills),
    shots: coop.panels.map((p) => p.stats.shots),
    targets: [...new Set(coop.enemies.map((e) => e.target))].sort(),
  }),
);
// 经验平均分配校验
const xp = createRun(7, [], "coop");
xp.phase = "playing";
xp.drops.push({ id: 1, x: xp.players[0].x, y: xp.players[0].y, kind: "xp", value: 4, life: 30 });
for (let i = 0; i < 5; i++) simulate(xp, [idle, idle], 1 / 60);
console.log("xp split:", xp.panels.map((p) => p.xp));
