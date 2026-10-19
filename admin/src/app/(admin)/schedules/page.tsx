import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { SchedulesScreen } from "@/features/schedules/schedules-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("schedules") };
}

export default function SchedulesPage() {
  return (
    <PageGuard page="schedules">
      <SchedulesScreen />
    </PageGuard>
  );
}
