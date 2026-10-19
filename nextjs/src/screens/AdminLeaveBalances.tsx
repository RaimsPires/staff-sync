'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const TY={annual:['Annual leave','var(--info)',25],rtt:['RTT','var(--violet)',10],sick:['Sick leave','var(--orange)',5],family:['Family event','var(--ok)',4]};
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const f1=n=>(Math.round(n*10)/10).toString();
class AdminLeaveBalancesBase extends DCLogic {
  state={year:2026,q:'',br:'all',site:'all',type:'all',low:false,adj:{},log:[],m:null,toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  bal(name,type,year){
    const s=this.state,ent=TY[type][2]+(s.adj[year+'|'+name+'|'+type]||0),h=hash(name+type+year);
    const base=Math.min(ent,Math.round((type==='annual'?8+h%10:type==='rtt'?h%5:type==='sick'?h%3:h%2)*(year===2026?(type==='annual'?.8:1):1)));
    let used=base,pend=0;
    if(year===2026)(this.props.items||[]).filter(r=>r.emp===name&&r.type===type&&r.from.startsWith('2026')).forEach(r=>{if(r.status==='approved'&&r.from>'2026-10-15')used+=r.days;else if(r.status==='pending')pend+=r.days;});
    if(year===2027){used=0;pend=0;}
    return {e:ent,u:used,p:pend,r:ent-used-pend};
  }
  people(){const m={};(this.props.items||[]).forEach(r=>{if(!m[r.emp])m[r.emp]={name:r.emp,site:r.site,role:r.role};});return Object.values(m);}
  renderVals(){return {b:this.rv()};}
  rv(){
    const s=this.state,T=this,yr=s.year,set=k=>ev=>this.setState({[k]:ev.target.value});
    const types=s.type==='all'?Object.keys(TY):[s.type],sitesA=Object.keys(SN).filter(k=>s.br==='all'||SN[k][1]===s.br);
    const all=this.people().filter(x=>(s.br==='all'||SN[x.site][1]===s.br)&&(s.site==='all'||x.site===s.site)&&(!s.q.trim()||x.name.toLowerCase().includes(s.q.trim().toLowerCase())));
    const isLow=x=>types.some(t=>{const b=this.bal(x.name,t,yr);return b.r<=(t==='annual'?3:1);});
    const lowN=all.filter(isLow).length,list=all.filter(x=>!s.low||isLow(x));
    const rc=(r,t)=>r<0?'var(--bad)':r<=(t==='annual'?3:1)?'var(--warn)':'var(--text)';
    const rows=list.map(x=>{const av=AV[(x.name.charCodeAt(0)+x.name.length)%AV.length];return {name:x.name,sub:x.role+' · '+SN[x.site][0].split(' ')[0],ini:x.name.split(' ').map(w=>w[0]).join('').slice(0,2),avBg:av[0],avFg:av[1],
      cells:types.map(t=>{const b=this.bal(x.name,t,yr);return {e:f1(b.e),u:f1(b.u),p:b.p?f1(b.p):'–',pc:b.p?'var(--info)':'var(--text-3)',r:b.r<0?'−'+f1(Math.abs(b.r)):f1(b.r),rc:rc(b.r,t)};}),
      adjust:()=>this.setState({m:{name:x.name,type:types[0],n:'',reason:'',tried:false}})};});
    const m=s.m,nv=m?parseFloat(m.n):NaN,cur=m?this.bal(m.name,m.type,yr):null,okN=!isNaN(nv)&&nv!==0,okR=m&&m.reason.trim().length>=3,post=cur&&okN?cur.r+nv:null;
    const setM=k=>ev=>{const v=ev.target.value;this.setState(x=>({m:Object.assign({},x.m,{[k]:v})}));};
    const bump=d=>()=>this.setState(x=>({m:Object.assign({},x.m,{n:String(f1((parseFloat(x.m.n)||0)+d))})}));
    return {
      year:yr,yPrev:()=>this.setState({year:yr-1}),yNext:()=>this.setState({year:yr+1}),q:s.q,onQ:set('q'),
      filters:[{val:s.br,on:ev=>this.setState({br:ev.target.value,site:'all'}),opts:[{v:'all',l:'All branches'}].concat(['Lyon','Paris Nord','Marseille'].map(x=>({v:x,l:x})))},{val:s.site,on:set('site'),opts:[{v:'all',l:'All sites'}].concat(sitesA.map(k=>({v:k,l:SN[k][0]})))},{val:s.type,on:set('type'),opts:[{v:'all',l:'All leave types'}].concat(Object.keys(TY).map(k=>({v:k,l:TY[k][0]})))}],
      lowN,lowBg:s.low?'var(--accent)':'var(--surface)',lowFg:s.low?'#fff':'var(--text-2)',lowBd:s.low?'var(--accent)':'var(--border-strong)',togLow:()=>this.setState({low:!s.low}),
      heads:types.map(t=>({l:TY[t][0],fg:TY[t][1]})),minW:210+88+types.length*230,rows,empty:rows.length===0,
      export:()=>{try{const hd=['Employee','Site'].concat(...types.map(t=>['Entitled','Used','Pending','Remaining'].map(k=>TY[t][0]+' '+k)));const body=list.map(x=>[x.name,SN[x.site][0]].concat(...types.map(t=>{const b=this.bal(x.name,t,yr);return[b.e,b.u,b.p,b.r];})));const csv=[hd].concat(body).map(r=>r.join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='leave-balances-'+yr+'.csv';a.click();this.say('Exported '+list.length+' employees');}catch(e){this.say('Export unavailable');}},
      hasLog:s.log.length>0,log:s.log.map((l,i)=>({d:(l.n>0?'+':'−')+f1(Math.abs(l.n))+' d',c:l.n>0?'var(--ok)':'var(--bad)',who:l.name,type:TY[l.type][0]+' '+l.year,reason:l.reason,bt:i?'1px solid var(--border)':'0'})),
      m:m?{name:m.name,type:m.type,types:Object.keys(TY).map(k=>({v:k,l:TY[k][0]})),onType:setM('type'),n:m.n,onN:setM('n'),plus:bump(.5),minus:bump(-.5),nBd:m.tried&&!okN?'var(--bad-dot)':'var(--border-strong)',nE:m.tried&&!okN?'Enter a non-zero number of days':'',pre:f1(cur.r),post:post==null?'—':f1(post),postC:post!=null&&post<0?'var(--bad)':'var(--text)',reason:m.reason,onReason:setM('reason'),rBd:m.tried&&!okR?'var(--bad-dot)':'var(--border-strong)',rE:m.tried&&!okR?'A reason is required':''}:null,
      mClose:()=>this.setState({m:null}),
      mSave:()=>{if(!okN||!okR){this.setState(x=>({m:Object.assign({},x.m,{tried:true})}));return;}const k=yr+'|'+m.name+'|'+m.type;this.setState(x=>({adj:Object.assign({},x.adj,{[k]:(x.adj[k]||0)+nv}),log:[{name:m.name,type:m.type,n:nv,reason:m.reason.trim(),year:yr}].concat(x.log),m:null}));this.say(TY[m.type][0]+' adjusted by '+(nv>0?'+':'−')+f1(Math.abs(nv))+' d · logged in audit');},
      toast:s.toast
    };
  }
}

class AdminLeaveBalancesView extends AdminLeaveBalancesBase {
  view(S) {
    const tr = this.props.tr;
    const { b } = S;
    return (
<>
<div className="flex flex-col gap-[12px] relative">
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex items-center gap-[4px]">
<button onClick={b?.yPrev} aria-label={tr("previous_year")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text cursor-pointer text-[16px]">
{"‹"}
</button>
<div className="min-w-[64px] text-center font-semibold text-[15px]">
{b?.year}
</div>
<button onClick={b?.yNext} aria-label={tr("next_year")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text cursor-pointer text-[16px]">
{"›"}
</button>
</div>
<div className="flex items-center gap-[8px] h-[34px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3 flex-[1_1_180px] max-w-[260px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={b?.q} onInput={b?.onQ} placeholder={tr("search_employee")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%]" />
</div>
{(b?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] max-w-[170px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
<button onClick={b?.togLow} className="h-[34px] p-[0_12px] rounded-[999px] text-[13px] font-medium cursor-pointer" style={{border:`1px solid ${b?.lowBd}`,background:b?.lowBg,color:b?.lowFg}}>
{tr("low_balance_p0",{p0:b?.lowN ?? ''})}
</button>
<div className="flex-1" />
<button onClick={b?.export} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("export_csv")}
</button>
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div style={{minWidth:`${b?.minW}px`}}>
<div className="flex bg-surface-2 border-b border-solid border-b-border rounded-[12px_12px_0_0]">
<div className="flex-none w-[210px] sticky left-[0] z-[2] bg-surface-2 p-[8px_14px] text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] flex items-end box-border border-r border-solid border-r-border">
{tr("employee")}
</div>
{(b?.heads ?? []).map((h, $index) => (<Fragment key={$index}>
<div className="flex-1 min-w-[0] border-l border-solid border-l-border">
<div className="p-[6px_0] text-center text-[12px] font-semibold" style={{color:h?.fg}}>
<span className="inline-block w-[8px] h-[8px] rounded-[2px] mr-[6px]" style={{background:h?.fg}} />
{h?.l}
</div>
<div className="grid grid-cols-[repeat(4,1fr)] p-[0_4px_6px] text-right text-[10.5px] font-semibold text-text-3 uppercase tracking-[.03em]">
<span>
{tr("ent")}
</span>
<span>
{tr("used")}
</span>
<span>
{tr("pend")}
</span>
<span>
{tr("left")}
</span>
</div>
</div>
</Fragment>))}
<div className="flex-none w-[88px]" />
</div>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex border-b border-solid border-b-border items-center hover:bg-hover">
<div className="flex-none w-[210px] sticky left-[0] z-[1] bg-surface p-[9px_14px] box-border border-r border-solid border-r-border flex items-center gap-[10px]">
<div className="w-[30px] h-[30px] rounded-[50%] flex-none grid place-items-center text-[11.5px] font-semibold" style={{background:r?.avBg,color:r?.avFg}}>
{r?.ini}
</div>
<div className="min-w-[0]">
<div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{r?.name}
</div>
<div className="text-[11.5px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{r?.sub}
</div>
</div>
</div>
{(r?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="flex-1 min-w-[0] border-l border-solid border-l-border grid grid-cols-[repeat(4,1fr)] p-[9px_4px] text-right [font:12.5px_'Geist_Mono',monospace] text-text-2">
<span>
{c?.e}
</span>
<span>
{c?.u}
</span>
<span style={{color:c?.pc}}>
{c?.p}
</span>
<span className="font-semibold" style={{color:c?.rc}}>
{c?.r}
</span>
</div>
</Fragment>))}
<div className="flex-none w-[88px] p-[0_10px] text-center">
<button onClick={r?.adjust} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("adjust")}
</button>
</div>
</div>
</Fragment>))}
{b?.empty ? (<>
<div className="p-[48px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_employees_match_the_filters")}
</div>
</>) : null}
</div>
</div>
{b?.hasLog ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] font-semibold text-[14px] border-b border-solid border-b-border">
{tr("adjustments_logged_in_the_audit")}
</div>
{(b?.log ?? []).map((l, $index) => (<Fragment key={$index}>
<div className="flex gap-[12px] items-center p-[10px_16px] text-[13px] flex-wrap" style={{borderTop:l?.bt}}>
<span className="[font:600_12.5px_'Geist_Mono',monospace] w-[60px]" style={{color:l?.c}}>
{l?.d}
</span>
<span className="flex-1 min-w-[200px]">
<b className="font-medium">
{l?.who}
</b>
{" · "}{l?.type}{" "}
<span className="text-text-3">
{"· "}{l?.reason}
</span>
</span>
<span className="text-text-3 text-[12.5px]">
{tr("claire_vasseur_just_now")}
</span>
</div>
</Fragment>))}
</div>
</>) : null}
{b?.m ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[440px] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div>
<div className="font-semibold text-[16px]">
{tr("adjust_balance")}
</div>
<div className="text-[12.5px] text-text-3">
{b?.m?.name}{" · "}{b?.year}
</div>
</div>
<button onClick={b?.mClose} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[20px] flex flex-col gap-[14px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("leave_type")}
<select value={b?.m?.type} onChange={b?.m?.onType} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(b?.m?.types ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("days_add_deduct")}
<div className="flex gap-[8px] items-center">
<button onClick={b?.m?.minus} aria-label={tr("subtract_half_day")} className="w-[36px] h-[36px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[18px] cursor-pointer">
{"−"}
</button>
<input type="number" step="0.5" value={b?.m?.n} onInput={b?.m?.onN} className="h-[36px] w-[100px] text-center p-[0_8px] rounded-[9px] bg-surface text-text [font:14px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${b?.m?.nBd}`}} />
<button onClick={b?.m?.plus} aria-label={tr("add_half_day")} className="w-[36px] h-[36px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[18px] cursor-pointer">
{"+"}
</button>
<div className="ml-[auto] flex-none whitespace-nowrap [font:13px_'Geist_Mono',monospace] text-text-2">
{b?.m?.pre}{" → "}
<b style={{color:b?.m?.postC}}>
{b?.m?.post}
</b>
</div>
</div>
<span className="text-[12px] text-bad font-normal">
{b?.m?.nE}
</span>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("reason")}
<textarea rows="3" value={b?.m?.reason} onInput={b?.m?.onReason} placeholder={tr("e_g_carry_over_from")} className="resize-y p-[9px_10px] rounded-[9px] bg-surface text-text text-[13px] [outline:none]" style={{border:`1px solid ${b?.m?.rBd}`}} />
<span className="text-[12px] text-bad font-normal">
{b?.m?.rE}
</span>
</label>
<div className="text-[12.5px] text-text-3">
{tr("this_change_is_recorded_in")}
</div>
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={b?.mClose} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={b?.mSave} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("apply_adjustment")}
</button>
</div>
</div>
</div>
</>) : null}
{b?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{b?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminLeaveBalances(props: any) {
  const tr = useTranslations('AdminLeaveBalances');
  return <AdminLeaveBalancesView {...props} tr={tr} />;
}
