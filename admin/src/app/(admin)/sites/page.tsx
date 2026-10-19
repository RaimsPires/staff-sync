import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { SitesPage } from "@/features/sites/sites-page";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("sites") };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: PageProps<"/sites">) {
  const params = await searchParams;
  const site = first(params.site);
  return (
    <PageGuard page="sites">
      <SitesPage key={site ?? "none"} initialView={site || first(params.view) === "sites" ? "sites" : "branches"} initialSite={site} />
    </PageGuard>
  );
}
