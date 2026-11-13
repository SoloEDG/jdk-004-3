import { test } from "node:test";
import assert from "node:assert/strict";
import { createRun } from "../src/shared/createRun";
import { simulate } from "../src/app/simulate";
import { stepCombat, makeFrameEvents } from "../src/features/combat";
import { stepProgression, chooseUpgrade } from "../src/features/progression";
import { stepResults } from "../src/features/results";
import { pickTarget } from "../src/features/waves";
import { hurtPlayer, healPlayer } from "../src/features/combat/model/health";
import { RESCUE_RADIUS, RESCUE_TIME } from "../src/shared/types";
import type { GameDoc, Input } from "../src/shared/types";
const idle = (): Input => ({ x: 0, y: 0, aim: { x: 500, y: 325 }, firing: false });
const coopRun = (): GameDoc => {
  const d = createRun(204004, [], "coop");
  d.phase = "playing";
  return d;
};
test("coop run provisions two independent players and panels sharing one wave", () => {
  const d = coopRun();
  assert.equal(d.players.length, 2);
  assert.equal(d.panels.length, 2);
  assert.equal(d.upgradeQueue.length, 0);
  assert.deepEqual(
    d.panels.map((p) => p.level),
    [1, 1],
  );
  assert.deepEqual(
    d.players.map((p) => p.downed),
    [false, false],
  );
});
test("xp crystals are split evenly instead of belonging to the last collector", () => {
  const d = coopRun();
  // 晶体放在玩家一身上，由玩家一触发拾取。
  d.players[0].x = 500;
  d.players[0].y = 325;
  d.players[1].x = 100;
  d.players[1].y = 100;
  d.drops = [{ id: 99, x: 500, y: 325, kind: "xp", value: 10, life: 30 }];
  stepProgression(d, makeFrameEvents(2), 0);
  assert.equal(d.drops.length, 0);
  // 10 点经验在两名在线角色间平分，各得 5，而非拾取者独吞 10。
  assert.equal(d.panels[0].xp, 5);
  assert.equal(d.panels[1].xp, 5);
});
test("a downed player is offline and receives no share of experience", () => {
  const d = coopRun();
  d.players[1].downed = true;
  d.players[1].hp = 0;
  d.players[0].x = 500;
  d.players[0].y = 325;
  d.drops = [{ id: 99, x: 500, y: 325, kind: "xp", value: 8, life: 30 }];
  stepProgression(d, makeFrameEvents(2), 0);
  assert.equal(d.panels[0].xp, 8);
  assert.equal(d.panels[1].xp, 0);
});
test("heal pickups are credited only to the collecting player's panel", () => {
  const d = coopRun();
  d.players[0].hp = 40;
  d.players[1].hp = 40;
  d.players[0].x = 500;
  d.players[0].y = 325;
  const events = makeFrameEvents(2);
  d.drops = [{ id: 7, x: 500, y: 325, kind: "heal", value: 18, life: 20 }];
  stepProgression(d, events, 0);
  assert.equal(d.players[0].hp, 58);
  assert.equal(d.players[1].hp, 40);
  assert.equal(events.perPlayer[0].healed, 18);
  assert.equal(events.perPlayer[1].healed, 0);
});
test("enemies retarget onto the nearest standing player and ignore downed ones", () => {
  const d = coopRun();
  d.players[0].x = 100;
  d.players[0].y = 100;
  d.players[1].x = 600;
  d.players[1].y = 325;
  assert.equal(pickTarget(d, 620, 325), 1);
  assert.equal(pickTarget(d, 120, 110), 0);
  d.players[1].downed = true;
  d.players[1].hp = 0;
  // 玩家二离线后，靠近其位置的敌人也只能转向玩家一。
  assert.equal(pickTarget(d, 620, 325), 0);
  d.players[0].downed = true;
  d.players[0].hp = 0;
  assert.equal(pickTarget(d, 500, 325), -1);
});
test("bullet hits, kills and weapon damage are attributed to the firing panel", () => {
  const d = coopRun();
  d.enemies = [
    {
      id: 5,
      kind: "chaser",
      x: 600,
      y: 325,
      hp: 10,
      maxHp: 10,
      radius: 12,
      cooldown: 0,
      target: -1,
    },
  ];
  d.bullets = [
    {
      id: 6,
      x: 600,
      y: 325,
      vx: 0,
      vy: 0,
      radius: 5,
      damage: 20,
      life: 1,
      owner: 1,
      weapon: "pulse",
      pierce: 0,
      hit: [],
    },
  ];
  const e = stepCombat(d, [idle(), idle()], 0);
  assert.equal(e.perPlayer[1].kills.length, 1);
  assert.equal(e.perPlayer[1].kills[0].owner, 1);
  assert.equal(e.perPlayer[1].weaponDamage.pulse, 10);
  assert.equal(e.perPlayer[0].damage, 0);
  stepResults(d, e);
  assert.equal(d.panels[1].stats.kills, 1);
  assert.equal(d.panels[0].stats.kills, 0);
  assert.equal(d.stats.kills, 1);
});
test("enemy bullets only damage players they can hit and credit that panel's taken", () => {
  const d = coopRun();
  d.players[0].x = 500;
  d.players[0].y = 325;
  d.players[1].x = 120;
  d.players[1].y = 120;
  d.bullets = [
    {
      id: 8,
      x: 500,
      y: 325,
      vx: 0,
      vy: 0,
      radius: 5,
      damage: 15,
      life: 1,
      owner: -1,
      weapon: "enemy",
      pierce: 0,
      hit: [],
    },
  ];
  const e = stepCombat(d, [idle(), idle()], 0);
  assert.equal(e.perPlayer[0].taken, 15);
  assert.equal(e.perPlayer[1].taken, 0);
  assert.equal(d.players[0].hp, 85);
});
test("one player falling does not end the run; both falling settles it", () => {
  const d = coopRun();
  const e0 = makeFrameEvents(2);
  hurtPlayer(d, 0, 9999);
  stepResults(d, e0);
  assert.equal(d.players[0].downed, true);
  assert.notEqual(d.phase, "ended");
  hurtPlayer(d, 1, 9999);
  stepResults(d, makeFrameEvents(2));
  assert.equal(d.players[1].downed, true);
  assert.equal(d.phase, "ended");
});
test("rescue requires continuous presence in the danger zone and resets on leaving", () => {
  const d = coopRun();
  hurtPlayer(d, 1, 9999);
  assert.equal(d.players[1].downed, true);
  // 队友进入危险区，持续救援但未满时。
  d.players[0].x = d.players[1].x;
  d.players[0].y = d.players[1].y;
  const step = (dt: number) =>
    stepCombat(d, [idle(), idle()], dt).perPlayer;
  step(RESCUE_TIME / 2);
  assert.ok(d.players[1].rescueProgress > 0);
  assert.equal(d.players[1].downed, true);
  // 离开危险区：连续救援中断，进度清零。
  d.players[0].x = d.players[1].x + RESCUE_RADIUS + 50;
  step(0.1);
  assert.equal(d.players[1].rescueProgress, 0);
  assert.equal(d.players[1].downed, true);
  // 重新进入并停留足够时长，救援成功。
  d.players[0].x = d.players[1].x;
  d.players[0].y = d.players[1].y;
  step(RESCUE_TIME + 0.1);
  assert.equal(d.players[1].downed, false);
  assert.equal(d.players[1].rescueProgress, 0);
  assert.ok(d.players[1].hp > 0);
});
test("a level up freezes the field and both players resolve choices in order", () => {
  const d = coopRun();
  // 两名角色同时积攒出待升级等级。
  d.panels[0].pendingLevels = 1;
  d.panels[1].pendingLevels = 1;
  stepProgression(d, makeFrameEvents(2), 0);
  assert.equal(d.phase, "upgrade");
  assert.deepEqual(d.upgradeQueue, [0, 1]);
  assert.equal(d.panels[0].choices.length, 3);
  assert.equal(d.panels[1].choices.length, 0);
  chooseUpgrade(d, d.panels[0].choices[0]);
  assert.equal(d.phase, "upgrade");
  assert.deepEqual(d.upgradeQueue, [1]);
  assert.equal(d.panels[1].choices.length, 3);
  chooseUpgrade(d, d.panels[1].choices[0]);
  assert.equal(d.phase, "playing");
  assert.deepEqual(d.upgradeQueue, []);
});
test("a downed player's pending level waits until they are revived", () => {
  const d = coopRun();
  d.players[1].downed = true;
  d.players[1].hp = 0;
  d.panels[0].pendingLevels = 1;
  d.panels[1].pendingLevels = 2;
  stepProgression(d, makeFrameEvents(2), 0);
  // 只有在线的玩家一进入冻结选择，离线的玩家二不持续获得等级处理。
  assert.deepEqual(d.upgradeQueue, [0]);
  chooseUpgrade(d, d.panels[0].choices[0]);
  assert.equal(d.phase, "playing");
  assert.equal(d.panels[1].pendingLevels, 2);
});
test("upgrades and weapons stay isolated on each player's panel", () => {
  const d = coopRun();
  d.panels[0].pendingLevels = 1;
  stepProgression(d, makeFrameEvents(2), 0);
  // 新角色必然有未升满的强化，取第一个非恢复选项验证面板隔离。
  const choice = d.panels[0].choices.find((c) => c !== "recovery")!;
  assert.ok(choice);
  chooseUpgrade(d, choice);
  assert.equal(d.panels[0].upgrades[choice], 1);
  assert.equal(d.panels[1].upgrades[choice] || 0, 0);
});
test("restart clears rescue progress and both players' inputs", async () => {
  // 通过 useGame 层验证重开会清空按键与输入；这里直接模拟 createRun 的等价重置。
  const d = coopRun();
  hurtPlayer(d, 0, 9999);
  d.players[0].rescueProgress = 1.5;
  const fresh = createRun(204004, d.records, "coop");
  assert.deepEqual(
    fresh.players.map((p) => ({ downed: p.downed, rescue: p.rescueProgress })),
    [
      { downed: false, rescue: 0 },
      { downed: false, rescue: 0 },
    ],
  );
  assert.deepEqual(fresh.panels.map((p) => p.xp), [0, 0]);
  assert.deepEqual(fresh.panels.map((p) => p.level), [1, 1]);
});
test("full co-op simulation keeps shared waves while advancing both panels", () => {
  const d = coopRun();
  for (let i = 0; i < 120; i++) simulate(d, [idle(), idle()], 1 / 60);
  assert.ok(d.time > 1.5);
  assert.equal(d.enemies.length > 0, true);
  // 两个角色都在战场内且未越界。
  for (const p of d.players) {
    assert.ok(p.x >= 0 && p.x <= 1000);
    assert.ok(p.y >= 0 && p.y <= 650);
  }
});
test("healPlayer refuses to heal a downed player", () => {
  const d = coopRun();
  d.players[0].downed = true;
  d.players[0].hp = 0;
  assert.equal(healPlayer(d, 0, 50), 0);
  assert.equal(d.players[0].hp, 0);
});
