"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, KeepMounted } from "@/components/ui/overlay";
import { controlClass } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { changePassword, disableTwoFactor, enableTwoFactor, revokeOtherSessions, revokeSession, startTwoFactor } from "@/services/profile";
import { useProfile } from "@/store/profile";

const card = "overflow-hidden rounded-xl border border-border bg-surface shadow-card";

function PasswordModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Profile.password");
  const tc = useTranslations("Profile");
  const toast = useToast();
  const [d, setD] = useState({ cur: "", nw: "", cf: "" });
  const [tried, setTried] = useState(false);
  const [wrong, setWrong] = useState(false);
  const errors = { cur: !d.cur ? t("currentError") : wrong ? t("currentWrong") : "", nw: d.nw.length >= 10 ? "" : t("lengthError"), cf: d.nw === d.cf ? "" : t("matchError") };
  const save = async () => {
    if (Object.values(errors).some(Boolean)) return setTried(true);
    try {
      if ((await changePassword(d.cur, d.nw)) === "wrong") return setWrong(true);
    } catch (e) {
      return toast(e instanceof Error ? e.message : t("failed"), "bad");
    }
    toast(t("updated"));
    onClose();
  };
  const field = (label: string, key: keyof typeof d) => (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{label}
      <input type="password" autoComplete={key === "cur" ? "current-password" : "new-password"} value={d[key]} onChange={(e) => { setWrong(false); setD({ ...d, [key]: e.target.value }); }} aria-invalid={tried && !!errors[key]} className={controlClass(tried && !!errors[key])} />
      {tried && errors[key] && <span className="text-[12px] font-normal text-bad">{errors[key]}</span>}
    </label>
  );
  return (
    <Modal open onClose={onClose} title={t("modalTitle")} className="max-w-[460px]" footer={<><Button onClick={onClose}>{tc("cancel")}</Button><Button variant="primary" onClick={save}>{t("update")}</Button></>}>
      <div className="flex flex-col gap-3.5">{field(t("current"), "cur")}{field(t("new"), "nw")}{field(t("confirm"), "cf")}</div>
    </Modal>
  );
}

function TwoFactor() {
  const t = useTranslations("Profile.twofa");
  const toast = useToast();
  const twoFactor = useProfile((st) => st.twoFactor);
  const [step, setStep] = useState<"idle" | "setup" | "codes">("idle");
  const [secret, setSecret] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [confirmOff, setConfirmOff] = useState(false);
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);

  const begin = async () => {
    try {
      const s = await startTwoFactor();
      setSecret({ secret: s.secret, uri: s.otpauth_uri });
      setStep("setup");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("failed"), "bad");
    }
  };
  const verify = async () => {
    if (!/^\d{6}$/.test(code)) return setError(t("codeError"));
    try {
      const backup = await enableTwoFactor(code);
      if (!backup) return setError(t("codeWrong"));
      setError("");
      setCodes(backup);
      setStep("codes");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([codes.join("\n")], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = "staffsync-backup-codes.txt"; a.click();
    URL.revokeObjectURL(url);
  };
  const finish = () => { setStep("idle"); setCode(""); setSecret(null); toast(t("enabledToast")); };
  const turnOff = async () => {
    try {
      if (!(await disableTwoFactor(password))) return setWrongPassword(true);
    } catch (e) {
      return toast(e instanceof Error ? e.message : t("failed"), "bad");
    }
    setConfirmOff(false);
    setPassword("");
    toast(t("offToast"));
  };

  return (
    <section className={card}>
      <div className="border-b border-border px-[18px] py-3.5"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div>
      <div className="flex flex-col gap-3.5 px-[18px] py-4">
        {step === "idle" && !twoFactor && (<><p className="m-0 text-[13.5px] text-text-2">{t("intro")}</p><Button variant="primary" className="self-start" onClick={begin}>{t("setUp")}</Button></>)}
        {step === "setup" && secret && (
          <div className="flex flex-wrap items-start gap-5">
            <div className="rounded-xl border border-border bg-white p-2.5"><QRCodeSVG value={secret.uri} size={120} level="M" /></div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
              <p className="m-0 text-[13px] text-text-2">{t("scan")} <b className="font-mono text-text">{secret.secret}</b>.<br />{t("enterCode")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }} maxLength={6} inputMode="numeric" placeholder="000000" aria-label={t("codeLabel")} aria-invalid={!!error} className={cn(controlClass(!!error), "w-[130px] font-mono text-[15px] tracking-[.2em]")} />
                <Button variant="primary" onClick={verify}>{t("verify")}</Button>
                <Button variant="ghost" onClick={() => { setStep("idle"); setCode(""); setError(""); setSecret(null); }}>{t("cancel")}</Button>
              </div>
              {error && <span className="text-[12px] text-bad">{error}</span>}
            </div>
          </div>
        )}
        {step === "codes" && (
          <div className="rounded-[10px] border border-border bg-surface-2 p-3">
            <div className="mb-2 text-[13px] font-medium">{t("saveCodes")}</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-1.5 font-mono text-[13px]">{codes.map((c) => <span key={c}>{c}</span>)}</div>
            <div className="mt-2.5 flex gap-2"><Button size="sm" onClick={download}>{t("download")}</Button><Button size="sm" variant="primary" onClick={finish}>{t("saved")}</Button></div>
          </div>
        )}
        {twoFactor && step === "idle" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-ok-bg px-2.5 py-[3px] text-[12.5px] font-medium text-ok">{t("enabled")}</span>
            <Button className="text-bad" onClick={() => setConfirmOff(true)}>{t("turnOff")}</Button>
          </div>
        )}
      </div>
      <Modal open={confirmOff} onClose={() => { setConfirmOff(false); setPassword(""); setWrongPassword(false); }} title={t("offTitle")} className="max-w-[420px]"
        footer={<><Button onClick={() => { setConfirmOff(false); setPassword(""); setWrongPassword(false); }}>{t("cancel")}</Button><Button variant="danger" disabled={!password} onClick={turnOff}>{t("turnOff")}</Button></>}>
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[13.5px] text-text-2">{t("offMessage")}</p>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-2">{t("passwordLabel")}
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setWrongPassword(false); }} aria-invalid={wrongPassword} className={controlClass(wrongPassword)} />
            {wrongPassword && <span className="text-[12px] font-normal text-bad">{t("passwordWrong")}</span>}
          </label>
        </div>
      </Modal>
    </section>
  );
}

function Sessions() {
  const t = useTranslations("Profile.sessions");
  const toast = useToast();
  const sessions = useProfile((st) => st.sessions);
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-3.5"><div className="min-w-[180px] flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div><Button size="sm" onClick={async () => { try { await revokeOtherSessions(); } catch (e) { return toast(e instanceof Error ? e.message : t("failed"), "bad"); } toast(t("signedOutOthers")); }}>{t("signOutOthers")}</Button></div>
      {sessions.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-3.5 border-t border-border px-[18px] py-3 first:border-t-0">
          <div className="min-w-[180px] flex-1">
            <div className="text-[13.5px] font-medium">{s.device} {s.current && <span className="ml-1 rounded-full bg-ok-bg px-[7px] py-0.5 text-[11.5px] font-normal text-ok">{t("thisDevice")}</span>}</div>
            <div className="text-[12.5px] text-text-3">{t("meta", { place: s.place, when: s.when })}</div>
          </div>
          {!s.current && <Button size="sm" onClick={async () => { try { await revokeSession(s.id); } catch (e) { return toast(e instanceof Error ? e.message : t("failed"), "bad"); } toast(t("signedOut", { device: s.device })); }}>{t("signOut")}</Button>}
        </div>
      ))}
    </section>
  );
}

export function SecurityTab() {
  const t = useTranslations("Profile.password");
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className={card}>
        <div className="flex flex-wrap items-center gap-3 px-[18px] py-3.5"><div className="min-w-[180px] flex-1"><h2 className="m-0 text-[14.5px] font-semibold">{t("title")}</h2><p className="mt-0.5 text-[12.5px] text-text-3">{t("sub")}</p></div><Button variant="primary" size="sm" onClick={() => setOpen(true)}>{t("change")}</Button></div>
      </section>
      <TwoFactor />
      <Sessions />
      <KeepMounted show={!!open}>{open && <PasswordModal onClose={() => setOpen(false)} />}</KeepMounted>
    </>
  );
}
