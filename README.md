<div align="center"><a name="readme-top"></a>

[![Read Frog banner][image-banner]][website]

<p align="center">
  <a href="https://www.star-history.com/pencil236/read-frog">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=pencil236/read-frog&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/badge?repo=pencil236/read-frog" />
      <img alt="Star History Rank" src="https://api.star-history.com/badge?repo=pencil236/read-frog" width="260" height="55" />
    </picture>
  </a>
</p>

An open-source AI-powered language learning extension for browsers.<br/>
Supports immersive translation, article analysis, multiple AI models, and more.<br/>
Master languages effortlessly and deeply with AI, right in your browser.

> **Local Notebase Edition** — a fork of [Read Frog](https://github.com/mengxi-ream/read-frog)
> that adds a fully **local vocabulary book, flashcards, and review**: saved words live in a
> folder you choose (plain JSON files), no account required, no usage limits.
>
> ⬇️ Download: [GitHub Releases](https://github.com/pencil236/read-frog/releases)

[![English][english-shield]](./README.md) [![简体中文][chinese-shield]](./readmes/README.zh-CN.md) [![繁體中文][traditional-chinese-shield]](./readmes/README.zh-TW.md) [![日本語][japanese-shield]](./readmes/README.ja.md) [![한국어][korean-shield]](./readmes/README.ko.md) [![Español][spanish-shield]](./readmes/README.es.md) [![Русский][russian-shield]](./readmes/README.ru.md) [![Türkçe][turkish-shield]](./readmes/README.tr.md) [![Tiếng Việt][vietnamese-shield]](./readmes/README.vi.md)

[GitHub Releases][github-release-link] · [Issues][issues-link] · [Original Project](https://github.com/mengxi-ream/read-frog)

<!-- SHIELD GROUP -->

[![Latest Version badge][extension-release-shield]][github-release-link]
[![Stars badge][star-history-shield]][star-history-link]
[![Contributors badge][contributors-shield]][contributors-link]
![Last Commit badge][last-commit-shield]
[![Issues badge][issues-shield]][issues-link]<br/>

</div>

<details>
<summary><kbd>Table of contents</kbd></summary>

#### TOC

- [📺 Demo](#-demo)
- [👋🏻 Getting Started](#-getting-started)
  - [Download](#download)
- [✨ Features](#-features)
  - [🪄 Custom AI Actions](#-custom-ai-actions)
  - [🧠 Local Flashcards & Spaced Repetition](#-local-flashcards--spaced-repetition)
  - [🔄 Bilingual / Translation Only](#-bilingual--translation-only)
  - [✨ Selection Translation](#-selection-translation)
  - [🧠 Context-Aware Translation](#-context-aware-translation)
  - [🎬 Subtitle Translation](#-subtitle-translation)
  - [🔊 Text-to-Speech (TTS)](#-text-to-speech-tts)
  - [📦 Batch Requests](#-batch-requests)
  - [🤖 20+ AI Providers](#-20-ai-providers)
- [🤝 Contribute](#-contribute)
  - [Contribute Code](#contribute-code)

<br/>

</details>

## 📺 Demo

<div align="center">
  <img src="assets/node-translation-demo.gif" width="38%" alt="Read Frog Popup Interface" />
  <img src="assets/page-translation-demo.gif" width="60%" alt="Read Frog Translation Interface" />
</div>

## 👋🏻 Getting Started

This fork keeps all of Read Frog's original features (immersive translation, selection tools, subtitles, TTS, and more) and adds a fully local vocabulary workflow: the vocabulary book, flashcards, and review all run on your own machine with no account and no limits.

### Download

This edition is distributed through [GitHub Releases][github-release-link] (it is not published on the official browser stores).

| Package                                         | How to install                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local Edition zip**                           | Unzip, then open `chrome://extensions` (Edge: `edge://extensions`), enable **Developer mode**, click **Load unpacked**, and select the unzipped `read-frog-local` folder. |
| **Double-click launcher** (in the same Release) | No developer mode needed: unzip, then always launch the browser from the included `启动ReadFrog-Chrome.bat` / `启动ReadFrog-Edge.bat` script.                             |

Found a problem or have a suggestion? Open an [issue][issues-link].

> \[!IMPORTANT]
>
> **⭐️ Star Us**, You will receive all release notifications from GitHub without any delay \~

[![Star Read Frog on GitHub][image-star]][github-star-link]

<details>
<summary>
  <kbd>Star History</kbd>
</summary>

<a href="https://www.star-history.com/?type=timeline&repos=pencil236%2Fread-frog">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=pencil236/read-frog&type=timeline&theme=dark&legend=top-left&sealed_token=vUW24BwE2sgnq-CzlWEAT6gnzZqNrXl9ai4A05Pc3CQcPGdBqbts3tq5VRWEerfrqVdonsJasb04WcKd5AKSSCjlsdj_TwyI3j9xytMG4FQNw7yXDe9IUA" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=pencil236/read-frog&type=timeline&legend=top-left&sealed_token=vUW24BwE2sgnq-CzlWEAT6gnzZqNrXl9ai4A05Pc3CQcPGdBqbts3tq5VRWEerfrqVdonsJasb04WcKd5AKSSCjlsdj_TwyI3j9xytMG4FQNw7yXDe9IUA" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=pencil236/read-frog&type=timeline&legend=top-left&sealed_token=vUW24BwE2sgnq-CzlWEAT6gnzZqNrXl9ai4A05Pc3CQcPGdBqbts3tq5VRWEerfrqVdonsJasb04WcKd5AKSSCjlsdj_TwyI3j9xytMG4FQNw7yXDe9IUA" />
 </picture>
</a>

</details>

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## ✨ Features

Transform your everyday web reading into an immersive language learning journey with Read Frog's powerful features.

### 🪄 [Custom AI Actions][docs-tutorial]

Turn selected text into reusable AI tools that match the way you read and learn. Define your own prompts and structured output fields, choose a provider, model, and icon, then run the action directly from the selection toolbar for dictionary lookups, rewriting, summaries, explanations, or any workflow you design.

Start with the built-in **Dictionary** and **Improve Writing** templates, or build an action from scratch. Structured results can also be mapped and saved to Notebase for later study.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 [Local Flashcards & Spaced Repetition][docs-tutorial]

Save vocabulary, definitions, example sentences, translations, and reading notes to a **local Notebase**, then turn them into flashcards with customizable card templates. Everything lives in a folder you choose (plain JSON files) — **no account, no usage limits**.

- Dictionary results save straight from the selection toolbar, and each new word automatically becomes a flashcard.
- Review due cards and rate each one **Again**, **Hard**, **Good**, or **Easy**; the FSRS scheduler decides when each card should reappear.
- Speak buttons on rows, cards, and the review screen pronounce each word aloud.
- Table / kanban / gallery views with filters and sorting, plus adjustable SRS settings.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-bilingual] -->

### 🔄 [Bilingual / Translation Only][docs-tutorial]

Switch seamlessly between two translation display modes. **Bilingual mode** shows the original text alongside its translation, perfect for learning and comparison. **Translation-only mode** replaces the original text entirely for a cleaner reading experience.

The extension automatically re-translates all visible content when you switch modes while translation is active, ensuring a smooth transition without needing to refresh the page.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-selection] -->

### ✨ [Selection Translation][docs-tutorial]

Select any text on a webpage to reveal a smart toolbar with powerful options. **Translate** streams the translation in real-time. **Explain** provides detailed explanations tailored to your language level. **Speak** reads the text aloud using text-to-speech.

The toolbar intelligently positions itself to stay within the viewport, supports drag interactions, and works across all websites. Perfect for quick lookups while reading.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-context] -->

### 🧠 [Context-Aware Translation][docs-tutorial]

Enable AI to understand the full context of what you're reading. When activated, Read Frog extracts the page title and a concise Markdown version of the page content, providing this context to the AI for more accurate, contextually-appropriate translations.

This means technical terms get translated correctly within their domain, literary expressions maintain their nuance, and ambiguous phrases are interpreted based on the surrounding content rather than in isolation.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-subtitle] -->

### 🎬 [Subtitle Translation][docs-tutorial]

Translate YouTube subtitles directly in the video player. Watch foreign language content with translations displayed alongside the original subtitles, making video content accessible for language learning.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-tts] -->

### 🔊 [Text-to-Speech (TTS)][docs-tutorial]

Listen to any selected text with high-quality AI voices. Powered by **Edge TTS** — completely free, with 150+ voices across 80+ languages including Chinese, English, Japanese, Korean, and many more. Adjust rate, pitch, and volume to your preference.

Automatic language detection (basic or LLM-powered) with per-language voice mapping ensures the right voice for every language. Smart sentence-aware chunking handles long text by splitting at natural boundaries and prefetching the next chunk for seamless playback. Perfect for pronunciation practice and auditory learning.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-batch] -->

### 📦 [Batch Requests][docs-tutorial]

Save up to 70% on API costs with intelligent request batching. Read Frog groups multiple translation requests into single API calls, reducing overhead and token usage while maintaining translation quality.

The system includes smart retry logic with exponential backoff and automatic fallback to individual requests if batch processing fails. All handled transparently in the background.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-providers] -->

### 🤖 [20+ AI Providers][docs-tutorial]

Connect to 20+ AI providers through Vercel AI SDK: OpenAI, DeepSeek, Anthropic Claude, Google Gemini, xAI Grok, Groq, Mistral, Ollama, and many more. Configure custom endpoints, API keys, and model settings for each provider.

Plus free translation options: Google Translate, Microsoft Translate, and DeepLX for cost-free basic translations.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 Contribute

Contributions of all types are more than welcome.

1. Promote Read Frog to your friends and family.
2. Report [issues][issues-link] and feedback.
3. Contribute code.

### Contribute Code

Project Structure: [DeepWiki](https://deepwiki.com/mengxi-ream/read-frog)

Ask AI to understand the project: [Dosu](https://app.dosu.dev/29569286-71ba-47dd-b038-c7ab1b9d0df7/documents)

Check out the [Contribution Guide](https://readfrog.app/en/docs/code-contribution/contribution-guide) for more details.

This fork is released under GPL-3.0 (see [LICENSE](./LICENSE)). The upstream project is dual-licensed under GPLv3 and a commercial license.

<a href="https://github.com/mengxi-ream/read-frog/graphs/contributors">
  <table>
    <tr>
      <th colspan="2">
        <br>
        <img src="https://contrib.rocks/image?repo=mengxi-ream/read-frog" alt="Read Frog contributors"><br>
        <br>
      </th>
    </tr>
    <!-- <tr>
      <td>
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-recent-top-contributors/thumbnail.png?repo_id=967738751&image_size=auto&color_scheme=dark" width="373" height="auto">
          <img alt="Top Contributors of mengxi-ream/read-frog - Last 28 days" src="https://next.ossinsight.io/widgets/official/compose-recent-top-contributors/thumbnail.png?repo_id=967738751&image_size=auto&color_scheme=light" width="373" height="auto">
        </picture>
      </td>
      <td rowspan="2">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-last-28-days-stats/thumbnail.png?repo_id=967738751&image_size=4x7&color_scheme=dark" width="655" height="auto">
          <img alt="Performance Stats of mengxi-ream/read-frog - Last 28 days" src="https://next.ossinsight.io/widgets/official/compose-last-28-days-stats/thumbnail.png?repo_id=967738751&image_size=auto&color_scheme=light" width="655" height="auto">
        </picture>
      </td>
    </tr> -->
  </table>
</a>

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square
[contributors-link]: https://github.com/pencil236/read-frog/graphs/contributors
[contributors-shield]: https://img.shields.io/github/contributors/pencil236/read-frog?style=flat-square&labelColor=black
[chinese-shield]: https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-gray?style=flat-square
[english-shield]: https://img.shields.io/badge/English-gray?style=flat-square
[extension-release-shield]: https://img.shields.io/github/v/release/pencil236/read-frog?include_prereleases&style=flat-square&label=Latest%20Version&color=brightgreen&labelColor=black
[github-release-link]: https://github.com/pencil236/read-frog/releases
[github-star-link]: https://github.com/pencil236/read-frog/stargazers
[image-banner]: /assets/banner.png
[image-star]: ./assets/star.png
[issues-link]: https://github.com/pencil236/read-frog/issues
[issues-shield]: https://img.shields.io/github/issues/pencil236/read-frog?style=flat-square&labelColor=black
[japanese-shield]: https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-gray?style=flat-square
[korean-shield]: https://img.shields.io/badge/%ED%95%9C%EA%B5%AD%EC%96%B4-gray?style=flat-square
[last-commit-shield]: https://img.shields.io/github/last-commit/pencil236/read-frog?style=flat-square&label=commit&labelColor=black
[russian-shield]: https://img.shields.io/badge/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9-gray?style=flat-square
[spanish-shield]: https://img.shields.io/badge/Espa%C3%B1ol-gray?style=flat-square
[star-history-link]: https://www.star-history.com/#pencil236/read-frog&Timeline
[star-history-shield]: https://img.shields.io/github/stars/pencil236/read-frog?style=flat-square&label=stars&color=yellow&labelColor=black
[traditional-chinese-shield]: https://img.shields.io/badge/%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87-gray?style=flat-square
[turkish-shield]: https://img.shields.io/badge/T%C3%BCrk%C3%A7e-gray?style=flat-square
[vietnamese-shield]: https://img.shields.io/badge/Ti%E1%BA%BFng%20Vi%E1%BB%87t-gray?style=flat-square
[website]: https://readfrog.app

<!-- Feature docs link -->

[docs-tutorial]: https://readfrog.app/docs
