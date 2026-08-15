import { IconBook2, IconDatabase, IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base-ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/base-ui/empty"
import { toastManager } from "@/components/ui/base-ui/toast"
import { i18n } from "@/utils/i18n"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { useAsyncData } from "../lib"

export function NotebaseListPage() {
  const { data: summaries, reload } = useAsyncData(async () => {
    const repository = await getLocalNotebaseRepository()
    return repository.listNotebases()
  }, [])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) {
      return
    }
    setIsDeleting(true)
    try {
      const repository = await getLocalNotebaseRepository()
      await repository.deleteNotebase(deleteId)
      toastManager.add({ type: "success", title: i18n.t("notebase.list.deleted") })
      setDeleteId(null)
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: i18n.t("notebase.common.operationFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{i18n.t("notebase.list.title")}</h1>
          <p className="text-sm text-muted-foreground">{i18n.t("notebase.list.description")}</p>
        </div>
        <Button type="button" variant="outline" size="sm" render={<Link to="/storage" />}>
          <IconDatabase className="size-4" />
          {i18n.t("notebase.nav.storage")}
        </Button>
      </div>

      {summaries?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBook2 />
            </EmptyMedia>
            <EmptyTitle>{i18n.t("notebase.list.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{i18n.t("notebase.list.emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {summaries?.map((summary) => (
            <div
              key={summary.id}
              className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <Link
                to={`/notebases/${summary.id}`}
                className="flex min-w-0 flex-1 items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{summary.name}</span>
                    <Badge variant="secondary">{i18n.t("notebase.list.localBadge")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {i18n.t("notebase.list.updated")} {new Date(summary.updatedAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {i18n.t("notebase.list.open")} →
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={i18n.t("notebase.list.delete")}
                onClick={() => setDeleteId(summary.id)}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t("notebase.list.deleteTitle")}</DialogTitle>
            <DialogDescription>{i18n.t("notebase.list.deleteDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {i18n.t("notebase.list.delete")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteId(null)}
            >
              {i18n.t("notebase.common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
