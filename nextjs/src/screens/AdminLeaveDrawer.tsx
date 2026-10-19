'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const MGR={pd:'Nadia Koné',cf:'Julien Roche',sd:'Marc Olivier',rl:'Marc Olivier',pv:'Sarah Benoît'};
const TY={annual:['Annual leave','var(--info-bg)','var(--info)'],rtt:['RTT','var(--violet-bg)','var(--violet)'],sick:['Sick leave','var(--orange-bg)','var(--orange)'],family:['Family event','var(--ok-bg)','var(--ok)'],unpaid:['Unpaid','var(--neutral-bg)','var(--neutral)']};
const STS={pending:['Pending','var(--warn-bg)','var(--warn)'],approved:['Approved','var(--ok-bg)','var(--ok)'],rejected:['Rejected','var(--bad-bg)','var(--bad)'],cancelled:['Cancelled','var(--neutral-bg)','var(--neutral)']};
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const REASON={annual:'Planned family trip, booked a few weeks ago. I’ve handed over my tasks to a colleague.',rtt:'Personal appointment that can’t be moved.',sick:'Doctor advised rest. Certificate attached.',family:'Family event, I’ll be back the next day.',unpaid:'Personal matters, I know this is unpaid.'};
const BALT={annual:'Annual leave',rtt:'RTT',sick:'Sick leave',family:'Family event',unpaid:'Unpaid leave'};
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DAY=864e5;
const pms=s=>{const[y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const fd=s=>{const d=new Date(typeof s==='number'?s:pms(s));return d.getUTCDate()+' '+MN[d.getUTCMonth()];};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const dow=t=>(new Date(t).getUTCDay()+6)%7;
class AdminLeaveDrawerBase extends DCLogic {
  state={mode:null,txt:'',notify:true,pg:1,zoom:100,toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  componentDidUpdate(pp){if(pp.req&&this.props.req&&pp.req.id!==this.props.req.id)this.setState({mode:null,txt:'',pg:1,zoom:100});}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  renderVals(){return {d:this.rv()};}
  rv(){
    const s=this.state,p=this.props,r=p.req,all=p.all||[],T=this,site=SN[r.site],t=TY[r.type],av=AV[(r.emp.charCodeAt(0)+r.emp.length)%AV.length],st=STS[r.status],first=r.emp.split(' ')[0];
    const from=pms(r.from),to=pms(r.to),dur=r.half?'½ day ('+r.half+')':r.days===1?'1 day':r.days+' days';
    const facts=[{k:'Dates',v:from===to?fd(from):fd(from)+' – '+fd(to)},{k:'Duration',v:dur+(r.half?'':' · working days')},{k:'Half-day',v:r.half?(r.half==='AM'?'Morning off (until 13:00)':'Afternoon off (from 13:00)'):'Full days'},{k:'Submitted',v:fd(r.sub)+(r.att?' · with attachment':'')}];
    const isPdf=r.type==='sick',w=Math.round(150*s.zoom/100),h=Math.round(190*s.zoom/100);
    const before=r.bal+r.days,over=r.bal<0,overN=Math.abs(r.bal);
    const fmtN=n=>(n<0?'−':'')+Math.abs(n);
    const others=all.filter(o=>o.id!==r.id&&(o.status==='approved'||o.status==='pending')&&SN[o.site][1]===site[1]&&pms(o.from)<=to+7*DAY&&pms(o.to)>=from-0);
    const sameSite=o=>o.site===r.site;
    const calStart=from-dow(from)*DAY,calEnd=Math.max(to+(6-dow(to))*DAY,calStart+13*DAY),cal=[];
    for(let t0=calStart;t0<=calEnd&&cal.length<42;t0+=DAY){const inReq=t0>=from&&t0<=to,offs=others.filter(o=>sameSite(o)&&pms(o.from)<=t0&&pms(o.to)>=t0),wk=dow(t0)>=5;
      cal.push({n:new Date(t0).getUTCDate()===1?fd(t0):new Date(t0).getUTCDate(),bg:inReq?'var(--accent-soft)':'transparent',bd:inReq?'1px solid var(--accent)':'1px solid var(--border)',fg:inReq?'var(--accent)':'var(--text-2)',op:wk&&!inReq?.55:1,dots:offs.slice(0,3).map(()=>1),tip:offs.length?offs.map(o=>o.emp).join(', ')+' off':'',off:offs.length&&inReq?offs.length:0});}
    const maxOff=Math.max(0,...cal.map(c=>c.off)),teamOff=others.filter(o=>sameSite(o)&&pms(o.from)<=to&&pms(o.to)>=from);
    const cov=maxOff>=2?{l:'Understaffed · '+(maxOff+1)+' off at once',bg:'var(--bad-bg)',fg:'var(--bad)'}:maxOff===1?{l:'Tight · 2 off at once',bg:'var(--warn-bg)',fg:'var(--warn)'}:{l:'Well covered',bg:'var(--ok-bg)',fg:'var(--ok)'};
    const ov=others.filter(o=>pms(o.from)<=to&&pms(o.to)>=from).map(o=>({n:o.emp,w:fd(o.from)+(o.from===o.to?'':' – '+fd(o.to)),s:(sameSite(o)?'Same site':'Same branch · '+SN[o.site][0].split(' ')[0])+' · '+(o.status==='approved'?'approved':'pending'),bg:sameSite(o)?'var(--warn-bg)':'var(--neutral-bg)',fg:sameSite(o)?'var(--warn)':'var(--neutral)'}));
    const aff=[];for(let t0=from;t0<=to&&aff.length<7;t0+=DAY){if(dow(t0)>=5)continue;const hh=hash(r.id+t0)%7;aff.push({d:new Date(t0).getUTCDate()+' '+MN[new Date(t0).getUTCMonth()],t:hh===0?'Intervention · Equipment check 14:00–17:00 · will be unassigned':'Regular shift '+(hh%2?'08:00–16:00':'06:00–14:00')+' · '+site[0].split(' ')[0],go:ev=>{ev.preventDefault();this.say('Opening the planner for '+fd(t0)+'…');}});}
    const log=r.log||[];
    const SM=MGR[r.site],mk=(ic,bg,fg,who,act,ac,role,t,c,line)=>({ic,bg,fg,who,act,ac,role,t,c,line:line?'visible':'hidden'});
    const trail=[mk('✓','var(--ok-bg)','var(--ok)',r.emp,'Submitted','var(--text-2)','Employee',fd(r.sub),r.reason?'':'',true)];
    const sk=r.stageKey,decided=r.status==='approved'||r.status==='rejected';
    if(sk==='site') trail.push(mk('2','var(--warn-bg)','var(--warn)',SM,'Awaiting recommendation','var(--warn)','Site manager','Current step','',true));
    else trail.push(mk('✓','var(--ok-bg)','var(--ok)',SM,'Recommended approval','var(--ok)','Site manager',fd(pms(r.sub)+DAY),sk==='rec'||sk==='hr'||sk==='done'||sk==='chg'?(r.type==='sick'?'Certificate looks valid, covered by the team.':'Fine by me — team coverage works.'):'',true));
    const by=(r.stageSub||'').includes(' by ')?r.stageSub.split(' by ').pop().trim():'Claire Vasseur';
    if(r.status==='approved') trail.push(mk('✓','var(--ok-bg)','var(--ok)',by,'Approved','var(--ok)','HR',log.length?'just now':'Decided','',log.length>0));
    else if(r.status==='rejected') trail.push(mk('×','var(--bad-bg)','var(--bad)',by,'Rejected','var(--bad)','HR',log.length?'just now':'Decided',r.rej||'',log.length>0));
    else if(r.status==='cancelled') trail.push(mk('–','var(--neutral-bg)','var(--neutral)',first,'Cancelled','var(--text-3)','Employee','',r.stageSub,false));
    else trail.push(mk(sk==='chg'?'!':'3',sk==='chg'?'var(--orange-bg)':'var(--info-bg)',sk==='chg'?'var(--orange)':'var(--info)','HR','Awaiting decision','var(--text-2)','Claire Vasseur and team',sk==='site'?'Next step':'Current step','',log.length>0));
    log.forEach((l,i)=>trail.push(mk(l.ic,l.bg,l.fg,l.who,l.act,l.ac,l.role,l.t,l.c,i<log.length-1)));
    const hist=all.filter(o=>o.emp===r.emp&&o.id!==r.id&&o.status!=='cancelled').map(o=>({type:TY[o.type][0],tBg:TY[o.type][1],tFg:TY[o.type][2],dates:o.from===o.to?fd(o.from):fd(o.from)+' – '+fd(o.to),days:o.half?'½ d':o.days+' d',st:STS[o.status][0],sBg:STS[o.status][1],sFg:STS[o.status][2]})).concat([{type:'Annual leave',tBg:TY.annual[1],tFg:TY.annual[2],dates:'21 Jul – 1 Aug',days:'10 d',st:'Approved',sBg:STS.approved[1],sFg:STS.approved[2]},{type:'RTT',tBg:TY.rtt[1],tFg:TY.rtt[2],dates:'14 Aug',days:'1 d',st:'Approved',sBg:STS.approved[1],sFg:STS.approved[2]}]).slice(0,4).map((x,i)=>Object.assign({bt:i?'1px solid var(--border)':'0'},x));
    const m=s.mode,need=m!=='approve',tooShort=s.txt.trim().length<3,mT={approve:'Approve request',reject:'Reject request',changes:'Request changes',cancel:'Cancel approved leave'},mP={approve:'Optional note to '+first,reject:'Reason for rejecting (required)',changes:'What should '+first+' change? (required)',cancel:'Reason for cancelling (required)'},mB={approve:'Approve',reject:'Reject',changes:'Send request',cancel:'Cancel leave'};
    const pend=r.status==='pending',canDecide=pend&&r.stageKey!=='chg';
    return {
      close:()=>p.onClose&&p.onClose(),stop:ev=>ev.stopPropagation(),id:r.id,name:r.emp,first,ini:r.emp.split(' ').map(x=>x[0]).join('').slice(0,2),avBg:av[0],avFg:av[1],role:r.role,site:site[0],branch:site[1],st:st[0],stBg:st[1],stFg:st[2],type:t[0],tBg:t[1],tFg:t[2],facts,reason:REASON[r.type],
      hasAtt:!!r.att,att:{name:isPdf?'Medical certificate.pdf':'Event invitation.jpg',pdf:isPdf,pg:s.pg,pPrev:()=>this.setState({pg:Math.max(1,s.pg-1)}),pNext:()=>this.setState({pg:Math.min(2,s.pg+1)}),zIn:()=>this.setState({zoom:Math.min(200,s.zoom+25)}),zOut:()=>this.setState({zoom:Math.max(50,s.zoom-25)}),zoom:s.zoom,w:isPdf?w:Math.round(w*1.5),h:isPdf?h:Math.round(h*.8),label:isPdf?'PDF PAGE '+s.pg:'IMAGE',dl:()=>this.say('Download started')},
      balType:BALT[r.type],bal:[{k:'Before',v:fmtN(before),c:'var(--text)',bd:'var(--border)',bg:'var(--surface)'},{k:'Requested',v:'− '+(r.half?'0.5':r.days),c:'var(--accent)',bd:'var(--accent)',bg:'var(--accent-soft)'},{k:'After',v:fmtN(r.bal),c:over?'var(--bad)':'var(--ok)',bd:over?'var(--bad-dot)':'var(--border)',bg:over?'var(--bad-bg)':'var(--surface)'}],over,overN,overPl:overN===1?'':'s',
      cal,cov,others:ov,noOthers:ov.length===0,aff,noAff:aff.length===0,trail,hist,
      mode:!!m,mTitle:mT[m]||'',mPh:mP[m]||'',txt:s.txt,onTxt:ev=>this.setState({txt:ev.target.value}),txtBd:'var(--border-strong)',mBtn:mB[m]||'',mBg:m==='approve'?'var(--ok-dot)':m==='changes'?'var(--accent)':'var(--bad-dot)',mOp:need&&tooShort?.45:1,
      notify:s.notify,togNotify:()=>this.setState({notify:!s.notify}),nBg:s.notify?'var(--accent)':'transparent',nBd:s.notify?'var(--accent)':'var(--border-strong)',nOp:s.notify?1:0,mCancel:()=>this.setState({mode:null,txt:''}),
      mGo:()=>{if(need&&tooShort)return;const c=s.txt.trim();p.onDecide&&p.onDecide(r.id,m,c,s.notify);this.setState({mode:null,txt:''});this.say(({approve:'Approved',reject:'Rejected',changes:'Changes requested',cancel:'Leave cancelled'})[m]+(s.notify?' · '+first+' notified':''));},
      idle:!m,canDecide,canCancel:r.status==='approved',final:!canDecide&&r.status!=='approved',finalL:r.status==='pending'?'Waiting for '+first+' to update the request.':'This request is '+st[0].toLowerCase()+'.',
      goApprove:()=>this.setState({mode:'approve',txt:''}),goReject:()=>this.setState({mode:'reject',txt:''}),goChanges:()=>this.setState({mode:'changes',txt:''}),goCancel:()=>this.setState({mode:'cancel',txt:''}),toast:s.toast
    };
  }
}

class AdminLeaveDrawerView extends AdminLeaveDrawerBase {
  view(S) {
    const tr = this.props.tr;
    const { d } = S;
    return (
<>
<div onClick={d?.close} className="fixed inset-[0] z-[55] flex justify-end bg-overlay">
<div onClick={d?.stop} className="w-[min(580px,100%)] h-[100%] bg-bg flex flex-col shadow-pop">
<div className="p-[16px_22px] bg-surface border-b border-solid border-b-border flex gap-[14px] items-center">
<div className="w-[48px] h-[48px] rounded-[50%] flex-none grid place-items-center font-semibold text-[16px]" style={{background:d?.avBg,color:d?.avFg}}>
{d?.ini}
</div>
<div className="flex-1 min-w-[0]">
<div className="flex items-center gap-[10px] flex-wrap">
<div className="font-semibold text-[17px]">
{d?.name}
</div>
<span className="p-[3px_9px] rounded-[6px] text-[12px] font-medium" style={{background:d?.stBg,color:d?.stFg}}>
{d?.st}
</span>
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{d?.role}{" · "}{d?.site}{" · "}{d?.branch}
</div>
</div>
<button onClick={d?.close} aria-label={tr("close")} className="w-[32px] h-[32px] border-0 rounded-[8px] bg-transparent text-text-2 text-[22px] cursor-pointer">
{"×"}
</button>
</div>
<div className="flex-1 overflow-y-auto p-[18px_22px] flex flex-col gap-[16px]">
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="flex items-center justify-between gap-[8px]">
<div className="font-semibold text-[14.5px]">
{tr("request")}{" "}
<span className="[font:12px_'Geist_Mono',monospace] text-text-3 font-normal">
{d?.id}
</span>
</div>
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:d?.tBg,color:d?.tFg}}>
{d?.type}
</span>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[1px] bg-border border border-solid border-border rounded-[10px] overflow-hidden">
{(d?.facts ?? []).map((f, $index) => (<Fragment key={$index}>
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
<div className="p-[10px_12px] rounded-[10px] bg-surface-2 border border-solid border-border text-[13px]">
<div className="text-[11.5px] text-text-3 mb-[2px]">
{tr("reason_from_p0",{p0:d?.first ?? ''})}
</div>
{d?.reason}
</div>
{d?.hasAtt ? (<>
<div className="border border-solid border-border rounded-[10px] overflow-hidden">
<div className="flex items-center gap-[8px] p-[8px_12px] border-b border-solid border-b-border bg-surface-2 text-[12.5px]">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
<path d="M14 3v5h5" />
</svg>
<span className="flex-1 font-medium">
{d?.att?.name}
</span>
{d?.att?.pdf ? (<>
<button onClick={d?.att?.pPrev} aria-label={tr("previous_page")} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent text-text-2 cursor-pointer">
{"‹"}
</button>
<span className="[font:12px_'Geist_Mono',monospace] text-text-2">
{d?.att?.pg}{"/2"}
</span>
<button onClick={d?.att?.pNext} aria-label={tr("next_page")} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent text-text-2 cursor-pointer">
{"›"}
</button>
</>) : null}
<button onClick={d?.att?.zOut} aria-label={tr("zoom_out")} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent text-text-2 cursor-pointer">
{"−"}
</button>
<span className="[font:12px_'Geist_Mono',monospace] text-text-2 w-[38px] text-center">
{d?.att?.zoom}{"%"}
</span>
<button onClick={d?.att?.zIn} aria-label={tr("zoom_in")} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-transparent text-text-2 cursor-pointer">
{"+"}
</button>
<button onClick={d?.att?.dl} className="h-[24px] p-[0_8px] border border-solid border-border-strong rounded-[6px] bg-surface text-text text-[12px] cursor-pointer">
{tr("download")}
</button>
</div>
<div className="h-[190px] overflow-auto bg-hover grid place-items-center p-[14px]">
<div className="flex-none rounded-[4px] [background:repeating-linear-gradient(135deg,var(--surface)_0_10px,var(--surface-2)_10px_20px)] border border-solid border-border-strong shadow-card grid place-items-center text-center [font:500_11px_'Geist_Mono',monospace] text-text-3 p-[8px]" style={{width:`${d?.att?.w}px`,height:`${d?.att?.h}px`}}>
{d?.att?.label}
</div>
</div>
</div>
</>) : null}
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="font-semibold text-[14.5px]">
{tr("p0_balance",{p0:d?.balType ?? ''})}
</div>
<div className="flex items-center gap-[8px]">
{(d?.bal ?? []).map((b, $index) => (<Fragment key={$index}>
<div className="flex-1 p-[10px_12px] rounded-[10px] text-center" style={{border:`1px solid ${b?.bd}`,background:b?.bg}}>
<div className="text-[11.5px] text-text-3">
{b?.k}
</div>
<div className="text-[20px] font-semibold" style={{color:b?.c}}>
{b?.v}
</div>
</div>
</Fragment>))}
</div>
{d?.over ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-bad-bg text-bad text-[13px]">
<b>
{tr("exceeds_balance_by_p0_day",{p0:d?.overN ?? '',p1:d?.overPl ?? ''})}
</b>
{" "}{tr("approving_takes_the_balance_nega")}
</div>
</>) : null}
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="flex items-center justify-between gap-[8px] flex-wrap">
<div className="font-semibold text-[14.5px]">
{tr("coverage_check")}
</div>
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:d?.cov?.bg,color:d?.cov?.fg}}>
{d?.cov?.l}
</span>
</div>
<div className="grid grid-cols-[repeat(7,1fr)] gap-[4px] text-center text-[11px] text-text-3">
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
<div className="grid grid-cols-[repeat(7,1fr)] gap-[4px]">
{(d?.cal ?? []).map((c, $index) => (<Fragment key={$index}>
<div title={c?.tip} className="min-h-[44px] rounded-[8px] p-[4px_5px] flex flex-col justify-between" style={{background:c?.bg,border:c?.bd,color:c?.fg,opacity:c?.op}}>
<span className="text-[11.5px] font-semibold">
{c?.n}
</span>
<span className="flex gap-[2px] min-h-[6px]">
{(c?.dots ?? []).map((x, $index) => (<Fragment key={$index}>
<span className="w-[6px] h-[6px] rounded-[50%] bg-bad-dot" />
</Fragment>))}
</span>
</div>
</Fragment>))}
</div>
<div className="flex gap-[14px] flex-wrap text-[12px] text-text-2">
<span className="flex items-center gap-[6px]">
<span className="w-[10px] h-[10px] rounded-[3px] bg-accent-soft border border-solid border-accent" />
{tr("this_request")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[6px] h-[6px] rounded-[50%] bg-bad-dot" />
{tr("colleague_off")}
</span>
</div>
{d?.others?.length ? (<>
<div className="flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("also_off_during_this_period")}
</div>
{(d?.others ?? []).map((o, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] text-[13px]">
<span className="font-medium">
{o?.n}
</span>
<span className="text-text-3 text-[12.5px]">
{o?.w}
</span>
<span className="ml-[auto] p-[2px_8px] rounded-[6px] text-[12px]" style={{background:o?.bg,color:o?.fg}}>
{o?.s}
</span>
</div>
</Fragment>))}
</div>
</>) : null}
{d?.noOthers ? (<>
<div className="text-[13px] text-ok">
{tr("no_one_else_from_p0",{p0:d?.site ?? ''})}
</div>
</>) : null}
<div className="border-t border-solid border-t-border pt-[12px] flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("schedules_and_interventions_affe",{p0:d?.aff?.length ?? ''})}
</div>
{(d?.aff ?? []).map((a, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] text-[13px] p-[6px_0]">
<span className="w-[78px] font-medium">
{a?.d}
</span>
<span className="flex-1 min-w-[0] text-text-2">
{a?.t}
</span>
<a href="#" onClick={a?.go} className="text-[12.5px]">
{tr("reassign")}
</a>
</div>
</Fragment>))}
{d?.noAff ? (<>
<div className="text-[13px] text-text-3">
{tr("no_scheduled_shifts_fall_on")}
</div>
</>) : null}
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[2px]">
<div className="font-semibold text-[14.5px] mb-[10px]">
{tr("approval_trail")}
</div>
{(d?.trail ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="flex gap-[12px]">
<div className="flex flex-col items-center">
<div className="w-[24px] h-[24px] rounded-[50%] flex-none grid place-items-center [font:700_11px_sans-serif]" style={{background:s?.bg,color:s?.fg}}>
{s?.ic}
</div>
<div className="flex-1 w-[2px] min-h-[14px] bg-border m-[3px_0]" style={{visibility:s?.line}} />
</div>
<div className="flex-1 pb-[12px]">
<div className="text-[13px] font-medium">
{s?.who}{" "}
<span className="font-medium" style={{color:s?.ac}}>
{"· "}{s?.act}
</span>
</div>
<div className="text-[12px] text-text-3">
{s?.role}{" · "}{s?.t}
</div>
{s?.c ? (<>
<div className="mt-[6px] p-[8px_10px] rounded-[8px] bg-surface-2 border border-solid border-border text-[13px] text-text">
{s?.c}
</div>
</>) : null}
</div>
</div>
</Fragment>))}
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_18px] font-semibold text-[14.5px] border-b border-solid border-b-border">
{tr("p0_s_recent_leave",{p0:d?.first ?? ''})}
</div>
{(d?.hist ?? []).map((h, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[10px_18px] text-[13px]" style={{borderTop:h?.bt}}>
<span className="p-[2px_8px] rounded-[999px] text-[11.5px] font-medium" style={{background:h?.tBg,color:h?.tFg}}>
{h?.type}
</span>
<span className="flex-1 text-text-2">
{h?.dates}
</span>
<span className="text-text-3">
{h?.days}
</span>
<span className="p-[2px_8px] rounded-[6px] text-[12px] font-medium" style={{background:h?.sBg,color:h?.sFg}}>
{h?.st}
</span>
</div>
</Fragment>))}
</section>
</div>
<div className="p-[12px_22px] bg-surface border-t border-solid border-t-border flex flex-col gap-[10px]">
{d?.mode ? (<>
<div className="flex flex-col gap-[8px]">
<div className="font-semibold text-[13.5px]">
{d?.mTitle}
</div>
<textarea rows="2" value={d?.txt} onInput={d?.onTxt} placeholder={d?.mPh} className="resize-y p-[9px_10px] rounded-[9px] bg-surface text-text text-[13px] [outline:none]" style={{border:`1px solid ${d?.txtBd}`}} />
<div className="flex items-center gap-[10px] flex-wrap">
<div onClick={d?.togNotify} className="flex items-center gap-[8px] cursor-pointer text-[12.5px] text-text-2">
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${d?.nBd}`,background:d?.nBg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:d?.nOp}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
{tr("notify_p0",{p0:d?.first ?? ''})}
</div>
<div className="flex-1" />
<button onClick={d?.mCancel} className="h-[34px] p-[0_12px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("back")}
</button>
<button onClick={d?.mGo} className="h-[34px] p-[0_16px] rounded-[9px] border-0 text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{background:d?.mBg,opacity:d?.mOp}}>
{d?.mBtn}
</button>
</div>
</div>
</>) : null}
{d?.idle ? (<>
<div className="flex gap-[8px] flex-wrap items-center">
{d?.canDecide ? (<>
<button onClick={d?.goApprove} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-ok-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("approve")}
</button>
<button onClick={d?.goReject} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-bad-dot bg-bad-bg text-bad text-[13px] font-medium cursor-pointer">
{tr("reject")}
</button>
<button onClick={d?.goChanges} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("request_changes")}
</button>
</>) : null}
{d?.canCancel ? (<>
<button onClick={d?.goCancel} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-bad text-[13px] font-medium cursor-pointer">
{tr("cancel_approved_leave")}
</button>
</>) : null}
{d?.final ? (<>
<span className="text-[13px] text-text-3">
{d?.finalL}
</span>
</>) : null}
</div>
</>) : null}
</div>
{d?.toast ? (<>
<div className="fixed bottom-[90px] right-[40px] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{d?.toast}
</div>
</>) : null}
</div>
</div>
</>
    );
  }
}

export default function AdminLeaveDrawer(props: any) {
  const tr = useTranslations('AdminLeaveDrawer');
  return <AdminLeaveDrawerView {...props} tr={tr} />;
}
