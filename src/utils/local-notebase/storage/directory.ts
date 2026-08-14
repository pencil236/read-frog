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
