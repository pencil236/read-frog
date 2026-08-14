import type { ReviewRating } from "@read-frog/definitions"
import type { LocalCard, LocalRevlog } from "@/utils/local-notebase/types"
import { getSrsDayEnd } from "@read-frog/definitions"
import {
  IconArrowLeft,
  IconEyeOff,
  IconHistory,
  IconPlayerPause,
  IconPlayerPlay,
  IconRotate,
} from "@tabler/icons-react"
import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Link, useParams } from "react-router"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import { toastManager } from "@/components/ui/base-ui/toast"
import { i18n } from "@/utils/i18n"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { useAsyncData, useNotebaseSnapshot } from "./lib"
import { SrsSettingsDialog } from "./srs-settings-dialog"

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

const RATING_SHORTCUTS: Record<ReviewRating, string> = {
  again: "1",
  hard: "2",
  good: "3",
  easy: "4",
}

const RATINGS: Array<{ value: ReviewRating; className: string }> = [
  {
    value: "again",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  {
    value: "hard",
    className: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400",
  },
  {
    value: "good",
    className: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "easy",
    className: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-400",
  },
]

function ratingLabel(rating: ReviewRating): string {
  switch (rating) {
    case "again":
      return i18n.t("notebase.review.ratingAgain")
    case "hard":
      return i18n.t("notebase.review.ratingHard")
    case "good":
      return i18n.t("notebase.review.ratingGood")
    case "easy":
      return i18n.t("notebase.review.ratingEasy")
    default:
      return ""
  }
}

const RATING_BADGE_CLASS: Record<ReviewRating, string> = {
  again: "bg-destructive/10 text-destructive",
  hard: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  good: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  easy: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
}

const EMPTY_RATING_COUNTS: Record<ReviewRating, number> = {
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`
  }
  return `${(durationMs / 1000).toFixed(1)}s`
}

function RatingCounters({ counts }: { counts: Record<ReviewRating, number> }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      {RATINGS.map((rating) => (
        <Badge key={rating.value} variant="outline" className={RATING_BADGE_CLASS[rating.value]}>
          {ratingLabel(rating.value)}: {counts[rating.value]}
        </Badge>
      ))}
    </div>
  )
}

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
  const [ratingCounts, setRatingCounts] =
    useState<Record<ReviewRating, number>>(EMPTY_RATING_COUNTS)
  const [showHistory, setShowHistory] = useState(false)
  const [srsOpen, setSrsOpen] = useState(false)

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

  const currentCard = queue?.[index]
  const dueStats = id ? stats?.[id] : undefined
  const progress = queue && queue.length > 0 ? Math.round((index / queue.length) * 100) : 0

  const startReview = () => {
    setQueue(dueCards)
    setIndex(0)
    setRevealed(false)
    setCompleted(false)
    setLastReviewedId(null)
    setStartedAt(Date.now())
    setRatingCounts(EMPTY_RATING_COUNTS)
  }

  const rateCard = async (rating: ReviewRating) => {
    if (!currentCard) {
      return
    }
    const durationMs = Math.min(Math.max(Date.now() - startedAt, 0), 180_000)
    try {
      const repository = await getLocalNotebaseRepository()
      await repository.reviewCard(currentCard.id, rating, durationMs, getTimezone())
      setRatingCounts((counts) => ({ ...counts, [rating]: counts[rating] + 1 }))
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
        title: i18n.t("notebase.review.reviewCardFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const rateCardRef = useRef(rateCard)
  rateCardRef.current = rateCard

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
        title: i18n.t("notebase.common.updateCardFailed"),
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
      toastManager.add({
        type: "success",
        title: i18n.t("notebase.review.lastReviewUndone"),
      })
      reloadStats()
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: i18n.t("notebase.review.undoFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return
      }

      if (!revealed) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault()
          setRevealed(true)
        }
        return
      }

      const ratingByKey: Record<string, ReviewRating> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      }
      const rating = ratingByKey[event.key]
      if (rating) {
        event.preventDefault()
        void rateCardRef.current(rating)
      }
    }

    if (queue && !completed) {
      window.addEventListener("keydown", onKeyDown)
    }
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [queue, completed, revealed])

  if (!id) {
    return null
  }

  const cardsById = new Map((snapshot?.cards ?? []).map((card) => [card.id, card]))
  const revlogs: LocalRevlog[] = [...(snapshot?.revlogs ?? [])].sort(
    (a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime(),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" render={<Link to={`/notebases/${id}`} />}>
          <IconArrowLeft className="size-4" />
          {i18n.t("notebase.common.back")}
        </Button>
        <h1 className="text-xl font-semibold">{i18n.t("notebase.review.title")}</h1>
        <div className="ml-auto flex items-center gap-2">
          {dueStats && (
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="secondary">
                {i18n.t("notebase.review.newBadge", [dueStats.new])}
              </Badge>
              <Badge variant="secondary">
                {i18n.t("notebase.review.learningBadge", [dueStats.learning])}
              </Badge>
              <Badge variant="secondary">
                {i18n.t("notebase.review.reviewBadge", [dueStats.review])}
              </Badge>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistory((value) => !value)}
          >
            <IconHistory className="size-4" />
            {i18n.t("notebase.review.history")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setSrsOpen(true)}>
            {i18n.t("notebase.detail.srs")}
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            disabled={dueCards.length === 0}
            onClick={startReview}
          >
            <IconPlayerPlay className="size-4" />
            {i18n.t("notebase.review.start")}
          </Button>
        </div>
      </div>

      {showHistory && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-sm font-medium">{i18n.t("notebase.review.recentReviews")}</p>
          {revlogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{i18n.t("notebase.review.noReviews")}</p>
          ) : (
            <div className="space-y-1.5">
              {revlogs.slice(0, 30).map((revlog) => {
                const card = cardsById.get(revlog.cardId)
                return (
                  <div key={revlog.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{card?.front || revlog.cardId}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(revlog.reviewedAt).toLocaleString()} ·{" "}
                        {formatDuration(revlog.durationMs)}
                      </p>
                    </div>
                    <Badge variant="outline" className={RATING_BADGE_CLASS[revlog.rating]}>
                      {ratingLabel(revlog.rating)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {queue === null && (
        <p className="text-sm text-muted-foreground">
          {dueCards.length === 0
            ? i18n.t("notebase.review.nothingDue")
            : dueCards.length === 1
              ? i18n.t("notebase.review.dueTodayOne", [dueCards.length])
              : i18n.t("notebase.review.dueTodayMany", [dueCards.length])}
        </p>
      )}

      {queue !== null && !completed && currentCard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{i18n.t("notebase.review.cardProgress", [index + 1, queue.length])}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void setCardStatus("suspend", true)}
              >
                <IconPlayerPause className="size-4" />
                {i18n.t("notebase.review.suspend")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void setCardStatus("bury", true)}
              >
                <IconEyeOff className="size-4" />
                {i18n.t("notebase.review.bury")}
              </Button>
            </div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
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
            <div className="flex flex-col items-center gap-2">
              <Button type="button" variant="brand" onClick={() => setRevealed(true)}>
                {i18n.t("notebase.review.showAnswer")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {i18n.t("notebase.review.pressSpaceHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RATINGS.map((rating) => (
                  <Button
                    key={rating.value}
                    type="button"
                    className={rating.className}
                    onClick={() => void rateCard(rating.value)}
                  >
                    {ratingLabel(rating.value)}
                    <kbd className="ml-1 rounded border border-current/30 bg-black/5 px-1 text-xs dark:bg-white/10">
                      {RATING_SHORTCUTS[rating.value]}
                    </kbd>
                  </Button>
                ))}
              </div>
              <RatingCounters counts={ratingCounts} />
            </div>
          )}
        </div>
      )}

      {completed && (
        <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
          <p className="font-medium">{i18n.t("notebase.review.sessionComplete")}</p>
          <p className="text-sm text-muted-foreground">
            {i18n.t("notebase.review.sessionSummary", [queue?.length ?? 0])}
          </p>
          <RatingCounters counts={ratingCounts} />
          <div className="flex justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={rollbackLast}>
              <IconRotate className="size-4" />
              {i18n.t("notebase.review.undoLast")}
            </Button>
            <Button type="button" variant="brand" size="sm" onClick={startReview}>
              {i18n.t("notebase.review.reviewAgain")}
            </Button>
          </div>
        </div>
      )}

      <SrsSettingsDialog
        notebase={snapshot?.notebase}
        open={srsOpen}
        onOpenChange={setSrsOpen}
        onSaved={reload}
      />
    </div>
  )
}
