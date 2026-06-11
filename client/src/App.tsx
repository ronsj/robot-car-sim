import { useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene3D } from './components/Scene3D'
import { Minimap } from './components/Minimap'
import { DPad } from './components/DPad'
import { TelemetryPanel } from './components/TelemetryPanel'
import { useRobotSim } from './hooks/useRobotSim'
import './styles/app.css'

const DEFAULT_WORLD = {
  width: 20,
  height: 20,
  walls: [] as { x: number; y: number; width: number; height: number }[],
  obstacles: [] as { x: number; y: number; width: number; height: number }[],
  dangerZones: [] as { x: number; y: number; width: number; height: number }[],
}

const DEFAULT_ROBOT = { x: 0, y: 0, theta: 0, vx: 0, omega: 0 }
const DEFAULT_TELEMETRY = {
  distance: 0,
  obstacleCollisions: 0,
  dangerZoneCollisions: 0,
}

export default function App() {
  const { state, status, updateRate, sendControl, connect, disconnect } =
    useRobotSim()

  const isConnected = status === 'connected'

  const handleControlChange = useCallback(
    (control: {
      forward: boolean
      backward: boolean
      rotateLeft: boolean
      rotateRight: boolean
    }) => {
      sendControl(control)
    },
    [sendControl]
  )

  const robot = state?.robot ?? DEFAULT_ROBOT
  const telemetry = state?.telemetry ?? DEFAULT_TELEMETRY
  const world = state?.world ?? DEFAULT_WORLD
  const trail = state?.trail ?? []

  return (
    <div className="app">
      <header className="app-header">
        <h1>Robot Car Sim</h1>
        <span className="app-subtitle">
          WebSocket · Three.js · Live telemetry
        </span>
      </header>

      <main className="app-main">
        <section className="viewport">
          <div className="scene-container">
            <Canvas
              shadows
              camera={{ position: [0, 5, 8], fov: 50 }}
            >
              <Scene3D
                robot={robot}
                world={world}
              />
            </Canvas>
          </div>
          <div className="minimap-container">
            <Minimap
              robot={robot}
              trail={trail}
              world={world}
            />
          </div>
        </section>

        <aside className="sidebar">
          <TelemetryPanel
            robot={robot}
            telemetry={telemetry}
            status={status}
            updateRate={updateRate}
            serverTime={state?.t ?? null}
            onConnect={connect}
            onDisconnect={disconnect}
          />
          <DPad
            disabled={!isConnected}
            onControlChange={handleControlChange}
          />
        </aside>
      </main>
    </div>
  )
}
