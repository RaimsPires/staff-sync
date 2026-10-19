import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { SECTIONS, type SectionId } from "@/features/settings/model";
import { SettingsScreen } from "@/features/settings/settings-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("settings") };
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const params = await searchParams;
  const raw = Array.isArray(params.section) ? params.section[0] : params.section;
  const section = SECTIONS.find((s): s is SectionId => s === raw);
  return (
    <PageGuard page="settings">
      <SettingsScreen key={section ?? "company"} initialSection={section} />
    </PageGuard>
  );
}
