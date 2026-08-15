<div align="center"><a name="readme-top"></a>

# Read Frog — 本地笔记库版

[![Latest Version badge][extension-release-shield]][github-release-link]
[![Stars badge][star-history-shield]][star-history-link]
![Last Commit badge][last-commit-shield]
[![Issues badge][issues-shield]][issues-link]

[English](../README.md) · [简体中文](./README.zh-CN.md)

</div>

这是 [Read Frog](https://github.com/mengxi-ream/read-frog)（原项目）的 fork，在保留原版全部功能的基础上，新增了一套**完全本地的生词库、闪卡与复习**——无需账号、没有条数限制。其余功能（沉浸式翻译、划词工具、字幕、朗读、20+ AI 服务商等）与原版完全一致，**请直接阅读[原作者的 README](https://github.com/mengxi-ream/read-frog#readme)**。

## ✨ 与原版不同的地方

- **本地笔记库，无需账号**：词典查词结果直接保存到本地笔记库，数据是你自选文件夹里的 JSON 文件；无需登录 readfrog.app，没有条数限制。
- **闪卡自动生成**：保存新词后自动生成闪卡，复习页立即统计，无需手动生成。
- **朗读**：笔记行、卡片、复习页都有朗读按钮，可对单词发音。
- **复习与管理**：表格 / 看板 / 画廊多视图、筛选排序、FSRS 间隔复习、SRS 参数可调、复习历史。
- **安装方式**：不经浏览器商店，通过 GitHub Releases 分发（含免开发者模式的“双击启动”版本）。

## 📥 下载与安装

所有安装包都在 [GitHub Releases][github-release-link]，按你的情况选一种：

| 方式                         | 适合                      | 需要管理员 | 需要联网              | 效果                                                           |
| ---------------------------- | ------------------------- | ---------- | --------------------- | -------------------------------------------------------------- |
| ① 双击启动版                 | 给朋友/家人、网络受限环境 | 否         | 否                    | 用启动脚本打开浏览器，扩展即生效；平时正常打开浏览器不会带扩展 |
| ② 开发者模式加载一次         | 自己常用的电脑            | 否         | 否                    | 装一次后每次打开浏览器都在，无需重复安装；只需开一次开发者模式 |
| ③ 常驻安装版（Windows 策略） | 公司、批量安装            | 是（一次） | 是（需能访问 GitHub） | 强制安装，每次打开浏览器都在，支持自动更新                     |

### ① 双击启动版

1. 下载 `read-frog-local-1.45.3.zip` 并解压到固定位置。
2. 双击 `启动ReadFrog-Chrome.bat`（Chrome）或 `启动ReadFrog-Edge.bat`（Edge）。
3. 浏览器会带着扩展启动。（浏览器自带“新标签页”不允许运行扩展，提示属正常现象，关闭该标签页即可。）

### ② 开发者模式加载（个人使用推荐）

1. 解压安装包，得到 `read-frog-local` 文件夹。
2. 打开 `chrome://extensions`（Edge 用 `edge://extensions`）。
3. 开启右上角“开发者模式”。
4. 点“加载已解压的扩展程序”，选择 `read-frog-local` 文件夹。
5. 之后每次打开浏览器扩展都在；开发者模式开关之后也可以关掉。

### ③ 常驻安装版（Windows 策略）

1. 下载 `read-frog-常驻安装版.zip` 并解压。
2. 双击 `安装.bat`，允许管理员权限。
3. 重启浏览器，扩展自动安装，之后每次打开都在，并支持自动更新。
4. 卸载：双击 `卸载.bat`。

> 注意：安装和更新时，浏览器需要能访问 GitHub；如果网络不可达，可以把 `update.xml` 和 `read-frog.crx` 放到任何可达的 HTTPS 地址，再修改 `install-policy.reg` 里的网址。

## 🔗 链接

- 原项目：[mengxi-ream/read-frog](https://github.com/mengxi-ream/read-frog)
- 原项目 README：<https://github.com/mengxi-ream/read-frog#readme>（功能、使用、贡献等一切未在本说明覆盖的内容）
- 本版源码在 `local-notebase` 分支
- 问题反馈：[Issues][issues-link]

## 📜 许可证

GPL-3.0（见 [LICENSE](../LICENSE)）。上游原项目采用 GPLv3 与商业许可双重授权。

<!-- LINK GROUP -->

[extension-release-shield]: https://img.shields.io/github/v/release/pencil236/read-frog?include_prereleases&style=flat-square&label=最新版本&color=brightgreen&labelColor=black
[github-release-link]: https://github.com/pencil236/read-frog/releases
[star-history-shield]: https://img.shields.io/github/stars/pencil236/read-frog?style=flat-square&label=stars&color=yellow&labelColor=black
[star-history-link]: https://www.star-history.com/#pencil236/read-frog&Timeline
[last-commit-shield]: https://img.shields.io/github/last-commit/pencil236/read-frog?style=flat-square&label=commit&labelColor=black
[issues-shield]: https://img.shields.io/github/issues/pencil236/read-frog?style=flat-square&labelColor=black
[issues-link]: https://github.com/pencil236/read-frog/issues
