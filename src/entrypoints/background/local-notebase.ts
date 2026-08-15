import { browser } from "#imports"
import {
  getStoredDirectoryHandle,
  getStoredDirectoryLocation,
} from "@/utils/local-notebase/storage/directory"
import { logger } from "@/utils/logger"
import { onMessage, sendMessage } from "@/utils/message"

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html" as const
const OFFSCREEN_DOCUMENT_URL = browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)

interface ChromeRuntimeContext {
  contextType?: string
}

interface ChromeOffscreenApi {
  createDocument: (options: {
    url: string
    reasons: string[]
    justification: string
  }) => Promise<void>
}

interface ChromeLike {
  runtime?: {
    getContexts?: (filter: {
      contextTypes: string[]
      documentUrls?: string[]
    }) => Promise<ChromeRuntimeContext[]>
  }
  offscreen?: ChromeOffscreenApi
}

function getChromeLike(): ChromeLike {
  return (globalThis as { chrome?: ChromeLike }).chrome ?? {}
}

function isSingleOffscreenDocumentError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes("Only a single offscreen document may be created") ||
    message.includes("already exists")
  )
}

function isMissingReceiverError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes("Could not establish connection") ||
    message.includes("Receiving end does not exist") ||
    message.includes("No response")
  )
}

async function hasOffscreenDocument(): Promise<boolean> {
  const chromeApi = getChromeLike()
  if (!chromeApi.runtime?.getContexts) {
    return false
  }
  const contexts = await chromeApi.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [OFFSCREEN_DOCUMENT_URL],
  })
  return contexts.some((context) => context.contextType === "OFFSCREEN_DOCUMENT")
}

let ensureOffscreenPromise: Promise<void> | null = null

/**
 * The File System Access API is not usable from service workers, so
 * directory-backed notebase writes run in the offscreen document (an extension
 * window context). Ensures that document exists before forwarding to it.
 */
async function ensureOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) {
    return
  }
  if (ensureOffscreenPromise) {
    return ensureOffscreenPromise
  }

  ensureOffscreenPromise = (async () => {
    const chromeApi = getChromeLike()
    if (!chromeApi.offscreen?.createDocument) {
      throw new Error("Offscreen API is unavailable in this browser")
    }
    try {
      await chromeApi.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ["LOCAL_STORAGE"],
        justification: "Write local notebase data to the user-chosen folder.",
      })
    } catch (error) {
      if (!isSingleOffscreenDocumentError(error)) {
        throw error
      }
    }
  })().finally(() => {
    ensureOffscreenPromise = null
  })

  return ensureOffscreenPromise
}

async function forwardToOffscreen<T>(
  type: "localNotebaseOffscreenCreate" | "localNotebaseOffscreenAppend",
  data: unknown,
): Promise<T> {
  await ensureOffscreenDocument()
  try {
    return await sendMessage(type as never, data as never)
  } catch (error) {
    if (!isMissingReceiverError(error)) {
      throw error
    }
    logger.warn("[Background][LocalNotebase] offscreen receiver missing, retrying once", error)
    await ensureOffscreenDocument()
    return await sendMessage(type as never, data as never)
  }
}

/**
 * Routes local-notebase writes from content scripts through the extension
 * origin. A content script's IndexedDB belongs to the embedding page, so a
 * save performed directly from the selection toolbar would be invisible to
 * the extension's notebase page. Writes run in the offscreen document, which
 * shares the extension's storage and can use the user-chosen directory handle.
 */
export function setupLocalNotebaseMessageHandlers() {
  onMessage("localNotebaseGetStorageStatus", async () => {
    const handle = await getStoredDirectoryHandle()
    return {
      folderChosen: handle !== null,
      location: await getStoredDirectoryLocation(),
    }
  })

  onMessage("localNotebaseCreate", async (message) => {
    return forwardToOffscreen<{ notebaseId: string; location: string | null }>(
      "localNotebaseOffscreenCreate",
      message.data,
    )
  })

  onMessage("localNotebaseAppendRows", async (message) => {
    return forwardToOffscreen<{ created: number; location: string | null }>(
      "localNotebaseOffscreenAppend",
      message.data,
    )
  })
}
