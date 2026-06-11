# Robot Car Sim

A browser-based robot car simulation with a real-time 3D view, top-down minimap, D-pad controls, and live telemetry. The server runs an authoritative physics simulation over WebSocket; the client renders state with React and Three.js.

## Setup

**Requirements:** Node.js 18+ and npm.

```bash
git clone <repo-url>
cd robot-car-sim
npm install
```

Build for production (optional):

```bash
npm run build
```

## Project Structure

```
robot-car-sim/
├── package.json          # Root workspace scripts
├── shared/
│   └── types.ts          # Shared WebSocket protocol and simulation constants
├── server/
│   └── src/
│       ├── index.ts      # WebSocket server entry (port 3001)
│       ├── simulation.ts # Diff-drive physics, collisions, trail
│       └── world.ts      # Arena dimensions, walls, obstacles
└── client/
    └── src/
        ├── App.tsx               # Main layout
        ├── hooks/
        │   └── useRobotSim.ts    # WebSocket connection and state
        ├── components/
        │   ├── Scene3D.tsx       # Three.js 3D arena and robot
        │   ├── Minimap.tsx       # 2D top-down canvas with trail
        │   ├── DPad.tsx          # On-screen and keyboard controls
        │   └── TelemetryPanel.tsx
        └── styles/
            └── app.css
```

## Features

- **Authoritative simulation** — Node.js WebSocket server runs physics at 30 Hz and broadcasts state to all clients
- **3D WebGL scene** — Three.js arena with walls, obstacles, robot model, and follow camera
- **Minimap with trail** — Top-down 2D view showing position history, obstacles, and heading
- **D-pad controls** — Press-and-hold buttons plus keyboard support (WASD / arrow keys)
- **Live telemetry** — Position, heading, speed, turn rate, distance traveled, collision count, and connection status

## Usage

Start both the server and client in development mode:

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Web UI  | http://localhost:5173 |
| WebSocket server | ws://localhost:3001 |

Run server or client individually:

```bash
npm run dev:server   # WebSocket server only
npm run dev:client   # Vite dev server only
```

### Controls

| Input | Action |
|-------|--------|
| ▲ / W / ↑ | Move forward |
| ▼ / S / ↓ | Move backward |
| ◀ / A / ← | Rotate left |
| ▶ / D / → | Rotate right |

Hold a direction to drive continuously. Release to stop. Driving into walls or obstacles stops the robot and increments the collision counter in the telemetry panel.

### Environment

Override the WebSocket URL for the client:

```bash
VITE_WS_URL=ws://localhost:3001 npm run dev -w client
```

### Production

After building:

```bash
npm run build
npm run start -w server   # Start compiled server
npm run preview -w client # Preview built client
```

Serve the client `dist/` folder with any static file server and point it at a running WebSocket server.
