import { useEffect, useRef } from "react";
import type { GameDoc, Input } from "../../../shared/types";
import { WIDTH, HEIGHT } from "../../../shared/types";
import { renderScene } from "../lib/renderScene";
export function Battlefield({
  doc,
  inputs,
}: {
  doc: GameDoc;
  inputs: React.RefObject<Input[]>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (ctx) renderScene(ctx, doc);
  });
  return (
    <canvas
      ref={canvas}
      width={WIDTH}
      height={HEIGHT}
      aria-label="弹幕战场，玩家一使用 WASD，玩家二使用方向键"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        // 鼠标指向只交接给玩家一，玩家二保持自动索敌。
        inputs.current[0].aim = {
          x: ((e.clientX - r.left) * WIDTH) / r.width,
          y: ((e.clientY - r.top) * HEIGHT) / r.height,
        };
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        inputs.current[0].firing = true;
      }}
      onPointerUp={() => (inputs.current[0].firing = false)}
      onPointerCancel={() => (inputs.current[0].firing = false)}
      onLostPointerCapture={() => (inputs.current[0].firing = false)}
    />
  );
}
