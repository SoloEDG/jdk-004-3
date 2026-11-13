import type {
  GameDoc,
  Input,
  FrameEvents,
  PlayerFrameEvents,
  PlayerId,
  WeaponId,
} from "../../../shared/types";
import { WIDTH, HEIGHT } from "../../../shared/types";
import { clamp, distance, normalize } from "../../../shared/math";
import { segmentDistance } from "../lib/collision";
import { hurtPlayer } from "./health";
import { stepRescue } from "./rescue";
export function makeFrameEvents(count: number): FrameEvents {
  const perPlayer: PlayerFrameEvents[] = [];
  for (let i = 0; i < count; i++) {
    perPlayer.push({
      kills: [],
      damage: 0,
      taken: 0,
      healed: 0,
      shots: 0,
      collected: 0,
      weaponDamage: {},
    });
  }
  return { perPlayer };
}
export function stepCombat(
  doc: GameDoc,
  inputs: Input[],
  dt: number,
): FrameEvents {
  const events = makeFrameEvents(doc.players.length);
  // 各自独立移动；倒地角色无法操作，留在原地等待救援。
  for (const player of doc.players) {
    player.invincible = Math.max(0, player.invincible - dt);
    if (player.downed) continue;
    const input = inputs[player.id];
    const direction = normalize(input.x, input.y),
      strength = Math.min(1, Math.hypot(input.x, input.y));
    player.x = clamp(
      player.x + direction.x * strength * player.speed * dt,
      player.radius,
      WIDTH - player.radius,
    );
    player.y = clamp(
      player.y + direction.y * strength * player.speed * dt,
      player.radius,
      HEIGHT - player.radius,
    );
  }
  for (const bullet of doc.bullets) {
    const previous = { x: bullet.x, y: bullet.y };
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (bullet.life < 0) continue;
    if (bullet.owner === -1) {
      // 敌方弹幕只伤害它锁定的角色；目标已倒地则交由其余角色判定。
      for (const player of doc.players) {
        if (player.downed) continue;
        if (
          segmentDistance(player, previous, bullet) <
          player.radius + bullet.radius
        ) {
          events.perPlayer[player.id].taken += hurtPlayer(
            doc,
            player.id,
            bullet.damage,
          );
          bullet.life = -1;
          break;
        }
      }
      continue;
    }
    // 玩家弹幕命中统一归属到发射者面板。
    const owner = bullet.owner as PlayerId;
    const weapon = bullet.weapon as WeaponId;
    for (const enemy of doc.enemies) {
      if (enemy.hp <= 0 || bullet.hit.includes(enemy.id)) continue;
      if (
        segmentDistance(enemy, previous, bullet) >
        enemy.radius + bullet.radius
      )
        continue;
      bullet.hit.push(enemy.id);
      const damage = Math.min(enemy.hp, bullet.damage);
      enemy.hp -= damage;
      const panelEvents = events.perPlayer[owner];
      panelEvents.damage += damage;
      panelEvents.weaponDamage[weapon] =
        (panelEvents.weaponDamage[weapon] || 0) + damage;
      if (enemy.hp <= 0)
        panelEvents.kills.push({ enemy: { ...enemy }, weapon, owner });
      if (bullet.pierce <= 0) {
        bullet.life = -1;
        break;
      }
      bullet.pierce--;
    }
  }
  // 近身接触伤害：每个敌人只撞击当前锁定且存活的目标。
  for (const enemy of doc.enemies) {
    if (enemy.hp <= 0 || enemy.target === -1) continue;
    const player = doc.players[enemy.target];
    if (player.downed) continue;
    if (distance(enemy, player) < enemy.radius + player.radius) {
      events.perPlayer[player.id].taken += hurtPlayer(
        doc,
        player.id,
        enemy.kind === "elite" ? 25 : 12,
      );
    }
  }
  doc.enemies = doc.enemies.filter((e) => e.hp > 0);
  doc.bullets = doc.bullets.filter(
    (b) =>
      b.life >= 0 &&
      b.x > -120 &&
      b.x < WIDTH + 120 &&
      b.y > -120 &&
      b.y < HEIGHT + 120,
  );
  stepRescue(doc, events.perPlayer, dt);
  return events;
}
