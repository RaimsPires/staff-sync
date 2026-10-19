import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** Left-hand marketing panel. Always dark navy with white cards, in both themes. */
export function BrandPanel() {
  const t = useTranslations("Auth");
  const p = useTranslations("Auth.brandPanel");
  const chips = ["gps", "leave", "roles"] as const;

  return (
    <section className="relative hidden min-h-screen flex-[1_1_50%] flex-col overflow-hidden bg-[#0A2547] px-12 py-10 text-white lg:flex">
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="absolute -right-[220px] -top-[160px] size-[620px] rounded-full border border-white/10" />
      <div className="absolute -right-[120px] -top-[60px] size-[420px] rounded-full border border-white/10" />

      <div className="relative flex items-center gap-2.5">
        <div className="grid size-[38px] place-items-center overflow-hidden rounded-[10px] bg-white">
          <Image src="/staffsync-logo.png" alt="" width={34} height={34} className="object-contain" priority />
        </div>
        <span className="text-[18px] font-bold tracking-tight">{t("brand")}</span>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-10">
        <div className="relative h-[360px] w-full max-w-[440px]">
          {/* Live attendance card */}
          <div className="absolute left-0 top-[30px] w-[300px] rounded-2xl bg-white p-[18px] text-[#0D1B2E] shadow-[0_24px_60px_rgb(0_0_0/0.35)]">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold">{p("today")}</span>
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#0F7A3F]">
                <span className="size-[7px] rounded-full bg-[#16A34A]" />
                {p("live")}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[34px] font-semibold tracking-tight">168</span>
              <span className="text-[12.5px] text-[#6F7A8B]">/ 198 {p("present")}</span>
            </div>
            <div className="my-3 mb-3.5 flex h-2 gap-0.5 overflow-hidden rounded-lg">
              <span className="flex-[152] bg-[#0B67DD]" />
              <span className="flex-[16] bg-[#E59A00]" />
              <span className="flex-[11] bg-[#E5372A]" />
              <span className="flex-[19] bg-[#EEF1F5]" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11.5px]">
              <div className="rounded-lg bg-[#E5F4EA] p-2 text-[#0F7A3F]">
                <div className="text-[15px] font-semibold">152</div>
                {p("onTime")}
              </div>
              <div className="rounded-lg bg-[#FCF0D6] p-2 text-[#8F5300]">
                <div className="text-[15px] font-semibold">16</div>
                {p("late")}
              </div>
              <div className="rounded-lg bg-[#FCE9E7] p-2 text-[#B9241A]">
                <div className="text-[15px] font-semibold">4</div>
                {p("flagged")}
              </div>
            </div>
          </div>

          {/* Geofence mini map */}
          <div className="absolute right-0 top-0 h-[170px] w-[200px] animate-[ssFloat_6s_ease-in-out_infinite] overflow-hidden rounded-2xl bg-[#E9EEF0] shadow-[0_24px_60px_rgb(0_0_0/0.35)]">
            <svg viewBox="0 0 200 170" className="absolute inset-0 size-full" aria-hidden>
              <rect x="10" y="10" width="50" height="34" rx="3" fill="#DDE3DA" />
              <rect x="132" y="102" width="58" height="50" rx="3" fill="#DDE3DA" />
              <path d="M0 130 C 50 118, 90 160, 200 140 L200 170 L0 170Z" fill="#D3E4F2" />
              <g stroke="#fff" fill="none" strokeLinecap="round">
                <path d="M0 56 L200 48" strokeWidth="7" />
                <path d="M74 0 L82 170" strokeWidth="7" />
                <path d="M0 104 L200 96" strokeWidth="4" />
                <path d="M150 0 L170 170" strokeWidth="4" />
              </g>
              <circle cx="110" cy="76" r="40" fill="rgb(11 103 221 / 0.14)" stroke="#0B67DD" strokeWidth="1.6" strokeDasharray="5 4" />
              <circle cx="100" cy="68" r="5" fill="#16A34A" stroke="#fff" strokeWidth="2" />
              <circle cx="122" cy="82" r="5" fill="#16A34A" stroke="#fff" strokeWidth="2" />
              <circle cx="108" cy="92" r="5" fill="#E59A00" stroke="#fff" strokeWidth="2" />
              <circle cx="178" cy="22" r="5" fill="#E5372A" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>

          {/* Check-in toast */}
          <div className="absolute bottom-0 right-5 flex w-[250px] animate-[ssFloat_6s_ease-in-out_-3s_infinite] items-center gap-3 rounded-[14px] bg-white px-3.5 py-3 text-[#0D1B2E] shadow-[0_24px_60px_rgb(0_0_0/0.35)]">
            <div className="grid size-9 flex-none place-items-center rounded-full bg-[oklch(0.93_0.045_150)] text-[12.5px] font-semibold text-[oklch(0.42_0.1_150)]">
              CD
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">{p("person")}</div>
              <div className="text-[11.5px] text-[#6F7A8B]">{p("checkin")}</div>
            </div>
            <span className="rounded-full bg-[#E5F4EA] px-[7px] py-[3px] font-mono text-[11px] font-medium text-[#0F7A3F]">07:54</span>
          </div>
        </div>
      </div>

      <div className="relative max-w-[460px]">
        <h2 className="m-0 text-[30px] font-semibold leading-[1.15] tracking-tight text-balance">{p("title")}</h2>
        <p className="mb-0 mt-3 text-[15px] text-white/80 text-pretty">{p("subtitle")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c} className="flex h-[30px] items-center gap-[7px] rounded-full border border-white/15 bg-white/10 px-3 text-[12.5px]">
              <Check size={13} strokeWidth={2.6} className="text-[#7FB4FF]" />
              {p(`chips.${c}`)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
