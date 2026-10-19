'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const GROUPS={'Saint-Denis day crew':['Amélie Fontaine','Paul Lambert','Hugo Petit'],'Lyon cleaning team':['Léa Moreau','Elena Marchand'],'Logistics loaders':['Karim Benali','Sofia Rossi'],'Technicians':['Thomas Girard','Inès Haddad','Nora Diallo']};
const pad=n=>String(n).padStart(2,'0'),fm=m=>pad(Math.floor(m/60))+':'+pad(m%60),tm=s=>{const a=s.split(':').map(Number);return a[0]*60+a[1];};
const pms=s=>{const[y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const DAY=864e5,TODAY='2026-10-15';
class AdminScheduleModalBase extends DCLogic {
  state={tab:'rec',tried:false,name:'',mode:'emp',group:'Saint-Denis day crew',emps:[],empQ:'',site:'sd',days:[0,1,2,3,4],s:'08:00',e:'16:00',cross:false,brk:'30',grace:'10',early:'5',start:TODAY,end:'2026-12-31',noEnd:true,rot:false,rotA:'2',rotB:'2',bS:'20:00',bE:'04:00',
    title:'',date:TODAY,desc:'',files:[],prio:'normal',notify:true};
  base(){return this.props.base||Date.UTC(2026,9,12);}
  occ(){
    const s=this.state,b=this.base(),out=[];
    if(s.tab==='int'){ if(!s.date) return out; const d=Math.round((pms(s.date)-b)/DAY),list=s.emps.length?s.emps:[null]; list.forEach(emp=>out.push({emp,d,s:tm(s.s),e:tm(s.e),date:s.date})); return out; }
    const who=s.mode==='group'?GROUPS[s.group]:s.emps; if(!who.length||!s.start||!s.days.length) return out;
    const st=pms(s.start),lim=st+27*DAY,en=s.noEnd?lim:Math.min(pms(s.end||s.start),lim),A=Math.max(1,+s.rotA||1),B=Math.max(1,+s.rotB||1);
    for(let t=st;t<=en;t+=DAY){const dow=(new Date(t).getUTCDay()+6)%7;if(!s.days.includes(dow))continue;
      const ph=Math.floor((t-st)/(7*DAY))%(A+B),isB=s.rot&&ph>=A,ts=isB?tm(s.bS):tm(s.s),te=isB?tm(s.bE):tm(s.e);
      who.forEach(emp=>out.push({emp,d:Math.round((t-b)/DAY),s:ts,e:te,cross:s.cross||te<=ts,date:new Date(t).toISOString().slice(0,10)}));}
    return out;
  }
  check(){
    const p=this.props,s=this.state,occ=this.occ(),leave=p.leave||{},hol=p.hol||{},ex=p.shifts||[],items=[];let conflicts=0;
    const dl=o=>new Date(pms(o.date)).toISOString().slice(5,10).split('-').reverse().join('/');
    occ.forEach(o=>{ if(!o.emp) return; const end=o.cross?1440+Math.min(o.e,o.s):o.e, nm=o.emp.split(' ')[0];
      if((leave[o.emp]||[]).includes(o.d)){conflicts++;items.push({t:nm+' is on approved leave on '+dl(o)+'.',dot:'var(--bad-dot)'});}
      const clash=ex.find(x=>x.emp===o.emp&&x.d===o.d&&o.s<x.e&&x.s<end);
      if(clash){conflicts++;items.push({t:nm+' is already booked '+fm(clash.s)+'–'+fm(clash.e)+' on '+dl(o)+'.',dot:'var(--bad-dot)'});}
      else if(hol[o.d]) items.push({t:dl(o)+' is a public holiday ('+hol[o.d]+').',dot:'var(--warn-dot)'}); });
    if(s.tab==='int'&&occ.length&&!occ[0].emp) items.push({t:'No employee assigned. It will appear in the unassigned list.',dot:'var(--warn-dot)'});
    return {n:occ.length,conflicts,items};
  }
  err(){
    const s=this.state,e={};
    if(s.tab==='rec'){ if(!s.name.trim()) e.name='Give the schedule a name'; if(s.mode==='emp'&&!s.emps.length) e.who='Choose at least one employee'; if(!s.days.length) e.days='Select at least one day';
      if(!s.cross&&tm(s.e)<=tm(s.s)) e.time='End must be after start, or turn on “Crosses midnight”'; if(s.cross&&tm(s.e)===tm(s.s)) e.time='Start and end cannot be identical';
      if(!s.start) e.start=1,e.dates='Start date is required'; else if(!s.noEnd&&(!s.end||pms(s.end)<pms(s.start))) e.end=1,e.dates='End date must be on or after the start date';
      if(s.rot&&tm(s.bE)===tm(s.bS)) e.time=(e.time?e.time+' · ':'')+'Phase B start and end cannot be identical'; }
    else{ if(!s.title.trim()) e.title='Title is required'; if(!s.date) e.date=1,e.dateM='Date is required'; if(tm(s.e)<=tm(s.s)) e.time='End must be after start'; }
    return e;
  }
  submit(mode){
    const s=this.state,e=this.err(); if(Object.keys(e).length){this.setState({tried:true});return;}
    const occ=this.occ(),p=this.props,title=s.tab==='int'?s.title.trim():s.name.trim();
    const shifts=occ.map(o=>({d:o.d,emp:o.emp,site:s.site,s:o.s,e:o.cross?1439:o.e,type:s.tab==='int'?'int':'rec',title:s.tab==='int'?title:''}));
    p.onSave&&p.onSave(shifts,mode,{notify:s.tab==='int'&&s.notify&&mode==='publish',name:title});
  }
  renderVals(){return {m:this.rv()};}
  rv(){
    const s=this.state,p=this.props,T=this,e=s.tried?this.err():{},rec=s.tab==='rec';
    const bd=k=>e[k]?'var(--bad-dot)':'var(--border-strong)';
    const set=k=>ev=>this.setState({[k]:ev.target.value});
    const tg=k=>()=>this.setState(x=>({[k]:!x[k]}));
    const sw=on=>({bg:on?'var(--accent)':'var(--border-strong)',l:on?'19px':'2px'});
    const people=(p.people||[]).filter(x=>x[0].toLowerCase().includes(s.empQ.toLowerCase())).map(x=>{const on=s.emps.includes(x[0]);return {n:x[0],role:x[1],bg:on?'var(--accent)':'transparent',bd:on?'var(--accent)':'var(--border-strong)',op:on?1:0,go:()=>this.setState(st=>({emps:on?st.emps.filter(i=>i!==x[0]):st.emps.concat(x[0])}))};});
    const cc=this.check(),nOcc=cc.n,bad=cc.conflicts>0,warn=cc.items.length>0;
    const A=Math.max(1,+s.rotA||1),B=Math.max(1,+s.rotB||1),cyc=[];for(let i=0;i<A+B&&i<10;i++){const b=i>=A;cyc.push({l:'Wk '+(i+1)+' · '+(b?'B '+s.bS+'–'+s.bE:'A '+s.s+'–'+s.e),bg:b?'var(--violet-bg)':'var(--accent-soft)',fg:b?'var(--violet)':'var(--accent)'});}
    const csw=sw(s.cross),nsw=sw(s.noEnd),rsw=sw(s.rot),ntw=sw(s.notify);
    const who=rec?(s.mode==='group'?(GROUPS[s.group]||[]).length+' employees':s.emps.length+' employee'+(s.emps.length===1?'':'s')):'';
    return {
      tabs:[['rec','Recurring schedule'],['int','One-off intervention']].map(([k,l])=>({l,bd:s.tab===k?'var(--accent)':'transparent',fg:s.tab===k?'var(--text)':'var(--text-2)',fw:s.tab===k?600:500,go:()=>this.setState({tab:k,tried:false})})),
      isRec:rec,isInt:!rec,close:()=>p.onClose&&p.onClose(),hasErr:Object.keys(e).length>0,e:{name:e.name||'',who:e.who||'',days:e.days||'',time:e.time||'',dates:e.dates||'',title:e.title||'',date:e.dateM||''},
      bd:{name:bd('name'),who:bd('who'),time:bd('time'),start:bd('start'),end:bd('end'),title:bd('title'),date:bd('date')},
      name:s.name,onName:set('name'),modes:[['emp','Employees'],['group','Group']].map(([k,l])=>({l,bg:s.mode===k?'var(--accent)':'var(--surface)',fg:s.mode===k?'#fff':'var(--text-2)',go:()=>this.setState({mode:k})})),byGroup:s.mode==='group',byEmp:s.mode==='emp',
      group:s.group,onGroup:set('group'),groupOpts:Object.keys(GROUPS).map(g=>({v:g,l:g+' · '+GROUPS[g].length})),empQ:s.empQ,onEmpQ:set('empQ'),empN:s.emps.length,people,
      site:s.site,onSite:set('site'),siteOpts:Object.keys(p.sites||{}).map(k=>({v:k,l:p.sites[k][0]})),
      dayChips:DN.map((l,i)=>{const on=s.days.includes(i);return {l,bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:()=>this.setState(x=>({days:on?x.days.filter(d=>d!==i):x.days.concat(i).sort()}))};}),
      s:s.s,e1:s.e,onS:set('s'),onE:set('e'),brk:s.brk,onBrk:set('brk'),grace:s.grace,onGrace:set('grace'),early:s.early,onEarly:set('early'),
      crossH:s.cross?'Shift ends the next day (e.g. 22:00 → 06:00).':'Shift ends the same day.',togCross:tg('cross'),crossBg:csw.bg,crossL:csw.l,
      start:s.start,onStart:set('start'),end:s.end,onEnd:set('end'),noEnd:s.noEnd,endBg:s.noEnd?'var(--surface-2)':'var(--surface)',togNoEnd:tg('noEnd'),noEndBg:nsw.bg,noEndL:nsw.l,
      rot:s.rot,rotH:s.rot?'Alternates between two time windows each cycle, e.g. 2 weeks day, 2 weeks night.':'Off — the same hours every week.',togRot:tg('rot'),rotBg:rsw.bg,rotL:rsw.l,rotA:s.rotA,rotB:s.rotB,bS:s.bS,bE:s.bE,onRotA:set('rotA'),onRotB:set('rotB'),onBS:set('bS'),onBE:set('bE'),cycle:cyc,
      title:s.title,onTitle:set('title'),date:s.date,onDate:set('date'),prios:[['low','Low'],['normal','Normal'],['high','High'],['urgent','Urgent']].map(([k,l])=>({l,bg:s.prio===k?(k==='urgent'?'var(--bad-dot)':k==='high'?'var(--warn-dot)':'var(--accent)'):'var(--surface)',fg:s.prio===k?'#fff':'var(--text-2)',go:()=>this.setState({prio:k})})),
      desc:s.desc,onDesc:set('desc'),files:s.files.map(n=>({n,del:()=>this.setState(x=>({files:x.files.filter(f=>f!==n)}))})),onFiles:ev=>{const fl=[].slice.call(ev.target.files||[]).map(f=>f.name);this.setState(x=>({files:x.files.concat(fl.filter(n=>!x.files.includes(n)))}));},
      notify:s.notify,notifyH:s.notify?'Assigned employees get a push and SMS when you publish.':'Assigned employees won’t be messaged.',togNotify:tg('notify'),notifyBg:ntw.bg,notifyL:ntw.l,
      cc:{bd:bad?'var(--bad-dot)':warn?'var(--warn-dot)':'var(--ok-dot)',bg:bad?'var(--bad-bg)':warn?'var(--warn-bg)':'var(--ok-bg)',fg:bad?'var(--bad)':warn?'var(--warn)':'var(--ok)',
        head:nOcc?(rec?nOcc+' shifts over the next '+(s.noEnd?'4 weeks':'period')+' · ':nOcc+' assignment'+(nOcc===1?'':'s')+' · ')+(bad?cc.conflicts+' conflict'+(cc.conflicts===1?'':'s'):warn?'no conflicts, '+cc.items.length+' note'+(cc.items.length===1?'':'s'):'no conflicts'):(rec?'Choose employees, days and dates to check conflicts.':'Set a date to check conflicts.'),
        items:cc.items.slice(0,5),more:cc.items.length>5,moreN:cc.items.length-5},
      foot:rec?'Applies to '+who+(nOcc?'':''):'Priority: '+s.prio,
      draft:()=>this.submit('draft'),publish:()=>this.submit('publish'),pubL:bad?'Publish anyway':'Publish'
    };
  }
}

class AdminScheduleModalView extends AdminScheduleModalBase {
  view(S) {
    const tr = this.props.tr;
    const { m } = S;
    return (
<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[720px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_22px_0] flex flex-col gap-[12px] border-b border-solid border-b-border">
<div className="flex justify-between items-center">
<div className="font-semibold text-[17px]">
{tr("create_schedule")}
</div>
<button onClick={m?.close} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="flex gap-[2px]">
{(m?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="h-[38px] p-[0_16px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
</button>
</Fragment>))}
</div>
</div>
<div className="p-[20px_22px] overflow-y-auto flex flex-col gap-[16px]">
{m?.hasErr ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-bad-bg text-bad text-[13px] font-medium">
{tr("fix_the_highlighted_fields_to")}
</div>
</>) : null}
{m?.isRec ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("schedule_name")}
<input value={m?.name} onInput={m?.onName} placeholder={tr("e_g_saint_denis_day")} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${m?.bd?.name}`}} />
<span className="text-[12px] text-bad font-normal">
{m?.e?.name}
</span>
</label>
<div className="flex flex-col gap-[8px]">
<div className="flex items-center gap-[12px] flex-wrap">
<div className="text-[12.5px] font-medium text-text-2">
{tr("assign_to")}
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(m?.modes ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="h-[30px] p-[0_12px] border-0 text-[12.5px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
</div>
{m?.byGroup ? (<>
<select value={m?.group} onChange={m?.onGroup} className="h-[36px] p-[0_9px] rounded-[9px] bg-surface text-text text-[13.5px]" style={{border:`1px solid ${m?.bd?.who}`}}>
{(m?.groupOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
{m?.byEmp ? (<>
<div className="rounded-[10px] overflow-hidden" style={{border:`1px solid ${m?.bd?.who}`}}>
<input value={m?.empQ} onInput={m?.onEmpQ} placeholder={`Search employees · ${m?.empN} selected`} className="w-[100%] box-border h-[34px] p-[0_11px] border-0 border-b border-solid border-b-border bg-surface-2 text-text text-[13px] [outline:none]" />
<div className="max-h-[130px] overflow-y-auto">
{(m?.people ?? []).map((p, $index) => (<Fragment key={$index}>
<div onClick={p?.go} className="flex items-center gap-[10px] p-[7px_11px] cursor-pointer text-[13px] hover:bg-hover">
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${p?.bd}`,background:p?.bg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:p?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
{p?.n}
<span className="ml-[auto] text-[12px] text-text-3">
{p?.role}
</span>
</div>
</Fragment>))}
</div>
</div>
</>) : null}
<span className="text-[12px] text-bad">
{m?.e?.who}
</span>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("site")}
<select value={m?.site} onChange={m?.onSite} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(m?.siteOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("days_of_week")}
</div>
<div className="flex gap-[6px] flex-wrap">
{(m?.dayChips ?? []).map((d, $index) => (<Fragment key={$index}>
<button onClick={d?.go} className="w-[46px] h-[34px] rounded-[9px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${d?.bd}`,background:d?.bg,color:d?.fg}}>
{d?.l}
</button>
</Fragment>))}
</div>
<span className="text-[12px] text-bad">
{m?.e?.days}
</span>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("start")}
<input type="time" value={m?.s} onInput={m?.onS} className="h-[36px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("end")}
<input type="time" value={m?.e1} onInput={m?.onE} className="h-[36px] p-[0_8px] rounded-[9px] bg-surface text-text" style={{border:`1px solid ${m?.bd?.time}`}} />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("break_min")}
<input type="number" min="0" step="5" value={m?.brk} onInput={m?.onBrk} className="h-[36px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font-family:'Geist_Mono',monospace]" />
</label>
</div>
<span className="text-[12px] text-bad mt-[-8px]">
{m?.e?.time}
</span>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{tr("crosses_midnight")}
</div>
<div className="text-[12.5px] text-text-3">
{m?.crossH}
</div>
</div>
<div onClick={m?.togCross} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:m?.crossBg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:m?.crossL}} />
</div>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("grace_period_for_lateness_min")}
<input type="number" min="0" value={m?.grace} onInput={m?.onGrace} className="h-[36px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font-family:'Geist_Mono',monospace]" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("early_leave_tolerance_min")}
<input type="number" min="0" value={m?.early} onInput={m?.onEarly} className="h-[36px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font-family:'Geist_Mono',monospace]" />
</label>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[12px] items-end">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("start_date")}
<input type="date" value={m?.start} onInput={m?.onStart} className="h-[36px] p-[0_8px] rounded-[9px] bg-surface text-text" style={{border:`1px solid ${m?.bd?.start}`}} />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("end_date")}
<input type="date" value={m?.end} onInput={m?.onEnd} disabled={m?.noEnd} className="h-[36px] p-[0_8px] rounded-[9px] text-text" style={{border:`1px solid ${m?.bd?.end}`,background:m?.endBg}} />
</label>
</div>
<div className="flex items-center justify-between gap-[12px] mt-[-6px]">
<div className="text-[13.5px] font-medium">
{tr("no_end_date")}
</div>
<div onClick={m?.togNoEnd} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:m?.noEndBg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:m?.noEndL}} />
</div>
</div>
<span className="text-[12px] text-bad mt-[-8px]">
{m?.e?.dates}
</span>
<div className="border border-solid border-border rounded-[12px] p-[14px] flex flex-col gap-[12px] bg-surface-2">
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{tr("rotation_pattern")}
</div>
<div className="text-[12.5px] text-text-3">
{m?.rotH}
</div>
</div>
<div onClick={m?.togRot} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:m?.rotBg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:m?.rotL}} />
</div>
</div>
{m?.rot ? (<>
<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("phase_a_weeks_above_times")}
<input type="number" min="1" max="8" value={m?.rotA} onInput={m?.onRotA} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font-family:'Geist_Mono',monospace]" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("phase_b_weeks")}
<input type="number" min="1" max="8" value={m?.rotB} onInput={m?.onRotB} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font-family:'Geist_Mono',monospace]" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("phase_b_start")}
<input type="time" value={m?.bS} onInput={m?.onBS} className="h-[34px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("phase_b_end")}
<input type="time" value={m?.bE} onInput={m?.onBE} className="h-[34px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
</div>
<div className="flex gap-[4px] flex-wrap">
{(m?.cycle ?? []).map((c, $index) => (<Fragment key={$index}>
<span className="p-[3px_9px] rounded-[6px] text-[12px] font-medium" style={{background:c?.bg,color:c?.fg}}>
{c?.l}
</span>
</Fragment>))}
</div>
</>) : null}
</div>
</>) : null}
{m?.isInt ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("title")}
<input value={m?.title} onInput={m?.onTitle} placeholder={tr("e_g_boiler_inspection")} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${m?.bd?.title}`}} />
<span className="text-[12px] text-bad font-normal">
{m?.e?.title}
</span>
</label>
<div className="grid grid-cols-[1.4fr_1fr] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("site")}
<select value={m?.site} onChange={m?.onSite} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(m?.siteOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("priority")}
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(m?.prios ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="flex-1 h-[34px] border-0 text-[12.5px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
</div>
</div>
<div className="grid grid-cols-[1.3fr_1fr_1fr] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("date")}
<input type="date" value={m?.date} onInput={m?.onDate} className="h-[36px] p-[0_8px] rounded-[9px] bg-surface text-text" style={{border:`1px solid ${m?.bd?.date}`}} />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("start")}
<input type="time" value={m?.s} onInput={m?.onS} className="h-[36px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("end")}
<input type="time" value={m?.e1} onInput={m?.onE} className="h-[36px] p-[0_8px] rounded-[9px] bg-surface text-text" style={{border:`1px solid ${m?.bd?.time}`}} />
</label>
</div>
<span className="text-[12px] text-bad mt-[-8px]">
{m?.e?.time}{m?.e?.date}
</span>
<div className="flex flex-col gap-[8px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("assigned_employees")}{" "}
<span className="font-normal text-text-3">
{tr("leave_empty_to_keep_it")}
</span>
</div>
<div className="border border-solid border-border-strong rounded-[10px] overflow-hidden">
<input value={m?.empQ} onInput={m?.onEmpQ} placeholder={`Search employees · ${m?.empN} selected`} className="w-[100%] box-border h-[34px] p-[0_11px] border-0 border-b border-solid border-b-border bg-surface-2 text-text text-[13px] [outline:none]" />
<div className="max-h-[120px] overflow-y-auto">
{(m?.people ?? []).map((p, $index) => (<Fragment key={$index}>
<div onClick={p?.go} className="flex items-center gap-[10px] p-[7px_11px] cursor-pointer text-[13px] hover:bg-hover">
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${p?.bd}`,background:p?.bg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:p?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
{p?.n}
<span className="ml-[auto] text-[12px] text-text-3">
{p?.role}
</span>
</div>
</Fragment>))}
</div>
</div>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("description_instructions")}
<textarea rows="3" value={m?.desc} onInput={m?.onDesc} placeholder={tr("what_needs_to_be_done")} className="resize-y p-[9px_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]" />
</label>
<div className="flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("attachments")}
</div>
<div className="flex gap-[8px] flex-wrap items-center">
<label className="h-[32px] p-[0_12px] rounded-[9px] border border-dashed border-border-strong bg-surface-2 text-text text-[13px] cursor-pointer flex items-center">
<input type="file" multiple onChange={m?.onFiles} className="hidden" />
{tr("attach_files")}
</label>
{(m?.files ?? []).map((f, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[6px] p-[4px_6px_4px_10px] rounded-[999px] bg-neutral-bg text-neutral text-[12.5px]">
{f?.n}
<button onClick={f?.del} aria-label={tr("remove_file")} className="w-[18px] h-[18px] border-0 rounded-[50%] bg-transparent text-neutral cursor-pointer text-[14px] leading-[1]">
{"×"}
</button>
</span>
</Fragment>))}
</div>
</div>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{tr("notify_employees")}
</div>
<div className="text-[12.5px] text-text-3">
{m?.notifyH}
</div>
</div>
<div onClick={m?.togNotify} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:m?.notifyBg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:m?.notifyL}} />
</div>
</div>
</>) : null}
<div className="rounded-[12px] p-[14px_16px] flex flex-col gap-[8px]" style={{border:`1px solid ${m?.cc?.bd}`,background:m?.cc?.bg}}>
<div className="flex items-center gap-[10px] flex-wrap">
<div className="font-semibold text-[14px]" style={{color:m?.cc?.fg}}>
{tr("conflict_check")}
</div>
<span className="text-[13px]" style={{color:m?.cc?.fg}}>
{m?.cc?.head}
</span>
</div>
{(m?.cc?.items ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="flex gap-[8px] text-[12.5px] text-text">
<span className="w-[7px] h-[7px] rounded-[50%] mt-[6px] flex-none" style={{background:c?.dot}} />
{c?.t}
</div>
</Fragment>))}
{m?.cc?.more ? (<>
<div className="text-[12.5px] text-text-3">
{tr("p0_more",{p0:m?.cc?.moreN ?? ''})}
</div>
</>) : null}
</div>
</div>
<div className="p-[12px_22px] border-t border-solid border-t-border flex gap-[8px] items-center flex-wrap">
<div className="text-[12.5px] text-text-3 flex-[1_1_160px]">
{m?.foot}
</div>
<button onClick={m?.close} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={m?.draft} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("save_as_draft")}
</button>
<button onClick={m?.publish} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{m?.pubL}
</button>
</div>
</div>
</div>
</>
    );
  }
}

export default function AdminScheduleModal(props: any) {
  const tr = useTranslations('AdminScheduleModal');
  return <AdminScheduleModalView {...props} tr={tr} />;
}
