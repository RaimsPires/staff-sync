"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** Fixed sidebar + sticky top bar around the scrolling page content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-bg text-[14px] leading-[1.45] text-text">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 px-[18px] pb-10 pt-5 lg:px-7 lg:pb-12 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
