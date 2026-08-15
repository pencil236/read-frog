import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  LOCAL_NOTEBASE_FOLDER_PERMISSION_DENIED,
  LOCAL_NOTEBASE_FOLDER_REQUIRED,
} from "@/utils/constants/local-notebase"
import {
  createDefaultLocalNotebaseStore,
  createLocalNotebaseRepository,
} from "@/utils/local-notebase/repository"
import { localNotebaseDb } from "@/utils/local-notebase/storage/handle-store"
import {
  appendLocalNotebaseRows,
  createLocalNotebaseFromRequest,
  ensureDirectoryWritePermission,
} from "../local-notebase-save"
import "fake-indexeddb/auto"

const getStoredDirectoryHandleMock = vi.hoisted(() =>
  vi.fn<() => Promise<FileSystemDirectoryHandle | null>>(),
)

vi.mock("@/utils/local-notebase/storage/directory", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/utils/local-notebase/storage/directory")>()
  return {
    ...original,
    getStoredDirectoryHandle: getStoredDirectoryHandleMock,
  }
})

function createPayload(name = "Dictionary") {
  return {
    name,
    columns: [{ name: "Term", type: "string" }],
    results: [{ Term: "hello" }],
    templateName: name,
  }
}

type DirectoryPermissionState = "granted" | "denied" | "prompt"
type DirectoryPermissionFn = (descriptor: {
  mode: "read" | "readwrite"
}) => Promise<DirectoryPermissionState>

function createFakeHandle(permission: DirectoryPermissionState) {
  return {
    name: "MyFolder",
    queryPermission: vi.fn<DirectoryPermissionFn>(async () => permission),
    requestPermission: vi.fn<DirectoryPermissionFn>(async () => "granted"),
    getDirectoryHandle: vi.fn<() => Promise<void>>(),
    getFileHandle: vi.fn<() => Promise<void>>(),
  }
}

describe("offscreen local notebase save", () => {
  beforeEach(async () => {
    await Promise.all(localNotebaseDb.tables.map((table) => table.clear()))
    getStoredDirectoryHandleMock.mockReset()
    getStoredDirectoryHandleMock.mockResolvedValue(null)
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

  describe("ensureDirectoryWritePermission", () => {
    it("fails with a recognizable code when no folder is stored", async () => {
      await expect(ensureDirectoryWritePermission()).rejects.toThrow(LOCAL_NOTEBASE_FOLDER_REQUIRED)
    })

    it("returns the handle when readwrite permission is already granted", async () => {
      const handle = createFakeHandle("granted")
      getStoredDirectoryHandleMock.mockResolvedValueOnce(
        handle as unknown as FileSystemDirectoryHandle,
      )

      const result = await ensureDirectoryWritePermission()

      expect(result).toBe(handle)
      expect(handle.requestPermission).not.toHaveBeenCalled()
    })

    it("re-requests readwrite permission when it is only prompt", async () => {
      const handle = createFakeHandle("prompt")
      getStoredDirectoryHandleMock.mockResolvedValueOnce(
        handle as unknown as FileSystemDirectoryHandle,
      )

      const result = await ensureDirectoryWritePermission()

      expect(result).toBe(handle)
      expect(handle.queryPermission).toHaveBeenCalledWith({ mode: "readwrite" })
      expect(handle.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" })
    })

    it("fails with a recognizable code when permission is still not granted", async () => {
      const handle = createFakeHandle("denied")
      handle.requestPermission = vi.fn<DirectoryPermissionFn>(async () => "denied")
      getStoredDirectoryHandleMock.mockResolvedValueOnce(
        handle as unknown as FileSystemDirectoryHandle,
      )

      await expect(ensureDirectoryWritePermission()).rejects.toThrow(
        LOCAL_NOTEBASE_FOLDER_PERMISSION_DENIED,
      )
    })
  })
})
