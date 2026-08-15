---
"@read-frog/extension": patch
---

fix(notebase): route local notebase saves through the extension background

Saving a dictionary result from a webpage previously wrote to the embedding
page's storage partition, so the word never appeared in the extension's local
notebase page. Saves (both creating a notebase and appending rows) now run in
the extension background, which shares storage with the notebase page and the
user-chosen data directory.
