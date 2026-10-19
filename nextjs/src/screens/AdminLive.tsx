'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


class AdminLiveBase extends DCLogic {}

class AdminLiveView extends AdminLiveBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
<div className="flex flex-col gap-[16px]" style={{paddingBottom:ad?.lb?.padB}}>
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{ad?.lb?.st?.title}
</h1>
<div className="flex items-center gap-[8px] mt-[6px] text-text-2 text-[13.5px]">
{ad?.lb?.dot}
<span>
{ad?.lb?.sub}
</span>
</div>
</div>
<div className="flex gap-[8px] items-center flex-nowrap">
<button onClick={ad?.lb?.togglePause} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
<path d={ad?.lb?.pauseIcon} />
</svg>
{ad?.lb?.pauseLabel}
</button>
<div className="flex items-center gap-[8px] h-[36px] p-[0_4px_0_10px] border border-solid border-border-strong rounded-[9px] bg-surface">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-text-3">
<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
</svg>
<select value={ad?.lb?.siteF} onChange={ad?.lb?.onSite} className="h-[32px] border-0 [outline:0] bg-transparent text-text text-[13px] font-medium cursor-pointer pr-[4px]">
{(ad?.lb?.siteOpts ?? []).map((so, $index) => (<Fragment key={$index}>
<option value={so?.id}>
{so?.name}
</option>
</Fragment>))}
</select>
</div>
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[10px]">
{(ad?.lb?.counters ?? []).map((lc, $index) => (<Fragment key={$index}>
<button onClick={lc?.go} className="text-left cursor-pointer bg-surface border border-solid border-border rounded-[12px] shadow-card p-[12px_14px] flex flex-col gap-[4px] text-text hover:border-border-strong" style={{borderColor:lc?.bd,boxShadow:lc?.sh}}>
<span className="flex items-center gap-[7px] text-[12.5px] text-text-2 font-medium whitespace-nowrap">
<span className="w-[8px] h-[8px] rounded-[50%]" style={{background:lc?.dot}} />
{lc?.label}
</span>
<span className="text-[26px] font-semibold tracking-[-.02em] [font-variant-numeric:tabular-nums]">
{lc?.value}
</span>
</button>
</Fragment>))}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[12px_14px] flex flex-wrap gap-[10px] items-center">
<div className="flex items-center gap-[8px] h-[34px] p-[0_10px] border border-solid border-border rounded-[8px] flex-[0_1_240px] text-text-3">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input value={ad?.lb?.q} onChange={ad?.lb?.onQ} placeholder={ad?.lb?.st?.searchPh} className="border-0 [outline:0] bg-transparent text-[13px] text-text flex-1 min-w-[0]" />
</div>
<div className="flex flex-wrap gap-[6px] flex-1">
{(ad?.lb?.chips ?? []).map((lf, $index) => (<Fragment key={$index}>
<button onClick={lf?.go} className="flex items-center gap-[6px] h-[30px] p-[0_10px] rounded-[999px] text-[12.5px] font-medium cursor-pointer whitespace-nowrap" style={{border:`1px solid ${lf?.bd}`,background:lf?.bg,color:lf?.fg}}>
{lf?.hasDot ? (<>
<span className="w-[7px] h-[7px] rounded-[50%]" style={{background:lf?.dot}} />
</>) : null}
{lf?.label}
<span className="[font:500_11.5px_'Geist_Mono',monospace] opacity-[.7]">
{lf?.count}
</span>
</button>
</Fragment>))}
</div>
<div className="flex p-[3px] gap-[2px] border border-solid border-border rounded-[9px] bg-surface-2">
{(ad?.lb?.views ?? []).map((vw, $index) => (<Fragment key={$index}>
<button onClick={vw?.go} title={vw?.label} className="border-0 h-[28px] w-[34px] rounded-[6px] cursor-pointer grid place-items-center" style={{background:vw?.bg,color:vw?.fg,boxShadow:vw?.sh}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
<path d={vw?.icon} />
</svg>
</button>
</Fragment>))}
</div>
</div>
{(ad?.lb?.sections ?? []).map((sec, $index) => (<Fragment key={$index}>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="flex items-center gap-[12px] p-[12px_16px] flex-wrap" style={{borderBottom:sec?.hdrBd}}>
<input type="checkbox" checked={sec?.allSel} onChange={sec?.selAll} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD] cursor-pointer flex-none" />
<button onClick={sec?.toggle} className="flex items-center gap-[10px] border-0 bg-transparent p-[0] cursor-pointer text-text text-left min-w-[0]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 [transition:transform_.15s] flex-none" style={{transform:sec?.chev}}>
<path d="M9 6l6 6-6 6" />
</svg>
<span>
<span className="block font-semibold text-[15px]">
{sec?.name}
</span>
<span className="block text-[12px] text-text-3">
{sec?.branch}
</span>
</span>
</button>
<span className="flex items-center gap-[7px] text-[12.5px] text-text-2">
<span className="w-[24px] h-[24px] rounded-[50%] grid place-items-center text-[10px] font-semibold" style={{background:sec?.mav?.bg,color:sec?.mav?.fg}}>
{sec?.mav?.ini}
</span>
{sec?.manager}
</span>
<span title={sec?.fenceTip} className="inline-flex items-center gap-[6px] h-[24px] p-[0_9px] rounded-[999px] text-[12px] font-medium whitespace-nowrap" style={{background:sec?.fenceBg,color:sec?.fenceFg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:sec?.fenceDot}} />
{sec?.fence}
</span>
<div className="flex-1" />
<div className="flex items-center gap-[10px] min-w-[170px]">
<div className="flex-1 h-[6px] rounded-[6px] bg-neutral-bg overflow-hidden">
<div className="h-[100%] bg-ok-dot rounded-[6px] [transition:width_.4s]" style={{width:sec?.pct}} />
</div>
<span className="[font:500_12.5px_'Geist_Mono',monospace] text-text-2 whitespace-nowrap">
{sec?.present}{"/"}{sec?.expected}{" "}{ad?.lb?.st?.presentShort}
</span>
</div>
</div>
{sec?.isList ? (<>
<div className="overflow-x-auto">
<table className="w-[100%] [border-collapse:collapse] text-[13.5px] min-w-[1040px]">
<thead>
<tr className="bg-surface-2 text-text-3 text-[12px] text-left">
<th className="w-[44px] p-[8px_0_8px_16px] border-b border-solid border-b-border" />
<th className="p-[8px_12px_8px_0] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colEmp}
</th>
<th className="p-[8px_12px] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colSched}
</th>
<th className="p-[8px_12px] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colIn}
</th>
<th className="p-[8px_12px] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colOut}
</th>
<th className="p-[8px_12px] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colStatus}
</th>
<th className="p-[8px_12px] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colMethod}
</th>
<th className="p-[8px_12px] font-medium border-b border-solid border-b-border">
{ad?.lb?.st?.colDist}
</th>
<th className="p-[8px_16px_8px_12px] font-medium border-b border-solid border-b-border text-right">
{ad?.lb?.st?.colActions}
</th>
</tr>
</thead>
<tbody>
{(sec?.rows ?? []).map((r2, $index) => (<Fragment key={$index}>
<tr className="border-b border-solid border-b-border [transition:background_1.4s_ease]" style={{background:r2?.bg}}>
<td className="p-[10px_0_10px_16px]">
<input type="checkbox" checked={r2?.sel} onChange={r2?.toggleSel} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD] cursor-pointer flex-none" />
</td>
<td className="p-[10px_12px_10px_0]">
<div className="flex items-center gap-[10px]">
<span className="w-[32px] h-[32px] rounded-[50%] grid place-items-center text-[12px] font-semibold flex-none" style={{background:r2?.av?.bg,color:r2?.av?.fg}}>
{r2?.av?.ini}
</span>
<div className="min-w-[0]">
<div className="font-medium flex items-center gap-[6px]">
{r2?.name}
{r2?.isFresh ? (<>
<span className="text-[10px] font-bold tracking-[.04em] p-[1px_6px] rounded-[999px] bg-accent text-[color:#fff]">
{ad?.lb?.st?.newTag}
</span>
</>) : null}
</div>
<div className="text-[12px] text-text-3">
{r2?.job}
</div>
</div>
</div>
</td>
<td className="p-[10px_12px] [font:400_12.5px_'Geist_Mono',monospace] whitespace-nowrap">
{r2?.sched}
</td>
<td className="p-[10px_12px] [font:400_12.5px_'Geist_Mono',monospace] whitespace-nowrap" style={{color:r2?.inC}}>
{r2?.inT}
</td>
<td className="p-[10px_12px] [font:400_12.5px_'Geist_Mono',monospace] whitespace-nowrap" style={{color:r2?.outC}}>
{r2?.outT}
</td>
<td className="p-[10px_12px]">
<div className="flex flex-col items-start gap-[2px]">
<span className="inline-flex items-center gap-[6px] p-[3px_9px] rounded-[999px] text-[12px] font-medium whitespace-nowrap" style={{background:r2?.chip?.bg,color:r2?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:r2?.chip?.dot}} />
{r2?.chip?.label}
</span>
{r2?.hasNote ? (<>
<span className="text-[11.5px] text-text-3 pl-[2px]">
{r2?.note}
</span>
</>) : null}
</div>
</td>
<td className="p-[10px_12px]">
<div className="flex items-center gap-[6px]">
<span title={r2?.methodL} className="w-[26px] h-[26px] rounded-[7px] bg-surface-2 border border-solid border-border text-text-2 grid place-items-center flex-none" style={{visibility:r2?.mVis}}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={r2?.mIcon} />
</svg>
</span>
{r2?.hasFlag ? (<>
<span title={r2?.flagTip} className="w-[26px] h-[26px] rounded-[7px] bg-bad-bg text-bad grid place-items-center flex-none">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16h.01" />
</svg>
</span>
</>) : null}
</div>
</td>
<td className="p-[10px_12px] [font:500_12.5px_'Geist_Mono',monospace] whitespace-nowrap" style={{color:r2?.distC}}>
{r2?.dist}
</td>
<td className="p-[10px_16px_10px_12px]">
<div className="flex gap-[6px] justify-end">
{r2?.canIn ? (<>
<button onClick={r2?.doIn} title={ad?.lb?.st?.checkIn} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none text-accent hover:bg-accent-soft">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
</svg>
</button>
</>) : null}
{r2?.canOut ? (<>
<button onClick={r2?.doOut} title={ad?.lb?.st?.checkOut} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
</svg>
</button>
</>) : null}
<button onClick={r2?.view} title={ad?.lb?.st?.view} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
</svg>
</button>
<button onClick={r2?.call} title={r2?.callTip} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
</svg>
</button>
</div>
</td>
</tr>
</Fragment>))}
</tbody>
</table>
</div>
</>) : null}
{sec?.isGrid ? (<>
<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[12px] p-[14px_16px_16px]">
{(sec?.rows ?? []).map((r2, $index) => (<Fragment key={$index}>
<div className="flex flex-col gap-[10px] p-[12px] rounded-[11px] [transition:background_1.4s_ease]" style={{border:`1px solid ${r2?.cardBd}`,background:r2?.bg}}>
<div className="flex items-center gap-[10px]">
<input type="checkbox" checked={r2?.sel} onChange={r2?.toggleSel} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD] cursor-pointer flex-none" />
<span className="w-[34px] h-[34px] rounded-[50%] grid place-items-center text-[12px] font-semibold flex-none" style={{background:r2?.av?.bg,color:r2?.av?.fg}}>
{r2?.av?.ini}
</span>
<div className="flex-1 min-w-[0]">
<div className="font-semibold text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis">
{r2?.name}
</div>
<div className="text-[12px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{r2?.job}
</div>
</div>
{r2?.hasFlag ? (<>
<span title={r2?.flagTip} className="w-[26px] h-[26px] rounded-[7px] bg-bad-bg text-bad grid place-items-center flex-none">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16h.01" />
</svg>
</span>
</>) : null}
</div>
<div className="flex items-center gap-[6px] flex-wrap">
<span className="inline-flex items-center gap-[6px] p-[3px_9px] rounded-[999px] text-[12px] font-medium whitespace-nowrap" style={{background:r2?.chip?.bg,color:r2?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:r2?.chip?.dot}} />
{r2?.chip?.label}
</span>
{r2?.hasNote ? (<>
<span className="text-[11.5px] text-text-3">
{r2?.note}
</span>
</>) : null}
</div>
<div className="grid grid-cols-[repeat(3,1fr)] gap-[6px] text-[11px] text-text-3">
<div>
<div>
{ad?.lb?.st?.colSched}
</div>
<div className="[font:500_12px_'Geist_Mono',monospace] text-text">
{r2?.schedStart}
</div>
</div>
<div>
<div>
{ad?.lb?.st?.inShort}
</div>
<div className="[font:500_12px_'Geist_Mono',monospace]" style={{color:r2?.inC}}>
{r2?.inT}
</div>
</div>
<div>
<div>
{ad?.lb?.st?.outShort}
</div>
<div className="[font:500_12px_'Geist_Mono',monospace]" style={{color:r2?.outC}}>
{r2?.outT}
</div>
</div>
</div>
<div className="flex items-center gap-[6px] border-t border-solid border-t-border pt-[10px]">
<span title={r2?.methodL} className="w-[26px] h-[26px] rounded-[7px] bg-surface-2 border border-solid border-border text-text-2 grid place-items-center flex-none" style={{visibility:r2?.mVis}}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={r2?.mIcon} />
</svg>
</span>
<span className="[font:500_12px_'Geist_Mono',monospace]" style={{color:r2?.distC}}>
{r2?.dist}
</span>
<div className="flex-1" />
{r2?.canIn ? (<>
<button onClick={r2?.doIn} title={ad?.lb?.st?.checkIn} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none text-accent hover:bg-accent-soft">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
</svg>
</button>
</>) : null}
{r2?.canOut ? (<>
<button onClick={r2?.doOut} title={ad?.lb?.st?.checkOut} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
</svg>
</button>
</>) : null}
<button onClick={r2?.view} title={ad?.lb?.st?.view} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
</svg>
</button>
<button onClick={r2?.call} title={r2?.callTip} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-surface text-text-2 grid place-items-center cursor-pointer p-[0] flex-none hover:bg-hover">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
</svg>
</button>
</div>
</div>
</Fragment>))}
</div>
</>) : null}
{sec?.isEmpty ? (<>
<div className="p-[22px_16px] text-center text-[13px] text-text-3">
{ad?.lb?.st?.noMatch}
</div>
</>) : null}
</section>
</Fragment>))}
{ad?.lb?.allEmpty ? (<>
<div className="p-[56px_20px] text-center bg-surface border border-solid border-border rounded-[12px] shadow-card">
<div className="font-semibold text-[15px]">
{ad?.lb?.st?.emptyTitle}
</div>
<div className="text-text-3 text-[13px] m-[4px_0_14px]">
{ad?.lb?.st?.emptyDesc}
</div>
<button onClick={ad?.lb?.clear} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap">
{ad?.lb?.st?.clear}
</button>
</div>
</>) : null}
</div>
{ad?.lb?.hasSel ? (<>
<div className="fixed left-[50%] bottom-[24px] [transform:translateX(-50%)] z-[35] flex items-center gap-[10px] p-[8px_8px_8px_16px] rounded-[12px] bg-text text-surface shadow-pop [animation:ssIn_.18s_ease-out] whitespace-nowrap">
<span className="text-[13.5px] font-semibold">
{ad?.lb?.selLabel}
</span>
<span className="w-[1px] h-[20px] bg-[color:rgba(255,255,255,.2)]" />
<button onClick={ad?.lb?.bulkRemind} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-[color:rgba(255,255,255,.12)] text-[color:inherit] text-[13px] font-medium cursor-pointer flex items-center gap-[6px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />
</svg>
{ad?.lb?.st?.remind}
</button>
{ad?.lb?.canAbsent ? (<>
<button onClick={ad?.lb?.bulkAbsent} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer flex items-center gap-[6px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4 1.5M17 15l5 5M22 15l-5 5" />
</svg>
{ad?.lb?.st?.markAbsent}
</button>
</>) : null}
<button onClick={ad?.lb?.clearSel} title={ad?.lb?.st?.clearSel} className="w-[32px] h-[32px] rounded-[8px] border-0 bg-transparent text-[color:inherit] grid place-items-center cursor-pointer opacity-[.8]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
</>) : null}
{ad?.lb?.mOpen ? (<>
<div className="fixed inset-[0] bg-overlay z-[45] grid place-items-center p-[20px]">
<div className="w-[460px] max-w-[100%] bg-surface border border-solid border-border rounded-[12px] shadow-card rounded-[14px] shadow-pop [animation:ssIn_.18s_ease-out]">
<div className="flex items-center gap-[12px] p-[18px_22px_14px]">
<span className="w-[40px] h-[40px] rounded-[50%] grid place-items-center text-[13px] font-semibold flex-none" style={{background:ad?.lb?.m?.av?.bg,color:ad?.lb?.m?.av?.fg}}>
{ad?.lb?.m?.av?.ini}
</span>
<div className="flex-1 min-w-[0]">
<div className="font-semibold text-[16px]">
{ad?.lb?.m?.title}
</div>
<div className="text-[12.5px] text-text-3">
{ad?.lb?.m?.sub}
</div>
</div>
</div>
<div className="p-[0_22px] flex flex-col gap-[14px]">
<div className="grid grid-cols-[140px_1fr] gap-[12px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{ad?.lb?.st?.time}
</span>
<input type="time" value={ad?.lb?.m?.time} onChange={ad?.lb?.m?.onTime} className="h-[38px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_14px_'Geist_Mono',monospace] [outline:none]" />
</label>
<label className="flex flex-col gap-[6px]">
<span className="flex flex-wrap gap-[0_4px] items-baseline text-[13px] font-medium">
<span>
{ad?.lb?.st?.reason}
</span>
<span className="text-bad">
{"*"}
</span>
</span>
<select value={ad?.lb?.m?.reason} onChange={ad?.lb?.m?.onReason} className="h-[38px] p-[0_8px] rounded-[9px] bg-surface text-text text-[13.5px]" style={{border:`1px solid ${ad?.lb?.m?.reasonBd}`}}>
{(ad?.lb?.m?.reasons ?? []).map((rs, $index) => (<Fragment key={$index}>
<option value={rs?.v}>
{rs?.label}
</option>
</Fragment>))}
</select>
</label>
</div>
{ad?.lb?.m?.hasErr ? (<>
<span className="text-[12.5px] text-bad mt-[-6px]">
{ad?.lb?.st?.reasonErr}
</span>
</>) : null}
<label className="flex flex-col gap-[6px]">
<span className="flex flex-wrap gap-[0_4px] items-baseline text-[13px] font-medium">
<span>
{ad?.lb?.st?.note}
</span>
<span className="text-text-3 font-normal">
{"· "}{ad?.lb?.st?.optional}
</span>
</span>
<textarea value={ad?.lb?.m?.note} onChange={ad?.lb?.m?.onNote} rows="3" placeholder={ad?.lb?.st?.notePh} className="p-[10px_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px] resize-y [outline-color:var(--accent)]" />
</label>
<label className="flex gap-[10px] items-start text-[13px] text-text-2 cursor-pointer">
<input type="checkbox" checked={ad?.lb?.m?.verified} onChange={ad?.lb?.m?.onVerified} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD] cursor-pointer flex-none mt-[2px]" />
<span>
{ad?.lb?.st?.verified}
</span>
</label>
<div className="flex gap-[8px] p-[10px_12px] rounded-[9px] bg-surface-2 text-[12.5px] text-text-2">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M12 11v5" />
</svg>
<span>
{ad?.lb?.m?.audit}
</span>
</div>
</div>
<div className="flex justify-end gap-[8px] p-[16px_22px_18px]">
<button onClick={ad?.lb?.m?.cancel} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap h-[36px]">
{ad?.lb?.st?.cancel}
</button>
<button onClick={ad?.lb?.m?.confirm} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:ad?.lb?.m?.op}}>
{ad?.lb?.m?.cta}
</button>
</div>
</div>
</div>
</>) : null}
</>
    );
  }
}

export default function AdminLive(props: any) {
  const tr = useTranslations('AdminLive');
  return <AdminLiveView {...props} tr={tr} />;
}
