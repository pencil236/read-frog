import { createColumnConfig } from "@/utils/local-notebase/render"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import {
  getStoredDirectoryHandle,
  getStoredDirectoryLocation,
} from "@/utils/local-notebase/storage/directory"
import { onMessage } from "@/utils/message"

/**
 * Routes local-notebase writes from content scripts through the extension
 * origin. A content script's IndexedDB belongs to the embedding page, so a
 * save performed directly from the selection toolbar would be invisible to
 * the extension's notebase page. Running the repository here keeps every
 * context on the same store (and the user-chosen directory handle).
 */
export function setupLocalNotebaseMessageHandlers() {
  onMessage("localNotebaseGetStorageStatus", async () => {
    const handle = await getStoredDirectoryHandle()
    return {
      folderChosen: handle !== null,
      location: await getStoredDirectoryLocation(),
    }
  })

  onMessage("localNotebaseCreate", async (message) => {
    const { name, columns, results, templateName } = message.data
    const repository = await getLocalNotebaseRepository()
    // Reuse an existing notebase with the same name (e.g. the built-in
    // Dictionary action) so repeated saves land in one default notebase
    // instead of creating a new one every time the binding is missing.
    const summaries = await repository.listNotebases()
    const existing = summaries.find((summary) => summary.name === name)
    if (existing) {
      await repository.createRows(
        existing.id,
        results.map((cells) => ({ cells })),
      )
      return { notebaseId: existing.id, location: await getStoredDirectoryLocation() }
    }
    const notebase = await repository.createNotebase({
      name,
      columns: columns.map((field) => ({
        name: field.name,
        config: createColumnConfig(field.type),
      })),
      initialRows: results.map((cells) => ({ cells })),
      createDefaultTemplate: true,
      templateName: templateName ?? name,
    })
    return { notebaseId: notebase.id, location: await getStoredDirectoryLocation() }
  })

  onMessage("localNotebaseAppendRows", async (message) => {
    const { notebaseId, results } = message.data
    const repository = await getLocalNotebaseRepository()
    const rows = await repository.createRows(
      notebaseId,
      results.map((cells) => ({ cells })),
    )
    return { created: rows.length, location: await getStoredDirectoryLocation() }
  })
}
