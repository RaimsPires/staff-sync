"use client";

import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { ManagedSite } from "@/types/site";

/** Printable site QR code that employees scan to check in. */
export function SiteQrDialog({ site, onClose }: { site: ManagedSite | null; onClose: () => void }) {
  const t = useTranslations("Sites.qr");
  const toast = useToast();
  return (
    <Modal
      open={site !== null}
      onClose={onClose}
      title={t("title", { name: site?.name ?? "" })}
      className="max-w-[380px]"
      footer={<><Button onClick={onClose}>{t("close")}</Button><Button variant="primary" onClick={() => { window.print(); toast(t("sent")); }}><Printer size={15} /> {t("print")}</Button></>}
    >
      {site && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-xl bg-white p-4"><QRCodeSVG value={`staffsync://site/${site.code}`} size={200} level="M" marginSize={1} /></div>
          <code className="rounded-md bg-surface-2 px-2 py-1 font-mono text-[12px] text-text-2">staffsync://site/{site.code}</code>
          <p className="m-0 text-[12.5px] text-text-3 text-pretty">{t("hint")}</p>
        </div>
      )}
    </Modal>
  );
}
