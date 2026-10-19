import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { ReportsScreen } from "@/features/reports/reports-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("reports") };
}

export default function ReportsPage() {
  return (
    <PageGuard page="reports">
      <ReportsScreen />
    </PageGuard>
  );
}
