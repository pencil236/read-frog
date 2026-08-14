import type { ReviewRating } from "@read-frog/definitions"
import type { LocalCard } from "@/utils/local-notebase/types"
import { getSrsDayEnd } from "@read-frog/definitions"
import {
  IconArrowLeft,
  IconEyeOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconRotate,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Link, useParams } from "react-router"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import { toastManager } from "@/components/ui/base-ui/toast"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { useAsyncData, useNotebaseSnapshot } from "./lib"

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

const RATINGS: Array<{ value: ReviewRating; label: string; className: string }> = [
  {
    value: "again",
    label: "Again",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  {
    value: "hard",
    label: "Hard",
    className: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400",
  },
  {
    value: "good",
    label: "Good",
    className: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "easy",
    label: "Easy",
    className: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-400",
  },
]

export function ReviewSection() {
  const { id } = useParams<{ id: string }>()
  const { data: snapshot, reload } = useNotebaseSnapshot(id)
  const { data: stats, reload: reloadStats } = useAsyncData(async () => {
    if (!id) {
      return null
    }
    const repository = await getLocalNotebaseRepository()
    return repository.dueStats([id], getTimezone())
  }, [id])

  const [queue, setQueue] = useState<LocalCard[] | null>(null)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [lastReviewedId, setLastReviewedId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const dueCards = useMemo(() => {
    if (!snapshot) {
      return []
    }
    const dayEnd = getSrsDayEnd(new Date(), getTimezone())
    return snapshot.cards
      .filter(
        (card) =>
          card.scheduleStatus !== "suspended" &&
          card.scheduleStatus !== "buried" &&
          card.dueAt.getTime() <= dayEnd.getTime(),
      )
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
  }, [snapshot])

  if (!id) {
    return null
  }

  const currentCard = queue?.[index]
  const dueStats = stats?.[id]

  const startReview = () => {
    setQueue(dueCards)
    setIndex(0)
    setRevealed(false)
    setCompleted(false)
    setLastReviewedId(null)
    setStartedAt(Date.now())
  }

  const rateCard = async (rating: ReviewRating) => {
    if (!currentCard) {
      return
    }
    const durationMs = Math.min(Math.max(Date.now() - startedAt, 0), 180_000)
    try {
      const repository = await getLocalNotebaseRepository()
      await repository.reviewCard(currentCard.id, rating, durationMs, getTimezone())
      setLastReviewedId(currentCard.id)
      if (index + 1 < (queue?.length ?? 0)) {
        setIndex((value) => value + 1)
        setRevealed(false)
        setStartedAt(Date.now())
      } else {
        setCompleted(true)
      }
      reloadStats()
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to review card",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const setCardStatus = async (action: "bury" | "suspend", enabled: boolean) => {
    if (!currentCard) {
      return
    }
    try {
      const repository = await getLocalNotebaseRepository()
      if (action === "bury") {
        await repository.setCardBuried(currentCard.id, enabled)
      } else {
        await repository.setCardSuspended(currentCard.id, enabled)
      }
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to update card",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const rollbackLast = async () => {
    if (!lastReviewedId) {
      return
    }
    try {
      const repository = await getLocalNotebaseRepository()
      await repository.rollbackReview(lastReviewedId)
      setLastReviewedId(null)
      toastManager.add({ type: "success", title: "Last review undone" })
      reloadStats()
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to undo review",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" render={<Link to={`/notebases/${id}`} />}>
          <IconArrowLeft className="size-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold">Review</h1>
        <div className="ml-auto flex items-center gap-2">
          {dueStats && (
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="secondary">{dueStats.new} new</Badge>
              <Badge variant="secondary">{dueStats.learning} learning</Badge>
              <Badge variant="secondary">{dueStats.review} review</Badge>
            </div>
          )}
          <Button
            type="button"
            variant="brand"
            size="sm"
            disabled={dueCards.length === 0}
            onClick={startReview}
          >
            <IconPlayerPlay className="size-4" />
            Start
          </Button>
        </div>
      </div>

      {queue === null && (
        <p className="text-sm text-muted-foreground">
          {dueCards.length === 0
            ? "Nothing due right now. Generate cards and save new notes to build your review queue."
            : `${dueCards.length} card${dueCards.length === 1 ? "" : "s"} due today.`}
        </p>
      )}

      {queue !== null && !completed && currentCard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Card {index + 1} of {queue.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void setCardStatus("suspend", true)}
              >
                <IconPlayerPause className="size-4" />
                Suspend
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void setCardStatus("bury", true)}
              >
                <IconEyeOff className="size-4" />
                Bury
              </Button>
            </div>
          </div>

          <div className="min-h-52 rounded-xl border bg-card p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{currentCard.front}</ReactMarkdown>
            </div>
            {revealed && (
              <div className="mt-6 border-t pt-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{currentCard.back}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {!revealed ? (
            <div className="flex justify-center">
              <Button type="button" variant="brand" onClick={() => setRevealed(true)}>
                Show answer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATINGS.map((rating) => (
                <Button
                  key={rating.value}
                  type="button"
                  className={rating.className}
                  onClick={() => void rateCard(rating.value)}
                >
                  {rating.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {completed && (
        <div className="space-y-3 rounded-xl border bg-card p-6 text-center">
          <p className="font-medium">Session complete</p>
          <p className="text-sm text-muted-foreground">
            You reviewed {queue?.length ?? 0} cards. Come back when the next ones are due.
          </p>
          <div className="flex justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={rollbackLast}>
              <IconRotate className="size-4" />
              Undo last review
            </Button>
            <Button type="button" variant="brand" size="sm" onClick={startReview}>
              Review again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
