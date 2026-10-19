'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


class AdminOtherBase extends DCLogic {}

class AdminOtherView extends AdminOtherBase {
  view(S) {
    const tr = this.props.tr;
    const { ad } = S;
    return (
<>
<div className="min-h-[60vh] grid place-items-center text-center">
<div className="max-w-[360px]">
<div className="w-[52px] h-[52px] m-[0_auto_14px] rounded-[14px] bg-accent-soft text-accent grid place-items-center">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={ad?.otherIcon} />
</svg>
</div>
<div className="font-semibold text-[17px]">
{ad?.otherTitle}
</div>
<div className="text-text-3 text-[13.5px] m-[6px_0_18px]">
{ad?.t?.notBuiltDesc}
</div>
<button onClick={ad?.goDash} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_13px_'Geist',sans-serif] cursor-pointer">
{ad?.t?.backDash}
</button>
</div>
</div>
</>
    );
  }
}

export default function AdminOther(props: any) {
  const tr = useTranslations('AdminOther');
  return <AdminOtherView {...props} tr={tr} />;
}
