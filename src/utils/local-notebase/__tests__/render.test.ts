import type { LocalNotebaseColumn } from "../types"
import { describe, expect, it } from "vitest"
import { createDefaultDictionaryTemplate, renderPattern } from "../render"

const columns: Pick<LocalNotebaseColumn, "name">[] = [
  { name: "Term" },
  { name: "Phonetic" },
  { name: "Definition" },
]

describe("renderPattern", () => {
  it("replaces exact column tokens", () => {
    expect(
      renderPattern("{{Term}}: {{Definition}}", { Term: "hello", Definition: "你好" }, columns),
    ).toBe("hello: 你好")
  })

  it("matches tokens case-insensitively and ignores whitespace", () => {
    expect(
      renderPattern("{{ term }} and {{PHONETIC}}", { Term: "a", Phonetic: "/b/" }, columns),
    ).toBe("a and /b/")
  })

  it("leaves unknown tokens untouched", () => {
    expect(renderPattern("{{Missing}} {{Term}}", { Term: "x" }, columns)).toBe("{{Missing}} x")
  })

  it("renders null/undefined as empty and scalar values as strings", () => {
    expect(
      renderPattern(
        "{{Term}}|{{Definition}}|{{Phonetic}}",
        { Term: 42, Definition: null },
        columns,
      ),
    ).toBe("42||")
  })

  it("stringifies objects as JSON", () => {
    expect(renderPattern("{{Definition}}", { Definition: { a: 1 } }, columns)).toBe('{"a":1}')
  })
})

describe("createDefaultDictionaryTemplate", () => {
  it("builds a basic template from the primary column and remaining fields", () => {
    const fullColumns: LocalNotebaseColumn[] = [
      {
        id: "1",
        notebaseId: "n",
        name: "Term",
        config: { type: "string" },
        position: 0,
        isPrimary: true,
        width: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        notebaseId: "n",
        name: "Definition",
        config: { type: "string" },
        position: 1,
        isPrimary: false,
        width: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const template = createDefaultDictionaryTemplate(fullColumns)
    expect(template.config.type).toBe("basic")
    expect(template.config.frontPattern).toBe("{{Term}}")
    expect(template.config.backPattern).toContain("**Definition:** {{Definition}}")
  })
})
