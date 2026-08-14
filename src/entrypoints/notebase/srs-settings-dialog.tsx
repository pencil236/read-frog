import type { SrsStep } from "@read-frog/definitions"
import type { LocalNotebase } from "@/utils/local-notebase/types"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base-ui/dialog"
import { Input } from "@/components/ui/base-ui/input"
import { Label } from "@/components/ui/base-ui/label"
import { Switch } from "@/components/ui/base-ui/switch"
import { toastManager } from "@/components/ui/base-ui/toast"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"

const STEP_PATTERN = /^[1-9]\d*[mhd]$/

function parseSteps(value: string): SrsStep[] {
  return value
    .split(",")
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .filter((step) => STEP_PATTERN.test(step)) as SrsStep[]
}

function stepsValid(value: string): boolean {
  const steps = parseSteps(value)
  return steps.length > 0 && steps.every((step) => STEP_PATTERN.test(step))
}

interface SrsSettingsDialogProps {
  notebase: LocalNotebase | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function SrsSettingsDialog({
  notebase,
  open,
  onOpenChange,
  onSaved,
}: SrsSettingsDialogProps) {
  const [newPerDay, setNewPerDay] = useState(-1)
  const [reviewsPerDay, setReviewsPerDay] = useState(-1)
  const [desiredRetention, setDesiredRetention] = useState(0.9)
  const [enableShortTerm, setEnableShortTerm] = useState(true)
  const [maximumInterval, setMaximumInterval] = useState(36500)
  const [learningSteps, setLearningSteps] = useState("1m, 10m")
  const [relearningSteps, setRelearningSteps] = useState("10m")
  const [leechThreshold, setLeechThreshold] = useState(8)
  const [enableFuzz, setEnableFuzz] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || !notebase) {
      return
    }
    setNewPerDay(notebase.newPerDay)
    setReviewsPerDay(notebase.reviewsPerDay)
    setDesiredRetention(notebase.desiredRetention)
    setEnableShortTerm(notebase.enableShortTerm)
    setMaximumInterval(notebase.maximumInterval)
    setLearningSteps(notebase.learningSteps.join(", "))
    setRelearningSteps(notebase.relearningSteps.join(", "))
    setLeechThreshold(notebase.leechThreshold)
    setEnableFuzz(notebase.enableFuzz)
  }, [open, notebase])

  const save = async () => {
    if (!notebase) {
      return
    }
    if (!stepsValid(learningSteps) || !stepsValid(relearningSteps)) {
      toastManager.add({
        type: "error",
        title: "Invalid learning steps",
        description: 'Steps use durations like "1m", "10m", "1h" or "1d", separated by commas.',
      })
      return
    }

    setIsSaving(true)
    try {
      const repository = await getLocalNotebaseRepository()
      await repository.updateNotebase(notebase.id, {
        srs: {
          newPerDay,
          reviewsPerDay,
          desiredRetention,
          enableShortTerm,
          maximumInterval,
          learningSteps: parseSteps(learningSteps),
          relearningSteps: parseSteps(relearningSteps),
          leechThreshold,
          enableFuzz,
        },
      })
      toastManager.add({ type: "success", title: "SRS settings saved" })
      onOpenChange(false)
      onSaved()
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to save SRS settings",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onOpenChange(false)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>SRS settings</DialogTitle>
          <DialogDescription>
            Tune how new cards and reviews are scheduled for this notebase.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="srs-new-per-day">New cards per day</Label>
              <Input
                id="srs-new-per-day"
                type="number"
                value={newPerDay}
                onChange={(event) => setNewPerDay(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">-1 means unlimited</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="srs-reviews-per-day">Reviews per day</Label>
              <Input
                id="srs-reviews-per-day"
                type="number"
                value={reviewsPerDay}
                onChange={(event) => setReviewsPerDay(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">-1 means unlimited</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="srs-retention">Desired retention</Label>
            <Input
              id="srs-retention"
              type="number"
              min={0.3}
              max={1}
              step={0.05}
              value={desiredRetention}
              onChange={(event) => setDesiredRetention(Number(event.target.value))}
            />
            <p className="text-xs text-muted-foreground">0.3 to 1.0; higher means more reviews</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="srs-max-interval">Maximum interval (days)</Label>
              <Input
                id="srs-max-interval"
                type="number"
                min={1}
                value={maximumInterval}
                onChange={(event) => setMaximumInterval(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="srs-leech">Leech threshold</Label>
              <Input
                id="srs-leech"
                type="number"
                min={1}
                value={leechThreshold}
                onChange={(event) => setLeechThreshold(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="srs-learning-steps">Learning steps</Label>
            <Input
              id="srs-learning-steps"
              value={learningSteps}
              onChange={(event) => setLearningSteps(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="srs-relearning-steps">Relearning steps</Label>
            <Input
              id="srs-relearning-steps"
              value={relearningSteps}
              onChange={(event) => setRelearningSteps(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="srs-short-term">Short-term scheduling</Label>
              <p className="text-xs text-muted-foreground">
                Apply (re)learning steps before long-term intervals
              </p>
            </div>
            <Switch
              id="srs-short-term"
              checked={enableShortTerm}
              onCheckedChange={setEnableShortTerm}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="srs-fuzz">Interval fuzz</Label>
              <p className="text-xs text-muted-foreground">
                Add small randomness to long intervals
              </p>
            </div>
            <Switch id="srs-fuzz" checked={enableFuzz} onCheckedChange={setEnableFuzz} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="brand" disabled={isSaving} onClick={() => void save()}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
