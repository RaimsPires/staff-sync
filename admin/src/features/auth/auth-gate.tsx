"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bootstrap } from "@/services/auth";
import { useAuth } from "@/store/auth";
import { SyncErrorToaster } from "./sync-error-toaster";
import { LiveFeed } from "./live-feed";
import { ChatLive } from "@/features/chat/chat-live";

/** Holds the dashboard back until the session is restored and `/me` is loaded; signed-out visitors go to sign-in. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const signedIn = useAuth((s) => s.me !== null);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (signedIn) return;
    let live = true;
    void bootstrap().then((ok) => {
      if (!live) return;
      if (!ok) {
        setFailed(true);
        router.replace("/sign-in");
      }
    });
    return () => {
      live = false;
    };
  }, [signedIn, router]);

  if (signedIn) return <><SyncErrorToaster /><LiveFeed /><ChatLive />{children}</>;
  return <div role="status" aria-busy={!failed} className="grid min-h-screen place-items-center bg-bg"><span className="box-border size-6 animate-spin-fast rounded-full border-2 border-solid border-border-strong border-t-accent" /></div>;
}
