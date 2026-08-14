import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { Button } from "@/components/ui/base-ui/button"
import { i18n } from "@/utils/i18n"
import { useSaveToNotebase } from "./use-save-to-notebase"

export function SaveToNotebaseButton({
  action,
  isRunning,
  result,
}: {
  action: SelectionToolbarCustomAction
  isRunning: boolean
  result: Record<string, unknown> | null
}) {
  const { save, isSaving } = useSaveToNotebase()

  const handleClick = () => {
    if (!result) {
      return
    }

    void save({ action, results: [result] })
  }

  return (
    <Button
      type="button"
      variant="brand"
      size="sm"
      disabled={isRunning || !result || isSaving}
      onClick={handleClick}
    >
      {isSaving ? i18n.t("action.saveToNotebaseSaving") : i18n.t("action.saveToNotebase")}
    </Button>
  )
}
