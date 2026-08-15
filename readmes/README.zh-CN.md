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

一款开源的 AI 驱动的浏览器语言学习扩展。<br/>
支持沉浸式翻译、文章分析、多种 AI 模型等功能。<br/>
在浏览器中利用 AI 轻松深入地掌握语言。

> **本地笔记库版** —— 基于 [Read Frog](https://github.com/mengxi-ream/read-frog) 的分支，新增**完全本地的生词库、闪卡与复习**：
> 生词保存在你指定的文件夹（纯 JSON 文件），无需登录账号，没有条数限制。
>
> ⬇️ 下载：[GitHub Releases](https://github.com/pencil236/read-frog/releases)

[![English][english-shield]](../README.md) [![简体中文][chinese-shield]](./README.zh-CN.md) [![繁體中文][traditional-chinese-shield]](./README.zh-TW.md) [![日本語][japanese-shield]](./README.ja.md) [![한국어][korean-shield]](./README.ko.md) [![Español][spanish-shield]](./README.es.md) [![Русский][russian-shield]](./README.ru.md) [![Türkçe][turkish-shield]](./README.tr.md) [![Tiếng Việt][vietnamese-shield]](./README.vi.md)

[GitHub Releases][github-release-link] · [问题反馈][issues-link] · [原项目](https://github.com/mengxi-ream/read-frog)

<!-- SHIELD GROUP -->

[![Release version badge][extension-release-shield]][github-release-link]
[![Stars badge][star-history-shield]][star-history-link]
[![Contributors badge][contributors-shield]][contributors-link]
![Last commit badge][last-commit-shield]
[![Issues badge][issues-shield]][issues-link]<br/>

</div>

<details>
<summary><kbd>目录</kbd></summary>

#### 目录

- [📺 演示](#-演示)
- [👋🏻 快速开始](#-快速开始)
  - [下载](#下载)
- [✨ 功能](#-功能)
  - [🪄 自定义 AI 指令](#-自定义-ai-指令)
  - [🧠 本地闪卡与间隔重复](#-本地闪卡与间隔重复)
  - [🔄 双语 / 仅译文](#-双语--仅译文)
  - [✨ 划词翻译](#-划词翻译)
  - [🧠 上下文感知翻译](#-上下文感知翻译)
  - [🎬 字幕翻译](#-字幕翻译)
  - [🔊 文字转语音 (TTS)](#-文字转语音-tts)
  - [📦 批量请求](#-批量请求)
  - [🤖 20+ AI 服务商](#-20-ai-服务商)
- [🤝 贡献](#-贡献)
  - [贡献代码](#贡献代码)

<br/>

</details>

## 📺 演示

<div align="center">
  <img src="../assets/node-translation-demo.gif" width="38%" alt="Read Frog 弹窗界面" />
  <img src="../assets/page-translation-demo.gif" width="60%" alt="Read Frog 翻译界面" />
</div>

## 👋🏻 快速开始

本分支保留了 Read Frog 的全部原版功能（沉浸式翻译、划词工具、字幕、朗读等），并新增完全本地的生词工作流：生词库、闪卡、复习都在本机完成，无需账号、没有条数限制。

### 下载

本版通过 [GitHub Releases][github-release-link] 分发（未上架各浏览器官方商店）。

| 安装包                            | 安装方式                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **本地版 zip**                    | 解压后打开 `chrome://extensions`（Edge 用 `edge://extensions`），开启右上角“开发者模式”，点“加载已解压的扩展程序”，选择解压出的 `read-frog-local` 文件夹。 |
| **双击启动版**（同一 Release 内） | 无需开发者模式：解压后，每次都从包内的 `启动ReadFrog-Chrome.bat` / `启动ReadFrog-Edge.bat` 启动浏览器即可。                                                |

遇到问题或有建议？欢迎[提 issue][issues-link]。

> \[!IMPORTANT]
>
> **⭐️ 给我们点星**, 您将及时收到来自 GitHub 的所有发布通知 \~

[![Star this repo][image-star]][github-star-link]

<details>
<summary>
  <kbd>Star 历史</kbd>
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

## ✨ 功能

借助 Read Frog 的强大功能，将您的日常网页阅读转变为沉浸式语言学习之旅。

### 🪄 [自定义 AI 指令][docs-tutorial]

把选中的文字变成符合你阅读和学习习惯的可复用 AI 工具。你可以自定义提示词和结构化输出字段，选择提供商、模型与图标，然后直接从划词工具栏运行，用于查词、改写、总结、解释或任何自定义工作流。

可以从内置的**词典**和**改进写作**模板开始，也可以从零创建。结构化结果还可以映射并保存到 Notebase，方便之后学习。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 [本地闪卡与间隔重复][docs-tutorial]

将阅读中遇到的词汇、释义、例句、翻译和笔记保存到**本地笔记库**，再通过可自定义的卡片模板生成闪卡。所有数据都保存在你指定的文件夹（纯 JSON 文件）——**无需账号，没有条数限制**。

- 词典结果直接从划词工具栏保存，每个新词都会自动生成闪卡。
- 复习到期卡片并选择**重来**、**困难**、**良好**或**简单**；FSRS 调度器决定每张卡何时再次出现。
- 笔记行、卡片、复习页都有朗读按钮，可对单词发音。
- 支持表格 / 看板 / 画廊视图、筛选排序，以及可调的 SRS 设置。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-bilingual] -->

### 🔄 [双语 / 仅译文][docs-tutorial]

在两种翻译显示模式之间无缝切换。**双语模式**将原文与译文并排显示，非常适合学习和对比。**仅译文模式**完全替换原文，提供更简洁的阅读体验。

当翻译处于激活状态时切换模式，扩展会自动重新翻译所有可见内容，确保平滑过渡，无需刷新页面。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-selection] -->

### ✨ [划词翻译][docs-tutorial]

在网页上选择任何文本即可显示智能工具栏。**翻译**实时流式输出翻译结果。**解释**根据您的语言水平提供详细解释。**朗读**使用文字转语音功能朗读文本。

工具栏会智能定位以保持在视口内，支持拖拽交互，并可在所有网站上使用。非常适合阅读时快速查词。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-context] -->

### 🧠 [上下文感知翻译][docs-tutorial]

让 AI 理解您正在阅读内容的完整上下文。启用后，Read Frog 会提取页面标题和简洁的 Markdown 页面内容，将此上下文提供给 AI，以获得更准确、更符合语境的翻译。

这意味着技术术语会在其领域内被正确翻译，文学表达会保持其韵味，歧义短语会根据周围内容而非孤立地进行解释。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-subtitle] -->

### 🎬 [字幕翻译][docs-tutorial]

直接在视频播放器中翻译 YouTube 字幕。观看外语内容时，翻译会与原始字幕一起显示，让视频内容成为语言学习的好帮手。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-tts] -->

### 🔊 [文字转语音 (TTS)][docs-tutorial]

使用高质量 AI 语音朗读任何选中的文本。由 **Edge TTS** 驱动——完全免费，提供 150+ 种语音，覆盖 80+ 种语言，包括中文、英文、日文、韩文等。可自由调节语速、音调和音量。

自动语言检测（基础模式或 LLM 驱动）与按语言映射语音，确保每种语言使用最合适的语音。智能的句子感知分块功能处理长文本时会在自然边界处分割，并预取下一个片段以实现无缝播放。非常适合发音练习和听力学习。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-batch] -->

### 📦 [批量请求][docs-tutorial]

通过智能请求批处理节省高达 70% 的 API 成本。Read Frog 将多个翻译请求合并为单次 API 调用，在保持翻译质量的同时减少开销和令牌使用。

系统包含智能重试逻辑，支持指数退避，并在批处理失败时自动回退到单独请求。所有操作都在后台透明处理。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- ![][image-feat-providers] -->

### 🤖 [20+ AI 服务商][docs-tutorial]

通过 Vercel AI SDK 连接 20+ AI 服务商：OpenAI、DeepSeek、Anthropic Claude、Google Gemini、xAI Grok、Groq、Mistral、Ollama 等。为每个服务商配置自定义端点、API 密钥和模型设置。

此外还有免费翻译选项：Google 翻译、微软翻译和 DeepLX，提供零成本的基础翻译。

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 贡献

我们欢迎各种类型的贡献。

1. 向您的朋友和家人推广 Read Frog。
2. 报告[问题][issues-link]和反馈。
3. 贡献代码。

### 贡献代码

通过 AI 了解项目：[DeepWiki](https://deepwiki.com/mengxi-ream/read-frog)

查看[贡献指南](https://readfrog.app/zh/docs/code-contribution/contribution-guide)了解更多详情。

本分支以 GPL-3.0 协议发布（见 [LICENSE](../LICENSE)）。上游原项目采用 GPLv3 和商业许可双重授权。

<a href="https://github.com/mengxi-ream/read-frog/graphs/contributors">
  <table>
    <tr>
      <th colspan="2">
        <br>
        <img src="https://contrib.rocks/image?repo=mengxi-ream/read-frog" alt="Contributors"><br>
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

[back-to-top]: https://img.shields.io/badge/-回到顶部-151515?style=flat-square
[contributors-link]: https://github.com/pencil236/read-frog/graphs/contributors
[contributors-shield]: https://img.shields.io/github/contributors/pencil236/read-frog?style=flat-square&labelColor=black
[chinese-shield]: https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-gray?style=flat-square
[english-shield]: https://img.shields.io/badge/English-gray?style=flat-square
[extension-release-shield]: https://img.shields.io/github/v/release/pencil236/read-frog?include_prereleases&style=flat-square&label=最新版本&color=brightgreen&labelColor=black
[github-release-link]: https://github.com/pencil236/read-frog/releases
[github-star-link]: https://github.com/pencil236/read-frog/stargazers
[image-banner]: ../assets/banner-zh.png
[image-star]: ../assets/star.png
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

[docs-tutorial]: https://readfrog.app/zh/docs
