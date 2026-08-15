import { beforeEach, describe, expect, it, vi } from "vitest"
import { localNotebaseDb } from "@/utils/local-notebase/storage/handle-store"
import { setupLocalNotebaseMessageHandlers } from "../local-notebase"
import "fake-indexeddb/auto"

const { handlers: registeredHandlers } = vi.hoisted(() => {
  const handlers = new Map<string, (message: { data: unknown }) => Promise<unknown>>()
  return { handlers }
})

vi.mock("@/utils/message", () => ({
  onMessage: (type: string, handler: (message: { data: unknown }) => Promise<unknown>) => {
    registeredHandlers.set(type, handler)
  },
}))

describe("setupLocalNotebaseMessageHandlers", () => {
  beforeEach(async () => {
    registeredHandlers.clear()
    await Promise.all(localNotebaseDb.tables.map((table) => table.clear()))
  })

  it("reports folderChosen=false when no storage folder is set", async () => {
    setupLocalNotebaseMessageHandlers()
    const status = registeredHandlers.get("localNotebaseGetStorageStatus")
    expect(status).toBeDefined()

    const result = (await status!({ data: undefined })) as {
      folderChosen: boolean
      location: string | null
    }
    expect(result.folderChosen).toBe(false)
    expect(result.location).toBeNull()
  })

  it("registers create and append handlers", async () => {
    setupLocalNotebaseMessageHandlers()
    expect(registeredHandlers.has("localNotebaseCreate")).toBe(true)
    expect(registeredHandlers.has("localNotebaseAppendRows")).toBe(true)
  })
})
