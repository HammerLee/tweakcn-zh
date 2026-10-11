import { type FontCategory, type FontInfo } from "@/types/fonts";

/**
 * 离线内置字体清单——**唯一数据源**。
 *
 * - `npm run fetch-fonts` 按 `css2` 字段抓 woff2 到 public/fonts/，生成 fonts.css
 * - 字体搜索接口（/api/google-fonts）与字体选择器都只认这份清单
 *
 * 新增字体：往这里加一条，跑一次 fetch-fonts，重新打包给离线机。
 * 不在清单里的 Google 字体在离线机上会回退到系统字体。
 */
export type LocalFont = FontInfo & {
  /** css2 API 的 family 参数（含轴规格），空格用 + 表示 */
  css2: string;
};

export const LOCAL_FONTS: LocalFont[] = [
  // sans-serif
  {
    family: "Inter",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900",
  },
  {
    family: "Roboto",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Roboto:ital,wght@0,100..900;1,100..900",
  },
  {
    family: "Open Sans",
    category: "sans-serif",
    variants: ["300", "400", "500", "600", "700", "800"],
    variable: true,
    css2: "Open+Sans:ital,wght@0,300..800;1,300..800",
  },
  {
    family: "Poppins",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Poppins:wght@100..900",
  },
  {
    family: "Montserrat",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Montserrat:ital,wght@0,100..900;1,100..900",
  },
  {
    family: "DM Sans",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000",
  },
  {
    family: "Plus Jakarta Sans",
    category: "sans-serif",
    variants: ["200", "300", "400", "500", "600", "700", "800"],
    variable: true,
    css2: "Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800",
  },
  {
    family: "Geist",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Geist:wght@100..900",
  },
  {
    family: "IBM Plex Sans",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700"],
    variable: true,
    css2: "IBM+Plex+Sans:ital,wght@0,100..700;1,100..700",
  },
  {
    family: "Outfit",
    category: "sans-serif",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Outfit:wght@100..900",
  },
  {
    family: "Space Grotesk",
    category: "sans-serif",
    variants: ["300", "400", "500", "600", "700"],
    variable: true,
    css2: "Space+Grotesk:wght@300..700",
  },
  {
    family: "Quicksand",
    category: "sans-serif",
    variants: ["300", "400", "500", "600", "700"],
    variable: false,
    css2: "Quicksand:wght@300;400;500;600;700",
  },
  {
    family: "Oxanium",
    category: "display",
    variants: ["200", "300", "400", "500", "600", "700", "800"],
    variable: true,
    css2: "Oxanium:wght@200..800",
  },

  // serif
  {
    family: "Playfair Display",
    category: "serif",
    variants: ["400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Playfair+Display:ital,wght@0,400..900;1,400..900",
  },
  {
    family: "Merriweather",
    category: "serif",
    variants: ["300", "400", "700", "900"],
    variable: true,
    css2: "Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900",
  },
  {
    family: "Lora",
    category: "serif",
    variants: ["400", "500", "600", "700"],
    variable: true,
    css2: "Lora:ital,wght@0,400..700;1,400..700",
  },
  {
    family: "Source Serif 4",
    category: "serif",
    variants: ["200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900",
  },
  {
    family: "Libre Baskerville",
    category: "serif",
    variants: ["400", "700"],
    variable: false,
    css2: "Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  },

  // monospace
  {
    family: "JetBrains Mono",
    category: "monospace",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800"],
    variable: true,
    css2: "JetBrains+Mono:ital,wght@0,100..800;1,100..800",
  },
  {
    family: "Fira Code",
    category: "monospace",
    variants: ["300", "400", "500", "600", "700"],
    variable: true,
    css2: "Fira+Code:wght@300..700",
  },
  {
    family: "Source Code Pro",
    category: "monospace",
    variants: ["200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Source+Code+Pro:ital,wght@0,200..900;1,200..900",
  },
  {
    family: "Roboto Mono",
    category: "monospace",
    variants: ["100", "200", "300", "400", "500", "600", "700"],
    variable: true,
    css2: "Roboto+Mono:ital,wght@0,100..700;1,100..700",
  },
  {
    family: "IBM Plex Mono",
    category: "monospace",
    variants: ["100", "200", "300", "400", "500", "600", "700"],
    variable: false,
    css2: "IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700",
  },
  {
    family: "Space Mono",
    category: "monospace",
    variants: ["400"],
    variable: false,
    css2: "Space+Mono:ital,wght@0,400;1,400",
  },
  {
    family: "Ubuntu Mono",
    category: "monospace",
    variants: ["400", "700"],
    variable: false,
    css2: "Ubuntu+Mono:wght@400;700",
  },
  {
    family: "Geist Mono",
    category: "monospace",
    variants: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: true,
    css2: "Geist+Mono:wght@100..900",
  },

  // handwriting
  {
    family: "Architects Daughter",
    category: "handwriting",
    variants: ["400"],
    variable: false,
    css2: "Architects+Daughter",
  },
];

export const LOCAL_FONT_FAMILIES = new Set(LOCAL_FONTS.map((f) => f.family));

/** 给字体选择器用的 FontInfo 形状（剥掉 css2 字段） */
export const LOCAL_FONT_INFOS: FontInfo[] = LOCAL_FONTS.map(({ css2: _css2, ...info }) => info);

export function fontsByCategory(category: FontCategory): FontInfo[] {
  return LOCAL_FONT_INFOS.filter((f) => f.category === category);
}
