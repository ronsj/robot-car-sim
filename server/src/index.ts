import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage, StateMessage } from '../../shared/types.js'
import { SIM_HZ } from '../../shared/types.js'
import { Simulation } from './simulation.js'
import { world } from './world.js'

const PORT = Number(process.env.PORT) || 3001

function resolveClientDist(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url))
  while (true) {
    const candidate = path.join(dir, 'client/dist')
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'client/dist')
}

const CLIENT_DIST = resolveClientDist()

const MIME: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const sim = new Simulation()
const clients = new Set<WebSocket>()

function resolveClientFile(pathname: string): string | null {
  const resolved = path.resolve(CLIENT_DIST, `.${pathname}`)
  if (resolved !== CLIENT_DIST && !resolved.startsWith(CLIENT_DIST + path.sep)) {
    return null
  }
  return resolved
}

function serveIndex(res: http.ServerResponse): void {
  const indexPath = path.join(CLIENT_DIST, 'index.html')
  fs.readFile(indexPath, (err, data) => {
    if (err) {
      res.writeHead(404).end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(data)
  })
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const filePath = resolveClientFile(url.pathname)
  if (!filePath) {
    res.writeHead(403).end()
    return
  }

  const targetPath = url.pathname.endsWith('/')
    ? path.join(filePath, 'index.html')
    : filePath

  fs.stat(targetPath, (err, stat) => {
    if (err || !stat.isFile()) {
      serveIndex(res)
      return
    }

    const ext = path.extname(targetPath)
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    fs.createReadStream(targetPath).pipe(res)
  })
}

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

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end()
    return
  }
  serveStatic(req, res)
})

const wss = new WebSocketServer({ server })

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

server.listen(PORT, () => {
  const hasClientDist = fs.existsSync(path.join(CLIENT_DIST, 'index.html'))
  console.log(`Robot car sim listening on port ${PORT}`)
  if (hasClientDist) {
    console.log(`Serving client from ${CLIENT_DIST}`)
  } else {
    console.log(`Client dist not found at ${CLIENT_DIST} (WebSocket only)`)
  }
})
