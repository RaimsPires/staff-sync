import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { PlansScreen } from "@/features/plans/plans-screen";

export async function generateMetadata() {
  const t = await getTranslations("Plans");
  return { title: t("title") };
}

export default function PlansPage() {
  return (
    <PageGuard page="settings">
      <PlansScreen />
    </PageGuard>
  );
}
