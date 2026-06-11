interface DangerZoneWarningProps {
  onContinue: () => void
}

export function DangerZoneWarning({ onContinue }: DangerZoneWarningProps) {
  return (
    <div
      className="danger-zone-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="danger-zone-title"
    >
      <div className="danger-zone-modal">
        <p
          id="danger-zone-title"
          className="danger-zone-message"
        >
          Warning! You have entered a danger zone
        </p>
        <button
          type="button"
          className="danger-zone-continue-btn"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
