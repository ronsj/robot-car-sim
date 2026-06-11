import { useCallback, useEffect, useRef, useState } from "react";
import type { ControlMessage, StateMessage } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function useRobotSim() {
  const [state, setState] = useState<StateMessage | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [updateRate, setUpdateRate] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const controlRef = useRef<ControlMessage>({
    type: "control",
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
  });
  const reconnectDelay = useRef(1000);
  const lastUpdateRef = useRef(0);
  const updateCountRef = useRef(0);
  const rateIntervalRef = useRef<number | null>(null);

  const sendControl = useCallback((control: Omit<ControlMessage, "type">) => {
    controlRef.current = { type: "control", ...control };
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(controlRef.current));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    rateIntervalRef.current = window.setInterval(() => {
      setUpdateRate(updateCountRef.current);
      updateCountRef.current = 0;
    }, 1000);

    const connect = () => {
      if (!mounted) return;
      setStatus((s) => (s === "connected" ? s : s === "connecting" ? "connecting" : "reconnecting"));

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setStatus("connected");
        reconnectDelay.current = 1000;
        ws.send(JSON.stringify(controlRef.current));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as StateMessage;
          if (msg.type === "state") {
            setState(msg);
            updateCountRef.current += 1;
            lastUpdateRef.current = Date.now();
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        setStatus("reconnecting");
        reconnectTimer = setTimeout(connect, reconnectDelay.current);
        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (rateIntervalRef.current) clearInterval(rateIntervalRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { state, status, updateRate, sendControl, lastUpdate: lastUpdateRef.current };
}
