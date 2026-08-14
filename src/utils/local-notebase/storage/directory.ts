import {
  clearStoredDirectoryHandle,
  getStoredDirectoryHandle,
  persistDirectoryHandle,
} from "./handle-store"

export function supportsDirectoryAccess(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window
}

export async function pickAndPersistDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!supportsDirectoryAccess()) {
    throw new Error("File System Access API is not supported in this browser")
  }
  const handle = await pickDirectory()
  await persistDirectoryHandle(handle)
  return handle
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  const picker = (
    window as unknown as {
      showDirectoryPicker: (options?: {
        mode?: "read" | "readwrite"
      }) => Promise<FileSystemDirectoryHandle>
    }
  ).showDirectoryPicker
  return picker({ mode: "readwrite" })
}

export { clearStoredDirectoryHandle, getStoredDirectoryHandle }

/**
 * Human-readable location label for the directory-backed store, e.g.
 * "MyFolder/read-frog/". Returns null when no folder has been chosen.
 */
export async function getStoredDirectoryLocation(): Promise<string | null> {
  const handle = await getStoredDirectoryHandle()
  return handle ? `${handle.name}/read-frog/` : null
}

export async function getReadFrogRoot(
  root: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  return root.getDirectoryHandle("read-frog", { create: true })
}

export async function getNotebasesDir(
  root: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  const readFrogRoot = await getReadFrogRoot(root)
  return readFrogRoot.getDirectoryHandle("notebases", { create: true })
}

export const README_FILENAME = "README.txt"

const README_CONTENT = `Read Frog 本地笔记库 / Read Frog local notebase data

这里保存的是 Read Frog 扩展的本地生词与笔记数据。
This folder stores Read Frog's local notebase data.

- index.json           笔记库索引 / notebase index
- notebases/<id>.json  每个笔记库的完整快照（词条、卡片、复习记录）
                       / full snapshot of each notebase (rows, cards, review history)
- README.txt           本说明文件 / this file
`

/**
 * Writes a marker README into the read-frog/ folder so the data directory is
 * easy to recognize in the file manager. Failures are intentionally ignored:
 * the README is a convenience, never required for the data to work.
 */
export async function ensureReadmeFile(readFrogRoot: FileSystemDirectoryHandle): Promise<void> {
  try {
    const fileHandle = await readFrogRoot.getFileHandle(README_FILENAME, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(README_CONTENT)
    await writable.close()
  } catch {
    // Ignore: the README is a convenience marker only.
  }
}

export async function readJsonFile<T>(
  dir: FileSystemDirectoryHandle,
  name: string,
): Promise<T | null> {
  try {
    const fileHandle = await dir.getFileHandle(name)
    const file = await fileHandle.getFile()
    return JSON.parse(await file.text()) as T
  } catch {
    return null
  }
}

export async function writeJsonFile(
  dir: FileSystemDirectoryHandle,
  name: string,
  value: unknown,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(name, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(value, null, 2))
  await writable.close()
}

export async function removeFile(dir: FileSystemDirectoryHandle, name: string): Promise<void> {
  try {
    await dir.removeEntry(name)
  } catch {
    // Ignore missing files.
  }
}
