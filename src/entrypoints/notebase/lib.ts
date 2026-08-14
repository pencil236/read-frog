import type { LocalNotebaseSnapshot } from "@/utils/local-notebase/types"
import { useCallback, useEffect, useState } from "react"
import { createDefaultLocalNotebaseStore } from "@/utils/local-notebase/repository"

export interface AsyncState<T> {
  data: T | null
  error: unknown
  reload: () => void
}

export function useAsyncData<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setError(null)
    fn()
      .then((value) => {
        if (alive) {
          setData(value)
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err)
        }
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the reload inputs
  }, [...deps, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  return { data, error, reload }
}

export function useNotebaseSnapshot(notebaseId: string | undefined) {
  return useAsyncData(async () => {
    if (!notebaseId) {
      return null
    }
    const store = await createDefaultLocalNotebaseStore()
    return store.loadSnapshot(notebaseId)
  }, [notebaseId])
}

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }
  if (typeof value === "object") {
    return JSON.stringify(value)
  }
  switch (typeof value) {
    case "string":
      return value
    case "number":
    case "boolean":
    case "bigint":
      return String(value)
    default:
      return ""
  }
}

export function snapshotRowCount(snapshot: LocalNotebaseSnapshot | null): number {
  return snapshot?.rows.length ?? 0
}

export function snapshotCardCount(snapshot: LocalNotebaseSnapshot | null): number {
  return snapshot?.cards.length ?? 0
}
