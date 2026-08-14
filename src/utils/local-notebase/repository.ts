import type {
  BasicCardTemplateConfig,
  NotebaseColumnConfig,
  ReviewRating,
  SchedulingParams,
} from "@read-frog/definitions"
import type {
  LocalCard,
  LocalCardTemplate,
  LocalNotebase,
  LocalNotebaseColumn,
  LocalNotebaseRow,
  LocalNotebaseSnapshot,
  LocalNotebaseSummary,
  LocalNotebaseView,
  LocalRevlog,
} from "./types"
import { getRandomUUID } from "@/utils/crypto-polyfill"
import { createDefaultDictionaryTemplate, renderPattern } from "./render"
import { applyReview, computeDueStats, scheduleStatusForState, withDefaultSrsParams } from "./srs"
import { DirectoryLocalNotebaseStore } from "./storage/directory-store"
import { getStoredDirectoryHandle } from "./storage/handle-store"
import { InternalLocalNotebaseStore } from "./storage/internal"
import { localNotebaseSchema, localNotebaseSummarySchema } from "./types"

export interface LocalNotebaseStore {
  listNotebaseSummaries(): Promise<LocalNotebaseSummary[]>
  loadSnapshot(notebaseId: string): Promise<LocalNotebaseSnapshot | null>
  saveSnapshot(snapshot: LocalNotebaseSnapshot): Promise<void>
  deleteSnapshot(notebaseId: string): Promise<void>
}

export interface CreateLocalNotebaseInput {
  name: string
  columns: Array<{ name: string; config: NotebaseColumnConfig }>
  srs?: Partial<SchedulingParams>
  initialRows?: Array<{ id?: string; cells: Record<string, unknown> }>
  createDefaultTemplate?: boolean
  templateName?: string
}

export interface LocalReviewOutcome {
  card: LocalCard
  revlog: LocalRevlog
}

export interface LocalNotebaseRepository {
  listNotebases(): Promise<LocalNotebaseSummary[]>
  getNotebase(id: string): Promise<LocalNotebase | null>
  createNotebase(input: CreateLocalNotebaseInput): Promise<LocalNotebase>
  updateNotebase(
    id: string,
    patch: { name?: string; srs?: Partial<SchedulingParams> },
  ): Promise<LocalNotebase>
  deleteNotebase(id: string): Promise<void>

  createColumn(
    notebaseId: string,
    data: { name: string; config: NotebaseColumnConfig },
  ): Promise<LocalNotebaseColumn>
  updateColumn(
    notebaseId: string,
    columnId: string,
    patch: { name?: string; config?: NotebaseColumnConfig; width?: number | null },
  ): Promise<LocalNotebaseColumn>
  deleteColumn(notebaseId: string, columnId: string): Promise<void>
  reorderColumns(notebaseId: string, ids: string[]): Promise<void>

  createRows(
    notebaseId: string,
    rows: Array<{ id?: string; cells: Record<string, unknown> }>,
  ): Promise<LocalNotebaseRow[]>
  updateRow(
    notebaseId: string,
    rowId: string,
    cells: Record<string, unknown>,
  ): Promise<LocalNotebaseRow>
  deleteRow(notebaseId: string, rowId: string): Promise<void>
  reorderRows(notebaseId: string, ids: string[]): Promise<void>

  createView(
    notebaseId: string,
    data: { name: string; type: LocalNotebaseView["type"] },
  ): Promise<LocalNotebaseView>
  updateView(
    notebaseId: string,
    viewId: string,
    patch: Partial<Pick<LocalNotebaseView, "name" | "type" | "config" | "filters" | "sorts">>,
  ): Promise<LocalNotebaseView>
  deleteView(notebaseId: string, viewId: string): Promise<void>

  listTemplates(notebaseId: string): Promise<LocalCardTemplate[]>
  createTemplate(
    notebaseId: string,
    data: { name: string; config: BasicCardTemplateConfig },
  ): Promise<LocalCardTemplate>
  updateTemplate(
    notebaseId: string,
    templateId: string,
    patch: { name?: string; config?: BasicCardTemplateConfig },
  ): Promise<LocalCardTemplate>
  deleteTemplate(notebaseId: string, templateId: string): Promise<void>

  listCards(notebaseId: string, templateId?: string): Promise<LocalCard[]>
  generateCards(notebaseId: string, templateId?: string): Promise<{ created: number }>

  reviewCard(
    cardId: string,
    rating: ReviewRating,
    durationMs: number,
    timezone: string,
    now?: Date,
  ): Promise<LocalReviewOutcome>
  rollbackReview(cardId: string): Promise<{ card: LocalCard; rolledBackRevlogId: string }>
  setCardBuried(cardId: string, enabled: boolean): Promise<LocalCard>
  setCardSuspended(cardId: string, enabled: boolean): Promise<LocalCard>
  dueStats(
    notebaseIds: string[],
    timezone: string,
    now?: Date,
  ): Promise<Record<string, { new: number; learning: number; review: number }>>
}

export class LocalNotebaseRepositoryImpl implements LocalNotebaseRepository {
  constructor(private readonly store: LocalNotebaseStore) {}

  async listNotebases(): Promise<LocalNotebaseSummary[]> {
    return this.store.listNotebaseSummaries()
  }

  async getNotebase(id: string): Promise<LocalNotebase | null> {
    const snapshot = await this.store.loadSnapshot(id)
    return snapshot?.notebase ?? null
  }

  async createNotebase(input: CreateLocalNotebaseInput): Promise<LocalNotebase> {
    const now = new Date()
    const id = getRandomUUID()
    const srs = withDefaultSrsParams(input.srs)
    const notebase = localNotebaseSchema.parse({
      id,
      name: input.name,
      ...srs,
      createdAt: now,
      updatedAt: now,
    })

    const columns: LocalNotebaseColumn[] = input.columns.map((column, index) => ({
      id: getRandomUUID(),
      notebaseId: id,
      name: column.name,
      config: column.config,
      position: index,
      isPrimary: index === 0,
      width: null,
      createdAt: now,
      updatedAt: now,
    }))

    const rows: LocalNotebaseRow[] = (input.initialRows ?? []).map((row, index) => ({
      id: row.id ?? getRandomUUID(),
      notebaseId: id,
      cells: row.cells,
      position: index,
      createdAt: now,
      updatedAt: now,
    }))

    const templates: LocalCardTemplate[] =
      input.createDefaultTemplate === false
        ? []
        : [
            {
              id: getRandomUUID(),
              notebaseId: id,
              ...createDefaultDictionaryTemplate(columns, input.templateName),
              createdAt: now,
              updatedAt: now,
            },
          ]

    const snapshot: LocalNotebaseSnapshot = {
      version: 1,
      notebase,
      columns,
      rows,
      views: [],
      templates,
      cards: [],
      revlogs: [],
    }
    await this.store.saveSnapshot(snapshot)
    return notebase
  }

  async updateNotebase(
    id: string,
    patch: { name?: string; srs?: Partial<SchedulingParams> },
  ): Promise<LocalNotebase> {
    return this.withSnapshot(id, (snapshot) => {
      const notebase = localNotebaseSchema.parse({
        ...snapshot.notebase,
        ...patch,
        ...(patch.srs ? withDefaultSrsParams({ ...snapshot.notebase, ...patch.srs }) : {}),
        updatedAt: new Date(),
      })
      snapshot.notebase = notebase
      return notebase
    })
  }

  async deleteNotebase(id: string): Promise<void> {
    await this.store.deleteSnapshot(id)
  }

  async createColumn(
    notebaseId: string,
    data: { name: string; config: NotebaseColumnConfig },
  ): Promise<LocalNotebaseColumn> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const now = new Date()
      const column: LocalNotebaseColumn = {
        id: getRandomUUID(),
        notebaseId,
        name: data.name,
        config: data.config,
        position: snapshot.columns.length,
        isPrimary: snapshot.columns.length === 0,
        width: null,
        createdAt: now,
        updatedAt: now,
      }
      snapshot.columns.push(column)
      return column
    })
  }

  async updateColumn(
    notebaseId: string,
    columnId: string,
    patch: { name?: string; config?: NotebaseColumnConfig; width?: number | null },
  ): Promise<LocalNotebaseColumn> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const column = snapshot.columns.find((item) => item.id === columnId)
      if (!column) {
        throw new Error(`Column not found: ${columnId}`)
      }
      const oldName = column.name
      Object.assign(column, patch, { updatedAt: new Date() })
      if (patch.name && patch.name !== oldName) {
        for (const row of snapshot.rows) {
          if (oldName in row.cells) {
            const value = row.cells[oldName]
            delete row.cells[oldName]
            if (patch.name) {
              row.cells[patch.name] = value
            }
          }
        }
      }
      return column
    })
  }

  async deleteColumn(notebaseId: string, columnId: string): Promise<void> {
    await this.withSnapshot(notebaseId, (snapshot) => {
      const column = snapshot.columns.find((item) => item.id === columnId)
      if (!column) {
        return
      }
      if (column.isPrimary) {
        throw new Error("Cannot delete the primary column")
      }
      snapshot.columns = snapshot.columns
        .filter((item) => item.id !== columnId)
        .map((item, index) => ({ ...item, position: index }))
      for (const row of snapshot.rows) {
        delete row.cells[column.name]
      }
    })
  }

  async reorderColumns(notebaseId: string, ids: string[]): Promise<void> {
    await this.withSnapshot(notebaseId, (snapshot) => {
      const byId = new Map(snapshot.columns.map((column) => [column.id, column]))
      snapshot.columns = ids
        .map((id, index) => {
          const column = byId.get(id)
          return column ? { ...column, position: index } : null
        })
        .filter((column): column is LocalNotebaseColumn => column !== null)
    })
  }

  async createRows(
    notebaseId: string,
    rows: Array<{ id?: string; cells: Record<string, unknown> }>,
  ): Promise<LocalNotebaseRow[]> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const now = new Date()
      const created = rows.map((row, index) => ({
        id: row.id ?? getRandomUUID(),
        notebaseId,
        cells: row.cells,
        position: snapshot.rows.length + index,
        createdAt: now,
        updatedAt: now,
      }))
      snapshot.rows.push(...created)
      return created
    })
  }

  async updateRow(
    notebaseId: string,
    rowId: string,
    cells: Record<string, unknown>,
  ): Promise<LocalNotebaseRow> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const row = snapshot.rows.find((item) => item.id === rowId)
      if (!row) {
        throw new Error(`Row not found: ${rowId}`)
      }
      row.cells = { ...row.cells, ...cells }
      row.updatedAt = new Date()
      return row
    })
  }

  async deleteRow(notebaseId: string, rowId: string): Promise<void> {
    await this.withSnapshot(notebaseId, (snapshot) => {
      snapshot.rows = snapshot.rows
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, position: index }))
      const cardIds = new Set(
        snapshot.cards.filter((card) => card.notebaseRowId === rowId).map((card) => card.id),
      )
      snapshot.cards = snapshot.cards.filter((card) => card.notebaseRowId !== rowId)
      snapshot.revlogs = snapshot.revlogs.filter((revlog) => !cardIds.has(revlog.cardId))
    })
  }

  async reorderRows(notebaseId: string, ids: string[]): Promise<void> {
    await this.withSnapshot(notebaseId, (snapshot) => {
      const byId = new Map(snapshot.rows.map((row) => [row.id, row]))
      snapshot.rows = ids
        .map((id, index) => {
          const row = byId.get(id)
          return row ? { ...row, position: index } : null
        })
        .filter((row): row is LocalNotebaseRow => row !== null)
    })
  }

  async createView(
    notebaseId: string,
    data: { name: string; type: LocalNotebaseView["type"] },
  ): Promise<LocalNotebaseView> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const now = new Date()
      const view: LocalNotebaseView = {
        id: getRandomUUID(),
        notebaseId,
        name: data.name,
        type: data.type,
        config: null,
        filters: null,
        sorts: null,
        position: snapshot.views.length,
        createdAt: now,
        updatedAt: now,
      }
      snapshot.views.push(view)
      return view
    })
  }

  async updateView(
    notebaseId: string,
    viewId: string,
    patch: Partial<Pick<LocalNotebaseView, "name" | "type" | "config" | "filters" | "sorts">>,
  ): Promise<LocalNotebaseView> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const view = snapshot.views.find((item) => item.id === viewId)
      if (!view) {
        throw new Error(`View not found: ${viewId}`)
      }
      Object.assign(view, patch, { updatedAt: new Date() })
      return view
    })
  }

  async deleteView(notebaseId: string, viewId: string): Promise<void> {
    await this.withSnapshot(notebaseId, (snapshot) => {
      snapshot.views = snapshot.views
        .filter((view) => view.id !== viewId)
        .map((view, index) => ({ ...view, position: index }))
    })
  }

  async listTemplates(notebaseId: string): Promise<LocalCardTemplate[]> {
    const snapshot = await this.store.loadSnapshot(notebaseId)
    return snapshot?.templates ?? []
  }

  async createTemplate(
    notebaseId: string,
    data: { name: string; config: BasicCardTemplateConfig },
  ): Promise<LocalCardTemplate> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const now = new Date()
      const template: LocalCardTemplate = {
        id: getRandomUUID(),
        notebaseId,
        name: data.name,
        config: data.config,
        createdAt: now,
        updatedAt: now,
      }
      snapshot.templates.push(template)
      return template
    })
  }

  async updateTemplate(
    notebaseId: string,
    templateId: string,
    patch: { name?: string; config?: BasicCardTemplateConfig },
  ): Promise<LocalCardTemplate> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const template = snapshot.templates.find((item) => item.id === templateId)
      if (!template) {
        throw new Error(`Template not found: ${templateId}`)
      }
      Object.assign(template, patch, { updatedAt: new Date() })
      return template
    })
  }

  async deleteTemplate(notebaseId: string, templateId: string): Promise<void> {
    await this.withSnapshot(notebaseId, (snapshot) => {
      snapshot.templates = snapshot.templates.filter((template) => template.id !== templateId)
      const cardIds = new Set(
        snapshot.cards.filter((card) => card.templateId === templateId).map((card) => card.id),
      )
      snapshot.cards = snapshot.cards.filter((card) => card.templateId !== templateId)
      snapshot.revlogs = snapshot.revlogs.filter((revlog) => !cardIds.has(revlog.cardId))
    })
  }

  async listCards(notebaseId: string, templateId?: string): Promise<LocalCard[]> {
    const snapshot = await this.store.loadSnapshot(notebaseId)
    if (!snapshot) {
      return []
    }
    return templateId
      ? snapshot.cards.filter((card) => card.templateId === templateId)
      : snapshot.cards
  }

  async generateCards(notebaseId: string, templateId?: string): Promise<{ created: number }> {
    return this.withSnapshot(notebaseId, (snapshot) => {
      const templates = templateId
        ? snapshot.templates.filter((template) => template.id === templateId)
        : snapshot.templates
      const now = new Date()
      let created = 0

      for (const template of templates) {
        for (const row of snapshot.rows) {
          const exists = snapshot.cards.some(
            (card) => card.notebaseRowId === row.id && card.templateId === template.id,
          )
          if (exists) {
            continue
          }
          const { front, back } = renderCard(template, row, snapshot.columns)
          snapshot.cards.push({
            id: getRandomUUID(),
            notebaseId,
            notebaseRowId: row.id,
            templateId: template.id,
            variantKey: `${row.id}:${template.id}`,
            state: "new",
            scheduleStatus: "new",
            dueAt: now,
            lastReviewTime: null,
            stability: 0,
            difficulty: 0,
            step: 0,
            lapses: 0,
            reps: 0,
            buriedAt: null,
            front,
            back,
            createdAt: now,
            updatedAt: now,
          })
          created += 1
        }
      }
      return { created }
    })
  }

  async reviewCard(
    cardId: string,
    rating: ReviewRating,
    durationMs: number,
    timezone: string,
    now = new Date(),
  ): Promise<LocalReviewOutcome> {
    const snapshot = await this.findSnapshotForCard(cardId)
    if (!snapshot) {
      throw new Error(`Card not found: ${cardId}`)
    }
    const card = snapshot.cards.find((item) => item.id === cardId)
    if (!card) {
      throw new Error(`Card not found: ${cardId}`)
    }

    const before = {
      state: card.state,
      scheduleStatus: card.scheduleStatus,
      dueAt: card.dueAt,
      lastReviewTime: card.lastReviewTime,
      stability: card.stability,
      difficulty: card.difficulty,
      step: card.step,
      lapses: card.lapses,
      reps: card.reps,
      buriedAt: card.buriedAt,
    }
    const result = applyReview(card, snapshot.notebase, rating, now)
    Object.assign(card, result.card)
    card.scheduleStatus = scheduleStatusForState(card.state)

    const revlog: LocalRevlog = {
      id: getRandomUUID(),
      notebaseId: snapshot.notebase.id,
      cardId,
      rating,
      state: card.state,
      afterScheduleStatus: card.scheduleStatus,
      reviewedAt: now,
      durationMs,
      fsrsReviewLogSnapshot: result.snapshot,
      before,
      createdAt: now,
    }
    snapshot.revlogs.push(revlog)
    card.updatedAt = now
    await this.store.saveSnapshot(snapshot)
    return { card, revlog }
  }

  async rollbackReview(cardId: string): Promise<{ card: LocalCard; rolledBackRevlogId: string }> {
    const snapshot = await this.findSnapshotForCard(cardId)
    if (!snapshot) {
      throw new Error(`Card not found: ${cardId}`)
    }
    const card = snapshot.cards.find((item) => item.id === cardId)
    if (!card) {
      throw new Error(`Card not found: ${cardId}`)
    }
    const revlogs = snapshot.revlogs.filter((revlog) => revlog.cardId === cardId)
    const latest = revlogs.at(-1)
    if (!latest) {
      throw new Error("No review to roll back")
    }

    Object.assign(card, latest.before)
    card.updatedAt = new Date()
    snapshot.revlogs = snapshot.revlogs.filter((revlog) => revlog.id !== latest.id)
    await this.store.saveSnapshot(snapshot)
    return { card, rolledBackRevlogId: latest.id }
  }

  async setCardBuried(cardId: string, enabled: boolean): Promise<LocalCard> {
    return this.updateCardScheduleStatus(cardId, enabled ? "buried" : "active")
  }

  async setCardSuspended(cardId: string, enabled: boolean): Promise<LocalCard> {
    return this.updateCardScheduleStatus(cardId, enabled ? "suspended" : "active")
  }

  async dueStats(
    notebaseIds: string[],
    timezone: string,
    now = new Date(),
  ): Promise<Record<string, { new: number; learning: number; review: number }>> {
    const result: Record<string, { new: number; learning: number; review: number }> = {}
    for (const notebaseId of notebaseIds) {
      const snapshot = await this.store.loadSnapshot(notebaseId)
      result[notebaseId] = snapshot
        ? computeDueStats(snapshot.cards, timezone, now)
        : { new: 0, learning: 0, review: 0 }
    }
    return result
  }

  private async updateCardScheduleStatus(
    cardId: string,
    status: "buried" | "suspended" | "active",
  ): Promise<LocalCard> {
    const snapshot = await this.findSnapshotForCard(cardId)
    if (!snapshot) {
      throw new Error(`Card not found: ${cardId}`)
    }
    const card = snapshot.cards.find((item) => item.id === cardId)
    if (!card) {
      throw new Error(`Card not found: ${cardId}`)
    }

    if (status === "active") {
      card.scheduleStatus = scheduleStatusForState(card.state)
      card.buriedAt = null
    } else {
      card.scheduleStatus = status
      card.buriedAt = status === "buried" ? new Date() : card.buriedAt
    }
    card.updatedAt = new Date()
    await this.store.saveSnapshot(snapshot)
    return card
  }

  private async findSnapshotForCard(cardId: string): Promise<LocalNotebaseSnapshot | null> {
    const summaries = await this.store.listNotebaseSummaries()
    for (const summary of summaries) {
      const snapshot = await this.store.loadSnapshot(summary.id)
      if (snapshot?.cards.some((card) => card.id === cardId)) {
        return snapshot
      }
    }
    return null
  }

  private async withSnapshot<T>(
    notebaseId: string,
    mutate: (snapshot: LocalNotebaseSnapshot) => T,
  ): Promise<T> {
    const snapshot = await this.store.loadSnapshot(notebaseId)
    if (!snapshot) {
      throw new Error(`Notebase not found: ${notebaseId}`)
    }
    const result = mutate(snapshot)
    snapshot.notebase.updatedAt = new Date()
    await this.store.saveSnapshot(snapshot)
    return result
  }
}

function renderCard(
  template: LocalCardTemplate,
  row: LocalNotebaseRow,
  columns: LocalNotebaseColumn[],
): { front: string; back: string } {
  if (template.config.type !== "basic") {
    return { front: "", back: "" }
  }
  return {
    front: renderPattern(template.config.frontPattern, row.cells, columns),
    back: renderPattern(template.config.backPattern, row.cells, columns),
  }
}

export async function createDefaultLocalNotebaseStore(): Promise<LocalNotebaseStore> {
  const handle = await getStoredDirectoryHandle()
  if (handle) {
    return new DirectoryLocalNotebaseStore(handle)
  }
  return new InternalLocalNotebaseStore()
}

export async function getLocalNotebaseRepository(): Promise<LocalNotebaseRepository> {
  return new LocalNotebaseRepositoryImpl(await createDefaultLocalNotebaseStore())
}

export function createLocalNotebaseRepository(
  store: LocalNotebaseStore = new InternalLocalNotebaseStore(),
): LocalNotebaseRepository {
  return new LocalNotebaseRepositoryImpl(store)
}

export function toLocalNotebaseSummary(notebase: LocalNotebase): LocalNotebaseSummary {
  return localNotebaseSummarySchema.parse({
    id: notebase.id,
    name: notebase.name,
    updatedAt: notebase.updatedAt,
  })
}
