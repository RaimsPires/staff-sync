import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { UsersScreen } from "@/features/users/users-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("users") };
}

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const { tab } = await searchParams;
  return (
    <PageGuard page="users">
      <UsersScreen initialTab={tab === "roles" ? "roles" : "users"} />
    </PageGuard>
  );
}
