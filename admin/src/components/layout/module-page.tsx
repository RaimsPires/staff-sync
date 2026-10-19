"use client";

import { useTranslations } from "next-intl";
import { PageGuard } from "@/components/layout/page-guard";
import { EmptyState } from "@/components/ui/misc";
import type { AdminPage } from "@/types/auth";

/** Page frame: title, access guard and the module body. */
export function ModulePage({ page, children }: { page: AdminPage; children?: React.ReactNode }) {
  const nav = useTranslations("Nav.pages");
  const common = useTranslations("Common");
  return (
    <PageGuard page={page}>
      <h1 className="m-0 mb-5 text-[22px] font-semibold tracking-tight">{nav(page)}</h1>
      {children ?? <EmptyState title={common("pendingTitle")} hint={common("pendingHint")} />}
    </PageGuard>
  );
}
