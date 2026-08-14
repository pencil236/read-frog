import type { LocalNotebaseSnapshot, LocalNotebaseSummary } from "../types"
import { localNotebaseSnapshotSchema } from "../types"
import { localNotebaseDb } from "./handle-store"

/**
 * IndexedDB-backed store used when the File System Access API is unavailable
 * (Firefox) or when the user has not chosen a directory yet.
 */
export class InternalLocalNotebaseStore {
  async listNotebaseSummaries(): Promise<LocalNotebaseSummary[]> {
    const notebases = await localNotebaseDb.notebases.toArray()
    return notebases
      .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async loadSnapshot(notebaseId: string): Promise<LocalNotebaseSnapshot | null> {
    const [notebase, columns, rows, views, templates, cards, revlogs] = await Promise.all([
      localNotebaseDb.notebases.get(notebaseId),
      localNotebaseDb.columns.where("notebaseId").equals(notebaseId).toArray(),
      localNotebaseDb.rows.where("notebaseId").equals(notebaseId).toArray(),
      localNotebaseDb.views.where("notebaseId").equals(notebaseId).toArray(),
      localNotebaseDb.templates.where("notebaseId").equals(notebaseId).toArray(),
      localNotebaseDb.cards.where("notebaseId").equals(notebaseId).toArray(),
      localNotebaseDb.revlogs.where("notebaseId").equals(notebaseId).toArray(),
    ])
    if (!notebase) {
      return null
    }

    const parsed = localNotebaseSnapshotSchema.safeParse({
      version: 1,
      notebase,
      columns: [...columns].sort((a, b) => a.position - b.position),
      rows: [...rows].sort((a, b) => a.position - b.position),
      views: [...views].sort((a, b) => a.position - b.position),
      templates: [...templates].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      cards: [...cards].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      revlogs: [...revlogs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    })
    return parsed.success ? parsed.data : null
  }

  async saveSnapshot(snapshot: LocalNotebaseSnapshot): Promise<void> {
    const { notebase, columns, rows, views, templates, cards, revlogs } = snapshot
    await localNotebaseDb.transaction(
      "rw",
      [
        localNotebaseDb.notebases,
        localNotebaseDb.columns,
        localNotebaseDb.rows,
        localNotebaseDb.views,
        localNotebaseDb.templates,
        localNotebaseDb.cards,
        localNotebaseDb.revlogs,
      ],
      async () => {
        const id = notebase.id
        await localNotebaseDb.columns.where("notebaseId").equals(id).delete()
        await localNotebaseDb.rows.where("notebaseId").equals(id).delete()
        await localNotebaseDb.views.where("notebaseId").equals(id).delete()
        await localNotebaseDb.templates.where("notebaseId").equals(id).delete()
        await localNotebaseDb.cards.where("notebaseId").equals(id).delete()
        await localNotebaseDb.revlogs.where("notebaseId").equals(id).delete()
        await localNotebaseDb.notebases.put(notebase)
        await localNotebaseDb.columns.bulkPut(columns)
        await localNotebaseDb.rows.bulkPut(rows)
        await localNotebaseDb.views.bulkPut(views)
        await localNotebaseDb.templates.bulkPut(templates)
        await localNotebaseDb.cards.bulkPut(cards)
        await localNotebaseDb.revlogs.bulkPut(revlogs)
      },
    )
  }

  async deleteSnapshot(notebaseId: string): Promise<void> {
    await localNotebaseDb.transaction(
      "rw",
      [
        localNotebaseDb.notebases,
        localNotebaseDb.columns,
        localNotebaseDb.rows,
        localNotebaseDb.views,
        localNotebaseDb.templates,
        localNotebaseDb.cards,
        localNotebaseDb.revlogs,
      ],
      async () => {
        await localNotebaseDb.notebases.delete(notebaseId)
        await localNotebaseDb.columns.where("notebaseId").equals(notebaseId).delete()
        await localNotebaseDb.rows.where("notebaseId").equals(notebaseId).delete()
        await localNotebaseDb.views.where("notebaseId").equals(notebaseId).delete()
        await localNotebaseDb.templates.where("notebaseId").equals(notebaseId).delete()
        await localNotebaseDb.cards.where("notebaseId").equals(notebaseId).delete()
        await localNotebaseDb.revlogs.where("notebaseId").equals(notebaseId).delete()
      },
    )
  }
}
