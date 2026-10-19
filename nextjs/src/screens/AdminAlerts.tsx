'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const BR={sd:'Paris Nord',rl:'Paris Nord',pd:'Lyon',cf:'Lyon',pv:'Marseille'};
const SN={pd:'Part-Dieu Tower',cf:'Confluence Depot',sd:'Saint-Denis Hub',rl:'Roissy Logistics',pv:'Port Vieux Yard'};
const FR={pd:150,cf:180,sd:200,rl:200,pv:160};
const RS={geo:['Outside geofence','bad'],mock:['Mock location','bad'],acc:['Low GPS accuracy','warn'],tamper:['Time tampering','bad'],unas:['Unassigned site','orange'],dev:['Unregistered device','violet'],miss:['Missing check-out','info'],uns:['Unscheduled check-in','orange'],unc:['Uncovered intervention','neutral']};
const SEV={high:['High','var(--bad-dot)'],med:['Medium','var(--warn-dot)'],low:['Low','var(--neutral-dot)']};
const TABS=[['flagged','Flagged check-ins'],['miss','Missing check-outs'],['uns','Unscheduled check-ins'],['unc','Uncovered interventions'],['resolved','Resolved']];
const ADMINS=['Claire Vasseur','Nadia Koné','Julien Roche','Marc Olivier'];
const DT=[['all','Any date'],['0','Today'],['7','Last 7 days'],['30','Last 30 days']];
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const DEV='iPhone 14 · iOS 17.5 · app 3.8.2';
const mk=(id,tab,rs,name,role,site,dt,days,sev,o)=>Object.assign({id,tab,rs,name,role,site,dt,days,sev,status:'open',dist:0,acc:12,dev:DEV,reg:true,sf:true,fc:0,phone:'+33 6 '+(10+id.length*7+days)+' 42 '+(30+days)+' 18',prev:[['Yesterday','07:58 → 16:03',1,''],['Oct 14','07:55 → 16:10',1,''],['Oct 9','08:02 → 16:00',1,'']],notes:[],desc:''},o);
const ITEMS=[
 mk('a1','flagged','geo','Amélie Fontaine','Machinist','sd','Today · 08:12',0,'high',{dist:620,acc:14,fc:3,desc:'Checked in 420 m beyond the geofence edge, 8 min before shift start.',prev:[['Yesterday','07:58 → 16:03',1,''],['Oct 14','07:55 → 16:10',1,''],['Oct 9','08:40 → 16:00',0,'180 m outside']]}),
 mk('a2','flagged','mock','Karim Benali','Forklift operator','rl','Today · 07:49',0,'high',{dist:40,acc:2,fc:5,dev:'Pixel 7 · Android 14 · developer options on',desc:'Location provider reports a mock app. Accuracy of 2 m is implausible indoors.',prev:[['Yesterday','07:45 → 15:58',0,'Mock location'],['Oct 14','07:50 → 16:02',0,'Mock location'],['Oct 13','07:44 → 16:00',1,'']]}),
 mk('a3','flagged','acc','Léa Moreau','Cleaner','pd','Today · 06:31',0,'med',{dist:90,acc:180,fc:1,sf:false,desc:'GPS accuracy of 180 m exceeds the 50 m limit. Position could not be confirmed.'}),
 mk('a4','flagged','tamper','Thomas Girard','Technician','cf','Yesterday · 07:20',1,'high',{dist:60,fc:2,desc:'Device clock was 41 min behind the server at check-in. Recorded time was overridden.'}),
 mk('a5','flagged','unas','Inès Haddad','Electrician','pv','Yesterday · 09:05',1,'med',{dist:30,fc:0,desc:'Assigned to Part-Dieu Tower but checked in at Port Vieux Yard.'}),
 mk('a6','flagged','dev','Paul Lambert','Driver','sd','Oct 14 · 06:58',2,'low',{dist:70,fc:1,reg:false,dev:'Galaxy A54 · Android 14 · app 3.8.0',desc:'First check-in from a device not registered to this employee.'}),
 mk('a7','flagged','geo','Sofia Rossi','Loader','rl','Oct 13 · 14:02',3,'med',{dist:460,acc:22,fc:2,desc:'Checked in 260 m beyond the geofence edge.'}),
 mk('a8','flagged','geo','Hugo Petit','Welder','sd','Oct 9 · 07:41',7,'med',{dist:510,fc:4,desc:'Checked in 310 m beyond the geofence edge.'}),
 mk('a9','flagged','acc','Nora Diallo','Inspector','cf','Sep 30 · 08:15',16,'low',{dist:120,acc:95,fc:0,desc:'GPS accuracy of 95 m exceeds the 50 m limit.'}),
 mk('m1','miss','miss','Yanis Boucher','Machinist','sd','Today · in 07:52',0,'med',{dist:55,desc:'No check-out 3 h after scheduled end (16:00).'}),
 mk('m2','miss','miss','Camille Roux','Warehouse agent','rl','Yesterday · in 08:01',1,'low',{dist:80,desc:'No check-out recorded. App closed while on site.'}),
 mk('m3','miss','miss','Mehdi Cherif','Technician','pd','Oct 13 · in 06:02',3,'med',{dist:20,desc:'No check-out. Last GPS ping 14:20, 600 m from site.'}),
 mk('u1','uns','uns','Elena Marchand','Cleaner','cf','Today · 10:02',0,'low',{dist:45,desc:'Checked in with no shift scheduled for this site today.'}),
 mk('u2','uns','uns','Bastien Leroy','Driver','pv','Yesterday · 13:30',1,'med',{dist:100,desc:'Checked in outside any scheduled shift. Roster shows day off.'}),
 mk('u3','uns','uns','Zoé Martin','Loader','rl','Oct 12 · 05:45',4,'low',{dist:30,desc:'Shift swap not recorded. Scheduled employee was Pierre Dumas.'}),
 mk('i1','unc','unc','Boiler failure · planned: Lucas Fabre','Intervention 14:00–18:00','pd','Today · 14:00',0,'high',{sf:false,desc:'No one checked in. Lucas Fabre is on leave and no replacement is assigned.'}),
 mk('i2','unc','unc','Night patrol · planned: Rémi Colin','Intervention 22:00–06:00','sd','Yesterday · 22:00',1,'high',{sf:false,desc:'Night patrol uncovered for the full slot. Planned employee never checked in.'}),
 mk('i3','unc','unc','Dock inspection · planned: Maya Perrin','Intervention 09:00–11:00','pv','Oct 12 · 09:00',4,'med',{sf:false,desc:'Inspection slot uncovered. Late check-in at 11:40 after the slot closed.'}),
 mk('r1','flagged','geo','Damien Lopez','Cleaner','pd','Oct 10 · 07:30',6,'med',{status:'approved',dist:310,fc:1,res:['Claire Vasseur','Employee was on a site-approved fuel stop.']}),
 mk('r2','flagged','mock','Chloé Garnier','Technician','cf','Oct 8 · 08:00',8,'high',{status:'rejected',dist:30,acc:1,fc:4,out:'absent',res:['Nadia Koné','Mock location confirmed with device audit.']}),
 mk('r3','miss','miss','Olivier Bernard','Driver','sd','Oct 6 · in 07:44',10,'low',{status:'approved',res:['Marc Olivier','Forgot to check out; confirmed by site manager.']}),
 mk('r4','uns','uns','Sarah Fabre','Loader','rl','Oct 2 · 13:02',14,'low',{status:'rejected',out:'invalid',res:['Julien Roche','Employee not rostered; no manager approval.']})
];
class AdminAlertsBase extends DCLogic {
  state={items:ITEMS,tab:'flagged',sel:[],openId:'a1',br:'all',site:'all',rs:'all',dt:'all',q:'',act:null,txt:'',outcome:'absent',esc:'Claire Vasseur',bulk:null,toast:null};
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2600); }
  vis(){
    const s=this.state,q=s.q.trim().toLowerCase();
    return s.items.filter(it=>{
      if(s.tab==='resolved'?it.status==='open':(it.status!=='open'||it.tab!==s.tab)) return false;
      if(s.br!=='all'&&BR[it.site]!==s.br) return false;
      if(s.site!=='all'&&it.site!==s.site) return false;
      if(s.rs!=='all'&&it.rs!==s.rs) return false;
      if(s.dt!=='all'&&it.days>+s.dt) return false;
      return !q||it.name.toLowerCase().includes(q);
    });
  }
  resolve(ids,status,reason,out){
    this.setState(s=>({items:s.items.map(it=>ids.includes(it.id)?Object.assign({},it,{status,out,res:['Claire Vasseur',reason]}):it),sel:s.sel.filter(x=>!ids.includes(x)),act:null,txt:'',bulk:null}));
  }
  renderVals(){ return {al:this.rv()}; }
  rv(){
    const s=this.state,T=this;
    const open=s.items.filter(i=>i.status==='open');
    const vis=this.vis(),cur=s.items.find(i=>i.id===s.openId);
    const chip=it=>{const r=RS[it.rs],g=it.rs==='geo'?'Outside geofence by '+Math.max(0,it.dist-FR[it.site])+' m':r[0];return {chip:g,cBg:'var(--'+r[1]+'-bg)',cFg:'var(--'+r[1]+')',cDot:'var(--'+r[1]+'-dot)'};};
    const stl={open:['Open','var(--warn-bg)','var(--warn)'],approved:['Approved','var(--ok-bg)','var(--ok)'],rejected:['Rejected','var(--bad-bg)','var(--bad)']};
    const av=it=>{const a=AV[(it.name.charCodeAt(0)+it.name.length)%AV.length];const w=it.name.split(' · ')[0].split(' ');return {avBg:a[0],avFg:a[1],ini:w.length>1&&!it.name.includes('·')?w[0][0]+w[1][0]:w[0].slice(0,2).toUpperCase()};};
    const selOpen=vis.filter(i=>i.status==='open'),allOn=selOpen.length>0&&selOpen.every(i=>s.sel.includes(i.id));
    const sites=Object.keys(SN).filter(k=>s.br==='all'||BR[k]===s.br);
    const rows=vis.map(it=>{const on=s.sel.includes(it.id),st=stl[it.status],sv=SEV[it.sev];
      return Object.assign({id:it.id,name:it.name,role:it.role,site:SN[it.site],branch:BR[it.site],dt:it.dt,sev:sv[0],sevDot:sv[1],st:st[0],stBg:st[1],stFg:st[2],bg:it.id===s.openId?'var(--accent-soft)':'transparent',
        ckBg:on?'var(--accent)':'transparent',ckBd:on?'var(--accent)':'var(--border-strong)',ckOp:on?1:0,ckVis:it.status==='open'?'visible':'hidden',
        open:()=>this.setState({openId:it.id,act:null,txt:''}),
        toggle:e=>{e.stopPropagation();this.setState(x=>({sel:x.sel.includes(it.id)?x.sel.filter(y=>y!==it.id):x.sel.concat(it.id),bulk:null}));}},chip(it),av(it));});
    let d=null;
    if(cur){
      const r=RS[cur.rs],c=chip(cur),sv=SEV[cur.sev],st=stl[cur.status],fr=FR[cur.site],k=0.3,hasPos=cur.tab!=='unc';
      const ang=(cur.name.length*47+cur.days*31)%360*Math.PI/180,pxr=Math.min(cur.dist*k,150),px=170+Math.cos(ang)*pxr,py=Math.max(14,Math.min(140,105+Math.sin(ang)*pxr*0.7));
      const outside=cur.dist>fr,badAcc=cur.acc>50,sus=cur.acc<4;
      d=Object.assign({name:cur.name,role:cur.role,site:SN[cur.site],branch:BR[cur.site],st:st[0],stBg:st[1],stFg:st[2],desc:cur.desc,dt:cur.dt,sev:sv[0],
        fr:fr*k,fenceR:fr,hasPos,noPos:!hasPos,px:px.toFixed(1),py:py.toFixed(1),pinC:cur.rs==='geo'||cur.rs==='mock'||cur.rs==='tamper'?'var(--bad-dot)':'var(--warn-dot)',accPx:Math.min(60,Math.max(6,cur.acc*k)),
        facts:hasPos?[{k:'Distance from site centre',v:cur.dist+' m'+(outside?' · '+(cur.dist-fr)+' m outside':' · inside'),c:outside?'var(--bad)':'var(--text)'},{k:'GPS accuracy',v:'±'+cur.acc+' m'+(badAcc?' · poor':sus?' · suspicious':' · good'),c:badAcc||sus?'var(--warn)':'var(--text)'},{k:'Device',v:cur.dev,c:'var(--text)'},{k:'Device registered',v:cur.reg?'Yes':'No — new device',c:cur.reg?'var(--text)':'var(--violet)'}]:[{k:'Site',v:SN[cur.site],c:'var(--text)'},{k:'Slot',v:cur.role.replace('Intervention ',''),c:'var(--text)'},{k:'Coverage',v:'0 of 1 staffed',c:'var(--bad)'},{k:'Site manager',v:{sd:'Marc Olivier',rl:'Marc Olivier',pd:'Nadia Koné',cf:'Julien Roche',pv:'Sarah Benoît'}[cur.site],c:'var(--text)'}],
        selfieL:cur.sf?'SELFIE\n'+cur.dt.split('· ').pop():'NONE',selfieD:cur.sf?'Captured at check-in.':hasPos?'Not captured — camera permission denied.':'Not applicable.',
        flagCount:cur.fc,fhBg:cur.fc>=3?'var(--bad-bg)':cur.fc?'var(--warn-bg)':'var(--ok-bg)',fhFg:cur.fc>=3?'var(--bad)':cur.fc?'var(--warn)':'var(--ok)',
        prev:cur.prev.map((p,i)=>({d:p[0],t:p[1],dot:p[2]?'var(--ok-dot)':'var(--bad-dot)',n:p[3]||'Valid',bt:i?'1px solid var(--border)':'0'})),
        notes:cur.notes,phone:cur.phone,open:cur.status==='open',resolved:cur.status!=='open',
        resTitle:cur.res?(cur.status==='approved'?'Approved as valid':'Rejected · '+(cur.out==='invalid'?'record invalid':'marked absent'))+' by '+cur.res[0]:'',resDesc:cur.res?cur.res[1]:''},c,av(cur));
    }
    const a=s.act,need=s.txt.trim().length<3;
    const ob=x=>a===x?'2px solid var(--accent)':'none';
    const mkB=x=>a===x?'var(--hover)':'var(--surface)';
    const bulkApprove=s.bulk==='approve';
    const openCount=k=>open.filter(i=>i.tab===k).length;
    const dotAct=k=>this.setState({act:s.act===k?null:k,txt:''});
    const done=(m)=>{ this.say(m); };
    return {
      sub:open.length+' open alerts across '+new Set(open.map(i=>i.site)).size+' sites · '+open.filter(i=>i.sev==='high').length+' high severity',
      tabs:TABS.map(([k,l])=>{const on=s.tab===k,n=k==='resolved'?s.items.length-open.length:openCount(k);return {label:l,n,bd:on?'var(--accent)':'transparent',fg:on?'var(--text)':'var(--text-2)',fw:on?600:500,nbg:on?'var(--accent)':'var(--neutral-bg)',nfg:on?'#fff':'var(--neutral)',go:()=>this.setState({tab:k,sel:[],act:null,bulk:null})};}),
      q:s.q,onQ:e=>this.setState({q:e.target.value}),br:s.br,site:s.site,rs:s.rs,dt:s.dt,
      onBr:e=>this.setState({br:e.target.value,site:'all',sel:[]}),onSite:e=>this.setState({site:e.target.value,sel:[]}),onRs:e=>this.setState({rs:e.target.value,sel:[]}),onDt:e=>this.setState({dt:e.target.value,sel:[]}),
      brOpts:[{v:'all',l:'All branches'}].concat(['Lyon','Paris Nord','Marseille'].map(b=>({v:b,l:b}))),
      siteOpts:[{v:'all',l:'All sites'}].concat(sites.map(k=>({v:k,l:SN[k]}))),
      rsOpts:[{v:'all',l:'All reasons'}].concat(Object.keys(RS).map(k=>({v:k,l:RS[k][0]}))),
      dtOpts:DT.map(([v,l])=>({v,l})),
      hasFilter:s.br!=='all'||s.site!=='all'||s.rs!=='all'||s.dt!=='all'||!!s.q,
      clearF:()=>this.setState({br:'all',site:'all',rs:'all',dt:'all',q:''}),
      hasSel:s.sel.length>0,selLabel:s.sel.length+' selected',bulkIdle:!s.bulk,bulkOpen:!!s.bulk,
      bulkApprove:()=>this.setState({bulk:'approve',txt:''}),bulkReject:()=>this.setState({bulk:'reject',txt:''}),bulkCancel:()=>this.setState({bulk:null,txt:''}),clearSel:()=>this.setState({sel:[],bulk:null}),
      bulkPh:bulkApprove?'Reason for approving (required)':'Reason for rejecting (required)',bulkBtn:bulkApprove?'Resolve '+s.sel.length+' as valid':'Reject '+s.sel.length+' (mark absent)',bulkBg:bulkApprove?'var(--ok-dot)':'var(--bad-dot)',bulkOp:need?.45:1,
      bulkConfirm:()=>{ if(need) return; const n=s.sel.length; this.resolve(s.sel,bulkApprove?'approved':'rejected',s.txt.trim(),bulkApprove?undefined:'absent'); done(n+' alerts '+(bulkApprove?'approved':'rejected')); },
      allBg:allOn?'var(--accent)':'transparent',allBd:allOn?'var(--accent)':'var(--border-strong)',allOp:allOn?1:0,
      selAll:()=>this.setState({sel:allOn?[]:selOpen.map(i=>i.id),bulk:null}),
      txt:s.txt,onTxt:e=>this.setState({txt:e.target.value}),
      rows,empty:rows.length===0,emptyT:s.tab==='resolved'?'Nothing resolved yet':'All clear',emptyD:'No alerts match the current filters.',
      hasD:!!d,d,
      goApprove:()=>dotAct('approve'),goReject:()=>this.setState({act:s.act==='reject'?null:'reject',txt:'',outcome:'absent'}),goContact:()=>dotAct('contact'),goNote:()=>dotAct('note'),goEscalate:()=>dotAct('esc'),
      oApprove:ob('approve'),oReject:ob('reject'),bContact:mkB('contact'),bNote:mkB('note'),bEsc:mkB('esc'),
      aContact:a==='contact',aForm:a==='approve'||a==='reject'||a==='note'||a==='esc',aReject:a==='reject',aEsc:a==='esc',
      doCall:()=>{done('Calling '+cur.name+'…');this.setState({act:null});},doMsg:()=>{done('Message sent to '+cur.name);this.setState({act:null});},
      formT:{approve:'Approve as valid',reject:'Reject alert',note:'Add a note',esc:'Escalate to another admin'}[a]||'',
      formPh:{approve:'Why is this check-in valid? (required)',reject:'Reason for rejection (required)',note:'Write a note…',esc:'Context for the next admin (required)'}[a]||'',
      reqNote:a==='note'?'':'Reason is required',
      outAbsent:()=>this.setState({outcome:'absent'}),outInvalid:()=>this.setState({outcome:'invalid'}),
      bdAbsent:s.outcome==='absent'?'var(--bad-dot)':'var(--border-strong)',bgAbsent:s.outcome==='absent'?'var(--bad-bg)':'var(--surface)',bdInvalid:s.outcome==='invalid'?'var(--bad-dot)':'var(--border-strong)',bgInvalid:s.outcome==='invalid'?'var(--bad-bg)':'var(--surface)',
      esc:s.esc,onEsc:e=>this.setState({esc:e.target.value}),admins:ADMINS.filter(n=>n!=='Claire Vasseur').map(v=>({v})),
      confL:{approve:'Approve as valid',reject:s.outcome==='absent'?'Reject · mark absent':'Reject · mark invalid',note:'Save note',esc:'Escalate'}[a]||'',
      confBg:a==='approve'?'var(--ok-dot)':a==='reject'?'var(--bad-dot)':'var(--accent)',confOp:need?.45:1,
      cancel:()=>this.setState({act:null,txt:''}),
      confirm:()=>{ if(need) return; const t=s.txt.trim(),id=cur.id;
        if(a==='approve'){this.resolve([id],'approved',t);done('Approved as valid');}
        else if(a==='reject'){this.resolve([id],'rejected',t,s.outcome);done('Rejected · '+(s.outcome==='absent'?'marked absent':'record invalid'));}
        else if(a==='note'){this.setState(x=>({items:x.items.map(i=>i.id===id?Object.assign({},i,{notes:i.notes.concat({who:'Claire Vasseur',t:'just now',txt:t})}):i),act:null,txt:''}));done('Note added');}
        else {this.setState(x=>({items:x.items.map(i=>i.id===id?Object.assign({},i,{notes:i.notes.concat({who:'Claire Vasseur',t:'just now',txt:'Escalated to '+x.esc+': '+t})}):i),act:null,txt:''}));done('Escalated to '+s.esc);}
      },
      toast:s.toast
    };
  }
}

class AdminAlertsView extends AdminAlertsBase {
  view(S) {
    const tr = this.props.tr;
    const { al } = S;
    return (
<>
<div className="flex flex-col gap-[14px] relative">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("fraud_alerts_center")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{al?.sub}
</div>
</div>
<div className="flex gap-[8px] items-center flex-wrap">
<div className="flex items-center gap-[8px] h-[34px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={al?.q} onInput={al?.onQ} placeholder={tr("search_employee")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[150px]" />
</div>
</div>
</div>
<div className="flex gap-[2px] border-b border-solid border-b-border overflow-x-auto">
{(al?.tabs ?? []).map((tb, $index) => (<Fragment key={$index}>
<button onClick={tb?.go} className="flex items-center gap-[8px] h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer whitespace-nowrap" style={{borderBottom:`2px solid ${tb?.bd}`,color:tb?.fg,fontWeight:tb?.fw}}>
{tb?.label}
<span className="min-w-[20px] h-[20px] p-[0_6px] rounded-[10px] grid place-items-center [font:600_11px_'Geist_Mono',monospace]" style={{background:tb?.nbg,color:tb?.nfg}}>
{tb?.n}
</span>
</button>
</Fragment>))}
</div>
<div className="flex gap-[8px] flex-wrap items-center">
<select value={al?.br} onChange={al?.onBr} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(al?.brOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<select value={al?.site} onChange={al?.onSite} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(al?.siteOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<select value={al?.rs} onChange={al?.onRs} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(al?.rsOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<select value={al?.dt} onChange={al?.onDt} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(al?.dtOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
{al?.hasFilter ? (<>
<button onClick={al?.clearF} className="h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("clear_filters")}
</button>
</>) : null}
</div>
{al?.hasSel ? (<>
<div className="flex items-center gap-[10px] flex-wrap p-[10px_12px] rounded-[12px] bg-accent-soft border border-solid border-accent">
<span className="font-semibold text-[13.5px] text-accent">
{al?.selLabel}
</span>
{al?.bulkIdle ? (<>
<button onClick={al?.bulkApprove} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("resolve_as_valid")}
</button>
<button onClick={al?.bulkReject} className="h-[32px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[13px] font-medium cursor-pointer">
{tr("reject_all")}
</button>
</>) : null}
{al?.bulkOpen ? (<>
<input value={al?.txt} onInput={al?.onTxt} placeholder={al?.bulkPh} className="flex-[1_1_220px] h-[32px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[13px]" />
<button onClick={al?.bulkConfirm} className="h-[32px] p-[0_12px] rounded-[8px] border-0 text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{background:al?.bulkBg,opacity:al?.bulkOp}}>
{al?.bulkBtn}
</button>
<button onClick={al?.bulkCancel} className="h-[32px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</>) : null}
<button onClick={al?.clearSel} className="ml-[auto] h-[32px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("clear_selection")}
</button>
</div>
</>) : null}
<div className="flex gap-[16px] items-start flex-wrap">
<div className="flex-[1_1_560px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[700px]">
<div className="grid grid-cols-[28px_minmax(150px,1.2fr)_minmax(120px,1fr)_104px_minmax(160px,1.3fr)_70px_82px] gap-[12px] items-center p-[0_14px] h-[38px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div onClick={al?.selAll} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center cursor-pointer text-[color:#fff]" style={{border:`1.5px solid ${al?.allBd}`,background:al?.allBg}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:al?.allOp}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
<div>
{tr("employee")}
</div>
<div>
{tr("site")}
</div>
<div>
{tr("date_time")}
</div>
<div>
{tr("reason")}
</div>
<div>
{tr("severity")}
</div>
<div>
{tr("status")}
</div>
</div>
{(al?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div onClick={r?.open} className="grid grid-cols-[28px_minmax(150px,1.2fr)_minmax(120px,1fr)_104px_minmax(160px,1.3fr)_70px_82px] gap-[12px] items-center p-[10px_14px] border-b border-solid border-b-border cursor-pointer text-[13px] hover:bg-hover" style={{background:r?.bg}}>
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
{r?.role}
</div>
</div>
</div>
<div className="min-w-[0]">
<div className="whitespace-nowrap overflow-hidden text-ellipsis">
{r?.site}
</div>
<div className="text-[12px] text-text-3">
{r?.branch}
</div>
</div>
<div className="text-text-2 leading-[1.35]">
{r?.dt}
</div>
<div>
<span className="inline-flex items-center gap-[6px] p-[4px_9px] rounded-[999px] text-[12px] font-medium" style={{background:r?.cBg,color:r?.cFg}}>
<span className="w-[6px] h-[6px] rounded-[50%] flex-none" style={{background:r?.cDot}} />
{r?.chip}
</span>
</div>
<div className="flex items-center gap-[6px] text-text-2 text-[12.5px]">
<span className="w-[8px] h-[8px] rounded-[50%]" style={{background:r?.sevDot}} />
{r?.sev}
</div>
<div>
<span className="p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.stBg,color:r?.stFg}}>
{r?.st}
</span>
</div>
</div>
</Fragment>))}
{al?.empty ? (<>
<div className="p-[56px_24px] text-center text-text-3 text-[13.5px]">
<div className="font-semibold text-text text-[15px] mb-[4px]">
{al?.emptyT}
</div>
{al?.emptyD}
</div>
</>) : null}
</div>
</div>
{al?.hasD ? (<>
<aside className="flex-[1_1_360px] max-w-[480px] min-w-[0] bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden self-start [animation:ssIn_.16s_ease-out]">
<div className="p-[16px] flex gap-[12px] items-center border-b border-solid border-b-border">
<div className="w-[44px] h-[44px] rounded-[50%] flex-none grid place-items-center font-semibold" style={{background:al?.d?.avBg,color:al?.d?.avFg}}>
{al?.d?.ini}
</div>
<div className="min-w-[0] flex-1">
<div className="font-semibold text-[15.5px]">
{al?.d?.name}
</div>
<div className="text-[12.5px] text-text-3">
{al?.d?.role}{" · "}{al?.d?.site}{", "}{al?.d?.branch}
</div>
</div>
<span className="p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:al?.d?.stBg,color:al?.d?.stFg}}>
{al?.d?.st}
</span>
</div>
<div className="p-[16px] flex flex-col gap-[16px]">
<div className="flex flex-col gap-[6px]">
<span className="inline-flex self-start items-center gap-[6px] p-[4px_10px] rounded-[999px] text-[12.5px] font-medium" style={{background:al?.d?.cBg,color:al?.d?.cFg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:al?.d?.cDot}} />
{al?.d?.chip}
</span>
<div className="text-[13px] text-text-2">
{al?.d?.desc}
</div>
<div className="text-[12px] text-text-3">
{tr("p0_severity_p1",{p0:al?.d?.dt ?? '',p1:al?.d?.sev ?? ''})}
</div>
</div>
<div className="border border-solid border-border rounded-[10px] overflow-hidden">
<svg viewBox="0 0 340 210" width="100%" className="block bg-map-bg">
<rect x="0" y="0" width="340" height="210" fill="var(--map-bg)" />
<rect x="0" y="150" width="340" height="60" fill="var(--map-water)" />
<rect x="12" y="10" width="92" height="56" rx="4" fill="var(--map-block)" />
<rect x="12" y="84" width="92" height="52" rx="4" fill="var(--map-block)" />
<rect x="130" y="10" width="76" height="56" rx="4" fill="var(--map-block)" />
<rect x="236" y="10" width="92" height="56" rx="4" fill="var(--map-block)" />
<rect x="236" y="84" width="92" height="52" rx="4" fill="var(--map-block)" />
<rect x="130" y="130" width="76" height="14" rx="4" fill="var(--map-block)" />
<path d="M0 75H340M0 143H340M117 0V150M222 0V150" stroke="var(--map-road)" strokeWidth="7" fill="none" />
<circle cx="170" cy="105" r={al?.d?.fr} fill="var(--fence)" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 4" />
<circle cx="170" cy="105" r="3.5" fill="var(--accent)" />
{al?.d?.hasPos ? (<>
<line x1="170" y1="105" x2={al?.d?.px} y2={al?.d?.py} stroke={al?.d?.pinC} strokeWidth="1.6" strokeDasharray="3 3" />
<circle cx={al?.d?.px} cy={al?.d?.py} r={al?.d?.accPx} fill={al?.d?.pinC} fillOpacity=".14" stroke={al?.d?.pinC} strokeOpacity=".5" strokeWidth="1" />
<circle cx={al?.d?.px} cy={al?.d?.py} r="6.5" fill={al?.d?.pinC} stroke="#fff" strokeWidth="2" />
</>) : null}
</svg>
<div className="flex gap-[14px] flex-wrap p-[9px_12px] text-[12px] text-text-2 border-t border-solid border-t-border bg-surface-2">
<span className="flex items-center gap-[6px]">
<span className="w-[10px] h-[10px] rounded-[50%] border-[1.5px] border-dashed border-accent bg-fence" />
{tr("geofence_p0_m",{p0:al?.d?.fenceR ?? ''})}
</span>
{al?.d?.hasPos ? (<>
<span className="flex items-center gap-[6px]">
<span className="w-[10px] h-[10px] rounded-[50%]" style={{background:al?.d?.pinC}} />
{tr("reported_position")}
</span>
</>) : null}
{al?.d?.noPos ? (<>
<span>
{tr("no_gps_point_nobody_checked")}
</span>
</>) : null}
</div>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[1px] bg-border border border-solid border-border rounded-[10px] overflow-hidden">
{(al?.d?.facts ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="bg-surface p-[10px_12px]">
<div className="text-[11.5px] text-text-3">
{f?.k}
</div>
<div className="text-[13px] font-medium mt-[2px]" style={{color:f?.c}}>
{f?.v}
</div>
</div>
</Fragment>))}
</div>
<div className="flex gap-[12px] items-center">
<div className="w-[72px] h-[72px] rounded-[10px] flex-none border border-solid border-border [background:repeating-linear-gradient(135deg,var(--surface-2)_0_8px,var(--hover)_8px_16px)] grid place-items-center text-text-3 [font:500_10px_'Geist_Mono',monospace] text-center p-[4px]">
{al?.d?.selfieL}
</div>
<div className="text-[13px] text-text-2">
<div className="font-medium text-text">
{tr("selfie")}
</div>
{al?.d?.selfieD}
</div>
</div>
<div>
<div className="flex items-center justify-between mb-[8px]">
<div className="font-semibold text-[13.5px]">
{tr("employee_flag_history")}
</div>
<span className="[font:600_11px_'Geist_Mono',monospace] p-[3px_7px] rounded-[6px]" style={{background:al?.d?.fhBg,color:al?.d?.fhFg}}>
{tr("p0_in_90_days",{p0:al?.d?.flagCount ?? ''})}
</span>
</div>
<div className="text-[12px] text-text-3 mb-[6px]">
{tr("previous_records_nearby")}
</div>
<div className="border border-solid border-border rounded-[10px] overflow-hidden">
{(al?.d?.prev ?? []).map((p, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[8px_12px] text-[12.5px]" style={{borderTop:p?.bt}}>
<span className="w-[7px] h-[7px] rounded-[50%] flex-none" style={{background:p?.dot}} />
<span className="w-[78px] text-text-2">
{p?.d}
</span>
<span className="[font-family:'Geist_Mono',monospace] text-[12px]">
{p?.t}
</span>
<span className="ml-[auto] text-text-3 text-right">
{p?.n}
</span>
</div>
</Fragment>))}
</div>
</div>
{al?.d?.notes?.length ? (<>
<div className="flex flex-col gap-[8px]">
<div className="font-semibold text-[13.5px]">
{tr("notes")}
</div>
{(al?.d?.notes ?? []).map((n, $index) => (<Fragment key={$index}>
<div className="p-[9px_12px] rounded-[10px] bg-surface-2 border border-solid border-border text-[13px]">
<div className="text-[11.5px] text-text-3 mb-[2px]">
{n?.who}{" · "}{n?.t}
</div>
{n?.txt}
</div>
</Fragment>))}
</div>
</>) : null}
{al?.d?.resolved ? (<>
<div className="p-[12px] rounded-[10px] text-[13px]" style={{background:al?.d?.stBg,color:al?.d?.stFg}}>
<div className="font-semibold">
{al?.d?.resTitle}
</div>
<div className="mt-[2px]">
{al?.d?.resDesc}
</div>
</div>
</>) : null}
{al?.d?.open ? (<>
<div className="flex flex-col gap-[10px] border-t border-solid border-t-border pt-[14px]">
<div className="flex gap-[8px] flex-wrap">
<button onClick={al?.goApprove} className="h-[34px] p-[0_12px] rounded-[9px] border-0 bg-ok-dot text-[color:#fff] text-[13px] font-medium cursor-pointer [outline-offset:2px]" style={{outline:al?.oApprove}}>
{tr("approve_as_valid")}
</button>
<button onClick={al?.goReject} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-bad-dot bg-bad-bg text-bad text-[13px] font-medium cursor-pointer [outline-offset:2px]" style={{outline:al?.oReject}}>
{tr("reject")}
</button>
<button onClick={al?.goContact} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong text-text text-[13px] font-medium cursor-pointer" style={{background:al?.bContact}}>
{tr("contact")}
</button>
<button onClick={al?.goNote} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong text-text text-[13px] font-medium cursor-pointer" style={{background:al?.bNote}}>
{tr("add_note")}
</button>
<button onClick={al?.goEscalate} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong text-text text-[13px] font-medium cursor-pointer" style={{background:al?.bEsc}}>
{tr("escalate")}
</button>
</div>
{al?.aContact ? (<>
<div className="p-[12px] rounded-[10px] bg-surface-2 border border-solid border-border flex flex-col gap-[10px]">
<div className="text-[13px] text-text-2">
{al?.d?.name}{" · "}{al?.d?.phone}
</div>
<div className="flex gap-[8px]">
<button onClick={al?.doCall} className="flex-1 h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("call")}
</button>
<button onClick={al?.doMsg} className="flex-1 h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("send_message")}
</button>
</div>
</div>
</>) : null}
{al?.aForm ? (<>
<div className="p-[12px] rounded-[10px] bg-surface-2 border border-solid border-border flex flex-col gap-[10px]">
<div className="font-semibold text-[13.5px]">
{al?.formT}
</div>
{al?.aReject ? (<>
<div className="flex gap-[8px]">
<button onClick={al?.outAbsent} className="flex-1 h-[34px] rounded-[9px] text-text text-[13px] cursor-pointer" style={{border:`1.5px solid ${al?.bdAbsent}`,background:al?.bgAbsent}}>
{tr("mark_absent")}
</button>
<button onClick={al?.outInvalid} className="flex-1 h-[34px] rounded-[9px] text-text text-[13px] cursor-pointer" style={{border:`1.5px solid ${al?.bdInvalid}`,background:al?.bgInvalid}}>
{tr("mark_record_invalid")}
</button>
</div>
</>) : null}
{al?.aEsc ? (<>
<select value={al?.esc} onChange={al?.onEsc} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(al?.admins ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.v}
</option>
</Fragment>))}
</select>
</>) : null}
<textarea value={al?.txt} onInput={al?.onTxt} rows="3" placeholder={al?.formPh} className="resize-y p-[9px_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]" />
<div className="flex gap-[8px] items-center">
<button onClick={al?.confirm} className="h-[34px] p-[0_14px] rounded-[9px] border-0 text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{background:al?.confBg,opacity:al?.confOp}}>
{al?.confL}
</button>
<button onClick={al?.cancel} className="h-[34px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<span className="text-[12px] text-text-3">
{al?.reqNote}
</span>
</div>
</div>
</>) : null}
</div>
</>) : null}
</div>
</aside>
</>) : null}
</div>
{al?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[60] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop [animation:ssIn_.16s_ease-out]">
{al?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminAlerts(props: any) {
  const tr = useTranslations('AdminAlerts');
  return <AdminAlertsView {...props} tr={tr} />;
}
