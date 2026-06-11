import { useCallback, useEffect, useRef, useState } from 'react'
import type { ControlMessage, StateMessage } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'

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
        wsRef.current.onclose = null
        wsRef.current.close()
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

  const sendControl = useCallback((control: Omit<ControlMessage, 'type'>) => {
    controlRef.current = { type: 'control', ...control }
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(controlRef.current))
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
        wsRef.current.onclose = null
        wsRef.current.close()
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
    lastUpdate: lastUpdateRef.current,
  }
}
