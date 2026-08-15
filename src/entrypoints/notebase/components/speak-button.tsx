import { IconLoader2, IconPlayerStopFilled, IconVolume } from "@tabler/icons-react"
import { useAtomValue } from "jotai"
import { Button } from "@/components/ui/base-ui/button"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { ANALYTICS_SURFACE } from "@/types/analytics"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { i18n } from "@/utils/i18n"

interface SpeakButtonProps {
  text: string
  disabled?: boolean
  className?: string
}

/**
 * Pronounces a single word/phrase with the extension's TTS settings. Used by
 * the notebase rows, card list, and review screen.
 */
export function SpeakButton({ text, disabled = false, className }: SpeakButtonProps) {
  const ttsConfig = useAtomValue(configFieldsAtomMap.tts)
  const { play, stop, isFetching, isPlaying } = useTextToSpeech(ANALYTICS_SURFACE.SELECTION_TOOLBAR)
  const isBusy = isFetching || isPlaying
  const hasText = text.trim().length > 0

  const handleClick = () => {
    if (disabled || !hasText) {
      return
    }
    if (isBusy) {
      stop()
      return
    }
    void play(text, ttsConfig)
  }

  const label = isFetching
    ? i18n.t("speak.fetchingAudio")
    : isPlaying
      ? i18n.t("action.playing")
      : i18n.t("action.speak")

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={handleClick}
      aria-label={label}
      title={label}
      disabled={disabled || !hasText}
    >
      {isFetching ? (
        <IconLoader2 className="size-3.5 animate-spin" />
      ) : isPlaying ? (
        <IconPlayerStopFilled className="size-3.5" />
      ) : (
        <IconVolume className="size-3.5" />
      )}
    </Button>
  )
}
