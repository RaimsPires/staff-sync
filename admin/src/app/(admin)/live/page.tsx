import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { LiveBoardScreen } from "@/features/live/live-board-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("live") };
}

export default async function LivePage({ searchParams }: PageProps<"/live">) {
  const params = await searchParams;
  const site = Array.isArray(params.site) ? params.site[0] : params.site;
  return (
    <PageGuard page="live">
      <LiveBoardScreen key={site ?? "all"} initialSite={site ?? "all"} />
    </PageGuard>
  );
}
