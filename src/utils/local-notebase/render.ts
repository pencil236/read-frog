import type { BasicCardTemplateConfig, NotebaseColumnConfig } from "@read-frog/definitions"
import type { LocalNotebaseColumn } from "./types"

export function renderPattern(
  pattern: string,
  cells: Record<string, unknown>,
  columns: Pick<LocalNotebaseColumn, "name">[],
): string {
  const columnNames = new Map(
    columns.map((column) => [column.name.trim().toLowerCase(), column.name]),
  )

  return pattern.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawToken: string) => {
    const key = rawToken.trim().toLowerCase()
    const columnName = columnNames.get(key)
    if (!columnName) {
      return match
    }
    const value = cells[columnName]
    if (value === null || value === undefined) {
      return ""
    }
    if (typeof value === "object") {
      return JSON.stringify(value)
    }
    switch (typeof value) {
      case "string":
        return value
      case "number":
      case "boolean":
      case "bigint":
        return String(value)
      default:
        return ""
    }
  })
}

export function createDefaultDictionaryTemplate(
  columns: LocalNotebaseColumn[],
  name = "Dictionary",
): { name: string; config: BasicCardTemplateConfig } {
  const primary = columns.find((column) => column.isPrimary) ?? columns[0]
  const remaining = columns.filter((column) => column.id !== primary?.id)

  const frontPattern = primary ? `{{${primary.name}}}` : "{{}}"
  const backPattern =
    remaining.map((column) => `**${column.name}:** {{${column.name}}}`).join("\n\n") || frontPattern

  return {
    name,
    config: {
      type: "basic",
      frontPattern,
      backPattern,
    },
  }
}

export function createColumnConfig(type: string): NotebaseColumnConfig {
  switch (type) {
    case "number":
      return { type: "number", decimal: 0, format: "number" }
    case "boolean":
      return { type: "boolean" }
    case "date":
      return { type: "date" }
    case "select":
      return { type: "select", options: [] }
    default:
      return { type: "string" }
  }
}
