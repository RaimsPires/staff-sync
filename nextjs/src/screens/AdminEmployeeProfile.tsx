'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const SN={pd:'Part-Dieu Tower',cf:'Confluence Depot',sd:'Saint-Denis Hub',rl:'Roissy Logistics',pv:'Port Vieux Yard'};
const SB={pd:'Lyon',cf:'Lyon',sd:'Paris Nord',rl:'Paris Nord',pv:'Marseille'};
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const ST={active:['Active','var(--ok-bg)','var(--ok)'],invited:['Invited','var(--info-bg)','var(--info)'],deactivated:['Deactivated','var(--neutral-bg)','var(--neutral)']};
const AS={present:['Present','var(--ok-bg)','var(--ok)'],late:['Late','var(--warn-bg)','var(--warn)'],absent:['Absent','var(--bad-bg)','var(--bad)'],leave:['On leave','var(--violet-bg)','var(--violet)']};
const TABS=['Overview','Attendance','Schedule','Leave','Device & access','Documents & notes','Activity'];
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const LT=[['annual','Annual leave',25],['rtt','RTT',10],['sick','Sick leave',5],['family','Family events',4]];
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rngOf=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const pad=n=>String(n).padStart(2,'0'),fm=m=>pad(Math.floor(m/60))+':'+pad(Math.round(m%60));
const dn=d=>DAYS[(d+2)%7];
const gen=emp=>{
  const R=rngOf(hash(emp.id)),recs=[],none=emp.app==='invited'&&emp.att===0;
  for(let d=1;d<=31;d++){const w=(d+3)%7,wk=w===0||w===6;
    if(wk){recs.push({d,wk:true});continue;}
    if(d>16||none){recs.push({d,fut:true});continue;}
    if(d===16){recs.push({d,s:'present',inM:478,outM:null,today:true});continue;}
    const x=R();let s,inM=480-Math.round(R()*12)+4,outM=960+Math.round(R()*22-6);
    if(x<emp.att/100){if(R()<.16){s='late';inM=480+8+Math.round(R()*30);}else s='present';}
    else if(R()<.4){s='leave';inM=outM=null;}else{s='absent';inM=outM=null;}
    recs.push({d,s,inM,outM});}
  return recs;
};
class AdminEmployeeProfileBase extends DCLogic {
  state={tab:0,menu:false,toast:null,af:'all',sch:null,schForm:null,adj:{},adjType:'annual',adjN:'',adjR:'',lvExtra:[],resetAsk:false,unbound:false,docs:null,delDocs:[],notes:[],noteTxt:'',log:[]};
  componentDidMount(){ const e=this.props.emp,R=rngOf(hash(e.id+'s')); this.setState({sch:[{id:1,days:[0,1,2,3,4],s:'08:00',e:'16:00',site:e.sites[0]||'pd'}].concat(e.sites[1]?[{id:2,days:[5],s:'08:00',e:'12:00',site:e.sites[1]}]:[])}); }
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2400); }
  addLog(a,d){ this.setState(x=>({log:[{a,d,t:'just now'}].concat(x.log)})); }
  renderVals(){ return {ep:this.rv()}; }
  rv(){
    const s=this.state,p=this.props,e=p.emp,T=this,R=rngOf(hash(e.id+'x'));
    const first=e.name.split(' ')[0],av=AV[(e.name.charCodeAt(0)+e.name.length)%AV.length],st=ST[e.st],ini=e.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const recs=gen(e),past=recs.filter(r=>r.s),noData=!past.length;
    const pr=past.filter(r=>!r.today),pres=pr.filter(r=>r.s==='present'||r.s==='late'),lates=pr.filter(r=>r.s==='late').length,abs=pr.filter(r=>r.s==='absent').length;
    let hrs=0,ot=0;pres.forEach(r=>{const h=(r.outM-r.inM)/60;hrs+=h;ot+=Math.max(0,h-8);});
    const rate=pr.length?Math.round(pres.length/pr.length*100):0;
    const fmt=n=>(Math.round(n*10)/10).toString();
    const dash='—';
    const stats=[{l:'Attendance rate',v:noData?dash:rate+'%',c:noData?'var(--text-3)':rate>=90?'var(--ok)':rate>=75?'var(--warn)':'var(--bad)',h:'This month'},{l:'Lates',v:noData?dash:lates,c:'var(--text)',h:'Over 5 min'},{l:'Absences',v:noData?dash:abs,c:abs?'var(--bad)':'var(--text)',h:'Unexcused'},{l:'Hours worked',v:noData?dash:fmt(hrs)+' h',c:'var(--text)',h:'Of '+pr.length*8+' h planned'},{l:'Overtime',v:noData?dash:fmt(ot)+' h',c:'var(--text)',h:'Beyond 8 h/day'}];
    const site0=e.sites[0]||'pd';
    const upcoming=recs.filter(r=>r.d>=16&&!r.wk).slice(0,5).map((r,i)=>({d:dn(r.d)+' Oct '+r.d,t:'08:00 – 16:00',s:SN[e.sites[i%e.sites.length]||site0],bt:i?'1px solid var(--border)':'0'}));
    const sites=e.sites.map((k,i)=>({name:SN[k],branch:SB[k],tag:i?'Secondary':'Default site',bg:i?'var(--neutral-bg)':'var(--accent-soft)',fg:i?'var(--neutral)':'var(--accent)',bt:i?'1px solid var(--border)':'0'}));
    const calCol={present:['var(--ok-bg)','var(--ok)','0'],late:['var(--warn-bg)','var(--warn)','0'],absent:['var(--bad-bg)','var(--bad)','0'],leave:['var(--violet-bg)','var(--violet)','0']};
    const cal=[];for(let i=0;i<3;i++) cal.push({n:'',bg:'transparent',fg:'',bd:'0',vis:'hidden'});
    recs.forEach(r=>{let c;if(r.s)c=calCol[r.s];else if(r.wk)c=['transparent','var(--text-3)','0'];else c=['transparent','var(--text-3)','1px dashed var(--border-strong)'];
      cal.push({n:r.d,bg:c[0],fg:c[1],bd:r.d===16?'2px solid var(--accent)':c[2],vis:'visible'});});
    const rows=past.slice().reverse().filter(r=>s.af==='all'||r.s===s.af).map(r=>{const a=AS[r.s];return {d:dn(r.d)+' '+r.d+' Oct',t:r.inM!=null?fm(r.inM)+' → '+(r.outM!=null?fm(r.outM):'in progress'):(r.s==='leave'?'Approved leave':'No check-in'),h:r.outM!=null?fmt((r.outM-r.inM)/60)+' h':'',st:a[0],bg:a[1],fg:a[2]};});
    const sch=(s.sch||[]).map(x=>({days:x.days.length===5&&x.days.every((d,i)=>d===i)?'Monday – Friday':x.days.map(d=>DAYS[d]).join(', '),t:x.s+' – '+x.e,site:SN[x.site],
      edit:()=>this.setState({schForm:{id:x.id,days:x.days.slice(),s:x.s,e:x.e,site:x.site,err:''}}),del:()=>{this.setState(y=>({sch:y.sch.filter(z=>z.id!==x.id)}));this.addLog('Schedule removed',DAYS[x.days[0]]+' '+x.s+' – '+x.e+' · '+SN[x.site]);this.say('Schedule removed');}}));
    const f=s.schForm;
    const lvBase=[{type:'Annual leave',dates:'Oct 27 – Oct 31',days:5,st:'pending'},{type:'Sick leave',dates:'Sep 12',days:1,st:'approved'},{type:'RTT',dates:'Aug 14',days:1,st:'approved'},{type:'Annual leave',dates:'Jul 21 – Aug 1',days:10,st:'approved'},{type:'Family events',dates:'Mar 3',days:1,st:'rejected'}];
    const LS={approved:['Approved','var(--ok-bg)','var(--ok)'],pending:['Pending','var(--warn-bg)','var(--warn)'],rejected:['Rejected','var(--bad-bg)','var(--bad)']};
    const lvAll=e.st==='invited'?[]:lvBase;
    const used={annual:15,rtt:1,sick:1,family:0};
    const bals=LT.map(([k,l,t])=>{const tot=t+(+s.adj[k]||0),left=tot-used[k];return {l,left:fmt(left),tot:fmt(tot),w:Math.max(0,Math.min(100,left/Math.max(tot,1)*100))+'%'};});
    const adjNum=parseFloat(s.adjN),adjOk=!isNaN(adjNum)&&adjNum!==0&&s.adjR.trim().length>=3;
    const dev=e.app==='installed'&&!s.unbound;
    const dvSt=e.app==='none'?'No smartphone':s.unbound?'Unbound':e.app==='invited'?'Awaiting install':'Bound';
    const dvc=dev?['var(--ok-bg)','var(--ok)']:s.unbound||e.app==='invited'?['var(--warn-bg)','var(--warn)']:['var(--neutral-bg)','var(--neutral)'];
    const ph=['iPhone 14','Pixel 7','Galaxy A54','iPhone 12'][hash(e.id)%4],os=ph.startsWith('iPhone')?'iOS 17.5':'Android 14';
    const dvf=dev?[{k:'Model',v:ph},{k:'OS',v:os},{k:'App version',v:'3.8.2'},{k:'Bound on',v:'Mar 4, 2024'},{k:'Last seen',v:'Today, 08:12'},{k:'Last IP',v:'92.184.'+(hash(e.id)%200)+'.'+(hash(e.id+'a')%250)}]:[{k:'Model',v:'—'},{k:'App version',v:'—'},{k:'Last seen',v:e.app==='none'?'Never (badge)':'—'},{k:'Binding',v:e.app==='none'?'Not applicable':s.unbound?'Reset just now':'Not registered'}];
    const lg=dev?[['Success','Today, 08:12',1],['Success','Yesterday, 07:58',1],['Failed — wrong code','Oct 12, 18:40',0],['Success','Oct 12, 07:55',1],['Success','Oct 9, 08:02',1]]:[];
    const logins=lg.map(l=>({r:l[0],t:l[1],dot:l[2]?'var(--ok-dot)':'var(--bad-dot)',dev:ph,loc:SB[site0]}));
    const docsBase=[{n:'Employment contract.pdf',m:'184 KB · Mar 4, 2024 · Claire Vasseur'},{n:'ID document.jpg',m:'1.2 MB · Mar 4, 2024 · Claire Vasseur'},{n:'Safety training certificate.pdf',m:'96 KB · Jun 2, 2025 · Nadia Koné'}];
    const docs=(s.docs||docsBase).filter((d,i)=>!s.delDocs.includes(d.n)).map(d=>({n:d.n,m:d.m,ext:(d.n.split('.').pop()||'').toUpperCase().slice(0,4),del:()=>{this.setState(x=>({docs:(x.docs||docsBase).filter(y=>y.n!==d.n)}));this.addLog('Document deleted',d.n);this.say('Document deleted');}}));
    const notes=[{who:'Marc Olivier',t:'Sep 18',txt:'Prefers early shifts. Has asked to be considered for team lead.'}].concat(s.notes);
    const base=[{a:'Employee created',d:'By Claire Vasseur',t:'Mar 4, 2024'},{a:'Assigned to '+SN[site0],d:'By Claire Vasseur',t:'Mar 4, 2024'},{a:'Invitation sent by SMS',d:'To '+e.phone,t:'Mar 4, 2024'},{a:'Device bound',d:ph+' · app 3.8.2',t:'Mar 5, 2024'},{a:'Leave policy set',d:'Standard full-time',t:'Mar 5, 2024'},{a:'Attendance flag approved',d:'Outside geofence · by Nadia Koné',t:'Sep 12'}].slice(0,e.app==='invited'?3:6);
    const log=s.log.concat(base).map((x,i)=>Object.assign({bt:i?'1px solid var(--border)':'0'},x));
    const menu=[{l:'Edit employee',c:'var(--text)',go:()=>{this.setState({menu:false});p.onEdit&&p.onEdit();}}];
    if(e.app==='installed') menu.push({l:'Reset device',c:'var(--text)',go:()=>this.setState({menu:false,tab:4,resetAsk:true})});
    if(e.app==='none') menu.push({l:'Regenerate badge & PIN',c:'var(--text)',go:()=>{this.setState({menu:false});this.addLog('Badge and PIN regenerated','New PIN issued');this.say('New badge and PIN generated');}});
    menu.push(e.st==='deactivated'?{l:'Reactivate',c:'var(--ok)',go:()=>{this.setState({menu:false});p.onAction&&p.onAction('reactivate');this.addLog('Employee reactivated','By Claire Vasseur');}}:{l:'Deactivate',c:'var(--bad)',go:()=>{this.setState({menu:false});p.onAction&&p.onAction('deactivate');}});
    const dayChips=DAYS.map((l,i)=>{const on=f&&f.days.includes(i);return {l,bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:()=>this.setState(x=>({schForm:Object.assign({},x.schForm,{days:on?x.schForm.days.filter(d=>d!==i):x.schForm.days.concat(i).sort()})}))};});
    const sf=k=>ev=>{const v=ev.target.value;this.setState(x=>({schForm:Object.assign({},x.schForm,{[k]:v})}));};
    const tab=s.tab;
    return {
      back:()=>p.onBack&&p.onBack(),stop:ev=>ev.stopPropagation(),closeMenu:()=>{if(s.menu)this.setState({menu:false});},
      ini,avBg:av[0],avFg:av[1],name:e.name,id:e.id,title:e.role,branch:e.br,role:e.id==='E-1060'?'Site manager':'Employee',st:st[0],stBg:st[1],stFg:st[2],first,
      call:()=>this.say(e.phone==='—'?'No phone number on file':'Calling '+e.name+'…'),msg:()=>this.say(e.phone==='—'?'No phone number on file':'Message to '+e.name+' opened'),mail:()=>this.say('Email to '+e.name+' opened'),edit:()=>p.onEdit&&p.onEdit(),
      togMenu:ev=>{ev.stopPropagation();this.setState({menu:!s.menu});},menuOpen:s.menu,menu,
      tabs:TABS.map((l,i)=>({l,bd:tab===i?'var(--accent)':'transparent',fg:tab===i?'var(--text)':'var(--text-2)',fw:tab===i?600:500,go:()=>this.setState({tab:i,menu:false})})),
      t1:tab===0,t2:tab===1,t3:tab===2,t4:tab===3,t5:tab===4,t6:tab===5,t7:tab===6,
      stats,sites,upcoming,cal,legend:[{l:'Present',c:'var(--ok-dot)'},{l:'Late',c:'var(--warn-dot)'},{l:'Absent',c:'var(--bad-dot)'},{l:'Leave',c:'var(--violet-dot)'}],
      af:s.af,onAf:ev=>this.setState({af:ev.target.value}),afOpts:[{v:'all',l:'All statuses'},{v:'present',l:'Present'},{v:'late',l:'Late'},{v:'absent',l:'Absent'},{v:'leave',l:'On leave'}],recs:rows,noRecs:rows.length===0,noRecsT:noData?'No attendance yet — '+first+' has not been active.':'No records with this status.',
      sch,noSch:sch.length===0,schNew:()=>this.setState({schForm:{id:Date.now(),days:[0,1,2,3,4],s:'08:00',e:'16:00',site:site0,err:'',isNew:true}}),
      interv:[{d:'Oct 21',n:'Boiler inspection',t:'14:00 – 17:00',s:SN[site0]},{d:'Oct 29',n:'Dock safety audit',t:'09:00 – 11:00',s:SN[e.sites[e.sites.length-1]||site0]}],
      schForm:!!f,schTitle:f&&f.isNew?'New recurring schedule':'Edit schedule',dayChips,sfS:f?f.s:'',sfE:f?f.e:'',sfSite:f?f.site:'',onSfS:sf('s'),onSfE:sf('e'),onSfSite:sf('site'),sfErr:f?f.err:'',siteOpts:Object.keys(SN).map(k=>({v:k,l:SN[k]})),
      schCancel:()=>this.setState({schForm:null}),
      schSave:()=>{ if(!f.days.length){this.setState(x=>({schForm:Object.assign({},x.schForm,{err:'Select at least one day'})}));return;} if(f.e<=f.s){this.setState(x=>({schForm:Object.assign({},x.schForm,{err:'End time must be after start time'})}));return;}
        const it={id:f.id,days:f.days,s:f.s,e:f.e,site:f.site};this.setState(x=>({sch:f.isNew?x.sch.concat(it):x.sch.map(z=>z.id===f.id?it:z),schForm:null}));this.addLog(f.isNew?'Schedule added':'Schedule edited',f.days.map(d=>DAYS[d]).join(', ')+' '+f.s+' – '+f.e);this.say('Schedule saved'); },
      bals,lv:lvAll.concat(s.lvExtra).map(r=>{const l=LS[r.st];return {type:r.type,dates:r.dates,days:r.days+' d',st:l[0],bg:l[1],fg:l[2]};}),
      adjType:s.adjType,adjOpts:LT.map(([v,l])=>({v,l})),onAdjType:ev=>this.setState({adjType:ev.target.value}),adjN:s.adjN,onAdjN:ev=>this.setState({adjN:ev.target.value}),adjR:s.adjR,onAdjR:ev=>this.setState({adjR:ev.target.value}),adjOp:adjOk?1:.45,
      adjGo:()=>{ if(!adjOk) return; const k=s.adjType,l=LT.find(x=>x[0]===k)[1];this.setState(x=>({adj:Object.assign({},x.adj,{[k]:(+x.adj[k]||0)+adjNum}),adjN:'',adjR:''}));this.addLog('Leave balance adjusted · '+l+' '+(adjNum>0?'+':'')+adjNum+' d',s.adjR.trim());this.say(l+' balance adjusted'); },
      dvSt,dvBg:dvc[0],dvFg:dvc[1],dv:dvf,canReset:dev,resetIdle:!s.resetAsk,resetAsk:s.resetAsk,resetAskGo:()=>this.setState({resetAsk:true}),resetNo:()=>this.setState({resetAsk:false}),
      resetYes:()=>{this.setState({unbound:true,resetAsk:false});this.addLog('Device binding reset','By Claire Vasseur · '+ph);this.say('Device binding reset');},
      logins,noLogins:logins.length===0,
      docs,noDocs:docs.length===0,onDoc:ev=>{const fl=ev.target.files&&ev.target.files[0];if(!fl)return;const n=fl.name,sz=Math.max(1,Math.round(fl.size/1024))+' KB';this.setState(x=>({docs:[{n,m:sz+' · just now · Claire Vasseur'}].concat(x.docs||docsBase)}));this.addLog('Document uploaded',n);this.say('Uploaded '+n);},
      notes,noteTxt:s.noteTxt,onNote:ev=>this.setState({noteTxt:ev.target.value}),noteOp:s.noteTxt.trim()?1:.45,addNote:()=>{const t=s.noteTxt.trim();if(!t)return;this.setState(x=>({notes:[{who:'Claire Vasseur',t:'just now',txt:t}].concat(x.notes),noteTxt:''}));this.addLog('Note added',t.slice(0,80));},
      log,toast:s.toast
    };
  }
}

class AdminEmployeeProfileView extends AdminEmployeeProfileBase {
  view(S) {
    const tr = this.props.tr;
    const { ep } = S;
    return (
<>
<div onClick={ep?.closeMenu} className="flex flex-col gap-[16px] relative">
<button onClick={ep?.back} className="self-start flex items-center gap-[6px] h-[30px] p-[0_10px_0_6px] border-0 rounded-[8px] bg-transparent text-text-2 text-[13px] cursor-pointer hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M15 6l-6 6 6 6" />
</svg>
{tr("employees")}
</button>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[20px] flex gap-[18px] items-center flex-wrap relative">
<div className="w-[76px] h-[76px] rounded-[50%] flex-none grid place-items-center text-[26px] font-semibold" style={{background:ep?.avBg,color:ep?.avFg}}>
{ep?.ini}
</div>
<div className="flex-[1_1_280px] min-w-[0]">
<div className="flex items-center gap-[10px] flex-wrap">
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{ep?.name}
</h1>
<span className="p-[3px_9px] rounded-[6px] text-[12px] font-medium" style={{background:ep?.stBg,color:ep?.stFg}}>
{ep?.st}
</span>
</div>
<div className="mt-[6px] flex gap-[6px_14px] flex-wrap text-[13.5px] text-text-2">
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px]">
{ep?.id}
</span>
<span>
{ep?.title}
</span>
<span>
{ep?.branch}
</span>
<span>
{tr("role_p0",{p0:ep?.role ?? ''})}
</span>
</div>
</div>
<div className="flex gap-[8px] flex-wrap items-center">
<button onClick={ep?.call} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("call")}
</button>
<button onClick={ep?.msg} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("message")}
</button>
<button onClick={ep?.mail} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("email")}
</button>
<button onClick={ep?.edit} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("edit")}
</button>
<button onClick={ep?.togMenu} aria-label={tr("more")} className="w-[36px] h-[36px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-2 cursor-pointer grid place-items-center">
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
<circle cx="5" cy="12" r="1.8" />
<circle cx="12" cy="12" r="1.8" />
<circle cx="19" cy="12" r="1.8" />
</svg>
</button>
</div>
{ep?.menuOpen ? (<>
<div onClick={ep?.stop} className="absolute right-[20px] top-[calc(100%_-_14px)] z-[20] w-[230px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(ep?.menu ?? []).map((a, $index) => (<Fragment key={$index}>
<button onClick={a?.go} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-[13px] cursor-pointer hover:bg-hover" style={{color:a?.c}}>
{a?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
<div className="flex gap-[2px] border-b border-solid border-b-border overflow-x-auto">
{(ep?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer whitespace-nowrap" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
</button>
</Fragment>))}
</div>
{ep?.t1 ? (<>
<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[12px]">
{(ep?.stats ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[14px_16px]">
<div className="text-[12.5px] text-text-3">
{s?.l}
</div>
<div className="text-[26px] font-semibold tracking-[-.02em] mt-[2px]" style={{color:s?.c}}>
{s?.v}
</div>
<div className="text-[12px] text-text-3">
{s?.h}
</div>
</div>
</Fragment>))}
</div>
<div className="flex gap-[16px] flex-wrap items-start">
<div className="flex-[1_1_300px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[14.5px] mb-[10px]">
{tr("assigned_sites")}
</div>
{(ep?.sites ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[9px_0]" style={{borderTop:s?.bt}}>
<div className="flex-1">
<div className="text-[13.5px] font-medium">
{s?.name}
</div>
<div className="text-[12px] text-text-3">
{s?.branch}
</div>
</div>
<span className="text-[12px] p-[3px_8px] rounded-[999px]" style={{background:s?.bg,color:s?.fg}}>
{s?.tag}
</span>
</div>
</Fragment>))}
</div>
<div className="flex-[1_1_360px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[14.5px] mb-[10px]">
{tr("upcoming_schedule")}
</div>
{(ep?.upcoming ?? []).map((u, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[9px_0] text-[13px]" style={{borderTop:u?.bt}}>
<span className="w-[96px] font-medium">
{u?.d}
</span>
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px] text-text-2">
{u?.t}
</span>
<span className="ml-[auto] text-text-3 text-right">
{u?.s}
</span>
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{ep?.t2 ? (<>
<div className="flex gap-[16px] flex-wrap items-start">
<div className="flex-[0_1_380px] min-w-[300px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[14.5px] mb-[12px]">
{tr("october_2026")}
</div>
<div className="grid grid-cols-[repeat(7,1fr)] gap-[6px] text-center text-[11.5px] text-text-3 mb-[6px]">
<span>
{tr("mon")}
</span>
<span>
{tr("tue")}
</span>
<span>
{tr("wed")}
</span>
<span>
{tr("thu")}
</span>
<span>
{tr("fri")}
</span>
<span>
{tr("sat")}
</span>
<span>
{tr("sun")}
</span>
</div>
<div className="grid grid-cols-[repeat(7,1fr)] gap-[6px]">
{(ep?.cal ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="[aspect-ratio:1] rounded-[8px] grid place-items-center text-[12.5px] font-medium" style={{background:c?.bg,color:c?.fg,border:c?.bd,visibility:c?.vis}}>
{c?.n}
</div>
</Fragment>))}
</div>
<div className="flex gap-[12px] flex-wrap mt-[14px] text-[12px] text-text-2">
{(ep?.legend ?? []).map((l, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[6px]">
<span className="w-[10px] h-[10px] rounded-[3px]" style={{background:l?.c}} />
{l?.l}
</span>
</Fragment>))}
</div>
</div>
<div className="flex-[1_1_380px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] flex items-center justify-between gap-[10px] border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px]">
{tr("records")}
</div>
<select value={ep?.af} onChange={ep?.onAf} className="h-[32px] p-[0_9px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(ep?.afOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</div>
{(ep?.recs ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[84px_1fr_56px_96px] gap-[10px] items-center p-[10px_16px] border-t border-solid border-t-border text-[13px]">
<span className="font-medium">
{r?.d}
</span>
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px] text-text-2">
{r?.t}
</span>
<span className="text-text-3 text-right">
{r?.h}
</span>
<span className="[justify-self:end] p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.bg,color:r?.fg}}>
{r?.st}
</span>
</div>
</Fragment>))}
{ep?.noRecs ? (<>
<div className="p-[40px_16px] text-center text-text-3 text-[13.5px]">
{ep?.noRecsT}
</div>
</>) : null}
</div>
</div>
</>) : null}
{ep?.t3 ? (<>
<div className="flex gap-[16px] flex-wrap items-start">
<div className="flex-[1_1_420px] min-w-[0] flex flex-col gap-[16px]">
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="flex items-center justify-between mb-[6px]">
<div className="font-semibold text-[14.5px]">
{tr("recurring_schedules")}
</div>
<button onClick={ep?.schNew} className="h-[32px] p-[0_12px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("add_schedule")}
</button>
</div>
{(ep?.sch ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[11px_0] border-t border-solid border-t-border text-[13px]">
<div className="flex-1 min-w-[0]">
<div className="font-medium">
{s?.days}
</div>
<div className="text-text-3 text-[12.5px]">
{s?.t}{" · "}{s?.site}
</div>
</div>
<button onClick={s?.edit} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("edit")}
</button>
<button onClick={s?.del} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("remove")}
</button>
</div>
</Fragment>))}
{ep?.noSch ? (<>
<div className="p-[18px_0] text-text-3 text-[13px]">
{tr("no_recurring_schedule_add_one")}
</div>
</>) : null}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[14.5px] mb-[6px]">
{tr("upcoming_interventions")}
</div>
{(ep?.interv ?? []).map((i, $index) => (<Fragment key={$index}>
<div className="flex gap-[12px] items-center p-[11px_0] border-t border-solid border-t-border text-[13px]">
<span className="w-[92px] font-medium">
{i?.d}
</span>
<div className="flex-1">
<div className="font-medium">
{i?.n}
</div>
<div className="text-text-3 text-[12.5px]">
{i?.t}{" · "}{i?.s}
</div>
</div>
</div>
</Fragment>))}
</div>
</div>
{ep?.schForm ? (<>
<div className="flex-[1_1_300px] max-w-[420px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="font-semibold text-[14.5px]">
{ep?.schTitle}
</div>
<div className="flex gap-[6px] flex-wrap">
{(ep?.dayChips ?? []).map((d, $index) => (<Fragment key={$index}>
<button onClick={d?.go} className="w-[42px] h-[34px] rounded-[9px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${d?.bd}`,background:d?.bg,color:d?.fg}}>
{d?.l}
</button>
</Fragment>))}
</div>
<div className="flex gap-[10px]">
<label className="flex-1 flex flex-col gap-[4px] text-[12.5px] text-text-2">
{tr("start")}
<input type="time" value={ep?.sfS} onInput={ep?.onSfS} className="h-[34px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex-1 flex flex-col gap-[4px] text-[12.5px] text-text-2">
{tr("end")}
<input type="time" value={ep?.sfE} onInput={ep?.onSfE} className="h-[34px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
</div>
<label className="flex flex-col gap-[4px] text-[12.5px] text-text-2">
{tr("site")}
<select value={ep?.sfSite} onChange={ep?.onSfSite} className="h-[34px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text">
{(ep?.siteOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="text-[12.5px] text-bad min-h-[0]">
{ep?.sfErr}
</div>
<div className="flex gap-[8px]">
<button onClick={ep?.schSave} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("save_schedule")}
</button>
<button onClick={ep?.schCancel} className="h-[34px] p-[0_12px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</div>
</div>
</>) : null}
</div>
</>) : null}
{ep?.t4 ? (<>
<div className="flex gap-[16px] flex-wrap items-start">
<div className="flex-[1_1_440px] min-w-[0] flex flex-col gap-[16px]">
<div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[12px]">
{(ep?.bals ?? []).map((b, $index) => (<Fragment key={$index}>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[14px_16px]">
<div className="text-[12.5px] text-text-3">
{b?.l}
</div>
<div className="text-[24px] font-semibold mt-[2px]">
{b?.left}
<span className="text-[13px] font-normal text-text-3">
{tr("p0_days",{p0:b?.tot ?? ''})}
</span>
</div>
<div className="h-[6px] rounded-[3px] bg-neutral-bg mt-[8px] overflow-hidden">
<div className="h-[100%] bg-accent" style={{width:b?.w}} />
</div>
</div>
</Fragment>))}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] font-semibold text-[14.5px] border-b border-solid border-b-border">
{tr("requests")}
</div>
{(ep?.lv ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(100px,1fr)_minmax(120px,1.2fr)_60px_90px] gap-[10px] items-center p-[11px_16px] border-t border-solid border-t-border text-[13px]">
<span className="font-medium">
{r?.type}
</span>
<span className="text-text-2">
{r?.dates}
</span>
<span className="text-text-3">
{r?.days}
</span>
<span className="[justify-self:end] p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.bg,color:r?.fg}}>
{r?.st}
</span>
</div>
</Fragment>))}
</div>
</div>
<div className="flex-[1_1_300px] max-w-[400px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="font-semibold text-[14.5px]">
{tr("adjust_balance")}
</div>
<select value={ep?.adjType} onChange={ep?.onAdjType} className="h-[34px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(ep?.adjOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<label className="flex flex-col gap-[4px] text-[12.5px] text-text-2">
{tr("days_to_add_negative_to")}
<input type="number" step="0.5" value={ep?.adjN} onInput={ep?.onAdjN} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:13px_'Geist_Mono',monospace]" />
</label>
<label className="flex flex-col gap-[4px] text-[12.5px] text-text-2">
{tr("reason")}
<textarea rows="3" value={ep?.adjR} onInput={ep?.onAdjR} placeholder={tr("why_is_the_balance_changing")} className="resize-y p-[9px_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]" />
</label>
<button onClick={ep?.adjGo} className="h-[34px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:ep?.adjOp}}>
{tr("apply_adjustment")}
</button>
</div>
</div>
</>) : null}
{ep?.t5 ? (<>
<div className="flex gap-[16px] flex-wrap items-start">
<div className="flex-[1_1_360px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="flex items-center justify-between">
<div className="font-semibold text-[14.5px]">
{tr("registered_device")}
</div>
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:ep?.dvBg,color:ep?.dvFg}}>
{ep?.dvSt}
</span>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[1px] bg-border border border-solid border-border rounded-[10px] overflow-hidden">
{(ep?.dv ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="bg-surface p-[10px_12px]">
<div className="text-[11.5px] text-text-3">
{f?.k}
</div>
<div className="text-[13px] font-medium mt-[2px]">
{f?.v}
</div>
</div>
</Fragment>))}
</div>
{ep?.canReset ? (<>
{ep?.resetAsk ? (<>
<div className="p-[12px] rounded-[10px] bg-warn-bg text-warn text-[13px] flex flex-col gap-[10px]">
{tr("reset_binding_p0_will_have",{p0:ep?.first ?? ''})}
<div className="flex gap-[8px]">
<button onClick={ep?.resetYes} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-warn-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("reset_binding")}
</button>
<button onClick={ep?.resetNo} className="h-[32px] p-[0_10px] border-0 bg-transparent text-warn text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</div>
</div>
</>) : null}
{ep?.resetIdle ? (<>
<button onClick={ep?.resetAskGo} className="self-start h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("reset_device_binding")}
</button>
</>) : null}
</>) : null}
</div>
<div className="flex-[1_1_360px] bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] font-semibold text-[14.5px] border-b border-solid border-b-border">
{tr("login_history")}
</div>
{(ep?.logins ?? []).map((l, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[10px_16px] border-t border-solid border-t-border text-[13px]">
<span className="w-[8px] h-[8px] rounded-[50%] flex-none" style={{background:l?.dot}} />
<div className="flex-1 min-w-[0]">
<div className="font-medium">
{l?.r}
</div>
<div className="text-text-3 text-[12px]">
{l?.dev}{" · "}{l?.loc}
</div>
</div>
<span className="text-text-3 text-[12.5px] text-right">
{l?.t}
</span>
</div>
</Fragment>))}
{ep?.noLogins ? (<>
<div className="p-[36px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_sign_ins_yet")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{ep?.t6 ? (<>
<div className="flex gap-[16px] flex-wrap items-start">
<div className="flex-[1_1_360px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="flex items-center justify-between mb-[6px]">
<div className="font-semibold text-[14.5px]">
{tr("documents")}
</div>
<label className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer flex items-center">
<input type="file" onChange={ep?.onDoc} className="hidden" />
{tr("upload_file")}
</label>
</div>
{(ep?.docs ?? []).map((d, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[11px_0] border-t border-solid border-t-border">
<div className="w-[34px] h-[40px] rounded-[6px] bg-neutral-bg text-neutral grid place-items-center [font:600_10px_'Geist_Mono',monospace] flex-none">
{d?.ext}
</div>
<div className="flex-1 min-w-[0]">
<div className="text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{d?.n}
</div>
<div className="text-[12px] text-text-3">
{d?.m}
</div>
</div>
<button onClick={d?.del} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("delete")}
</button>
</div>
</Fragment>))}
{ep?.noDocs ? (<>
<div className="p-[24px_0] text-text-3 text-[13px]">
{tr("no_documents_uploaded")}
</div>
</>) : null}
</div>
<div className="flex-[1_1_360px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[10px]">
<div className="font-semibold text-[14.5px]">
{tr("admin_notes")}
</div>
{(ep?.notes ?? []).map((n, $index) => (<Fragment key={$index}>
<div className="p-[10px_12px] rounded-[10px] bg-surface-2 border border-solid border-border text-[13px]">
<div className="text-[11.5px] text-text-3 mb-[2px]">
{n?.who}{" · "}{n?.t}
</div>
{n?.txt}
</div>
</Fragment>))}
<textarea rows="3" value={ep?.noteTxt} onInput={ep?.onNote} placeholder={tr("add_a_private_note")} className="resize-y p-[9px_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]" />
<button onClick={ep?.addNote} className="self-start h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:ep?.noteOp}}>
{tr("add_note")}
</button>
</div>
</div>
</>) : null}
{ep?.t7 ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[6px_18px]">
{(ep?.log ?? []).map((a, $index) => (<Fragment key={$index}>
<div className="flex gap-[14px] p-[12px_0] text-[13px]" style={{borderTop:a?.bt}}>
<span className="w-[6px] h-[6px] rounded-[50%] bg-accent mt-[7px] flex-none" />
<div className="flex-1 min-w-[0]">
<div className="font-medium">
{a?.a}
</div>
<div className="text-text-3 text-[12.5px]">
{a?.d}
</div>
</div>
<span className="text-text-3 text-[12.5px] text-right whitespace-nowrap">
{a?.t}
</span>
</div>
</Fragment>))}
</div>
</>) : null}
{ep?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{ep?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminEmployeeProfile(props: any) {
  const tr = useTranslations('AdminEmployeeProfile');
  return <AdminEmployeeProfileView {...props} tr={tr} />;
}
