import { getTranslations } from "next-intl/server";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";

export async function generateMetadata() {
  const t = await getTranslations("Onboarding");
  return { title: t("metaTitle") };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const params = await searchParams;
  const raw = Number(Array.isArray(params.step) ? params.step[0] : params.step);
  const startStep = Number.isFinite(raw) ? Math.min(9, Math.max(1, Math.trunc(raw))) : 1;
  return <OnboardingScreen startStep={startStep} />;
}
