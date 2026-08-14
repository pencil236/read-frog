import type { FeatureProviderAnalytics } from "@/types/analytics"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { atom } from "jotai"

export type SaveToNotebaseAnalyticsSource = "note_suggestion"

export interface PendingLocalNotebaseSave {
  action: SelectionToolbarCustomAction
  results: Array<Record<string, unknown>>
  /**
   * Present when the action does not exist in config yet (save suggestion
   * flow). It is appended to config when the dialog is confirmed.
   */
  actionDraft?: SelectionToolbarCustomAction
}

export type SaveToNotebaseDialogState =
  | { open: false }
  | {
      open: true
      mode: "create_local"
      pendingSave: PendingLocalNotebaseSave
      analyticsSource?: SaveToNotebaseAnalyticsSource
      analyticsProvider?: FeatureProviderAnalytics
    }

export const saveToNotebaseDialogAtom = atom<SaveToNotebaseDialogState>({ open: false })

export const isSaveToNotebaseDialogOpenAtom = atom((get) => get(saveToNotebaseDialogAtom).open)
