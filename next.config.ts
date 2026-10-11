import { type NextConfig } from "next";

const SVG_TEST = /\.svg$/i;

type Rule = {
  test?: unknown;
  oneOf?: Rule[];
  exclude?: unknown;
  [key: string]: unknown;
};

// 把内置资源规则里的 .svg 摘出去：Next 的图片规则（可能嵌在 oneOf 里）也匹配 .svg，
// 两条规则同时命中时默认导出会变成对象而不是组件。用 exclude 比改写 test 稳，
// 不用依赖 Next 内部那条正则的具体写法。
function excludeSvg(rule: Rule): Rule {
  if (Array.isArray(rule.oneOf)) {
    return { ...rule, oneOf: rule.oneOf.map(excludeSvg) };
  }
  const test = rule.test;
  if (!(test instanceof RegExp) || test.source === SVG_TEST.source || !test.test("a.svg")) {
    return rule;
  }
  return { ...rule, exclude: rule.exclude === undefined ? SVG_TEST : [rule.exclude, SVG_TEST] };
}

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
            },
          },
        ],
        as: "*.js",
      },
    },
  },
  // webpack 模式下复刻上面的 turbopack 规则，让 .svg 能当 React 组件导入
  // （Windows 离线构建/开发的回退路径）。
  webpack: (config) => {
    config.module.rules = (config.module.rules as Rule[]).map(excludeSvg);
    config.module.rules.unshift({
      test: SVG_TEST,
      use: [{ loader: "@svgr/webpack", options: { icon: true } }],
    });
    return config;
  },
};

export default nextConfig;
