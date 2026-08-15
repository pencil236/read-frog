import { beforeEach, describe, expect, it } from "vitest"
import {
  createDefaultLocalNotebaseStore,
  createLocalNotebaseRepository,
} from "@/utils/local-notebase/repository"
import { localNotebaseDb } from "@/utils/local-notebase/storage/handle-store"
import { appendLocalNotebaseRows, createLocalNotebaseFromRequest } from "../local-notebase-save"
import "fake-indexeddb/auto"

function createPayload(name = "Dictionary") {
  return {
    name,
    columns: [{ name: "Term", type: "string" }],
    results: [{ Term: "hello" }],
    templateName: name,
  }
}

describe("offscreen local notebase save", () => {
  beforeEach(async () => {
    await Promise.all(localNotebaseDb.tables.map((table) => table.clear()))
  })

  it("reuses an existing notebase with the same name instead of creating a duplicate", async () => {
    const first = await createLocalNotebaseFromRequest(createPayload())
    const second = await createLocalNotebaseFromRequest(createPayload())

    expect(second.notebaseId).toBe(first.notebaseId)

    const repository = createLocalNotebaseRepository()
    const summaries = await repository.listNotebases()
    expect(summaries).toHaveLength(1)

    const store = await createDefaultLocalNotebaseStore()
    const snapshot = await store.loadSnapshot(first.notebaseId)
    expect(snapshot?.rows.map((row) => row.cells.Term)).toEqual(["hello", "hello"])
  })

  it("creates a new notebase with a default view and auto-generated cards", async () => {
    const result = await createLocalNotebaseFromRequest(createPayload())

    const repository = createLocalNotebaseRepository()
    const summaries = await repository.listNotebases()
    expect(summaries).toHaveLength(1)
    expect(summaries[0]!.id).toBe(result.notebaseId)

    const store = await createDefaultLocalNotebaseStore()
    const snapshot = await store.loadSnapshot(result.notebaseId)
    expect(snapshot?.views).toHaveLength(1)
    expect(snapshot?.views[0]!.name).toBe("Default")
    expect(snapshot?.cards).toHaveLength(1)
  })

  it("appends rows to the bound notebase", async () => {
    const created = await createLocalNotebaseFromRequest(createPayload())
    const append = await appendLocalNotebaseRows({
      notebaseId: created.notebaseId,
      results: [{ Term: "world" }],
    })

    expect(append.created).toBe(1)
    const store = await createDefaultLocalNotebaseStore()
    const snapshot = await store.loadSnapshot(created.notebaseId)
    expect(snapshot?.rows.map((row) => row.cells.Term)).toEqual(["hello", "world"])
  })
})
