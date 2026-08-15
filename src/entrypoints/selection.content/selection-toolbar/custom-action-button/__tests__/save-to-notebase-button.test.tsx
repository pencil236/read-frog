import type { Config } from "@/types/config/config"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { configAtom } from "@/utils/atoms/config"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { i18n } from "@/utils/i18n"
import {
  createDefaultLocalNotebaseStore,
  createLocalNotebaseRepository,
} from "@/utils/local-notebase/repository"
import { localNotebaseDb } from "@/utils/local-notebase/storage/handle-store"
import { sendMessage } from "@/utils/message"
import { SaveToNotebaseButton } from "../save-to-notebase-button"
import { SaveToNotebaseDialogHost } from "../save-to-notebase-dialog-host"
// @vitest-environment jsdom
import "fake-indexeddb/auto"

const toastManagerMock = vi.hoisted(() => ({
  add: vi.fn<(...args: any[]) => any>(),
  close: vi.fn<(...args: any[]) => any>(),
}))

const storageAdapterMock = vi.hoisted(() => {
  let stored: unknown = null
  let lastSet: unknown = null
  return {
    get: vi.fn<(...args: any[]) => any>(async () => stored),
    set: vi.fn<(...args: any[]) => any>(async (_key: string, value: unknown) => {
      stored = value
      lastSet = value
    }),
    setMeta: vi.fn<(...args: any[]) => any>(async () => {}),
    watch: vi.fn<(...args: any[]) => any>(() => () => {}),
    __setStored: (value: unknown) => {
      stored = value
    },
    __getLastSet: () => lastSet,
  }
})

vi.mock("@/utils/message", () => ({
  sendMessage: vi.fn<(...args: any[]) => any>(),
}))

vi.mock("@/components/ui/base-ui/toast", () => ({
  toastManager: toastManagerMock,
}))

vi.mock("@/utils/atoms/storage-adapter", () => ({ storageAdapter: storageAdapterMock }))

function cloneConfig(config: Config): Config {
  return JSON.parse(JSON.stringify(config)) as Config
}

function createAction(): SelectionToolbarCustomAction {
  return {
    id: "action-1",
    name: "Dictionary",
    icon: "tabler:book-2",
    providerId: "provider-1",
    systemPrompt: "system",
    prompt: "prompt",
    outputSchema: [
      {
        id: "field-term",
        name: "Term",
        type: "string",
        description: "",
        speaking: false,
      },
      {
        id: "field-definition",
        name: "Definition",
        type: "string",
        description: "",
        speaking: false,
      },
    ],
  }
}

async function setup(action: SelectionToolbarCustomAction, result: Record<string, unknown> | null) {
  const store = createStore()
  const config = cloneConfig(DEFAULT_CONFIG)
  config.selectionToolbar.customActions = [action]
  storageAdapterMock.__setStored(config)
  store.set(configAtom, config)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SaveToNotebaseButton action={action} isRunning={false} result={result} />
        <SaveToNotebaseDialogHost />
      </Provider>
    </QueryClientProvider>,
  )

  return store
}

beforeEach(async () => {
  toastManagerMock.add.mockClear()
  toastManagerMock.close.mockClear()
  vi.mocked(sendMessage).mockClear()
  vi.mocked(sendMessage).mockImplementation((async (type: string, data: any) => {
    // Mirror the background message handlers: content scripts must route
    // storage writes through the extension origin.
    const repository = createLocalNotebaseRepository()
    if (type === "localNotebaseCreate") {
      const notebase = await repository.createNotebase({
        name: data.name,
        columns: data.columns.map((field: { name: string; type: string }) => ({
          name: field.name,
          config: { type: field.type },
        })),
        initialRows: data.results.map((cells: Record<string, unknown>) => ({ cells })),
        createDefaultTemplate: true,
        templateName: data.templateName ?? data.name,
      })
      return { notebaseId: notebase.id, location: null }
    }
    if (type === "localNotebaseAppendRows") {
      const rows = await repository.createRows(
        data.notebaseId,
        data.results.map((cells: Record<string, unknown>) => ({ cells })),
      )
      return { created: rows.length, location: null }
    }
    return undefined
  }) as unknown as typeof sendMessage)
  storageAdapterMock.get.mockClear()
  storageAdapterMock.set.mockClear()
  storageAdapterMock.setMeta.mockClear()
  storageAdapterMock.watch.mockClear()
  storageAdapterMock.__setStored(null)
  await Promise.all(localNotebaseDb.tables.map((table) => table.clear()))
})

describe("saveToNotebaseButton (local)", () => {
  it("opens the create dialog for an unconnected custom action", async () => {
    await setup(createAction(), { Term: "hello" })

    fireEvent.click(screen.getByRole("button", { name: i18n.t("action.saveToNotebase") }))

    expect(
      screen.getByRole("heading", { name: i18n.t("action.saveToNotebaseCreateTitle") }),
    ).toBeDefined()
  })

  it("creates a local notebase and saves the result on confirm", async () => {
    await setup(createAction(), { Term: "hello", Definition: "你好" })

    fireEvent.click(screen.getByRole("button", { name: i18n.t("action.saveToNotebase") }))
    fireEvent.click(
      screen.getByRole("button", { name: i18n.t("action.saveToNotebaseCreateAndSaveShort") }),
    )

    await waitFor(async () => {
      const repository = createLocalNotebaseRepository()
      const summaries = await repository.listNotebases()
      expect(summaries).toHaveLength(1)
      const storeInstance = await createDefaultLocalNotebaseStore()
      const snapshot = await storeInstance.loadSnapshot(summaries[0]!.id)
      expect(snapshot?.rows).toHaveLength(1)
      expect(snapshot?.rows[0]!.cells.Term).toBe("hello")
    })

    expect(storageAdapterMock.get.mock.calls.length).toBeGreaterThan(0)
    expect(storageAdapterMock.set.mock.calls.length).toBeGreaterThan(0)
    const lastSet = storageAdapterMock.__getLastSet() as Config
    expect(lastSet?.selectionToolbar?.customActions?.[0]?.name).toBe("Dictionary")
    expect(toastManagerMock.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: i18n.t("action.saveToNotebaseSuccess"),
      }),
    )
    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(
        "openPage",
        expect.objectContaining({
          url: expect.stringContaining("notebase.html#/notebases/"),
        }),
      )
    })

    await waitFor(() => {
      const persisted = storageAdapterMock.__getLastSet() as Config
      expect(persisted?.selectionToolbar?.customActions?.[0]?.localNotebaseId).toBeDefined()
    })
  })

  it("appends rows to an existing local notebase without opening a dialog", async () => {
    const repository = createLocalNotebaseRepository()
    const notebase = await repository.createNotebase({
      name: "Dictionary",
      columns: [
        { name: "Term", config: { type: "string" } },
        { name: "Definition", config: { type: "string" } },
      ],
      createDefaultTemplate: true,
    })
    const action = { ...createAction(), localNotebaseId: notebase.id }

    await setup(action, { Term: "world", Definition: "世界" })
    fireEvent.click(screen.getByRole("button", { name: i18n.t("action.saveToNotebase") }))

    await waitFor(async () => {
      const summaries = await repository.listNotebases()
      const storeInstance = await createDefaultLocalNotebaseStore()
      const snapshot = await storeInstance.loadSnapshot(summaries[0]!.id)
      expect(snapshot?.rows).toHaveLength(1)
      expect(snapshot?.rows[0]!.cells.Term).toBe("world")
    })

    expect(
      screen.queryByRole("heading", { name: i18n.t("action.saveToNotebaseCreateTitle") }),
    ).toBeNull()
    expect(toastManagerMock.add).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }))
  })
})
