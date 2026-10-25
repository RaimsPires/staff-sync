import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthHeader } from "@/features/auth/auth-header";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export async function generateMetadata() {
  const t = await getTranslations("Auth.reset");
  return { title: t("title") };
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-[14px] leading-[1.45] text-text">
      <AuthHeader />
      <main className="flex flex-1 items-start justify-center px-5 pb-14 pt-8">
        <div className="w-full max-w-[440px] animate-rise">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
