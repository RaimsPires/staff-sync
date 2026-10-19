import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { ProfileScreen, type ProfileTab } from "@/features/profile/profile-screen";

const TABS: ProfileTab[] = ["profile", "security", "notif"];

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("profile") };
}

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const params = await searchParams;
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab = TABS.find((x) => x === raw);
  return (
    <PageGuard page="profile">
      <ProfileScreen key={tab ?? "profile"} initialTab={tab} />
    </PageGuard>
  );
}
