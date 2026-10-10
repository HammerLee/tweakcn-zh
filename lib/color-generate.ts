// 从颜色生成整套主题配色（浅色 + 深色）。
// 思路：以 OKLCH 为工作空间——输入色确定"色调基因"（H 与 C），
// 各语义变量按 shadcn/Radix 的成熟规则分配亮度与彩度，
// 文字与背景的对比度用 WCAG 公式校验并自动校准。输出格式可选。

import { clampChroma, converter, formatHex, formatHsl, formatRgb, parse } from "culori";

type Och = { l: number; c: number; h: number };

export type OutputFormat = "oklch" | "hex" | "rgb" | "hsl";
export type ChartStrategy = "analogous" | "complementary" | "vivid";
export type AccentStrategy = "same" | "complementary" | "analogous";
export type ContrastLevel = "standard" | "high";
export type GenerateMode = "primary" | "background" | "both";

export interface GenerateOptions {
  mode: GenerateMode;
  primary: string;
  background: string;
  neutralTint: boolean;
  tintStrength: number; // 0-100
  contrast: ContrastLevel;
  chartStrategy: ChartStrategy;
  accentStrategy: AccentStrategy;
  format: OutputFormat;
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");
const round = (v: number, d = 3) => Number(v.toFixed(d));
const hueAdd = (h: number, d: number) => (h + d + 360) % 360;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** 解析任意常见格式：#hex / rgb() / hsl() / oklch() / 颜色名 */
export function parseColor(input: string): Och | null {
  if (!input?.trim()) return null;
  const parsed = parse(input.trim());
  if (!parsed) return null;
  const o = toOklch(parsed);
  if (!o || typeof o.l !== "number" || Number.isNaN(o.l)) return null;
  return { l: o.l, c: Math.max(0, o.c ?? 0), h: ((o.h ?? 0) % 360 + 360) % 360 };
}

function formatColor(color: Och, format: OutputFormat): string {
  const obj = { mode: "oklch" as const, ...color };
  switch (format) {
    case "oklch":
      return `oklch(${round(color.l)} ${round(color.c)} ${round(color.h, 1)})`;
    case "hex":
      return formatHex(clampChroma(obj, "oklch")) ?? "#000000";
    case "rgb":
      return formatRgb(clampChroma(obj, "oklch")) ?? "rgb(0 0 0)";
    case "hsl":
      return formatHsl(clampChroma(obj, "oklch")) ?? "hsl(0 0% 0%)";
  }
}

function luminance(color: Och): number {
  const rgb = toRgb({ mode: "oklch", ...color });
  if (!rgb) return 0;
  const f = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
}

export function contrastRatio(a: Och, b: Och): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 在背景上选一个达标的前景色：自动在亮字/暗字之间选择，不达标则逐步拉开亮度 */
function pickForeground(
  bg: Och,
  hue: number,
  tintC: number,
  contrastTarget: number,
  preferDark: boolean
): Och {
  const light: Och = { l: 0.985, c: 0, h: hue };
  const dark: Och = { l: 0.205, c: tintC, h: hue };
  let base = preferDark
    ? dark
    : contrastRatio(light, bg) >= contrastRatio(dark, bg)
      ? light
      : dark;
  const dir = base.l > 0.5 ? 1 : -1; // 亮字向上、暗字向下拉开
  let candidate = base;
  for (let i = 0; i < 40 && contrastRatio(candidate, bg) < contrastTarget; i++) {
    candidate = { ...candidate, l: clamp(candidate.l + dir * 0.02, 0.02, 0.995) };
  }
  base = candidate;
  return base;
}

interface NeutralParams {
  hue: number;
  tint: number; // 0-1 染色强度系数
}

function neutralC(base: number, tint: number) {
  return clamp(base * tint, 0, 0.045);
}

function chartColors(
  primary: Och,
  strategy: ChartStrategy,
  isDark: boolean,
  format: OutputFormat
): string[] {
  const h = primary.h;
  const baseL = isDark ? 0.72 : 0.62;
  const spread: Array<{ dh: number; dl: number; dc: number }> =
    strategy === "vivid"
      ? [
          { dh: 0, dl: 0, dc: 0 },
          { dh: 72, dl: 0.04, dc: -0.02 },
          { dh: 144, dl: -0.03, dc: 0.02 },
          { dh: 216, dl: 0.05, dc: -0.03 },
          { dh: 288, dl: -0.05, dc: 0.01 },
        ]
      : strategy === "complementary"
        ? [
            { dh: 0, dl: 0, dc: 0 },
            { dh: 180, dl: 0.02, dc: -0.04 },
            { dh: 25, dl: -0.05, dc: 0.03 },
            { dh: 205, dl: 0.05, dc: -0.02 },
            { dh: 90, dl: -0.02, dc: 0.01 },
          ]
        : [
            { dh: 0, dl: 0, dc: 0 },
            { dh: 14, dl: 0.07, dc: -0.03 },
            { dh: -14, dl: -0.07, dc: -0.02 },
            { dh: 28, dl: 0.12, dc: -0.05 },
            { dh: -28, dl: -0.12, dc: 0 },
          ];
  return spread.map(({ dh, dl, dc }) => {
    const color: Och = {
      l: clamp(baseL + dl, 0.15, 0.92),
      c: clamp(primary.c * 0.9 + dc, 0.04, 0.25),
      h: hueAdd(h, dh),
    };
    return formatColor(color, format);
  });
}

function buildLight(
  primary: Och,
  neutral: NeutralParams,
  opts: GenerateOptions,
  bgOverride?: Och
): Record<string, string> {
  const f = (c: Och) => formatColor(c, opts.format);
  const tint = neutral.tint;
  const highContrast = opts.contrast === "high";
  const bg: Och =
    bgOverride ?? { l: 0.985, c: neutralC(0.012, tint), h: neutral.hue };
  const fg = pickForeground(bg, neutral.hue, neutralC(0.02, tint), 7, false);
  const primaryFg = pickForeground(primary, primary.h, 0, 4.5, primary.l >= 0.55);
  const destructive: Och = { l: 0.545, c: 0.19, h: 25 };
  const accent: Och = { l: 0.945, c: neutralC(Math.max(primary.c * 0.55, 0.03), tint), h: primary.h };
  const charts = chartColors(primary, opts.chartStrategy, false, opts.format);
  const card: Och = { l: 0.995, c: neutralC(0.008, tint), h: neutral.hue };
  const muted: Och = { l: 0.965, c: neutralC(0.014, tint), h: neutral.hue };
  const secondary: Och = { l: 0.955, c: neutralC(Math.max(primary.c * 0.4, 0.02), tint), h: primary.h };

  return {
    background: f(bg),
    foreground: f(fg),
    card: f(card),
    "card-foreground": f(pickForeground(card, neutral.hue, neutralC(0.02, tint), 7, false)),
    popover: f(card),
    "popover-foreground": f(pickForeground(card, neutral.hue, neutralC(0.02, tint), 7, false)),
    primary: f(primary),
    "primary-foreground": f(primaryFg),
    secondary: f(secondary),
    "secondary-foreground": f(pickForeground(secondary, primary.h, 0, 4.5, false)),
    muted: f(muted),
    "muted-foreground": f({
      l: highContrast ? 0.42 : 0.52,
      c: neutralC(0.02, tint),
      h: neutral.hue,
    }),
    accent: f(accent),
    "accent-foreground": f(pickForeground(accent, primary.h, 0, 4.5, false)),
    destructive: f(destructive),
    "destructive-foreground": f(pickForeground(destructive, 25, 0, 4.5, false)),
    border: f({ l: 0.9, c: neutralC(0.015, tint), h: neutral.hue }),
    input: f({ l: 0.88, c: neutralC(0.015, tint), h: neutral.hue }),
    ring: f({ l: clamp(primary.l, 0.4, 0.65), c: clamp(primary.c * 0.8, 0.05, 0.2), h: primary.h }),
    "chart-1": charts[0],
    "chart-2": charts[1],
    "chart-3": charts[2],
    "chart-4": charts[3],
    "chart-5": charts[4],
    sidebar: f({ l: 0.972, c: neutralC(0.014, tint), h: neutral.hue }),
    "sidebar-foreground": f(pickForeground({ l: 0.972, c: 0, h: neutral.hue }, neutral.hue, neutralC(0.02, tint), 7, false)),
    "sidebar-primary": f(primary),
    "sidebar-primary-foreground": f(primaryFg),
    "sidebar-accent": f({ l: 0.94, c: neutralC(Math.max(primary.c * 0.5, 0.03), tint), h: primary.h }),
    "sidebar-accent-foreground": f(pickForeground({ l: 0.94, c: 0, h: primary.h }, primary.h, 0, 4.5, false)),
    "sidebar-border": f({ l: 0.912, c: neutralC(0.015, tint), h: neutral.hue }),
    "sidebar-ring": f({ l: clamp(primary.l, 0.4, 0.65), c: clamp(primary.c * 0.8, 0.05, 0.2), h: primary.h }),
    "shadow-color": f({ l: 0, c: 0, h: 0 }),
  };
}

function buildDark(
  primary: Och,
  neutral: NeutralParams,
  opts: GenerateOptions,
  bgOverride?: Och
): Record<string, string> {
  const f = (c: Och) => formatColor(c, opts.format);
  const tint = neutral.tint;
  const highContrast = opts.contrast === "high";
  const bg: Och =
    bgOverride ?? { l: 0.145, c: neutralC(0.014, tint), h: neutral.hue };
  const fg = pickForeground(bg, neutral.hue, neutralC(0.018, tint), 7, false);
  // 深色模式下主色需要提亮才醒目；用户本身给的是亮色则保持
  const darkPrimary: Och =
    primary.l < 0.62
      ? { l: 0.74, c: clamp(primary.c * 1.05, 0.06, 0.19), h: primary.h }
      : primary;
  const primaryFg = pickForeground(darkPrimary, darkPrimary.h, 0, 4.5, darkPrimary.l >= 0.55);
  const destructive: Och = { l: 0.65, c: 0.19, h: 25 };
  const accent: Och = { l: 0.27, c: neutralC(Math.max(darkPrimary.c * 0.5, 0.025), tint), h: darkPrimary.h };
  const charts = chartColors(darkPrimary, opts.chartStrategy, true, opts.format);
  const card: Och = { l: clamp(bg.l + 0.045, 0.15, 0.3), c: bg.c, h: neutral.hue };
  const muted: Och = { l: clamp(bg.l + 0.075, 0.18, 0.34), c: bg.c, h: neutral.hue };
  const secondary: Och = { l: clamp(bg.l + 0.095, 0.2, 0.36), c: Math.max(bg.c * 0.8, 0.02), h: darkPrimary.h };

  return {
    background: f(bg),
    foreground: f(fg),
    card: f(card),
    "card-foreground": f(pickForeground(card, neutral.hue, neutralC(0.018, tint), 7, false)),
    popover: f(card),
    "popover-foreground": f(pickForeground(card, neutral.hue, neutralC(0.018, tint), 7, false)),
    primary: f(darkPrimary),
    "primary-foreground": f(primaryFg),
    secondary: f(secondary),
    "secondary-foreground": f(pickForeground(secondary, darkPrimary.h, 0, 4.5, false)),
    muted: f(muted),
    "muted-foreground": f({
      l: highContrast ? 0.7 : 0.62,
      c: neutralC(0.016, tint),
      h: neutral.hue,
    }),
    accent: f(accent),
    "accent-foreground": f(pickForeground(accent, darkPrimary.h, 0, 4.5, false)),
    destructive: f(destructive),
    "destructive-foreground": f(pickForeground(destructive, 25, 0, 4.5, false)),
    border: f({ l: clamp(bg.l + 0.115, 0.2, 0.38), c: bg.c, h: neutral.hue }),
    input: f({ l: clamp(bg.l + 0.175, 0.26, 0.44), c: bg.c, h: neutral.hue }),
    ring: f({ l: clamp(darkPrimary.l, 0.5, 0.75), c: clamp(darkPrimary.c * 0.8, 0.05, 0.18), h: darkPrimary.h }),
    "chart-1": charts[0],
    "chart-2": charts[1],
    "chart-3": charts[2],
    "chart-4": charts[3],
    "chart-5": charts[4],
    sidebar: f({ l: clamp(bg.l + 0.02, 0.16, 0.3), c: bg.c, h: neutral.hue }),
    "sidebar-foreground": f(pickForeground({ l: clamp(bg.l + 0.02, 0.16, 0.3), c: 0, h: neutral.hue }, neutral.hue, neutralC(0.018, tint), 7, false)),
    "sidebar-primary": f(darkPrimary),
    "sidebar-primary-foreground": f(primaryFg),
    "sidebar-accent": f({ l: clamp(bg.l + 0.125, 0.24, 0.42), c: neutralC(Math.max(darkPrimary.c * 0.5, 0.025), tint), h: darkPrimary.h }),
    "sidebar-accent-foreground": f(pickForeground({ l: clamp(bg.l + 0.125, 0.24, 0.42), c: 0, h: darkPrimary.h }, darkPrimary.h, 0, 4.5, false)),
    "sidebar-border": f({ l: clamp(bg.l + 0.115, 0.2, 0.38), c: bg.c, h: neutral.hue }),
    "sidebar-ring": f({ l: clamp(darkPrimary.l, 0.5, 0.75), c: clamp(darkPrimary.c * 0.8, 0.05, 0.18), h: darkPrimary.h }),
    "shadow-color": f({ l: 0, c: 0, h: 0 }),
  };
}

export interface GeneratedTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
  /** 供预览/复制用的关键色摘要 */
  summary: {
    primary: Och;
    lightBg: Och;
    darkBg: Och;
  };
}

/**
 * 核心入口。
 * - mode=primary：给一个主色，浅色模式原样使用，深色模式自动提亮；
 * - mode=background：给一个背景色（可深可浅），自动作为对应深/浅模式的底色，
 *   并按 accentStrategy 推导配套主色；
 * - mode=both：两者都指定。
 */
export function generateTheme(opts: GenerateOptions): GeneratedTheme {
  const tint = opts.neutralTint ? clamp(opts.tintStrength / 100, 0, 1) : 0;

  const primaryParsed = opts.mode === "background" ? null : parseColor(opts.primary);
  const bgParsed = opts.mode === "primary" ? null : parseColor(opts.background);
  if (opts.mode === "both" && (!primaryParsed || !bgParsed)) {
    throw new Error("invalid color");
  }
  if (opts.mode === "primary" && !primaryParsed) throw new Error("invalid color");
  if (opts.mode === "background" && !bgParsed) throw new Error("invalid color");

  const primary = primaryParsed ?? { l: 0.55, c: 0.18, h: 260 };
  const bg = bgParsed ?? null;

  const neutralHue =
    !opts.neutralTint
      ? 0
      : bg
        ? bg.h
        : primary.h;
  const neutral: NeutralParams = { hue: neutralHue, tint };

  // 深浅两个背景
  let lightBg: Och | undefined;
  let darkBg: Och | undefined;
  if (bg) {
    if (bg.l >= 0.55) {
      // 用户给的是浅色背景：浅色模式原样用（微调到安全范围），深色模式取同色调暗版
      lightBg = { l: clamp(bg.l, 0.9, 0.995), c: clamp(bg.c, 0, 0.06), h: bg.h };
      darkBg = { l: clamp(bg.l - 0.85, 0.1, 0.25), c: clamp(bg.c * 0.7, 0, 0.05), h: bg.h };
    } else {
      // 用户给的是深色背景（如深蓝）：深色模式原样用，浅色模式取同色调极浅版
      darkBg = { l: clamp(bg.l, 0.08, 0.3), c: clamp(bg.c, 0, 0.09), h: bg.h };
      lightBg = { l: 0.982, c: neutralC(clamp(bg.c * 0.8, 0.004, 0.02), tint), h: bg.h };
    }
  }

  // 主色：primary 模式直接用；background 模式按策略推导
  let effectivePrimary = primary;
  if (opts.mode === "background" && bg) {
    const isDarkBg = bg.l < 0.55;
    effectivePrimary =
      opts.accentStrategy === "complementary"
        ? { l: isDarkBg ? 0.72 : 0.52, c: 0.15, h: hueAdd(bg.h, 180) }
        : opts.accentStrategy === "analogous"
          ? { l: isDarkBg ? 0.7 : 0.5, c: 0.16, h: hueAdd(bg.h, 35) }
          : isDarkBg
            // 深背景：主色直接采用用户给的背景色（作为品牌色），深色模式内会自动提亮
            ? { l: bg.l, c: bg.c, h: bg.h }
            : { l: clamp(bg.l - 0.4, 0.3, 0.55), c: clamp(Math.max(bg.c * 1.6, 0.1), 0, 0.22), h: bg.h };
  }

  const light = buildLight(effectivePrimary, neutral, opts, lightBg);
  const dark = buildDark(effectivePrimary, neutral, opts, darkBg);

  return {
    light,
    dark,
    summary: {
      primary: effectivePrimary,
      lightBg: lightBg ?? { l: 0.985, c: 0, h: neutral.hue },
      darkBg: darkBg ?? { l: 0.145, c: 0, h: neutral.hue },
    },
  };
}
