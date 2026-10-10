"use client";

import { HorizontalScrollArea } from "@/components/horizontal-scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useThemeInspector } from "@/hooks/use-theme-inspector";
import { cn } from "@/lib/utils";
import { ThemeEditorPreviewProps } from "@/types/theme";
import { Inspect, Maximize, Minimize } from "lucide-react";
import { useQueryState } from "nuqs";
import { lazy } from "react";
import InspectorOverlay from "./inspector-overlay";
import ColorPreview from "./theme-preview/color-preview";
import ExamplesPreviewContainer from "./theme-preview/examples-preview-container";
import TabsTriggerPill from "./theme-preview/tabs-trigger-pill";

const DemoCards = lazy(() => import("@/components/examples/cards"));
const DemoStates = lazy(() => import("@/components/examples/states"));
const DemoApplication = lazy(() => import("@/components/examples/application"));
const DemoMarketing = lazy(() => import("@/components/examples/marketing"));
const DemoMail = lazy(() => import("@/components/examples/mail"));
const DemoDashboard = lazy(() => import("@/components/examples/dashboard"));
const TypographyDemo = lazy(() => import("@/components/examples/typography/typography-demo"));
const CustomDemo = lazy(() => import("@/components/examples/custom"));

const ThemePreviewPanel = ({
  styles,
  currentMode,
}: ThemeEditorPreviewProps) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [activeTab, setActiveTab] = useQueryState("p", {
    defaultValue: "cards",
  });

  const {
    rootRef,
    inspector,
    inspectorEnabled,
    handleMouseMove,
    handleMouseLeave,
    toggleInspector,
  } = useThemeInspector();

  if (!styles || !styles[currentMode]) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isFullscreen && "bg-background fixed inset-0 z-50"
        )}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <HorizontalScrollArea className="mt-2 mb-1 flex w-full items-center justify-between px-4">
            <TabsList className="bg-background text-muted-foreground inline-flex w-fit items-center justify-center rounded-full px-0">
              <TabsTriggerPill value="custom">Custom</TabsTriggerPill>
              <TabsTriggerPill value="states">States</TabsTriggerPill>
              <TabsTriggerPill value="cards">Cards</TabsTriggerPill>

              <div className="hidden md:flex">
                <TabsTriggerPill value="dashboard">Dashboard</TabsTriggerPill>
                <TabsTriggerPill value="application">Application</TabsTriggerPill>
              </div>
              <TabsTriggerPill value="marketing">Marketing</TabsTriggerPill>
              <TabsTriggerPill value="mail">Mail</TabsTriggerPill>
              <TabsTriggerPill value="typography">Typography</TabsTriggerPill>
              <TabsTriggerPill value="colors">Color Palette</TabsTriggerPill>
            </TabsList>

            <div className="flex items-center gap-0.5">
              {isFullscreen && (
                <ThemeToggle
                  variant="ghost"
                  size="icon"
                  className="group size-8 hover:[&>svg]:scale-120 hover:[&>svg]:transition-all"
                />
              )}
              {/* Inspector toggle button */}
              <TooltipWrapper label="Toggle Inspector" asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleInspector}
                  className={cn(
                    "group size-8",
                    inspectorEnabled && "bg-accent text-accent-foreground w-auto"
                  )}
                >
                  <Inspect className="transition-all group-hover:scale-120" />
                  {inspectorEnabled && <span className="text-xs tracking-wide uppercase">on</span>}
                </Button>
              </TooltipWrapper>
              <TooltipWrapper
                label={isFullscreen ? "Exit full screen" : "Full screen"}
                className="hidden md:inline-flex"
                asChild
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="group size-8"
                >
                  {isFullscreen ? (
                    <Minimize className="transition-all group-hover:scale-120" />
                  ) : (
                    <Maximize className="transition-all group-hover:scale-120" />
                  )}
                </Button>
              </TooltipWrapper>
            </div>
          </HorizontalScrollArea>

          <section
            className={cn(
              "relative size-full overflow-hidden",
              activeTab === "cards" ? "pb-4" : "p-4 pt-1"
            )}
          >
            <div
              className={cn(
                "relative isolate size-full overflow-hidden",
                activeTab !== "cards" && "rounded-lg"
              )}
              ref={rootRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <TabsContent value="states" className="m-0 size-full overflow-y-auto">
                <ExamplesPreviewContainer>
                  <DemoStates />
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="cards" className="m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <ScrollArea className="size-full">
                    <DemoCards />
                  </ScrollArea>
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="custom" className="@container m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <CustomDemo />
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="dashboard" className="@container m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <ScrollArea className="size-full">
                    <div className="size-full min-w-[1400px]">
                      <DemoDashboard />
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="application" className="@container m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <ScrollArea className="size-full">
                    <DemoApplication />
                  </ScrollArea>
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="marketing" className="@container m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <ScrollArea className="size-full [&_[data-slot=scroll-area-scrollbar]]:z-[60]">
                    <DemoMarketing />
                  </ScrollArea>
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="mail" className="@container m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <ScrollArea className="size-full">
                    <div className="size-full min-w-[1300px] rounded-lg border">
                      <DemoMail />
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="typography" className="m-0 size-full">
                <ExamplesPreviewContainer className="size-full">
                  <ScrollArea className="size-full">
                    <TypographyDemo />
                  </ScrollArea>
                </ExamplesPreviewContainer>
              </TabsContent>

              <TabsContent value="colors" className="m-0 size-full">
                <ScrollArea className="size-full">
                  <div className="p-4">
                    <ColorPreview styles={styles} currentMode={currentMode} />
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </section>
        </Tabs>
      </div>

      <InspectorOverlay inspector={inspector} enabled={inspectorEnabled} rootRef={rootRef} />
    </>
  );
};

export default ThemePreviewPanel;
