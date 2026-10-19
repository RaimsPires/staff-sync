import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { AlertsScreen } from "@/features/alerts/alerts-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("alerts") };
}

export default function AlertsPage() {
  return (
    <PageGuard page="alerts">
      <AlertsScreen />
    </PageGuard>
  );
}
