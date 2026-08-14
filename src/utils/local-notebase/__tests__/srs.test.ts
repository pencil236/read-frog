import type { LocalCard } from "../types"
import { describe, expect, it } from "vitest"
import {
  applyReview,
  computeDueStats,
  scheduleStatusForState,
  toFSRSParameters,
  withDefaultSrsParams,
} from "../srs"

function newCard(): LocalCard {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    notebaseId: "00000000-0000-4000-8000-000000000002",
    notebaseRowId: "00000000-0000-4000-8000-000000000003",
    templateId: "00000000-0000-4000-8000-000000000004",
    variantKey: "row:template",
    state: "new",
    scheduleStatus: "new",
    dueAt: new Date("2026-08-14T00:00:00.000Z"),
    lastReviewTime: null,
    stability: 0,
    difficulty: 0,
    step: 0,
    lapses: 0,
    reps: 0,
    buriedAt: null,
    front: "hello",
    back: "你好",
    createdAt: new Date("2026-08-14T00:00:00.000Z"),
    updatedAt: new Date("2026-08-14T00:00:00.000Z"),
  }
}

describe("withDefaultSrsParams", () => {
  it("fills defaults and keeps provided overrides", () => {
    const params = withDefaultSrsParams({ desiredRetention: 0.8 })
    expect(params.desiredRetention).toBe(0.8)
    expect(params.newPerDay).toBe(-1)
    expect(params.learningSteps).toEqual(["1m", "10m"])
  })
})

describe("toFSRSParameters", () => {
  it("maps scheduling params and supplies default weights", () => {
    const params = toFSRSParameters(withDefaultSrsParams())
    expect(params.request_retention).toBe(0.9)
    expect(params.maximum_interval).toBe(36500)
    expect(params.w).toHaveLength(21)
  })
})

describe("applyReview", () => {
  it("moves a new card into learning with a future due date", () => {
    const now = new Date("2026-08-14T12:00:00.000Z")
    const result = applyReview(newCard(), withDefaultSrsParams(), "good", now)

    expect(result.card.state).toBe("learning")
    expect(result.card.scheduleStatus).toBe("learning")
    expect(result.card.reps).toBe(1)
    expect(result.card.dueAt.getTime()).toBeGreaterThan(now.getTime())
    expect(result.snapshot.rating).toBe(3)
    // The FSRS revlog records the state the card was in when reviewed.
    expect(result.snapshot.state).toBe(0)
  })

  it("maps again to a short relearning step", () => {
    const now = new Date("2026-08-14T12:00:00.000Z")
    const result = applyReview(newCard(), withDefaultSrsParams(), "again", now)
    expect(result.snapshot.rating).toBe(1)
    expect(result.card.dueAt.getTime()).toBeGreaterThan(now.getTime())
  })
})

describe("computeDueStats / scheduleStatusForState", () => {
  it("counts only active due cards for the srs day", () => {
    const now = new Date("2026-08-14T12:00:00.000Z")
    const stats = computeDueStats(
      [
        { dueAt: now, scheduleStatus: "new" },
        { dueAt: now, scheduleStatus: "learning" },
        { dueAt: new Date("2099-01-01T00:00:00.000Z"), scheduleStatus: "review" },
        { dueAt: now, scheduleStatus: "buried" },
        { dueAt: now, scheduleStatus: "suspended" },
      ],
      "Asia/Shanghai",
      now,
    )
    expect(stats).toEqual({ new: 1, learning: 1, review: 0 })
  })

  it("maps card states to schedule statuses", () => {
    expect(scheduleStatusForState("new")).toBe("new")
    expect(scheduleStatusForState("learning")).toBe("learning")
    expect(scheduleStatusForState("relearning")).toBe("learning")
    expect(scheduleStatusForState("review")).toBe("review")
  })
})
