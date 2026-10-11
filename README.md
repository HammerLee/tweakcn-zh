<div align="center">
  <h1>tweakcn 中文本地化分支</h1>
  <p>可视化 shadcn/ui 主题编辑器 · 中文界面 · 可完全离线部署</p>
</div>

<div align="center">
  <a href="https://vercel.com/oss">
    <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
  </a>
  <br />
  <br />
  <a href="https://discord.gg/Phs4u2NM3n" target="_blank">
    <img alt="Discord" src="https://img.shields.io/discord/1353416868769173576?style=for-the-badge&logo=discord&logoColor=%23ffffff">
  </a>
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/jnsahaj/tweakcn?style=for-the-badge&logo=github">
  <a href="https://x.com/iamsahaj_xyz">
    <img alt="X (formerly Twitter) URL" src="https://img.shields.io/twitter/url?url=https%3A%2F%2Fx.com%2Fiamsahaj_xyz&style=for-the-badge&logo=x&label=%40iamsahaj_xyz&color=%2300000000" />
  </a>
</div>

<br />

> **关于本仓库**：这是 [jnsahaj/tweakcn](https://github.com/jnsahaj/tweakcn) 的中文本地化分支。原版是一个很强的联网 SaaS（登录、云端保存、AI 生成主题），本分支在它之上做了三件事：**中文界面**、**从单个颜色生成整套主题**、**完全离线部署**（含内置字体与 Windows 离线打包脚本）。原项目以 Apache License 2.0 授权，版权归原作者所有。中文操作说明见 [使用教程.md](使用教程.md)。

**[tweakcn](https://tweakcn.com)** is a powerful Visual Theme Editor for tailwind CSS & shadcn/ui components. It comes with Beautiful theme presets to get started, while aiming to offer advanced customisation for each aspect of your UI.

![tweakcn.com](public/og-image.v050725.png)

## 本分支相对原版改了什么

| 功能 | 说明 | 相关文件 |
|---|---|---|
| **中文界面** | 右下角「中文 / EN」浮动按钮一键整站切换，选择记在浏览器里。个别文案未覆盖时显示英文，补译法往词典里加一行 | `lib/zh-dictionary.ts` |
| **从颜色生成整套配色** | 工具栏魔棒按钮。给一个主色 / 一个背景色 / 两个都给，自动推导全套语义色，含中性色染色强度、对比度档位、图表配色策略、输出色值格式，下方实时预览深浅两套 | 详见 [使用教程.md](使用教程.md) §7 |
| **内置 27 个字体族，离线可用** | 原版运行时去 `fonts.googleapis.com` 拉字体；本分支把 woff2 全部下载到仓库里，浏览器只从 `localhost` 取 | `config/local-fonts.ts`、`public/fonts/`、`scripts/fetch-local-fonts.ts` |
| **切断所有外部请求** | 移除 PostHog 统计上报、Twitter 头像、GitHub star 数拉取、`live-preview.js` 里的 Google Fonts 请求；登录 / 云端保存 / 分享 / 发布 / AI 生成等联网功能从界面移除 | `lib/analytics.ts`、`lib/app-url.ts`、`public/live-preview.js` 等 |
| **Windows 离线依赖打包脚本** | 在能上网的 macOS/Linux 上产出一份含 win32/x64 原生二进制的完整依赖树并压缩，解压到断网电脑即可运行 | `scripts/pack-offline-win.mjs`（`npm run pack:win`） |
| **中文文档** | 一份从零开始的中文操作教程 + 本 README 的离线部署说明 | `使用教程.md` |
| **依赖锁文件走国内镜像** | `package-lock.json` 的 `resolved` 地址指向 npmmirror | `package-lock.json` |

## 离线部署（本分支的主要用途）

### 先理解一个坑

`node_modules` 里的**原生二进制是分平台的**：macOS ARM 上是 `@next/swc-darwin-arm64`，Windows x64 需要 `@next/swc-win32-x64-msvc`。

- 把 Mac 的目录整个拷给 Windows → Next 启动时发现缺当前平台的 SWC，会**尝试联网下载** → 离线机必然报错。
- 在离线机上 `git clone` 也解决不了 → 仓库不含 `node_modules`，而离线机 `npm install` 不了。

所以正确做法是：**在能上网的电脑上装出一份目标平台的依赖树，连源码一起打包带过去。**

### 路线 A：交付给完全断网的 Windows 电脑（推荐）

**第 1 步 —— 在能上网的 macOS / Linux 上打包**

前置条件：

| 要求 | 说明 |
|---|---|
| 操作系统 | macOS 或 Linux。脚本用了 `rsync` 和 `zip` 命令，Windows 上不能直接跑 |
| Node.js | 18+ 即可。脚本只用 Node 内置模块，**打包机上不需要先 `npm install`** |
| 网络 | 能访问 `registry.npmmirror.com`（脚本里写死用这个镜像源装 win32 依赖） |
| 磁盘 | 压缩包约 **260 MB**（实测 263 MB），另需一个临时暂存目录 |

```bash
git clone https://github.com/HammerLee/tweakcn-zh.git
cd tweakcn-zh
npm run pack:win -- --out ~/Downloads     # 产出 win32/x64 离线包
```

`--out` 是**必填**参数，而且**不能指向仓库内部**（脚本会主动拒绝），指定到一个仓库外的目录，比如 `~/Downloads`。加 `--no-zip` 可以只留解压好的目录、不压缩，方便先看内容。

脚本做的事，按顺序：rsync 源码（剔除 `node_modules` / `.next` / `.git` / `.env*`）→ `npm ci --os=win32 --cpu=x64` 装依赖 → 校验 6 个 win32 原生包齐全、且 `@next/swc-win32-x64-msvc` 的版本**正好等于 `next` 自己声明的绑定版本**（不等就会触发联网下载；注意 `next@15.4.10` 声明的绑定是 `15.4.8`，这是 Next 的正常设计，不是错误）→ 生成一份**外部服务全部留空**的 `.env.local`（你本机的真实密钥不会被带过去）→ 生成 `1-build.bat` / `2-start.bat` / `3-dev.bat` 和 `README-Windows.txt` → 压缩。

> bat 文件名一律用 ASCII：macOS 的 `zip` 命令行不会给条目名打 UTF-8 标记，中文名到 Windows 资源管理器里会被按 GBK 解成乱码，双击就找不到了。

**第 2 步 —— 把 zip 带进离线环境**（U 盘 / 内网共享，任何方式都行）

**第 3 步 —— 在离线 Windows 电脑上运行**

1. 装一次 **Node.js 22 LTS**（离线机装不了软件的话，找一台能上网的机器下载 nodejs.org 的 `.msi` 离线安装包带过去）。解压路径**必须纯英文、无空格**，例如 `D:\tweakcn`
2. 双击 `1-build.bat` —— 首次必须跑，几分钟，产出 `.next/`（走 webpack 模式，绕开 Turbopack 对 VC++ 运行库的依赖）
3. 双击 `2-start.bat`
4. 浏览器打开 <http://localhost:3000/editor/theme>

### 路线 B：在离线的 macOS / Linux 上直接跑

打包脚本只产 Windows 包，这条路线自己动手：在**能上网的同平台机器**上 `npm ci`，然后把**整个项目目录（含 `node_modules`）**拷到离线机。前提是两台机器平台和架构一致（同为 `darwin/arm64`，或同为 `linux/x64`），否则又会撞上 §「先理解一个坑」里那个 SWC 联网下载问题。

```bash
npm run build && npm run start          # 生产模式，推荐
npm run dev                             # 开发模式，改代码时才用
```

macOS / Linux 上用默认的 Turbopack 变体没问题。**只有 Windows 必须改用 `build:webpack` / `dev:webpack`** —— Turbopack 的原生包在 Windows 上还要 VC++ 运行库，管控机往往装不了；路线 A 生成的 bat 已经用了 webpack 变体。

### 两种路线都要注意的

- **不需要任何 API key。** 云端功能（登录、保存、分享、AI 生成）已经从界面移除，`.env.local` 里那些 key 全部留空即可。只有 `BASE_URL` 建议填 `http://localhost:3000`。
- 想从零开始配环境，参照 `.env.example`：`cp .env.example .env.local` 然后把除 `BASE_URL` 以外的值清空。

## Run Locally（能上网的电脑，含云端功能）

如果你要的是原版那套完整功能（登录、云端保存、AI 生成），需要自己准备 Neon PostgreSQL 和 OAuth key：

### Prerequisites

- Node.js 18.18+ / 20+ / 22
- npm

### Installation

```bash
git clone https://github.com/HammerLee/tweakcn-zh.git
cd tweakcn-zh
npm install
cp .env.example .env.local     # 填入 Neon 连接串、GitHub/Google OAuth、Groq key
npm run dev
```

打开 <http://localhost:3000>。

## 验证状态（说清楚哪些实测过、哪些没有）

| 环境 | 状态 |
|---|---|
| macOS ARM，`npm run build:webpack` + `next start` | ✅ 实测通过：构建 EXIT=0，`/editor/theme` 与 `/pricing` 共 64 个资源条目里**非 localhost 请求为 0**，字体从 `/fonts/files/*.woff2` 加载，中英文切换与「从颜色生成」对话框正常 |
| **真实 Windows 11 离线机** | ⚠️ **尚未在真机验证过。** 上面那套流程在 Mac 上等价验证通过（webpack 构建 + 生产启动 + 零外部请求），但 Windows 上可能遇到的问题（VC++ 运行库、Node 版本、内存不足、路径过长）没有实机跑过。压缩包内的 `README-Windows.txt` 列了常见报错的排查方向 |
| 离线 Linux | ⚠️ 未验证，路线 B 属于按平台二进制原理推导 |

## 已知限制

- 云端相关功能（登录 / 保存主题到账户 / 分享链接 / 发布 / AI 生成主题）在离线模式下已从界面移除，用 **Import / Export JSON** 存档主题。
- 内置 27 个字体族已覆盖常用需求；要加新字体在能上网的机器上跑 `npm run fetch-fonts`（先在 `config/local-fonts.ts` 里加一条），再重新打包。也可以直接填系统字体名，如 `Microsoft YaHei`。
- 主题预设、组件预览、对比度检查、CSS 变量导出等核心能力全部离线可用。

## Motivation

Websites made with shadcn/ui famously look the same. tweakcn is a tool that helps you customize shadcn/ui components visually, to make your components stand-out. The goal is to build a platform where a user can discover endless customization options and then have the ability to put their own twist on it.

## Contributors

<a href="https://github.com/jnsahaj/tweakcn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jnsahaj/tweakcn" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

### Interested in Contributing?

Contributions are welcome! Please feel free to submit a Pull Request.

# Star History

<p align="center">
  <a target="_blank" href="https://star-history.com/#jnsahaj/tweakcn&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=jnsahaj/tweakcn&type=Date&theme=dark">
      <img alt="GitHub Star History for jnsahaj/tweakcn" src="https://api.star-history.com/svg?repos=jnsahaj/tweakcn&type=Date">
    </picture>
  </a>
</p>

<!-- GitAds-Verify: HX84XPI5OQ816367AROGJ9SROARUHQER -->
