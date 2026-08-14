import type { LocalNotebaseColumn, LocalNotebaseViewType } from "@/utils/local-notebase/types"
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { useState } from "react"
import { Link, useParams } from "react-router"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import { Checkbox } from "@/components/ui/base-ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base-ui/dialog"
import { Input } from "@/components/ui/base-ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base-ui/select"
import { toastManager } from "@/components/ui/base-ui/toast"
import { createColumnConfig } from "@/utils/local-notebase/render"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { formatCellValue, useNotebaseSnapshot } from "../lib"

const COLUMN_TYPES = ["string", "number", "boolean", "date", "select"] as const

function CellEditor({
  column,
  value,
  onChange,
}: {
  column: LocalNotebaseColumn
  value: unknown
  onChange: (value: unknown) => void
}) {
  const config = column.config
  if (config.type === "boolean") {
    return <Checkbox checked={Boolean(value)} onCheckedChange={onChange} />
  }
  if (config.type === "number") {
    return (
      <Input
        type="number"
        className="w-32"
        value={value === null || value === undefined ? "" : formatCellValue(value)}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
      />
    )
  }
  if (config.type === "date") {
    return (
      <Input
        type="date"
        className="w-36"
        value={value === null || value === undefined ? "" : formatCellValue(value).slice(0, 10)}
        onChange={(event) => onChange(event.target.value || null)}
      />
    )
  }
  return (
    <Input
      className="min-w-32"
      value={value === null || value === undefined ? "" : formatCellValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function NotebaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: snapshot, reload } = useNotebaseSnapshot(id)
  const [columnDialog, setColumnDialog] = useState<{
    mode: "create" | "edit"
    columnId?: string
  } | null>(null)
  const [columnName, setColumnName] = useState("")
  const [columnType, setColumnType] = useState<(typeof COLUMN_TYPES)[number]>("string")

  const columns = snapshot?.columns ?? []
  const rows = snapshot?.rows ?? []
  const primaryColumn = columns.find((column) => column.isPrimary) ?? columns[0]

  const viewType = snapshot?.views[0]?.type ?? "table"

  if (!id) {
    return null
  }

  const run = async (action: () => Promise<unknown>, successMessage?: string) => {
    try {
      await action()
      if (successMessage) {
        toastManager.add({ type: "success", title: successMessage })
      }
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Operation failed",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const changeViewType = (type: LocalNotebaseViewType) => {
    if (!snapshot) {
      return
    }
    const existing = snapshot.views[0]
    if (existing) {
      void run(async () => {
        const repo = await getLocalNotebaseRepository()
        await repo.updateView(id, existing.id, { type })
      })
    } else {
      void run(async () => {
        const repo = await getLocalNotebaseRepository()
        await repo.createView(id, { name: "View", type })
      })
    }
  }

  const openCreateColumn = () => {
    setColumnName("")
    setColumnType("string")
    setColumnDialog({ mode: "create" })
  }

  const openEditColumn = (column: LocalNotebaseColumn) => {
    setColumnName(column.name)
    setColumnType(column.config.type)
    setColumnDialog({ mode: "edit", columnId: column.id })
  }

  const saveColumn = () => {
    if (!columnDialog) {
      return
    }
    const name = columnName.trim()
    if (!name) {
      return
    }
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      if (columnDialog.mode === "create") {
        await repo.createColumn(id, { name, config: createColumnConfig(columnType) })
      } else if (columnDialog.columnId) {
        await repo.updateColumn(id, columnDialog.columnId, {
          name,
          config: createColumnConfig(columnType),
        })
      }
    })
    setColumnDialog(null)
  }

  const renderTable = () => (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {columns.map((column) => (
              <th
                key={column.id}
                className="px-3 py-2 text-left font-medium"
                style={column.width ? { width: column.width } : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span className="truncate">{column.name}</span>
                  {column.isPrimary && <Badge variant="outline">primary</Badge>}
                  <div className="ml-auto flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit column"
                      onClick={() => openEditColumn(column)}
                    >
                      <IconEdit className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move column left"
                      disabled={column.position === 0}
                      onClick={() =>
                        void run(async () => {
                          const repo = await getLocalNotebaseRepository()
                          const ids = swapIds(columns, column.position - 1, column.position)
                          await repo.reorderColumns(id, ids)
                        })
                      }
                    >
                      <IconArrowLeft className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move column right"
                      disabled={column.position === columns.length - 1}
                      onClick={() =>
                        void run(async () => {
                          const repo = await getLocalNotebaseRepository()
                          const ids = swapIds(columns, column.position, column.position + 1)
                          await repo.reorderColumns(id, ids)
                        })
                      }
                    >
                      <IconArrowRight className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete column"
                      disabled={column.isPrimary}
                      onClick={() =>
                        void run(async () => {
                          const repo = await getLocalNotebaseRepository()
                          await repo.deleteColumn(id, column.id)
                        })
                      }
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </th>
            ))}
            <th className="w-24 px-3 py-2 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0">
              {columns.map((column) => (
                <td key={column.id} className="px-3 py-1.5">
                  <CellEditor
                    column={column}
                    value={row.cells[column.name]}
                    onChange={(value) =>
                      void run(async () => {
                        const repo = await getLocalNotebaseRepository()
                        await repo.updateRow(id, row.id, { [column.name]: value })
                      })
                    }
                  />
                </td>
              ))}
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move row up"
                    disabled={row.position === 0}
                    onClick={() =>
                      void run(async () => {
                        const repo = await getLocalNotebaseRepository()
                        const ids = swapIds(rows, row.position - 1, row.position)
                        await repo.reorderRows(id, ids)
                      })
                    }
                  >
                    <IconArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move row down"
                    disabled={row.position === rows.length - 1}
                    onClick={() =>
                      void run(async () => {
                        const repo = await getLocalNotebaseRepository()
                        const ids = swapIds(rows, row.position, row.position + 1)
                        await repo.reorderRows(id, ids)
                      })
                    }
                  >
                    <IconArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete row"
                    onClick={() =>
                      void run(async () => {
                        const repo = await getLocalNotebaseRepository()
                        await repo.deleteRow(id, row.id)
                      })
                    }
                  >
                    <IconTrash className="size-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderKanban = () => {
    const groups = new Map<string, typeof rows>()
    for (const row of rows) {
      const key = primaryColumn
        ? formatCellValue(row.cells[primaryColumn.name]) || "Empty"
        : "Empty"
      groups.set(key, [...(groups.get(key) ?? []), row])
    }
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...groups.entries()].map(([key, groupRows]) => (
          <div key={key} className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-2 text-sm font-medium">{key}</p>
            <div className="space-y-2">
              {groupRows.map((row) => (
                <div key={row.id} className="rounded-md border bg-card p-3 text-sm">
                  {columns.map((column) => (
                    <p key={column.id} className="truncate">
                      <span className="text-xs text-muted-foreground">{column.name}: </span>
                      {formatCellValue(row.cells[column.name])}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderGallery = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border bg-card p-4">
          <p className="mb-2 font-medium">
            {primaryColumn ? formatCellValue(row.cells[primaryColumn.name]) || "—" : "—"}
          </p>
          {columns
            .filter((column) => column.id !== primaryColumn?.id)
            .map((column) => (
              <p key={column.id} className="truncate text-sm">
                <span className="text-xs text-muted-foreground">{column.name}: </span>
                {formatCellValue(row.cells[column.name])}
              </p>
            ))}
        </div>
      ))}
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" render={<Link to="/" />}>
          <IconArrowLeft className="size-4" />
          Notebases
        </Button>
        <h1 className="text-xl font-semibold">{snapshot?.notebase.name ?? "Notebase"}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select<LocalNotebaseViewType>
            value={viewType}
            items={[
              { value: "table", label: "Table" },
              { value: "kanban", label: "Kanban" },
              { value: "gallery", label: "Gallery" },
            ]}
            onValueChange={(value) => {
              if (value) {
                changeViewType(value)
              }
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue>{viewType}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link to={`/notebases/${id}/templates`} />}
          >
            Templates
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            render={<Link to={`/notebases/${id}/review`} />}
          >
            Review
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openCreateColumn}>
            <IconPlus className="size-4" />
            Column
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              void run(async () => {
                const repo = await getLocalNotebaseRepository()
                await repo.createRows(id, [{ cells: {} }])
              })
            }
          >
            <IconPlus className="size-4" />
            Row
          </Button>
        </div>
      </div>

      {viewType === "table" && renderTable()}
      {viewType === "kanban" && renderKanban()}
      {viewType === "gallery" && renderGallery()}

      {columns.length === 0 && (
        <p className="text-sm text-muted-foreground">
          This notebase has no columns yet. Add one to start entering notes.
        </p>
      )}

      <Dialog
        open={columnDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setColumnDialog(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {columnDialog?.mode === "edit" ? "Edit column" : "Add column"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Column name"
              value={columnName}
              onChange={(event) => setColumnName(event.target.value)}
            />
            <Select<(typeof COLUMN_TYPES)[number]>
              value={columnType}
              items={COLUMN_TYPES.map((type) => ({ value: type, label: type }))}
              onValueChange={(value) => {
                if (value) {
                  setColumnType(value)
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {COLUMN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="brand"
              disabled={!columnName.trim()}
              onClick={saveColumn}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function swapIds(items: Array<{ id: string }>, fromIndex: number, toIndex: number): string[] {
  const ids = items.map((item) => item.id)
  const [moved] = ids.splice(fromIndex, 1)
  if (moved === undefined) {
    return ids
  }
  ids.splice(toIndex, 0, moved)
  return ids
}
