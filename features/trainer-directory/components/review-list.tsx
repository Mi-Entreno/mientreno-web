"use client"

import { Loader2, MessageSquare, Star } from "lucide-react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useTrainerReviews } from "../hooks/use-directory"
import type { Review } from "../model/directory.model"

export function ReviewList({ trainerId }: { trainerId: number }) {
  const list = useTrainerReviews(trainerId)

  if (list.isLoading) {
    return (
      <ul className="flex flex-col gap-3">
        {[0, 1].map((key) => (
          <li key={key}>
            <Skeleton className="h-24 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (list.isError) {
    return <p className="text-body text-error-text">No se han podido cargar las reseñas.</p>
  }

  if (list.reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Todavía no hay reseñas"
        description="Solo pueden dejarlas los alumnos que se han suscrito contigo, y una por alumno."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {list.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>

      {list.hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={list.isFetchingNextPage}
          onClick={() => list.fetchNextPage()}
        >
          {list.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {list.isFetchingNextPage ? "Cargando…" : "Cargar más reseñas"}
        </Button>
      )}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const initials =
    review.studentName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"

  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={review.studentAvatarUrl ?? "/placeholder.svg"} alt="" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">{review.studentName}</p>
          <StarRating rating={review.rating} />
        </div>

        {review.comment && (
          <p className="mt-1.5 text-body text-muted-foreground text-pretty">{review.comment}</p>
        )}

        <p className="mt-1 text-caption text-muted-foreground">{formatDate(review.createdAt)}</p>
      </div>
    </li>
  )
}

/** `rating` is a BigDecimal upstream, so halves round up to a filled star. */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn(
            "size-3.5",
            star <= Math.round(rating) ? "fill-current text-primary-text" : "text-border",
          )}
        />
      ))}
      <span className="ml-1 text-caption tabular-nums text-muted-foreground">{rating}</span>
    </span>
  )
}
