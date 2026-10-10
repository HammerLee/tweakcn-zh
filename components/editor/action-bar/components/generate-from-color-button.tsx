"use client";

// 「从颜色生成」：输入一个主色 / 背景色，一键生成整套配色（浅色 + 深色）。
// 输入支持 hex / rgb / hsl / oklch / 颜色名（culori 解析），并可用系统色盘取色；
// 输出格式可选 oklch / hex / rgb / hsl，生成结果直接应用到编辑器，可继续微调或导出。

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import {
  generateTheme,
  parseColor,
  type AccentStrategy,
  type ChartStrategy,
  type ContrastLevel,
  type GenerateMode,
  type GeneratedTheme,
  type OutputFormat,
} from "@/lib/color-generate";
import { useEditorStore } from "@/store/editor-store";
import { formatHex } from "culori";
import { Wand2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ThemeStyleProps } from "@/types/theme";

const PREVIEW_TOKENS = [
  "background",
  "primary",
  "secondary",
  "muted",
  "accent",
  "border",
  "destructive",
  "chart-1",
  "chart-2",
  "chart-3",
] as const;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const parsed = parseColor(value);
  const swatch = parsed ? formatHex({ mode: "oklch", ...parsed }) : "#8a8a8a";
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Pick a color"
          onClick={() => pickerRef.current?.click()}
          className="size-9 shrink-0 rounded-md border shadow-sm"
          style={{ backgroundColor: swatch }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#2563eb / rgb(37 99 235) / oklch(0.55 0.2 260)"
          className="h-9 font-mono text-xs"
        />
        <input
          ref={pickerRef}
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-label="Pick a color"
        />
      </div>
    </div>
  );
}

function PreviewStrip({
  title,
  colors,
}: {
  title: string;
  colors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {PREVIEW_TOKENS.map((token) => (
          <div key={token} className="flex flex-col items-center gap-0.5">
            <div
              className="size-8 rounded-md border shadow-sm"
              style={{ backgroundColor: colors[token] }}
              title={`${token}: ${colors[token]}`}
            />
            <span className="text-[10px] leading-none text-muted-foreground">
              {token}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenerateFromColorButton({
  alwaysShowLabel = false,
}: {
  alwaysShowLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<GenerateMode>("primary");
  const [primary, setPrimary] = useState("#2563eb");
  const [background, setBackground] = useState("#1e3a5f");
  const [neutralTint, setNeutralTint] = useState(true);
  const [tintStrength, setTintStrength] = useState(35);
  const [contrast, setContrast] = useState<ContrastLevel>("standard");
  const [chartStrategy, setChartStrategy] = useState<ChartStrategy>("complementary");
  const [accentStrategy, setAccentStrategy] = useState<AccentStrategy>("same");
  const [format, setFormat] = useState<OutputFormat>("oklch");
  const [applied, setApplied] = useState(false);

  const { themeState, setThemeState } = useEditorStore();

  const generated: GeneratedTheme | null = useMemo(() => {
    try {
      return generateTheme({
        mode,
        primary,
        background,
        neutralTint,
        tintStrength,
        contrast,
        chartStrategy,
        accentStrategy,
        format,
      });
    } catch {
      return null;
    }
  }, [mode, primary, background, neutralTint, tintStrength, contrast, chartStrategy, accentStrategy, format]);

  const handleApply = () => {
    if (!generated) return;
    setThemeState({
      ...themeState,
      styles: {
        light: { ...themeState.styles.light, ...(generated.light as Partial<ThemeStyleProps>) },
        dark: { ...themeState.styles.dark, ...(generated.dark as Partial<ThemeStyleProps>) },
      },
      hslAdjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
    });
    setApplied(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setApplied(false); }}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Generate from color">
            <Wand2 className="size-3.5" />
            <span className={alwaysShowLabel ? "text-sm" : "hidden text-sm md:block"}>
              From Color
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate from color</DialogTitle>
            <DialogDescription>
              Give a primary or background color, get a full light &amp; dark palette.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">What you have</Label>
              <div className="flex gap-1.5">
                {(
                  [
                    ["primary", "A primary color"],
                    ["background", "A background color"],
                    ["both", "Primary + background"],
                  ] as Array<[GenerateMode, string]>
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={mode === value ? "default" : "outline"}
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {mode !== "background" && (
              <ColorField label="Primary color" value={primary} onChange={setPrimary} />
            )}
            {mode !== "primary" && (
              <ColorField label="Background color" value={background} onChange={setBackground} />
            )}
            <p className="text-[11px] leading-none text-muted-foreground">
              Supports hex / rgb / hsl / oklch / names · click the swatch to pick from the
              color wheel
            </p>

            {mode === "background" && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <Label className="text-xs">Accent strategy</Label>
                  <span className="text-[10px] text-muted-foreground">
                    How the primary color is derived from your background
                  </span>
                </div>
                <Select value={accentStrategy} onValueChange={(v) => setAccentStrategy(v as AccentStrategy)}>
                  <SelectTrigger className="w-[170px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same">Lighten same hue</SelectItem>
                    <SelectItem value="complementary">Complementary</SelectItem>
                    <SelectItem value="analogous">Analogous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Neutral tint</Label>
              <Switch checked={neutralTint} onCheckedChange={setNeutralTint} />
            </div>
            {neutralTint && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <Label className="text-xs shrink-0">Tint strength</Label>
                  <span className="text-[10px] text-muted-foreground">
                    0% = pure gray, higher = stronger hint of your color
                  </span>
                </div>
                <Slider
                  value={[tintStrength]}
                  onValueChange={(v) => setTintStrength(v[0] ?? tintStrength)}
                  max={100}
                  step={1}
                  className="w-[200px]"
                />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {tintStrength}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <Label className="text-xs">Contrast</Label>
                <span className="text-[10px] text-muted-foreground">
                  High = clearer text, better accessibility
                </span>
              </div>
              <Select value={contrast} onValueChange={(v) => setContrast(v as ContrastLevel)}>
                <SelectTrigger className="w-[170px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <Label className="text-xs">Chart palette</Label>
                <span className="text-[10px] text-muted-foreground">
                  How chart colors 1–5 pick their hues
                </span>
              </div>
              <Select value={chartStrategy} onValueChange={(v) => setChartStrategy(v as ChartStrategy)}>
                <SelectTrigger className="w-[170px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analogous">Analogous</SelectItem>
                  <SelectItem value="complementary">Complementary</SelectItem>
                  <SelectItem value="vivid">Vivid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <Label className="text-xs">Output format</Label>
                <span className="text-[10px] text-muted-foreground">
                  Color notation applied to the editor
                </span>
              </div>
              <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
                <SelectTrigger className="w-[170px] h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oklch">oklch</SelectItem>
                  <SelectItem value="hex">hex</SelectItem>
                  <SelectItem value="rgb">rgb</SelectItem>
                  <SelectItem value="hsl">hsl</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {generated && (
              <div className="flex flex-col gap-2 rounded-lg border p-2.5">
                <PreviewStrip title="Light" colors={generated.light} />
                <PreviewStrip title="Dark" colors={generated.dark} />
              </div>
            )}
            {!generated && (
              <p className="text-xs text-destructive">Invalid color, check the format</p>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {applied ? "Applied! Tweak further or use Code to export." : ""}
              </span>
              <Button onClick={handleApply} disabled={!generated} size="sm">
                <Wand2 className="size-3.5" />
                Apply to editor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
