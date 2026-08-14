import type {
  LocalCard,
  LocalCardTemplate,
  LocalNotebase,
  LocalNotebaseColumn,
  LocalNotebaseRow,
  LocalNotebaseView,
  LocalRevlog,
} from "../types"
import Dexie, { type Table } from "dexie"

export const LOCAL_NOTEBASE_DB_NAME = "read-frog-local"
const DIRECTORY_HANDLE_KEY = "directory-handle"

const db = new Dexie(LOCAL_NOTEBASE_DB_NAME)

interface HandleRecord {
  key: string
  value: unknown
}

db.version(1).stores({
  meta: "key",
  notebases: "id",
  columns: "id, notebaseId",
  rows: "id, notebaseId",
  views: "id, notebaseId",
  templates: "id, notebaseId",
  cards: "id, notebaseId, notebaseRowId, templateId",
  revlogs: "id, notebaseId, cardId",
})

export interface LocalNotebaseDatabase extends Dexie {
  meta: Table<HandleRecord, string>
  notebases: Table<LocalNotebase, string>
  columns: Table<LocalNotebaseColumn, string>
  rows: Table<LocalNotebaseRow, string>
  views: Table<LocalNotebaseView, string>
  templates: Table<LocalCardTemplate, string>
  cards: Table<LocalCard, string>
  revlogs: Table<LocalRevlog, string>
}

export const localNotebaseDb = db as LocalNotebaseDatabase

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const record = await localNotebaseDb.meta.get(DIRECTORY_HANDLE_KEY)
  if (!record || !isFileSystemDirectoryHandle(record.value)) {
    return null
  }
  return record.value
}

export async function persistDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await localNotebaseDb.meta.put({ key: DIRECTORY_HANDLE_KEY, value: handle })
}

export async function clearStoredDirectoryHandle(): Promise<void> {
  await localNotebaseDb.meta.delete(DIRECTORY_HANDLE_KEY)
}

function isFileSystemDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
  return (
    !!value &&
    typeof value === "object" &&
    "getDirectoryHandle" in value &&
    "getFileHandle" in value
  )
}
