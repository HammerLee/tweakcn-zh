/**
 * 一次性把 config/local-fonts.ts 里声明的字体抓成本地 woff2，产出：
 *   public/fonts/fonts.css        —— 手写 @font-face，src 指向本地文件
 *   public/fonts/files/*.woff2
 *
 * 只在联网机器上跑（`npm run fetch-fonts`）；离线机拿到的是产物，不再请求 googleapis.com。
 * 只保留 latin / latin-ext 子集，避免体积失控。
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

import { LOCAL_FONTS } from "../config/local-fonts";

const KEEP_SUBSETS = new Set(["latin", "latin-ext"]);
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// npm 脚本总是在项目根目录执行
const root = process.cwd();
const outDir = path.join(root, "public/fonts");
const filesDir = path.join(outDir, "files");

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

/** 拉一个 css2 family 参数，返回 CSS 文本；非 2xx 抛错 */
async function fetchFamilyCss(family: string): Promise<string> {
  const url = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
  return res.text();
}

type Face = { subset: string; block: string };

/** 把 CSS 拆成 @font-face 块，subset 取自 Google 的 latin / latin-ext 注释 */
function parseBlocks(css: string): Face[] {
  const blocks: Face[] = [];
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) blocks.push({ subset: m[1], block: m[2] });
  return blocks;
}

async function main() {
  await rm(filesDir, { recursive: true, force: true });
  await mkdir(filesDir, { recursive: true });

  const urlToName = new Map<string, string>();
  const faces: string[] = [];
  const failed: string[] = [];

  for (const font of LOCAL_FONTS) {
    // 轴组合写错时 Google 会 400；退到常用字重再试一次，别让一个族拖垮整批。
    const base = font.css2.split(":")[0];
    const attempts = [font.css2, `${base}:wght@400;700`, `${base}:wght@400`];
    let css: string | null = null;
    let lastError: Error | undefined;
    for (const spec of attempts) {
      try {
        css = await fetchFamilyCss(spec);
        break;
      } catch (error) {
        lastError = error as Error;
      }
    }
    if (!css) {
      failed.push(`${font.family}: ${lastError?.message}`);
      console.warn(`  ✗ ${font.family} — ${lastError?.message}`);
      continue;
    }

    const kept = parseBlocks(css).filter((b) => KEEP_SUBSETS.has(b.subset));
    if (!kept.length) {
      failed.push(`${font.family}: 没有 latin/latin-ext 字面`);
      console.warn(`  ✗ ${font.family} — 无可用子集`);
      continue;
    }

    for (const { subset, block } of kept) {
      const hrefs = [...block.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
      for (const href of hrefs) {
        if (!urlToName.has(href)) {
          const ext = path.posix.extname(new URL(href).pathname) || ".woff2";
          urlToName.set(href, `${slug(font.family)}-${subset}${ext}`);
        }
      }
      faces.push(
        block.replace(
          /url\((https:\/\/[^)]+\.woff2)\)/g,
          (_all, href: string) => `url(/fonts/files/${urlToName.get(href)})`
        )
      );
    }
    console.log(`  ✓ ${font.family} — ${kept.length} 个字面`);
  }

  let bytes = 0;
  for (const [href, file] of urlToName) {
    const res = await fetch(href, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`下载 ${href} 失败: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(filesDir, file), buf);
    bytes += buf.length;
  }

  const banner = `/* 由 scripts/fetch-local-fonts.ts 生成，勿手改。
   离线可用：所有 woff2 都在 /fonts/files/ 下，不请求 googleapis.com。 */\n`;
  await writeFile(path.join(outDir, "fonts.css"), banner + faces.join("\n") + "\n");

  console.log(
    `\n共 ${urlToName.size} 个 woff2 文件，${(bytes / 1024 / 1024).toFixed(1)} MB，` +
      `${faces.length} 个 @font-face`
  );
  if (failed.length) {
    console.log(`\n失败 ${failed.length} 个：\n  ` + failed.join("\n  "));
    console.log("（这些族在离线机会回退到系统字体，不影响其它功能）");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
