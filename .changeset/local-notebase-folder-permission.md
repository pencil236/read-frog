---
"@read-frog/extension": patch
---

fix(notebase): re-request folder write permission before local saves

Chromium can drop readwrite access to the user-chosen data folder after a
browser restart (or when the handle is used from a new context), which made
saves fail with "getDirectoryHandle is not allowed in the current context".
Saves now explicitly re-request readwrite permission in the offscreen
document first, fail with a recognizable message instead of a raw browser
error, and the Storage page gains a permission check plus a reauthorize
button so the user can restore access without re-picking the folder.
