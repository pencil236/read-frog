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
          <h1 className="text-xl font-semibold">Notebases</h1>
          <p className="text-sm text-muted-foreground">
            Vocabulary saved from dictionary lookups lives here, locally.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" render={<Link to="/storage" />}>
          <IconDatabase className="size-4" />
          Storage
        </Button>
      </div>

      {summaries?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBook2 />
            </EmptyMedia>
            <EmptyTitle>No notebases yet</EmptyTitle>
            <EmptyDescription>
              Run a dictionary Custom AI Action on any page, then press Save to Notebase — the first
              save creates a local notebase here.
            </EmptyDescription>
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
                  <Badge variant="secondary">local</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(summary.updatedAt).toLocaleString()}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">Open →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
