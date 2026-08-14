import { beforeEach, describe, expect, it } from "vitest"
import { createLocalNotebaseRepository } from "../repository"
import { localNotebaseDb } from "../storage/handle-store"
import { InternalLocalNotebaseStore } from "../storage/internal"
import "fake-indexeddb/auto"

const store = new InternalLocalNotebaseStore()
const repository = createLocalNotebaseRepository(store)

const TIMEZONE = "Asia/Shanghai"

async function createDictionaryNotebase(name = "Dictionary") {
  return repository.createNotebase({
    name,
    columns: [
      { name: "Term", config: { type: "string" } },
      { name: "Definition", config: { type: "string" } },
      { name: "Phonetic", config: { type: "string" } },
    ],
    createDefaultTemplate: true,
  })
}

beforeEach(async () => {
  await Promise.all(localNotebaseDb.tables.map((table) => table.clear()))
})

describe("LocalNotebaseRepositoryImpl (internal store)", () => {
  it("creates, lists and reads a notebase with columns and a default template", async () => {
    const created = await createDictionaryNotebase()
    const summaries = await repository.listNotebases()
    expect(summaries).toHaveLength(1)
    expect(summaries[0]!.id).toBe(created.id)
    expect(summaries[0]!.name).toBe("Dictionary")

    const loaded = await repository.getNotebase(created.id)
    expect(loaded?.name).toBe("Dictionary")
    expect(loaded?.desiredRetention).toBe(0.9)

    const templates = await repository.listTemplates(created.id)
    expect(templates).toHaveLength(1)
    expect(templates[0]!.config.type).toBe("basic")
  })

  it("adds rows, generates cards and renders front/back", async () => {
    const created = await createDictionaryNotebase()
    const [template] = await repository.listTemplates(created.id)

    await repository.createRows(created.id, [
      { cells: { Term: "hello", Definition: "你好", Phonetic: "/həˈləʊ/" } },
      { cells: { Term: "world", Definition: "世界", Phonetic: "/wɜːld/" } },
    ])
    const { created: cardCount } = await repository.generateCards(created.id, template!.id)
    expect(cardCount).toBe(2)

    const cards = await repository.listCards(created.id, template!.id)
    expect(cards).toHaveLength(2)
    expect(cards.map((card) => card.front)).toEqual(expect.arrayContaining(["hello", "world"]))
    expect(cards[0]!.back).toContain("**Definition:**")

    // Regenerating adds nothing new.
    const again = await repository.generateCards(created.id, template!.id)
    expect(again.created).toBe(0)
  })

  it("reviews a card, appends a revlog and rolls the review back", async () => {
    const created = await createDictionaryNotebase()
    const [template] = await repository.listTemplates(created.id)
    await repository.createRows(created.id, [{ cells: { Term: "hello", Definition: "你好" } }])
    await repository.generateCards(created.id, template!.id)
    const [card] = await repository.listCards(created.id)

    const now = new Date("2026-08-14T12:00:00.000Z")
    const outcome = await repository.reviewCard(card!.id, "good", 5_000, TIMEZONE, now)
    expect(outcome.card.state).toBe("learning")
    expect(outcome.revlog.rating).toBe("good")
    expect(outcome.revlog.before.state).toBe("new")

    const rolledBack = await repository.rollbackReview(card!.id)
    expect(rolledBack.card.state).toBe("new")
    expect(rolledBack.rolledBackRevlogId).toBe(outcome.revlog.id)

    await expect(repository.rollbackReview(card!.id)).rejects.toThrow("No review to roll back")
  })

  it("supports burying, suspending and due stats", async () => {
    const created = await createDictionaryNotebase()
    const [template] = await repository.listTemplates(created.id)
    await repository.createRows(created.id, [{ cells: { Term: "a" } }, { cells: { Term: "b" } }])
    await repository.generateCards(created.id, template!.id)
    const cards = await repository.listCards(created.id)

    let stats = await repository.dueStats([created.id], TIMEZONE)
    expect(stats[created.id]).toEqual({ new: 2, learning: 0, review: 0 })

    await repository.reviewCard(cards[0]!.id, "good", 3_000, TIMEZONE)
    await repository.setCardBuried(cards[1]!.id, true)

    stats = await repository.dueStats([created.id], TIMEZONE)
    expect(stats[created.id]).toEqual({ new: 0, learning: 1, review: 0 })

    await repository.setCardBuried(cards[1]!.id, false)
    stats = await repository.dueStats([created.id], TIMEZONE)
    expect(stats[created.id]).toEqual({ new: 1, learning: 1, review: 0 })
  })

  it("renames columns and remaps cell values", async () => {
    const created = await createDictionaryNotebase()
    await repository.createRows(created.id, [{ cells: { Term: "hello", Definition: "你好" } }])
    const snapshot = await store.loadSnapshot(created.id)
    await repository.updateColumn(created.id, snapshot!.columns[0]!.id, {
      name: "Word",
    })

    const after = await store.loadSnapshot(created.id)
    expect(after?.rows[0]!.cells.Word).toBe("hello")
    expect(after?.rows[0]!.cells.Term).toBeUndefined()
  })

  it("deletes rows and their cards, and refuses to delete the primary column", async () => {
    const created = await createDictionaryNotebase()
    const [template] = await repository.listTemplates(created.id)
    const [row] = await repository.createRows(created.id, [{ cells: { Term: "x" } }])
    await repository.generateCards(created.id, template!.id)
    expect(await repository.listCards(created.id)).toHaveLength(1)

    await repository.deleteRow(created.id, row!.id)
    expect(await repository.listCards(created.id)).toHaveLength(0)

    const snapshot = await store.loadSnapshot(created.id)
    await expect(repository.deleteColumn(created.id, snapshot!.columns[0]!.id)).rejects.toThrow(
      "primary",
    )
  })

  it("deletes a notebase entirely", async () => {
    const created = await createDictionaryNotebase()
    await repository.deleteNotebase(created.id)
    expect(await repository.listNotebases()).toHaveLength(0)
    expect(await repository.getNotebase(created.id)).toBeNull()
  })
})
