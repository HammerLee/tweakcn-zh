"use client";

/**
 * 离线版分析事件出口：一律丢弃。
 *
 * 上游用 `usePostHog()`（posthog-js/react），但没有包 PostHogProvider，
 * 无 key 时它返回 undefined，点分享/复制代码会直接 TypeError。
 * 这里保持同样的调用形状，调用点不用改逻辑。
 */
export type Analytics = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (id: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
};

const NOOP: Analytics = {
  capture: () => {},
  identify: () => {},
  reset: () => {},
};

export function useAnalytics(): Analytics {
  return NOOP;
}
