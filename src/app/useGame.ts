import { useEffect, useRef, useState } from "react";
import { createRun } from "../shared/createRun";
import type { GameMode, Input } from "../shared/types";
import { simulate } from "./simulate";
import { chooseUpgrade } from "../features/progression";
import { loadRecords, saveRecords } from "../features/results";
function idleInput(): Input {
  return { x: 0, y: 0, aim: { x: 500, y: 0 }, firing: false };
}
export function useGame() {
  const [mode, setModeState] = useState<GameMode>("solo");
  const game = useRef(createRun(204004, loadRecords(), mode));
  // 双人模式下两套输入分别对接两个角色面板，互不串键。
  const inputs = useRef<Input[]>([idleInput(), idleInput()]);
  const keys = useRef(new Set<string>());
  const [, render] = useState(0);
  useEffect(() => {
    let raf = 0,
      last = 0,
      acc = 0,
      paint = 0;
    const tick = (now: number) => {
      const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const d = game.current;
      const held = keys.current;
      // 玩家一：WASD；玩家二：方向键。
      const p1 = inputs.current[0];
      p1.x = Number(held.has("d")) - Number(held.has("a"));
      p1.y = Number(held.has("s")) - Number(held.has("w"));
      const p2 = inputs.current[1];
      p2.x =
        Number(held.has("arrowright")) - Number(held.has("arrowleft"));
      p2.y = Number(held.has("arrowdown")) - Number(held.has("arrowup"));
      if (d.phase === "playing") {
        acc += elapsed;
        while (acc >= 1 / 60) {
          simulate(d, inputs.current, 1 / 60);
          acc -= 1 / 60;
          if (d.phase !== "playing") {
            acc = 0;
            break;
          }
        }
      } else acc = 0;
      if (now - paint > 32) {
        render((n) => n + 1);
        paint = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const pause = () => {
      if (game.current.phase === "playing") game.current.phase = "paused";
      keys.current.clear();
      for (const input of inputs.current) input.firing = false;
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k))
        e.preventDefault();
      keys.current.add(k);
      if ((k === "escape" || k === "p") && !e.repeat) {
        const d = game.current;
        if (d.phase === "playing") d.phase = "paused";
        else if (d.phase === "paused") d.phase = "playing";
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const hidden = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  return {
    game,
    inputs,
    mode,
    setMode: (next: GameMode) => {
      if (game.current.phase === "playing" || game.current.phase === "upgrade")
        return;
      setModeState(next);
      keys.current.clear();
      // 切换模式即重开一局，清空上一局输入与救援进度。
      game.current = createRun(204004, game.current.records, next);
    },
    start: () => {
      game.current.phase = "playing";
    },
    toggle: () => {
      const d = game.current;
      if (d.phase === "playing") d.phase = "paused";
      else if (d.phase === "paused") d.phase = "playing";
    },
    choose: (id: string) => chooseUpgrade(game.current, id),
    restart: () => {
      saveRecords(game.current.records);
      const records = game.current.records;
      const previousMode = game.current.mode;
      // 重开必须清除上一局的救援进度与双方输入。
      keys.current.clear();
      inputs.current = [idleInput(), idleInput()];
      game.current = createRun(204004, records, previousMode);
      game.current.phase = "playing";
    },
  };
}
