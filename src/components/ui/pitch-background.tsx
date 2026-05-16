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
 * Soccer pitch background — green grass stripes with optional white field
 * markings (center line, center circle, penalty boxes). Used as a hero
 * surface behind dashboard / group / event headers.
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
      className={cn("cv-pitch-bg", className)}
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
