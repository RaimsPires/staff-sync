import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { UsersScreen } from "@/features/users/users-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("users") };
}

export default function UsersPage() {
  return (
    <PageGuard page="users">
      <UsersScreen />
    </PageGuard>
  );
}
