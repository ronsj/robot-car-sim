import { useCallback, useEffect, useRef, useState } from 'react'
import type { ControlMessage, StateMessage } from '../types'

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  if (import.meta.env.DEV) {
    return 'ws://localhost:3001'
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }
  return 'ws://localhost:3001'
}

const WS_URL = getWsUrl()

function closeWebSocket(ws: WebSocket): void {
  ws.onopen = null
  ws.onmessage = null
  ws.onclose = null
  ws.onerror = null
  ws.close()
}

const NEUTRAL_CONTROL: ControlMessage = {
  type: 'control',
  forward: false,
  backward: false,
  rotateLeft: false,
  rotateRight: false,
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export function useRobotSim() {
  const [state, setState] = useState<StateMessage | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [updateRate, setUpdateRate] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const controlRef = useRef<ControlMessage>({
    type: 'control',
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
  })
  const reconnectDelay = useRef(1000)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRequestedRef = useRef(false)
  const lastUpdateRef = useRef(0)
  const updateCountRef = useRef(0)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const openConnection = useCallback(
    (isReconnect: boolean) => {
      clearReconnectTimer()

      if (wsRef.current) {
        closeWebSocket(wsRef.current)
        wsRef.current = null
      }

      setStatus(isReconnect ? 'reconnecting' : 'connecting')

      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectDelay.current = 1000
        ws.send(JSON.stringify(controlRef.current))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as StateMessage
          if (msg.type === 'state') {
            setState(msg)
            updateCountRef.current += 1
            lastUpdateRef.current = Date.now()
          }
        } catch {
          // ignore
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (!connectRequestedRef.current) {
          setStatus('disconnected')
          return
        }

        setStatus('reconnecting')
        reconnectTimerRef.current = setTimeout(() => {
          openConnection(true)
        }, reconnectDelay.current)
        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000)
      }

      ws.onerror = () => {
        ws.close()
      }
    },
    [clearReconnectTimer]
  )

  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    connectRequestedRef.current = true
    openConnection(false)
  }, [openConnection])

  const disconnect = useCallback(() => {
    connectRequestedRef.current = false
    clearReconnectTimer()
    controlRef.current = NEUTRAL_CONTROL

    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(controlRef.current))
    }

    if (ws) {
      closeWebSocket(ws)
      wsRef.current = null
    }

    setStatus('disconnected')
    setUpdateRate(0)
    updateCountRef.current = 0
  }, [clearReconnectTimer])

  const sendControl = useCallback((control: Omit<ControlMessage, 'type'>) => {
    if (state?.dangerZonePaused) return
    controlRef.current = { type: 'control', ...control }
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(controlRef.current))
    }
  }, [state?.dangerZonePaused])

  const acknowledgeDangerZone = useCallback(() => {
    controlRef.current = NEUTRAL_CONTROL
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'continue' }))
    }
  }, [])

  useEffect(() => {
    const rateInterval = window.setInterval(() => {
      setUpdateRate(updateCountRef.current)
      updateCountRef.current = 0
    }, 1000)

    return () => {
      clearInterval(rateInterval)
      connectRequestedRef.current = false
      clearReconnectTimer()
      if (wsRef.current) {
        closeWebSocket(wsRef.current)
        wsRef.current = null
      }
    }
  }, [clearReconnectTimer])

  return {
    state,
    status,
    updateRate,
    sendControl,
    connect,
    disconnect,
    acknowledgeDangerZone,
    lastUpdate: lastUpdateRef.current,
  }
}
