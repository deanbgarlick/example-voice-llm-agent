import React from "react"

interface AudioIndicatorProps {
  isSessionActive: boolean
  currentVolume: number
  audioIndicatorRef: React.RefObject<HTMLDivElement>
}

export function AudioIndicator({
  isSessionActive,
  currentVolume,
  audioIndicatorRef,
}: AudioIndicatorProps) {
  return (
    <div
      ref={audioIndicatorRef}
      className={`h-2 bg-muted rounded-full overflow-hidden transition-all ${
        isSessionActive ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full bg-primary transition-all duration-100"
        style={{
          width: `${Math.min(currentVolume * 100, 100)}%`,
        }}
      />
    </div>
  )
}
