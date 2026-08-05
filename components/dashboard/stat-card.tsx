import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: "primary" | "warning" | "muted"
  loading?: boolean
}

const accents = {
  primary: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  muted: "bg-secondary text-foreground",
}

export function StatCard({ label, value, icon: Icon, accent = "muted", loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accents[accent])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-body text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="font-heading text-headline font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
