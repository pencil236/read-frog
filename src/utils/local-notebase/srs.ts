import type { LocalCard, LocalCardTemplate } from "./types"
import {
  DEFAULT_SRS_SCHEDULING_PARAMS,
  type FsrsReviewLogSnapshot,
  type ReviewRating,
  type SchedulingParams,
} from "@read-frog/definitions"
import { getSrsDayEnd } from "@read-frog/definitions"
import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card as FSRSCard,
  type FSRSParameters,
  type Grade,
  type ReviewLog as FSRSReviewLog,
} from "ts-fsrs"
import { renderPattern } from "./render"

const DEFAULT_FSRS_WEIGHTS = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835,
  0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
]

const RATING_TO_FSRS: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

const CARD_STATE_TO_FSRS: Record<LocalCard["state"], State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

const FSRS_STATE_TO_CARD_STATE: Record<State, LocalCard["state"]> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
}

export function toFSRSParameters(params: SchedulingParams): FSRSParameters {
  return {
    request_retention: params.desiredRetention,
    maximum_interval: params.maximumInterval,
    w: params.weights ?? DEFAULT_FSRS_WEIGHTS,
    enable_fuzz: params.enableFuzz,
    enable_short_term: params.enableShortTerm,
    learning_steps: params.learningSteps,
    relearning_steps: params.relearningSteps,
  }
}

const STATE_TO_SCHEDULE_STATUS: Record<LocalCard["state"], LocalCard["scheduleStatus"]> = {
  new: "new",
  learning: "learning",
  relearning: "learning",
  review: "review",
}

export function scheduleStatusForState(state: LocalCard["state"]): LocalCard["scheduleStatus"] {
  return STATE_TO_SCHEDULE_STATUS[state]
}

function toFSRSCard(card: LocalCard): FSRSCard {
  const empty = createEmptyCard(new Date(card.dueAt))
  return {
    ...empty,
    due: new Date(card.dueAt),
    stability: card.stability,
    difficulty: card.difficulty,
    learning_steps: card.step,
    reps: card.reps,
    lapses: card.lapses,
    state: CARD_STATE_TO_FSRS[card.state],
    last_review: card.lastReviewTime ? new Date(card.lastReviewTime) : undefined,
  }
}

function toLocalMemoryState(
  card: FSRSCard,
  previous: Pick<LocalCard, "buriedAt">,
): Pick<
  LocalCard,
  | "state"
  | "scheduleStatus"
  | "dueAt"
  | "lastReviewTime"
  | "stability"
  | "difficulty"
  | "step"
  | "lapses"
  | "reps"
  | "buriedAt"
> {
  const state = FSRS_STATE_TO_CARD_STATE[card.state]
  return {
    state,
    scheduleStatus: scheduleStatusForState(state),
    dueAt: card.due,
    lastReviewTime: card.last_review ?? null,
    stability: card.stability,
    difficulty: card.difficulty,
    step: card.learning_steps,
    lapses: card.lapses,
    reps: card.reps,
    buriedAt: previous.buriedAt,
  }
}

function toFsrsSnapshot(log: FSRSReviewLog): FsrsReviewLogSnapshot {
  return {
    rating: log.rating as FsrsReviewLogSnapshot["rating"],
    state: log.state,
    dueAt: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    scheduledDays: log.scheduled_days,
    learningSteps: log.learning_steps,
    review: log.review.toISOString(),
  }
}

export interface LocalReviewResult {
  card: LocalCard
  snapshot: FsrsReviewLogSnapshot
}

export function applyReview(
  card: LocalCard,
  params: SchedulingParams,
  rating: ReviewRating,
  now: Date,
): LocalReviewResult {
  const scheduler = fsrs(toFSRSParameters(params))
  const result = scheduler.next(toFSRSCard(card), now, RATING_TO_FSRS[rating])
  return {
    card: {
      ...card,
      ...toLocalMemoryState(result.card, card),
      updatedAt: now,
    },
    snapshot: toFsrsSnapshot(result.log),
  }
}

export interface LocalDueStats {
  new: number
  learning: number
  review: number
}

export function computeDueStats(
  cards: Pick<LocalCard, "dueAt" | "scheduleStatus">[],
  timezone: string,
  now: Date,
): LocalDueStats {
  const dayEnd = getSrsDayEnd(now, timezone)
  const stats: LocalDueStats = { new: 0, learning: 0, review: 0 }

  for (const card of cards) {
    if (card.scheduleStatus === "suspended" || card.scheduleStatus === "buried") {
      continue
    }
    if (card.dueAt.getTime() > dayEnd.getTime()) {
      continue
    }
    if (
      card.scheduleStatus === "new" ||
      card.scheduleStatus === "learning" ||
      card.scheduleStatus === "review"
    ) {
      stats[card.scheduleStatus] += 1
    }
  }

  return stats
}

export function withDefaultSrsParams(params?: Partial<SchedulingParams>): SchedulingParams {
  return {
    ...DEFAULT_SRS_SCHEDULING_PARAMS,
    ...params,
    learningSteps: params?.learningSteps ?? DEFAULT_SRS_SCHEDULING_PARAMS.learningSteps,
    relearningSteps: params?.relearningSteps ?? DEFAULT_SRS_SCHEDULING_PARAMS.relearningSteps,
  }
}

export function renderTemplateCard(
  template: LocalCardTemplate,
  cells: Record<string, unknown>,
  columns: { name: string }[],
): { front: string; back: string } {
  if (template.config.type !== "basic") {
    return { front: "", back: "" }
  }
  return {
    front: renderPatternSafe(template.config.frontPattern, cells, columns),
    back: renderPatternSafe(template.config.backPattern, cells, columns),
  }
}

function renderPatternSafe(
  pattern: string,
  cells: Record<string, unknown>,
  columns: { name: string }[],
): string {
  return renderPattern(pattern, cells, columns)
}
