'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const TY={annual:['Annual leave','var(--info)','var(--info-bg)'],rtt:['RTT','var(--violet)','var(--violet-bg)'],sick:['Sick leave','var(--orange)','var(--orange-bg)'],family:['Family event','var(--ok)','var(--ok-bg)'],unpaid:['Unpaid','var(--neutral)','var(--neutral-bg)']};
const HOL={'2026-11-01':'All Saints','2026-11-11':'Armistice Day','2026-12-25':'Christmas Day'};
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'],DL=['M','T','W','T','F','S','S'],DAY=864e5;
const pms=s=>{const[y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const iso=t=>new Date(t).toISOString().slice(0,10),dow=t=>(new Date(t).getUTCDay()+6)%7;
const TODAY=pms('2026-10-15');
class AdminLeaveCalendarBase extends DCLogic {
  state={scale:'month',anchor:TODAY,br:'all',site:'all',type:'all',emp:'all',status:'all',group:'site',only:false};
  period(){const s=this.state,a=new Date(s.anchor),y=a.getUTCFullYear(),m=a.getUTCMonth();if(s.scale==='month')return{a:Date.UTC(y,m,1),b:Date.UTC(y,m+1,0)};const q=Math.floor(m/3)*3;return{a:Date.UTC(y,q,1),b:Date.UTC(y,q+3,0)};}
  shift(n){const a=new Date(this.state.anchor),step=this.state.scale==='month'?1:3;this.setState({anchor:Date.UTC(a.getUTCFullYear(),a.getUTCMonth()+n*step,1)});}
  renderVals(){return {c:this.rv()};}
  rv(){
    const s=this.state,p=this.props,P=this.period(),n=Math.round((P.b-P.a)/DAY)+1,cw=s.scale==='month'?32:Math.max(10,Math.floor(1080/n));
    const people=p.people||[],items=(p.items||[]).filter(r=>(r.status==='approved'||r.status==='pending')&&(s.status==='all'||r.status===s.status)&&(s.type==='all'||r.type===s.type));
    const set=k=>ev=>this.setState({[k]:ev.target.value});
    const days=[],cells=[];
    for(let i=0;i<n;i++){const t=P.a+i*DAY,d=new Date(t),w=dow(t),h=HOL[iso(t)],tod=t===TODAY,wk=w>=5;
      const showN=s.scale==='month'||w===0||d.getUTCDate()===1;
      days.push({n:showN?d.getUTCDate():'',w:s.scale==='month'?DL[w]:'',tip:h?h+' (public holiday)':'',bg:h?'var(--warn-bg)':tod?'var(--accent-soft)':wk?'var(--surface-2)':'transparent',fg:h?'var(--warn)':tod?'var(--accent)':'var(--text-3)'});
      cells.push({bg:h?'var(--warn-bg)':tod?'var(--accent-soft)':wk?'var(--surface-2)':'transparent'});}
    const months=[];for(let t=P.a;t<=P.b;){const d=new Date(t),e=Math.min(P.b,Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)),len=Math.round((e-t)/DAY)+1;months.push({l:MN[d.getUTCMonth()]+' '+d.getUTCFullYear(),w:len*cw});t=e+DAY;}
    const sitesA=Object.keys(SN).filter(k=>s.br==='all'||SN[k][1]===s.br);
    const ppl=people.filter(x=>(s.br==='all'||SN[x[1]][1]===s.br)&&(s.site==='all'||x[1]===s.site)&&(s.emp==='all'||x[0]===s.emp));
    const barsOf=name=>items.filter(r=>r.emp===name&&pms(r.to)>=P.a&&pms(r.from)<=P.b).map(r=>{const f=Math.max(pms(r.from),P.a),e=Math.min(pms(r.to),P.b),t=TY[r.type],pend=r.status==='pending',w=(Math.round((e-f)/DAY)+1)*cw-2;
      const half=r.half?'½ day':r.days+(r.days===1?' day':' days');
      return {x:Math.round((f-P.a)/DAY)*cw+1,w,l:w>=72?t[0].split(' ')[0]+' · '+half:w>=38?(r.half?'½d':r.days+'d'):'',
        bg:pend?'repeating-linear-gradient(135deg,'+t[1]+' 0 2px,transparent 2px 7px),'+t[2]:t[1],bd:'1px solid '+t[1],fg:pend?t[1]:'#fff',
        tip:r.emp+' · '+t[0]+' · '+half+' · '+r.from.slice(5)+(r.from===r.to?'':' → '+r.to.slice(5))+' · '+(pend?'Pending':'Approved'),go:()=>p.onOpen&&p.onOpen(r.id)};});
    const keyOf=x=>s.group==='site'?x[1]:SN[x[1]][1];
    const keys=[...new Set(ppl.map(keyOf))];
    const grps=keys.map(k=>{let rows=ppl.filter(x=>keyOf(x)===k).map(x=>({name:x[0],sub:x[2]+' · '+SN[x[1]][0].split(' ')[0],bars:barsOf(x[0])}));if(s.only)rows=rows.filter(r=>r.bars.length);
      let peak=0;for(let i=0;i<n;i++){const t=P.a+i*DAY;const c=new Set(items.filter(r=>keyOf([0,r.site])===k&&pms(r.from)<=t&&pms(r.to)>=t).map(r=>r.emp)).size;if(c>peak)peak=c;}
      return {name:s.group==='site'?SN[k][0]:k,sub:rows.length+' employee'+(rows.length===1?'':'s')+(peak?' · peak '+peak+' off at once':' · nobody off'),rows};}).filter(g=>g.rows.length);
    const a=new Date(P.a);
    return {
      scales:[['month','Month'],['quarter','Quarter']].map(([k,l])=>({l,bg:s.scale===k?'var(--accent)':'var(--surface)',fg:s.scale===k?'#fff':'var(--text-2)',go:()=>this.setState({scale:k})})),
      prev:()=>this.shift(-1),next:()=>this.shift(1),today:()=>this.setState({anchor:TODAY}),
      range:s.scale==='month'?MN[a.getUTCMonth()]+' '+a.getUTCFullYear():'Q'+(Math.floor(a.getUTCMonth()/3)+1)+' '+a.getUTCFullYear(),
      groups:[['site','By site'],['branch','By branch']].map(([k,l])=>({l,bg:s.group===k?'var(--accent)':'var(--surface)',fg:s.group===k?'#fff':'var(--text-2)',go:()=>this.setState({group:k})})),
      filters:[{val:s.br,on:ev=>this.setState({br:ev.target.value,site:'all',emp:'all'}),opts:[{v:'all',l:'All branches'}].concat(['Lyon','Paris Nord','Marseille'].map(b=>({v:b,l:b})))},{val:s.site,on:set('site'),opts:[{v:'all',l:'All sites'}].concat(sitesA.map(k=>({v:k,l:SN[k][0]})))},{val:s.type,on:set('type'),opts:[{v:'all',l:'All leave types'}].concat(Object.keys(TY).map(k=>({v:k,l:TY[k][0]})))},{val:s.status,on:set('status'),opts:[{v:'all',l:'Approved + pending'},{v:'approved',l:'Approved only'},{v:'pending',l:'Pending only'}]},{val:s.emp,on:set('emp'),opts:[{v:'all',l:'All employees'}].concat(people.map(x=>x[0]).sort().map(x=>({v:x,l:x})))}],
      onlyBg:s.only?'var(--accent)':'var(--surface)',onlyFg:s.only?'#fff':'var(--text-2)',onlyBd:s.only?'var(--accent)':'var(--border-strong)',togOnly:()=>this.setState({only:!s.only}),
      legend:Object.keys(TY).map(k=>({l:TY[k][0],bg:TY[k][1]})),cw,trackW:n*cw,totalW:190+n*cw,months,days,cells,grps,empty:grps.length===0
    };
  }
}

class AdminLeaveCalendarView extends AdminLeaveCalendarBase {
  view(S) {
    const tr = this.props.tr;
    const { c } = S;
    return (
<>
<div className="flex flex-col gap-[12px]">
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(c?.scales ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_14px] border-0 text-[13px] font-medium cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
<div className="flex items-center gap-[4px]">
<button onClick={c?.prev} aria-label={tr("previous")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text cursor-pointer text-[16px]">
{"‹"}
</button>
<button onClick={c?.today} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("today")}
</button>
<button onClick={c?.next} aria-label={tr("next")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text cursor-pointer text-[16px]">
{"›"}
</button>
</div>
<div className="font-semibold text-[15px] min-w-[140px]">
{c?.range}
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(c?.groups ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_12px] border-0 text-[13px] cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
{(c?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] max-w-[170px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
<button onClick={c?.togOnly} className="h-[34px] p-[0_12px] rounded-[999px] text-[13px] font-medium cursor-pointer" style={{border:`1px solid ${c?.onlyBd}`,background:c?.onlyBg,color:c?.onlyFg}}>
{tr("only_people_off")}
</button>
</div>
<div className="flex gap-[16px] flex-wrap text-[12px] text-text-2 items-center">
{(c?.legend ?? []).map((l, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[6px]">
<span className="w-[20px] h-[11px] rounded-[3px]" style={{background:l?.bg}} />
{l?.l}
</span>
</Fragment>))}
<span className="flex items-center gap-[6px]">
<span className="w-[20px] h-[11px] rounded-[3px] border border-solid border-info [background:repeating-linear-gradient(135deg,var(--info)_0_2px,transparent_2px_6px),var(--info-bg)]" />
{tr("pending_hatched")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[11px] h-[11px] rounded-[3px] bg-warn-bg border border-solid border-warn-dot" />
{tr("public_holiday")}
</span>
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div style={{width:`${c?.totalW}px`}}>
<div className="flex border-b border-solid border-b-border bg-surface-2">
<div className="flex-none w-[190px] sticky left-[0] z-[3] bg-surface-2 p-[8px_14px] text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] flex items-end border-r border-solid border-r-border box-border">
{tr("employee")}
</div>
<div className="flex-none" style={{width:`${c?.trackW}px`}}>
<div className="flex border-b border-solid border-b-border">
{(c?.months ?? []).map((m, $index) => (<Fragment key={$index}>
<div className="flex-none p-[5px_8px] text-[12px] font-semibold text-text border-l border-solid border-l-border box-border whitespace-nowrap overflow-hidden" style={{width:`${m?.w}px`}}>
{m?.l}
</div>
</Fragment>))}
</div>
<div className="flex">
{(c?.days ?? []).map((d, $index) => (<Fragment key={$index}>
<div title={d?.tip} className="flex-none h-[34px] box-border border-l border-solid border-l-border text-center text-[10.5px] leading-[1.15] pt-[4px]" style={{width:`${c?.cw}px`,background:d?.bg,color:d?.fg}}>
<div className="font-semibold text-[11px]">
{d?.n}
</div>
<div className="opacity-[.8]">
{d?.w}
</div>
</div>
</Fragment>))}
</div>
</div>
</div>
{(c?.grps ?? []).map((g, $index) => (<Fragment key={$index}>
<div>
<div className="flex bg-surface-2 border-b border-solid border-b-border">
<div className="flex-none w-[190px] sticky left-[0] z-[2] bg-surface-2 p-[7px_14px] text-[12.5px] font-semibold border-r border-solid border-r-border box-border">
{g?.name}
</div>
<div className="p-[7px_12px] text-[12px] text-text-3 whitespace-nowrap">
{g?.sub}
</div>
</div>
{(g?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex border-b border-solid border-b-border">
<div className="flex-none w-[190px] sticky left-[0] z-[2] bg-surface p-[7px_14px] border-r border-solid border-r-border box-border flex flex-col justify-center">
<div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{r?.name}
</div>
<div className="text-[11.5px] text-text-3">
{r?.sub}
</div>
</div>
<div className="flex-none relative h-[40px] flex" style={{width:`${c?.trackW}px`}}>
{(c?.cells ?? []).map((x, $index) => (<Fragment key={$index}>
<div className="flex-none h-[40px] box-border border-l border-solid border-l-border" style={{width:`${c?.cw}px`,background:x?.bg}} />
</Fragment>))}
{(r?.bars ?? []).map((b, $index) => (<Fragment key={$index}>
<div onClick={b?.go} title={b?.tip} className="absolute top-[7px] h-[26px] box-border rounded-[6px] p-[0_7px] text-[11.5px] font-semibold flex items-center whitespace-nowrap overflow-hidden cursor-pointer" style={{left:`${b?.x}px`,width:`${b?.w}px`,background:b?.bg,border:b?.bd,color:b?.fg}}>
{b?.l}
</div>
</Fragment>))}
</div>
</div>
</Fragment>))}
</div>
</Fragment>))}
{c?.empty ? (<>
<div className="p-[48px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_employees_match_the_filters")}
</div>
</>) : null}
</div>
</div>
</div>
</>
    );
  }
}

export default function AdminLeaveCalendar(props: any) {
  const tr = useTranslations('AdminLeaveCalendar');
  return <AdminLeaveCalendarView {...props} tr={tr} />;
}
