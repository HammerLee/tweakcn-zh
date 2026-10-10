"use client";

// 状态预览：把按钮 / 输入框 / 表格的常见交互状态静态摆出来，
// 让用户不用真的悬停也能看到主题在各状态下的效果。
// 悬停/按下的配色规则与 shadcn 一致：主色透明度变体（/90、/80），由主题变量自动派生。

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function StateCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {children}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function StatesDemo() {
  return (
    <ExamplesWrapper>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4">
        {/* ===== 按钮状态 ===== */}
        <Section
          title="Buttons — every state"
          hint="Hover / Active are derived from the primary color with opacity (/90, /80). Move your mouse over them to see the real effect."
        >
          {(
            [
              ["Primary", "default"],
              ["Secondary", "secondary"],
              ["Outline", "outline"],
              ["Destructive", "destructive"],
            ] as Array<[string, "default" | "secondary" | "outline" | "destructive"]>
          ).map(([label, variant]) => (
            <div key={variant} className="flex flex-wrap items-start gap-6">
              <StateCell label="Default">
                <Button variant={variant}>{label}</Button>
              </StateCell>
              <StateCell label="Hover">
                <Button
                  variant={variant}
                  className={cn(
                    variant === "default" && "bg-primary/90",
                    variant === "secondary" && "bg-secondary/80",
                    variant === "outline" && "bg-accent text-accent-foreground",
                    variant === "destructive" && "bg-destructive/90"
                  )}
                >
                  {label}
                </Button>
              </StateCell>
              <StateCell label="Active / pressed">
                <Button
                  variant={variant}
                  className={cn(
                    variant === "default" && "bg-primary/80",
                    variant === "secondary" && "bg-secondary/70",
                    variant === "outline" && "bg-accent/80 text-accent-foreground",
                    variant === "destructive" && "bg-destructive/80"
                  )}
                >
                  {label}
                </Button>
              </StateCell>
              <StateCell label="Disabled">
                <Button variant={variant} disabled>
                  {label}
                </Button>
              </StateCell>
            </div>
          ))}
        </Section>

        {/* ===== 输入框状态 ===== */}
        <Section
          title="Inputs — every state"
          hint="The focus ring uses the Ring token. Click the first input to see the real focus ring."
        >
          <div className="flex flex-wrap items-start gap-6">
            <StateCell label="Default">
              <Input placeholder="Type here..." className="w-44" />
            </StateCell>
            <StateCell label="Focused (real)">
              <Input
                placeholder="Click me"
                className="w-44 ring-2 ring-ring ring-offset-2 ring-offset-background"
              />
            </StateCell>
            <StateCell label="Disabled">
              <Input disabled placeholder="Disabled" className="w-44" />
            </StateCell>
          </div>
        </Section>

        {/* ===== 表格状态 ===== */}
        <Section
          title="Table — hover & selected rows"
          hint="Hover your mouse over the rows: the second row has row-hover styling; the third row is marked as selected."
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Ada Lovelace</TableCell>
                  <TableCell>Engineer</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>Grace Hopper</TableCell>
                  <TableCell>Architect</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                </TableRow>
                <TableRow
                  className="bg-muted/60 border-l-2 border-l-primary data-[state=selected]:bg-muted"
                  data-state="selected"
                >
                  <TableCell className="font-medium">Alan Turing</TableCell>
                  <TableCell>Scientist</TableCell>
                  <TableCell>
                    <Badge>Selected</Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="opacity-50">
                  <TableCell>Disabled user</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>
                    <Badge variant="outline">Disabled</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Section>

        {/* ===== 开关 / 复选框 ===== */}
        <Section title="Toggles & checkboxes" hint="Checked / unchecked / disabled states.">
          <div className="flex flex-wrap items-center gap-8">
            <StateCell label="Checkbox">
              <Checkbox defaultChecked />
            </StateCell>
            <StateCell label="Unchecked">
              <Checkbox />
            </StateCell>
            <StateCell label="Disabled">
              <Checkbox disabled />
            </StateCell>
            <StateCell label="Switch on">
              <Switch defaultChecked />
            </StateCell>
            <StateCell label="Switch off">
              <Switch />
            </StateCell>
            <StateCell label="Switch disabled">
              <Switch defaultChecked disabled />
            </StateCell>
          </div>
        </Section>
      </div>
    </ExamplesWrapper>
  );
}

function ExamplesWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground pb-10">{children}</div>
  );
}
