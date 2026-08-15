import { toastManager } from "@/components/ui/base-ui/toast"
import {
  getLocalNotebaseStorageUrl,
  LOCAL_NOTEBASE_FOLDER_PERMISSION_DENIED,
  LOCAL_NOTEBASE_FOLDER_REQUIRED,
} from "@/utils/constants/local-notebase"
import { i18n } from "@/utils/i18n"
import { sendMessage } from "@/utils/message"

export type NotebaseStorageErrorCode = "folder-required" | "permission-denied"

/**
 * Maps the structured error codes thrown by the offscreen save path. The
 * codes survive messaging serialization inside the error message, so matching
 * on the message is reliable across background/offscreen hops.
 */
export function getNotebaseStorageErrorCode(error: unknown): NotebaseStorageErrorCode | null {
  if (!(error instanceof Error)) {
    return null
  }
  if (error.message.includes(LOCAL_NOTEBASE_FOLDER_REQUIRED)) {
    return "folder-required"
  }
  if (error.message.includes(LOCAL_NOTEBASE_FOLDER_PERMISSION_DENIED)) {
    return "permission-denied"
  }
  return null
}

/**
 * Shows a guided error toast for folder/permission failures and opens the
 * Storage page when the user clicks the action. Returns true when the error
 * was a known storage-folder failure (i.e. the caller should not also show a
 * generic error toast).
 */
export function showNotebaseStorageGuidanceToast(error: unknown): boolean {
  const code = getNotebaseStorageErrorCode(error)
  if (!code) {
    return false
  }
  const description =
    code === "permission-denied"
      ? i18n.t("action.saveToNotebasePermissionRequired")
      : i18n.t("action.saveToNotebaseFolderRequired")
  const toastId = toastManager.add({
    type: "error",
    title: i18n.t("action.saveToNotebaseFailed"),
    description,
    actionProps: {
      children: i18n.t("action.openStorageSettings"),
      onClick: () => {
        toastManager.close(toastId)
        void sendMessage("openPage", {
          url: getLocalNotebaseStorageUrl(),
          active: true,
        })
      },
    },
  })
  return true
}
