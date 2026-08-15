import { useMutation } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { useState } from "react"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base-ui/dialog"
import { toastManager } from "@/components/ui/base-ui/toast"
import { shadowWrapper } from "@/entrypoints/selection.content"
import { SELECTION_CONTENT_OVERLAY_LAYERS } from "@/entrypoints/selection.content/overlay-layers"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { getLocalNotebaseDetailUrl } from "@/utils/constants/local-notebase"
import {
  findSelectionToolbarAction,
  getSelectionToolbarActions,
  replaceSelectionToolbarAction,
} from "@/utils/custom-actions"
import { i18n } from "@/utils/i18n"
import { logger } from "@/utils/logger"
import { sendMessage } from "@/utils/message"
import { getUniqueName } from "@/utils/name"
import { trackNoteSuggestionEvent } from "@/utils/note-suggestion/analytics"
import { saveToNotebaseDialogAtom } from "./save-to-notebase-dialog-atom"

export function SaveToNotebaseDialogHost() {
  const [dialogState, setDialogState] = useAtom(saveToNotebaseDialogAtom)
  const [selectionToolbarConfig, setSelectionToolbarConfig] = useAtom(
    configFieldsAtomMap.selectionToolbar,
  )
  const [isCreating, setIsCreating] = useState(false)
  const pendingSave =
    dialogState.open && dialogState.mode === "create_local" ? dialogState.pendingSave : null
  const analyticsSource = dialogState.open ? dialogState.analyticsSource : undefined
  const analyticsProvider = dialogState.open ? dialogState.analyticsProvider : undefined

  const closeDialog = () => {
    setDialogState({ open: false })
  }

  const recordSuggestionAcceptedIfNeeded = (actionName?: string) => {
    if (analyticsSource !== "note_suggestion") {
      return
    }

    trackNoteSuggestionEvent("suggestion_accepted", {
      actionName,
      provider: analyticsProvider,
    })
  }

  const buildCustomActionsWithDraft = (
    draft: ReturnType<typeof getSelectionToolbarActions>[number],
  ) => {
    const existingNames = new Set(
      getSelectionToolbarActions(selectionToolbarConfig).map((item) => item.name),
    )
    const named = existingNames.has(draft.name)
      ? { ...draft, name: getUniqueName(draft.name, existingNames) }
      : draft
    return [...selectionToolbarConfig.customActions, named]
  }

  const createAndSaveMutation = useMutation({
    meta: {
      suppressToast: true,
    },
    mutationFn: async ({
      action,
      results,
    }: {
      action: ReturnType<typeof getSelectionToolbarActions>[number]
      results: Array<Record<string, unknown>>
    }) => {
      const { notebaseId, location } = await sendMessage("localNotebaseCreate", {
        name: action.name.trim() || action.name,
        columns: action.outputSchema.map((field) => ({ name: field.name, type: field.type })),
        results,
        templateName: action.name.trim() || action.name,
      })
      return { notebaseId, location, action }
    },
    onSuccess: async ({ notebaseId, location, action }) => {
      const draft = pendingSave?.actionDraft
      const existingAction = findSelectionToolbarAction(selectionToolbarConfig, action.id)
      const nextAction = {
        ...(draft ?? existingAction ?? action),
        localNotebaseId: notebaseId,
      }
      const nextSelectionToolbar =
        draft && !existingAction
          ? {
              ...selectionToolbarConfig,
              customActions: buildCustomActionsWithDraft(nextAction),
            }
          : existingAction
            ? replaceSelectionToolbarAction(selectionToolbarConfig, nextAction)
            : selectionToolbarConfig
      await setSelectionToolbarConfig(nextSelectionToolbar)

      closeDialog()
      toastManager.add({
        type: "success",
        title: i18n.t("action.saveToNotebaseSuccess"),
        description: location ? `${action.name} · ${location}` : action.name,
      })
      recordSuggestionAcceptedIfNeeded(action.name)

      try {
        await sendMessage("openPage", {
          url: getLocalNotebaseDetailUrl(notebaseId),
          active: true,
        })
      } catch (error) {
        logger.warn("[SaveToNotebaseDialogHost] Failed to open local notebase page", error)
      }
    },
    onError: (error: unknown) => {
      toastManager.add({
        type: "error",
        title: i18n.t("action.saveToNotebaseFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  const handleCreateAndSave = () => {
    if (!pendingSave) {
      return
    }

    setIsCreating(true)
    createAndSaveMutation.mutate(
      {
        action: pendingSave.action,
        results: pendingSave.results,
      },
      {
        onSettled: () => setIsCreating(false),
      },
    )
  }

  return (
    <Dialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent
        container={shadowWrapper ?? document.body}
        className={`${SELECTION_CONTENT_OVERLAY_LAYERS.popoverOverlay} sm:max-w-lg`}
        forceRenderOverlay
        overlayClassName={SELECTION_CONTENT_OVERLAY_LAYERS.popoverOverlay}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{i18n.t("action.saveToNotebaseCreateTitle")}</DialogTitle>
          <DialogDescription>{i18n.t("action.saveToNotebaseCreateDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="brand" disabled={isCreating} onClick={handleCreateAndSave}>
            {isCreating
              ? i18n.t("action.saveToNotebaseSaving")
              : i18n.t("action.saveToNotebaseCreateAndSaveShort")}
          </Button>
          <Button type="button" variant="outline" disabled={isCreating} onClick={closeDialog}>
            {i18n.t("action.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
