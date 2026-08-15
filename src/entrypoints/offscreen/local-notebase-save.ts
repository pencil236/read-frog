import { createColumnConfig } from "@/utils/local-notebase/render"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { getStoredDirectoryLocation } from "@/utils/local-notebase/storage/directory"

export interface CreateLocalNotebaseFromRequestData {
  name: string
  columns: Array<{ name: string; type: string }>
  results: Array<Record<string, unknown>>
  templateName?: string
}

export interface AppendLocalNotebaseRowsData {
  notebaseId: string
  results: Array<Record<string, unknown>>
}

/**
 * Runs inside the offscreen document (an extension window context), where the
 * user-chosen FileSystemDirectoryHandle is usable. Service workers cannot use
 * File System Access API handles, so the background forwards saves here.
 */
export async function createLocalNotebaseFromRequest(
  data: CreateLocalNotebaseFromRequestData,
): Promise<{ notebaseId: string; location: string | null }> {
  const { name, columns, results, templateName } = data
  const repository = await getLocalNotebaseRepository()
  // Reuse an existing notebase with the same name (e.g. the built-in
  // Dictionary action) so repeated saves land in one default notebase.
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
}

export async function appendLocalNotebaseRows(
  data: AppendLocalNotebaseRowsData,
): Promise<{ created: number; location: string | null }> {
  const { notebaseId, results } = data
  const repository = await getLocalNotebaseRepository()
  const rows = await repository.createRows(
    notebaseId,
    results.map((cells) => ({ cells })),
  )
  return { created: rows.length, location: await getStoredDirectoryLocation() }
}
