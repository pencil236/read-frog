---
"@read-frog/extension": patch
---

fix(notebase): keep saves in one default notebase and add a default view

The built-in Dictionary action now persists its local notebase binding, and a
create with no binding reuses an existing same-named notebase, so repeated
saves append to the same default vocabulary book instead of creating
duplicates. Newly created notebases also ship with one default table view.
