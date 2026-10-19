'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


class AdminDashboardBase extends DCLogic {}

class AdminDashboardView extends AdminDashboardBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
{ad?.db?.isNew ? (<>
<div className="flex flex-col gap-[20px]">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{ad?.db?.newTitle}
</h1>
<div className="mt-[4px] text-text-2">
{ad?.db?.st?.newSub}
</div>
</div>
<div className="flex flex-wrap gap-[16px] items-start">
<section className="flex-[1.3_1_460px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="flex items-center gap-[16px] p-[20px_22px] border-b border-solid border-b-border">
<div className="relative w-[56px] h-[56px] flex-none">
<svg viewBox="0 0 36 36" className="w-[56px] h-[56px] [transform:rotate(-90deg)]">
<circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="[stroke:var(--neutral-bg)]" />
<circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={ad?.db?.setupDash} className="[stroke:var(--accent)]" />
</svg>
<span className="absolute inset-[0] grid place-items-center [font:600_13px_'Geist_Mono',monospace]">
{ad?.db?.setupDone}{"/"}{ad?.db?.setupTotal}
</span>
</div>
<div>
<div className="font-semibold text-[16px]">
{ad?.db?.st?.setupTitle}
</div>
<div className="text-[13px] text-text-3">
{ad?.db?.st?.setupSub}
</div>
</div>
</div>
{(ad?.db?.setup ?? []).map((su, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[14px] p-[14px_22px] border-b border-solid border-b-border">
<button onClick={su?.toggle} className="w-[24px] h-[24px] rounded-[50%] text-[color:#fff] grid place-items-center cursor-pointer flex-none p-[0]" style={{border:su?.bd,background:su?.bg}}>
{su?.done ? (<>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 12l5 5L20 7" />
</svg>
</>) : null}
</button>
<span className="w-[34px] h-[34px] rounded-[9px] bg-surface-2 border border-solid border-border text-text-2 grid place-items-center flex-none">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={su?.icon} />
</svg>
</span>
<div className="flex-1 min-w-[0]">
<div className="font-medium" style={{textDecoration:su?.deco,color:su?.fg}}>
{su?.title}
</div>
<div className="text-[12.5px] text-text-3">
{su?.sub}
</div>
</div>
{su?.notDone ? (<>
<button onClick={su?.act} className="h-[32px] p-[0_12px] rounded-[8px] border-0 text-[12.5px] font-medium cursor-pointer whitespace-nowrap" style={{background:su?.ctaBg,color:su?.ctaFg}}>
{su?.cta}
</button>
</>) : null}
</div>
</Fragment>))}
</section>
<section className="flex-[1_1_320px] min-w-[0] flex flex-col gap-[12px]">
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px]">
<div className="font-semibold mb-[4px]">
{ad?.db?.st?.previewTitle}
</div>
<div className="text-[12.5px] text-text-3 mb-[14px]">
{ad?.db?.st?.previewSub}
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[8px]">
{(ad?.db?.ghostKpis ?? []).map((gk, $index) => (<Fragment key={$index}>
<div className="p-[12px] rounded-[10px] border border-dashed border-border-strong flex flex-col gap-[6px]">
<span className="flex items-center gap-[6px] text-[12px] text-text-3">
<span className="w-[7px] h-[7px] rounded-[50%]" style={{background:gk?.dot}} />
{gk?.label}
</span>
<span className="text-[22px] font-semibold text-text-3">
{"—"}
</span>
</div>
</Fragment>))}
</div>
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_20px] flex gap-[12px] items-center">
<span className="w-[36px] h-[36px] rounded-[10px] bg-accent-soft text-accent grid place-items-center flex-none">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z" />
</svg>
</span>
<div className="flex-1 text-[13px]">
<div className="font-semibold">
{ad?.db?.st?.helpTitle}
</div>
<div className="text-text-3 text-[12.5px]">
{ad?.db?.st?.helpSub}
</div>
</div>
<button onClick={ad?.db?.bookCall} className="h-[30px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] font-medium cursor-pointer whitespace-nowrap">
{ad?.db?.st?.book}
</button>
</div>
</section>
</div>
</div>
</>) : null}
{ad?.db?.isLiveCo ? (<>
<div className="flex flex-col gap-[18px]">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div className="min-w-[0]">
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{ad?.db?.st?.title}
</h1>
<div className="flex items-center gap-[8px] mt-[6px] flex-wrap">
<span className="inline-flex items-center gap-[7px] h-[26px] p-[0_10px] rounded-[999px] text-[12.5px] font-semibold" style={{background:ad?.db?.scopeBg,color:ad?.db?.scopeFg}}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={ad?.db?.scopeIcon} />
</svg>
{ad?.db?.scopeResult}
</span>
<span className="text-[13px] text-text-3">
{ad?.db?.scopeMeta}
</span>
</div>
</div>
<div className="flex items-center gap-[8px] flex-wrap">
<button onClick={ad?.db?.refresh} title={ad?.db?.refreshTip} className="flex items-center gap-[8px] h-[36px] p-[0_12px] rounded-[9px] text-[12.5px] font-semibold cursor-pointer whitespace-nowrap" style={{border:`1px solid ${ad?.db?.liveBd}`,background:ad?.db?.liveBg,color:ad?.db?.liveFg}}>
{" "}{ad?.db?.liveDot}
<span>
{ad?.db?.liveLabel}
</span>
<span className="font-normal opacity-[.8]">
{ad?.db?.liveSub}
</span>
</button>
<div className="relative">
<button onClick={ad?.db?.toggleDate} className="flex items-center gap-[8px] h-[36px] p-[0_12px] rounded-[9px] bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap" style={{border:`1px solid ${ad?.db?.dateBd}`}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />
</svg>
{ad?.db?.dateLabel}
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-text-3">
<path d="M6 9l6 6 6-6" />
</svg>
</button>
{ad?.db?.dateOpen ? (<>
<div onClick={ad?.db?.closeDate} className="fixed inset-[0] z-[29]" />
<div className="absolute right-[0] top-[calc(100%_+_8px)] z-[30] w-[292px] bg-surface border border-solid border-border rounded-[12px] shadow-card shadow-pop p-[14px] [animation:ssIn_.14s_ease-out]">
<div className="flex gap-[6px] mb-[12px]">
{(ad?.db?.quickDates ?? []).map((qd, $index) => (<Fragment key={$index}>
<button onClick={qd?.go} className="flex-1 h-[30px] rounded-[8px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${qd?.bd}`,background:qd?.bg,color:qd?.fg}}>
{qd?.label}
</button>
</Fragment>))}
</div>
<div className="flex justify-between items-center mb-[8px]">
<span className="font-semibold text-[13.5px]">
{ad?.db?.monthLabel}
</span>
<span className="text-[11.5px] text-text-3">
{tr("europe_paris")}
</span>
</div>
<div className="grid grid-cols-[repeat(7,1fr)] gap-[2px] text-center text-[11px] text-text-3 mb-[4px]">
{(ad?.db?.dow ?? []).map((dw, $index) => (<Fragment key={$index}>
<span>
{dw}
</span>
</Fragment>))}
</div>
<div className="grid grid-cols-[repeat(7,1fr)] gap-[2px]">
{(ad?.db?.calCells ?? []).map((cc, $index) => (<Fragment key={$index}>
<button onClick={cc?.go} disabled={cc?.disabled} className="h-[34px] border-0 rounded-[8px]" style={{background:cc?.bg,color:cc?.fg,font:cc?.font,cursor:cc?.cursor,visibility:cc?.vis,boxShadow:cc?.ring}}>
{cc?.n}
</button>
</Fragment>))}
</div>
</div>
</>) : null}
</div>
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-[12px]">
{(ad?.db?.kpis ?? []).map((k, $index) => (<Fragment key={$index}>
<button onClick={k?.go} title={k?.tip} className="text-left cursor-pointer bg-surface border border-solid border-border rounded-[12px] shadow-card p-[14px_14px_12px] flex flex-col gap-[8px] text-text min-w-[0] relative hover:border-border-strong">
<div className="flex items-center gap-[7px] text-[12.5px] text-text-2 font-medium whitespace-nowrap overflow-hidden">
<span className="w-[8px] h-[8px] rounded-[50%] flex-none" style={{background:k?.dot}} />
{k?.label}
</div>
<div className="flex items-baseline gap-[5px]">
<span className="text-[28px] font-semibold tracking-[-.02em] [font-variant-numeric:tabular-nums] leading-[1.05]">
{k?.value}
</span>
<span className="text-[12.5px] text-text-3 whitespace-nowrap">
{k?.suffix}
</span>
</div>
<div className="flex items-center gap-[4px] text-[12px] whitespace-nowrap">
<span className="inline-flex items-center gap-[2px] p-[1px_6px] rounded-[999px] font-semibold" style={{background:k?.dBg,color:k?.dFg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
<path d={k?.dIcon} />
</svg>
{k?.delta}
</span>
<span className="text-text-3">
{ad?.db?.st?.vsY}
</span>
</div>
</button>
</Fragment>))}
</div>
<div className="flex flex-wrap gap-[16px] items-stretch">
<section className="flex-[1.55_1_520px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px_18px] flex flex-col">
<div className="flex items-center justify-between gap-[12px] mb-[12px] flex-wrap">
<div>
<div className="font-semibold text-[15px]">
{ad?.db?.st?.mapTitle}
</div>
<div className="text-[12.5px] text-text-3">
{ad?.db?.mapSub}
</div>
</div>
<div className="flex gap-[12px] text-[12px] text-text-2">
{(ad?.db?.healthLegend ?? []).map((hl, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[5px]">
<span className="w-[9px] h-[9px] rounded-[50%]" style={{background:hl?.c}} />
{hl?.label}
</span>
</Fragment>))}
</div>
</div>
<div className="relative flex-1 min-h-[340px] rounded-[10px] overflow-hidden bg-map-bg border border-solid border-border">
<svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" className="absolute inset-[0] w-[100%] h-[100%]">
<path d="M118 30 L300 10 L430 40 L520 120 L560 230 L520 320 L400 350 L300 340 L210 300 L140 330 L70 280 L40 190 L60 110Z" className="[fill:var(--map-block)]" />
<path d="M330 40 C 360 120, 380 160, 372 210 S 390 300, 400 350" fill="none" strokeWidth="6" strokeLinecap="round" className="[stroke:var(--map-water)]" />
<path d="M560 230 L600 250 L600 360 L520 360 L520 320Z" className="[fill:var(--map-water)]" />
<g fill="none" strokeLinecap="round" strokeWidth="4" className="[stroke:var(--map-road)]">
<path d="M262 64 L370 200 L398 322" />
<path d="M262 64 L150 130 L90 240" />
<path d="M370 200 L480 160" />
<path d="M300 52 L320 30" />
</g>
</svg>
{(ad?.db?.pins ?? []).map((pn, $index) => (<Fragment key={$index}>
<button onClick={pn?.go} title={pn?.name} className="absolute [transform:translate(-50%,-100%)] flex flex-col items-center border-0 bg-transparent p-[0] cursor-pointer" style={{left:pn?.x,top:pn?.y,zIndex:pn?.z}}>
<span className="flex items-center gap-[6px] h-[28px] p-[0_10px_0_6px] rounded-[999px] bg-surface [box-shadow:0_4px_12px_rgba(13,27,46,.18)] text-[12px] font-semibold text-text whitespace-nowrap" style={{border:`2px solid ${pn?.c}`}}>
<span className="w-[16px] h-[16px] rounded-[50%] text-[color:#fff] grid place-items-center" style={{background:pn?.c}}>
<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
<path d={pn?.icon} />
</svg>
</span>
<span className="[font-family:'Geist_Mono',monospace]">
{pn?.count}
</span>
<span className="font-medium text-text-2">
{pn?.short}
</span>
</span>
<span className="w-[2px] h-[8px]" style={{background:pn?.c}} />
<span className="w-[8px] h-[8px] rounded-[50%] border-[2px] border-solid border-surface mt-[-2px]" style={{background:pn?.c}} />
</button>
</Fragment>))}
{ad?.db?.hasPop ? (<>
<div className="absolute right-[52px] top-[12px] z-[20] w-[268px] max-h-[calc(100%_-_24px)] overflow-auto bg-surface border border-solid border-border rounded-[12px] shadow-card shadow-pop [animation:ssIn_.14s_ease-out]">
<div className="flex items-start gap-[10px] p-[14px_14px_10px]">
<div className="flex-1 min-w-[0]">
<div className="font-semibold">
{ad?.db?.pop?.name}
</div>
<div className="text-[12px] text-text-3">
{ad?.db?.pop?.branch}{" · "}{ad?.db?.pop?.addr}
</div>
</div>
<button onClick={ad?.db?.closePop} title={tr("close")} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent text-text-3 grid place-items-center cursor-pointer p-[0]">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
<div className="flex items-center gap-[8px] p-[0_14px_12px]">
<span className="w-[26px] h-[26px] rounded-[50%] grid place-items-center text-[10.5px] font-semibold" style={{background:ad?.db?.pop?.mav?.bg,color:ad?.db?.pop?.mav?.fg}}>
{ad?.db?.pop?.mav?.ini}
</span>
<span className="text-[12.5px]">
<span className="text-text-3">
{ad?.db?.st?.manager}
</span>
{" "}
<strong className="font-semibold">
{ad?.db?.pop?.manager}
</strong>
</span>
</div>
<div className="p-[0_14px_12px]">
<div className="flex justify-between text-[12.5px] mb-[6px]">
<span className="text-text-2">
{ad?.db?.st?.presentL}
</span>
<span className="[font:600_12.5px_'Geist_Mono',monospace]">
{ad?.db?.pop?.present}{"/"}{ad?.db?.pop?.expected}{" · "}{ad?.db?.pop?.pct}
</span>
</div>
<div className="h-[6px] rounded-[6px] bg-neutral-bg overflow-hidden">
<div className="h-[100%]" style={{width:ad?.db?.pop?.pct,background:ad?.db?.pop?.c}} />
</div>
</div>
<div className="grid grid-cols-[repeat(3,1fr)] border-t border-solid border-t-border">
{(ad?.db?.pop?.stats ?? []).map((ps, $index) => (<Fragment key={$index}>
<div className="p-[9px_12px] border-r border-solid border-r-border">
<div className="text-[11px] text-text-3">
{ps?.k}
</div>
<div className="font-semibold" style={{color:ps?.c}}>
{ps?.v}
</div>
</div>
</Fragment>))}
</div>
<div className="flex gap-[8px] p-[10px_14px] border-t border-solid border-t-border bg-surface-2 rounded-[0_0_12px_12px]">
<button onClick={ad?.db?.pop?.viewAtt} className="h-[30px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex-1">
{ad?.db?.st?.viewAttendance}
</button>
<button onClick={ad?.db?.pop?.open} className="h-[30px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex-1 border-0 bg-accent text-[color:#fff]">
{ad?.db?.st?.openSite}
</button>
</div>
</div>
</>) : null}
<div className="absolute right-[12px] top-[12px] flex flex-col rounded-[8px] overflow-hidden bg-surface border border-solid border-border shadow-card">
<span className="w-[28px] h-[28px] grid place-items-center text-text-2 border-b border-solid border-b-border">
{"+"}
</span>
<span className="w-[28px] h-[28px] grid place-items-center text-text-2">
{"−"}
</span>
</div>
</div>
</section>
<section className="flex-[1_1_360px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card flex flex-col max-h-[560px]">
<div className="p-[16px_18px_10px] flex flex-col gap-[10px]">
<div className="flex items-center gap-[8px]">
<span className="font-semibold text-[15px]">
{ad?.db?.st?.attnTitle}
</span>
<span className="text-[12px] font-semibold p-[1px_8px] rounded-[999px] bg-bad-bg text-bad">
{ad?.db?.attnCount}
</span>
</div>
<div className="flex gap-[6px] flex-wrap">
{(ad?.db?.attnTabs ?? []).map((at, $index) => (<Fragment key={$index}>
<button onClick={at?.go} className="flex items-center gap-[5px] h-[26px] p-[0_9px] rounded-[999px] text-[12px] font-medium cursor-pointer whitespace-nowrap" style={{border:`1px solid ${at?.bd}`,background:at?.bg,color:at?.fg}}>
{at?.label}
<span className="[font:500_11px_'Geist_Mono',monospace] opacity-[.75]">
{at?.count}
</span>
</button>
</Fragment>))}
</div>
</div>
<div className="flex-1 overflow-auto border-t border-solid border-t-border">
{(ad?.db?.attn ?? []).map((a, $index) => (<Fragment key={$index}>
<div className="flex gap-[12px] p-[12px_18px] border-b border-solid border-b-border">
<span className="w-[32px] h-[32px] rounded-[9px] grid place-items-center flex-none" style={{background:a?.ib,color:a?.if}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={a?.icon} />
</svg>
</span>
<div className="flex-1 min-w-[0] flex flex-col gap-[8px]">
<div>
<div className="flex gap-[8px] items-baseline">
<span className="flex-1 font-semibold text-[13.5px]">
{a?.title}
</span>
<span className="[font:400_11.5px_'Geist_Mono',monospace] text-text-3 whitespace-nowrap">
{a?.time}
</span>
</div>
<div className="text-[12.5px] text-text-2">
{a?.desc}
</div>
</div>
<div className="flex gap-[6px] flex-wrap">
{(a?.actions ?? []).map((ac, $index) => (<Fragment key={$index}>
<button onClick={ac?.go} className="h-[30px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] font-medium cursor-pointer whitespace-nowrap" style={{border:ac?.bd,background:ac?.bg,color:ac?.fg}}>
{ac?.label}
</button>
</Fragment>))}
</div>
</div>
</div>
</Fragment>))}
{ad?.db?.attnEmpty ? (<>
<div className="p-[40px_18px] text-center">
<div className="w-[40px] h-[40px] m-[0_auto_10px] rounded-[50%] bg-ok-bg text-ok grid place-items-center">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M5 12l5 5L20 7" />
</svg>
</div>
<div className="font-semibold">
{ad?.db?.st?.attnEmpty}
</div>
<div className="text-[12.5px] text-text-3">
{ad?.db?.st?.attnEmptyDesc}
</div>
</div>
</>) : null}
</div>
</section>
</div>
<div className="flex flex-wrap gap-[16px] items-stretch">
<section className="flex-[1.55_1_520px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px_14px]">
<div className="flex items-start justify-between gap-[12px] mb-[14px] flex-wrap">
<div>
<div className="font-semibold text-[15px]">
{ad?.db?.st?.trendTitle}
</div>
<div className="flex items-baseline gap-[8px] mt-[4px]">
<span className="text-[24px] font-semibold tracking-[-.02em]">
{ad?.db?.trend?.avg}
</span>
<span className="text-[12.5px] text-text-3">
{ad?.db?.trend?.avgLabel}
</span>
<span className="text-[12px] font-semibold p-[1px_7px] rounded-[999px]" style={{background:ad?.db?.trend?.dBg,color:ad?.db?.trend?.dFg}}>
{ad?.db?.trend?.delta}
</span>
</div>
</div>
<div className="flex p-[3px] gap-[2px] border border-solid border-border rounded-[9px] bg-surface-2">
{(ad?.db?.ranges ?? []).map((rg, $index) => (<Fragment key={$index}>
<button onClick={rg?.go} className="border-0 h-[26px] p-[0_11px] rounded-[6px] text-[12.5px] font-medium cursor-pointer" style={{background:rg?.bg,color:rg?.fg,boxShadow:rg?.sh}}>
{rg?.label}
</button>
</Fragment>))}
</div>
</div>
<div className="flex gap-[10px]">
<div className="flex flex-col justify-between h-[190px] [font:400_11px_'Geist_Mono',monospace] text-text-3 text-right p-[0_0_2px]">
{(ad?.db?.trend?.yl ?? []).map((yl, $index) => (<Fragment key={$index}>
<span>
{yl}
</span>
</Fragment>))}
</div>
<div className="flex-1 min-w-[0]">
<div onMouseLeave={ad?.db?.trend?.leave} className="relative h-[190px]">
<svg viewBox="0 0 600 190" preserveAspectRatio="none" className="absolute inset-[0] w-[100%] h-[100%] overflow-visible">
<path d="M0 0.5H600M0 63.5H600M0 126.5H600M0 189.5H600" strokeWidth="1" vectorEffect="non-scaling-stroke" className="[stroke:var(--border)]" />
<path d={ad?.db?.trend?.target} fill="none" strokeWidth="1.2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="[stroke:var(--ok-dot)]" />
<path d={ad?.db?.trend?.area} className="[fill:var(--accent-soft)]" />
<path d={ad?.db?.trend?.line} fill="none" strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="[stroke:var(--accent)]" />
</svg>
<span className="absolute right-[4px] [transform:translateY(-120%)] text-[11px] font-medium text-ok" style={{top:ad?.db?.trend?.targetTop}}>
{ad?.db?.st?.target}
</span>
<div className="absolute inset-[0] flex">
{(ad?.db?.trend?.cols ?? []).map((tc, $index) => (<Fragment key={$index}>
<div onMouseEnter={tc?.enter} className="flex-1 h-[100%]" />
</Fragment>))}
</div>
{ad?.db?.trend?.hasHover ? (<>
<div className="absolute top-[0] bottom-[0] w-[1px] bg-border-strong pointer-events-none" style={{left:ad?.db?.trend?.hx}} />
<div className="absolute w-[10px] h-[10px] m-[-5px_0_0_-5px] rounded-[50%] bg-accent border-[2px] border-solid border-surface pointer-events-none" style={{left:ad?.db?.trend?.hx,top:ad?.db?.trend?.hy}} />
<div className="absolute p-[7px_10px] rounded-[8px] bg-text text-surface text-[12px] whitespace-nowrap pointer-events-none shadow-pop" style={{left:ad?.db?.trend?.hx,top:ad?.db?.trend?.hy,transform:ad?.db?.trend?.htf}}>
<div className="font-semibold">
{ad?.db?.trend?.hv}
</div>
<div className="opacity-[.75]">
{ad?.db?.trend?.hd}
</div>
</div>
</>) : null}
</div>
<div className="flex justify-between mt-[8px] [font:400_11px_'Geist_Mono',monospace] text-text-3">
{(ad?.db?.trend?.xl ?? []).map((xl, $index) => (<Fragment key={$index}>
<span>
{xl}
</span>
</Fragment>))}
</div>
</div>
</div>
</section>
<section className="flex-[1_1_300px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[15px]">
{ad?.db?.st?.methodTitle}
</div>
<div className="text-[12.5px] text-text-3 mb-[14px]">
{ad?.db?.methodSub}
</div>
<div className="flex items-center gap-[20px] flex-wrap">
<div className="relative w-[140px] h-[140px] flex-none">
<svg viewBox="0 0 42 42" className="w-[140px] h-[140px] [transform:rotate(-90deg)]">
<circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="6" className="[stroke:var(--neutral-bg)]" />
<circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="6" strokeDasharray={ad?.db?.donut?.a?.da} strokeDashoffset={ad?.db?.donut?.a?.off} className="[stroke:var(--accent)]" />
<circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="6" strokeDasharray={ad?.db?.donut?.b?.da} strokeDashoffset={ad?.db?.donut?.b?.off} className="[stroke:var(--violet-dot)]" />
<circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="6" strokeDasharray={ad?.db?.donut?.c?.da} strokeDashoffset={ad?.db?.donut?.c?.off} className="[stroke:var(--warn-dot)]" />
</svg>
<div className="absolute inset-[0] grid place-items-center text-center">
<div>
<div className="text-[22px] font-semibold tracking-[-.02em]">
{ad?.db?.donut?.total}
</div>
<div className="text-[11px] text-text-3">
{ad?.db?.st?.checkins}
</div>
</div>
</div>
</div>
<div className="flex-1 min-w-[150px] flex flex-col gap-[12px]">
{(ad?.db?.methods ?? []).map((me, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px]">
<span className="w-[30px] h-[30px] rounded-[8px] grid place-items-center flex-none" style={{background:me?.bg,color:me?.c}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
<path d={me?.icon} />
</svg>
</span>
<div className="flex-1 min-w-[0]">
<div className="text-[13px] font-medium">
{me?.label}
</div>
<div className="text-[11.5px] text-text-3">
{me?.sub}
</div>
</div>
<div className="text-right">
<div className="[font:600_13px_'Geist_Mono',monospace]">
{me?.pct}
</div>
<div className="text-[11.5px] text-text-3">
{me?.n}
</div>
</div>
</div>
</Fragment>))}
</div>
</div>
</section>
</div>
<div className="flex flex-wrap gap-[16px] items-stretch">
<section className="flex-[1_1_400px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="flex items-start justify-between gap-[12px] mb-[16px] flex-wrap">
<div>
<div className="font-semibold text-[15px]">
{ad?.db?.st?.punctTitle}
</div>
<div className="text-[12.5px] text-text-3">
{ad?.db?.punctSub}
</div>
</div>
{ad?.db?.canGroup ? (<>
<div className="flex p-[3px] gap-[2px] border border-solid border-border rounded-[9px] bg-surface-2">
{(ad?.db?.groupBy ?? []).map((gb, $index) => (<Fragment key={$index}>
<button onClick={gb?.go} className="border-0 h-[26px] p-[0_11px] rounded-[6px] text-[12.5px] font-medium cursor-pointer" style={{background:gb?.bg,color:gb?.fg,boxShadow:gb?.sh}}>
{gb?.label}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
<div className="flex flex-col gap-[14px]">
{(ad?.db?.punct ?? []).map((pu, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(96px,150px)_minmax(0,1fr)_52px] gap-[12px] items-center">
<div className="min-w-[0]">
<div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{pu?.name}
</div>
<div className="text-[11.5px] text-text-3">
{pu?.sub}
</div>
</div>
<div title={pu?.tip} className="flex h-[12px] rounded-[6px] overflow-hidden bg-neutral-bg gap-[2px]">
<span className="bg-ok-dot" style={{width:pu?.on}} />
<span className="bg-warn-dot" style={{width:pu?.late}} />
</div>
<div className="text-right [font:600_13px_'Geist_Mono',monospace]" style={{color:pu?.c}}>
{pu?.pct}
</div>
</div>
</Fragment>))}
</div>
<div className="flex gap-[14px] mt-[16px] text-[12px] text-text-2">
<span className="flex items-center gap-[6px]">
<span className="w-[10px] h-[10px] rounded-[3px] bg-ok-dot" />
{ad?.db?.st?.onTimeL}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[10px] h-[10px] rounded-[3px] bg-warn-dot" />
{ad?.db?.st?.lateL}
</span>
</div>
</section>
<section className="flex-[1.3_1_440px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card flex flex-col max-h-[470px]">
<div className="flex items-center justify-between gap-[12px] p-[16px_18px_12px]">
<div className="flex items-center gap-[8px]">
<span className="font-semibold text-[15px]">
{ad?.db?.streamTitle}
</span>
{ad?.db?.streamLive ? (<>
{ad?.db?.liveDot2}
</>) : null}
</div>
{ad?.db?.isToday ? (<>
<button onClick={ad?.db?.togglePause} className="h-[30px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[6px]">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
<path d={ad?.db?.pauseIcon} />
</svg>
{ad?.db?.pauseLabel}
</button>
</>) : null}
</div>
<div className="flex-1 overflow-auto border-t border-solid border-t-border">
{(ad?.db?.stream ?? []).map((ev, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[10px_18px] border-b border-solid border-b-border [transition:background_1.2s]" style={{background:ev?.bg}}>
<span className="w-[32px] h-[32px] rounded-[50%] grid place-items-center text-[12px] font-semibold flex-none" style={{background:ev?.av?.bg,color:ev?.av?.fg}}>
{ev?.av?.ini}
</span>
<div className="flex-1 min-w-[0]">
<div className="text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis">
<strong className="font-semibold">
{ev?.name}
</strong>
{" "}
<span className="text-text-2">
{ev?.action}
</span>
</div>
<div className="text-[12px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{ev?.site}
</div>
</div>
<span title={ev?.methodL} className="w-[26px] h-[26px] rounded-[7px] bg-surface-2 border border-solid border-border text-text-2 grid place-items-center flex-none">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={ev?.mIcon} />
</svg>
</span>
<span className="inline-flex items-center gap-[5px] p-[2px_8px] rounded-[999px] text-[11.5px] font-medium whitespace-nowrap flex-none" style={{background:ev?.chip?.bg,color:ev?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:ev?.chip?.dot}} />
{ev?.chip?.label}
</span>
<span className="[font:500_12px_'Geist_Mono',monospace] text-text-3 w-[40px] text-right flex-none">
{ev?.time}
</span>
</div>
</Fragment>))}
</div>
</section>
</div>
</div>
</>) : null}
</>
    );
  }
}

export default function AdminDashboard(props: any) {
  const tr = useTranslations('AdminDashboard');
  return <AdminDashboardView {...props} tr={tr} />;
}
