import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "warning" | "success" | "error"

/**
 * Status pill for the two state machines of the merchant panel.
 *
 * The kit's `Badge` has no warning/success variants, so the tone maps to the
 * semantic tokens directly here rather than adding two variants used in one
 * place. Semantic colour, not the brand accent: these say "needs attention" and
 * "done", which is a different job from "this is our green".
 */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  warning: "bg-warning-surface text-warning-text",
  success: "bg-success-surface text-success-text",
  error: "bg-error-surface text-error-text",
}

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_CLASSES[tone])}>
      {children}
    </Badge>
  )
}
