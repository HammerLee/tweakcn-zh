"use client";

// 中英文整体切换：客户端 DOM 翻译层。
// 原理：开启中文时遍历页面文本节点/属性，按 lib/zh-dictionary 精确匹配替换原文，
// 并用 MutationObserver 跟进 React 后续渲染；关闭时还原所有原文。源组件零侵入。

import { zhDictionary, zhTitleMap } from "@/lib/zh-dictionary";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tweakcn-zh-ui";
// pre/code 内是导出的代码文本，翻译会干扰阅读与复制；nextjs-portal 是开发工具
const SKIP_SELECTOR =
  "script, style, noscript, pre, code, nextjs-portal, [data-zh-ignore]";
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

function splitWhitespace(s: string) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
  return m ? [m[1], m[2], m[3]] as const : ["", s, ""] as const;
}

function isSkippable(node: Node) {
  const el = node.nodeType === Node.ELEMENT_NODE
    ? (node as Element)
    : node.parentElement;
  return !el || el.closest(SKIP_SELECTOR) !== null;
}

export default function ZhToggle() {
  const [mounted, setMounted] = useState(false);
  const [zhOn, setZhOn] = useState(false);
  const zhOnRef = useRef(false);

  const textOriginals = useRef(new WeakMap<Text, string>());
  const textTouched = useRef(new Set<Text>());
  const attrOriginals = useRef(new WeakMap<Element, Record<string, string>>());
  const attrTouched = useRef(new Set<Element>());
  const titleOriginal = useRef<string | null>(null);
  const langOriginal = useRef<string | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const pendingNodes = useRef(new Set<Node>());
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewalkTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const translateText = useCallback((node: Node) => {
    const text = node as Text;
    if (text.nodeType !== Node.TEXT_NODE || isSkippable(text)) return;
    const raw = text.nodeValue;
    if (!raw) return;

    const dict = zhDictionary;
    const stored = textOriginals.current.get(text);
    let original = stored ?? raw;
    if (stored !== undefined && stored !== raw) {
      // 节点内容与记录的原文不同：排除「当前值就是已翻译文本」后，视为新内容并更新原文
      const [l, c, t] = splitWhitespace(stored);
      const zhPrev = dict[c] ?? dict[c.trim()];
      if (raw !== (zhPrev ? l + zhPrev + t : stored)) original = raw;
    }
    textOriginals.current.set(text, original);
    textTouched.current.add(text);

    if (!zhOnRef.current) {
      text.nodeValue = original;
      return;
    }
    const [lead, core, tail] = splitWhitespace(original);
    const zh = dict[core] ?? dict[core.trim()];
    text.nodeValue = zh ? lead + zh + tail : original;
  }, []);

  const translateElement = useCallback((el: Element) => {
    if (el.closest(SKIP_SELECTOR)) return;
    for (const attr of ATTRS) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      const rec = attrOriginals.current.get(el) ?? {};
      if (!(attr in rec)) {
        rec[attr] = val;
        attrOriginals.current.set(el, rec);
        attrTouched.current.add(el);
      }
      const zh = zhOnRef.current ? zhDictionary[rec[attr]] : undefined;
      const next = zh ?? rec[attr];
      if (next !== val) el.setAttribute(attr, next);
    }
  }, []);

  const walk = useCallback((root: Node) => {
    if (isSkippable(root)) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateText(root);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let cur: Node | null = walker.nextNode();
    while (cur) {
      translateText(cur);
      cur = walker.nextNode();
    }
    const el = root as Element;
    const targets: Element[] = el.querySelectorAll
      ? [el, ...Array.from(el.querySelectorAll("*"))]
      : [];
    for (const e of targets) translateElement(e);
  }, []);

  const flushPending = useCallback(() => {
    pendingTimer.current = null;
    const nodes = Array.from(pendingNodes.current);
    pendingNodes.current.clear();
    for (const n of nodes) {
      if (!n.isConnected) continue;
      walk(n);
    }
  }, [walk]);

  // 页面标题可能在本组件挂载后才被路由/页面代码设置，因此每次补翻时重新映射；
  // 若发现全新标题（非已记录原文、也非已翻译值），则更新原文记录
  const applyTitle = useCallback(() => {
    const cur = document.title;
    if (!zhOnRef.current) {
      if (titleOriginal.current !== null) document.title = titleOriginal.current;
      return;
    }
    if (titleOriginal.current === null) {
      titleOriginal.current = cur;
    } else if (
      cur !== titleOriginal.current &&
      !Object.values(zhTitleMap).includes(cur)
    ) {
      titleOriginal.current = cur;
    }
    const mapped = zhTitleMap[titleOriginal.current];
    if (mapped) document.title = mapped;
  }, []);

  const activate = useCallback(() => {
    if (!langOriginal.current) langOriginal.current = document.documentElement.lang;
    document.documentElement.lang = "zh-CN";
    applyTitle();
    walk(document.body);
    // 布局级组件挂载可能早于页面内容渲染（流式/延迟注水），延迟补翻兜底
    for (const delay of [400, 1200, 2500, 4000]) {
      rewalkTimers.current.push(
        setTimeout(() => {
          if (!zhOnRef.current) return;
          walk(document.body);
          applyTitle();
        }, delay)
      );
    }
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData") pendingNodes.current.add(m.target);
        for (const n of m.addedNodes) pendingNodes.current.add(n);
      }
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(flushPending, 120);
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    observerRef.current = obs;
  }, [flushPending, walk]);

  const deactivate = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    pendingNodes.current.clear();
    for (const t of rewalkTimers.current) clearTimeout(t);
    rewalkTimers.current = [];
    for (const node of textTouched.current) {
      const original = textOriginals.current.get(node);
      if (original !== undefined) node.nodeValue = original;
    }
    textTouched.current.clear();
    for (const el of attrTouched.current) {
      const rec = attrOriginals.current.get(el);
      if (!rec) continue;
      for (const [attr, val] of Object.entries(rec)) el.setAttribute(attr, val);
    }
    attrTouched.current.clear();
    if (langOriginal.current !== null) {
      document.documentElement.lang = langOriginal.current;
    }
    if (titleOriginal.current !== null) document.title = titleOriginal.current;
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (saved) {
      zhOnRef.current = true;
      setZhOn(true);
      activate();
    }
    return () => {
      if (zhOnRef.current) deactivate();
    };
  }, [activate, deactivate]);

  const toggle = useCallback(() => {
    const next = !zhOnRef.current;
    zhOnRef.current = next;
    setZhOn(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    if (next) activate();
    else deactivate();
  }, [activate, deactivate]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      data-zh-ignore
      onClick={toggle}
      aria-label="切换中英文界面"
      title="切换中英文界面 / Toggle UI language"
      className="fixed bottom-16 right-4 z-[9999] flex h-9 items-center gap-1 rounded-full border bg-background/95 px-3 text-xs font-medium shadow-lg backdrop-blur transition-colors hover:bg-accent print:hidden"
    >
      <span className={zhOn ? "text-muted-foreground" : "font-semibold"}>
        中文
      </span>
      <span className="text-muted-foreground">/</span>
      <span className={zhOn ? "font-semibold" : "text-muted-foreground"}>EN</span>
    </button>
  );
}
