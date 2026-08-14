import {
  cardIdentityShape,
  cardMemoryStateSchema,
  cardMemoryStateShape,
  cardTemplateConfigSchema,
  cardStateSchema,
  fsrsReviewLogSnapshotSchema,
  notebaseColumnConfigSchema,
  reviewRatingSchema,
  scheduleStatusSchema,
  schedulingParamsShape,
  SRS_REVIEW_DURATION_MS_MAX,
} from "@read-frog/definitions"
import { z } from "zod"

export const LOCAL_NOTEBASE_DATA_VERSION = 1

export const localNotebaseSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    ...schedulingParamsShape,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()
export type LocalNotebase = z.infer<typeof localNotebaseSchema>

export const localNotebaseSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  updatedAt: z.coerce.date(),
})
export type LocalNotebaseSummary = z.infer<typeof localNotebaseSummarySchema>

export const localNotebaseColumnSchema = z
  .object({
    id: z.uuid(),
    notebaseId: z.uuid(),
    name: z.string().min(1),
    config: notebaseColumnConfigSchema,
    position: z.number().int().min(0),
    isPrimary: z.boolean(),
    width: z.number().int().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()
export type LocalNotebaseColumn = z.infer<typeof localNotebaseColumnSchema>

export const localNotebaseRowSchema = z
  .object({
    id: z.uuid(),
    notebaseId: z.uuid(),
    cells: z.record(z.string(), z.unknown()),
    position: z.number().int().min(0),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()
export type LocalNotebaseRow = z.infer<typeof localNotebaseRowSchema>

export const localNotebaseViewTypeSchema = z.enum(["table", "kanban", "gallery"])
export type LocalNotebaseViewType = z.infer<typeof localNotebaseViewTypeSchema>

export const localNotebaseViewSchema = z
  .object({
    id: z.uuid(),
    notebaseId: z.uuid(),
    name: z.string().min(1),
    type: localNotebaseViewTypeSchema,
    config: z.record(z.string(), z.unknown()).nullable(),
    filters: z.array(z.unknown()).nullable(),
    sorts: z.array(z.unknown()).nullable(),
    position: z.number().int().min(0),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()
export type LocalNotebaseView = z.infer<typeof localNotebaseViewSchema>

export const localCardTemplateSchema = z
  .object({
    id: z.uuid(),
    notebaseId: z.uuid(),
    name: z.string().min(1),
    config: cardTemplateConfigSchema,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()
export type LocalCardTemplate = z.infer<typeof localCardTemplateSchema>

export const localCardSchema = z
  .object({
    ...cardIdentityShape,
    ...cardMemoryStateShape,
    front: z.string(),
    back: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()
export type LocalCard = z.infer<typeof localCardSchema>

export const localRevlogSchema = z
  .object({
    id: z.uuid(),
    notebaseId: z.uuid(),
    cardId: z.uuid(),
    rating: reviewRatingSchema,
    state: cardStateSchema,
    afterScheduleStatus: scheduleStatusSchema,
    reviewedAt: z.coerce.date(),
    durationMs: z.number().int().min(0).max(SRS_REVIEW_DURATION_MS_MAX),
    fsrsReviewLogSnapshot: fsrsReviewLogSnapshotSchema,
    /** Memory state immediately before this review, used for rollback. */
    before: cardMemoryStateSchema,
    createdAt: z.coerce.date(),
  })
  .strict()
export type LocalRevlog = z.infer<typeof localRevlogSchema>

export const localNotebaseSnapshotSchema = z
  .object({
    version: z.literal(LOCAL_NOTEBASE_DATA_VERSION),
    notebase: localNotebaseSchema,
    columns: z.array(localNotebaseColumnSchema),
    rows: z.array(localNotebaseRowSchema),
    views: z.array(localNotebaseViewSchema),
    templates: z.array(localCardTemplateSchema),
    cards: z.array(localCardSchema),
    revlogs: z.array(localRevlogSchema),
  })
  .strict()
export type LocalNotebaseSnapshot = z.infer<typeof localNotebaseSnapshotSchema>
