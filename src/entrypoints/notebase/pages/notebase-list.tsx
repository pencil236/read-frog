import { IconBook2, IconDatabase } from "@tabler/icons-react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/base-ui/badge"
import { Button } from "@/components/ui/base-ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/base-ui/empty"
import { i18n } from "@/utils/i18n"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { useAsyncData } from "../lib"

export function NotebaseListPage() {
  const { data: summaries } = useAsyncData(async () => {
    const repository = await getLocalNotebaseRepository()
    return repository.listNotebases()
  }, [])

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
            <Link
              key={summary.id}
              to={`/notebases/${summary.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
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
          ))}
        </div>
      )}
    </div>
  )
}
