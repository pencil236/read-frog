import { browser } from "#imports"

/** The local Notebase page lives at its own extension page, like the translation hub. */
export const LOCAL_NOTEBASE_PAGE_PATH = "/notebase.html"

export function getLocalNotebaseDetailUrl(notebaseId?: string): string {
  const pageUrl = browser.runtime.getURL(LOCAL_NOTEBASE_PAGE_PATH)
  return notebaseId ? `${pageUrl}#/notebases/${encodeURIComponent(notebaseId)}` : pageUrl
}

export function getLocalNotebaseStorageUrl(): string {
  return `${browser.runtime.getURL(LOCAL_NOTEBASE_PAGE_PATH)}#/storage`
}

/**
 * Error codes thrown by the offscreen save path when the user-chosen folder
 * is missing or no longer writable. The message survives messaging
 * serialization as-is, so content scripts can match on these codes.
 */
export const LOCAL_NOTEBASE_FOLDER_REQUIRED = "NOTEBASE_FOLDER_REQUIRED"
export const LOCAL_NOTEBASE_FOLDER_PERMISSION_DENIED = "NOTEBASE_FOLDER_PERMISSION_DENIED"
