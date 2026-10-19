"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/misc";
import { canAccess, permissionsFor } from "@/lib/permissions";
import { useHydrated } from "@/lib/use-hydrated";
import { useSession } from "@/store/session";
import type { AdminPage } from "@/types/auth";

/** Renders the page only when the current role may open it; otherwise the "no access" state. */
export function PageGuard({ page, children }: { page: AdminPage; children: React.ReactNode }) {
  const t = useTranslations("Common");
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  if (!hydrated || canAccess(permissionsFor(role), page)) return <>{children}</>;
  return (
    <EmptyState
      title={t("noAccessTitle")}
      hint={t("noAccessHint")}
      action={<ShieldAlert className="mx-auto text-text-3" size={22} />}
    />
  );
}
