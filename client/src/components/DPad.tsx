import { useCallback, useEffect, useState } from "react";

export interface ControlState {
  forward: boolean;
  backward: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
}

interface DPadProps {
  onControlChange: (control: ControlState) => void;
}

const EMPTY: ControlState = {
  forward: false,
  backward: false,
  rotateLeft: false,
  rotateRight: false,
};

export function DPad({ onControlChange }: DPadProps) {
  const [control, setControl] = useState<ControlState>(EMPTY);

  const update = useCallback(
    (patch: Partial<ControlState>) => {
      setControl((prev) => {
        const next = { ...prev, ...patch };
        onControlChange(next);
        return next;
      });
    },
    [onControlChange]
  );

  const press = (key: keyof ControlState) => update({ [key]: true });
  const release = (key: keyof ControlState) => update({ [key]: false });

  useEffect(() => {
    const keys = new Set<string>();

    const keyMap: Record<string, keyof ControlState> = {
      w: "forward",
      W: "forward",
      ArrowUp: "forward",
      s: "backward",
      S: "backward",
      ArrowDown: "backward",
      a: "rotateLeft",
      A: "rotateLeft",
      ArrowLeft: "rotateLeft",
      d: "rotateRight",
      D: "rotateRight",
      ArrowRight: "rotateRight",
    };

    const syncFromKeys = () => {
      const next: ControlState = { ...EMPTY };
      for (const k of keys) {
        const action = keyMap[k];
        if (action) next[action] = true;
      }
      setControl(next);
      onControlChange(next);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (keyMap[e.key]) {
        e.preventDefault();
        keys.add(e.key);
        syncFromKeys();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (keyMap[e.key]) {
        e.preventDefault();
        keys.delete(e.key);
        syncFromKeys();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onControlChange]);

  const btn = (label: string, key: keyof ControlState, className: string) => (
    <button
      type="button"
      className={`dpad-btn ${className} ${control[key] ? "active" : ""}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        press(key);
      }}
      onPointerUp={() => release(key)}
      onPointerLeave={() => release(key)}
      onPointerCancel={() => release(key)}
    >
      {label}
    </button>
  );

  return (
    <div className="dpad">
      <div className="dpad-label">Controls</div>
      <div className="dpad-grid">
        <div />
        {btn("▲", "forward", "dpad-up")}
        <div />
        {btn("◀", "rotateLeft", "dpad-left")}
        <div className="dpad-center" />
        {btn("▶", "rotateRight", "dpad-right")}
        <div />
        {btn("▼", "backward", "dpad-down")}
        <div />
      </div>
      <div className="dpad-hint">WASD / Arrow keys</div>
    </div>
  );
}
