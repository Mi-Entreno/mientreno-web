import { cn } from "@/lib/utils"

/**
 * Brand loading indicator: the three slanted bars of the "Mi Entreno" mark,
 * hopping in a left-to-right wave. Replaces the generic `Loader2` spinner
 * everywhere in the panel.
 *
 * The bars keep their size at all times — the wave is a vertical hop plus an
 * opacity pulse, never a `scaleY`. Stretching them turned the mark into an
 * equalizer of thin changing bars, which loses the one thing this loader is
 * for: staying recognizable as the logo while it loads.
 *
 * They paint in `currentColor`, so a loader inside a button inherits the
 * button's foreground and keeps its contrast — the spinner it replaced did the
 * same, and the call sites that tinted it (`text-muted-foreground`) still work
 * unchanged.
 *
 * The keyframes live in `app/globals.css` (`me-bars`) rather than here because
 * the reduced-motion block needs to reach them: a progress indicator that
 * freezes makes a loading screen look hung, so it slows down instead of
 * stopping.
 */

type BarsLoaderSize = "xs" | "sm" | "md" | "lg"

type BarsLoaderProps = {
  size?: BarsLoaderSize
  /**
   * Screen-reader text. Without it the loader is hidden from the a11y tree:
   * inside a button that already announces its pending state, a nested status
   * role is noise.
   */
  label?: string
  className?: string
}

/**
 * Bar height / width / gap, in px. The proportions come from the app icon
 * (`../fitness_app/assets/icon.png`): wide, low bars rather than thin strokes.
 */
const SIZES: Record<BarsLoaderSize, { height: number; width: number; gap: number }> = {
  xs: { height: 12, width: 7, gap: 2 },
  sm: { height: 14, width: 9, gap: 3 },
  md: { height: 20, width: 12, gap: 4 },
  lg: { height: 28, width: 17, gap: 5 },
}

const STAGGER_MS = 150

/** Hop height, as a fraction of the bar height. Mirrors `--me-bars-lift`. */
const LIFT_RATIO = 0.22

/**
 * tan(18°). The slant pushes each bar's foot left, so the silhouette sits off
 * to the left of its box; half that offset as left padding recenters it — it
 * shows up as soon as the loader replaces a label inside a centered button.
 */
const SKEW_RATIO = 0.325

export function BarsLoader({ size = "sm", label, className }: BarsLoaderProps) {
  const { height, width, gap } = SIZES[size]

  return (
    <span
      data-slot="bars-loader"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex shrink-0 items-end", className)}
      style={{ height, gap, paddingLeft: Math.round((height * SKEW_RATIO) / 2) }}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="me-bars-bar"
          style={
            {
              width,
              height,
              "--me-bars-lift": `-${(height * LIFT_RATIO).toFixed(2)}px`,
              animationDelay: `${index * STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )
}
