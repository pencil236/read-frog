import type { SaveToNotebaseAnalyticsSource } from "./save-to-notebase-dialog-atom"
import type { FeatureProviderAnalytics } from "@/types/analytics"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { useRef, useState } from "react"
import { toastManager } from "@/components/ui/base-ui/toast"
import { getLocalNotebaseDetailUrl } from "@/utils/constants/local-notebase"
import { i18n } from "@/utils/i18n"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { sendMessage } from "@/utils/message"
import { saveToNotebaseDialogAtom } from "./save-to-notebase-dialog-atom"

export type SaveToNotebaseOutcome = "saved" | "dialog_opened" | "failed"

export interface SaveToNotebaseRequest {
  action: SelectionToolbarCustomAction
  /** One record per note, keyed by output-field name. */
  results: Array<Record<string, unknown>>
  /**
   * When set, the action does not exist in config yet: the save flow opens
   * the create dialog carrying this draft.
   */
  actionDraft?: SelectionToolbarCustomAction
  analyticsSource?: SaveToNotebaseAnalyticsSource
  analyticsProvider?: FeatureProviderAnalytics
}

/**
 * Local save-to-notebase orchestration. First saves create a local notebase
 * through the dialog; later saves append rows to the action's local notebase.
 */
export function useSaveToNotebase() {
  const setSaveToNotebaseDialog = useSetAtom(saveToNotebaseDialogAtom)
  const [isPreparingSave, setIsPreparingSave] = useState(false)
  const savingNotebaseNameRef = useRef<string | undefined>(undefined)

  const handleSaveSuccess = (notebaseId: string, name: string) => {
    const toastId = toastManager.add({
      type: "success",
      title: i18n.t("action.saveToNotebaseSuccess"),
      description: name,
      actionProps: {
        children: i18n.t("action.openNotebase"),
        onClick: () => {
          toastManager.close(toastId)
          void sendMessage("openPage", {
            url: getLocalNotebaseDetailUrl(notebaseId),
            active: true,
          })
        },
      },
    })
  }

  const handleSaveError = (error: unknown) => {
    toastManager.add({
      type: "error",
      title: i18n.t("action.saveToNotebaseFailed"),
      description: error instanceof Error ? error.message : undefined,
    })
  }

  const saveRowsMutation = useMutation({
    meta: {
      suppressToast: true,
    },
    mutationFn: async ({
      notebaseId,
      results,
    }: {
      notebaseId: string
      results: Array<Record<string, unknown>>
    }) => {
      const repository = await getLocalNotebaseRepository()
      return repository.createRows(
        notebaseId,
        results.map((cells) => ({ cells })),
      )
    },
    onSuccess: (_rows, variables) => {
      handleSaveSuccess(variables.notebaseId, savingNotebaseNameRef.current ?? "")
    },
    onError: handleSaveError,
  })

  const save = async (request: SaveToNotebaseRequest): Promise<SaveToNotebaseOutcome> => {
    const { action, results, actionDraft, analyticsSource, analyticsProvider } = request
    if (results.length === 0) {
      return "failed"
    }

    if (!action.localNotebaseId) {
      setSaveToNotebaseDialog({
        open: true,
        mode: "create_local",
        pendingSave: {
          action,
          results,
          ...(actionDraft ? { actionDraft } : {}),
        },
        ...(analyticsSource ? { analyticsSource } : {}),
        ...(analyticsProvider ? { analyticsProvider } : {}),
      })
      return "dialog_opened"
    }

    setIsPreparingSave(true)
    savingNotebaseNameRef.current = action.name.trim() || action.name
    try {
      await saveRowsMutation.mutateAsync({
        notebaseId: action.localNotebaseId,
        results,
      })
      return "saved"
    } catch {
      return "failed"
    } finally {
      setIsPreparingSave(false)
    }
  }

  return {
    save,
    isSaving: isPreparingSave || saveRowsMutation.isPending,
    isAuthenticated: true,
    hasCurrentAccount: true,
  }
}
