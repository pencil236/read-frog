import { onMessage } from "@/utils/message"
import { DOMAudioPlaybackController } from "@/utils/tts-playback/dom-audio-controller"
import { appendLocalNotebaseRows, createLocalNotebaseFromRequest } from "./local-notebase-save"

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
  return createLocalNotebaseFromRequest(message.data)
})

onMessage("localNotebaseOffscreenAppend", async (message) => {
  return appendLocalNotebaseRows(message.data)
})
