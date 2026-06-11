export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface World {
  width: number;
  height: number;
  walls: Rect[];
  obstacles: Rect[];
}

export interface RobotState {
  x: number;
  y: number;
  theta: number;
  vx: number;
  omega: number;
}

export interface Telemetry {
  distance: number;
  collisions: number;
}

export interface ControlMessage {
  type: "control";
  forward: boolean;
  backward: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
}

export interface StateMessage {
  type: "state";
  t: number;
  robot: RobotState;
  trail: Array<[number, number]>;
  telemetry: Telemetry;
  world: World;
}

export type ClientMessage = ControlMessage;
export type ServerMessage = StateMessage;

export const ROBOT_RADIUS = 0.35;
export const MAX_LINEAR_SPEED = 1.5;
export const MAX_ANGULAR_SPEED = 2;
export const SIM_HZ = 30;
export const TRAIL_MAX_POINTS = 500;
