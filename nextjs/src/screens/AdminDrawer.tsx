'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


class AdminDrawerBase extends DCLogic {}

class AdminDrawerView extends AdminDrawerBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
<div onClick={ad?.closeDrawer} className="fixed inset-[0] bg-overlay z-[20]" />
<aside role="dialog" aria-label={tr("attendance_record")} className="fixed top-[0] right-[0] bottom-[0] w-[560px] max-w-[100vw] bg-surface border-l border-solid border-l-border shadow-pop z-[21] flex flex-col [animation:ssDrawer_.22s_ease-out]">
<div className="p-[14px_20px_16px] border-b border-solid border-b-border flex flex-col gap-[12px]">
<div className="flex items-center gap-[8px] text-[12px] text-text-3">
<span className="[font:500_12px_'Geist_Mono',monospace] p-[2px_7px] rounded-[6px] bg-surface-2 border border-solid border-border">
{ad?.d?.recId}
</span>
<span>
{ad?.d?.dateL}
</span>
<div className="flex-1" />
<button onClick={ad?.closeDrawer} title={ad?.t?.close} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-transparent text-text-2 grid place-items-center cursor-pointer hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
<div className="flex items-center gap-[14px]">
<div className="w-[52px] h-[52px] rounded-[50%] grid place-items-center text-[17px] font-semibold flex-none" style={{background:ad?.d?.av?.bg,color:ad?.d?.av?.fg}}>
{ad?.d?.av?.ini}
</div>
<div className="flex-1 min-w-[0]">
<div className="font-semibold text-[17px] tracking-[-.01em]">
{ad?.d?.name}
</div>
<div className="text-[13px] text-text-2">
{ad?.d?.job}{" · "}{ad?.d?.siteName}
</div>
<div className="[font:400_11.5px_'Geist_Mono',monospace] text-text-3">
{ad?.d?.empId}{" · "}{ad?.d?.branch}
</div>
</div>
<button onClick={ad?.d?.profile} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[32px]">
{ad?.d?.L?.profile}
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M7 17L17 7M9 7h8v8" />
</svg>
</button>
</div>
<div className="flex gap-[6px] flex-wrap items-center">
<span className="inline-flex items-center gap-[6px] h-[26px] p-[0_10px] rounded-[999px] text-[12.5px] font-medium" style={{background:ad?.d?.chip?.bg,color:ad?.d?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:ad?.d?.chip?.dot}} />
{ad?.d?.chip?.label}
</span>
<span className="inline-flex items-center gap-[6px] h-[26px] p-[0_10px] rounded-[999px] text-[12.5px] bg-surface-2 border border-solid border-border text-text-2">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={ad?.d?.mIcon} />
</svg>
{ad?.d?.methodShort}
</span>
{ad?.d?.isOffline ? (<>
<span className="inline-flex items-center gap-[6px] h-[26px] p-[0_10px] rounded-[999px] text-[12.5px] font-medium bg-info-bg text-info">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M2 2l20 20M17.5 17.5H7a5 5 0 0 1-1.7-9.7M10 5.2A6 6 0 0 1 18 10h1a4 4 0 0 1 2.4 7.2" />
</svg>
{ad?.d?.offlineL}
</span>
</>) : null}
{ad?.d?.isApproved ? (<>
<span className="inline-flex items-center gap-[6px] h-[26px] p-[0_10px] rounded-[999px] text-[12.5px] font-medium bg-ok-bg text-ok">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 12l5 5L20 7" />
</svg>
{ad?.d?.approvedL}
</span>
</>) : null}
</div>
</div>
<div className="flex-1 overflow-auto p-[18px_20px_24px] flex flex-col gap-[22px]">
{ad?.d?.hasFlag ? (<>
<div className="flex flex-col gap-[10px] p-[12px_14px] rounded-[10px] bg-bad-bg text-bad">
<div className="flex gap-[10px]">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[1px]">
<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16h.01" />
</svg>
<div>
<div className="font-semibold text-[13.5px]">
{ad?.d?.flagTitle}
</div>
<div className="text-[12.5px]">
{ad?.d?.flagDesc}
</div>
</div>
</div>
{ad?.d?.canReview ? (<>
<div className="flex gap-[8px] pl-[28px]">
<button onClick={ad?.d?.approveFlag} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[30px] border-transparent">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-ok">
<path d="M5 12l5 5L20 7" />
</svg>
{ad?.d?.L?.approveFlag}
</button>
<button onClick={ad?.d?.rejectFlag} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[30px] border-0 bg-bad-dot text-[color:#fff]">
{ad?.d?.L?.rejectFlag}
</button>
</div>
</>) : null}
{ad?.d?.noPermNote ? (<>
<div className="text-[12px] pl-[28px]">
{ad?.t?.noPermFlag}
</div>
</>) : null}
</div>
</>) : null}
<div>
<div className="flex justify-between items-baseline">
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[10px]">
{ad?.d?.L?.times}
</div>
{ad?.d?.canEdit ? (<>
<button onClick={ad?.d?.openTimes} className="border-0 bg-transparent text-accent text-[12.5px] font-medium cursor-pointer p-[0]">
{ad?.d?.L?.editTimes}
</button>
</>) : null}
</div>
<div className="border border-solid border-border rounded-[10px] overflow-hidden">
<div className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr] gap-[8px] p-[8px_14px] bg-surface-2 text-[11.5px] text-text-3 font-medium">
<span />
<span>
{ad?.d?.L?.scheduled}
</span>
<span>
{ad?.d?.L?.actual}
</span>
<span className="text-right">
{ad?.d?.L?.diff}
</span>
</div>
{(ad?.d?.times ?? []).map((tm, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr] gap-[8px] p-[10px_14px] border-t border-solid border-t-border items-center">
<span className="text-[13px] text-text-2">
{tm?.k}
</span>
<span className="[font:400_13px_'Geist_Mono',monospace] text-text-3">
{tm?.sched}
</span>
<span className="[font:600_13px_'Geist_Mono',monospace]" style={{color:tm?.actC}}>
{tm?.act}
</span>
<span className="text-right">
<span className="inline-block text-[12px] font-medium p-[2px_8px] rounded-[999px] whitespace-nowrap" style={{background:tm?.diffBg,color:tm?.diffC}}>
{tm?.diff}
</span>
</span>
</div>
</Fragment>))}
</div>
</div>
{ad?.d?.editing ? (<>
<div className="border border-solid border-accent [box-shadow:0_0_0_3px_var(--accent-soft)] rounded-[12px] p-[14px] flex flex-col gap-[12px] [animation:ssIn_.16s_ease-out]">
<div className="font-semibold text-[13.5px]">
{ad?.d?.edTitle}
</div>
{ad?.d?.edTimes ? (<>
<div className="grid grid-cols-[1fr_1fr] gap-[10px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium">
{ad?.t?.colIn}
<input type="time" value={ad?.d?.ed?.in} onChange={ad?.d?.ed?.onIn} className="h-[36px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_13px_'Geist_Mono',monospace] min-w-[0] [outline-color:var(--accent)]" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium">
{ad?.t?.colOut}
<input type="time" value={ad?.d?.ed?.out} onChange={ad?.d?.ed?.onOut} className="h-[36px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_13px_'Geist_Mono',monospace] min-w-[0] [outline-color:var(--accent)]" style={{borderColor:ad?.d?.ed?.outBd}} />
</label>
</div>
{ad?.d?.ed?.timeErr ? (<>
<span className="text-[12.5px] text-bad mt-[-6px]">
{ad?.d?.L?.errTime}
</span>
</>) : null}
</>) : null}
{ad?.d?.edStatus ? (<>
<div className="flex flex-wrap gap-[6px]">
{(ad?.d?.ed?.statusOpts ?? []).map((so, $index) => (<Fragment key={$index}>
<button onClick={so?.go} className="flex items-center gap-[6px] h-[30px] p-[0_10px] rounded-[999px] text-text text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${so?.bd}`,background:so?.bg}}>
<span className="w-[7px] h-[7px] rounded-[50%]" style={{background:so?.dot}} />
{so?.label}
</button>
</Fragment>))}
</div>
</>) : null}
{ad?.d?.ed?.hasDiff ? (<>
<div className="flex flex-col gap-[4px] text-[12.5px] p-[8px_10px] rounded-[8px] bg-surface-2">
{(ad?.d?.ed?.diffs ?? []).map((df, $index) => (<Fragment key={$index}>
<div className="flex gap-[8px] items-center">
<span className="text-text-3 min-w-[80px]">
{df?.k}
</span>
<span className="line-through text-text-3 [font-family:'Geist_Mono',monospace]">
{df?.a}
</span>
{"→"}
<span className="font-semibold [font-family:'Geist_Mono',monospace]">
{df?.b}
</span>
</div>
</Fragment>))}
</div>
</>) : null}
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium">
{ad?.d?.L?.reason}{" "}
<textarea value={ad?.d?.ed?.reason} onChange={ad?.d?.ed?.onReason} rows="2" placeholder={ad?.d?.L?.reasonPh} className="p-[9px_11px] rounded-[9px] bg-surface text-text [font:400_13px_'Geist',sans-serif] resize-y [outline-color:var(--accent)]" style={{border:`1px solid ${ad?.d?.ed?.reasonBd}`}} />
</label>
{ad?.d?.ed?.reasonErr ? (<>
<span className="text-[12.5px] text-bad mt-[-6px]">
{ad?.d?.L?.errReason}
</span>
</>) : null}
<div className="flex justify-end gap-[8px]">
<button onClick={ad?.d?.ed?.cancel} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[32px]">
{ad?.t?.cancel}
</button>
<button onClick={ad?.d?.ed?.save} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[32px] border-0 bg-accent text-[color:#fff]">
{ad?.d?.L?.saveChanges}
</button>
</div>
</div>
</>) : null}
<div>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[10px]">
{ad?.d?.L?.location}
</div>
<div className="relative [aspect-ratio:400/220] rounded-[10px] overflow-hidden bg-map-bg border border-solid border-border">
<svg viewBox="0 0 400 220" className="absolute inset-[0] w-[100%] h-[100%]">
<rect x="18" y="14" width="70" height="40" rx="3" className="[fill:var(--map-block)]" />
<rect x="300" y="64" width="80" height="50" rx="3" className="[fill:var(--map-block)]" />
<rect x="20" y="78" width="66" height="60" rx="3" className="[fill:var(--map-block)]" />
<path d="M0 176 C 80 158, 150 214, 250 194 S 360 168, 400 182 L400 220 L0 220Z" className="[fill:var(--map-water)]" />
<g strokeLinecap="round" className="[stroke:var(--map-road)] [fill:none]">
<path d="M0 60 L400 50" strokeWidth="7" />
<path d="M96 0 L106 220" strokeWidth="7" />
<path d="M0 150 L400 140" strokeWidth="5" />
<path d="M236 0 L292 220" strokeWidth="5" />
<path d="M340 0 L350 140" strokeWidth="3" />
</g>
<circle cx="200" cy="108" r={ad?.d?.fence?.r} className="[fill:var(--fence)] [stroke:var(--accent)] [stroke-width:1.6] [stroke-dasharray:5_4]" />
<polygon points={ad?.d?.fence?.points} className="[fill:var(--fence)] [stroke:var(--accent)] [stroke-width:1.6] [stroke-dasharray:5_4] [stroke-linejoin:round]" />
<line x1="200" y1="108" x2={ad?.d?.ci?.x} y2={ad?.d?.ci?.y} className="[stroke-width:1.4] [stroke-dasharray:3_3]" style={{stroke:ad?.d?.ci?.c,opacity:ad?.d?.ci?.op}} />
<line x1="200" y1="108" x2={ad?.d?.co?.x} y2={ad?.d?.co?.y} className="[stroke:var(--violet-dot)] [stroke-width:1.4] [stroke-dasharray:3_3]" style={{opacity:ad?.d?.co?.op}} />
<rect x="195" y="103" width="10" height="10" rx="2" transform="rotate(45 200 108)" className="[fill:var(--accent)] [stroke:var(--surface)] [stroke-width:2]" />
<circle cx={ad?.d?.co?.x} cy={ad?.d?.co?.y} r="6" className="[fill:var(--violet-dot)] [stroke:var(--surface)] [stroke-width:2.5]" style={{opacity:ad?.d?.co?.op}} />
<circle cx={ad?.d?.ci?.x} cy={ad?.d?.ci?.y} r="7" className="[stroke:var(--surface)] [stroke-width:2.5]" style={{fill:ad?.d?.ci?.c,opacity:ad?.d?.ci?.op}} />
</svg>
{ad?.d?.noGps ? (<>
<div className="absolute inset-[0] grid place-items-center bg-[color:rgba(0,0,0,.04)]">
<span className="p-[6px_10px] rounded-[8px] bg-surface border border-solid border-border text-[12.5px] text-text-2">
{ad?.d?.L?.noGps}
</span>
</div>
</>) : null}
</div>
<div className="flex gap-[14px] flex-wrap m-[8px_0_12px] text-[12px] text-text-2">
<span className="flex items-center gap-[6px]">
<span className="w-[9px] h-[9px] rounded-[50%]" style={{background:ad?.d?.ci?.c}} />
{ad?.t?.colIn}{" · "}{ad?.d?.ci?.dist}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[9px] h-[9px] rounded-[50%] bg-violet-dot" />
{ad?.t?.colOut}{" · "}{ad?.d?.co?.dist}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[8px] h-[8px] bg-accent [transform:rotate(45deg)] rounded-[2px]" />
{ad?.d?.L?.center}
</span>
</div>
<div className="grid grid-cols-[1fr_1fr] border border-solid border-border rounded-[10px] overflow-hidden">
{(ad?.d?.facts ?? []).map((fc, $index) => (<Fragment key={$index}>
<div className="p-[10px_12px] border-b border-solid border-b-border border-r border-r-border m-[0_-1px_-1px_0]">
<div className="text-[11.5px] text-text-3">
{fc?.k}
</div>
<div className="font-medium text-[13px]" style={{color:fc?.c}}>
{fc?.v}
</div>
</div>
</Fragment>))}
</div>
</div>
{ad?.d?.hasSelfies ? (<>
<div>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[10px]">
{ad?.d?.L?.selfies}
</div>
<div className="flex gap-[10px]">
{(ad?.d?.selfies ?? []).map((sf, $index) => (<Fragment key={$index}>
<button onClick={sf?.open} className="w-[120px] border border-solid border-border rounded-[10px] overflow-hidden bg-surface p-[0] [cursor:zoom-in] text-left">
<div className="[aspect-ratio:3/4] [background:repeating-linear-gradient(135deg,var(--surface-2)_0_8px,var(--neutral-bg)_8px_16px)] grid place-items-center text-text-3">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
</svg>
</div>
<div className="p-[6px_8px]">
<div className="text-[12px] font-medium text-text">
{sf?.label}
</div>
<div className="[font:400_11px_'Geist_Mono',monospace] text-text-3">
{sf?.time}
</div>
</div>
</button>
</Fragment>))}
</div>
</div>
</>) : null}
<div>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[10px]">
{ad?.t?.timeline}
</div>
<div className="flex flex-col">
{(ad?.d?.events ?? []).map((ev, $index) => (<Fragment key={$index}>
<div className="flex gap-[12px]">
<div className="flex flex-col items-center">
<span className="w-[10px] h-[10px] rounded-[50%] mt-[4px] flex-none" style={{background:ev?.c}} />
<span className="w-[1px] flex-1 bg-border min-h-[14px]" />
</div>
<div className="pb-[12px] flex-1 min-w-[0]">
<div className="text-[13px]">
<span className="[font:500_12.5px_'Geist_Mono',monospace] text-text-2 mr-[8px]">
{ev?.time}
</span>
{ev?.label}
</div>
<div className="text-[12px] text-text-3">
{ev?.sub}
</div>
</div>
</div>
</Fragment>))}
</div>
</div>
<div>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[10px]">
{ad?.d?.L?.history}
</div>
{ad?.d?.hasHistory ? (<>
<div className="flex flex-col border border-solid border-border rounded-[10px] overflow-hidden">
{(ad?.d?.history ?? []).map((hi, $index) => (<Fragment key={$index}>
<div className="p-[11px_14px] border-b border-solid border-b-border flex flex-col gap-[6px]">
<div className="flex items-center gap-[8px] text-[12.5px]">
<span className="w-[22px] h-[22px] rounded-[50%] grid place-items-center text-[9.5px] font-semibold flex-none" style={{background:hi?.av?.bg,color:hi?.av?.fg}}>
{hi?.av?.ini}
</span>
<strong className="font-semibold">
{hi?.by}
</strong>
<span className="text-text-3">
{hi?.at}
</span>
</div>
{(hi?.changes ?? []).map((hc, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[90px_auto_auto_1fr] gap-[8px] items-center text-[12.5px] pl-[30px]">
<span className="text-text-3">
{hc?.k}
</span>
<span className="p-[1px_7px] rounded-[6px] bg-bad-bg text-bad line-through [font-family:'Geist_Mono',monospace]">
{hc?.a}
</span>
<span className="p-[1px_7px] rounded-[6px] bg-ok-bg text-ok [font-family:'Geist_Mono',monospace]">
{hc?.b}
</span>
<span />
</div>
</Fragment>))}
<div className="text-[12.5px] text-text-2 pl-[30px]">
{"“"}{hi?.reason}{"”"}
</div>
</div>
</Fragment>))}
</div>
</>) : null}
{ad?.d?.noHistory ? (<>
<div className="text-[12.5px] text-text-3">
{ad?.d?.L?.noHistory}
</div>
</>) : null}
</div>
<div>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[10px]">
{ad?.d?.L?.notes}
</div>
<div className="flex flex-col gap-[12px]">
{(ad?.d?.notes ?? []).map((nt, $index) => (<Fragment key={$index}>
<div className="flex gap-[10px]">
<span className="w-[28px] h-[28px] rounded-[50%] grid place-items-center text-[11px] font-semibold flex-none" style={{background:nt?.av?.bg,color:nt?.av?.fg}}>
{nt?.av?.ini}
</span>
<div className="flex-1 min-w-[0]">
<div className="text-[12.5px]">
<strong className="font-semibold">
{nt?.by}
</strong>
{" "}
<span className="text-text-3">
{nt?.at}
</span>
</div>
<div className="text-[13px] text-text mt-[2px] p-[8px_11px] rounded-[0_10px_10px_10px] bg-surface-2 border border-solid border-border [text-wrap:pretty]">
{nt?.text}
</div>
</div>
</div>
</Fragment>))}
<div className="flex gap-[10px] items-start">
<span className="w-[28px] h-[28px] rounded-[50%] grid place-items-center text-[11px] font-semibold flex-none" style={{background:ad?.d?.meAv?.bg,color:ad?.d?.meAv?.fg}}>
{ad?.d?.meAv?.ini}
</span>
<div className="flex-1 flex flex-col gap-[6px]">
<textarea value={ad?.d?.note} onChange={ad?.d?.onNote} rows="2" placeholder={ad?.d?.L?.notePh} className="p-[9px_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:400_13px_'Geist',sans-serif] resize-y [outline-color:var(--accent)]" />
<button onClick={ad?.d?.postNote} disabled={ad?.d?.noteDisabled} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[30px] self-end" style={{opacity:ad?.d?.noteOp}}>
{ad?.d?.L?.post}
</button>
</div>
</div>
</div>
</div>
</div>
<div className="flex gap-[8px] items-center p-[12px_20px] border-t border-solid border-t-border bg-surface-2 flex-wrap">
{ad?.d?.canDelete ? (<>
<button onClick={ad?.d?.askDelete} title={ad?.d?.L?.delete} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] text-bad hover:bg-bad-bg">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
</svg>
{ad?.d?.L?.delete}
</button>
</>) : null}
<div className="flex-1" />
{ad?.d?.canEdit ? (<>
<button onClick={ad?.d?.openStatus} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]">
{ad?.d?.L?.changeStatus}
</button>
</>) : null}
{ad?.d?.showBehalf ? (<>
<button onClick={ad?.d?.behalf} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] border-0 bg-accent text-[color:#fff]">
{ad?.t?.checkInBehalf}
</button>
</>) : null}
{ad?.d?.canApproveRec ? (<>
<button onClick={ad?.d?.approveRec} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] border-0 bg-accent text-[color:#fff] hover:bg-accent-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 12l5 5L20 7" />
</svg>
{ad?.d?.L?.approveRec}
</button>
</>) : null}
</div>
</aside>
{ad?.d?.confirmDel ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[20px]">
<div className="w-[420px] max-w-[100%] bg-surface border border-solid border-border rounded-[14px] shadow-pop [animation:ssIn_.18s_ease-out] p-[20px_22px] flex flex-col gap-[12px]">
<div className="w-[40px] h-[40px] rounded-[10px] bg-bad-bg text-bad grid place-items-center">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
</svg>
</div>
<div className="font-semibold text-[16px]">
{ad?.d?.L?.delTitle}
</div>
<div className="text-[13px] text-text-2 [text-wrap:pretty]">
{ad?.d?.delDesc}
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium">
{ad?.d?.L?.reason}
<input value={ad?.d?.delReason} onChange={ad?.d?.onDelReason} placeholder={ad?.d?.L?.delPh} className="h-[36px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] [outline-color:var(--accent)]" />
</label>
<div className="flex justify-end gap-[8px] mt-[4px]">
<button onClick={ad?.d?.cancelDel} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[36px]">
{ad?.t?.cancel}
</button>
<button onClick={ad?.d?.doDelete} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[36px] border-0 bg-bad-dot text-[color:#fff]" style={{opacity:ad?.d?.delOp}}>
{ad?.d?.L?.delConfirm}
</button>
</div>
</div>
</div>
</>) : null}
</>
    );
  }
}

export default function AdminDrawer(props: any) {
  const tr = useTranslations('AdminDrawer');
  return <AdminDrawerView {...props} tr={tr} />;
}
