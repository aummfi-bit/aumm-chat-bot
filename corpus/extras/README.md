# Supplementary corpus (`extras/`)

This directory is merged with **`vendor/aumm-skill/references`** for `readAummReference`:

- Allowed paths are listed in [`_extras.json`](_extras.json) with the **`extras/…`** prefix (e.g. `extras/notes/foo.md`).
- Files on disk omit that prefix (`notes/foo.md` under `corpus/extras/`).
- Updating the **`aumm-skill` submodule never deletes** files here — only changing `_extras.json` or these files affects the chatbot corpus.

**Sagix essays** are **not** stored here. They come from the submodule: `vendor/aumm-skill/references/sagix/*.md` (mirrors from aumm-site; full text, with provenance in each file).
