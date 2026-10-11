"use client";

import { defaultDarkThemeStyles, defaultLightThemeStyles } from "@/config/theme";

export function ThemeScript() {
  const scriptContent = `
    // ----- THEME INITIALIZATION -----
    (function() {
      const storageKey = "editor-storage";
      const root = document.documentElement;
      const defaultLightStyles = ${JSON.stringify(defaultLightThemeStyles)};
      const defaultDarkStyles = ${JSON.stringify(defaultDarkThemeStyles)};

      let themeState = null;
      try {
        const persistedStateJSON = localStorage.getItem(storageKey);
        if (persistedStateJSON) {
          themeState = JSON.parse(persistedStateJSON)?.state?.themeState;
        }
      } catch (e) {
        console.warn("Theme initialization: Failed to read/parse localStorage:", e);
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const mode = themeState?.currentMode ?? (prefersDark ? "dark" : "light");

      const activeStyles =
        mode === "dark"
          ? themeState?.styles?.dark || defaultDarkStyles
          : themeState?.styles?.light || defaultLightStyles;

      const stylesToApply = Object.keys(defaultLightStyles);

      // Apply Theme Styles properties
      for (const styleName of stylesToApply) {
        const value = activeStyles[styleName];
        if (value !== undefined) {
          root.style.setProperty(\`--\${styleName}\`, value);
        }
      }

      // 字体不需要运行时加载：/fonts/fonts.css 已在 <head> 里静态引入，
      // 浏览器会按 unicode-range 自己取用到的 woff2（全部本地，见 public/fonts/）。
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} suppressHydrationWarning />;
}
