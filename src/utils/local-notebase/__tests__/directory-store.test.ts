import { describe, expect, it } from "vitest"
import { createLocalNotebaseRepository } from "../repository"
import { DirectoryLocalNotebaseStore } from "../storage/directory-store"

class MockWritable {
  constructor(private file: MockFileHandle) {}

  async write(data: string | Uint8Array | ArrayBuffer) {
    this.file.content =
      typeof data === "string"
        ? data
        : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data))
  }

  async close() {}
}

class MockFileHandle {
  content = ""

  async createWritable() {
    return new MockWritable(this)
  }

  async getFile() {
    return new File([this.content], "file.json")
  }
}

class MockDirHandle {
  readonly children = new Map<string, MockDirHandle | MockFileHandle>()

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const existing = this.children.get(name)
    if (existing instanceof MockFileHandle) {
      return existing
    }
    if (options?.create) {
      const file = new MockFileHandle()
      this.children.set(name, file)
      return file
    }
    throw new Error(`File not found: ${name}`)
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const existing = this.children.get(name)
    if (existing instanceof MockDirHandle) {
      return existing
    }
    if (options?.create) {
      const dir = new MockDirHandle()
      this.children.set(name, dir)
      return dir
    }
    throw new Error(`Directory not found: ${name}`)
  }

  async removeEntry(name: string) {
    this.children.delete(name)
  }
}

function mockRoot(): MockDirHandle {
  return new MockDirHandle()
}

describe("DirectoryLocalNotebaseStore", () => {
  it("persists snapshots under read-frog/notebases and maintains index.json", async () => {
    const root = mockRoot()
    const store = new DirectoryLocalNotebaseStore(root as unknown as FileSystemDirectoryHandle)
    const repository = createLocalNotebaseRepository(store)

    const created = await repository.createNotebase({
      name: "Local Notes",
      columns: [{ name: "Term", config: { type: "string" } }],
    })
    await repository.createRows(created.id, [{ cells: { Term: "hello" } }])

    const summaries = await store.listNotebaseSummaries()
    expect(summaries).toHaveLength(1)
    expect(summaries[0]!.id).toBe(created.id)

    const snapshot = await store.loadSnapshot(created.id)
    expect(snapshot?.notebase.name).toBe("Local Notes")
    expect(snapshot?.rows).toHaveLength(1)

    const readFrogDir = root.children.get("read-frog") as MockDirHandle
    expect(readFrogDir.children.has("index.json")).toBe(true)
    const notebasesDir = readFrogDir.children.get("notebases") as MockDirHandle
    expect(notebasesDir.children.has(`${created.id}.json`)).toBe(true)
  })

  it("removes snapshots from disk and index on delete", async () => {
    const root = mockRoot()
    const store = new DirectoryLocalNotebaseStore(root as unknown as FileSystemDirectoryHandle)
    const repository = createLocalNotebaseRepository(store)

    const created = await repository.createNotebase({
      name: "To delete",
      columns: [{ name: "Term", config: { type: "string" } }],
    })
    await repository.deleteNotebase(created.id)

    expect(await store.listNotebaseSummaries()).toHaveLength(0)
    expect(await store.loadSnapshot(created.id)).toBeNull()

    const readFrogDir = root.children.get("read-frog") as MockDirHandle
    const notebasesDir = readFrogDir.children.get("notebases") as MockDirHandle
    expect(notebasesDir.children.has(`${created.id}.json`)).toBe(false)
  })
})
