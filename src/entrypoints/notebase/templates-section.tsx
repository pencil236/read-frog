import { IconArrowLeft, IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { Link, useParams } from "react-router"
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
import { Input } from "@/components/ui/base-ui/input"
import { Textarea } from "@/components/ui/base-ui/textarea"
import { toastManager } from "@/components/ui/base-ui/toast"
import { renderPattern } from "@/utils/local-notebase/render"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { useNotebaseSnapshot } from "./lib"

type TemplateDialogState = { mode: "create" } | { mode: "edit"; templateId: string } | null

export function TemplatesSection() {
  const { id } = useParams<{ id: string }>()
  const { data: snapshot, reload } = useNotebaseSnapshot(id)
  const [dialog, setDialog] = useState<TemplateDialogState>(null)
  const [name, setName] = useState("")
  const [frontPattern, setFrontPattern] = useState("")
  const [backPattern, setBackPattern] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  if (!id) {
    return null
  }

  const columns = snapshot?.columns ?? []
  const rows = snapshot?.rows ?? []
  const templates = snapshot?.templates ?? []
  const previewRow = rows[0]?.cells ?? {}
  const cardCountByTemplate = new Map<string, number>()
  for (const card of snapshot?.cards ?? []) {
    cardCountByTemplate.set(card.templateId, (cardCountByTemplate.get(card.templateId) ?? 0) + 1)
  }

  const openCreate = () => {
    setName("")
    setFrontPattern("{{}}")
    setBackPattern("")
    setDialog({ mode: "create" })
  }

  const openEdit = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      return
    }
    if (template.config.type !== "basic") {
      return
    }
    setName(template.name)
    setFrontPattern(template.config.frontPattern)
    setBackPattern(template.config.backPattern)
    setDialog({ mode: "edit", templateId })
  }

  const saveTemplate = async () => {
    if (!dialog || !name.trim()) {
      return
    }
    setIsBusy(true)
    try {
      const repository = await getLocalNotebaseRepository()
      const config = {
        type: "basic" as const,
        frontPattern: frontPattern.trim() || "{{}}",
        backPattern,
      }
      if (dialog.mode === "create") {
        await repository.createTemplate(id, { name: name.trim(), config })
      } else {
        await repository.updateTemplate(id, dialog.templateId, {
          name: name.trim(),
          config,
        })
      }
      setDialog(null)
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to save template",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsBusy(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const repository = await getLocalNotebaseRepository()
      await repository.deleteTemplate(id, templateId)
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to delete template",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const generateCards = async (templateId?: string) => {
    try {
      const repository = await getLocalNotebaseRepository()
      const { created } = await repository.generateCards(id, templateId)
      toastManager.add({
        type: "success",
        title: created === 0 ? "No new cards to generate" : `Generated ${created} cards`,
      })
      reload()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to generate cards",
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" render={<Link to={`/notebases/${id}`} />}>
          <IconArrowLeft className="size-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold">Card templates</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void generateCards()}>
            <IconSparkles className="size-4" />
            Generate all
          </Button>
          <Button type="button" variant="brand" size="sm" onClick={openCreate}>
            <IconPlus className="size-4" />
            Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No templates yet. Create one to turn rows into flashcards.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            if (template.config.type !== "basic") {
              return null
            }
            return (
              <div key={template.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant="secondary">
                      {cardCountByTemplate.get(template.id) ?? 0} cards
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void generateCards(template.id)}
                    >
                      Generate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(template.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete template"
                      onClick={() => void deleteTemplate(template.id)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">Front</p>
                    <p className="break-words whitespace-pre-wrap">
                      {renderPattern(template.config.frontPattern, previewRow, columns) ||
                        template.config.frontPattern}
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">Back</p>
                    <p className="break-words whitespace-pre-wrap">
                      {renderPattern(template.config.backPattern, previewRow, columns) ||
                        template.config.backPattern}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Use {"{{ColumnName}}"} placeholders. They are replaced with each row's cell value.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Template name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Front pattern</p>
              <Textarea
                value={frontPattern}
                onChange={(event) => setFrontPattern(event.target.value)}
                placeholder={"{{Term}}"}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Back pattern</p>
              <Textarea
                value={backPattern}
                onChange={(event) => setBackPattern(event.target.value)}
                placeholder={"**Definition:** {{Definition}}"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="brand"
              disabled={isBusy || !name.trim()}
              onClick={() => void saveTemplate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
