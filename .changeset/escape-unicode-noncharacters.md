---
"@read-frog/extension": patch
---

fix(extension): escape unicode noncharacters in built bundles

Chrome rejects unpacked content scripts that contain raw Unicode noncharacters (the U+FFFF sentinel shipped by temml via defuddle) with a misleading "not UTF-8" error. The build now escapes noncharacters to equivalent `\uXXXX` literals, which keeps runtime string values identical while making the emitted files loadable.
