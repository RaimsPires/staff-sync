'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const ACT={rec:['Record edited','info'],proxy:['Proxy check-in','violet'],flag:['Flag approved','ok'],flagr:['Flag rejected','bad'],lvok:['Leave approved','ok'],lvno:['Leave rejected','bad'],role:['Role changed','orange'],set:['Settings changed','warn'],deact:['Employee deactivated','bad'],emp:['Employee updated','info'],site:['Site updated','info'],login:['Sign-in','neutral'],sched:['Schedule published','violet'],exp:['Report exported','neutral']};
const TT={rec:'Attendance record',emp:'Employee',lv:'Leave request',role:'Role',set:'Setting',site:'Site',user:'User',sched:'Schedule',rep:'Report',flag:'Fraud flag'};
const AC={cv:['Claire Vasseur','Company admin','92.184.61.14','Chrome · macOS'],mo:['Marc Olivier','Branch manager','86.241.9.203','Safari · iPhone'],nk:['Nadia Koné','Branch manager','90.12.75.118','Chrome · Windows'],jr:['Julien Roche','Company admin','88.164.30.71','Edge · Windows'],sb:['Sarah Benoît','Site manager','82.65.140.9','Chrome · Android'],hm:['Hugo Martel','Site manager','78.192.4.55','Firefox · Linux'],lp:['Lucie Perrin','Payroll officer','92.184.61.40','Chrome · Windows']};
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const E=(day,time,a,act,ttype,target,site,reason,diff)=>({day,time,a,act,ttype,target,site,reason:reason||'',diff:diff||[]});
const L=[
 E(0,'09:41','jr','rec','rec','Amélie Fontaine · 15 Oct','sd','Employee forgot to check out; confirmed by site manager.',[['Check-out','—','16:04'],['Status','Missing check-out','Present']]),
 E(0,'09:12','mo','proxy','rec','Karim Benali · 15 Oct','rl','Phone battery dead on arrival.',[['Check-in','—','07:52 (proxy)']]),
 E(0,'08:30','cv','role','role','Payroll officer','','Added export permission for monthly payroll.',[['Export','No','Yes'],['Scope','Selected branches','Whole company']]),
 E(0,'08:05','nk','flag','flag','Outside geofence · Léa Moreau','pd','Employee was at a supplier delivery next door.',[['Status','Open','Approved'],['Distance','420 m','420 m (accepted)']]),
 E(1,'17:48','sb','lvok','lv','L-2045 · Inès Haddad','pv','',[['Status','Pending','Approved']]),
 E(1,'16:20','cv','set','set','Default geofence radius','','Align with updated insurance requirements.',[['Radius','150 m','200 m']]),
 E(1,'14:02','jr','deact','emp','Damien Lopez','pd','Contract ended on 30 Sept.',[['Status','Active','Deactivated'],['Device binding','iPhone 12','Reset']]),
 E(1,'11:37','hm','rec','rec','Thomas Girard · 14 Oct','cf','Corrected start time after clock sync issue.',[['Check-in','07:20','07:41'],['Flag','Time tampering','None']]),
 E(2,'18:15','mo','sched','sched','Week 43 · Saint-Denis Hub','sd','',[['Shifts','41','44']]),
 E(2,'15:09','cv','flagr','flag','Mock location · Chloé Garnier','cf','Device audit confirmed location spoofing.',[['Status','Open','Rejected'],['Outcome','—','Marked absent']]),
 E(2,'10:44','nk','lvno','lv','L-2021 · Yanis Boucher','sd','Two machinists already off that day.',[['Status','Pending','Rejected']]),
 E(3,'09:02','cv','site','site','Roissy Logistics','rl','',[['Selfie required','No','Yes'],['Min GPS accuracy','100 m','50 m']]),
 E(3,'08:45','lp','exp','rep','Monthly timesheets – all sites','','',[]),
 E(4,'17:03','jr','role','role','Site manager','','Remove ability to approve leave.',[['Leave approval','Approve','—']]),
 E(4,'13:26','mo','emp','emp','Paul Lambert','sd','Moved to a different primary site.',[['Default site','Saint-Denis Hub','Roissy Logistics']]),
 E(4,'09:10','sb','proxy','rec','Monique Vidal · 11 Oct','pv','No smartphone — badge QR scanned at entrance.',[['Check-in','—','06:58 (proxy)']]),
 E(5,'16:55','cv','set','set','Lateness grace period','','Union agreement update.',[['Grace period','5 min','10 min']]),
 E(5,'08:21','hm','login','user','Hugo Martel','','',[]),
 E(6,'11:12','nk','flag','flag','Low GPS accuracy · Nora Diallo','cf','Underground car park, accuracy expected.',[['Status','Open','Approved']]),
 E(7,'10:30','jr','deact','emp','Chloé Garnier','cf','Terminated after mock location confirmation.',[['Status','Active','Deactivated']]),
 E(8,'15:40','cv','rec','rec','Elena Marchand · 8 Oct','cf','Duplicate check-in removed.',[['Records','2','1']]),
 E(9,'09:05','mo','lvok','lv','L-2032 · Amélie Fontaine','sd','',[['Status','Pending','Approved']]),
 E(10,'14:18','cv','role','role','Read-only viewer','','',[['Reports','No','View']]),
 E(12,'12:00','jr','emp','emp','Sofia Rossi','rl','Phone number changed.',[['Phone','06 55 41 09 26','06 55 41 22 80']]),
 E(14,'08:58','nk','proxy','rec','Georges Aubert · 1 Oct','pd','Badge scan.',[['Check-in','—','07:03 (proxy)']]),
 E(18,'16:34','cv','set','set','Company timezone','','',[['Timezone','Europe/London','Europe/Paris']]),
 E(21,'10:10','jr','site','site','Part-Dieu Tower','pd','',[['Geofence radius','120 m','150 m']]),
 E(26,'09:25','cv','role','role','Branch manager','','New default permissions.',[['Fraud alerts','View','View, Approve']])];
const TODAY=Date.UTC(2026,9,15),DAYMS=864e5,MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const mk=(e,i)=>{const t=TODAY-e.day*DAYMS,d=new Date(t),ac=AC[e.a];return Object.assign({},e,{id:'AL-'+(48210-i),ts:t,dateIso:d.toISOString().slice(0,10),dayL:e.day===0?'Today':e.day===1?'Yesterday':WD[d.getUTCDay()]+' '+d.getUTCDate()+' '+MN[d.getUTCMonth()],full:WD[d.getUTCDay()]+' '+d.getUTCDate()+' '+MN[d.getUTCMonth()]+' 2026, '+e.time,sess:'S-'+(7000+i*37),actor:ac[0],arole:ac[1],ip:ac[2],dev:ac[3]});};
const ALL=L.map(mk);
const RANGES={all:'Any time','0':'Today','7':'Last 7 days','30':'Last 30 days',custom:'Custom range'};
const PAGE=12;
class AdminAuditLogBase extends DCLogic {
  state={q:'',range:'30',from:'',to:'',actor:'all',action:'all',ttype:'all',br:'all',site:'all',open:null,shown:PAGE,expOpen:false,toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  vis(){const s=this.state,q=s.q.trim().toLowerCase();
    return ALL.filter(e=>{
      if(s.range==='custom'){if(s.from&&e.dateIso<s.from)return false;if(s.to&&e.dateIso>s.to)return false;}
      else if(s.range!=='all'&&e.day>+s.range)return false;
      if(s.actor!=='all'&&e.a!==s.actor)return false;if(s.action!=='all'&&e.act!==s.action)return false;if(s.ttype!=='all'&&e.ttype!==s.ttype)return false;
      if(s.br!=='all'&&!(e.site&&SN[e.site][1]===s.br))return false;if(s.site!=='all'&&e.site!==s.site)return false;
      return!q||e.target.toLowerCase().includes(q)||e.reason.toLowerCase().includes(q)||e.actor.toLowerCase().includes(q);});}
  csv(list){const row=e=>[e.full,e.actor,e.arole,ACT[e.act][0],TT[e.ttype],e.target,e.site?SN[e.site][0]:'Company',e.ip,e.dev,e.reason,e.diff.map(d=>d[0]+': '+d[1]+' → '+d[2]).join('; ')];
    return[['Timestamp','Actor','Role','Action','Target type','Target','Scope','IP','Device','Reason','Changes']].concat(list.map(row)).map(l=>l.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');}
  renderVals(){return{a:this.rv()};}
  rv(){
    const s=this.state,list=this.vis(),set=k=>ev=>this.setState({[k]:ev.target.value,open:null,shown:PAGE});
    const sitesA=Object.keys(SN).filter(k=>s.br==='all'||SN[k][1]===s.br);
    const badTo=s.range==='custom'&&s.from&&s.to&&s.to<s.from;
    const rows=list.slice(0,s.shown).map(e=>{const a=ACT[e.act],av=AV[(e.actor.charCodeAt(0)+e.actor.length)%AV.length],open=s.open===e.id;
      return{id:e.id,day:e.dayL,time:e.time,actor:e.actor,role:e.arole,ini:e.actor.split(' ').map(w=>w[0]).join('').slice(0,2),avBg:av[0],avFg:av[1],action:a[0],aBg:'var(--'+a[1]+'-bg)',aFg:'var(--'+a[1]+')',target:e.target,ttype:TT[e.ttype],scope:e.site?SN[e.site][0]:'Company',ip:e.ip,dev:e.dev,
        bg:open?'var(--accent-soft)':'transparent',rot:open?'90deg':'0deg',open,toggle:()=>this.setState({open:open?null:e.id}),openTarget:ev=>{ev.preventDefault();ev.stopPropagation();this.say('Opening '+e.target);},
        hasReason:!!e.reason,reason:e.reason,hasDiff:e.diff.length>0,diff:e.diff.map((d,i)=>({f:d[0],b:d[1],a:d[2],bt:i?'1px solid var(--border)':'0'})),noDetail:!e.reason&&!e.diff.length,sess:e.sess,full:e.full};});
    const hasFilter=s.range!=='30'||s.actor!=='all'||s.action!=='all'||s.ttype!=='all'||s.br!=='all'||s.site!=='all'||!!s.q;
    return{
      q:s.q,onQ:set('q'),closePop:()=>{if(s.expOpen)this.setState({expOpen:false});},stop:ev=>ev.stopPropagation(),
      filters:[{val:s.range,on:set('range'),opts:Object.keys(RANGES).map(k=>({v:k,l:RANGES[k]}))},{val:s.actor,on:set('actor'),opts:[{v:'all',l:'All users'}].concat(Object.keys(AC).map(k=>({v:k,l:AC[k][0]})))},{val:s.action,on:set('action'),opts:[{v:'all',l:'All actions'}].concat(Object.keys(ACT).map(k=>({v:k,l:ACT[k][0]})))},{val:s.ttype,on:set('ttype'),opts:[{v:'all',l:'All target types'}].concat(Object.keys(TT).map(k=>({v:k,l:TT[k]})))},{val:s.br,on:ev=>this.setState({br:ev.target.value,site:'all',open:null,shown:PAGE}),opts:[{v:'all',l:'All branches'}].concat(['Lyon','Paris Nord','Marseille'].map(b=>({v:b,l:b})))},{val:s.site,on:set('site'),opts:[{v:'all',l:'All sites'}].concat(sitesA.map(k=>({v:k,l:SN[k][0]})))}],
      custom:s.range==='custom',from:s.from,to:s.to,onFrom:set('from'),onTo:set('to'),toBd:badTo?'var(--bad-dot)':'var(--border-strong)',
      hasFilter,clearF:()=>this.setState({q:'',range:'30',from:'',to:'',actor:'all',action:'all',ttype:'all',br:'all',site:'all',open:null,shown:PAGE}),
      count:list.length+' entr'+(list.length===1?'y':'ies')+(badTo?' · End date is before the start date':''),rows,empty:list.length===0,more:list.length>s.shown,moreN:Math.min(PAGE,list.length-s.shown),loadMore:()=>this.setState({shown:s.shown+PAGE}),
      togExp:ev=>{ev.stopPropagation();this.setState({expOpen:!s.expOpen});},expOpen:s.expOpen,
      exps:[['csv','Export filtered entries (CSV)'],['xlsx','Export filtered entries (Excel)']].map(([k,l])=>({l,go:()=>{this.setState({expOpen:false});if(!list.length){this.say('Nothing to export');return;}
        try{const txt=k==='csv'?this.csv(list):this.csv(list).replace(/","/g,'\t').replace(/^"|"$/gm,''),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/'+(k==='csv'?'csv':'tab-separated-values')}));a.download='audit-log'+(k==='csv'?'.csv':'.xls');a.click();this.say('Exported '+list.length+' entries');}catch(e){this.say('Export unavailable');}}})),
      toast:s.toast
    };
  }
}

class AdminAuditLogView extends AdminAuditLogBase {
  view(S) {
    const tr = this.props.tr;
    const { a } = S;
    return (
<>
<div onClick={a?.closePop} className="flex flex-col gap-[14px] relative">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("audit_log")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{tr("a_read_only_record_of")}
</div>
</div>
<div className="relative">
<button onClick={a?.togExp} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("export")}
</button>
{a?.expOpen ? (<>
<div onClick={a?.stop} className="absolute right-[0] top-[42px] z-[20] w-[190px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(a?.exps ?? []).map((e, $index) => (<Fragment key={$index}>
<button onClick={e?.go} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13px] cursor-pointer hover:bg-hover">
{e?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
</div>
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex items-center gap-[8px] h-[34px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3 flex-[1_1_200px] max-w-[260px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={a?.q} onInput={a?.onQ} placeholder={tr("search_target_or_reason")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%]" />
</div>
{(a?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] max-w-[180px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
{a?.custom ? (<>
<input type="date" value={a?.from} onInput={a?.onFrom} className="h-[34px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]" />
<span className="text-text-3">
{"→"}
</span>
<input type="date" value={a?.to} onInput={a?.onTo} className="h-[34px] p-[0_8px] rounded-[9px] bg-surface text-text text-[13px]" style={{border:`1px solid ${a?.toBd}`}} />
</>) : null}
{a?.hasFilter ? (<>
<button onClick={a?.clearF} className="h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("clear_filters")}
</button>
</>) : null}
</div>
<div className="text-[12.5px] text-text-3">
{a?.count}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[1040px]">
<div className="grid grid-cols-[24px_148px_minmax(190px,1.2fr)_minmax(190px,1.3fr)_minmax(170px,1.2fr)_120px_150px] gap-[12px] items-center p-[0_16px] h-[38px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div />
<div>
{tr("when")}
</div>
<div>
{tr("actor")}
</div>
<div>
{tr("action")}
</div>
<div>
{tr("target")}
</div>
<div>
{tr("scope")}
</div>
<div>
{tr("ip_device")}
</div>
</div>
{(a?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="border-b border-solid border-b-border">
<div onClick={r?.toggle} className="grid grid-cols-[24px_148px_minmax(190px,1.2fr)_minmax(190px,1.3fr)_minmax(170px,1.2fr)_120px_150px] gap-[12px] items-center p-[11px_16px] text-[13px] cursor-pointer hover:bg-hover" style={{background:r?.bg}}>
<span className="text-text-3 text-[11px] [transition:transform_.12s]" style={{transform:`rotate(${r?.rot})`}}>
{"▸"}
</span>
<div>
<div className="font-medium">
{r?.day}
</div>
<div className="[font:12px_'Geist_Mono',monospace] text-text-3">
{r?.time}
</div>
</div>
<div className="flex items-center gap-[10px] min-w-[0]">
<div className="w-[30px] h-[30px] rounded-[50%] flex-none grid place-items-center text-[11.5px] font-semibold" style={{background:r?.avBg,color:r?.avFg}}>
{r?.ini}
</div>
<div className="min-w-[0]">
<div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{r?.actor}
</div>
<div className="text-[12px] text-text-3">
{r?.role}
</div>
</div>
</div>
<div className="flex items-center gap-[8px] min-w-[0]">
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium whitespace-nowrap" style={{background:r?.aBg,color:r?.aFg}}>
{r?.action}
</span>
</div>
<div className="min-w-[0]">
<a href="#" onClick={r?.openTarget} className="font-medium whitespace-nowrap overflow-hidden text-ellipsis block">
{r?.target}
</a>
<div className="text-[12px] text-text-3">
{r?.ttype}
</div>
</div>
<div className="text-text-2 text-[12.5px]">
{r?.scope}
</div>
<div className="text-[12px] text-text-3 leading-[1.4]">
<div className="[font-family:'Geist_Mono',monospace]">
{r?.ip}
</div>
<div>
{r?.dev}
</div>
</div>
</div>
{r?.open ? (<>
<div className="p-[4px_16px_18px_52px] bg-surface-2 flex flex-col gap-[12px]">
{r?.hasReason ? (<>
<div>
<div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] mb-[4px]">
{tr("reason_given")}
</div>
<div className="p-[9px_12px] rounded-[9px] bg-surface border border-solid border-border text-[13px] max-w-[640px]">
{r?.reason}
</div>
</div>
</>) : null}
{r?.hasDiff ? (<>
<div>
<div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] mb-[4px]">
{tr("changes")}
</div>
<div className="border border-solid border-border rounded-[10px] overflow-hidden bg-surface max-w-[760px]">
<div className="grid grid-cols-[150px_1fr_1fr] gap-[12px] p-[7px_12px] bg-surface-2 border-b border-solid border-b-border text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
<div>
{tr("field")}
</div>
<div>
{tr("before")}
</div>
<div>
{tr("after")}
</div>
</div>
{(r?.diff ?? []).map((d, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[150px_1fr_1fr] gap-[12px] p-[9px_12px] text-[13px] items-start" style={{borderTop:d?.bt}}>
<div className="text-text-2">
{d?.f}
</div>
<div className="p-[3px_8px] rounded-[6px] bg-bad-bg text-bad line-through [text-decoration-color:rgba(0,0,0,.25)] [word-break:break-word]">
{d?.b}
</div>
<div className="p-[3px_8px] rounded-[6px] bg-ok-bg text-ok [word-break:break-word]">
{d?.a}
</div>
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{r?.noDetail ? (<>
<div className="text-[13px] text-text-3">
{tr("no_value_changes_were_recorded")}
</div>
</>) : null}
<div className="flex gap-[18px] flex-wrap text-[12px] text-text-3">
<span>
{tr("entry")}{" "}
<span className="[font-family:'Geist_Mono',monospace]">
{r?.id}
</span>
</span>
<span>
{tr("session_p0",{p0:r?.sess ?? ''})}
</span>
<span>
{r?.full}
</span>
</div>
</div>
</>) : null}
</div>
</Fragment>))}
{a?.empty ? (<>
<div className="p-[56px_24px] text-center text-text-3 text-[13.5px]">
<div className="font-semibold text-text text-[15px] mb-[4px]">
{tr("no_entries_found")}
</div>
{tr("try_widening_the_date_range")}
</div>
</>) : null}
{a?.more ? (<>
<div className="p-[12px] text-center border-t border-solid border-t-border">
<button onClick={a?.loadMore} className="h-[34px] p-[0_16px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("show_p0_more",{p0:a?.moreN ?? ''})}
</button>
</div>
</>) : null}
</div>
</div>
{a?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{a?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminAuditLog(props: any) {
  const tr = useTranslations('AdminAuditLog');
  return <AdminAuditLogView {...props} tr={tr} />;
}
