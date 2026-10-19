import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { EmployeesScreen } from "@/features/employees/employees-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("employees") };
}

export default function EmployeesPage() {
  return (
    <PageGuard page="employees">
      <EmployeesScreen />
    </PageGuard>
  );
}
