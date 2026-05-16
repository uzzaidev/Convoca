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
 * Jersey-style avatar (numbered shirt). Used across rankings, team rosters,
 * and live match. Renders as a rounded square with a collar stripe and the
 * player's number in display font.
 *
 * Pass `color` as any CSS color (e.g. `hsl(var(--pitch))` or `"#0A1628"`).
 * Defaults to the primary pitch color.
 */
export function Jersey({
  number,
  size = 44,
  color = "hsl(var(--pitch))",
  stripeColor = "rgba(255,255,255,.25)",
  textColor = "hsl(var(--primary-foreground))",
  className,
  style,
}: JerseyProps) {
  const fontSize = Math.round(size * 0.5);
  const stripeHeight = Math.max(6, Math.round(size * 0.2));

  return (
    <div
      className={cn(
        "relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md font-display",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        background: color,
        color: textColor,
        letterSpacing: "0.02em",
        boxShadow: "inset 0 -3px 0 rgba(0,0,0,.18)",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 top-0"
        style={{ height: stripeHeight, background: stripeColor }}
      />
      <span className="relative z-10">{number}</span>
    </div>
  );
}
