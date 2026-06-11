import type {
  Rect,
  RobotState,
  ControlMessage,
  Telemetry,
} from '../../shared/types.js'
import {
  ROBOT_RADIUS,
  MAX_LINEAR_SPEED,
  MAX_ANGULAR_SPEED,
  SIM_HZ,
  TRAIL_MAX_POINTS,
} from '../../shared/types.js'
import { world } from './world.js'

const DT = 1 / SIM_HZ

function circleIntersectsRect(
  cx: number,
  cy: number,
  r: number,
  rect: Rect
): boolean {
  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const closestX = Math.max(rect.x - halfW, Math.min(cx, rect.x + halfW))
  const closestY = Math.max(rect.y - halfH, Math.min(cy, rect.y + halfH))
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy < r * r
}

function collidesAt(x: number, y: number): boolean {
  const solids = [...world.walls, ...world.obstacles]
  return solids.some((rect) => circleIntersectsRect(x, y, ROBOT_RADIUS, rect))
}

export class Simulation {
  robot: RobotState = { x: 0, y: 0, theta: 0, vx: 0, omega: 0 }
  trail: Array<[number, number]> = [[0, 0]]
  telemetry: Telemetry = { distance: 0, collisions: 0 }
  control: ControlMessage = {
    type: 'control',
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
  }

  setControl(control: ControlMessage): void {
    this.control = control
  }

  step(): void {
    let vx = 0
    let omega = 0

    if (this.control.forward) vx += MAX_LINEAR_SPEED
    if (this.control.backward) vx -= MAX_LINEAR_SPEED
    if (this.control.rotateLeft) omega += MAX_ANGULAR_SPEED
    if (this.control.rotateRight) omega -= MAX_ANGULAR_SPEED

    this.robot.vx = vx
    this.robot.omega = omega

    const prevX = this.robot.x
    const prevY = this.robot.y

    const newTheta = this.robot.theta + omega * DT
    const newX = this.robot.x + vx * Math.cos(this.robot.theta) * DT
    const newY = this.robot.y + vx * Math.sin(this.robot.theta) * DT

    if (collidesAt(newX, newY)) {
      this.robot.vx = 0
      this.robot.omega = 0
      this.telemetry.collisions += 1
      return
    }

    this.robot.x = newX
    this.robot.y = newY
    this.robot.theta = newTheta

    const moved = Math.hypot(newX - prevX, newY - prevY)
    if (moved > 0.001 || Math.abs(omega) > 0.001) {
      this.telemetry.distance += moved
      this.trail.push([newX, newY])
      if (this.trail.length > TRAIL_MAX_POINTS) {
        this.trail.shift()
      }
    }
  }

  reset(): void {
    this.robot = { x: 0, y: 0, theta: 0, vx: 0, omega: 0 }
    this.trail = [[0, 0]]
    this.telemetry = { distance: 0, collisions: 0 }
  }
}
