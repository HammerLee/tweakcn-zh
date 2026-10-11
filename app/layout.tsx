import { AuthDialogWrapper } from "@/components/auth-dialog-wrapper";
import { DynamicFontLoader } from "@/components/dynamic-font-loader";
import { GetProDialogWrapper } from "@/components/get-pro-dialog-wrapper";
import { PostHogInit } from "@/components/posthog-init";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ZhToggle from "@/components/zh-toggle";
import { ChatProvider } from "@/hooks/use-chat-context";
import { QueryProvider } from "@/lib/query-client";
import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beautiful themes for shadcn/ui — tweakcn | Theme Editor & Generator",
  description:
    "Customize theme for shadcn/ui with tweakcn's interactive editor. Supports Tailwind CSS v4, Shadcn UI, and custom styles. Modify properties, preview changes, and get the code in real time.",
  keywords:
    "theme editor, theme generator, shadcn, ui, components, react, tailwind, button, editor, visual editor, component editor, web development, frontend, design system, UI components, React components, Tailwind CSS, shadcn/ui themes",
  authors: [{ name: "Sahaj Jain" }],
  openGraph: {
    title: "Beautiful themes for shadcn/ui — tweakcn | Theme Editor & Generator",
    description:
      "Customize theme for shadcn/ui with tweakcn's interactive editor. Supports Tailwind CSS v4, Shadcn UI, and custom styles. Modify properties, preview changes, and get the code in real time.",
    url: "https://tweakcn.com/",
    siteName: "tweakcn",
    images: [
      {
        url: "https://tweakcn.com/og-image.v050725.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beautiful themes for shadcn/ui — tweakcn | Theme Editor & Generator",
    description:
      "Customize theme for shadcn/ui with tweakcn's interactive editor. Supports Tailwind CSS v4, Shadcn UI, and custom styles. Modify properties, preview changes, and get the code in real time.",
    images: ["https://tweakcn.com/og-image.v050725.png"],
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ThemeScript />
        <DynamicFontLoader />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          type="image/png"
          sizes="180x180"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* 内置主题用到的字体已全部本地化：见 config/local-fonts.ts 与 public/fonts/ */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <meta name="darkreader-lock" />
      </head>
      <body>
        <NuqsAdapter>
          <Suspense>
            <QueryProvider>
              <ThemeProvider defaultTheme="light">
                <TooltipProvider>
                  <AuthDialogWrapper />
                  <GetProDialogWrapper />
                  <Toaster />
                  <ChatProvider>{children}</ChatProvider>
                </TooltipProvider>
              </ThemeProvider>
            </QueryProvider>
          </Suspense>
        </NuqsAdapter>
        <PostHogInit />
        <ZhToggle />
      </body>
    </html>
  );
}
