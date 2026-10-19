"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/misc";
import { canAccess } from "@/lib/permissions";
import { useAccess } from "@/store/use-access";
import type { AdminPage } from "@/types/auth";

/** Renders the page only when the current role may open it; otherwise the "no access" state. */
export function PageGuard({ page, children }: { page: AdminPage; children: React.ReactNode }) {
  const t = useTranslations("Common");
  const { hydrated, perms } = useAccess();
  if (!hydrated || canAccess(perms, page)) return <>{children}</>;
  return (
    <EmptyState
      title={t("noAccessTitle")}
      hint={t("noAccessHint")}
      action={<ShieldAlert className="mx-auto text-text-3" size={22} />}
    />
  );
}
