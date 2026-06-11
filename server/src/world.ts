import type { World } from "../../shared/types.js";

const ARENA_WIDTH = 20;
const ARENA_HEIGHT = 20;
const WALL_THICKNESS = 0.5;

const halfW = ARENA_WIDTH / 2;
const halfH = ARENA_HEIGHT / 2;
const t = WALL_THICKNESS;

export const world: World = {
  width: ARENA_WIDTH,
  height: ARENA_HEIGHT,
  walls: [
    { x: -halfW - t / 2, y: 0, width: t, height: ARENA_HEIGHT + t * 2 },
    { x: halfW + t / 2, y: 0, width: t, height: ARENA_HEIGHT + t * 2 },
    { x: 0, y: -halfH - t / 2, width: ARENA_WIDTH + t * 2, height: t },
    { x: 0, y: halfH + t / 2, width: ARENA_WIDTH + t * 2, height: t },
  ],
  obstacles: [
    { x: -4, y: -3, width: 2, height: 1.5 },
    { x: 3, y: 2, width: 1.5, height: 2 },
    { x: -1, y: 4, width: 3, height: 1 },
    { x: 5, y: -4, width: 1, height: 3 },
    { x: -6, y: 5, width: 2.5, height: 1 },
    { x: 2, y: -6, width: 1.5, height: 2 },
  ],
};
