import { getTranslations } from "next-intl/server";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("dashboard") };
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const state = Array.isArray(params.state) ? params.state[0] : params.state;
  const site = Array.isArray(params.site) ? params.site[0] : params.site;
  return <DashboardScreen key={site ?? "none"} isNew={state === "new"} initialSite={site ?? null} />;
}
