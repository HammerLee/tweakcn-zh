import { LOCAL_FONT_INFOS } from "@/config/local-fonts";
import { type FontInfo } from "@/types/fonts";

/**
 * 离线字体加载层。
 *
 * 文件名保留了上游的 google-fonts 叫法，但这里**不再请求任何外部服务**：
 * 所有 woff2 已在构建期由 `npm run fetch-fonts` 抓到 public/fonts/，
 * 可搜索的字体目录来自 config/local-fonts.ts。
 */
export const LOCAL_FONTS_CSS_URL = "/fonts/fonts.css";

/** 字体目录（原为 Google Fonts API 全量目录，现在就是本地内置的那批） */
export async function fetchGoogleFonts(): Promise<FontInfo[]> {
  return LOCAL_FONT_INFOS;
}

/** 所有内置字体都在同一个 css 里，按族取 URL 已无意义 */
export function buildFontCssUrl(_family?: string, _weights: string[] = ["400"]): string {
  return LOCAL_FONTS_CSS_URL;
}

/**
 * 确保本地字体样式表已挂载。
 * app/layout.tsx 已静态引入，这里只是给运行时切换字体的调用方兜底。
 */
export function loadGoogleFont(_family?: string, _weights: string[] = ["400", "700"]): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${LOCAL_FONTS_CSS_URL}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LOCAL_FONTS_CSS_URL;
  document.head.appendChild(link);
}
