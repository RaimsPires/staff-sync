"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRoleText } from "@/features/users/model";
import { usePreview } from "@/store/preview";
import { useAccess } from "@/store/use-access";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** Fixed sidebar + sticky top bar around the scrolling page content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const t = useTranslations("Shell");
  const roleText = useRoleText();
  const { previewRole } = useAccess();
  const stopPreview = usePreview((s) => s.set);
  return (
    <div className="flex min-h-screen bg-bg text-[14px] leading-[1.45] text-text">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        {previewRole && (
          <div role="status" className="flex flex-wrap items-center gap-3 bg-warn-bg px-7 py-2 text-[13px] text-warn">
            <span className="flex-1 font-medium">{t("preview.banner", { role: roleText.name(previewRole) })}</span>
            <button onClick={() => stopPreview(null)} className="h-7 rounded-lg border border-solid border-warn bg-transparent px-3 text-[12.5px] font-medium text-warn">{t("preview.exit")}</button>
          </div>
        )}
        <main className="flex-1 px-[18px] pb-10 pt-5 lg:px-7 lg:pb-12 lg:pt-6"><div key={pathname} className="animate-rise">{children}</div></main>
      </div>
    </div>
  );
}
