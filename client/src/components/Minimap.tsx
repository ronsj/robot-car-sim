import { useEffect, useRef } from "react";
import type { Rect, RobotState } from "../types";

interface MinimapProps {
  robot: RobotState;
  trail: Array<[number, number]>;
  world: { width: number; height: number; walls: Rect[]; obstacles: Rect[] };
}

function worldToCanvas(
  x: number,
  y: number,
  worldW: number,
  worldH: number,
  canvasW: number,
  canvasH: number,
  padding: number
): [number, number] {
  const innerW = canvasW - padding * 2;
  const innerH = canvasH - padding * 2;
  const cx = padding + ((x + worldW / 2) / worldW) * innerW;
  const cy = padding + ((worldH / 2 - y) / worldH) * innerH;
  return [cx, cy];
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  worldW: number,
  worldH: number,
  canvasW: number,
  canvasH: number,
  padding: number,
  fill: string
) {
  const [x1, y1] = worldToCanvas(rect.x - rect.width / 2, rect.y + rect.height / 2, worldW, worldH, canvasW, canvasH, padding);
  const [x2, y2] = worldToCanvas(rect.x + rect.width / 2, rect.y - rect.height / 2, worldW, worldH, canvasW, canvasH, padding);
  ctx.fillStyle = fill;
  ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
}

export function Minimap({ robot, trail, world }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 12;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);

    for (const obs of world.obstacles) {
      drawRect(ctx, obs, world.width, world.height, w, h, padding, "#c2410c");
    }

    if (trail.length > 1) {
      ctx.beginPath();
      const [startX, startY] = worldToCanvas(trail[0][0], trail[0][1], world.width, world.height, w, h, padding);
      ctx.moveTo(startX, startY);
      for (let i = 1; i < trail.length; i++) {
        const alpha = i / trail.length;
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 + alpha * 0.6})`;
        const [px, py] = worldToCanvas(trail[i][0], trail[i][1], world.width, world.height, w, h, padding);
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const [rx, ry] = worldToCanvas(robot.x, robot.y, world.width, world.height, w, h, padding);
    const size = 8;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-robot.theta);
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.6, size * 0.5);
    ctx.lineTo(-size * 0.6, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [robot, trail, world]);

  return <canvas ref={canvasRef} className="minimap-canvas" />;
}
