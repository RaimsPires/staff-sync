'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


class AdminAttendanceBase extends DCLogic {}

class AdminAttendanceView extends AdminAttendanceBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
<div className="flex flex-col gap-[14px]">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{ad?.ar?.st?.title}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{ad?.ar?.sub}
</div>
</div>
<div className="flex gap-[8px] items-center">
<div className="relative">
<button onClick={ad?.ar?.tog?.export} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
</svg>
{ad?.ar?.st?.export}
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-text-3">
<path d="M6 9l6 6 6-6" />
</svg>
</button>
{ad?.ar?.open?.export ? (<>
<div className="absolute top-[calc(100%_+_6px)] z-[31] bg-surface border border-solid border-border rounded-[12px] shadow-pop [animation:ssIn_.14s_ease-out] right-[0] w-[240px] p-[6px]">
<div className="p-[6px_10px_8px] text-[12px] text-text-3">
{ad?.ar?.exportNote}
</div>
{(ad?.ar?.exports ?? []).map((ex, $index) => (<Fragment key={$index}>
<button onClick={ex?.go} className="flex items-center gap-[10px] w-[100%] h-[36px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13.5px] cursor-pointer text-left hover:bg-hover">
<span className="[font:600_10px_'Geist_Mono',monospace] p-[3px_5px] rounded-[5px] w-[32px] text-center" style={{background:ex?.bg,color:ex?.fg}}>
{ex?.tag}
</span>
{ex?.label}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
{ad?.ar?.canAdd ? (<>
<button onClick={ad?.ar?.openAdd} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] border-0 bg-accent text-[color:#fff] h-[36px] hover:bg-accent-hover">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 5v14M5 12h14" />
</svg>
{ad?.ar?.st?.add}
</button>
</>) : null}
</div>
</div>
{ad?.ar?.isEmptyCo ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[64px_24px] text-center flex flex-col items-center gap-[6px]">
<div className="w-[56px] h-[56px] rounded-[14px] bg-accent-soft text-accent grid place-items-center mb-[8px]">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
</svg>
</div>
<div className="font-semibold text-[17px]">
{ad?.ar?.st?.emptyCoTitle}
</div>
<div className="text-text-3 text-[13.5px] max-w-[420px] [text-wrap:pretty]">
{ad?.ar?.st?.emptyCoDesc}
</div>
<div className="flex gap-[8px] mt-[14px]">
<button onClick={ad?.ar?.goSchedules} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]">
{ad?.ar?.st?.createSched}
</button>
<button onClick={ad?.ar?.openAdd} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] border-0 bg-accent text-[color:#fff]">
{ad?.ar?.st?.add}
</button>
</div>
</div>
</>) : null}
{ad?.ar?.hasData ? (<>
<div className="flex items-center gap-[6px] flex-wrap">
<span className="text-[12px] font-semibold text-text-3 uppercase tracking-[.06em] mr-[4px]">
{ad?.ar?.st?.views}
</span>
{(ad?.ar?.views ?? []).map((ve, $index) => (<Fragment key={$index}>
<span className="inline-flex items-center h-[30px] rounded-[999px] overflow-hidden" style={{border:`1px solid ${ve?.bd}`,background:ve?.bg}}>
<button onClick={ve?.go} className="h-[100%] p-[0_12px] border-0 bg-transparent text-[12.5px] font-medium cursor-pointer flex items-center gap-[6px] whitespace-nowrap" style={{color:ve?.fg}}>
{ve?.saved ? (<>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
</svg>
</>) : null}
{ve?.name}
</button>
{ve?.saved ? (<>
<button onClick={ve?.del} title={ad?.ar?.st?.delView} className="h-[100%] w-[24px] border-0 bg-transparent text-text-3 cursor-pointer grid place-items-center p-[0]" style={{borderLeft:`1px solid ${ve?.bd}`}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</>) : null}
</span>
</Fragment>))}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card">
<div className="flex flex-wrap gap-[8px] items-center p-[12px_14px] border-b border-solid border-b-border">
<div className="relative">
<button onClick={ad?.ar?.tog?.range} className="h-[34px] p-[0_12px] rounded-[9px] bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]" style={{border:`1px solid ${ad?.ar?.bd?.range}`}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />
</svg>
{ad?.ar?.rangeLabel}
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-text-3">
<path d="M6 9l6 6 6-6" />
</svg>
</button>
{ad?.ar?.open?.range ? (<>
<div className="absolute top-[calc(100%_+_6px)] z-[31] bg-surface border border-solid border-border rounded-[12px] shadow-pop [animation:ssIn_.14s_ease-out] left-[0] w-[280px] p-[8px]">
{(ad?.ar?.ranges ?? []).map((rp, $index) => (<Fragment key={$index}>
<button onClick={rp?.go} className="flex items-center justify-between w-[100%] h-[34px] p-[0_10px] border-0 rounded-[8px] text-[13px] font-medium cursor-pointer text-left hover:bg-hover" style={{background:rp?.bg,color:rp?.fg}}>
{rp?.label}
<span className="text-[11.5px] text-text-3 font-normal">
{rp?.hint}
</span>
</button>
</Fragment>))}
<div className="border-t border-solid border-t-border m-[6px_-8px_0] p-[10px_10px_2px] grid grid-cols-[1fr_1fr] gap-[8px]">
<label className="flex flex-col gap-[4px] text-[11.5px] text-text-3">
{ad?.ar?.st?.from}
<input type="date" min="2026-10-01" max="2026-10-15" value={ad?.ar?.fromV} onChange={ad?.ar?.onFrom} className="h-[32px] p-[0_6px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] min-w-[0]" />
</label>
<label className="flex flex-col gap-[4px] text-[11.5px] text-text-3">
{ad?.ar?.st?.to}
<input type="date" min="2026-10-01" max="2026-10-15" value={ad?.ar?.toV} onChange={ad?.ar?.onTo} className="h-[32px] p-[0_6px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] min-w-[0]" />
</label>
</div>
</div>
</>) : null}
</div>
{ad?.ar?.multiBranch ? (<>
<select value={ad?.ar?.branch} onChange={ad?.ar?.onBranch} className="h-[34px] p-[0_8px] rounded-[9px] bg-surface text-text text-[13px] max-w-[180px]" style={{border:`1px solid ${ad?.ar?.bd?.branch}`}}>
{(ad?.ar?.branchOpts ?? []).map((bo, $index) => (<Fragment key={$index}>
<option value={bo?.id}>
{bo?.name}
</option>
</Fragment>))}
</select>
</>) : null}
{ad?.ar?.multiSite ? (<>
<select value={ad?.ar?.site} onChange={ad?.ar?.onSite} className="h-[34px] p-[0_8px] rounded-[9px] bg-surface text-text text-[13px] max-w-[180px]" style={{border:`1px solid ${ad?.ar?.bd?.site}`}}>
{(ad?.ar?.siteOpts ?? []).map((so, $index) => (<Fragment key={$index}>
<option value={so?.id}>
{so?.name}
</option>
</Fragment>))}
</select>
</>) : null}
<div className="flex items-center gap-[7px] h-[34px] p-[0_10px] rounded-[9px] text-text-3 w-[190px] box-border" style={{border:`1px solid ${ad?.ar?.bd?.emp}`}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input value={ad?.ar?.emp} onChange={ad?.ar?.onEmp} placeholder={ad?.ar?.st?.empPh} className="border-0 [outline:0] bg-transparent text-[13px] text-text flex-1 min-w-[0]" />
</div>
<div className="relative">
<button onClick={ad?.ar?.tog?.status} className="h-[34px] p-[0_12px] rounded-[9px] bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]" style={{border:`1px solid ${ad?.ar?.bd?.status}`}}>
{ad?.ar?.statusLabel}
{ad?.ar?.hasStatusN ? (<>
<span className="min-w-[18px] h-[18px] p-[0_5px] box-border rounded-[999px] bg-accent text-[color:#fff] text-[11px] font-semibold grid place-items-center">
{ad?.ar?.statusN}
</span>
</>) : null}
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-text-3">
<path d="M6 9l6 6 6-6" />
</svg>
</button>
{ad?.ar?.open?.status ? (<>
<div className="absolute top-[calc(100%_+_6px)] z-[31] bg-surface border border-solid border-border rounded-[12px] shadow-pop [animation:ssIn_.14s_ease-out] left-[0] w-[230px] p-[6px]">
{(ad?.ar?.statusOpts ?? []).map((sto, $index) => (<Fragment key={$index}>
<label className="flex items-center gap-[10px] h-[34px] p-[0_10px] rounded-[8px] cursor-pointer text-[13px] hover:bg-hover">
<input type="checkbox" checked={sto?.on} onChange={sto?.toggle} className="w-[15px] h-[15px] m-[0] [accent-color:#0B67DD]" />
<span className="w-[7px] h-[7px] rounded-[50%]" style={{background:sto?.dot}} />
<span className="flex-1">
{sto?.label}
</span>
<span className="[font:500_11.5px_'Geist_Mono',monospace] text-text-3">
{sto?.count}
</span>
</label>
</Fragment>))}
<div className="flex justify-between border-t border-solid border-t-border m-[6px_-6px_-6px] p-[8px_12px]">
<button onClick={ad?.ar?.statusClear} className="border-0 bg-transparent text-text-2 text-[12.5px] cursor-pointer p-[0]">
{ad?.ar?.st?.clear}
</button>
<button onClick={ad?.ar?.closeAll} className="border-0 bg-transparent text-accent text-[12.5px] font-semibold cursor-pointer p-[0]">
{ad?.ar?.st?.done}
</button>
</div>
</div>
</>) : null}
</div>
<select value={ad?.ar?.method} onChange={ad?.ar?.onMethod} className="h-[34px] p-[0_8px] rounded-[9px] bg-surface text-text text-[13px] max-w-[180px]" style={{border:`1px solid ${ad?.ar?.bd?.method}`}}>
{(ad?.ar?.methodOpts ?? []).map((mo, $index) => (<Fragment key={$index}>
<option value={mo?.id}>
{mo?.name}
</option>
</Fragment>))}
</select>
{(ad?.ar?.toggles ?? []).map((tg, $index) => (<Fragment key={$index}>
<button onClick={tg?.go} role="switch" aria-checked={tg?.on} className="flex items-center gap-[8px] h-[34px] p-[0_10px_0_8px] rounded-[9px] text-[13px] font-medium cursor-pointer whitespace-nowrap" style={{border:`1px solid ${tg?.bd}`,background:tg?.bg,color:tg?.fg}}>
<span className="w-[28px] h-[16px] rounded-[999px] relative flex-none [transition:background_.15s]" style={{background:tg?.track}}>
<span className="absolute top-[2px] w-[12px] h-[12px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_2px_rgba(0,0,0,.25)] [transition:left_.15s]" style={{left:tg?.knob}} />
</span>
{tg?.label}{" "}
</button>
</Fragment>))}
<div className="flex-1" />
{ad?.ar?.hasActive ? (<>
<button onClick={ad?.ar?.clearAll} className="border-0 bg-transparent text-text-2 text-[13px] font-medium cursor-pointer p-[0_6px] whitespace-nowrap hover:text-text">
{ad?.ar?.clearLabel}
</button>
</>) : null}
<div className="relative">
<button onClick={ad?.ar?.tog?.save} disabled={ad?.ar?.noActive} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px]" style={{opacity:ad?.ar?.saveOp}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
</svg>
{ad?.ar?.st?.saveView}
</button>
{ad?.ar?.open?.save ? (<>
<div className="absolute top-[calc(100%_+_6px)] z-[31] bg-surface border border-solid border-border rounded-[12px] shadow-pop [animation:ssIn_.14s_ease-out] right-[0] w-[280px] p-[14px] flex flex-col gap-[10px]">
<div className="font-semibold text-[13.5px]">
{ad?.ar?.st?.saveTitle}
</div>
<input value={ad?.ar?.viewName} onChange={ad?.ar?.onViewName} autoFocus={true} placeholder={ad?.ar?.st?.viewPh} className="h-[36px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px] [outline-color:var(--accent)]" />
<div className="text-[12px] text-text-3">
{ad?.ar?.saveSummary}
</div>
<div className="flex justify-end gap-[8px]">
<button onClick={ad?.ar?.closeAll} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[32px]">
{ad?.ar?.st?.cancel}
</button>
<button onClick={ad?.ar?.saveView} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[32px] border-0 bg-accent text-[color:#fff]" style={{opacity:ad?.ar?.saveBtnOp}}>
{ad?.ar?.st?.save}
</button>
</div>
</div>
</>) : null}
</div>
<div className="relative">
<button onClick={ad?.ar?.tog?.cols} title={ad?.ar?.st?.columns} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] p-[0_10px]">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M3 4h18v16H3zM9 4v16M15 4v16" />
</svg>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-text-3">
<path d="M6 9l6 6 6-6" />
</svg>
</button>
{ad?.ar?.open?.cols ? (<>
<div className="absolute top-[calc(100%_+_6px)] z-[31] bg-surface border border-solid border-border rounded-[12px] shadow-pop [animation:ssIn_.14s_ease-out] right-[0] w-[220px] p-[6px]">
<div className="p-[6px_10px] text-[12px] text-text-3">
{ad?.ar?.st?.showCols}
</div>
{(ad?.ar?.colOpts ?? []).map((cv, $index) => (<Fragment key={$index}>
<label className="flex items-center gap-[10px] h-[32px] p-[0_10px] rounded-[8px] text-[13px] hover:bg-hover" style={{cursor:cv?.cursor,color:cv?.fg}}>
<input type="checkbox" checked={cv?.on} disabled={cv?.locked} onChange={cv?.toggle} className="w-[15px] h-[15px] m-[0] [accent-color:#0B67DD]" />
{cv?.label}
</label>
</Fragment>))}
</div>
</>) : null}
</div>
</div>
{ad?.ar?.anyOpen ? (<>
<div onClick={ad?.ar?.closeAll} className="fixed inset-[0] z-[30]" />
</>) : null}
{ad?.ar?.hasSel ? (<>
<div className="flex items-center gap-[10px] p-[8px_14px] bg-accent-soft border-b border-solid border-b-border flex-wrap">
<span className="text-[13px] font-semibold text-accent">
{ad?.ar?.selLabel}
</span>
{ad?.ar?.canSelAll ? (<>
<button onClick={ad?.ar?.selAllMatching} className="border-0 bg-transparent text-accent text-[12.5px] underline cursor-pointer p-[0]">
{ad?.ar?.selAllLabel}
</button>
</>) : null}
<div className="flex-1" />
{ad?.ar?.canApprove ? (<>
<button onClick={ad?.ar?.bulkApprove} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[30px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-ok">
<path d="M5 12l5 5L20 7" />
</svg>
{ad?.ar?.st?.approve}
</button>
</>) : null}
{ad?.ar?.canAbsent ? (<>
<button onClick={ad?.ar?.bulkAbsent} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[30px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-bad">
<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4 1.5M17 15l5 5M22 15l-5 5" />
</svg>
{ad?.ar?.st?.markAbsent}
</button>
</>) : null}
<button onClick={ad?.ar?.bulkExport} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[30px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
</svg>
{ad?.ar?.st?.exportSel}
</button>
<button onClick={ad?.ar?.clearSel} title={ad?.ar?.st?.clearSel} className="w-[30px] h-[30px] rounded-[8px] border-0 bg-transparent text-text-2 grid place-items-center cursor-pointer">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
</>) : null}
{ad?.loading ? (<>
<div className="p-[6px_0]">
{(ad?.skel ?? []).map((sk, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[16px] p-[14px_16px] [animation:ssShimmer_1.2s_ease-in-out_infinite]">
<div className="w-[16px] h-[16px] rounded-[4px] bg-neutral-bg" />
<div className="w-[60px] h-[10px] rounded-[4px] bg-neutral-bg" />
<div className="w-[32px] h-[32px] rounded-[50%] bg-neutral-bg" />
<div className="flex-1 flex flex-col gap-[6px]">
<div className="w-[30%] h-[10px] rounded-[4px] bg-neutral-bg" />
<div className="w-[18%] h-[8px] rounded-[4px] bg-neutral-bg" />
</div>
<div className="w-[12%] h-[10px] rounded-[4px] bg-neutral-bg" />
<div className="w-[80px] h-[22px] rounded-[999px] bg-neutral-bg" />
</div>
</Fragment>))}
</div>
</>) : null}
{ad?.ar?.showTable ? (<>
<div className="overflow-x-auto">
<table className="w-[100%] [border-collapse:collapse] text-[13.5px]" style={{minWidth:ad?.ar?.minW}}>
<thead>
<tr className="bg-surface-2 text-text-3 text-left">
<th className="w-[40px] p-[0_0_0_16px] border-b border-solid border-b-border">
<input type="checkbox" checked={ad?.ar?.pageAllSel} onChange={ad?.ar?.togglePage} aria-label={tr("select_page")} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD] cursor-pointer [vertical-align:middle]" />
</th>
{ad?.ar?.col?.date ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.date?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.date?.c}}>
{ad?.ar?.st?.cDate}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.date?.op}}>
<path d={ad?.ar?.sh?.date?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.emp ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.emp?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.emp?.c}}>
{ad?.ar?.st?.cEmp}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.emp?.op}}>
<path d={ad?.ar?.sh?.emp?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.site ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.site?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.site?.c}}>
{ad?.ar?.st?.cSite}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.site?.op}}>
<path d={ad?.ar?.sh?.site?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.sched ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap text-[12px]">
{ad?.ar?.st?.cSched}
</th>
</>) : null}
{ad?.ar?.col?.in ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.in?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.in?.c}}>
{ad?.ar?.st?.cIn}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.in?.op}}>
<path d={ad?.ar?.sh?.in?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.out ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.out?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.out?.c}}>
{ad?.ar?.st?.cOut}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.out?.op}}>
<path d={ad?.ar?.sh?.out?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.worked ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap text-right">
<button onClick={ad?.ar?.sh?.worked?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.worked?.c}}>
{ad?.ar?.st?.cWorked}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.worked?.op}}>
<path d={ad?.ar?.sh?.worked?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.status ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.status?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.status?.c}}>
{ad?.ar?.st?.cStatus}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.status?.op}}>
<path d={ad?.ar?.sh?.status?.icon} />
</svg>
</button>
</th>
</>) : null}
{ad?.ar?.col?.method ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap text-[12px]">
{ad?.ar?.st?.cMethod}
</th>
</>) : null}
{ad?.ar?.col?.flag ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap text-[12px]">
{ad?.ar?.st?.cFlag}
</th>
</>) : null}
{ad?.ar?.col?.edited ? (<>
<th className="p-[0_12px] h-[38px] font-medium border-b border-solid border-b-border whitespace-nowrap">
<button onClick={ad?.ar?.sh?.edited?.go} className="inline-flex items-center gap-[5px] border-0 bg-transparent p-[0] text-[12px] font-medium cursor-pointer" style={{color:ad?.ar?.sh?.edited?.c}}>
{ad?.ar?.st?.cEdited}
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:ad?.ar?.sh?.edited?.op}}>
<path d={ad?.ar?.sh?.edited?.icon} />
</svg>
</button>
</th>
</>) : null}
</tr>
</thead>
<tbody>
{(ad?.ar?.rows ?? []).map((rw, $index) => (<Fragment key={$index}>
<tr onClick={rw?.open} className="border-b border-solid border-b-border cursor-pointer hover:bg-hover" style={{background:rw?.bg}}>
<td onClick={rw?.stop} className="p-[9px_0_9px_16px]">
<input type="checkbox" checked={rw?.sel} onChange={rw?.toggle} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD] cursor-pointer [vertical-align:middle]" />
</td>
{ad?.ar?.col?.date ? (<>
<td className="p-[9px_12px]">
<div className="font-medium whitespace-nowrap">
{rw?.dateL}
</div>
<div className="text-[11.5px] text-text-3">
{rw?.dow}
</div>
</td>
</>) : null}
{ad?.ar?.col?.emp ? (<>
<td className="p-[9px_12px]">
<div className="flex items-center gap-[10px]">
<span className="w-[32px] h-[32px] rounded-[50%] grid place-items-center text-[12px] font-semibold flex-none" style={{background:rw?.av?.bg,color:rw?.av?.fg}}>
{rw?.av?.ini}
</span>
<div className="min-w-[0]">
<div className="font-medium whitespace-nowrap">
{rw?.name}
</div>
<div className="[font:400_11.5px_'Geist_Mono',monospace] text-text-3">
{rw?.empId}
</div>
</div>
</div>
</td>
</>) : null}
{ad?.ar?.col?.site ? (<>
<td className="p-[9px_12px] text-text-2">
<div className="whitespace-nowrap">
{rw?.site}
</div>
<div className="text-[11.5px] text-text-3">
{rw?.branch}
</div>
</td>
</>) : null}
{ad?.ar?.col?.sched ? (<>
<td className="p-[9px_12px]">
<div className="[font:400_12.5px_'Geist_Mono',monospace] whitespace-nowrap">
{rw?.sched}
</div>
<div className="text-[11.5px] text-text-3 whitespace-nowrap">
{rw?.shift}
</div>
</td>
</>) : null}
{ad?.ar?.col?.in ? (<>
<td className="p-[9px_12px] [font:400_12.5px_'Geist_Mono',monospace] whitespace-nowrap" style={{color:rw?.inC}}>
{rw?.inT}
</td>
</>) : null}
{ad?.ar?.col?.out ? (<>
<td className="p-[9px_12px] [font:400_12.5px_'Geist_Mono',monospace] whitespace-nowrap" style={{color:rw?.outC}}>
{rw?.outT}
</td>
</>) : null}
{ad?.ar?.col?.worked ? (<>
<td className="p-[9px_12px] [font:400_12.5px_'Geist_Mono',monospace] text-text-2 text-right whitespace-nowrap">
{rw?.worked}
</td>
</>) : null}
{ad?.ar?.col?.status ? (<>
<td className="p-[9px_12px]">
<span className="inline-flex items-center gap-[6px] p-[3px_9px] rounded-[999px] text-[12px] font-medium whitespace-nowrap" style={{background:rw?.chip?.bg,color:rw?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:rw?.chip?.dot}} />
{rw?.chip?.label}
</span>
</td>
</>) : null}
{ad?.ar?.col?.method ? (<>
<td className="p-[9px_12px]">
<div className="flex items-center gap-[5px]">
<span title={rw?.methodL} className="w-[26px] h-[26px] rounded-[7px] bg-surface-2 border border-solid border-border text-text-2 grid place-items-center" style={{visibility:rw?.mVis}}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={rw?.mIcon} />
</svg>
</span>
{rw?.offline ? (<>
<span title={rw?.offlineTip} className="w-[26px] h-[26px] rounded-[7px] bg-info-bg text-info grid place-items-center">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M2 2l20 20M17.5 17.5H7a5 5 0 0 1-1.7-9.7M10 5.2A6 6 0 0 1 18 10h1a4 4 0 0 1 2.4 7.2" />
</svg>
</span>
</>) : null}
</div>
</td>
</>) : null}
{ad?.ar?.col?.flag ? (<>
<td className="p-[9px_12px]">
{rw?.hasFlag ? (<>
<span title={rw?.flagTip} className="inline-grid place-items-center w-[26px] h-[26px] rounded-[7px]" style={{background:rw?.flagBg,color:rw?.flagFg}}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16h.01" />
</svg>
</span>
</>) : null}
{rw?.noFlag ? (<>
<span className="text-text-3">
{"—"}
</span>
</>) : null}
</td>
</>) : null}
{ad?.ar?.col?.edited ? (<>
<td className="p-[9px_12px] pr-[16px]">
{rw?.hasEdit ? (<>
<div className="flex items-center gap-[8px]">
<span className="w-[22px] h-[22px] rounded-[50%] grid place-items-center text-[9.5px] font-semibold flex-none" style={{background:rw?.eav?.bg,color:rw?.eav?.fg}}>
{rw?.eav?.ini}
</span>
<div className="min-w-[0]">
<div className="text-[12.5px] whitespace-nowrap">
{rw?.editBy}
</div>
<div className="text-[11.5px] text-text-3 whitespace-nowrap">
{rw?.editAt}
</div>
</div>
</div>
</>) : null}
{rw?.noEdit ? (<>
<span className="text-text-3">
{"—"}
</span>
</>) : null}
</td>
</>) : null}
</tr>
</Fragment>))}
</tbody>
</table>
</div>
<div className="flex justify-between items-center gap-[12px] flex-wrap p-[10px_16px] text-[12.5px] text-text-2">
<div className="flex items-center gap-[8px]">
<span>
{ad?.ar?.st?.rowsPer}
</span>
<select value={ad?.ar?.per} onChange={ad?.ar?.onPer} className="h-[28px] p-[0_6px] rounded-[7px] border border-solid border-border-strong bg-surface text-text text-[12.5px]">
<option value="25">
{"25"}
</option>
<option value="50">
{"50"}
</option>
<option value="100">
{"100"}
</option>
</select>
<span className="text-text-3">
{ad?.ar?.rangeTxt}
</span>
</div>
<div className="flex items-center gap-[4px]">
<button onClick={ad?.ar?.prev} disabled={ad?.ar?.atFirst} className="h-[30px] p-[0_10px] rounded-[7px] border border-solid border-border bg-surface text-text cursor-pointer" style={{opacity:ad?.ar?.prevOp}}>
{"←"}
</button>
{(ad?.ar?.pages ?? []).map((pg, $index) => (<Fragment key={$index}>
<button onClick={pg?.go} disabled={pg?.gap} className="min-w-[30px] h-[30px] p-[0_6px] rounded-[7px] [font:500_12.5px_'Geist_Mono',monospace] cursor-pointer" style={{border:`1px solid ${pg?.bd}`,background:pg?.bg,color:pg?.fg}}>
{pg?.label}
</button>
</Fragment>))}
<button onClick={ad?.ar?.next} disabled={ad?.ar?.atLast} className="h-[30px] p-[0_10px] rounded-[7px] border border-solid border-border bg-surface text-text cursor-pointer" style={{opacity:ad?.ar?.nextOp}}>
{"→"}
</button>
</div>
</div>
</>) : null}
{ad?.ar?.noResults ? (<>
<div className="p-[60px_20px] text-center">
<div className="w-[48px] h-[48px] m-[0_auto_14px] rounded-[12px] bg-neutral-bg text-text-3 grid place-items-center">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3M8 11h6" />
</svg>
</div>
<div className="font-semibold text-[15px]">
{ad?.ar?.st?.noResTitle}
</div>
<div className="text-text-3 text-[13px] m-[4px_0_16px]">
{ad?.ar?.noResDesc}
</div>
<button onClick={ad?.ar?.clearAll} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] inline-flex">
{ad?.ar?.st?.clearAll}
</button>
</div>
</>) : null}
</div>
</>) : null}
</div>
{ad?.ar?.addOpen ? (<>
<div className="fixed inset-[0] bg-overlay z-[45] grid place-items-center p-[20px]">
<div role="dialog" aria-label={tr("add_manual_record")} className="w-[580px] max-w-[100%] max-h-[92vh] flex flex-col bg-surface border border-solid border-border rounded-[14px] shadow-pop [animation:ssIn_.18s_ease-out]">
<div className="flex items-start gap-[12px] p-[18px_22px_14px] border-b border-solid border-b-border">
<div className="flex-1">
<div className="font-semibold text-[16px]">
{ad?.ar?.st?.addTitle}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{ad?.ar?.st?.addSub}
</div>
</div>
<button onClick={ad?.ar?.add?.cancel} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border bg-transparent text-text-2 grid place-items-center cursor-pointer">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
<div className="flex-1 overflow-auto p-[16px_22px] flex flex-col gap-[14px]">
{ad?.ar?.add?.showSummary ? (<>
<div className="flex gap-[8px] items-center p-[9px_12px] rounded-[9px] bg-bad-bg text-bad text-[12.5px] font-medium">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3l10 18H2zM12 10v4M12 17h.01" />
</svg>
{ad?.ar?.add?.summary}
</div>
</>) : null}
<div className="flex flex-col gap-[6px] relative">
<span className="flex flex-wrap gap-[0_4px] items-baseline text-[13px] font-medium">
<span>
{ad?.ar?.st?.cEmp}
</span>
<span className="text-bad">
{"*"}
</span>
</span>
{ad?.ar?.add?.hasEmp ? (<>
<div className="flex items-center gap-[10px] p-[8px_10px] rounded-[10px] border border-solid border-border-strong bg-surface-2">
<span className="w-[32px] h-[32px] rounded-[50%] grid place-items-center text-[12px] font-semibold flex-none" style={{background:ad?.ar?.add?.sel?.av?.bg,color:ad?.ar?.add?.sel?.av?.fg}}>
{ad?.ar?.add?.sel?.av?.ini}
</span>
<div className="flex-1 min-w-[0]">
<div className="font-medium text-[13.5px]">
{ad?.ar?.add?.sel?.name}
</div>
<div className="text-[12px] text-text-3">
{ad?.ar?.add?.sel?.empId}{" · "}{ad?.ar?.add?.sel?.job}{" · "}{ad?.ar?.add?.sel?.sched}
</div>
</div>
<button onClick={ad?.ar?.add?.clearEmp} className="border-0 bg-transparent text-accent text-[12.5px] font-medium cursor-pointer">
{ad?.ar?.add?.L?.change}
</button>
</div>
</>) : null}
{ad?.ar?.add?.noEmp ? (<>
<div className="flex items-center gap-[8px] h-[38px] p-[0_12px] rounded-[9px] bg-surface text-text-3" style={{border:`1px solid ${ad?.ar?.add?.empBd}`}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input value={ad?.ar?.add?.q} onChange={ad?.ar?.add?.onQ} onFocus={ad?.ar?.add?.openSearch} placeholder={ad?.ar?.add?.L?.searchPh} className="flex-1 min-w-[0] border-0 [outline:0] bg-transparent text-text text-[13.5px]" />
</div>
{ad?.ar?.add?.searchOpen ? (<>
<div className="absolute top-[66px] left-[0] right-[0] z-[5] max-h-[240px] overflow-auto bg-surface border border-solid border-border rounded-[10px] shadow-pop p-[4px]">
{(ad?.ar?.add?.results ?? []).map((er, $index) => (<Fragment key={$index}>
<button onClick={er?.pick} className="flex items-center gap-[10px] w-[100%] p-[7px_8px] border-0 rounded-[8px] bg-transparent text-text cursor-pointer text-left hover:bg-hover">
<span className="w-[28px] h-[28px] rounded-[50%] grid place-items-center text-[11px] font-semibold flex-none" style={{background:er?.av?.bg,color:er?.av?.fg}}>
{er?.av?.ini}
</span>
<span className="flex-1 min-w-[0]">
<span className="block text-[13px] font-medium">
{er?.name}
</span>
<span className="block text-[11.5px] text-text-3">
{er?.empId}{" · "}{er?.site}
</span>
</span>
</button>
</Fragment>))}
{ad?.ar?.add?.noResults ? (<>
<div className="p-[14px] text-center text-[12.5px] text-text-3">
{ad?.ar?.add?.L?.noEmp}
</div>
</>) : null}
</div>
</>) : null}
</>) : null}
{ad?.ar?.add?.empErr ? (<>
<span className="text-[12.5px] text-bad">
{ad?.ar?.st?.errEmp}
</span>
</>) : null}
</div>
<div className="grid grid-cols-[1.4fr_1fr] gap-[10px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{ad?.ar?.st?.cSite}
</span>
<select value={ad?.ar?.add?.site} onChange={ad?.ar?.add?.onSite} className="h-[38px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(ad?.ar?.add?.siteOpts ?? []).map((so2, $index) => (<Fragment key={$index}>
<option value={so2?.id}>
{so2?.name}
</option>
</Fragment>))}
</select>
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{ad?.ar?.st?.cDate}
</span>
<input type="date" min="2026-10-01" max="2026-10-15" value={ad?.ar?.add?.date} onChange={ad?.ar?.add?.onDate} className="h-[38px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] min-w-[0]" />
</label>
</div>
<div className="grid grid-cols-[1fr_1fr_1.3fr] gap-[10px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{ad?.ar?.st?.cIn}
</span>
<input type="time" value={ad?.ar?.add?.in} onChange={ad?.ar?.add?.onIn} disabled={ad?.ar?.add?.noTimes} className="h-[38px] p-[0_8px] rounded-[9px] text-text [font:500_13px_'Geist_Mono',monospace] min-w-[0]" style={{border:`1px solid ${ad?.ar?.add?.inBd}`,background:ad?.ar?.add?.timeBg}} />
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{ad?.ar?.st?.cOut}
</span>
<input type="time" value={ad?.ar?.add?.out} onChange={ad?.ar?.add?.onOut} disabled={ad?.ar?.add?.noTimes} className="h-[38px] p-[0_8px] rounded-[9px] text-text [font:500_13px_'Geist_Mono',monospace] min-w-[0]" style={{border:`1px solid ${ad?.ar?.add?.outBd}`,background:ad?.ar?.add?.timeBg}} />
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{ad?.ar?.st?.cStatus}
</span>
<select value={ad?.ar?.add?.status} onChange={ad?.ar?.add?.onStatus} className="h-[38px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(ad?.ar?.add?.statusOpts ?? []).map((sx, $index) => (<Fragment key={$index}>
<option value={sx?.id}>
{sx?.name}
</option>
</Fragment>))}
</select>
</label>
</div>
<div className="text-[12px] text-text-3 mt-[-6px]">
{ad?.ar?.add?.hint}
</div>
{ad?.ar?.add?.timeErr ? (<>
<span className="text-[12.5px] text-bad mt-[-8px]">
{ad?.ar?.st?.errTime}
</span>
</>) : null}
{ad?.ar?.add?.hasOverlap ? (<>
<div className="flex gap-[10px] p-[11px_13px] rounded-[10px] bg-bad-bg text-bad">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[1px]">
<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3M9 12h6" />
</svg>
<div className="flex-1">
<div className="font-semibold text-[13px]">
{ad?.ar?.add?.L?.overlapTitle}
</div>
<div className="text-[12.5px]">
{ad?.ar?.add?.overlapDesc}
</div>
<a href="#" onClick={ad?.ar?.add?.openOverlap} className="text-[12.5px] font-medium text-[color:inherit] underline">
{ad?.ar?.add?.L?.openRec}
</a>
</div>
</div>
</>) : null}
<label className="flex flex-col gap-[6px]">
<span className="flex flex-wrap gap-[0_4px] items-baseline text-[13px] font-medium">
<span>
{ad?.ar?.st?.reason}
</span>
<span className="text-bad">
{"*"}
</span>
</span>
<textarea value={ad?.ar?.add?.reason} onChange={ad?.ar?.add?.onReason} rows="2" placeholder={ad?.ar?.st?.reasonPh} className="p-[10px_12px] rounded-[9px] bg-surface text-text [font:400_13.5px_'Geist',sans-serif] resize-y [outline-color:var(--accent)]" style={{border:`1px solid ${ad?.ar?.add?.reasonBd}`}} />
{ad?.ar?.add?.reasonErr ? (<>
<span className="text-[12.5px] text-bad">
{ad?.ar?.st?.errReason}
</span>
</>) : null}
</label>
<div className="flex flex-col gap-[8px]">
<span className="flex flex-wrap gap-[0_4px] items-baseline text-[13px] font-medium">
<span>
{ad?.ar?.add?.L?.evidence}
</span>
<span className="text-text-3 font-normal">
{"· "}{ad?.ar?.add?.L?.optional}
</span>
</span>
<label className="flex items-center gap-[12px] p-[12px_14px] border-[1.5px] border-dashed border-border-strong rounded-[10px] bg-surface-2 cursor-pointer hover:border-accent">
<input type="file" multiple={true} accept="image/*,.pdf" onChange={ad?.ar?.add?.onFiles} className="hidden" />
<span className="w-[34px] h-[34px] rounded-[9px] bg-accent-soft text-accent grid place-items-center flex-none">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" />
</svg>
</span>
<span>
<span className="block text-[13px] font-medium">
{ad?.ar?.add?.L?.attach}
</span>
<span className="block text-[12px] text-text-3">
{ad?.ar?.add?.L?.attachHint}
</span>
</span>
</label>
{(ad?.ar?.add?.files ?? []).map((fl, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[7px_10px] border border-solid border-border rounded-[9px] text-[13px]">
<span className="[font:600_10px_'Geist_Mono',monospace] p-[3px_5px] rounded-[5px] bg-neutral-bg text-text-2">
{fl?.ext}
</span>
<span className="flex-1 min-w-[0] overflow-hidden text-ellipsis whitespace-nowrap">
{fl?.name}
</span>
<span className="text-[12px] text-text-3">
{fl?.size}
</span>
<button onClick={fl?.remove} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent text-text-3 grid place-items-center cursor-pointer">
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
</Fragment>))}
</div>
<div className="flex gap-[8px] p-[10px_12px] rounded-[9px] bg-surface-2 text-[12.5px] text-text-2">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M12 11v5" />
</svg>
<span>
{ad?.ar?.add?.audit}
</span>
</div>
</div>
<div className="flex justify-end gap-[8px] p-[12px_22px_16px] border-t border-solid border-t-border">
<button onClick={ad?.ar?.add?.cancel} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[36px]">
{ad?.ar?.st?.cancel}
</button>
<button onClick={ad?.ar?.add?.save} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-[7px] h-[36px] border-0 bg-accent text-[color:#fff]" style={{opacity:ad?.ar?.add?.saveOp}}>
{ad?.ar?.st?.addSave}
</button>
</div>
</div>
</div>
</>) : null}
</>
    );
  }
}

export default function AdminAttendance(props: any) {
  const tr = useTranslations('AdminAttendance');
  return <AdminAttendanceView {...props} tr={tr} />;
}
