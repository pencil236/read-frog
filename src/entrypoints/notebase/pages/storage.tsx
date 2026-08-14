import { useCallback, useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/base-ui/alert"
import { Button } from "@/components/ui/base-ui/button"
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/components/ui/base-ui/field"
import { toastManager } from "@/components/ui/base-ui/toast"
import {
  clearStoredDirectoryHandle,
  getStoredDirectoryHandle,
  pickAndPersistDirectory,
  supportsDirectoryAccess,
} from "@/utils/local-notebase"
import { createDefaultLocalNotebaseStore } from "@/utils/local-notebase/repository"
import { localNotebaseSnapshotSchema } from "@/utils/local-notebase/types"

export function StoragePage() {
  const [handleName, setHandleName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const handle = await getStoredDirectoryHandle()
    setHandleName(handle?.name ?? null)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handlePickDirectory = async () => {
    setBusy(true)
    try {
      const handle = await pickAndPersistDirectory()
      setHandleName(handle.name)
      toastManager.add({ type: "success", title: "Directory selected" })
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      toastManager.add({
        type: "error",
        title: "Failed to select directory",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleClearDirectory = async () => {
    await clearStoredDirectoryHandle()
    setHandleName(null)
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
        title: "Export failed",
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
        throw new Error("Invalid export file")
      }
      const store = await createDefaultLocalNotebaseStore()
      for (const raw of notebases) {
        const snapshot = localNotebaseSnapshotSchema.parse(raw)
        await store.saveSnapshot(snapshot)
      }
      toastManager.add({ type: "success", title: `Imported ${notebases.length} notebases` })
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Import failed",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Storage</h1>
        <p className="text-sm text-muted-foreground">
          Choose where your local notebases live. All data stays on this device.
        </p>
      </div>

      <Field className="gap-3 rounded-xl border border-dashed bg-muted/10 p-4">
        <FieldTitle>Storage location</FieldTitle>
        <FieldDescription>
          Pick a folder on this computer. Read Frog reads and writes your notebases as JSON files
          inside <code className="rounded bg-muted px-1">read-frog/</code>.
        </FieldDescription>
        <FieldContent className="flex flex-wrap items-center gap-2">
          {handleName ? (
            <>
              <Alert className="w-full">
                <AlertTitle>Current folder</AlertTitle>
                <AlertDescription>{handleName}</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" size="sm" onClick={handleClearDirectory}>
                Remove folder
              </Button>
            </>
          ) : (
            <Alert className="w-full">
              <AlertTitle>No folder chosen yet</AlertTitle>
              <AlertDescription>
                {supportsDirectoryAccess()
                  ? "Notebases are currently stored in the extension's built-in storage. Choose a folder to take full control of your data."
                  : "This browser does not support direct folder access. Data is stored in the extension's built-in storage; use export/import below to move it."}
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
              {handleName ? "Change folder" : "Choose folder"}
            </Button>
          )}
        </FieldContent>
      </Field>

      <Field className="gap-3 rounded-xl border border-dashed bg-muted/10 p-4">
        <FieldTitle>Backup</FieldTitle>
        <FieldDescription>
          Export all notebases to a single JSON file, or import a previously exported file.
        </FieldDescription>
        <FieldContent className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleExport}>
            Export JSON
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex h-8 items-center rounded-md border border-input px-2.5 text-sm shadow-xs transition-colors hover:bg-muted">
              Import JSON
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
