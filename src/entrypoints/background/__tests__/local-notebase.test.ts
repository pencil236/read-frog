import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createDefaultLocalNotebaseStore,
  createLocalNotebaseRepository,
} from "@/utils/local-notebase/repository"
import { localNotebaseDb } from "@/utils/local-notebase/storage/handle-store"
import { setupLocalNotebaseMessageHandlers } from "../local-notebase"
import "fake-indexeddb/auto"

const { registeredHandlers: handlers } = vi.hoisted(() => {
  const registeredHandlers = new Map<string, (message: { data: unknown }) => Promise<unknown>>()
  return { registeredHandlers }
})

vi.mock("@/utils/message", () => ({
  onMessage: (type: string, handler: (message: { data: unknown }) => Promise<unknown>) => {
    handlers.set(type, handler)
  },
}))

function createPayload(name = "Dictionary") {
  return {
    data: {
      name,
      columns: [{ name: "Term", type: "string" }],
      results: [{ Term: "hello" }],
      templateName: name,
    },
  }
}

describe("setupLocalNotebaseMessageHandlers", () => {
  beforeEach(async () => {
    handlers.clear()
    await Promise.all(localNotebaseDb.tables.map((table) => table.clear()))
  })

  it("reports folderChosen=false when no storage folder is set", async () => {
    setupLocalNotebaseMessageHandlers()
    const status = handlers.get("localNotebaseGetStorageStatus")
    expect(status).toBeDefined()

    const result = (await status!({ data: undefined })) as {
      folderChosen: boolean
      location: string | null
    }
    expect(result.folderChosen).toBe(false)
    expect(result.location).toBeNull()
  })

  it("reuses an existing notebase with the same name instead of creating a duplicate", async () => {
    setupLocalNotebaseMessageHandlers()
    const create = handlers.get("localNotebaseCreate")
    expect(create).toBeDefined()

    const first = (await create!(createPayload())) as { notebaseId: string }
    const second = (await create!(createPayload())) as { notebaseId: string }

    expect(second.notebaseId).toBe(first.notebaseId)

    const repository = createLocalNotebaseRepository()
    const summaries = await repository.listNotebases()
    expect(summaries).toHaveLength(1)

    const store = await createDefaultLocalNotebaseStore()
    const snapshot = await store.loadSnapshot(first.notebaseId)
    expect(snapshot?.rows.map((row) => row.cells.Term)).toEqual(["hello", "hello"])
  })

  it("creates a new notebase with a default view and auto-generated cards", async () => {
    setupLocalNotebaseMessageHandlers()
    const create = handlers.get("localNotebaseCreate")!

    const result = (await create(createPayload())) as { notebaseId: string }

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
})
