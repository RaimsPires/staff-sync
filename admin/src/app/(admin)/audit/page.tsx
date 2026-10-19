import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { AuditScreen } from "@/features/audit/audit-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("audit") };
}

export default function AuditPage() {
  return (
    <PageGuard page="audit">
      <AuditScreen />
    </PageGuard>
  );
}
