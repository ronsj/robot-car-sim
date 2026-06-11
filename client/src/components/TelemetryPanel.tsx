import type { RobotState, Telemetry } from '../types'
import type { ConnectionStatus } from '../hooks/useRobotSim'

const STATUS_CLASS: Record<ConnectionStatus, string> = {
  connected: 'status-connected',
  connecting: 'status-connecting',
  reconnecting: 'status-reconnecting',
  disconnected: 'status-disconnected',
}

interface TelemetryPanelProps {
  robot: RobotState
  telemetry: Telemetry
  status: ConnectionStatus
  updateRate: number
  serverTime: number | null
  onConnect: () => void
}

function formatHeading(theta: number): string {
  const deg = ((theta * 180) / Math.PI + 360) % 360
  return `${deg.toFixed(1)}°`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="telemetry-row">
      <span className="telemetry-label">{label}</span>
      <span className="telemetry-value">{value}</span>
    </div>
  )
}

export function TelemetryPanel({
  robot,
  telemetry,
  status,
  updateRate,
  serverTime,
  onConnect,
}: TelemetryPanelProps) {
  const statusClass = STATUS_CLASS[status]
  const showConnectButton = status === 'disconnected'

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">Telemetry</div>

      <div className="telemetry-section">
        <div className="telemetry-section-title">Connection</div>
        <Row
          label="Status"
          value={status}
        />
        <Row
          label="Update rate"
          value={`${updateRate} Hz`}
        />
        {serverTime && (
          <Row
            label="Server time"
            value={new Date(serverTime).toLocaleTimeString()}
          />
        )}
        {showConnectButton && (
          <button
            type="button"
            className="telemetry-connect-btn"
            onClick={onConnect}
          >
            Connect
          </button>
        )}
      </div>

      <div className="telemetry-section">
        <div className="telemetry-section-title">Position</div>
        <Row
          label="X"
          value={robot.x.toFixed(2)}
        />
        <Row
          label="Y"
          value={robot.y.toFixed(2)}
        />
        <Row
          label="Heading"
          value={formatHeading(robot.theta)}
        />
      </div>

      <div className="telemetry-section">
        <div className="telemetry-section-title">Motion</div>
        <Row
          label="Speed"
          value={`${robot.vx.toFixed(2)} m/s`}
        />
        <Row
          label="Turn rate"
          value={`${robot.omega.toFixed(2)} rad/s`}
        />
        <Row
          label="Distance"
          value={`${telemetry.distance.toFixed(2)} m`}
        />
        <Row
          label="Collisions"
          value={String(telemetry.collisions)}
        />
      </div>

      <div className={`telemetry-status ${statusClass}`} />
    </div>
  )
}
