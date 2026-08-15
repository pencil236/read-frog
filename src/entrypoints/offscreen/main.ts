import { onMessage } from "@/utils/message"
import { DOMAudioPlaybackController } from "@/utils/tts-playback/dom-audio-controller"
import {
  appendLocalNotebaseRows,
  createLocalNotebaseFromRequest,
  ensureDirectoryWritePermission,
} from "./local-notebase-save"

const playbackController = new DOMAudioPlaybackController(
  "Failed to play audio in offscreen document",
)

onMessage("ttsOffscreenPlay", async (message) => {
  return playbackController.play(message.data)
})

onMessage("ttsOffscreenStop", async (message) => {
  playbackController.stop(message.data)
  return { ok: true as const }
})

onMessage("localNotebaseOffscreenCreate", async (message) => {
  await ensureDirectoryWritePermission()
  return createLocalNotebaseFromRequest(message.data)
})

onMessage("localNotebaseOffscreenAppend", async (message) => {
  await ensureDirectoryWritePermission()
  return appendLocalNotebaseRows(message.data)
})
