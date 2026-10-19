'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


class AdminLeaveBase extends DCLogic {}

class AdminLeaveView extends AdminLeaveBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
<div className="flex flex-col gap-[16px]">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{ad?.t?.leave}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{ad?.t?.leaveSub}
</div>
</div>
{ad?.readOnlyLeave ? (<>
<div className="flex items-center gap-[10px] p-[10px_14px] rounded-[10px] bg-info-bg text-info text-[13px]">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
</svg>
{ad?.t?.readOnly}
</div>
</>) : null}
<div className="flex gap-[20px] border-b border-solid border-b-border">
{(ad?.leaveTabs ?? []).map((lt, $index) => (<Fragment key={$index}>
<button onClick={lt?.go} className="border-0 bg-transparent p-[0_0_10px] mb-[-1px] [font:500_13.5px_'Geist',sans-serif] cursor-pointer flex gap-[6px] items-center" style={{borderBottom:`2px solid ${lt?.bd}`,color:lt?.fg}}>
{lt?.label}
<span className="[font:500_11.5px_'Geist_Mono',monospace] p-[1px_6px] rounded-[999px] bg-neutral-bg text-text-2">
{lt?.count}
</span>
</button>
</Fragment>))}
</div>
<div className="flex flex-col gap-[10px]">
{(ad?.leaveRows ?? []).map((l, $index) => (<Fragment key={$index}>
<div className="flex flex-wrap items-center gap-[16px_20px] p-[14px_18px] bg-surface border border-solid border-border rounded-[12px] shadow-card">
<div className="flex items-center gap-[12px] flex-[1_1_220px] min-w-[0]">
<div className="w-[36px] h-[36px] rounded-[50%] grid place-items-center text-[12.5px] font-semibold flex-none" style={{background:l?.av?.bg,color:l?.av?.fg}}>
{l?.av?.ini}
</div>
<div className="min-w-[0]">
<div className="font-semibold">
{l?.name}
</div>
<div className="text-[12.5px] text-text-3">
{l?.siteName}{" · "}{l?.submitted}
</div>
</div>
</div>
<div className="flex-[0_0_140px]">
<div className="text-[12px] text-text-3">
{ad?.t?.colType}
</div>
<div className="font-medium">
{l?.type}
</div>
</div>
<div className="flex-[1_1_180px]">
<div className="text-[12px] text-text-3">
{ad?.t?.colDates}
</div>
<div className="flex flex-wrap gap-[0_4px] items-baseline font-medium">
<span>
{l?.dates}
</span>
<span className="text-text-3 font-normal">
{"· "}{l?.daysL}
</span>
</div>
</div>
<div className="flex-[1_1_200px] flex flex-col gap-[4px]">
{l?.hasNote ? (<>
<div className="flex items-center gap-[6px] text-[12.5px]" style={{color:l?.noteC}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d={l?.noteIcon} />
</svg>
{l?.note}
</div>
</>) : null}
</div>
<div className="flex items-center gap-[8px] ml-[auto]">
{l?.showActions ? (<>
<button onClick={l?.reject} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_13px_'Geist',sans-serif] cursor-pointer hover:bg-hover">
{ad?.t?.reject}
</button>
<button onClick={l?.approve} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] [font:500_13px_'Geist',sans-serif] cursor-pointer hover:bg-accent-hover">
{ad?.t?.approve}
</button>
</>) : null}
{l?.showChip ? (<>
<span className="inline-flex items-center gap-[6px] p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:l?.chip?.bg,color:l?.chip?.fg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:l?.chip?.dot}} />
{l?.chip?.label}
</span>
</>) : null}
</div>
</div>
</Fragment>))}
{ad?.leaveEmpty ? (<>
<div className="p-[56px_20px] text-center bg-surface border border-dashed border-border-strong rounded-[12px]">
<div className="font-semibold text-[15px]">
{ad?.t?.emptyLeave}
</div>
<div className="text-text-3 text-[13px] mt-[4px]">
{ad?.t?.emptyLeaveDesc}
</div>
</div>
</>) : null}
</div>
</div>
</>
    );
  }
}

export default function AdminLeave(props: any) {
  const tr = useTranslations('AdminLeave');
  return <AdminLeaveView {...props} tr={tr} />;
}
