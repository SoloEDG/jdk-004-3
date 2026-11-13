import { test } from "node:test";
import assert from "node:assert/strict";
import { createRun } from "../src/shared/createRun";
import { stepCombat } from "../src/features/combat";
import { stepWaves } from "../src/features/waves";
import { stepArsenal } from "../src/features/arsenal";
import { stepProgression, chooseUpgrade } from "../src/features/progression";
import { stepResults } from "../src/features/results";
import type { FrameEvents, Input } from "../src/shared/types";
const input = (): Input => ({
  x: 0,
  y: 0,
  aim: { x: 700, y: 325 },
  firing: false,
});
const inputs = (count = 1): Input[] =>
  Array.from({ length: count }, () => input());
const events = (count = 1): FrameEvents => ({
  perPlayer: Array.from({ length: count }, () => ({
    kills: [],
    damage: 0,
    taken: 0,
    healed: 0,
    shots: 0,
    collected: 0,
    weaponDamage: {},
  })),
});
const enemy = (id = 1) => ({
  id,
  kind: "chaser" as const,
  x: 600,
  y: 325,
  hp: 10,
  maxHp: 10,
  radius: 12,
  cooldown: 0,
  target: -1 as const,
});
test("automatic fire acquires a target without pointer firing", () => {
  const d = createRun();
  d.enemies = [enemy()];
  const e = events();
  stepArsenal(d, inputs(), 1 / 60, e.perPlayer);
  assert.ok(e.perPlayer[0].shots > 0);
  assert.ok(d.bullets.some((b) => b.owner === 0));
});
test("collision kills once, reports actual damage and prevents duplicate piercing hits", () => {
  const d = createRun();
  d.enemies = [enemy()];
  d.bullets = [
    {
      id: 2,
      x: 600,
      y: 325,
      vx: 0,
      vy: 0,
      radius: 5,
      damage: 20,
      life: 1,
      owner: 0,
      weapon: "pulse",
      pierce: 2,
      hit: [],
    },
  ];
  const e = stepCombat(d, inputs(), 0);
  assert.equal(e.perPlayer[0].kills.length, 1);
  assert.equal(e.perPlayer[0].damage, 10);
  assert.equal(stepCombat(d, inputs(), 0).perPlayer[0].kills.length, 0);
});
test("contact invincibility prevents repeated frame damage", () => {
  const d = createRun();
  d.enemies = [{ ...enemy(), x: 500, target: 0 }];
  assert.ok(stepCombat(d, inputs(), 0).perPlayer[0].taken > 0);
  assert.equal(stepCombat(d, inputs(), 0).perPlayer[0].taken, 0);
});
test("large experience pickup queues every level and choices consume one at a time", () => {
  const d = createRun();
  d.phase = "playing";
  d.drops = [{ id: 4, x: 500, y: 325, kind: "xp", value: 100, life: 30 }];
  stepProgression(d, events(), 0);
  assert.equal(d.phase, "upgrade");
  const panel = d.panels[0];
  assert.ok(panel.pendingLevels > 1);
  const pending = panel.pendingLevels;
  chooseUpgrade(d, panel.choices[0]);
  assert.equal(panel.pendingLevels, pending - 1);
  assert.equal(d.phase, "upgrade");
  while (panel.pendingLevels) chooseUpgrade(d, panel.choices[0]);
  assert.equal(d.phase, "playing");
});
test("eight elapsed waves signal victory", () => {
  const d = createRun();
  d.wave = 8;
  d.waveTime = 29.99;
  stepWaves(d, 0.02);
  assert.equal(d.victory, true);
});
test("finished results append a single immutable record", () => {
  const d = createRun();
  d.phase = "playing";
  d.players[0].hp = 0;
  d.players[0].downed = true;
  stepResults(d, events());
  assert.equal(d.phase, "ended");
  assert.equal(d.records.length, 1);
  stepResults(d, events());
  assert.equal(d.records.length, 1);
});
test("weapon damage includes nonlethal hits and ignores overkill", () => {
  const d = createRun();
  d.enemies = [{ ...enemy(), hp: 30, maxHp: 30 }];
  d.bullets = [
    {
      id: 2,
      x: 600,
      y: 325,
      vx: 0,
      vy: 0,
      radius: 5,
      damage: 20,
      life: 1,
      owner: 0,
      weapon: "pulse",
      pierce: 0,
      hit: [],
    },
  ];
  const e = stepCombat(d, inputs(), 0);
  stepResults(d, e);
  assert.equal(d.panels[0].stats.byWeapon.pulse, 20);
  assert.equal(d.panels[0].stats.kills, 0);
});
