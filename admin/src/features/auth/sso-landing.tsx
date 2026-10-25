"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markSignedIn } from "@/lib/auth-cookie";
import { bootstrap } from "@/services/auth";
import { useAuth } from "@/store/auth";

/** Where the API sends the browser after single sign-on: pick up the session cookie it set, then enter the dashboard. */
export function SsoLanding() {
  const router = useRouter();
  useEffect(() => {
    let live = true;
    void bootstrap().then((ok) => {
      if (!live) return;
      if (!ok) return router.replace("/sign-in?sso_error=failed");
      markSignedIn();
      router.replace((useAuth.getState().me?.companies.length ?? 0) > 1 ? "/workspaces" : "/dashboard");
    });
    return () => {
      live = false;
    };
  }, [router]);
  return <div role="status" aria-busy className="grid min-h-screen place-items-center bg-bg"><span className="box-border size-6 animate-spin-fast rounded-full border-2 border-solid border-border-strong border-t-accent" /></div>;
}
