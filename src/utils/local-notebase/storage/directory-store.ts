import type { LocalNotebaseSnapshot, LocalNotebaseSummary } from "../types"
import { LOCAL_NOTEBASE_DATA_VERSION, localNotebaseSnapshotSchema } from "../types"
import {
  getNotebasesDir,
  getReadFrogRoot,
  readJsonFile,
  removeFile,
  writeJsonFile,
} from "./directory"

interface IndexFile {
  version: number
  notebases: LocalNotebaseSummary[]
}

/**
 * File System Access API-backed store. Data lives in the user-chosen
 * directory under `read-frog/index.json` and `read-frog/notebases/<id>.json`.
 */
export class DirectoryLocalNotebaseStore {
  constructor(private readonly root: FileSystemDirectoryHandle) {}

  async listNotebaseSummaries(): Promise<LocalNotebaseSummary[]> {
    const readFrogRoot = await getReadFrogRoot(this.root)
    const index = await readJsonFile<IndexFile>(readFrogRoot, "index.json")
    if (!index || !Array.isArray(index.notebases)) {
      return []
    }
    return index.notebases
      .map(({ id, name, updatedAt }) => ({ id, name, updatedAt: new Date(updatedAt) }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async loadSnapshot(notebaseId: string): Promise<LocalNotebaseSnapshot | null> {
    const notebasesDir = await getNotebasesDir(this.root)
    const raw = await readJsonFile<unknown>(notebasesDir, `${notebaseId}.json`)
    if (!raw) {
      return null
    }
    const parsed = localNotebaseSnapshotSchema.safeParse(raw)
    return parsed.success ? parsed.data : null
  }

  async saveSnapshot(snapshot: LocalNotebaseSnapshot): Promise<void> {
    const readFrogRoot = await getReadFrogRoot(this.root)
    const notebasesDir = await getNotebasesDir(this.root)
    await writeJsonFile(notebasesDir, `${snapshot.notebase.id}.json`, snapshot)
    await this.updateIndex(readFrogRoot, {
      id: snapshot.notebase.id,
      name: snapshot.notebase.name,
      updatedAt: snapshot.notebase.updatedAt,
    })
  }

  async deleteSnapshot(notebaseId: string): Promise<void> {
    const readFrogRoot = await getReadFrogRoot(this.root)
    const notebasesDir = await getNotebasesDir(this.root)
    await removeFile(notebasesDir, `${notebaseId}.json`)
    const index = await readJsonFile<IndexFile>(readFrogRoot, "index.json")
    if (!index) {
      return
    }
    await writeJsonFile(readFrogRoot, "index.json", {
      version: LOCAL_NOTEBASE_DATA_VERSION,
      notebases: index.notebases.filter((item) => item.id !== notebaseId),
    })
  }

  private async updateIndex(
    readFrogRoot: FileSystemDirectoryHandle,
    summary: LocalNotebaseSummary,
  ): Promise<void> {
    const index = await readJsonFile<IndexFile>(readFrogRoot, "index.json")
    const notebases = index?.notebases.filter((item) => item.id !== summary.id) ?? []
    notebases.push(summary)
    await writeJsonFile(readFrogRoot, "index.json", {
      version: LOCAL_NOTEBASE_DATA_VERSION,
      notebases,
    })
  }
}
