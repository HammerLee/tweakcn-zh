"use client";

import Logo from "@/assets/logo.svg";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-6" title="tweakcn" />
            <span className="hidden font-bold md:block">tweakcn</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
