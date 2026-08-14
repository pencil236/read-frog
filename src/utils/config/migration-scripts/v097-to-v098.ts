/**
 * Migration script from v097 to v098.
 *
 * Adds the optional `localNotebaseId` field to selection-toolbar custom
 * actions and the built-in dictionary action. The field is purely additive:
 * existing configs simply do not have it yet, so the migration is a no-op
 * identity transform that only carries the data forward.
 *
 * IMPORTANT: This is a frozen snapshot. It imports nothing from the evolving
 * application code.
 */

export function migrate(oldConfig: any): any {
  return oldConfig
}
