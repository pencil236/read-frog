import type {
  LocalNotebaseColumn,
  LocalNotebaseRow,
  LocalNotebaseViewType,
} from "@/utils/local-notebase/types"
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconEdit,
  IconPlus,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import { Checkbox } from "@/components/ui/base-ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
const FILTER_OPERATORS = ["contains", "equals", "not_equals", "is_empty", "is_not_empty"] as const
type FilterOperator = (typeof FILTER_OPERATORS)[number]

interface ViewFilter {
  notebaseColumnId: string
  operator: FilterOperator
  value: unknown
}

interface ViewSort {
  notebaseColumnId: string
  direction: "asc" | "desc"
}

function cellText(value: unknown): string {
  return formatCellValue(value)
}

function isCellEmpty(value: unknown): boolean {
  return value === null || value === undefined || cellText(value) === ""
}

function matchesFilter(
  cells: Record<string, unknown>,
  column: LocalNotebaseColumn | undefined,
  filter: ViewFilter,
): boolean {
  if (!column) {
    return true
  }
  const raw = cells[column.name]
  const text = cellText(raw)
  const expected = cellText(filter.value)

  switch (filter.operator) {
    case "is_empty":
      return isCellEmpty(raw)
    case "is_not_empty":
      return !isCellEmpty(raw)
    case "contains":
      return text.toLowerCase().includes(expected.toLowerCase())
    case "equals":
      return text === expected
    case "not_equals":
      return text !== expected
    default:
      return true
  }
}

function filterRows(
  rows: LocalNotebaseRow[],
  columns: LocalNotebaseColumn[],
  filters: ViewFilter[],
): LocalNotebaseRow[] {
  const columnById = new Map(columns.map((column) => [column.id, column]))
  return rows.filter((row) =>
    filters.every((filter) =>
      matchesFilter(row.cells, columnById.get(filter.notebaseColumnId), filter),
    ),
  )
}

function compareCellValues(left: unknown, right: unknown, column: LocalNotebaseColumn): number {
  if (column.config.type === "number") {
    const l = typeof left === "number" ? left : Number(left)
    const r = typeof right === "number" ? right : Number(right)
    return (
      (Number.isFinite(l) ? l : Number.NEGATIVE_INFINITY) -
      (Number.isFinite(r) ? r : Number.NEGATIVE_INFINITY)
    )
  }
  if (column.config.type === "boolean") {
    return Number(left === true) - Number(right === true)
  }
  return cellText(left).toLowerCase().localeCompare(cellText(right).toLowerCase())
}

function sortRows(
  rows: LocalNotebaseRow[],
  columns: LocalNotebaseColumn[],
  sorts: ViewSort[],
): LocalNotebaseRow[] {
  if (sorts.length === 0) {
    return rows
  }
  const columnById = new Map(columns.map((column) => [column.id, column]))
  const sorted = [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const column = columnById.get(sort.notebaseColumnId)
      if (!column) {
        continue
      }
      const comparison = compareCellValues(a.cells[column.name], b.cells[column.name], column)
      if (comparison !== 0) {
        return sort.direction === "asc" ? comparison : -comparison
      }
    }
    return a.position - b.position
  })
  return sorted
}

function uniqueViewName(views: Array<{ name: string }>): string {
  const names = new Set(views.map((view) => view.name))
  let index = views.length + 1
  let name = `View ${index}`
  while (names.has(name)) {
    index += 1
    name = `View ${index}`
  }
  return name
}

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
        value={value === null || value === undefined ? "" : cellText(value)}
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
        value={value === null || value === undefined ? "" : cellText(value).slice(0, 10)}
        onChange={(event) => onChange(event.target.value || null)}
      />
    )
  }
  return (
    <Input
      className="min-w-32"
      value={value === null || value === undefined ? "" : cellText(value)}
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
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewName, setViewName] = useState("")

  const columns = useMemo(() => snapshot?.columns ?? [], [snapshot])
  const rows = useMemo(() => snapshot?.rows ?? [], [snapshot])
  const primaryColumn = columns.find((column) => column.isPrimary) ?? columns[0]
  const views = useMemo(() => snapshot?.views ?? [], [snapshot])

  useEffect(() => {
    if (views.length > 0 && !views.some((view) => view.id === activeViewId)) {
      setActiveViewId(views[0]!.id)
    } else if (views.length === 0 && activeViewId !== null) {
      setActiveViewId(null)
    }
  }, [views, activeViewId])

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) ?? views[0] ?? null,
    [views, activeViewId],
  )
  const viewType = activeView?.type ?? "table"
  const viewFilters = useMemo(() => (activeView?.filters ?? []) as ViewFilter[], [activeView])
  const viewSorts = useMemo(() => (activeView?.sorts ?? []) as ViewSort[], [activeView])
  const displayRows = useMemo(
    () => sortRows(filterRows(rows, columns, viewFilters), columns, viewSorts),
    [rows, columns, viewFilters, viewSorts],
  )

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
    if (activeView) {
      void run(async () => {
        const repo = await getLocalNotebaseRepository()
        await repo.updateView(id, activeView.id, { type })
      })
      return
    }
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      const view = await repo.createView(id, { name: "View 1", type })
      setActiveViewId(view.id)
    })
  }

  const createView = () => {
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      const view = await repo.createView(id, { name: uniqueViewName(views), type: "table" })
      setActiveViewId(view.id)
    })
  }

  const openViewSettings = () => {
    setViewName(activeView?.name ?? "View")
    setViewDialogOpen(true)
  }

  const saveViewName = () => {
    if (!activeView || !viewName.trim()) {
      return
    }
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      await repo.updateView(id, activeView.id, { name: viewName.trim() })
    })
    setViewDialogOpen(false)
  }

  const deleteActiveView = () => {
    if (!activeView || views.length <= 1) {
      return
    }
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      await repo.deleteView(id, activeView.id)
    })
    setViewDialogOpen(false)
  }

  const updateActiveViewFilters = (filters: ViewFilter[]) => {
    if (!activeView) {
      return
    }
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      await repo.updateView(id, activeView.id, { filters })
    })
  }

  const updateActiveViewSorts = (sorts: ViewSort[]) => {
    if (!activeView) {
      return
    }
    void run(async () => {
      const repo = await getLocalNotebaseRepository()
      await repo.updateView(id, activeView.id, { sorts })
    })
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
          {displayRows.map((row, rowIndex) => (
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
                    disabled={rowIndex === 0}
                    onClick={() =>
                      void run(async () => {
                        const repo = await getLocalNotebaseRepository()
                        const ids = swapIds(displayRows, rowIndex - 1, rowIndex)
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
                    disabled={rowIndex === displayRows.length - 1}
                    onClick={() =>
                      void run(async () => {
                        const repo = await getLocalNotebaseRepository()
                        const ids = swapIds(displayRows, rowIndex, rowIndex + 1)
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
    const groups = new Map<string, typeof displayRows>()
    for (const row of displayRows) {
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
      {displayRows.map((row) => (
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

      <div className="flex flex-wrap items-center gap-2">
        <Select<string>
          value={activeView?.id ?? ""}
          items={views.map((view) => ({ value: view.id, label: view.name }))}
          onValueChange={(value) => {
            if (typeof value === "string" && value) {
              setActiveViewId(value)
            }
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="No views" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {views.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {view.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={createView}>
          <IconPlus className="size-4" />
          New view
        </Button>
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
          disabled={!activeView}
          onClick={openViewSettings}
        >
          <IconSettings className="size-4" />
          Settings
        </Button>
        {activeView && (
          <span className="text-xs text-muted-foreground">
            {displayRows.length}/{rows.length} rows
          </span>
        )}
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
        open={viewDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setViewDialogOpen(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View settings</DialogTitle>
            <DialogDescription>
              Filters and sorts apply to every display mode of this view.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Name</p>
                <Input value={viewName} onChange={(event) => setViewName(event.target.value)} />
              </div>
              <Button type="button" variant="brand" onClick={saveViewName}>
                Rename
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Filters</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={columns.length === 0}
                  onClick={() =>
                    updateActiveViewFilters([
                      ...viewFilters,
                      {
                        notebaseColumnId: columns[0]?.id ?? "",
                        operator: "contains",
                        value: "",
                      },
                    ])
                  }
                >
                  <IconPlus className="size-4" />
                  Add filter
                </Button>
              </div>
              {viewFilters.length === 0 && (
                <p className="text-xs text-muted-foreground">No filters.</p>
              )}
              {viewFilters.map((filter, index) => (
                // oxlint-disable-next-line react/no-array-index-key -- filters have no stable id in the persisted model
                <div key={index} className="flex items-center gap-2">
                  <Select<string>
                    value={filter.notebaseColumnId}
                    items={columns.map((column) => ({ value: column.id, label: column.name }))}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        updateActiveViewFilters(
                          viewFilters.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, notebaseColumnId: value } : item,
                          ),
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select<FilterOperator>
                    value={filter.operator}
                    items={FILTER_OPERATORS.map((operator) => ({
                      value: operator,
                      label: operator,
                    }))}
                    onValueChange={(value) => {
                      if (value) {
                        updateActiveViewFilters(
                          viewFilters.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, operator: value } : item,
                          ),
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {FILTER_OPERATORS.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {filter.operator !== "is_empty" && filter.operator !== "is_not_empty" && (
                    <Input
                      className="w-36"
                      value={formatCellValue(filter.value ?? "")}
                      onChange={(event) =>
                        updateActiveViewFilters(
                          viewFilters.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, value: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove filter"
                    onClick={() =>
                      updateActiveViewFilters(
                        viewFilters.filter((_item, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Sorts</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={columns.length === 0}
                  onClick={() =>
                    updateActiveViewSorts([
                      ...viewSorts,
                      { notebaseColumnId: columns[0]?.id ?? "", direction: "asc" },
                    ])
                  }
                >
                  <IconPlus className="size-4" />
                  Add sort
                </Button>
              </div>
              {viewSorts.length === 0 && <p className="text-xs text-muted-foreground">No sorts.</p>}
              {viewSorts.map((sort, index) => (
                // oxlint-disable-next-line react/no-array-index-key -- sorts have no stable id in the persisted model
                <div key={index} className="flex items-center gap-2">
                  <Select<string>
                    value={sort.notebaseColumnId}
                    items={columns.map((column) => ({ value: column.id, label: column.name }))}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        updateActiveViewSorts(
                          viewSorts.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, notebaseColumnId: value } : item,
                          ),
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select<"asc" | "desc">
                    value={sort.direction}
                    items={[
                      { value: "asc", label: "Ascending" },
                      { value: "desc", label: "Descending" },
                    ]}
                    onValueChange={(value) => {
                      if (value) {
                        updateActiveViewSorts(
                          viewSorts.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, direction: value } : item,
                          ),
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove sort"
                    onClick={() =>
                      updateActiveViewSorts(
                        viewSorts.filter((_item, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={views.length <= 1}
              onClick={deleteActiveView}
            >
              <IconTrash className="size-4" />
              Delete view
            </Button>
            <Button type="button" variant="brand" onClick={() => setViewDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
