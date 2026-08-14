import { useCallback, useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/base-ui/alert"
import { Button } from "@/components/ui/base-ui/button"
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/components/ui/base-ui/field"
import { toastManager } from "@/components/ui/base-ui/toast"
import { i18n } from "@/utils/i18n"
import {
  clearStoredDirectoryHandle,
  ensureReadmeFile,
  getReadFrogRoot,
  getStoredDirectoryHandle,
  pickAndPersistDirectory,
  supportsDirectoryAccess,
} from "@/utils/local-notebase"
import { createDefaultLocalNotebaseStore } from "@/utils/local-notebase/repository"
import { localNotebaseSnapshotSchema } from "@/utils/local-notebase/types"

interface DirectoryContents {
  files: string[]
  notebaseFiles: string[]
}

async function readDirectoryContents(
  root: FileSystemDirectoryHandle,
): Promise<DirectoryContents | null> {
  try {
    const readFrogRoot = await getReadFrogRoot(root)
    const files: string[] = []
    const notebaseFiles: string[] = []
    for await (const entry of readFrogRoot.values()) {
      if (entry.kind === "file") {
        files.push(entry.name)
      } else if (entry.name === "notebases") {
        for await (const child of entry.values()) {
          if (child.kind === "file") {
            notebaseFiles.push(child.name)
          }
        }
      }
    }
    files.sort()
    notebaseFiles.sort()
    return { files, notebaseFiles }
  } catch {
    return null
  }
}

export function StoragePage() {
  const [handleName, setHandleName] = useState<string | null>(null)
  const [contents, setContents] = useState<DirectoryContents | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const handle = await getStoredDirectoryHandle()
    setHandleName(handle?.name ?? null)
    setContents(handle ? await readDirectoryContents(handle) : null)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handlePickDirectory = async () => {
    setBusy(true)
    try {
      const handle = await pickAndPersistDirectory()
      const readFrogRoot = await getReadFrogRoot(handle)
      await ensureReadmeFile(readFrogRoot)
      setHandleName(handle.name)
      setContents(await readDirectoryContents(handle))
      toastManager.add({
        type: "success",
        title: i18n.t("notebase.storage.directorySelected"),
      })
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      toastManager.add({
        type: "error",
        title: i18n.t("notebase.storage.selectDirectoryFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleClearDirectory = async () => {
    await clearStoredDirectoryHandle()
    setHandleName(null)
    setContents(null)
  }

  const handleExport = async () => {
    setBusy(true)
    try {
      const store = await createDefaultLocalNotebaseStore()
      const summaries = await store.listNotebaseSummaries()
      const snapshots = []
      for (const summary of summaries) {
        const snapshot = await store.loadSnapshot(summary.id)
        if (snapshot) {
          snapshots.push(snapshot)
        }
      }
      const blob = new Blob([JSON.stringify({ version: 1, notebases: snapshots }, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "read-frog-notebase.json"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toastManager.add({
        type: "error",
        title: i18n.t("notebase.storage.exportFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (file: File) => {
    setBusy(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as { notebases?: unknown[] }
      const notebases = parsed.notebases
      if (!Array.isArray(notebases)) {
        throw new Error(i18n.t("notebase.storage.invalidExportFile"))
      }
      const store = await createDefaultLocalNotebaseStore()
      for (const raw of notebases) {
        const snapshot = localNotebaseSnapshotSchema.parse(raw)
        await store.saveSnapshot(snapshot)
      }
      toastManager.add({
        type: "success",
        title: i18n.t("notebase.storage.imported", [notebases.length]),
      })
    } catch (error) {
      toastManager.add({
        type: "error",
        title: i18n.t("notebase.storage.importFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{i18n.t("notebase.storage.title")}</h1>
        <p className="text-sm text-muted-foreground">{i18n.t("notebase.storage.description")}</p>
      </div>

      <Field className="gap-3 rounded-xl border border-dashed bg-muted/10 p-4">
        <FieldTitle>{i18n.t("notebase.storage.location")}</FieldTitle>
        <FieldDescription>
          {i18n.t("notebase.storage.locationDescription")}{" "}
          <code className="rounded bg-muted px-1">read-frog/</code>
        </FieldDescription>
        <FieldContent className="flex flex-wrap items-center gap-2">
          {handleName ? (
            <>
              <Alert className="w-full">
                <AlertTitle>{i18n.t("notebase.storage.currentFolder")}</AlertTitle>
                <AlertDescription>{handleName}</AlertDescription>
              </Alert>
              {contents && (
                <div className="w-full space-y-1 rounded-lg border bg-card p-3 font-mono text-xs">
                  <p className="font-sans text-sm font-medium">
                    {i18n.t("notebase.storage.contentsTitle")}
                  </p>
                  <p>📁 {handleName}/read-frog/</p>
                  {contents.files.map((file) => (
                    <p key={file} className="pl-4">
                      {file}
                    </p>
                  ))}
                  {contents.notebaseFiles.length > 0 && (
                    <>
                      <p className="pl-4">notebases/</p>
                      {contents.notebaseFiles.slice(0, 20).map((file) => (
                        <p key={file} className="pl-8">
                          {file}
                        </p>
                      ))}
                      {contents.notebaseFiles.length > 20 && (
                        <p className="pl-8 text-muted-foreground">
                          … +{contents.notebaseFiles.length - 20}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              <p className="w-full text-xs text-muted-foreground">
                {i18n.t("notebase.storage.pathHint")}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleClearDirectory}>
                {i18n.t("notebase.storage.removeFolder")}
              </Button>
            </>
          ) : (
            <Alert className="w-full">
              <AlertTitle>{i18n.t("notebase.storage.noFolderTitle")}</AlertTitle>
              <AlertDescription>
                {supportsDirectoryAccess()
                  ? i18n.t("notebase.storage.noFolderDescription")
                  : i18n.t("notebase.storage.noFolderDescriptionFirefox")}
              </AlertDescription>
            </Alert>
          )}
          {supportsDirectoryAccess() && (
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={busy}
              onClick={handlePickDirectory}
            >
              {handleName
                ? i18n.t("notebase.storage.changeFolder")
                : i18n.t("notebase.storage.chooseFolder")}
            </Button>
          )}
        </FieldContent>
      </Field>

      <Field className="gap-3 rounded-xl border border-dashed bg-muted/10 p-4">
        <FieldTitle>{i18n.t("notebase.storage.backup")}</FieldTitle>
        <FieldDescription>{i18n.t("notebase.storage.backupDescription")}</FieldDescription>
        <FieldContent className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleExport}>
            {i18n.t("notebase.storage.exportJson")}
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex h-8 items-center rounded-md border border-input px-2.5 text-sm shadow-xs transition-colors hover:bg-muted">
              {i18n.t("notebase.storage.importJson")}
            </span>
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void handleImport(file)
                }
                event.target.value = ""
              }}
            />
          </label>
        </FieldContent>
      </Field>
    </div>
  )
}
