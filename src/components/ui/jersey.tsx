import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type JerseyProps = {
  number?: ReactNode;
  size?: number;
  color?: string;
  stripeColor?: string;
  textColor?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Jersey-style avatar (numbered shirt) — soccer motif used across rankings,
 * team rosters, and live match screens. Renders as a rounded square with a
 * collar stripe and the player's number in display font.
 */
export function Jersey({
  number,
  size = 44,
  color,
  stripeColor = "rgba(255,255,255,.25)",
  textColor,
  className,
  style,
}: JerseyProps) {
  const fontSize = Math.round(size * 0.5);
  const stripeHeight = Math.max(6, Math.round(size * 0.2));

  return (
    <div
      className={cn("cv-jersey", className)}
      style={{
        width: size,
        height: size,
        fontSize,
        ...(color ? { background: color } : null),
        ...(textColor ? { color: textColor } : null),
        ...style,
      }}
    >
      <span
        className="cv-jersey-stripe"
        style={{ height: stripeHeight, background: stripeColor }}
      />
      <span className="cv-jersey-number">{number}</span>
    </div>
  );
}
