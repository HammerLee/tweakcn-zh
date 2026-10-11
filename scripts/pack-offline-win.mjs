#!/usr/bin/env node
/**
 * 产出 Windows 11 离线可运行的分发包。
 *
 * 背景：node_modules 里的原生二进制是分平台的（Mac 上是 swc-darwin-arm64，
 * Windows 需要 swc-win32-x64-msvc）。直接把 Mac 的 node_modules 拷过去，
 * Next 启动时会发现缺当前平台的 SWC 并试图联网下载 —— 离线机必然失败。
 * 所以这里用 npm 的 --os/--cpu 开关，在 Mac 上装出一份 **win32/x64** 的依赖树。
 *
 * 用法（必须显式指定输出目录）：
 *   node scripts/pack-offline-win.mjs --out ~/Downloads
 *   node scripts/pack-offline-win.mjs --out /Volumes/U盘 --no-zip
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function parseArgs(argv) {
  const out = { outDir: "", zip: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.outDir = path.resolve(expandHome(argv[++i] ?? ""));
    else if (a === "--no-zip") out.zip = false;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function expandHome(p) {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

function run(cmd, args, opts = {}) {
  console.log(`  $ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: opts.cwd ?? PROJECT_ROOT, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} 失败 (exit ${r.status})`);
}

function step(msg) {
  console.log(`\n${"=".repeat(8)} ${msg} ${"=".repeat(Math.max(0, 46 - msg.length))}`);
}

const SOURCE_EXCLUDES = [
  "node_modules",
  ".next",
  ".git",
  "out",
  "dist",
  "test-results",
  ".DS_Store",
  "*.log",
  // 不把 Mac 的环境变量（含真实密钥）带过去，离线包内单独生成
  ".env",
  ".env.local",
  ".env*.local",
  // 上游用 pnpm 的锁文件；本包一律走 npm，留着只会让安装器选错
  "pnpm-lock.yaml",
];

/** 需要校验的 win32/x64 原生包，缺一个就可能在离线机上炸 */
const REQUIRED_WIN_NATIVE = [
  "@next/swc-win32-x64-msvc",
  "@tailwindcss/oxide-win32-x64-msvc",
  "lightningcss-win32-x64-msvc",
  "@esbuild/win32-x64",
  "@img/sharp-win32-x64",
  "@unrs/resolver-binding-win32-x64-msvc",
];

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.outDir) {
    console.log(
      "用法: node scripts/pack-offline-win.mjs --out <输出目录> [--no-zip]\n" +
        "输出目录必须已存在且不是项目本身。"
    );
    process.exit(args.help ? 0 : 1);
  }
  if (!fs.existsSync(args.outDir)) {
    throw new Error(`输出目录不存在：${args.outDir}`);
  }
  if (args.outDir === PROJECT_ROOT || args.outDir.startsWith(PROJECT_ROOT + path.sep)) {
    throw new Error("别把离线包输出到项目目录里，换个路径（例如 ~/Downloads）");
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const pkgName = `tweakcn-win-x64-${stamp}`;
  const staging = path.join(args.outDir, pkgName);
  const appDir = path.join(staging, "app");

  step("1/5 清理并复制源码");
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(appDir, { recursive: true });
  const excludeArgs = SOURCE_EXCLUDES.flatMap((e) => [`--exclude=${e}`]);
  run("rsync", ["-a", ...excludeArgs, `${PROJECT_ROOT}/`, `${appDir}/`]);

  step("2/5 按 win32/x64 安装依赖（这一步要联网，只在 Mac 上跑）");
  run(
    "npm",
    [
      "ci",
      "--os=win32",
      "--cpu=x64",
      "--force",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--registry=https://registry.npmmirror.com",
    ],
    { cwd: appDir }
  );

  step("3/5 校验 Windows 原生二进制");
  const readJson = (...p) =>
    JSON.parse(fs.readFileSync(path.join(appDir, "node_modules", ...p), "utf8"));
  const missing = REQUIRED_WIN_NATIVE.filter(
    (p) => !fs.existsSync(path.join(appDir, "node_modules", p))
  );
  if (missing.length) {
    throw new Error(
      `缺少 win32/x64 原生包：\n  ${missing.join("\n  ")}\n` +
        "没有它们，离线机上 Next 会试图联网下载并失败。"
    );
  }
  // Next 的 SWC 绑定版本不跟 next 的发布号走（15.4.10 的 next 声明的是 15.4.8 的绑定），
  // 唯一正确的判定是：装上的包必须正好等于 next 自己 optionalDependencies 里写的版本，
  // 否则 next 在离线机上会 require 失败并试图联网下载 —— 用户之前就是这么炸的。
  const nextPkg = readJson("next", "package.json");
  const expectedSwc = nextPkg.optionalDependencies?.["@next/swc-win32-x64-msvc"];
  const installedSwc = readJson("@next/swc-win32-x64-msvc", "package.json").version;
  if (!expectedSwc || installedSwc !== expectedSwc) {
    throw new Error(
      `next@${nextPkg.version} 需要 @next/swc-win32-x64-msvc@${expectedSwc}，` +
        `实际装上的是 ${installedSwc}，离线机会联网下载并失败`
    );
  }
  console.log(`  ✓ next@${nextPkg.version} + swc-win32-x64-msvc@${installedSwc}（与声明一致）`);

  step("4/5 生成离线机用的 .env.local 与启动脚本");
  fs.writeFileSync(
    path.join(appDir, ".env.local"),
    [
      "# 离线本地版：所有外部服务留空，只有 BASE_URL 需要",
      'BASE_URL="http://localhost:3000"',
      "",
      "# 下面这些一旦填了，应用就会去连外网（Neon/PostHog/AI/Google Fonts）。",
      "# 离线机上请保持为空。",
      'DATABASE_URL=""',
      'BETTER_AUTH_SECRET="local-offline-secret-not-a-real-secret"',
      'GITHUB_CLIENT_ID=""',
      'GITHUB_CLIENT_SECRET=""',
      'GOOGLE_CLIENT_ID=""',
      'GOOGLE_CLIENT_SECRET=""',
      'GOOGLE_API_KEY=""',
      'GROQ_API_KEY=""',
      'NEXT_PUBLIC_POSTHOG_KEY=""',
      "",
    ].join("\n")
  );

  // 文件名一律用 ASCII：zip 命令行不会给条目名打 UTF-8 标记，
  // 中文文件名到 Windows 资源管理器里会被按 GBK 解成乱码，双击就找不到了。
  const bats = {
    "1-build.bat": bat(
      "npm run build:webpack",
      "首次使用必须先跑这个（webpack 模式，不依赖 Turbopack 的 VC++ 运行库）"
    ),
    "2-start.bat": bat("npm run start", "构建完成后用这个，启动快、占内存少"),
    "3-dev.bat": bat("npm run dev:webpack", "改代码时才用；不需要预先构建，但内存占用高"),
  };
  for (const [name, content] of Object.entries(bats)) {
    fs.writeFileSync(path.join(staging, name), content, { encoding: "utf8" });
  }
  fs.writeFileSync(path.join(staging, "README-Windows.txt"), readme(nextPkg.version), "utf8");

  step("5/5 压缩");
  let zipPath = null;
  if (args.zip) {
    zipPath = path.join(args.outDir, `${pkgName}.zip`);
    fs.rmSync(zipPath, { force: true });
    run("zip", ["-r", "-q", zipPath, pkgName], { cwd: args.outDir });
    fs.rmSync(staging, { recursive: true, force: true });
    const mb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(0);
    console.log(`  ✓ ${zipPath} (${mb} MB)`);
  } else {
    console.log(`  ✓ ${staging}`);
  }

  console.log(
    "\n拷到 Win11 后：解压 → 装 Node 22（若没装）→ 双击 1-build.bat → 2-start.bat → " +
      "浏览器打开 http://localhost:3000/editor/theme"
  );
}

function bat(command, comment) {
  return [
    "@echo off",
    "chcp 65001 >nul",
    'cd /d "%~dp0app"',
    `rem ${comment}`,
    "where node >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [错误] 没找到 node，请先安装 Node.js 22 并加入 PATH",
    "  pause",
    "  exit /b 1",
    ")",
    command,
    "set EC=%ERRORLEVEL%",
    'if not "%EC%"=="0" (',
    "  echo [失败] 退出码 %EC%",
    "  pause",
    ")",
    "",
  ].join("\r\n");
}

function readme(nextVersion) {
  return [
    "tweakcn 中文离线版 —— Windows 11 使用说明",
    "==========================================",
    "",
    `本包已内置 win32/x64 的原生依赖（next@${nextVersion}），全程不需要联网。`,
    "",
    "前置：装一次 Node.js 22（ LTS 安装包，勾选 Add to PATH ）。",
    "",
    "步骤：",
    "  1. 双击 1-build.bat   首次必须，几分钟，产出 .next/（构建脚本内部会切 UTF-8，中文提示正常显示）",
    "  2. 双击 2-start.bat   之后每次用这个",
    "  3. 浏览器打开 http://localhost:3000/editor/theme",
    "",
    "改配色：左侧改颜色 → 右上角 Code → CSS Variables → 复制进自己项目。",
    "换语言：右下角「中文 / EN」浮动按钮。",
    "换字体：左侧 Controls → Typography 面板，直接在 Sans-Serif / Serif / Mono 输入字体名。",
    "        内置的 27 个字体族（Inter、Lora、JetBrains Mono 等）已离线打包，填名字就能用；",
    "        也可以填 Windows 系统字体名，如 Microsoft YaHei。",
    "",
    "常见问题：",
    "  · 提示端口被占用：先关掉另一个 3000 端口的程序。",
    "  · 保存/登录/分享/AI 生成主题：这些是云端功能，离线版不可用。",
    "  · 换了 next 版本或新增字体：回到 Mac 上重跑 node scripts/pack-offline-win.mjs --out ~/Downloads",
    "",
  ].join("\r\n");
}

try {
  main();
} catch (error) {
  console.error(`\n[出错] ${error.message}`);
  process.exit(1);
}
