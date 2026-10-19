'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminLeaveCalendar from './AdminLeaveCalendar';
import AdminLeaveBalances from './AdminLeaveBalances';
import AdminLeaveDrawer from './AdminLeaveDrawer';

const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const TY={annual:['Annual leave','var(--info-bg)','var(--info)'],rtt:['RTT','var(--violet-bg)','var(--violet)'],sick:['Sick leave','var(--orange-bg)','var(--orange)'],family:['Family event','var(--ok-bg)','var(--ok)'],unpaid:['Unpaid','var(--neutral-bg)','var(--neutral)']};
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const TABS=[['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['cancelled','Cancelled'],['all','All']];
const TODAY='2026-10-15',DAY=864e5,pms=s=>{const[y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fd=s=>{const d=new Date(pms(s));return d.getUTCDate()+' '+MN[d.getUTCMonth()];};
const R=(id,emp,role,site,type,from,to,days,bal,att,stageKey,stageSub,sub,status,o)=>Object.assign({id,emp,role,site,type,from,to,days,bal,att,stageKey,stageSub,sub,status,half:null,me:false,rej:''},o);
const ST={chg:['Changes requested'],site:['Awaiting site manager'],rec:['Recommended by site manager'],hr:['Awaiting HR approval'],done:['Approved'],no:['Rejected'],can:['Cancelled by employee']};
const DATA=[
 R('L-2041','Amélie Fontaine','Machinist','sd','annual','2026-10-26','2026-10-30',5,8,false,'rec','Marc Olivier · Oct 14','2026-10-13','pending',{me:true}),
 R('L-2042','Karim Benali','Forklift operator','rl','annual','2026-10-26','2026-10-28',3,4,false,'rec','Marc Olivier · Oct 14','2026-10-12','pending',{me:true}),
 R('L-2043','Léa Moreau','Cleaner','pd','sick','2026-10-14','2026-10-16',3,2,true,'hr','Medical certificate attached','2026-10-14','pending',{me:true}),
 R('L-2044','Thomas Girard','Technician','cf','rtt','2026-10-23','2026-10-23',1,6,false,'site','Julien Roche','2026-10-15','pending',{}),
 R('L-2045','Inès Haddad','Electrician','pv','family','2026-10-21','2026-10-21',0.5,3.5,true,'site','Sarah Benoît','2026-10-15','pending',{half:'AM'}),
 R('L-2046','Paul Lambert','Driver','sd','annual','2026-11-02','2026-11-13',10,-2,false,'rec','Marc Olivier · Oct 13','2026-10-10','pending',{me:true}),
 R('L-2047','Sofia Rossi','Loader','rl','annual','2026-10-27','2026-10-29',3,9,false,'hr','Recommended · Marc Olivier','2026-10-09','pending',{me:true}),
 R('L-2048','Hugo Petit','Welder','sd','unpaid','2026-11-09','2026-11-10',2,0,true,'site','Marc Olivier','2026-10-14','pending',{}),
 R('L-2049','Nora Diallo','Inspector','cf','annual','2026-10-22','2026-10-23',2,12,false,'rec','Julien Roche · Oct 12','2026-10-11','pending',{me:true}),
 R('L-2030','Elena Marchand','Cleaner','cf','rtt','2026-10-19','2026-10-19',1,5,false,'done','Approved by Claire Vasseur','2026-10-08','approved',{}),
 R('L-2031','Bastien Leroy','Driver','pv','annual','2026-10-19','2026-10-23',5,6,false,'done','Approved by Claire Vasseur','2026-10-05','approved',{}),
 R('L-2032','Amélie Fontaine','Machinist','sd','sick','2026-10-06','2026-10-07',2,3,true,'done','Approved by Marc Olivier','2026-10-06','approved',{}),
 R('L-2033','Georges Aubert','Cleaner','pd','annual','2026-12-21','2026-12-31',8,10,false,'done','Approved by Claire Vasseur','2026-10-02','approved',{}),
 R('L-2020','Camille Roux','Warehouse agent','rl','annual','2026-10-26','2026-10-30',5,2,false,'no','Insufficient balance','2026-10-07','rejected',{rej:'Not enough annual leave left; please split across two periods.'}),
 R('L-2021','Yanis Boucher','Machinist','sd','rtt','2026-10-16','2026-10-16',1,0,false,'no','Short notice · Marc Olivier','2026-10-15','rejected',{rej:'Two machinists are already off on the 16th.'}),
 R('L-2010','Mehdi Cherif','Technician','pd','annual','2026-10-20','2026-10-21',2,7,false,'can','Cancelled Oct 11','2026-10-04','cancelled',{}),
 R('L-2011','Monique Vidal','Cleaner','pv','family','2026-10-12','2026-10-12',1,2,false,'can','Cancelled Oct 9','2026-10-08','cancelled',{})];
const stageLabel=r=>r.status==='pending'?ST[r.stageKey][0]:r.status==='approved'?r.stageSub.split(' by ')[0]+' by '+(r.stageSub.split(' by ')[1]||''):r.status==='rejected'?'Rejected':'Cancelled by employee';
class AdminLeaveInboxBase extends DCLogic {
  state={view:'inbox',open:null,items:DATA,tab:'pending',br:'all',site:'all',type:'all',range:'all',emp:'all',me:false,sel:[],bulk:null,rejId:null,txt:'',toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  setStatus(ids,status,reason){const by='Claire Vasseur';this.setState(s=>({items:s.items.map(r=>ids.includes(r.id)?Object.assign({},r,{status,me:false,stageKey:status==='approved'?'done':'no',stageSub:status==='approved'?'Approved by '+by:'Rejected by '+by,rej:status==='rejected'?reason:r.rej}):r),sel:s.sel.filter(i=>!ids.includes(i)),bulk:null,rejId:null,txt:''}));}
  vis(){const s=this.state,end={all:null,'7':7,'30':30}[s.range],t0=pms(TODAY);
    return s.items.filter(r=>(s.tab==='all'||r.status===s.tab)&&(s.br==='all'||SN[r.site][1]===s.br)&&(s.site==='all'||r.site===s.site)&&(s.type==='all'||r.type===s.type)&&(s.emp==='all'||r.emp===s.emp)&&(!s.me||(r.me&&r.status==='pending'))&&(end==null||(pms(r.to)>=t0&&pms(r.from)<=t0+end*DAY)));}
  overlap(r,all){const f=pms(r.from),t=pms(r.to);return all.filter(o=>o.id!==r.id&&o.site===r.site&&(o.status==='pending'||o.status==='approved')&&pms(o.from)<=t&&pms(o.to)>=f);}
  renderVals(){return {lv:this.rv()};}
  rv(){
    const s=this.state,T=this,all=s.items,list=this.vis(),pend=all.filter(r=>r.status==='pending');
    const set=k=>ev=>this.setState({[k]:ev.target.value,sel:[],bulk:null});
    const sitesA=Object.keys(SN).filter(k=>s.br==='all'||SN[k][1]===s.br);
    const cnt=k=>k==='all'?all.length:all.filter(r=>r.status===k).length;
    const selP=list.filter(r=>r.status==='pending'),allOn=selP.length>0&&selP.every(r=>s.sel.includes(r.id));
    const txtNeed=s.txt.trim().length<3,ap=s.bulk==='approve';
    const selItems=all.filter(r=>s.sel.includes(r.id)),negN=selItems.filter(r=>r.bal<0).length;
    const rows=list.map(r=>{const t=TY[r.type],av=AV[(r.emp.charCodeAt(0)+r.emp.length)%AV.length],pend=r.status==='pending',on=s.sel.includes(r.id),ov=this.overlap(r,all);
      const dur=r.half?'½ day ('+r.half+')':r.days===1?'1 day':r.days+' days';
      const from=fd(r.from),to=fd(r.to),dates=r.from===r.to?from:from+' – '+to;
      const stC=r.status==='approved'?'var(--ok)':r.status==='rejected'?'var(--bad)':r.status==='cancelled'?'var(--text-3)':r.me?'var(--accent)':'var(--text)';
      return {id:r.id,name:r.emp,first:r.emp.split(' ')[0],site:SN[r.site][0]+' · '+r.role,ini:r.emp.split(' ').map(w=>w[0]).join('').slice(0,2),avBg:av[0],avFg:av[1],type:t[0],tBg:t[1],tFg:t[2],dates,dur,
        bal:pend?(r.bal>=0?r.bal+' d':'−'+Math.abs(r.bal)+' d'):'—',balC:pend&&r.bal<0?'var(--bad)':'var(--text-2)',balTip:pend?(r.bal<0?'Exceeds balance by '+Math.abs(r.bal)+' days':'Remaining after approval'):'',
        attOp:r.att?1:0,attTip:r.att?'Attachment':'',stage:r.status==='pending'?ST[r.stageKey][0]:r.status==='approved'?'Approved':r.status==='rejected'?'Rejected':'Cancelled',stageSub:r.stageSub,stgC:stC,subm:fd(r.sub),
        ovOp:ov.length&&pend?1:0,ovTip:ov.length&&pend?'Overlaps with '+ov.map(o=>o.emp.split(' ')[0]).join(', ')+' at '+SN[r.site][0]:'',
        bg:on?'var(--accent-soft)':'transparent',ckBg:on?'var(--accent)':'transparent',ckBd:on?'var(--accent)':'var(--border-strong)',ckOp:on?1:0,ckVis:pend?'visible':'hidden',canAct:pend&&s.rejId!==r.id,
        open:()=>this.setState({open:r.id}),
        toggle:ev=>{ev.stopPropagation();this.setState(x=>({sel:x.sel.includes(r.id)?x.sel.filter(i=>i!==r.id):x.sel.concat(r.id),bulk:null}));},
        approve:ev=>{ev.stopPropagation();this.setStatus([r.id],'approved');this.say(r.emp.split(' ')[0]+'’s leave approved'+(r.bal<0?' · balance goes negative':''));},
        reject:ev=>{ev.stopPropagation();this.setState({rejId:r.id,txt:'',bulk:null});},rejOpen:s.rejId===r.id,
        rejGo:()=>{if(txtNeed)return;this.setStatus([r.id],'rejected',s.txt.trim());this.say(r.emp.split(' ')[0]+'’s leave rejected');},rejNo:()=>this.setState({rejId:null,txt:''})};});
    return {
      drOpen:!!s.open&&!!all.find(x=>x.id===s.open),drReq:all.find(x=>x.id===s.open)||null,drAll:all,drClose:()=>this.setState({open:null}),
      drDecide:(id,kind,c,notify)=>{const by='Claire Vasseur',e={approve:['✓','var(--ok-bg)','var(--ok)','Approved','var(--ok)'],reject:['×','var(--bad-bg)','var(--bad)','Rejected','var(--bad)'],changes:['!','var(--orange-bg)','var(--orange)','Requested changes','var(--orange)'],cancel:['–','var(--neutral-bg)','var(--neutral)','Cancelled approved leave','var(--text-2)']}[kind];
        this.setState(st=>({items:st.items.map(q=>{if(q.id!==id)return q;const entry={ic:e[0],bg:e[1],fg:e[2],who:by,act:e[3],ac:e[4],role:'HR',t:'just now',c};const log=(q.log||[]).concat(entry);
          if(kind==='approve')return Object.assign({},q,{status:'approved',me:false,stageKey:'done',stageSub:'Approved by '+by,log});
          if(kind==='reject')return Object.assign({},q,{status:'rejected',me:false,stageKey:'no',stageSub:'Rejected by '+by,rej:c,log});
          if(kind==='cancel')return Object.assign({},q,{status:'cancelled',me:false,stageKey:'can',stageSub:'Cancelled by admin',log});
          return Object.assign({},q,{me:false,stageKey:'chg',stageSub:'Changes requested · Claire V.',log});}),sel:st.sel.filter(i=>i!==id)}));},
      views:[['inbox','Requests'],['cal','Calendar'],['bal','Balances']].map(([k,l])=>({l,bg:s.view===k?'var(--accent)':'var(--surface)',fg:s.view===k?'#fff':'var(--text-2)',go:()=>this.setState({view:k})})),isCal:s.view==='cal',isBal:s.view==='bal',inboxDisp:s.view==='inbox'?'flex':'none',calOpen:id=>this.setState({open:id}),
      people:[...new Map(all.map(q=>[q.emp,[q.emp,q.site,q.role]])).values()],
      sub:pend.length+' pending · '+pend.filter(r=>r.me).length+' waiting on you',
      tabs:TABS.map(([k,l])=>{const on=s.tab===k;return {l,n:cnt(k),bd:on?'var(--accent)':'transparent',fg:on?'var(--text)':'var(--text-2)',fw:on?600:500,nbg:on?(k==='pending'?'var(--warn-dot)':'var(--accent)'):(k==='pending'?'var(--warn-bg)':'var(--neutral-bg)'),nfg:on?'#fff':(k==='pending'?'var(--warn)':'var(--neutral)'),go:()=>this.setState({tab:k,sel:[],bulk:null,rejId:null})};}),
      filters:[{val:s.br,on:ev=>this.setState({br:ev.target.value,site:'all',sel:[]}),opts:[{v:'all',l:'All branches'}].concat(['Lyon','Paris Nord','Marseille'].map(b=>({v:b,l:b})))},{val:s.site,on:set('site'),opts:[{v:'all',l:'All sites'}].concat(sitesA.map(k=>({v:k,l:SN[k][0]})))},{val:s.type,on:set('type'),opts:[{v:'all',l:'All leave types'}].concat(Object.keys(TY).map(k=>({v:k,l:TY[k][0]})))},{val:s.range,on:set('range'),opts:[{v:'all',l:'Any dates'},{v:'7',l:'Next 7 days'},{v:'30',l:'Next 30 days'}]},{val:s.emp,on:set('emp'),opts:[{v:'all',l:'All employees'}].concat([...new Set(all.map(r=>r.emp))].sort().map(n=>({v:n,l:n})))}],
      meN:pend.filter(r=>r.me).length,meBg:s.me?'var(--accent)':'var(--surface)',meFg:s.me?'#fff':'var(--text-2)',meBd:s.me?'var(--accent)':'var(--border-strong)',togMe:()=>this.setState({me:!s.me,sel:[],tab:s.me?s.tab:'pending'}),
      hasFilter:s.br!=='all'||s.site!=='all'||s.type!=='all'||s.range!=='all'||s.emp!=='all'||s.me,clearF:()=>this.setState({br:'all',site:'all',type:'all',range:'all',emp:'all',me:false}),
      hasSel:s.sel.length>0,selLabel:s.sel.length+' selected',bulkIdle:!s.bulk,bulkOpen:!!s.bulk,negN,
      bulkApprove:()=>this.setState({bulk:'approve',txt:'',rejId:null}),bulkReject:()=>this.setState({bulk:'reject',txt:'',rejId:null}),bulkCancel:()=>this.setState({bulk:null,txt:''}),clearSel:()=>this.setState({sel:[],bulk:null}),
      txt:s.txt,onTxt:ev=>this.setState({txt:ev.target.value}),txtBd:'var(--border-strong)',rejOp:txtNeed?.45:1,
      bulkPh:ap?'Optional note to employees':'Reason for rejecting (required, shared with all)',bulkBtn:(ap?'Approve ':'Reject ')+s.sel.length,bulkBg:ap?'var(--ok-dot)':'var(--bad-dot)',bulkOp:!ap&&txtNeed?.45:1,
      bulkConfirm:()=>{if(!ap&&txtNeed)return;const n=s.sel.length;this.setStatus(s.sel,ap?'approved':'rejected',s.txt.trim());this.say(n+' request'+(n===1?'':'s')+(ap?' approved':' rejected'));},
      allVis:selP.length?'visible':'hidden',allBg:allOn?'var(--accent)':'transparent',allBd:allOn?'var(--accent)':'var(--border-strong)',allOp:allOn?1:0,selAll:()=>this.setState({sel:allOn?[]:selP.map(r=>r.id),bulk:null}),
      rows,empty:rows.length===0,emptyT:s.tab==='pending'&&!s.me&&!(s.br!=='all'||s.site!=='all'||s.type!=='all'||s.range!=='all'||s.emp!=='all')?'Inbox zero':'No requests found',emptyD:s.tab==='pending'?'Nothing is waiting for approval.':'Try another tab or clear the filters.',toast:s.toast
    };
  }
}

class AdminLeaveInboxView extends AdminLeaveInboxBase {
  view(S) {
    const tr = this.props.tr;
    const { lv } = S;
    return (
<>
<div className="flex flex-col gap-[14px] relative">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("leave_requests")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{lv?.sub}
</div>
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(lv?.views ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_16px] border-0 text-[13px] font-medium cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
</div>
{lv?.isCal ? (<>
<AdminLeaveCalendar items={lv?.drAll} people={lv?.people} onOpen={lv?.calOpen} />
</>) : null}
{lv?.isBal ? (<>
<AdminLeaveBalances items={lv?.drAll} />
</>) : null}
<div className="flex-col gap-[14px]" style={{display:lv?.inboxDisp}}>
<div className="flex gap-[2px] border-b border-solid border-b-border overflow-x-auto">
{(lv?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="flex items-center gap-[8px] h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer whitespace-nowrap" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
<span className="min-w-[20px] h-[20px] p-[0_6px] rounded-[10px] grid place-items-center [font:600_11px_'Geist_Mono',monospace]" style={{background:t?.nbg,color:t?.nfg}}>
{t?.n}
</span>
</button>
</Fragment>))}
</div>
<div className="flex gap-[8px] flex-wrap items-center">
{(lv?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] max-w-[180px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
<button onClick={lv?.togMe} className="h-[34px] p-[0_13px] rounded-[999px] text-[13px] font-medium cursor-pointer" style={{border:`1px solid ${lv?.meBd}`,background:lv?.meBg,color:lv?.meFg}}>
{tr("waiting_on_me_p0",{p0:lv?.meN ?? ''})}
</button>
{lv?.hasFilter ? (<>
<button onClick={lv?.clearF} className="h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("clear_filters")}
</button>
</>) : null}
</div>
{lv?.hasSel ? (<>
<div className="flex items-center gap-[10px] flex-wrap p-[10px_12px] rounded-[12px] bg-accent-soft border border-solid border-accent">
<span className="font-semibold text-[13.5px] text-accent">
{lv?.selLabel}
</span>
{lv?.bulkIdle ? (<>
<button onClick={lv?.bulkApprove} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-ok-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("approve")}
</button>
<button onClick={lv?.bulkReject} className="h-[32px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[13px] font-medium cursor-pointer">
{tr("reject")}
</button>
</>) : null}
{lv?.bulkOpen ? (<>
<input value={lv?.txt} onInput={lv?.onTxt} placeholder={lv?.bulkPh} className="flex-[1_1_240px] h-[32px] p-[0_10px] rounded-[8px] bg-surface text-text text-[13px] [outline:none]" style={{border:`1px solid ${lv?.txtBd}`}} />
<button onClick={lv?.bulkConfirm} className="h-[32px] p-[0_12px] rounded-[8px] border-0 text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{background:lv?.bulkBg,opacity:lv?.bulkOp}}>
{lv?.bulkBtn}
</button>
<button onClick={lv?.bulkCancel} className="h-[32px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</>) : null}
{lv?.negN ? (<>
<span className="text-[12.5px] text-warn">
{tr("p0_would_exceed_the_balance",{p0:lv?.negN ?? ''})}
</span>
</>) : null}
<button onClick={lv?.clearSel} className="ml-[auto] h-[32px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("clear_selection")}
</button>
</div>
</>) : null}
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[1280px]">
<div className="grid grid-cols-[28px_minmax(180px,1.3fr)_118px_minmax(130px,1fr)_92px_84px_26px_minmax(170px,1.2fr)_84px_26px_112px] gap-[12px] items-center p-[0_14px] h-[38px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div onClick={lv?.selAll} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center cursor-pointer text-[color:#fff]" style={{border:`1.5px solid ${lv?.allBd}`,background:lv?.allBg,visibility:lv?.allVis}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:lv?.allOp}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
<div>
{tr("employee")}
</div>
<div>
{tr("type")}
</div>
<div>
{tr("dates")}
</div>
<div>
{tr("duration")}
</div>
<div>
{tr("balance_after")}
</div>
<div />
<div>
{tr("approval_stage")}
</div>
<div>
{tr("submitted")}
</div>
<div />
<div />
</div>
{(lv?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="border-b border-solid border-b-border">
<div onClick={r?.open} className="grid grid-cols-[28px_minmax(180px,1.3fr)_118px_minmax(130px,1fr)_92px_84px_26px_minmax(170px,1.2fr)_84px_26px_112px] gap-[12px] items-center p-[10px_14px] text-[13px] cursor-pointer hover:bg-hover" style={{background:r?.bg}}>
<div onClick={r?.toggle} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${r?.ckBd}`,background:r?.ckBg,visibility:r?.ckVis}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:r?.ckOp}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
<div className="flex items-center gap-[10px] min-w-[0]">
<div className="w-[32px] h-[32px] rounded-[50%] flex-none grid place-items-center text-[12px] font-semibold" style={{background:r?.avBg,color:r?.avFg}}>
{r?.ini}
</div>
<div className="min-w-[0]">
<div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{r?.name}
</div>
<div className="text-[12px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{r?.site}
</div>
</div>
</div>
<div>
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:r?.tBg,color:r?.tFg}}>
{r?.type}
</span>
</div>
<div className="text-text-2">
{r?.dates}
</div>
<div className="text-text">
{r?.dur}
</div>
<div title={r?.balTip} className="[font:12.5px_'Geist_Mono',monospace]" style={{color:r?.balC}}>
{r?.bal}
</div>
<div title={r?.attTip} className="text-text-3 grid place-items-center" style={{opacity:r?.attOp}}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7-7l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.8 1.8 0 0 1-2.4-2.4l7.9-7.9" />
</svg>
</div>
<div className="flex flex-col gap-[2px]">
<span className="text-[12.5px] font-medium" style={{color:r?.stgC}}>
{r?.stage}
</span>
<span className="text-[12px] text-text-3">
{r?.stageSub}
</span>
</div>
<div className="text-text-3 text-[12.5px]">
{r?.subm}
</div>
<div title={r?.ovTip} className="grid place-items-center" style={{opacity:r?.ovOp}}>
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--warn-dot)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 3l10 18H2z" />
<path d="M12 10v5M12 18.2v.1" />
</svg>
</div>
<div className="flex gap-[6px] justify-end">
{r?.canAct ? (<>
<button onClick={r?.approve} title={tr("approve")} aria-label={tr("approve")} className="w-[34px] h-[30px] rounded-[8px] border-0 bg-ok-bg text-ok cursor-pointer grid place-items-center">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5 9-10" />
</svg>
</button>
<button onClick={r?.reject} title={tr("reject")} aria-label={tr("reject")} className="w-[34px] h-[30px] rounded-[8px] border-0 bg-bad-bg text-bad cursor-pointer grid place-items-center">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
<path d="M6 6l12 12M18 6L6 18" />
</svg>
</button>
</>) : null}
</div>
</div>
{r?.rejOpen ? (<>
<div className="flex gap-[8px] items-center flex-wrap p-[10px_14px_12px_54px] bg-surface-2">
<input value={lv?.txt} onInput={lv?.onTxt} placeholder={`Reason for rejecting (required, shared with ${r?.first})`} className="flex-[1_1_280px] h-[32px] p-[0_10px] rounded-[8px] bg-surface text-text text-[13px] [outline:none]" style={{border:`1px solid ${lv?.txtBd}`}} />
<button onClick={r?.rejGo} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:lv?.rejOp}}>
{tr("reject_request")}
</button>
<button onClick={r?.rejNo} className="h-[32px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</div>
</>) : null}
</div>
</Fragment>))}
{lv?.empty ? (<>
<div className="p-[56px_24px] text-center text-text-3 text-[13.5px]">
<div className="font-semibold text-text text-[15px] mb-[4px]">
{lv?.emptyT}
</div>
{lv?.emptyD}
</div>
</>) : null}
</div>
</div>
</div>
{lv?.drOpen ? (<>
<AdminLeaveDrawer req={lv?.drReq} all={lv?.drAll} onClose={lv?.drClose} onDecide={lv?.drDecide} />
</>) : null}
{lv?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{lv?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminLeaveInbox(props: any) {
  const tr = useTranslations('AdminLeaveInbox');
  return <AdminLeaveInboxView {...props} tr={tr} />;
}
