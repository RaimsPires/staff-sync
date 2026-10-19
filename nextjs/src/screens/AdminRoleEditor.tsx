'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const BR=[['Lyon',['pd','cf']],['Paris Nord',['sd','rl']],['Marseille',['pv']]];
const SN={pd:'Part-Dieu Tower',cf:'Confluence Depot',sd:'Saint-Denis Hub',rl:'Roissy Logistics',pv:'Port Vieux Yard'};
const ACTS=['view','create','edit','delete','approve'];
const MODS=[['att','Attendance','Records, corrections and live board',['view','create','edit','delete']],['proxy','Check-in on behalf','Proxy check-in and check-out',['view','create']],['fraud','Fraud alerts','Flagged check-ins and resolution',['view','approve']],['emp','Employees','Profiles, devices and badges',['view','create','edit','delete']],['site','Sites','Geofences, QR codes, rules',['view','create','edit','delete']],['branch','Branches','Branch setup and holidays',['view','create','edit','delete']],['sch','Schedules','Shifts, interventions, publishing',['view','create','edit','delete']],['lva','Leave approval','Review and decide requests',['view','approve']],['lvs','Leave settings','Policies and balances',['view','edit']],['rep','Reports','Run and schedule reports',['view']],['exp','Export','Download CSV, Excel and PDF',['create']],['usr','Users & roles','Dashboard access and roles',['view','create','edit','delete']],['audit','Audit log','Who changed what',['view']],['set','Settings','Company-wide configuration',['view','edit']],['bill','Billing','Plan, invoices and seats',['view','edit']]];
const TIPS={exp:{create:'Can export data'}};
const SCOPES=[['company','Whole company','Every branch and site.'],['branches','Selected branches','Only the branches you tick.'],['ownBranch','Own branch','The branch each user is assigned to.'],['sites','Selected sites','Only the sites you tick.'],['ownSite','Own site','The site each user is assigned to.'],['self','Self only','Just the user’s own records.']];
const NAV=[['Overview',()=>true],['Live board',p=>p('att.view')],['Alerts',p=>p('fraud.view')],['Attendance',p=>p('att.view')],['Employees',p=>p('emp.view')],['Branches & sites',p=>p('site.view')||p('branch.view')],['Schedules',p=>p('sch.view')],['Leave',p=>p('lva.view')],['Reports',p=>p('rep.view')],['Users & access',p=>p('usr.view')],['Audit log',p=>p('audit.view')],['Settings',p=>p('set.view')||p('bill.view')]];
const CAN=[['att.edit','Edit and add attendance records'],['proxy.create','Check people in on their behalf'],['fraud.approve','Approve or reject fraud flags'],['emp.create','Add employees'],['sch.edit','Edit and publish schedules'],['lva.approve','Approve or reject leave'],['exp.create','Export data'],['usr.edit','Manage users and roles'],['set.edit','Change company settings'],['bill.view','See billing']];
const CANT=[['usr.edit','Manage users or roles'],['set.edit','Change settings'],['bill.view','See billing']];
const sig=s=>JSON.stringify([s.name,s.desc,s.perms.slice().sort(),s.scopeK,s.ids.slice().sort()]);
const nameOf=s=>BR.map(b=>b[0]).concat(Object.keys(SN).map(k=>SN[k])).length&&s;
class AdminRoleEditorBase extends DCLogic {
  state=(()=>{const p=this.props,r=p.role,m=p.mode||'create';
    const st={name:r?(m==='duplicate'?r.name+' (copy)':r.name):'',desc:r?r.desc||'':'',perms:r?r.perms.slice():['att.view'],scopeK:r?(r.scopeK||'company'):'ownBranch',ids:r?(r.scopeIds||[]).slice():[],tried:false,discard:false};
    this.base=m==='create'||m==='duplicate'?'':sig(st);return st;})();
  componentDidMount(){this._bu=ev=>{if(this.dirty()){ev.preventDefault();ev.returnValue='';}};window.addEventListener('beforeunload',this._bu);}
  componentWillUnmount(){window.removeEventListener('beforeunload',this._bu);}
  locked(){return(this.props.mode||'create')==='view';}
  dirty(){return!this.locked()&&sig(this.state)!==this.base;}
  has(k){return this.state.perms.includes(k);}
  toggle(m,a){if(this.locked())return;this.setState(s=>{const k=m+'.'+a,mod=MODS.find(x=>x[0]===m),on=s.perms.includes(k);let p=s.perms.slice();
    if(on){p=p.filter(x=>x!==k);if(a==='view')p=p.filter(x=>x.indexOf(m+'.')!==0);}
    else{p.push(k);if(a!=='view'&&mod[3].includes('view')&&!p.includes(m+'.view'))p.push(m+'.view');}
    return{perms:p};});}
  rowAll(m){if(this.locked())return;this.setState(s=>{const mod=MODS.find(x=>x[0]===m),keys=mod[3].map(a=>m+'.'+a),all=keys.every(k=>s.perms.includes(k));return{perms:all?s.perms.filter(x=>!keys.includes(x)):s.perms.concat(keys.filter(k=>!s.perms.includes(k)))};});}
  err(){const s=this.state,e={},roles=this.props.roles||[],cur=this.props.role,m=this.props.mode;
    if(!s.name.trim())e.name='Role name is required';else if(roles.some(r=>(m==='edit'&&cur&&r.id===cur.id?false:true)&&r.name.toLowerCase()===s.name.trim().toLowerCase()))e.name='A role with this name already exists';
    if((s.scopeK==='branches'||s.scopeK==='sites')&&!s.ids.length)e.scope='Select at least one '+(s.scopeK==='branches'?'branch':'site');
    if(!s.perms.length)e.perms='Enable at least one permission';
    return e;}
  renderVals(){return{e:this.rv()};}
  rv(){
    const s=this.state,p=this.props,T=this,mode=p.mode||'create',locked=this.locked(),er=s.tried?this.err():{},dirty=this.dirty();
    const has=k=>s.perms.includes(k),perm=has;
    const title=mode==='create'?'Create role':mode==='duplicate'?'Duplicate role':mode==='view'?(p.role?p.role.name:'Role'):'Edit role';
    const setS=o=>{if(!locked)this.setState(o);};
    const tree=s.scopeK==='branches'||s.scopeK==='sites';
    const isB=s.scopeK==='branches';
    const treeBranches=BR.map(([bn,ks],i)=>{const all=isB?s.ids.includes(bn):ks.every(k=>s.ids.includes(k)),some=!isB&&ks.some(k=>s.ids.includes(k));
      return{name:bn,sub:ks.length+' site'+(ks.length===1?'':'s'),bt:i?'1px solid var(--border)':'0',cur:locked?'default':'pointer',bd:all||some?'var(--accent)':'var(--border-strong)',bg:all?'var(--accent)':some?'var(--accent-soft)':'transparent',mark:all?'✓':some?'–':'',
        go:()=>{if(locked)return;this.setState(x=>isB?{ids:x.ids.includes(bn)?x.ids.filter(i=>i!==bn):x.ids.concat(bn)}:{ids:all?x.ids.filter(i=>!ks.includes(i)):x.ids.concat(ks.filter(k=>!x.ids.includes(k)))});},
        sites:ks.map(k=>{const on=isB?s.ids.includes(bn):s.ids.includes(k);return{name:SN[k],bd:on?'var(--accent)':'var(--border-strong)',bg:on?'var(--accent)':'transparent',op:on?1:0,cur:locked||isB?'default':'pointer',op2:isB?.65:1,go:()=>{if(locked||isB)return;this.setState(x=>({ids:x.ids.includes(k)?x.ids.filter(i=>i!==k):x.ids.concat(k)}));}};})};});
    const allIds=isB?BR.map(b=>b[0]):Object.keys(SN);
    const mods=MODS.map(([m,name,sub,acts])=>{const keys=acts.map(a=>m+'.'+a),n=keys.filter(k=>has(k)).length,all=n===keys.length;
      return{name,sub,rowBg:n?'transparent':'transparent',cur:locked?'default':'pointer',aBd:all||n?'var(--accent)':'var(--border-strong)',aBg:all?'var(--accent)':n?'var(--accent-soft)':'transparent',aMark:all?'✓':n?'–':'',all:()=>this.rowAll(m),
        cells:ACTS.map(a=>{const ap=acts.includes(a),on=ap&&has(m+'.'+a);return{has:ap,none:!ap,bd:on?'var(--accent)':'var(--border-strong)',bg:on?'var(--accent)':'transparent',op:on?1:0,tip:ap?((TIPS[m]&&TIPS[m][a])||a[0].toUpperCase()+a.slice(1)+' · '+name):'',go:()=>this.toggle(m,a)};})};});
    const seeScope={company:'Everything in the company — all branches and sites.',branches:s.ids.length?'Only '+s.ids.join(', ')+'.':'No branch picked yet.',ownBranch:'Only the branch each user is assigned to.',sites:s.ids.length?'Only '+s.ids.map(k=>SN[k]).join(', ')+'.':'No site picked yet.',ownSite:'Only the site each user is assigned to.',self:'Only their own records.'}[s.scopeK];
    const nav=NAV.map(([l,f])=>{const ok=f(perm);return{l,fg:ok?'var(--text)':'var(--text-3)',td:ok?'none':'line-through',dot:ok?'var(--accent)':'var(--border-strong)',note:ok?'':'hidden'};});
    const can=CAN.filter(c=>has(c[0])&&!(c[0]==='bill.view')||c[0]==='bill.view'&&has('bill.view')).map(c=>c[1]);
    const anyDel=s.perms.some(x=>x.endsWith('.delete'));
    const cant=CANT.filter(c=>!has(c[0])).map(c=>c[1]);if(!anyDel)cant.push('Delete anything');
    const users=p.userCount||0,ids=Object.keys(er);
    return{
      title,locked,canEdit:!locked,canSave:!locked,tryCancel:()=>{if(dirty)this.setState({discard:true});else p.onCancel&&p.onCancel();},cancelL:locked?'Close':'Cancel',
      stat:locked?'Default role · read-only':dirty?'Unsaved changes':mode==='create'||mode==='duplicate'?'Not saved yet':'All changes saved',statC:dirty?'var(--warn)':'var(--text-3)',statD:dirty?'var(--warn-dot)':'var(--border-strong)',
      dup:()=>p.onDuplicate&&p.onDuplicate(),saveL:mode==='edit'?'Save changes':'Create role',saveOp:s.tried&&ids.length?.55:1,
      hasErr:ids.length>0,errMsg:er.name||er.scope||er.perms||'',
      name:s.name,onName:ev=>setS({name:ev.target.value}),nBd:er.name?'var(--bad-dot)':'var(--border-strong)',nErr:er.name||'',desc:s.desc,onDesc:ev=>setS({desc:ev.target.value}),
      scopes:SCOPES.map(([k,l,d])=>({l,d,bg:s.scopeK===k?'var(--accent-soft)':'var(--surface)',bd:s.scopeK===k?'var(--accent)':'var(--border)',rb:s.scopeK===k?'var(--accent)':'var(--border-strong)',dot:s.scopeK===k?1:0,cur:locked?'default':'pointer',go:()=>setS({scopeK:k,ids:[]})})),
      tree,treeBd:er.scope?'var(--bad-dot)':'var(--border)',treeHint:isB?'Pick the branches this role covers':'Pick the sites this role covers',branches:treeBranches,
      treeAll:()=>setS({ids:allIds.slice()}),treeNone:()=>setS({ids:[]}),scopeErr:er.scope||'',scopeNote:s.scopeK!=='company'&&['usr.view','set.view','bill.view'].some(has),
      permCount:s.perms.length+' of '+MODS.reduce((t,m)=>t+m[3].length,0),mods,allOn:()=>setS({perms:[].concat(...MODS.map(m=>m[3].map(a=>m[0]+'.'+a)))}),allOff:()=>setS({perms:[]}),
      seeScope,nav,can,cant,hasUsers:users>0&&mode==='edit',users,usersPl:users===1?'':'s',usersHave:users===1?'has':'have',
      save:()=>{const e=this.err();if(Object.keys(e).length){this.setState({tried:true});return;}p.onSave&&p.onSave({id:mode==='edit'&&p.role?p.role.id:null,name:s.name.trim(),desc:s.desc.trim(),perms:s.perms.slice(),scopeK:s.scopeK,scopeIds:s.ids.slice()});},
      discard:s.discard,keep:()=>this.setState({discard:false}),leave:()=>{this.setState({discard:false});p.onCancel&&p.onCancel();}
    };
  }
}

class AdminRoleEditorView extends AdminRoleEditorBase {
  view(S) {
    const tr = this.props.tr;
    const { e } = S;
    return (
<>
<div className="flex flex-col gap-[16px] relative">
<div className="flex items-center gap-[12px] flex-wrap">
<button onClick={e?.tryCancel} className="flex items-center gap-[6px] h-[32px] p-[0_10px_0_6px] border-0 rounded-[8px] bg-transparent text-text-2 text-[13px] cursor-pointer hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M15 6l-6 6 6 6" />
</svg>
{tr("users_roles")}
</button>
<div className="flex-1 min-w-[200px]">
<h2 className="m-[0] text-[20px] font-semibold tracking-[-.01em]">
{e?.title}
</h2>
<div className="text-[12.5px] mt-[2px] flex items-center gap-[6px]" style={{color:e?.statC}}>
<span className="w-[7px] h-[7px] rounded-[50%]" style={{background:e?.statD}} />
{e?.stat}
</div>
</div>
{e?.locked ? (<>
<button onClick={e?.dup} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("duplicate_to_customise")}
</button>
</>) : null}
<button onClick={e?.tryCancel} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{e?.cancelL}
</button>
{e?.canSave ? (<>
<button onClick={e?.save} className="h-[36px] p-[0_18px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:e?.saveOp}}>
{e?.saveL}
</button>
</>) : null}
</div>
{e?.locked ? (<>
<div className="p-[11px_14px] rounded-[10px] bg-info-bg text-info text-[13px]">
{tr("default_roles_are_read_only")}
</div>
</>) : null}
{e?.hasErr ? (<>
<div className="p-[11px_14px] rounded-[10px] bg-bad-bg text-bad text-[13px] font-medium">
{e?.errMsg}
</div>
</>) : null}
<div className="flex gap-[16px] items-start flex-wrap">
<div className="flex-[1_1_560px] min-w-[0] flex flex-col gap-[16px]">
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[14px]">
<div className="font-semibold text-[14.5px]">
{tr("role_details")}
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("role_name")}
<input value={e?.name} onInput={e?.onName} disabled={e?.locked} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${e?.nBd}`}} />
<span className="text-[12px] text-bad font-normal">
{e?.nErr}
</span>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("description")}
<textarea rows="2" value={e?.desc} onInput={e?.onDesc} disabled={e?.locked} placeholder={tr("what_is_this_role_for")} className="resize-y p-[9px_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] [outline:none]" />
</label>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div>
<div className="font-semibold text-[14.5px]">
{tr("data_scope")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("which_records_this_role_s")}
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[8px]">
{(e?.scopes ?? []).map((o, $index) => (<Fragment key={$index}>
<div onClick={o?.go} className="flex gap-[10px] items-start p-[10px_12px] rounded-[10px]" style={{border:`1.5px solid ${o?.bd}`,background:o?.bg,cursor:o?.cur}}>
<span className="w-[16px] h-[16px] rounded-[50%] mt-[2px] flex-none grid place-items-center" style={{border:`1.5px solid ${o?.rb}`}}>
<span className="w-[8px] h-[8px] rounded-[50%] bg-accent" style={{opacity:o?.dot}} />
</span>
<span>
<span className="block text-[13.5px] font-medium">
{o?.l}
</span>
<span className="block text-[12px] text-text-3">
{o?.d}
</span>
</span>
</div>
</Fragment>))}
</div>
{e?.tree ? (<>
<div className="rounded-[10px] overflow-hidden" style={{border:`1px solid ${e?.treeBd}`}}>
<div className="p-[8px_12px] bg-surface-2 border-b border-solid border-b-border text-[12.5px] text-text-2 flex items-center gap-[10px]">
{e?.treeHint}
<div className="flex-1" />
<button onClick={e?.treeAll} className="border-0 bg-transparent text-accent text-[12.5px] cursor-pointer">
{tr("select_all")}
</button>
<button onClick={e?.treeNone} className="border-0 bg-transparent text-accent text-[12.5px] cursor-pointer">
{tr("clear")}
</button>
</div>
{(e?.branches ?? []).map((b, $index) => (<Fragment key={$index}>
<div style={{borderTop:b?.bt}}>
<div onClick={b?.go} className="flex items-center gap-[10px] p-[9px_12px] hover:bg-hover" style={{cursor:b?.cur}}>
<div className="w-[17px] h-[17px] rounded-[5px] grid place-items-center text-[color:#fff] [font:700_12px/1_sans-serif]" style={{border:`1.5px solid ${b?.bd}`,background:b?.bg}}>
{b?.mark}
</div>
<span className="text-[13.5px] font-semibold">
{b?.name}
</span>
<span className="text-[12px] text-text-3">
{b?.sub}
</span>
</div>
{(b?.sites ?? []).map((s, $index) => (<Fragment key={$index}>
<div onClick={s?.go} className="flex items-center gap-[10px] p-[7px_12px_7px_40px] hover:bg-hover" style={{cursor:s?.cur,opacity:s?.op2}}>
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${s?.bd}`,background:s?.bg}}>
<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" style={{opacity:s?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
<span className="text-[13px]">
{s?.name}
</span>
</div>
</Fragment>))}
</div>
</Fragment>))}
</div>
</>) : null}
<span className="text-[12px] text-bad">
{e?.scopeErr}
</span>
{e?.scopeNote ? (<>
<div className="text-[12.5px] text-warn p-[8px_10px] rounded-[8px] bg-warn-bg">
{tr("users_roles_settings_and_billing")}
</div>
</>) : null}
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[640px]">
<div className="p-[14px_18px] flex items-center gap-[12px] border-b border-solid border-b-border">
<div className="flex-1">
<div className="font-semibold text-[14.5px]">
{tr("permissions")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("p0_enabled_creating_editing_dele",{p0:e?.permCount ?? ''})}
</div>
</div>
{e?.canEdit ? (<>
<button onClick={e?.allOn} className="border-0 bg-transparent text-accent text-[12.5px] cursor-pointer">
{tr("select_all")}
</button>
<button onClick={e?.allOff} className="border-0 bg-transparent text-accent text-[12.5px] cursor-pointer">
{tr("clear")}
</button>
</>) : null}
</div>
<div className="grid grid-cols-[minmax(180px,1.6fr)_54px_repeat(5,66px)] gap-[4px] p-[0_18px] h-[36px] items-center bg-surface-2 border-b border-solid border-b-border text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
<div>
{tr("module")}
</div>
<div className="text-center">
{tr("all")}
</div>
<div className="text-center">
{tr("view")}
</div>
<div className="text-center">
{tr("create")}
</div>
<div className="text-center">
{tr("edit")}
</div>
<div className="text-center">
{tr("delete")}
</div>
<div className="text-center">
{tr("approve")}
</div>
</div>
{(e?.mods ?? []).map((m, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(180px,1.6fr)_54px_repeat(5,66px)] gap-[4px] p-[0_18px] min-h-[48px] items-center border-b border-solid border-b-border hover:bg-hover" style={{background:m?.rowBg}}>
<div className="p-[6px_0]">
<div className="text-[13.5px] font-medium">
{m?.name}
</div>
<div className="text-[12px] text-text-3">
{m?.sub}
</div>
</div>
<div className="grid place-items-center">
<div onClick={m?.all} title={`Select all for ${m?.name}`} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-[color:#fff] [font:700_12px/1_sans-serif]" style={{border:`1.5px solid ${m?.aBd}`,background:m?.aBg,cursor:m?.cur}}>
{m?.aMark}
</div>
</div>
{(m?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<div title={c?.tip} className="grid place-items-center">
{c?.has ? (<>
<div onClick={c?.go} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${c?.bd}`,background:c?.bg,cursor:m?.cur}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:c?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
</>) : null}
{c?.none ? (<>
<span className="text-border-strong text-[14px]">
{"–"}
</span>
</>) : null}
</div>
</Fragment>))}
</div>
</Fragment>))}
</div>
</section>
</div>
<aside className="flex-[0_1_330px] w-[330px] max-w-[100%] sticky top-[12px] flex flex-col gap-[12px]">
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="font-semibold text-[14.5px]">
{tr("preview")}
</div>
<div>
<div className="text-[12px] text-text-3 mb-[2px]">
{tr("users_with_this_role_can")}
</div>
<div className="text-[13.5px] font-medium leading-[1.4]">
{e?.seeScope}
</div>
</div>
<div>
<div className="text-[12px] text-text-3 mb-[6px]">
{tr("navigation_they_ll_get")}
</div>
<div className="border border-solid border-border rounded-[10px] p-[6px] bg-surface-2">
{(e?.nav ?? []).map((n, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[9px] h-[30px] p-[0_9px] rounded-[7px] text-[13px]" style={{color:n?.fg,textDecoration:n?.td}}>
<span className="w-[7px] h-[7px] rounded-[2px]" style={{background:n?.dot}} />
{n?.l}
<span className="ml-[auto] text-[11.5px] text-text-3 no-underline">
{n?.note}
</span>
</div>
</Fragment>))}
</div>
</div>
{e?.can?.length ? (<>
<div>
<div className="text-[12px] text-text-3 mb-[6px]">
{tr("they_can")}
</div>
<div className="flex flex-col gap-[5px]">
{(e?.can ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="flex gap-[8px] text-[12.5px]">
<span className="text-ok font-bold">
{"✓"}
</span>
{c}
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{e?.cant?.length ? (<>
<div>
<div className="text-[12px] text-text-3 mb-[6px]">
{tr("they_can_t")}
</div>
<div className="flex flex-col gap-[5px]">
{(e?.cant ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="flex gap-[8px] text-[12.5px] text-text-2">
<span className="text-bad font-bold">
{"×"}
</span>
{c}
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{e?.hasUsers ? (<>
<div className="border-t border-solid border-t-border pt-[10px] text-[12.5px] text-text-2">
{tr("p0_user_p1_currently_p2",{p0:e?.users ?? '',p1:e?.usersPl ?? '',p2:e?.usersHave ?? ''})}
</div>
</>) : null}
</div>
</aside>
</div>
{e?.discard ? (<>
<div className="fixed inset-[0] bg-overlay z-[60] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[400px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[16px]">
{tr("discard_unsaved_changes")}
</div>
<div className="text-[13.5px] text-text-2">
{tr("you_ve_changed_this_role")}
</div>
<div className="flex gap-[8px] justify-end">
<button onClick={e?.keep} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("keep_editing")}
</button>
<button onClick={e?.leave} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("discard_changes")}
</button>
</div>
</div>
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminRoleEditor(props: any) {
  const tr = useTranslations('AdminRoleEditor');
  return <AdminRoleEditorView {...props} tr={tr} />;
}
