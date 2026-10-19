'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminEmployeeProfile from './AdminEmployeeProfile';
import AdminEmployeeForm from './AdminEmployeeForm';

const SN={pd:'Part-Dieu Tower',cf:'Confluence Depot',sd:'Saint-Denis Hub',rl:'Roissy Logistics',pv:'Port Vieux Yard'};
const BRS=['Lyon','Paris Nord','Marseille'];
const BRK={Lyon:['pd','cf'],'Paris Nord':['sd','rl'],Marseille:['pv']};
const ROLES=['Machinist','Forklift operator','Cleaner','Technician','Electrician','Driver','Loader','Inspector','Site manager'];
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const E=(id,name,br,sites,role,phone,app,att,st)=>({id,name,br,sites,role,phone,app,att,st});
const EMPS=[
E('E-1042','Amélie Fontaine','Paris Nord',['sd'],'Machinist','06 12 45 78 01','installed',96,'active'),
E('E-1043','Karim Benali','Paris Nord',['rl','sd'],'Forklift operator','06 23 11 90 42','installed',88,'active'),
E('E-1044','Léa Moreau','Lyon',['pd'],'Cleaner','06 78 20 14 55','installed',93,'active'),
E('E-1045','Thomas Girard','Lyon',['cf'],'Technician','06 45 67 12 03','installed',81,'active'),
E('E-1046','Inès Haddad','Marseille',['pv'],'Electrician','06 90 12 33 71','installed',98,'active'),
E('E-1047','Paul Lambert','Paris Nord',['sd'],'Driver','06 31 88 20 17','installed',74,'active'),
E('E-1048','Sofia Rossi','Paris Nord',['rl'],'Loader','06 55 41 09 26','installed',91,'active'),
E('E-1049','Hugo Petit','Paris Nord',['sd'],'Machinist','06 02 64 18 80','installed',85,'active'),
E('E-1050','Nora Diallo','Lyon',['cf','pd'],'Inspector','06 71 30 55 92','installed',100,'active'),
E('E-1051','Yanis Boucher','Paris Nord',['sd'],'Machinist','06 83 27 41 63','invited',0,'invited'),
E('E-1052','Camille Roux','Paris Nord',['rl'],'Loader','06 14 92 70 38','invited',0,'invited'),
E('E-1053','Mehdi Cherif','Lyon',['pd'],'Technician','06 66 05 83 29','invited',0,'invited'),
E('E-1054','Elena Marchand','Lyon',['cf'],'Cleaner','06 49 18 62 07','installed',89,'active'),
E('E-1055','Bastien Leroy','Marseille',['pv'],'Driver','06 27 74 15 90','installed',79,'active'),
E('E-1056','Georges Aubert','Lyon',['pd'],'Cleaner','—','none',92,'active'),
E('E-1057','Monique Vidal','Marseille',['pv'],'Cleaner','—','none',95,'active'),
E('E-1058','Damien Lopez','Lyon',['pd'],'Cleaner','06 38 52 11 74','installed',64,'deactivated'),
E('E-1059','Chloé Garnier','Lyon',['cf'],'Technician','06 99 07 46 18','installed',58,'deactivated'),
E('E-1060','Marc Olivier','Paris Nord',['sd','rl'],'Site manager','06 20 81 37 52','installed',99,'active')
];
const CSVH=['Full name','Emp ID','Mobile','Branch','Site','Job title'];
const CSV=[['Julie Perrin','E-2001','06 11 22 33 44','Lyon','Part-Dieu Tower','Cleaner'],['Antoine Mercier','E-2002','06 55 66 77 88','Paris Nord','Saint-Denis Hub','Driver'],['','E-2003','06 12 12 12 12','Lyon','Confluence Depot','Technician'],['Lucie Faure','E-1042','06 98 76 54 32','Marseille','Port Vieux Yard','Loader'],['Rayan Said','E-2005','0612','Paris Nord','Roissy Logistics','Machinist'],['Eva Blanc','E-2006','06 40 50 60 70','Lyon','Gare Nord Annex','Inspector'],['Noé Carpentier','E-2007','06 21 31 41 51','Marseille','Port Vieux Yard','Astronaut'],['Manon Robin','E-2008','06 61 71 81 91','Lyon','Part-Dieu Tower','Electrician']];
const FIELDS=[['name','Full name',1],['id','Employee ID',1],['phone','Phone',0],['branch','Branch',1],['site','Site',1],['role','Role',1]];
const DEFMAP={name:0,id:1,phone:2,branch:3,site:4,role:5};
const APP={installed:['Installed','var(--ok-bg)','var(--ok)','var(--ok-dot)'],invited:['Invited','var(--info-bg)','var(--info)','var(--info-dot)'],none:['No smartphone','var(--neutral-bg)','var(--neutral)','var(--neutral-dot)']};
const ST={active:['Active','var(--ok-bg)','var(--ok)'],invited:['Invited','var(--info-bg)','var(--info)'],deactivated:['Deactivated','var(--neutral-bg)','var(--neutral)']};
const ini=n=>{const w=n.split(' ');return (w[0][0]+(w[1]?w[1][0]:'')).toUpperCase();};
class AdminEmployeesBase extends DCLogic {
  state={emps:EMPS,q:'',br:'all',site:'all',role:'all',st:'all',sp:'all',menu:null,confirm:null,toast:null,imp:false,form:null,prof:null,step:1,file:null,map:Object.assign({},DEFMAP),added:0};
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2600); }
  vis(){
    const s=this.state,q=s.q.trim().toLowerCase().replace(/\s/g,'');
    return s.emps.filter(e=>(s.br==='all'||e.br===s.br)&&(s.site==='all'||e.sites.includes(s.site))&&(s.role==='all'||e.role===s.role)&&(s.st==='all'||e.st===s.st)&&(s.sp==='all'||(s.sp==='yes')===(e.app!=='none'))&&(!q||e.name.toLowerCase().replace(/\s/g,'').includes(q)||e.id.toLowerCase().includes(q)||e.phone.replace(/\s/g,'').includes(q)));
  }
  upd(id,p){ this.setState(s=>({emps:s.emps.map(e=>e.id===id?Object.assign({},e,p):e),menu:null})); }
  validate(){
    const m=this.state.map,seen={},ids=new Set(this.state.emps.map(e=>e.id)),sites=Object.values(SN),g=(r,k)=>m[k]>=0&&m[k]!==''&&m[k]!=null?(r[m[k]]||'').trim():'';
    return CSV.map((r,i)=>{
      const o={n:i+1,name:g(r,'name'),id:g(r,'id'),phone:g(r,'phone'),site:g(r,'site'),role:g(r,'role'),branch:g(r,'branch')},er=[];
      if(!o.name) er.push('Full name is required');
      if(!o.id) er.push('Employee ID is required'); else if(ids.has(o.id)||seen[o.id]) er.push('Employee ID '+o.id+' already exists'); seen[o.id]=1;
      if(o.phone&&o.phone.replace(/\D/g,'').length<10) er.push('Phone "'+o.phone+'" is not a valid number');
      if(o.site&&!sites.includes(o.site)) er.push('Unknown site "'+o.site+'"');
      if(o.role&&!ROLES.includes(o.role)) er.push('Unknown role "'+o.role+'"');
      o.err=er.join(' · ');return o;
    });
  }
  dl(name,txt){ try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/csv'}));a.download=name;a.click();}catch(e){} }
  renderVals(){ return {em:this.rv()}; }
  rv(){
    const s=this.state,T=this,rows0=this.vis();
    const set=k=>e=>this.setState({[k]:e.target.value});
    const sitesAvail=Object.keys(SN).filter(k=>s.br==='all'||BRK[s.br].includes(k));
    const rows=rows0.map((e,i)=>{
      const a=APP[e.app],st=ST[e.st],av=AV[(e.name.charCodeAt(0)+e.name.length)%AV.length],open=s.menu===e.id;
      const acts=[{l:'View profile',c:'var(--text)',go:()=>this.setState({menu:null,prof:e.id})},{l:'Edit',c:'var(--text)',go:()=>this.setState({menu:null,form:{id:e.id}})}];
      if(e.app==='invited'||(e.st==='invited')) acts.push({l:'Resend invite',c:'var(--text)',go:()=>{this.setState({menu:null});this.say('Invite resent to '+e.name);}});
      if(e.app==='installed') acts.push({l:'Reset device',c:'var(--text)',go:()=>{this.setState({menu:null});this.say(e.name+'’s device was reset');}});
      acts.push(e.st==='deactivated'?{l:'Reactivate',c:'var(--ok)',go:()=>{this.upd(e.id,{st:e.app==='invited'?'invited':'active'});this.say(e.name+' reactivated');}}:{l:'Deactivate',c:'var(--bad)',go:()=>this.setState({menu:null,confirm:e.id})});
      const ac=e.st==='deactivated'||e.app==='invited'?'—':e.att+'%';
      return {id:e.id,name:e.name,ini:ini(e.name),avBg:av[0],avFg:av[1],branch:e.br,sites:e.sites.map(k=>SN[k]),role:e.role,phone:e.phone,app:a[0],apBg:a[1],apFg:a[2],apDot:a[3],att:e.app==='invited'?'—':e.att+'%',attW:(e.app==='invited'?0:e.att)+'%',attC:e.att>=90?'var(--ok-dot)':e.att>=75?'var(--warn-dot)':'var(--bad-dot)',st:st[0],stBg:st[1],stFg:st[2],op:e.st==='deactivated'?.62:1,
        view:ev=>{ev.preventDefault();this.setState({prof:e.id});},menu:ev=>{ev.stopPropagation();this.setState({menu:open?null:e.id});},mbg:open?'var(--hover)':'transparent',menuOpen:open,mtop:i>=rows0.length-3&&rows0.length>4?'auto':'48px',acts};
    });
    rows.forEach(r=>{ if(r.mtop==='auto') r.mtop='-150px'; });
    const cnt=s.emps.length,act=s.emps.filter(e=>e.st==='active').length,inv=s.emps.filter(e=>e.st==='invited').length;
    const conf=s.confirm&&s.emps.find(e=>e.id===s.confirm);
    const hdr=CSVH,pv=s.step>=3?this.validate():[],ok=pv.filter(p=>!p.err).length,bad=pv.length-ok;
    const missing=FIELDS.some(([k,,r])=>r&&(s.map[k]===''||s.map[k]==null||s.map[k]<0));
    const stepsL=['Upload','Map columns','Preview','Result'];
    const next=()=>{ const st=s.step;
      if(st===1&&s.file) this.setState({step:2});
      else if(st===2&&!missing) this.setState({step:3});
      else if(st===3){ if(!ok) return; const add=pv.filter(p=>!p.err).map((p,i)=>{const br=p.branch&&BRS.includes(p.branch)?p.branch:'Lyon',sk=Object.keys(SN).find(k=>SN[k]===p.site);return E(p.id,p.name,br,sk?[sk]:[],p.role||'Cleaner',p.phone||'—',p.phone?'invited':'none',0,'invited');});
        this.setState(x=>({step:4,added:add.length,emps:x.emps.concat(add)})); }
      else if(st===4) this.setState({imp:false}); };
    return {
      sub:cnt+' employees · '+act+' active · '+inv+' invited',q:s.q,onQ:set('q'),stop:e=>e.stopPropagation(),closeMenu:()=>{ if(s.menu) this.setState({menu:null}); },
      filters:[
        {val:s.br,on:e=>this.setState({br:e.target.value,site:'all'}),opts:[{v:'all',l:'All branches'}].concat(BRS.map(b=>({v:b,l:b})))},
        {val:s.site,on:set('site'),opts:[{v:'all',l:'All sites'}].concat(sitesAvail.map(k=>({v:k,l:SN[k]})))},
        {val:s.role,on:set('role'),opts:[{v:'all',l:'All roles'}].concat(ROLES.map(r=>({v:r,l:r})))},
        {val:s.st,on:set('st'),opts:[{v:'all',l:'Any status'},{v:'active',l:'Active'},{v:'invited',l:'Invited'},{v:'deactivated',l:'Deactivated'}]},
        {val:s.sp,on:set('sp'),opts:[{v:'all',l:'Smartphone: any'},{v:'yes',l:'Has smartphone'},{v:'no',l:'No smartphone'}]}],
      hasFilter:s.br!=='all'||s.site!=='all'||s.role!=='all'||s.st!=='all'||s.sp!=='all'||!!s.q,
      clearF:()=>this.setState({br:'all',site:'all',role:'all',st:'all',sp:'all',q:''}),
      rows,empty:rows.length===0,
      add:()=>this.setState({form:{}}),profOpen:!!s.prof,listDisp:s.prof?'none':'flex',profEmp:s.prof?s.emps.find(x=>x.id===s.prof):null,profBack:()=>this.setState({prof:null}),profEdit:()=>this.setState({form:{id:s.prof}}),profAction:k=>{if(k==='deactivate')this.setState({confirm:s.prof});else{const q=s.emps.find(x=>x.id===s.prof);this.upd(s.prof,{st:q.app==='invited'?'invited':'active'});this.say(q.name+' reactivated');}},formOpen:!!s.form,formMode:s.form&&s.form.id?'edit':'add',formEmp:s.form&&s.form.id?s.emps.find(x=>x.id===s.form.id):null,cnt:s.emps.length,limit:20,ids:s.emps.map(x=>x.id),formCancel:()=>this.setState({form:null}),formSave:(d,another)=>{this.setState(x=>{const app=d.smart?(d.invite?'invited':'installed'):'none';if(d.orig){return {emps:x.emps.map(y=>y.id===d.orig?Object.assign({},y,{id:d.id,name:d.name,br:d.branch,sites:d.sites,role:d.title,phone:d.phone,app:y.app==='installed'&&d.smart?'installed':app}):y),form:another?x.form:null};}return {emps:x.emps.concat(E(d.id,d.name,d.branch,d.sites,d.title,d.phone,app,0,d.smart&&d.invite?'invited':d.smart?'invited':'active')),form:another?x.form:null};});this.say(d.orig?d.name+' updated':d.name+' added'+(d.invite?' · invite sent':''));},doExport:()=>{this.dl('employees.csv','Name,ID,Branch,Role,Phone,Status\n'+rows0.map(e=>[e.name,e.id,e.br,e.role,e.phone,e.st].join(',')).join('\n'));this.say('Exported '+rows0.length+' employees');},
      confirmOpen:!!conf,confirmName:conf?conf.name:'',confirmNo:()=>this.setState({confirm:null}),confirmYes:()=>{const n=conf.name;this.upd(conf.id,{st:'deactivated'});this.setState({confirm:null});this.say(n+' deactivated');},
      imp:s.imp,openImport:()=>this.setState({imp:true,step:1,file:null,map:Object.assign({},DEFMAP)}),closeImport:()=>this.setState({imp:false}),
      steps:stepsL.map((l,i)=>{const n=i+1,on=n===s.step,dn=n<s.step;return {l,n:dn?'✓':n,bg:on?'var(--accent)':dn?'var(--ok-bg)':'var(--neutral-bg)',nfg:on?'#fff':dn?'var(--ok)':'var(--neutral)',fg:on?'var(--text)':'var(--text-3)',fw:on?600:500};}),
      s1:s.step===1,s2:s.step===2,s3:s.step===3,s4:s.step===4,
      tpl:()=>{this.dl('staffsync-employees-template.csv','Full name,Employee ID,Phone,Branch,Site,Role\nJane Doe,E-3001,06 00 00 00 00,Lyon,Part-Dieu Tower,Cleaner');this.say('Template downloaded');},
      onFile:e=>{const f=e.target.files&&e.target.files[0];if(f) this.setState({file:f.name});},useSample:()=>this.setState({file:'employees-sample.csv'}),
      fileName:s.file||'Choose a CSV file',fileHint:s.file?'Ready · 8 rows. Click to replace.':'or drag it here · .csv up to 5 MB',dropBd:s.file?'var(--ok-dot)':'var(--border-strong)',dropBg:s.file?'var(--ok-bg)':'var(--surface-2)',
      rowCount:CSV.length,missing,
      map:FIELDS.map(([k,l,r],i)=>({l,req:r?' *':'',bt:i?'1px solid var(--border)':'0',val:s.map[k]===''||s.map[k]==null?'':String(s.map[k]),bd:r&&(s.map[k]===''||s.map[k]==null)?'var(--bad-dot)':'var(--border-strong)',
        on:e=>{const v=e.target.value;this.setState(x=>({map:Object.assign({},x.map,{[k]:v===''?'':+v})}));},opts:[{v:'',l:'— Skip —'}].concat(hdr.map((h,j)=>({v:String(j),l:h}))),ex:s.map[k]===''||s.map[k]==null?'':'e.g. '+CSV[0][s.map[k]]})),
      prev:pv.map(p=>({n:p.n,name:p.name||'—',id:p.id||'—',phone:p.phone||'—',site:p.site||'—',role:p.role||'—',err:p.err,bg:p.err?'var(--bad-bg)':'transparent'})),nOk:ok,nBad:bad,
      result:[{n:s.added,l:'Imported',c:'var(--ok)'},{n:bad,l:'Skipped (errors)',c:bad?'var(--bad)':'var(--text-3)'},{n:0,l:'Updated',c:'var(--text-3)'}],
      errCsv:()=>{this.dl('skipped-rows.csv','Row,Error\n'+pv.filter(p=>p.err).map(p=>p.n+',"'+p.err+'"').join('\n'));},
      back:()=>this.setState({step:Math.max(1,s.step-1)}),backVis:s.step===1||s.step===4?'hidden':'visible',
      next,nextL:s.step===1?'Continue':s.step===2?'Preview':s.step===3?'Import '+ok+' employees':'Done',nextOp:(s.step===1&&!s.file)||(s.step===2&&missing)||(s.step===3&&!ok)?.45:1,
      toast:s.toast
    };
  }
}

class AdminEmployeesView extends AdminEmployeesBase {
  view(S) {
    const tr = this.props.tr;
    const { em } = S;
    return (
<>
<div onClick={em?.closeMenu} className="flex flex-col gap-[14px] relative">
{em?.profOpen ? (<>
<AdminEmployeeProfile emp={em?.profEmp} onBack={em?.profBack} onEdit={em?.profEdit} onAction={em?.profAction} />
</>) : null}
<div className="flex-col gap-[14px]" style={{display:em?.listDisp}}>
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("employees")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{em?.sub}
</div>
</div>
<div className="flex gap-[8px] flex-wrap">
<button onClick={em?.doExport} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("export")}
</button>
<button onClick={em?.openImport} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("import_csv")}
</button>
<button onClick={em?.add} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer hover:bg-accent-hover">
{tr("add_employee")}
</button>
</div>
</div>
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex items-center gap-[8px] h-[34px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3 flex-[1_1_220px] max-w-[320px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={em?.q} onInput={em?.onQ} placeholder={tr("search_name_id_or_phone")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%]" />
</div>
{(em?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
{em?.hasFilter ? (<>
<button onClick={em?.clearF} className="h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("clear_filters")}
</button>
</>) : null}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[1240px]">
<div className="grid grid-cols-[minmax(200px,1.5fr)_84px_100px_minmax(170px,1.3fr)_minmax(110px,.9fr)_126px_112px_120px_96px_36px] gap-[12px] items-center p-[0_14px] h-[38px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div>
{tr("employee")}
</div>
<div>
{tr("id")}
</div>
<div>
{tr("branch")}
</div>
<div>
{tr("sites")}
</div>
<div>
{tr("role")}
</div>
<div>
{tr("phone")}
</div>
<div>
{tr("app")}
</div>
<div>
{tr("attendance")}
</div>
<div>
{tr("status")}
</div>
<div />
</div>
{(em?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(200px,1.5fr)_84px_100px_minmax(170px,1.3fr)_minmax(110px,.9fr)_126px_112px_120px_96px_36px] gap-[12px] items-center p-[10px_14px] border-b border-solid border-b-border text-[13px] relative hover:bg-hover" style={{opacity:r?.op}}>
<div className="flex items-center gap-[10px] min-w-[0]">
<div className="w-[34px] h-[34px] rounded-[50%] flex-none grid place-items-center text-[12px] font-semibold" style={{background:r?.avBg,color:r?.avFg}}>
{r?.ini}
</div>
<a href="#" onClick={r?.view} className="font-medium text-text whitespace-nowrap overflow-hidden text-ellipsis">
{r?.name}
</a>
</div>
<div className="[font:12px_'Geist_Mono',monospace] text-text-2">
{r?.id}
</div>
<div className="text-text-2">
{r?.branch}
</div>
<div className="flex gap-[4px] flex-wrap">
{(r?.sites ?? []).map((s, $index) => (<Fragment key={$index}>
<span className="p-[2px_7px] rounded-[6px] bg-neutral-bg text-neutral text-[12px] whitespace-nowrap">
{s}
</span>
</Fragment>))}
</div>
<div className="text-text-2">
{r?.role}
</div>
<div className="[font:12px_'Geist_Mono',monospace] text-text-2">
{r?.phone}
</div>
<div>
<span className="inline-flex items-center gap-[6px] p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:r?.apBg,color:r?.apFg}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:r?.apDot}} />
{r?.app}
</span>
</div>
<div className="flex items-center gap-[8px]">
<div className="flex-1 h-[6px] rounded-[3px] bg-neutral-bg overflow-hidden">
<div className="h-[100%]" style={{width:r?.attW,background:r?.attC}} />
</div>
<span className="[font:12px_'Geist_Mono',monospace] text-text-2 w-[34px] text-right">
{r?.att}
</span>
</div>
<div>
<span className="p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.stBg,color:r?.stFg}}>
{r?.st}
</span>
</div>
<button onClick={r?.menu} aria-label={tr("row_actions")} className="w-[30px] h-[30px] rounded-[8px] border-0 text-text-2 cursor-pointer grid place-items-center hover:bg-hover" style={{background:r?.mbg}}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
<circle cx="12" cy="5" r="1.8" />
<circle cx="12" cy="12" r="1.8" />
<circle cx="12" cy="19" r="1.8" />
</svg>
</button>
{r?.menuOpen ? (<>
<div onClick={em?.stop} className="absolute right-[14px] z-[20] w-[200px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop" style={{top:r?.mtop}}>
{(r?.acts ?? []).map((a, $index) => (<Fragment key={$index}>
<button onClick={a?.go} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-[13px] cursor-pointer hover:bg-hover" style={{color:a?.c}}>
{a?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
</Fragment>))}
{em?.empty ? (<>
<div className="p-[56px_24px] text-center text-text-3 text-[13.5px]">
<div className="font-semibold text-text text-[15px] mb-[4px]">
{tr("no_employees_found")}
</div>
{tr("try_changing_or_clearing_the")}
</div>
</>) : null}
</div>
</div>
</div>
{em?.confirmOpen ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[400px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[16px]">
{tr("deactivate_p0",{p0:em?.confirmName ?? ''})}
</div>
<div className="text-[13.5px] text-text-2">
{tr("they_will_no_longer_be")}
</div>
<div className="flex gap-[8px] justify-end">
<button onClick={em?.confirmNo} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={em?.confirmYes} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("deactivate")}
</button>
</div>
</div>
</div>
</>) : null}
{em?.imp ? (<>
<div onClick={em?.stop} className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[760px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex items-center justify-between gap-[12px]">
<div className="font-semibold text-[16px]">
{tr("import_employees_from_csv")}
</div>
<button onClick={em?.closeImport} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="flex gap-[6px] p-[12px_20px] border-b border-solid border-b-border bg-surface-2 flex-wrap">
{(em?.steps ?? []).map((st, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[8px] text-[12.5px] mr-[14px]" style={{color:st?.fg,fontWeight:st?.fw}}>
<span className="w-[22px] h-[22px] rounded-[50%] grid place-items-center [font:600_11px_'Geist_Mono',monospace]" style={{background:st?.bg,color:st?.nfg}}>
{st?.n}
</span>
{st?.l}
</div>
</Fragment>))}
</div>
<div className="p-[20px] overflow-y-auto flex flex-col gap-[16px]">
{em?.s1 ? (<>
<div className="flex items-center justify-between gap-[12px] p-[12px_14px] rounded-[10px] border border-solid border-border flex-wrap">
<div>
<div className="font-medium text-[13.5px]">
{tr("1_download_the_template")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("columns_full_name_employee_id")}
</div>
</div>
<button onClick={em?.tpl} className="h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("download_template")}
</button>
</div>
<label className="flex flex-col items-center justify-center gap-[6px] p-[32px_16px] rounded-[12px] cursor-pointer text-center" style={{border:`1.5px dashed ${em?.dropBd}`,background:em?.dropBg}}>
<input type="file" accept=".csv,text/csv" onChange={em?.onFile} className="hidden" />
<div className="font-medium text-[14px]">
{em?.fileName}
</div>
<div className="text-[12.5px] text-text-3">
{em?.fileHint}
</div>
</label>
<button onClick={em?.useSample} className="self-start border-0 bg-transparent text-accent text-[13px] cursor-pointer p-[0]">
{tr("use_a_sample_file_instead")}
</button>
</>) : null}
{em?.s2 ? (<>
<div className="text-[13px] text-text-2">
{tr("match_each_staffsync_field_to")}{" "}
<b className="text-text">
{em?.fileName}
</b>
{tr("p0_rows_detected",{p0:em?.rowCount ?? ''})}
</div>
<div className="border border-solid border-border rounded-[10px] overflow-hidden">
{(em?.map ?? []).map((m, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[1fr_1fr_1.2fr] gap-[12px] items-center p-[9px_14px] text-[13px]" style={{borderTop:m?.bt}}>
<div className="font-medium">
{m?.l}
<span className="text-bad">
{m?.req}
</span>
</div>
<select value={m?.val} onChange={m?.on} className="h-[32px] p-[0_8px] rounded-[8px] bg-surface text-text text-[13px]" style={{border:`1px solid ${m?.bd}`}}>
{(m?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<div className="[font:12px_'Geist_Mono',monospace] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{m?.ex}
</div>
</div>
</Fragment>))}
</div>
{em?.missing ? (<>
<div className="text-[12.5px] text-bad">
{tr("map_all_required_fields_to")}
</div>
</>) : null}
</>) : null}
{em?.s3 ? (<>
<div className="flex gap-[8px] flex-wrap">
<span className="p-[4px_10px] rounded-[999px] text-[12.5px] font-medium bg-ok-bg text-ok">
{tr("p0_valid",{p0:em?.nOk ?? ''})}
</span>
<span className="p-[4px_10px] rounded-[999px] text-[12.5px] font-medium bg-bad-bg text-bad">
{tr("p0_with_errors",{p0:em?.nBad ?? ''})}
</span>
<span className="text-[12.5px] text-text-3 self-center">
{tr("rows_with_errors_are_skipped")}
</span>
</div>
<div className="border border-solid border-border rounded-[10px] overflow-x-auto">
<div className="min-w-[620px]">
<div className="grid grid-cols-[36px_1.2fr_80px_1fr_1fr_1fr] gap-[10px] p-[0_12px] h-[34px] items-center bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
<div>
{"#"}
</div>
<div>
{tr("name")}
</div>
<div>
{tr("id")}
</div>
<div>
{tr("phone")}
</div>
<div>
{tr("site")}
</div>
<div>
{tr("role")}
</div>
</div>
{(em?.prev ?? []).map((p, $index) => (<Fragment key={$index}>
<div className="border-t border-solid border-t-border" style={{background:p?.bg}}>
<div className="grid grid-cols-[36px_1.2fr_80px_1fr_1fr_1fr] gap-[10px] p-[9px_12px] items-center text-[13px]">
<div className="[font:12px_'Geist_Mono',monospace] text-text-3">
{p?.n}
</div>
<div>
{p?.name}
</div>
<div className="[font:12px_'Geist_Mono',monospace]">
{p?.id}
</div>
<div className="[font:12px_'Geist_Mono',monospace]">
{p?.phone}
</div>
<div>
{p?.site}
</div>
<div>
{p?.role}
</div>
</div>
{p?.err ? (<>
<div className="p-[0_12px_9px_58px] text-[12.5px] text-bad">
{p?.err}
</div>
</>) : null}
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{em?.s4 ? (<>
<div className="text-center p-[18px_0] flex flex-col gap-[6px] items-center">
<div className="w-[48px] h-[48px] rounded-[50%] bg-ok-bg text-ok grid place-items-center">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5 9-10" />
</svg>
</div>
<div className="font-semibold text-[17px]">
{tr("import_complete")}
</div>
</div>
<div className="grid grid-cols-[repeat(3,1fr)] gap-[10px]">
{(em?.result ?? []).map((x, $index) => (<Fragment key={$index}>
<div className="p-[14px] rounded-[10px] border border-solid border-border text-center">
<div className="text-[24px] font-semibold" style={{color:x?.c}}>
{x?.n}
</div>
<div className="text-[12.5px] text-text-3">
{x?.l}
</div>
</div>
</Fragment>))}
</div>
<div className="text-[13px] text-text-2 text-center">
{tr("imported_employees_were_added_as")}{" "}
<b className="text-text">
{tr("invited")}
</b>
{tr("invitations_go_out_when_you")}
</div>
{em?.nBad ? (<>
<button onClick={em?.errCsv} className="self-center h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("download_skipped_rows")}
</button>
</>) : null}
</>) : null}
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex gap-[8px] justify-between items-center">
<button onClick={em?.back} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer" style={{visibility:em?.backVis}}>
{tr("back")}
</button>
<button onClick={em?.next} className="h-[34px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:em?.nextOp}}>
{em?.nextL}
</button>
</div>
</div>
</div>
</>) : null}
{em?.formOpen ? (<>
<AdminEmployeeForm mode={em?.formMode} emp={em?.formEmp} count={em?.cnt} limit={em?.limit} takenIds={em?.ids} onSave={em?.formSave} onCancel={em?.formCancel} />
</>) : null}
{em?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{em?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminEmployees(props: any) {
  const tr = useTranslations('AdminEmployees');
  return <AdminEmployeesView {...props} tr={tr} />;
}
