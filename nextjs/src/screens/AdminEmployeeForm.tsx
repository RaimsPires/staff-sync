'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const BRS=['Lyon','Paris Nord','Marseille'];
const SITES=[['pd','Part-Dieu Tower','Lyon'],['cf','Confluence Depot','Lyon'],['sd','Saint-Denis Hub','Paris Nord'],['rl','Roissy Logistics','Paris Nord'],['pv','Port Vieux Yard','Marseille']];
const ROLES=[['Employee','Employee'],['Team lead','Team lead'],['Site manager','Site manager'],['Branch manager','Branch manager'],['Admin','Admin']];
const POL={std:['Standard full-time',{annual:25,rtt:10,sick:5,family:4}],part:['Part-time (80%)',{annual:20,rtt:0,sick:5,family:4}],fixed:['Fixed-term / seasonal',{annual:2.5,rtt:0,sick:3,family:2}]};
const BL=[['annual','Annual leave'],['rtt','RTT'],['sick','Sick leave'],['family','Family events']];
const O=a=>a.map(x=>({v:x[0],l:x[1]}));
const mkInit=(emp,count)=>{
  const nm=emp?emp.name.split(' '):['',''];
  const sites=emp?emp.sites.slice():[];
  return {first:nm[0]||'',last:nm.slice(1).join(' '),idMode:emp?'manual':'auto',id:emp?emp.id:'',phone:emp&&emp.phone!=='—'?emp.phone:'',email:'',gender:'',dob:'',photo:null,
    branch:emp?emp.br:'',title:emp?emp.role:'',role:'Employee',scope:'',start:emp?'2024-03-04':'',contract:'cdi',sites,def:sites[0]||'',smart:emp?emp.app!=='none':true,selfie:'inherit',pin:String(1000+Math.floor(Math.random()*9000)),
    policy:'std',bal:Object.assign({},POL.std[1]),sms:true,mail:false,tried:false,toast:null};
};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
class AdminEmployeeFormBase extends DCLogic {
  state=mkInit(this.props.emp,0);
  componentWillUnmount(){ clearTimeout(this.tt); }
  err(){
    const s=this.state,p=this.props,e={},taken=(p.takenIds||[]).filter(i=>!p.emp||i!==p.emp.id);
    if(!s.first.trim()) e.first='First name is required';
    if(!s.last.trim()) e.last='Last name is required';
    if(s.idMode==='manual'){ if(!s.id.trim()) e.id='ID is required'; else if(taken.includes(s.id.trim())) e.id='ID already in use'; }
    if(s.smart){ if(!s.phone.trim()) e.phone='Phone is required for app access'; else if(s.phone.replace(/\D/g,'').length<10) e.phone='Enter a valid phone number'; }
    else if(s.phone.trim()&&s.phone.replace(/\D/g,'').length<10) e.phone='Enter a valid phone number';
    if(s.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) e.email='Enter a valid email address';
    if(s.mail&&s.smart&&!s.email) e.email='Email is required to send an email invite';
    if(!s.branch) e.branch='Choose a branch';
    if(!s.title.trim()) e.title='Job title is required';
    if((s.role==='Site manager'||s.role==='Team lead'||s.role==='Branch manager')&&!s.scope) e.scope='Choose a scope';
    if(!s.start) e.start='Start date is required';
    if(!s.sites.length) e.sites='Assign at least one site';
    return e;
  }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2400); }
  submit(another){
    const p=this.props,add=!p.emp;
    this.setState({tried:true});
    if(Object.keys(this.err()).length) return;
    if(add&&p.count>=p.limit) return;
    const s=this.state;
    const id=s.idMode==='auto'?'E-'+(1061+p.count):s.id.trim();
    p.onSave&&p.onSave({id,name:s.first.trim()+' '+s.last.trim(),branch:s.branch,sites:s.sites.slice(),title:s.title.trim(),phone:s.phone.trim()||'—',smart:s.smart,invite:s.smart&&(s.sms||s.mail),role:s.role,orig:p.emp?p.emp.id:null},another);
    if(another){ this.setState(Object.assign(mkInit(null,0),{toast:'Saved '+s.first+' '+s.last+'. Add the next employee.'})); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2600); }
  }
  renderVals(){ return {ef:this.rv()}; }
  rv(){
    const s=this.state,p=this.props,add=!p.emp,e=s.tried?this.err():{},T=this;
    const set=k=>ev=>this.setState({[k]:ev.target.value});
    const bd=k=>e[k]?'var(--bad-dot)':'var(--border-strong)';
    const inp=(l,k,o)=>Object.assign({l,req:o&&o.req?' *':'',isInput:true,isSel:false,type:'text',val:s[k],on:set(k),ph:'',dis:false,bd:bd(k),bg:'var(--surface)',err:e[k]||'',hc:'var(--bad)',opts:[]},o);
    const sel=(l,k,opts,o)=>Object.assign({l,req:'',isInput:false,isSel:true,type:'',val:s[k],on:set(k),ph:'',dis:false,bd:bd(k),bg:'var(--surface)',err:e[k]||'',hc:'var(--bad)',opts},o);
    const needScope=s.role==='Site manager'||s.role==='Team lead'||s.role==='Branch manager';
    const scopeOpts=[['','Select…']].concat(s.role==='Branch manager'?[['branch','This branch only'],['multi','Several branches']]:[['assigned','Assigned sites only'],['branch','All sites in branch']]);
    const employment=[sel('Branch *','branch',[{v:'',l:'Select…'}].concat(BRS.map(b=>({v:b,l:b})))),inp('Job title *','title',{ph:'e.g. Machinist'}),
      sel('Role (permissions)','role',O(ROLES),{hc:'var(--text-3)',err:e.role||({Employee:'Check-in only',  'Team lead':'Can review the team’s attendance','Site manager':'Manages attendance and leave for sites','Branch manager':'Manages all sites in a branch',Admin:'Full company access'})[s.role]})];
    if(needScope) employment.push(sel('Scope *','scope',O(scopeOpts)));
    employment.push(inp('Start date *','start',{type:'date'}),sel('Contract type','contract',O([['cdi','Permanent (CDI)'],['cdd','Fixed-term (CDD)'],['interim','Temp agency'],['intern','Internship'],['part','Part-time']])));
    const siteRows=SITES.map(([k,n,b])=>{const on=s.sites.includes(k),isD=s.def===k;
      return {name:n,branch:b,on,bg:on?'var(--accent-soft)':'var(--surface)',bd:on?'var(--accent)':'var(--border)',ckBg:on?'var(--accent)':'transparent',ckBd:on?'var(--accent)':'var(--border-strong)',ckOp:on?1:0,
        toggle:()=>this.setState(x=>{const has=x.sites.includes(k),ns=has?x.sites.filter(i=>i!==k):x.sites.concat(k);return {sites:ns,def:ns.includes(x.def)?x.def:(ns[0]||'')};}),
        setDef:()=>this.setState({def:k}),dL:isD?'Default site':'Make default',dBg:isD?'var(--accent)':'var(--surface)',dFg:isD?'#fff':'var(--text-2)',dBd:isD?'var(--accent)':'var(--border-strong)'};});
    const ids=Object.keys(e),left=p.limit-p.count,atLimit=add&&p.count>=p.limit,defSite=SITES.find(x=>x[0]===s.def);
    const cells=[];const h=hash((s.first||'x')+s.last+s.pin);let r=h||1;const rnd=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;r>>>=0;return r;};
    const fin=(x,y)=>x<7&&y<7||x>13&&y<7||x<7&&y>13;
    for(let y=0;y<21;y++)for(let x=0;x<21;x++){
      if(fin(x,y)){const ox=x>13?x-14:x,oy=y>13?y-14:y;if(ox===0||ox===6||oy===0||oy===6||(ox>=2&&ox<=4&&oy>=2&&oy<=4)) cells.push({x,y});}
      else if(x===7||y===7||x===13&&y<8||y===13&&x<8){} else if(rnd()%2) cells.push({x,y});}
    const tog=(k,sw)=>({go:()=>this.setState(x=>({[k]:!x[k]}))});
    const swBg=on=>on?'var(--accent)':'var(--border-strong)',swL=on=>on?'19px':'2px';
    return {
      title:add?'Add employee':'Edit '+s.first+' '+s.last,subtitle:add?'New employees are added to your company roster.':'Changes apply immediately.',
      cancel:()=>p.onCancel&&p.onCancel(),stop:ev=>ev.stopPropagation(),
      atLimit,nearLimit:add&&!atLimit&&left<=2,left,plural:left===1?'':'s',count:p.count,limit:p.limit,hasErr:ids.length>0,errN:ids.length,errPl:ids.length===1?'':'s',
      onPhoto:ev=>{const f=ev.target.files&&ev.target.files[0];this.setState({photo:f?f.name:null});},photoL:s.photo?'Photo added':'Upload photo',photoName:s.photo||'',
      personal:[inp('First name','first',{req:true}),inp('Last name','last',{req:true}),inp('Phone','phone',{req:s.smart,type:'tel',ph:'06 12 34 56 78'}),inp('Email','email',{type:'email',ph:'name@company.com'}),sel('Gender','gender',[{v:'',l:'Prefer not to say'},{v:'f',l:'Female'},{v:'m',l:'Male'},{v:'x',l:'Other'}]),inp('Date of birth (optional)','dob',{type:'date'})],
      idAuto:()=>this.setState({idMode:'auto'}),idManual:()=>this.setState({idMode:'manual'}),
      idAutoBg:s.idMode==='auto'?'var(--accent)':'var(--surface)',idAutoFg:s.idMode==='auto'?'#fff':'var(--text-2)',idManBg:s.idMode==='manual'?'var(--accent)':'var(--surface)',idManFg:s.idMode==='manual'?'#fff':'var(--text-2)',
      id:s.idMode==='auto'?(add?'E-'+(1061+p.count):p.emp.id):s.id,onId:set('id'),idDis:s.idMode==='auto',idBd:e.id?'var(--bad-dot)':'var(--border-strong)',idBg:s.idMode==='auto'?'var(--surface-2)':'var(--surface)',idErr:e.id||'',
      employment,sites:siteRows,sitesErr:e.sites||'',siteHint:s.sites.length?s.sites.length+' assigned · default '+(defSite?defSite[1]:'—'):'None assigned',
      smartHint:s.smart?'Checks in with the StaffSync app.':'Checks in by badge QR with a site manager’s proxy check-in.',togSmart:()=>this.setState(x=>({smart:!x.smart})),smartBg:swBg(s.smart),smartL:swL(s.smart),noPhone:!s.smart,hasPhone:s.smart,
      qr:cells,pin:s.pin,newPin:()=>this.setState({pin:String(1000+Math.floor(Math.random()*9000))}),printBadge:()=>this.say('Badge sent to the printer'),
      selfie:[['inherit','Site default'],['on','Required'],['off','Not required']].map(([v,l])=>({l,bg:s.selfie===v?'var(--accent)':'var(--surface)',fg:s.selfie===v?'#fff':'var(--text-2)',go:()=>this.setState({selfie:v})})),
      selfieHint:s.selfie==='inherit'?'Follows the setting of each assigned site (currently: required at '+(defSite?defSite[1]:'the default site')+').':s.selfie==='on'?'Always required, whatever the site setting.':'Never required for this employee.',
      policy:s.policy,policies:Object.keys(POL).map(k=>({v:k,l:POL[k][0]})),onPolicy:ev=>{const v=ev.target.value;this.setState({policy:v,bal:Object.assign({},POL[v][1])});},
      bal:BL.map(([k,l])=>({l,val:s.bal[k],on:ev=>{const v=ev.target.value;this.setState(x=>({bal:Object.assign({},x.bal,{[k]:v})}));}})),
      invs:[{l:'Send app invite by SMS',h:s.phone.trim()?'To '+s.phone:'Needs a phone number',hc:'var(--text-3)',k:'sms',on:s.sms},{l:'Send app invite by email',h:s.email?'To '+s.email:'Needs an email address',hc:s.mail&&!s.email?'var(--bad)':'var(--text-3)',k:'mail',on:s.mail}].map(v=>({l:v.l,h:v.h,hc:v.hc,bg:swBg(v.on),left:swL(v.on),go:()=>this.setState(x=>({[v.k]:!x[v.k]}))})),
      isAdd:add,save:()=>this.submit(false),saveAnother:()=>this.submit(true),saveOp:atLimit?.45:1,saveL:add?'Save employee':'Save changes',toast:s.toast
    };
  }
}

class AdminEmployeeFormView extends AdminEmployeeFormBase {
  view(S) {
    const tr = this.props.tr;
    const { ef } = S;
    return (
<>
<div onClick={ef?.cancel} className="fixed inset-[0] z-[55] flex justify-end bg-overlay">
<div onClick={ef?.stop} className="w-[min(780px,100%)] h-[100%] bg-bg flex flex-col shadow-pop">
<div className="p-[16px_24px] bg-surface border-b border-solid border-b-border flex items-center justify-between gap-[12px]">
<div>
<div className="font-semibold text-[18px] tracking-[-.01em]">
{ef?.title}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{ef?.subtitle}
</div>
</div>
<button onClick={ef?.cancel} aria-label={tr("close")} className="w-[32px] h-[32px] border-0 rounded-[8px] bg-transparent text-text-2 text-[22px] cursor-pointer">
{"×"}
</button>
</div>
<div className="flex-1 overflow-y-auto p-[20px_24px] flex flex-col gap-[16px]">
{ef?.atLimit ? (<>
<div className="p-[12px_14px] rounded-[10px] bg-bad-bg text-bad text-[13px]">
<b>
{tr("plan_limit_reached")}
</b>
{tr("your_plan_includes_p0_employees",{p0:ef?.limit ?? ''})}
</div>
</>) : null}
{ef?.nearLimit ? (<>
<div className="p-[12px_14px] rounded-[10px] bg-warn-bg text-warn text-[13px]">
<b>
{tr("p0_seat_p1_left",{p0:ef?.left ?? '',p1:ef?.plural ?? ''})}
</b>
{tr("on_your_plan_p0_of",{p0:ef?.count ?? '',p1:ef?.limit ?? ''})}
</div>
</>) : null}
{ef?.hasErr ? (<>
<div className="p-[12px_14px] rounded-[10px] bg-bad-bg text-bad text-[13px] font-medium">
{tr("fix_p0_field_p1_highlighted",{p0:ef?.errN ?? '',p1:ef?.errPl ?? ''})}
</div>
</>) : null}
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[16px]">
<div className="font-semibold text-[15px]">
{tr("personal")}
</div>
<div className="flex gap-[16px] items-center">
<label className="w-[84px] h-[84px] rounded-[50%] flex-none border-[1.5px] border-dashed border-border-strong bg-surface-2 grid place-items-center text-center cursor-pointer text-text-3 text-[11.5px] overflow-hidden">
<input type="file" accept="image/*" onChange={ef?.onPhoto} className="hidden" />
{ef?.photoL}
</label>
<div className="text-[12.5px] text-text-3">
{tr("square_photo_at_least_200")}
<br />
{ef?.photoName}
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
{(ef?.personal ?? []).map((f, $index) => (<Fragment key={$index}>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{f?.l}
<span className="contents text-bad">
{f?.req}
</span>
{f?.isInput ? (<>
<input type={f?.type} value={f?.val} onInput={f?.on} placeholder={f?.ph} disabled={f?.dis} className="h-[36px] p-[0_11px] rounded-[9px] text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${f?.bd}`,background:f?.bg}} />
</>) : null}
{f?.isSel ? (<>
<select value={f?.val} onChange={f?.on} className="h-[36px] p-[0_9px] rounded-[9px] bg-surface text-text text-[13.5px]" style={{border:`1px solid ${f?.bd}`}}>
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
<span className="text-[12px] text-bad font-normal min-h-[0]">
{f?.err}
</span>
</label>
</Fragment>))}
</div>
<div className="flex items-center gap-[10px] flex-wrap">
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
<button onClick={ef?.idAuto} className="h-[32px] p-[0_12px] border-0 text-[12.5px] font-medium cursor-pointer" style={{background:ef?.idAutoBg,color:ef?.idAutoFg}}>
{tr("auto_id")}
</button>
<button onClick={ef?.idManual} className="h-[32px] p-[0_12px] border-0 text-[12.5px] font-medium cursor-pointer" style={{background:ef?.idManBg,color:ef?.idManFg}}>
{tr("manual_id")}
</button>
</div>
<span className="text-[12.5px] text-text-3">
{tr("employee_id")}
</span>
<input value={ef?.id} onInput={ef?.onId} disabled={ef?.idDis} className="h-[34px] w-[130px] p-[0_10px] rounded-[9px] text-text [font:13px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${ef?.idBd}`,background:ef?.idBg}} />
<span className="text-[12px] text-bad">
{ef?.idErr}
</span>
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[16px]">
<div className="font-semibold text-[15px]">
{tr("employment")}
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
{(ef?.employment ?? []).map((f, $index) => (<Fragment key={$index}>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{f?.l}{" "}
{f?.isInput ? (<>
<input type={f?.type} value={f?.val} onInput={f?.on} placeholder={f?.ph} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${f?.bd}`}} />
</>) : null}
{f?.isSel ? (<>
<select value={f?.val} onChange={f?.on} className="h-[36px] p-[0_9px] rounded-[9px] bg-surface text-text text-[13.5px]" style={{border:`1px solid ${f?.bd}`}}>
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
<span className="text-[12px] font-normal" style={{color:f?.hc}}>
{f?.err}
</span>
</label>
</Fragment>))}
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[14px]">
<div className="flex justify-between items-baseline gap-[8px]">
<div className="font-semibold text-[15px]">
{tr("sites")}
</div>
<div className="text-[12.5px] text-text-3">
{ef?.siteHint}
</div>
</div>
<div className="flex flex-col gap-[8px]">
{(ef?.sites ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[12px] p-[10px_12px] rounded-[10px]" style={{border:`1px solid ${s?.bd}`,background:s?.bg}}>
<div onClick={s?.toggle} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-[color:#fff] cursor-pointer" style={{border:`1.5px solid ${s?.ckBd}`,background:s?.ckBg}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:s?.ckOp}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
<div onClick={s?.toggle} className="flex-1 min-w-[0] cursor-pointer">
<div className="text-[13.5px] font-medium">
{s?.name}
</div>
<div className="text-[12px] text-text-3">
{s?.branch}
</div>
</div>
{s?.on ? (<>
<button onClick={s?.setDef} className="h-[28px] p-[0_10px] rounded-[999px] text-[12px] font-medium cursor-pointer" style={{border:`1px solid ${s?.dBd}`,background:s?.dBg,color:s?.dFg}}>
{s?.dL}
</button>
</>) : null}
</div>
</Fragment>))}
</div>
<span className="text-[12px] text-bad">
{ef?.sitesErr}
</span>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[14px]">
<div className="font-semibold text-[15px]">
{tr("attendance")}
</div>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{tr("has_a_smartphone")}
</div>
<div className="text-[12.5px] text-text-3">
{ef?.smartHint}
</div>
</div>
<div onClick={ef?.togSmart} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:ef?.smartBg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:ef?.smartL}} />
</div>
</div>
{ef?.noPhone ? (<>
<div className="flex gap-[18px] items-center p-[14px] rounded-[12px] bg-surface-2 border border-solid border-border flex-wrap">
<div className="w-[116px] h-[116px] rounded-[10px] bg-[color:#fff] border border-solid border-border p-[8px] flex-none">
<svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
{(ef?.qr ?? []).map((c, $index) => (<Fragment key={$index}>
<rect x={c?.x} y={c?.y} width="1" height="1" fill="#0D1B2E" />
</Fragment>))}
</svg>
</div>
<div className="flex flex-col gap-[8px] min-w-[200px] flex-1">
<div className="text-[13.5px] font-medium">
{tr("badge_qr_and_proxy_pin")}
</div>
<div className="text-[12.5px] text-text-3">
{tr("a_site_manager_scans_the")}
</div>
<div className="flex gap-[8px] items-center flex-wrap">
<span className="[font:600_22px_'Geist_Mono',monospace] tracking-[.3em] p-[4px_12px] rounded-[9px] bg-surface border border-solid border-border-strong">
{ef?.pin}
</span>
<button onClick={ef?.newPin} className="h-[32px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("new_pin")}
</button>
<button onClick={ef?.printBadge} className="h-[32px] p-[0_11px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[12.5px] font-medium cursor-pointer">
{tr("print_badge")}
</button>
</div>
</div>
</div>
</>) : null}
<div className="flex flex-col gap-[6px]">
<div className="text-[13.5px] font-medium">
{tr("selfie_at_check_in")}
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden self-start">
{(ef?.selfie ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="h-[32px] p-[0_13px] border-0 text-[12.5px] font-medium cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
<div className="text-[12.5px] text-text-3">
{ef?.selfieHint}
</div>
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[14px]">
<div className="font-semibold text-[15px]">
{tr("leave")}
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2 max-w-[360px]">
{tr("leave_policy")}
<select value={ef?.policy} onChange={ef?.onPolicy} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(ef?.policies ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-[12px]">
{(ef?.bal ?? []).map((b, $index) => (<Fragment key={$index}>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{b?.l}
<div className="flex items-center gap-[6px]">
<input type="number" min="0" step="0.5" value={b?.val} onInput={b?.on} className="h-[36px] w-[100%] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" />
<span className="text-[12px] text-text-3 font-normal">
{tr("days")}
</span>
</div>
</label>
</Fragment>))}
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[15px]">
{tr("invitation")}
</div>
{ef?.noPhone ? (<>
<div className="text-[13px] text-text-3">
{tr("no_smartphone_there_is_no")}
</div>
</>) : null}
{ef?.hasPhone ? (<>
{(ef?.invs ?? []).map((v, $index) => (<Fragment key={$index}>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{v?.l}
</div>
<div className="text-[12.5px]" style={{color:v?.hc}}>
{v?.h}
</div>
</div>
<div onClick={v?.go} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:v?.bg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:v?.left}} />
</div>
</div>
</Fragment>))}
</>) : null}
</section>
</div>
<div className="p-[12px_24px] bg-surface border-t border-solid border-t-border flex gap-[8px] items-center flex-wrap">
<button onClick={ef?.cancel} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<div className="flex-1" />
{ef?.isAdd ? (<>
<button onClick={ef?.saveAnother} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer" style={{opacity:ef?.saveOp}}>
{tr("save_and_add_another")}
</button>
</>) : null}
<button onClick={ef?.save} className="h-[36px] p-[0_18px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:ef?.saveOp}}>
{ef?.saveL}
</button>
</div>
{ef?.toast ? (<>
<div className="fixed bottom-[80px] right-[40px] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{ef?.toast}
</div>
</>) : null}
</div>
</div>
</>
    );
  }
}

export default function AdminEmployeeForm(props: any) {
  const tr = useTranslations('AdminEmployeeForm');
  return <AdminEmployeeFormView {...props} tr={tr} />;
}
