"use client";

import { useEffect, useState } from "react";
import { previewInvitation, type InvitePreview } from "@/services/auth";
import { InviteScreen } from "./invite-screen";

/** Loads what an invitation link is for, then shows the accept page (or the "expired" / "already used" page). */
export function InviteLoader({ token }: { token: string }) {
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    previewInvitation(token).then((p) => live && setPreview(p), () => live && setPreview(null));
    return () => {
      live = false;
    };
  }, [token]);

  if (preview === undefined) return <div role="status" aria-busy className="grid h-64 place-items-center"><span className="box-border size-6 animate-spin-fast rounded-full border-2 border-solid border-border-strong border-t-accent" /></div>;
  if (preview === null) return <InviteScreen state="used" />;
  return (
    <InviteScreen
      state={preview.expired ? "expired" : "valid"}
      invite={{ token, company: preview.company ?? "", invitedBy: preview.invited_by ?? "", role: preview.role ?? "", email: preview.email ?? "" }}
    />
  );
}
