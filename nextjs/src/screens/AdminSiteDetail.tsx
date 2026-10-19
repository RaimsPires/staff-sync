'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const POOL=[['Amélie Fontaine','Machinist'],['Karim Benali','Forklift operator'],['Léa Moreau','Cleaner'],['Thomas Girard','Technician'],['Inès Haddad','Electrician'],['Paul Lambert','Driver'],['Sofia Rossi','Loader'],['Hugo Petit','Welder'],['Nora Diallo','Inspector'],['Yanis Boucher','Machinist'],['Camille Roux','Warehouse agent'],['Mehdi Cherif','Technician'],['Elena Marchand','Cleaner'],['Bastien Leroy','Driver'],['Georges Aubert','Cleaner'],['Monique Vidal','Cleaner']];
const MGP=[['Nadia Koné','Branch manager','06 21 18 44 70'],['Julien Roche','Site manager','06 33 70 12 08'],['Marc Olivier','Site manager','06 20 81 37 52'],['Sarah Benoît','Site manager','06 48 02 91 15'],['Hugo Martel','Team lead','06 72 55 31 64']];
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const ST={in:['Checked in','var(--ok-bg)','var(--ok)'],late:['Late','var(--warn-bg)','var(--warn)'],out:['Checked out','var(--neutral-bg)','var(--neutral)'],absent:['Absent','var(--bad-bg)','var(--bad)'],expected:['Expected','var(--info-bg)','var(--info)'],flagged:['Flagged','var(--orange-bg)','var(--orange)']};
const PC={in:'var(--ok-dot)',late:'var(--warn-dot)',out:'var(--neutral-dot)',flagged:'var(--bad-dot)'};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rngOf=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const pad=n=>String(n).padStart(2,'0'),fm=m=>pad(Math.floor(m/60))+':'+pad(Math.round(m%60));
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const NOW=630;
const gen=site=>{
  const n=Math.min(10,Math.max(0,site.emp?Math.max(4,Math.round(site.emp/5)):0)),R=rngOf(hash(site.id)),start=hash(site.id)%POOL.length,out=[];
  for(let i=0;i<n;i++){const p=POOL[(start+i)%POOL.length],kind=i%5===4?'early':i%5===3?'late':'std',ss=kind==='early'?360:kind==='late'?660:480,se=kind==='early'?600:kind==='late'?1140:960;
    let st,inM=null,outM=null,method='App',ang=R()*6.28,dist=R()*.7;
    if(ss>NOW) st='expected';
    else{const x=R();if(kind==='early'){st='out';inM=ss-4;outM=se+2;}else if(x<.7){st='in';inM=ss-Math.round(R()*10)+3;}else if(x<.82){st='late';inM=ss+10+Math.round(R()*25);}else if(x<.9){st='flagged';inM=ss+2;dist=1.5+R()*.4;}else st='absent';}
    if(st!=='absent'&&st!=='expected'&&R()<.12) method='QR';
    out.push({id:'t'+i,name:p[0],role:p[1],ss,se,st,inM,outM,method,ang,dist});}
  return out;
};
const init=site=>({tab:0,roster:gen(site),proxy:null,pTime:'10:30',pReason:'',pTry:false,pt:null,team:null,addSel:'',rm:null,mgrs:null,mgrSel:'',hf:'all',hq:'',set:{selfie:site.selfie,qr:site.qr,dev:false,offline:true,acc:'50'},saved:true,toast:null});
class AdminSiteDetailBase extends DCLogic {
  state=init(this.props.site);
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2400); }
  renderVals(){ return {sd:this.rv()}; }
  rv(){
    const s=this.state,p=this.props,site=p.site,T=this,R0=rngOf(hash(site.id+'h'));
    const rost=s.roster;
    const team0=rost.map(r=>({name:r.name,role:r.role}));
    const team=s.team||team0;
    const mgrs=s.mgrs||(site.mgrs&&site.mgrs.length?site.mgrs:(site.mgr&&site.mgr!=='—'?[site.mgr]:[])).map(n=>{const m=MGP.find(x=>x[0]===n);return {name:n,role:m?m[1]:'Site manager',phone:m?m[2]:'—'};});
    const here=rost.filter(r=>r.st!=='absent'&&r.st!=='expected').length,exp=rost.length;
    const lates=rost.filter(r=>r.st==='late').length+Math.round(rost.length*1.6),flags=rost.filter(r=>r.st==='flagged').length+Math.round(rost.length*.4);
    const rate=site.active&&exp?Math.round(88+R0()*9):0;
    const stats=[{l:'Attendance rate',v:site.active&&exp?rate+'%':'—',c:rate>=93?'var(--ok)':'var(--text)',h:'This month'},{l:'Average arrival',v:site.active&&exp?'07:56':'—',c:'var(--text)',h:'4 min before shift'},{l:'Lates',v:site.active?lates:'—',c:'var(--text)',h:'This month'},{l:'Flags',v:site.active?flags:'—',c:flags>2?'var(--bad)':'var(--text)',h:'This month'}];
    const fr=Math.min(130,Math.max(40,90)),scM=fr/(Math.max(30,site.r)/100);
    const pts=rost.filter(r=>PC[r.st]).map(r=>{const rad=r.dist*Math.max(30,site.r)/100*scM*.85,x=380+Math.cos(r.ang)*rad,y=150+Math.sin(r.ang)*rad*.8;return {x:x.toFixed(1),y:y.toFixed(1),r:r.st==='flagged'?8:6,c:PC[r.st],go:()=>this.setState({pt:r.name+' · '+ST[r.st][0]+' at '+fm(r.inM)+(r.st==='flagged'?' · outside the geofence':'')})};});
    const rps=site.gt!=='circle'?[1,.88,1.08,.94,1.04,.9].map((m,i)=>{const t=i/6*Math.PI*2;return (380+Math.cos(t)*fr*m*1.1).toFixed(1)+','+(150+Math.sin(t)*fr*m*1.1*.85).toFixed(1);}).join(' '):'';
    const cnt=k=>rost.filter(r=>r.st===k).length;
    const counts=[['in','here',cnt('in')],['late','late',cnt('late')],['flagged','flagged',cnt('flagged')],['out','checked out',cnt('out')],['expected','expected',cnt('expected')],['absent','absent',cnt('absent')]].filter(x=>x[2]>0).map(([k,l,n])=>({n,l,bg:ST[k][1],fg:ST[k][2]}));
    const prx=s.proxy;
    const roster=rost.map(r=>{const a=ST[r.st],can=r.st==='absent'||r.st==='expected'||r.st==='in'||r.st==='late'||r.st==='flagged',isIn=r.st==='in'||r.st==='late'||r.st==='flagged';
      return {name:r.name,role:r.role,shift:fm(r.ss)+'–'+fm(r.se),in:r.inM!=null?fm(r.inM):'—',out:r.outM!=null?fm(r.outM):'—',method:r.method,st:a[0],bg:a[1],fg:a[2],canProxy:can&&r.st!=='out',proxyL:isIn?'Proxy check-out':'Proxy check-in',form:!!prx&&prx.id===r.id,
        proxy:()=>this.setState({proxy:{id:r.id,type:isIn?'out':'in'},pTime:'10:30',pReason:'',pTry:false})};});
    const hist=[];const HR=rngOf(hash(site.id+'hist'));
    team0.slice(0,6).forEach((t,ti)=>{for(let d=15;d>=2;d--){const wk=(d+3)%7;if(wk===0||wk===6)continue;const x=HR();let st,inM=480+Math.round(HR()*8)-5,outM=960+Math.round(HR()*20-5);
      if(x<.78)st='in';else if(x<.88){st='late';inM=480+10+Math.round(HR()*25);}else if(x<.94){st='absent';inM=outM=null;}else{st='flagged';}
      if(HR()<.45) hist.push({d,name:t.name,st,inM,outM});}});
    hist.sort((a,b)=>b.d-a.d);
    const HS={in:'Present',late:'Late',absent:'Absent',flagged:'Flagged'},hq=s.hq.trim().toLowerCase();
    const histV=hist.filter(h=>(s.hf==='all'||h.st===s.hf)&&(!hq||h.name.toLowerCase().includes(hq))).slice(0,24).map(h=>{const a=ST[h.st==='in'?'in':h.st];return {d:DAYS[(h.d+2)%7]+' Oct '+h.d,name:h.name,t:h.inM!=null?fm(h.inM)+' → '+fm(h.outM):'No check-in',h:h.outM!=null?((h.outM-h.inM)/60).toFixed(1)+' h':'',st:HS[h.st],bg:a[1],fg:a[2]};});
    const wr=rngOf(hash(site.id+'w'));
    const week=team0.slice(0,10).map((t,i)=>({name:t.name,cells:DAYS.map((d,di)=>{const x=wr();const today=di===3;let c;if(di>=5)c=x<.2?{t:'08–12',bg:'var(--accent-soft)',fg:'var(--accent)'}:{t:'Off',bg:'transparent',fg:'var(--text-3)'};else if(x<.07)c={t:'Leave',bg:'var(--violet-bg)',fg:'var(--violet)'};else{const s0=rost[i]?fm(rost[i].ss).slice(0,2):'08',e0=rost[i]?fm(rost[i].se).slice(0,2):'16';c={t:s0+'–'+e0,bg:'var(--accent-soft)',fg:'var(--accent)'};}
      return Object.assign({bd:today?'1.5px solid var(--accent)':'0'},c);})}));
    const unassigned=POOL.filter(x=>!team.some(t=>t.name===x[0]));
    const mgrPool=MGP.filter(x=>!mgrs.some(m=>m.name===x[0]));
    const TG=[['selfie','Require selfie','Photo at every check-in.'],['qr','Require QR scan','Scan the site QR code to check in.'],['dev','Registered device only','Block unregistered phones.'],['offline','Allow offline check-in','Sync when back online.']];
    const accOk=+s.set.acc>=5&&+s.set.acc<=500;
    return {
      back:()=>p.onBack&&p.onBack(),name:site.name,branch:site.br,addr:site.addr,fence:(site.gt==='circle'?'Circle · '+site.r+' m':'Polygon · ~'+site.r+' m'),stL:site.active?'Active':'Inactive',stBg:site.active?'var(--ok-bg)':'var(--neutral-bg)',stFg:site.active?'var(--ok)':'var(--neutral)',
      edit:()=>p.onEdit&&p.onEdit(),qr:()=>p.onQr&&p.onQr(),stats,
      world:'translate('+(380-250)+' 0)',circle:site.gt==='circle',fr,polyOn:site.gt!=='circle',poly:rps,pts,ptInfo:s.pt,
      legend:[['In','var(--ok-dot)'],['Late','var(--warn-dot)'],['Outside','var(--bad-dot)'],['Out','var(--neutral-dot)']].map(([l,c])=>({l,c})),
      tabs:['Today','Employees','Schedule','Attendance history','Managers','Settings'].map((l,i)=>({l,bd:s.tab===i?'var(--accent)':'transparent',fg:s.tab===i?'var(--text)':'var(--text-2)',fw:s.tab===i?600:500,go:()=>this.setState({tab:i})})),
      t1:s.tab===0,t2:s.tab===1,t3:s.tab===2,t4:s.tab===3,t5:s.tab===4,t6:s.tab===5,
      counts,roster,noRoster:rost.length===0,pTime:s.pTime,onPTime:ev=>this.setState({pTime:ev.target.value}),pReason:s.pReason,onPReason:ev=>this.setState({pReason:ev.target.value}),pBd:s.pTry&&!s.pReason.trim()?'var(--bad-dot)':'var(--border-strong)',
      pNo:()=>this.setState({proxy:null}),
      pGo:()=>{ if(!s.pReason.trim()){this.setState({pTry:true});return;} const[hh,mm]=s.pTime.split(':').map(Number),t=hh*60+mm,id=prx.id,typ=prx.type;
        this.setState(st=>({roster:st.roster.map(r=>r.id!==id?r:typ==='in'?Object.assign({},r,{st:t>r.ss+5?'late':'in',inM:t,method:'Proxy · Claire V.',dist:.3}):Object.assign({},r,{st:'out',outM:t,method:r.method})),proxy:null}));
        this.say(typ==='in'?'Proxy check-in recorded':'Proxy check-out recorded'); },
      assignedN:team.length,addSel:s.addSel,onAddSel:ev=>this.setState({addSel:ev.target.value}),addOpts:[{v:'',l:'Add employee…'}].concat(unassigned.map(x=>({v:x[0],l:x[0]+' · '+x[1]}))),addOp:s.addSel?1:.45,
      addEmp:()=>{ if(!s.addSel)return; const x=POOL.find(y=>y[0]===s.addSel); this.setState({team:team.concat({name:x[0],role:x[1]}),addSel:''}); this.say(x[0]+' added to '+site.name); },
      team:team.map(e=>{const av=AV[(e.name.charCodeAt(0)+e.name.length)%AV.length];return {name:e.name,role:e.role,ini:e.name.split(' ').map(w=>w[0]).join('').slice(0,2),avBg:av[0],avFg:av[1],asking:s.rm===e.name,idle:s.rm!==e.name,ask:()=>this.setState({rm:e.name}),no:()=>this.setState({rm:null}),yes:()=>{this.setState({team:team.filter(y=>y.name!==e.name),rm:null});this.say(e.name+' removed');}};}),noTeam:team.length===0,
      days:DAYS.map((l,i)=>({l:l+' '+(12+i),c:i===3?'var(--accent)':'var(--text-3)'})),week,
      hq:s.hq,onHq:ev=>this.setState({hq:ev.target.value}),hf:s.hf,onHf:ev=>this.setState({hf:ev.target.value}),hfOpts:[{v:'all',l:'All statuses'},{v:'in',l:'Present'},{v:'late',l:'Late'},{v:'absent',l:'Absent'},{v:'flagged',l:'Flagged'}],hist:histV,noHist:histV.length===0,
      mgrs:mgrs.map(m=>({name:m.name,role:m.role,phone:m.phone,ini:m.name.split(' ').map(w=>w[0]).join('').slice(0,2),contact:()=>this.say('Calling '+m.name+'…'),del:()=>{this.setState({mgrs:mgrs.filter(x=>x.name!==m.name)});this.say(m.name+' removed as manager');}})),noMgrs:mgrs.length===0,
      mgrSel:s.mgrSel,onMgrSel:ev=>this.setState({mgrSel:ev.target.value}),mgrOpts:[{v:'',l:'Add manager…'}].concat(mgrPool.map(x=>({v:x[0],l:x[0]}))),mgrOp:s.mgrSel?1:.45,
      addMgr:()=>{ if(!s.mgrSel)return; const x=MGP.find(y=>y[0]===s.mgrSel); this.setState({mgrs:mgrs.concat({name:x[0],role:x[1],phone:x[2]}),mgrSel:''}); this.say(x[0]+' is now a manager here'); },
      toggles:TG.map(([k,l,h])=>({l,h,bg:s.set[k]?'var(--accent)':'var(--border-strong)',left:s.set[k]?'19px':'2px',go:()=>this.setState(x=>({set:Object.assign({},x.set,{[k]:!x.set[k]}),saved:false}))})),
      acc:s.set.acc,onAcc:ev=>{const v=ev.target.value;this.setState(x=>({set:Object.assign({},x.set,{acc:v}),saved:false}));},accBd:accOk?'var(--border-strong)':'var(--bad-dot)',saveOp:!s.saved&&accOk?1:.45,dirtyL:s.saved?'All changes saved':'Unsaved changes',
      saveSet:()=>{ if(s.saved||!accOk)return; this.setState({saved:true}); this.say('Settings saved'); },
      toast:s.toast
    };
  }
}

class AdminSiteDetailView extends AdminSiteDetailBase {
  view(S) {
    const tr = this.props.tr;
    const { sd } = S;
    return (
<>
<div className="flex flex-col gap-[16px] relative">
<button onClick={sd?.back} className="self-start flex items-center gap-[6px] h-[30px] p-[0_10px_0_6px] border-0 rounded-[8px] bg-transparent text-text-2 text-[13px] cursor-pointer hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M15 6l-6 6 6 6" />
</svg>
{tr("sites")}
</button>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[18px_20px] flex gap-[16px] items-center flex-wrap">
<div className="flex-[1_1_280px] min-w-[0]">
<div className="flex items-center gap-[10px] flex-wrap">
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{sd?.name}
</h1>
<span className="p-[3px_9px] rounded-[6px] text-[12px] font-medium" style={{background:sd?.stBg,color:sd?.stFg}}>
{sd?.stL}
</span>
</div>
<div className="mt-[6px] flex gap-[6px_14px] flex-wrap text-[13.5px] text-text-2">
<span>
{sd?.branch}
</span>
<span>
{sd?.addr}
</span>
<span>
{sd?.fence}
</span>
</div>
</div>
<div className="flex gap-[8px]">
<button onClick={sd?.qr} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("print_qr")}
</button>
<button onClick={sd?.edit} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("edit")}
</button>
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[12px]">
{(sd?.stats ?? []).map((s, $index) => (<Fragment key={$index}>
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
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] flex justify-between items-center gap-[10px] flex-wrap border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px]">
{tr("today_s_check_ins")}
</div>
<div className="flex gap-[14px] text-[12px] text-text-2 flex-wrap">
{(sd?.legend ?? []).map((l, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[6px]">
<span className="w-[9px] h-[9px] rounded-[50%]" style={{background:l?.c}} />
{l?.l}
</span>
</Fragment>))}
</div>
</div>
<svg viewBox="0 0 760 300" width="100%" className="block bg-map-bg">
<g transform={sd?.world}>
<path d="M-400 -200 H1200 V-60 H-400Z" fill="var(--map-block)" opacity=".6" />
<path d="M-400 70 H1200 M-400 -130 H1200 M-90 -300 V400 M110 -300 V400 M260 -300 V400" stroke="var(--map-road)" strokeWidth="6" fill="none" vectorEffect="non-scaling-stroke" />
<rect x="-60" y="100" width="150" height="80" fill="var(--map-block)" />
<rect x="130" y="-110" width="110" height="60" fill="var(--map-block)" />
</g>
{sd?.circle ? (<>
<circle cx="380" cy="150" r={sd?.fr} fill="var(--fence)" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 4" />
</>) : null}
{sd?.polyOn ? (<>
<polygon points={sd?.poly} fill="var(--fence)" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 4" />
</>) : null}
<circle cx="380" cy="150" r="4" fill="var(--accent)" />
{(sd?.pts ?? []).map((p, $index) => (<Fragment key={$index}>
<g onClick={p?.go} className="cursor-pointer">
<circle cx={p?.x} cy={p?.y} r={p?.r} fill={p?.c} stroke="#fff" strokeWidth="2" />
</g>
</Fragment>))}
</svg>
{sd?.ptInfo ? (<>
<div className="p-[8px_16px] border-t border-solid border-t-border text-[13px] text-text-2">
{sd?.ptInfo}
</div>
</>) : null}
</div>
<div className="flex gap-[2px] border-b border-solid border-b-border overflow-x-auto">
{(sd?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer whitespace-nowrap" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
</button>
</Fragment>))}
</div>
{sd?.t1 ? (<>
<div className="flex gap-[8px] flex-wrap">
{(sd?.counts ?? []).map((c, $index) => (<Fragment key={$index}>
<span className="p-[4px_11px] rounded-[999px] text-[12.5px] font-medium" style={{background:c?.bg,color:c?.fg}}>
{c?.n}{" "}{c?.l}
</span>
</Fragment>))}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[800px]">
<div className="grid grid-cols-[minmax(160px,1.4fr)_110px_70px_70px_120px_104px_150px] gap-[10px] items-center p-[0_16px] h-[36px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
<div>
{tr("employee")}
</div>
<div>
{tr("shift")}
</div>
<div>
{tr("in")}
</div>
<div>
{tr("out")}
</div>
<div>
{tr("method")}
</div>
<div>
{tr("status")}
</div>
<div />
</div>
{(sd?.roster ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="border-b border-solid border-b-border">
<div className="grid grid-cols-[minmax(160px,1.4fr)_110px_70px_70px_120px_104px_150px] gap-[10px] items-center p-[10px_16px] text-[13px]">
<div>
<div className="font-medium">
{r?.name}
</div>
<div className="text-[12px] text-text-3">
{r?.role}
</div>
</div>
<span className="text-text-2 [font-family:'Geist_Mono',monospace] text-[12.5px]">
{r?.shift}
</span>
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px]">
{r?.in}
</span>
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px]">
{r?.out}
</span>
<span className="text-text-2 text-[12.5px]">
{r?.method}
</span>
<span>
<span className="p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.bg,color:r?.fg}}>
{r?.st}
</span>
</span>
<div className="text-right">
{r?.canProxy ? (<>
<button onClick={r?.proxy} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{r?.proxyL}
</button>
</>) : null}
</div>
</div>
{r?.form ? (<>
<div className="flex gap-[10px] items-center flex-wrap p-[10px_16px_14px] bg-surface-2">
<input type="time" value={sd?.pTime} onInput={sd?.onPTime} className="h-[32px] p-[0_8px] rounded-[8px] border border-solid border-border-strong bg-surface text-text" />
<input value={sd?.pReason} onInput={sd?.onPReason} placeholder={tr("reason_required")} className="flex-[1_1_220px] h-[32px] p-[0_10px] rounded-[8px] bg-surface text-text text-[13px] [outline:none]" style={{border:`1px solid ${sd?.pBd}`}} />
<button onClick={sd?.pGo} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("record")}
</button>
<button onClick={sd?.pNo} className="h-[32px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</div>
</>) : null}
</div>
</Fragment>))}
{sd?.noRoster ? (<>
<div className="p-[40px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_one_is_scheduled_here")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{sd?.t2 ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] flex gap-[10px] items-center flex-wrap border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px] flex-1">
{tr("p0_assigned_employees",{p0:sd?.assignedN ?? ''})}
</div>
<select value={sd?.addSel} onChange={sd?.onAddSel} className="h-[34px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(sd?.addOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<button onClick={sd?.addEmp} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:sd?.addOp}}>
{tr("add")}
</button>
</div>
{(sd?.team ?? []).map((e, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[10px_16px] border-t border-solid border-t-border text-[13px]">
<div className="w-[32px] h-[32px] rounded-[50%] grid place-items-center text-[12px] font-semibold" style={{background:e?.avBg,color:e?.avFg}}>
{e?.ini}
</div>
<div className="flex-1">
<div className="font-medium">
{e?.name}
</div>
<div className="text-[12px] text-text-3">
{e?.role}
</div>
</div>
{e?.asking ? (<>
<span className="text-[12.5px] text-text-2">
{tr("remove_from_site")}
</span>
<button onClick={e?.yes} className="h-[28px] p-[0_10px] rounded-[8px] border-0 bg-bad-dot text-[color:#fff] text-[12.5px] cursor-pointer">
{tr("remove")}
</button>
<button onClick={e?.no} className="h-[28px] p-[0_8px] border-0 bg-transparent text-text-2 text-[12.5px] cursor-pointer">
{tr("cancel")}
</button>
</>) : null}
{e?.idle ? (<>
<button onClick={e?.ask} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("remove")}
</button>
</>) : null}
</div>
</Fragment>))}
{sd?.noTeam ? (<>
<div className="p-[40px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_employees_assigned_yet")}
</div>
</>) : null}
</div>
</>) : null}
{sd?.t3 ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[760px]">
<div className="p-[12px_16px] font-semibold text-[14.5px] border-b border-solid border-b-border">
{tr("week_of_oct_12_oct")}
</div>
<div className="grid grid-cols-[minmax(150px,1.3fr)_repeat(7,1fr)] gap-[6px] p-[8px_16px] text-[11.5px] font-semibold text-text-3 uppercase">
<div />
{(sd?.days ?? []).map((d, $index) => (<Fragment key={$index}>
<div className="text-center" style={{color:d?.c}}>
{d?.l}
</div>
</Fragment>))}
</div>
{(sd?.week ?? []).map((w, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(150px,1.3fr)_repeat(7,1fr)] gap-[6px] p-[5px_16px] items-center border-t border-solid border-t-border">
<div className="text-[13px] font-medium">
{w?.name}
</div>
{(w?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="h-[32px] rounded-[8px] grid place-items-center text-[11.5px]" style={{background:c?.bg,color:c?.fg,border:c?.bd}}>
{c?.t}
</div>
</Fragment>))}
</div>
</Fragment>))}
{sd?.noTeam ? (<>
<div className="p-[40px_16px] text-center text-text-3 text-[13.5px]">
{tr("nobody_to_schedule")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{sd?.t4 ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] flex gap-[10px] flex-wrap items-center border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px] flex-1">
{tr("records")}
</div>
<input value={sd?.hq} onInput={sd?.onHq} placeholder={tr("search_employee")} className="h-[32px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[13px] [outline:none]" />
<select value={sd?.hf} onChange={sd?.onHf} className="h-[32px] p-[0_9px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(sd?.hfOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</div>
<div className="overflow-x-auto">
<div className="min-w-[560px]">
{(sd?.hist ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[90px_minmax(140px,1.3fr)_1fr_60px_100px] gap-[10px] items-center p-[10px_16px] border-t border-solid border-t-border text-[13px]">
<span className="font-medium">
{r?.d}
</span>
<span>
{r?.name}
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
</div>
</div>
{sd?.noHist ? (<>
<div className="p-[40px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_records_match")}
</div>
</>) : null}
</div>
</>) : null}
{sd?.t5 ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_16px] flex gap-[10px] items-center flex-wrap border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px] flex-1">
{tr("site_managers")}
</div>
<select value={sd?.mgrSel} onChange={sd?.onMgrSel} className="h-[34px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(sd?.mgrOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<button onClick={sd?.addMgr} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:sd?.mgrOp}}>
{tr("add_manager")}
</button>
</div>
{(sd?.mgrs ?? []).map((m, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[12px_16px] border-t border-solid border-t-border text-[13px]">
<div className="w-[34px] h-[34px] rounded-[50%] grid place-items-center text-[12px] font-semibold bg-info-bg text-info">
{m?.ini}
</div>
<div className="flex-1">
<div className="font-medium">
{m?.name}
</div>
<div className="text-[12px] text-text-3">
{m?.role}{" · "}{m?.phone}
</div>
</div>
<button onClick={m?.contact} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("contact")}
</button>
<button onClick={m?.del} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("remove")}
</button>
</div>
</Fragment>))}
{sd?.noMgrs ? (<>
<div className="p-[36px_16px] text-center text-warn text-[13.5px]">
{tr("no_manager_assigned_flags_and")}
</div>
</>) : null}
</div>
</>) : null}
{sd?.t6 ? (<>
<div className="max-w-[620px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[14px]">
<div className="font-semibold text-[14.5px]">
{tr("verification_rules")}
</div>
{(sd?.toggles ?? []).map((t, $index) => (<Fragment key={$index}>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{t?.l}
</div>
<div className="text-[12.5px] text-text-3">
{t?.h}
</div>
</div>
<div onClick={t?.go} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:t?.bg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:t?.left}} />
</div>
</div>
</Fragment>))}
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("minimum_gps_accuracy_m")}
<input type="number" min="5" value={sd?.acc} onInput={sd?.onAcc} className="h-[34px] w-[120px] p-[0_10px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${sd?.accBd}`}} />
</label>
<div className="flex gap-[10px] items-center">
<button onClick={sd?.saveSet} className="h-[34px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:sd?.saveOp}}>
{tr("save_settings")}
</button>
<span className="text-[12.5px] text-text-3">
{sd?.dirtyL}
</span>
</div>
</div>
</>) : null}
{sd?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{sd?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminSiteDetail(props: any) {
  const tr = useTranslations('AdminSiteDetail');
  return <AdminSiteDetailView {...props} tr={tr} />;
}
