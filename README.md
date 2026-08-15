<div align="center"><a name="readme-top"></a>

# Read Frog — Local Notebase Edition

[![Latest Version badge][extension-release-shield]][github-release-link]
[![Stars badge][star-history-shield]][star-history-link]
![Last Commit badge][last-commit-shield]
[![Issues badge][issues-shield]][issues-link]

[English](./README.md) · [简体中文](./readmes/README.zh-CN.md)

</div>

A fork of [Read Frog](https://github.com/mengxi-ream/read-frog) that adds a fully **local vocabulary book, flashcards, and review** — no account, no limits. Everything else (immersive translation, selection tools, subtitles, TTS, 20+ AI providers, …) is identical to the original project, so **please refer to the [original README](https://github.com/mengxi-ream/read-frog#readme) for all other features**.

## ✨ What's different from the original

- **Local Notebase, no account** — dictionary results save straight into a local notebase stored as JSON files in a folder you choose. No readfrog.app login, no usage limits.
- **Automatic flashcards** — every saved word instantly becomes a card and shows up in review; no manual generation step.
- **Read-aloud** — speak buttons on notebase rows, cards, and the review screen pronounce each word.
- **Review & management** — table / kanban / gallery views, filters & sorting, FSRS spaced repetition, adjustable SRS settings, and review history.
- **Installation** — distributed via GitHub Releases instead of browser stores (including a no-developer-mode double-click launcher).

## 📥 Download & install

Grab the package from [GitHub Releases][github-release-link]:

- **Standard zip**: unzip → open `chrome://extensions` (Edge: `edge://extensions`) → enable **Developer mode** → **Load unpacked** → select the `read-frog-local` folder.
- **Double-click launcher**: unzip → launch the browser from `启动ReadFrog-Chrome.bat` / `启动ReadFrog-Edge.bat` each time — no developer mode needed.

## 🔗 Links

- Original project: [mengxi-ream/read-frog](https://github.com/mengxi-ream/read-frog)
- Original README: <https://github.com/mengxi-ream/read-frog#readme> (features, usage, contribution — everything not covered here)
- This edition's source lives on the `local-notebase` branch.
- Feedback: [Issues][issues-link]

## 📜 License

GPL-3.0 — see [LICENSE](./LICENSE). The upstream project is dual-licensed under GPLv3 and a commercial license.

<!-- LINK GROUP -->

[extension-release-shield]: https://img.shields.io/github/v/release/pencil236/read-frog?include_prereleases&style=flat-square&label=Latest%20Version&color=brightgreen&labelColor=black
[github-release-link]: https://github.com/pencil236/read-frog/releases
[star-history-shield]: https://img.shields.io/github/stars/pencil236/read-frog?style=flat-square&label=stars&color=yellow&labelColor=black
[star-history-link]: https://www.star-history.com/#pencil236/read-frog&Timeline
[last-commit-shield]: https://img.shields.io/github/last-commit/pencil236/read-frog?style=flat-square&label=commit&labelColor=black
[issues-shield]: https://img.shields.io/github/issues/pencil236/read-frog?style=flat-square&labelColor=black
[issues-link]: https://github.com/pencil236/read-frog/issues
