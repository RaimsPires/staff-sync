import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { LeaveScreen, type LeaveTab, type LeaveView } from "@/features/leave/leave-screen";

const VIEWS: LeaveView[] = ["requests", "calendar", "balances"];
const TABS: LeaveTab[] = ["pending", "approved", "rejected", "cancelled", "all"];
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("leave") };
}

export default async function LeavePage({ searchParams }: PageProps<"/leave">) {
  const params = await searchParams;
  const view = VIEWS.find((v) => v === first(params.view));
  const tab = TABS.find((v) => v === first(params.tab));
  return (
    <PageGuard page="leave">
      <LeaveScreen key={`${view}-${tab}`} initialView={view} initialTab={tab} />
    </PageGuard>
  );
}
