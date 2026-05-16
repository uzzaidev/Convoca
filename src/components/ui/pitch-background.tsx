import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type PitchBackgroundProps = {
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  showMarkings?: boolean;
  children?: ReactNode;
};

/**
 * Soccer pitch background — green grass stripes (`.bg-pitch-surface`) plus
 * optional white field markings (center line, center circle, penalty boxes).
 *
 * Self-positioning: always renders as `position: relative` so the pitch
 * stripes ::after pseudo-element anchors correctly. If you need the pitch
 * to absolutely fill a parent, wrap it: `<div className="absolute inset-0"><PitchBackground height="100%"/></div>`.
 */
export function PitchBackground({
  height = 240,
  className,
  style,
  showMarkings = true,
  children,
}: PitchBackgroundProps) {
  return (
    <div
      className={cn("relative overflow-hidden bg-pitch-surface", className)}
      style={{ height, ...style }}
    >
      {showMarkings && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, opacity: 0.35 }}
        >
          <line x1="300" y1="0" x2="300" y2="200" stroke="white" strokeWidth="1.5" />
          <circle cx="300" cy="100" r="36" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="0" y="40" width="60" height="120" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="540" y="40" width="60" height="120" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
      )}
      {children}
    </div>
  );
}
