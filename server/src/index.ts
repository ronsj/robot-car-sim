import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage, StateMessage } from '../../shared/types.js'
import { SIM_HZ } from '../../shared/types.js'
import { Simulation } from './simulation.js'
import { world } from './world.js'

const PORT = Number(process.env.PORT) || 3001
const sim = new Simulation()
const clients = new Set<WebSocket>()

function buildState(): StateMessage {
  return {
    type: 'state',
    t: Date.now(),
    robot: { ...sim.robot },
    trail: [...sim.trail],
    telemetry: { ...sim.telemetry },
    world,
    dangerZonePaused: sim.dangerZonePaused,
  }
}

function broadcast(state: StateMessage): void {
  const payload = JSON.stringify(state)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.send(JSON.stringify(buildState()))

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as ClientMessage
      if (msg.type === 'control') {
        sim.setControl(msg)
      } else if (msg.type === 'continue') {
        sim.acknowledgeDangerZone()
      }
    } catch {
      // ignore malformed messages
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
  })
})

setInterval(() => {
  sim.step()
  broadcast(buildState())
}, 1000 / SIM_HZ)

console.log(`Robot car sim server listening on ws://localhost:${PORT}`)
