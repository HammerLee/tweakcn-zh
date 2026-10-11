import { LOCAL_FONT_INFOS } from "@/config/local-fonts";
import { type FontCategory, type FontInfo } from "@/types/fonts";

// Categories mapped to their display names and common fallbacks
export const FONT_CATEGORIES = {
  "sans-serif": {
    label: "Sans Serif",
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  serif: {
    label: "Serif",
    fallback: "ui-serif, Georgia, serif",
  },
  monospace: {
    label: "Monospace",
    fallback:
      "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  display: {
    label: "Display",
    fallback: "ui-serif, Georgia, serif",
  },
  handwriting: {
    label: "Handwriting",
    fallback: "cursive",
  },
} as const;
// 离线可选字体目录 = 内置字体（唯一数据源：config/local-fonts.ts）
// 新增字体改那里并跑 `npm run fetch-fonts`，不要在此处硬编码。
export const FALLBACK_FONTS: FontInfo[] = LOCAL_FONT_INFOS;

// Build font-family value for CSS
// e.g., font: "Inter", category: "sans-serif" -> "Inter, ui-sans-serif, system-ui, sans-serif"
export function buildFontFamily(fontFamily: string, category: FontCategory): string {
  return `${fontFamily}, ${SYSTEM_FONTS_FALLBACKS[category]}`;
}

// Extract font family name from CSS font-family value
// e.g., "Inter, ui-sans-serif, system-ui, sans-serif" -> "Inter"
export function extractFontFamily(fontFamilyValue: string): string | null {
  if (!fontFamilyValue) return null;

  // Split by comma and get the first font
  const firstFont = fontFamilyValue.split(",")[0].trim();

  // Remove quotes if present
  const cleanFont = firstFont.replace(/['"]/g, "");

  // Skip system fonts
  if (SYSTEM_FONTS.includes(cleanFont.toLowerCase())) return null;
  return cleanFont;
}

// Get default weights for a font based on available variants
export function getDefaultWeights(variants: string[]): string[] {
  const weightMap = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
  const availableWeights = variants.filter((variant) => weightMap.includes(variant));

  if (availableWeights.length === 0) return ["400"]; // Fallback to normal weight

  const preferredWeights = ["400", "500", "600", "700"];
  const selectedWeights = preferredWeights.filter((weight) => availableWeights.includes(weight));

  // If none of the preferred weights are available, use the first two available
  if (selectedWeights.length === 0) {
    const fallbackWeights = availableWeights.slice(0, 2);
    return fallbackWeights.sort((a, b) => parseInt(a) - parseInt(b));
  }

  // Return up to 4 weights, starting with preferred ones
  const finalWeights = [
    ...selectedWeights,
    ...availableWeights.filter((w) => !selectedWeights.includes(w)),
  ].slice(0, 4);

  // Sort weights numerically for Google Fonts API requirement
  return finalWeights.sort((a, b) => parseInt(a) - parseInt(b));
}

// Check if a font is available using the native document.fonts API
export function isFontLoaded(family: string, weight = "400"): boolean {
  if (typeof document === "undefined" || !document.fonts) return false;

  // Use the native FontFaceSet.check() method
  return document.fonts.check(`${weight} 16px "${family}"`);
}

// Wait for a font to load using the native document.fonts API
export async function waitForFont(
  family: string,
  weight = "400",
  timeout = 3000
): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return false;

  const font = `${weight} 16px "${family}"`;

  try {
    // Use the native document.fonts.load() method
    await Promise.race([
      document.fonts.load(font),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)),
    ]);

    return document.fonts.check(font);
  } catch {
    return false;
  }
}

export const SYSTEM_FONTS = [
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
];

export const SYSTEM_FONTS_FALLBACKS = {
  "sans-serif": "ui-sans-serif, sans-serif, system-ui",
  serif: "ui-serif, serif",
  monospace: "ui-monospace, monospace",
  display: "ui-serif, serif",
  handwriting: "cursive",
};
