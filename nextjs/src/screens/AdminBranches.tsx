'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminSites from './AdminSites';

const S=(id,name,addr,emp,exp,pres)=>({id,name,addr,emp,exp,pres});
const B0=[
 {id:'lyon',name:'Lyon',code:'LYO',addr:'12 Rue de la Part-Dieu, 69003 Lyon',tz:'Europe/Paris',admins:['Nadia Koné','Julien Roche'],hol:'fr',wf:'default',rate:93,arch:false,sites:[S('pd','Part-Dieu Tower','12 Rue de la Part-Dieu, Lyon',42,38,35),S('cf','Confluence Depot','4 Quai Rambaud, Lyon',31,27,25)]},
 {id:'pn',name:'Paris Nord',code:'PAN',addr:'88 Avenue du Président Wilson, 93210 Saint-Denis',tz:'Europe/Paris',admins:['Marc Olivier'],hol:'fr',wf:'two',rate:89,arch:false,sites:[S('sd','Saint-Denis Hub','88 Av. Wilson, Saint-Denis',58,52,46),S('rl','Roissy Logistics','Zone Cargo 4, Roissy-en-France',47,41,38)]},
 {id:'mrs',name:'Marseille',code:'MRS',addr:'21 Quai du Port, 13002 Marseille',tz:'Europe/Paris',admins:['Sarah Benoît'],hol:'fr',wf:'auto',rate:96,arch:false,sites:[S('pv','Port Vieux Yard','21 Quai du Port, Marseille',36,31,30)]},
 {id:'bdx',name:'Bordeaux',code:'BDX',addr:'5 Cours du Médoc, 33300 Bordeaux',tz:'Europe/Paris',admins:[],hol:'fr',wf:'default',rate:0,arch:true,sites:[]}];
const ADM=['Nadia Koné','Julien Roche','Marc Olivier','Sarah Benoît','Claire Vasseur','Hugo Martel'];
const TZ=[['Europe/Paris','Europe/Paris (UTC+1/+2)'],['Europe/London','Europe/London (UTC+0/+1)'],['Europe/Brussels','Europe/Brussels (UTC+1/+2)'],['Europe/Madrid','Europe/Madrid (UTC+1/+2)'],['Indian/Reunion','Indian/Reunion (UTC+4)'],['America/Martinique','America/Martinique (UTC−4)']];
const HOL={fr:['France (national)','11 public holidays'],alsace:['France – Alsace-Moselle','13 public holidays'],be:['Belgium (national)','10 public holidays'],custom:['Custom calendar','Dates managed in Settings']};
const WF={default:['Company default','Uses the company-wide approval rules.'],single:['Branch admin only','One approval from a branch admin.'],two:['Branch admin, then HR','Two steps: branch admin, then HR.'],auto:['Auto-approve up to 2 days','Longer requests go to a branch admin.']};
const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('');
const sum=(a,k)=>a.reduce((x,y)=>x+y[k],0);
class AdminBranchesBase extends DCLogic {
  state={view:'branches',brs:B0,sel:'lyon',q:'',archOpen:false,m:null,x:null,toast:null};
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2600); }
  renderVals(){ return {br:this.rv()}; }
  mval(){
    const s=this.state,m=s.m,e={};
    if(!m) return {};
    if(!m.name.trim()) e.name='Name is required'; else if(s.brs.some(b=>b.id!==m.id&&b.name.toLowerCase()===m.name.trim().toLowerCase())) e.name='A branch with this name exists';
    if(!m.code.trim()) e.code='Code is required'; else if(m.code.trim().length<2) e.code='2–4 letters'; else if(s.brs.some(b=>b.id!==m.id&&b.code===m.code.trim())) e.code='Code already in use';
    if(!m.addr.trim()) e.addr='Address is required';
    return e;
  }
  rv(){
    const s=this.state,T=this,q=s.q.trim().toLowerCase();
    const stat=b=>({emp:sum(b.sites,'emp'),exp:sum(b.sites,'exp'),pres:sum(b.sites,'pres')});
    const act=s.brs.filter(b=>!b.arch),arch=s.brs.filter(b=>b.arch);
    const match=b=>!q||b.name.toLowerCase().includes(q)||b.sites.some(x=>x.name.toLowerCase().includes(q));
    const row=b=>{const t=stat(b);return {name:b.name,code:b.code,counts:b.sites.length+' site'+(b.sites.length===1?'':'s')+' · '+t.emp+' employees',bg:s.sel===b.id?'var(--accent-soft)':'transparent',ibg:s.sel===b.id?'var(--accent)':'var(--neutral-bg)',ifg:s.sel===b.id?'#fff':'var(--neutral)',dot:b.rate>=93?'var(--ok-dot)':b.rate>=85?'var(--warn-dot)':'var(--bad-dot)',pick:()=>this.setState({sel:b.id}),
      sites:q?b.sites.filter(x=>x.name.toLowerCase().includes(q)||b.name.toLowerCase().includes(q)).map(x=>({name:x.name,emp:x.emp})):s.sel===b.id?b.sites.map(x=>({name:x.name,emp:x.emp})):[]};};
    const list=act.filter(match).map(row);
    const cur=s.brs.find(b=>b.id===s.sel),tot=sum(act.map(b=>({e:stat(b).emp})),'e'),nsites=sum(act.map(b=>({n:b.sites.length})),'n');
    let d=null;
    if(cur){const t=stat(cur),isA=cur.arch,mx=Math.max(1,...cur.sites.map(x=>x.emp));
      const lk=x=>[['Live board'],['Employees'],['Schedules']].map(([l])=>({l,go:ev=>{ev.preventDefault();this.say(l+' · '+x.name);}}));
      d={name:cur.name,code:cur.code,addr:cur.addr,tz:cur.tz,hol:HOL[cur.hol][0],wf:WF[cur.wf][0],archived:isA,active:!isA,delL:isA?'Delete permanently':'Archive or delete',
        stats:[{l:'Attendance rate',v:isA?'—':cur.rate+'%',c:cur.rate>=93?'var(--ok)':cur.rate>=85?'var(--warn)':'var(--text-3)',h:'This month'},{l:'Present today',v:t.pres+' / '+t.exp,c:'var(--text)',h:'Checked in / expected'},{l:'Sites',v:cur.sites.length,c:'var(--text)',h:'Active sites'},{l:'Employees',v:t.emp,c:'var(--text)',h:'On the roster'}],
        admins:cur.admins.map((n,i)=>({name:n,ini:ini(n),bt:i?'1px solid var(--border)':'0'})),noAdmins:!cur.admins.length,
        bars:cur.sites.map(x=>({name:x.name,n:x.emp,w:Math.round(x.emp/mx*100)+'%'})),sites:cur.sites.map(x=>({name:x.name,addr:x.addr,emp:x.emp,pres:x.pres,exp:x.exp,links:lk(x)})),noSites:!cur.sites.length};}
    const m=s.m,me=m&&m.tried?this.mval():{};
    const setM=k=>ev=>{const v=ev.target.value;this.setState(x=>({m:Object.assign({},x.m,{[k]:v})}));};
    const mv=m&&{title:m.id?'Edit branch':'Add branch',hasErr:Object.keys(me).length>0,name:m.name,code:m.code,addr:m.addr,tz:m.tz,hol:m.hol,wf:m.wf,onName:setM('name'),onCode:ev=>{const v=ev.target.value.toUpperCase().replace(/[^A-Z]/g,'');this.setState(x=>({m:Object.assign({},x.m,{code:v})}));},onAddr:setM('addr'),onTz:setM('tz'),onHol:setM('hol'),onWf:setM('wf'),
      nameE:me.name||'',codeE:me.code||'',addrE:me.addr||'',nameBd:me.name?'var(--bad-dot)':'var(--border-strong)',codeBd:me.code?'var(--bad-dot)':'var(--border-strong)',addrBd:me.addr?'var(--bad-dot)':'var(--border-strong)',holN:HOL[m.hol][1],wfH:WF[m.wf][1],saveL:m.id?'Save changes':'Create branch',
      adminChips:ADM.map(n=>{const on=m.admins.includes(n);return {name:n,bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:()=>this.setState(x=>({m:Object.assign({},x.m,{admins:on?x.m.admins.filter(i=>i!==n):x.m.admins.concat(n)})}))};})};
    const x=s.x,xb=x&&s.brs.find(b=>b.id===x.id),xt=xb?stat(xb):null,att=xb&&(xb.sites.length>0||xt.emp>0);
    const others=xb?act.filter(b=>b.id!==xb.id):[];
    let xv=null;
    if(x&&xb){const del=x.action==='delete',needMove=att&&!xb.arch,step2=x.step===2&&needMove,final=!needMove||step2;
      const typeOk=!del||x.typed===xb.code,tOk=!needMove||!!x.target;
      xv={title:xb.arch?'Delete '+xb.name:'Archive or delete '+xb.name,name:xb.name,code:xb.code,attached:needMove,empty:!needMove,impact:xb.sites.length+' site'+(xb.sites.length===1?'':'s')+' and '+xt.emp+' employees',step1:x.step===1,step2,typeConfirm:final&&del,typed:x.typed,onTyped:ev=>this.setState({x:Object.assign({},x,{typed:ev.target.value})}),
        choices:(xb.arch?[['delete','Delete permanently','Removes the branch record. This cannot be undone.']]:[['archive','Archive','Hides the branch from lists and pickers. History is kept and you can restore it later.'],['delete','Delete permanently','Removes the branch. Attendance history stays with each site. This cannot be undone.']]).map(([k,l,h])=>({l,h,bd:x.action===k?(k==='delete'?'var(--bad-dot)':'var(--accent)'):'var(--border)',bg:x.action===k?(k==='delete'?'var(--bad-bg)':'var(--accent-soft)'):'var(--surface)',go:()=>this.setState({x:Object.assign({},x,{action:k})})})),
        target:x.target,tBd:'var(--border-strong)',targets:[{v:'',l:'Select a branch…'}].concat(others.map(b=>({v:b.id,l:b.name}))),onTarget:ev=>this.setState({x:Object.assign({},x,{target:ev.target.value})}),
        back:()=>step2?this.setState({x:Object.assign({},x,{step:1})}):this.setState({x:null}),backL:step2?'Back':'Cancel',
        goL:!final?'Continue':del?'Delete branch':'Archive branch',goBg:final?(del?'var(--bad-dot)':'var(--accent)'):'var(--accent)',goOp:final&&(!typeOk||!tOk)?.45:1,
        go:()=>{ if(!final){this.setState({x:Object.assign({},x,{step:2})});return;} if(!typeOk||!tOk) return;
          this.setState(st=>{let brs=st.brs;const src=st.brs.find(b=>b.id===x.id);
            if(needMove) brs=brs.map(b=>b.id===x.target?Object.assign({},b,{sites:b.sites.concat(src.sites)}):b);
            brs=brs.map(b=>b.id===x.id?Object.assign({},b,{sites:needMove?[]:b.sites,arch:true}):b);
            if(del) brs=brs.filter(b=>b.id!==x.id);
            const first=brs.find(b=>!b.arch);return {brs,x:null,sel:del||st.sel!==x.id?(del&&st.sel!==x.id?st.sel:(first?first.id:null)):st.sel};});
          this.say(xb.name+(del?' deleted':' archived')+(needMove?' · '+xb.sites.length+' sites moved to '+others.find(b=>b.id===x.target).name:'')); }};}
    return {
      sub:s.view==='sites'?'Every site with its geofence, team and live attendance':act.length+' branches · '+nsites+' sites · '+tot+' employees',tabsV:[['branches','Branches'],['sites','Sites']].map(([k,l])=>({l,bg:s.view===k?'var(--accent)':'var(--surface)',fg:s.view===k?'#fff':'var(--text-2)',go:()=>this.setState({view:k})})),isSitesV:s.view==='sites',bDisp:s.view==='sites'?'none':'flex',q:s.q,onQ:ev=>this.setState({q:ev.target.value}),list,noList:list.length===0,
      add:()=>this.setState({m:{id:null,name:'',code:'',addr:'',tz:'Europe/Paris',admins:[],hol:'fr',wf:'default',tried:false}}),
      hasArch:arch.length>0,archN:arch.length,togArch:()=>this.setState({archOpen:!s.archOpen}),archOpen:s.archOpen,archIcon:s.archOpen?'▾':'▸',archived:arch.map(b=>({name:b.name,counts:b.code+' · archived',bg:s.sel===b.id?'var(--accent-soft)':'transparent',pick:()=>this.setState({sel:b.id})})),
      hasSel:!!d,d,restore:()=>{this.setState(st=>({brs:st.brs.map(b=>b.id===s.sel?Object.assign({},b,{arch:false}):b)}));this.say(cur.name+' restored');},
      edit:()=>this.setState({m:{id:cur.id,name:cur.name,code:cur.code,addr:cur.addr,tz:cur.tz,admins:cur.admins.slice(),hol:cur.hol,wf:cur.wf,tried:false}}),
      delAsk:()=>this.setState({x:{id:cur.id,step:1,action:cur.arch?'delete':'archive',target:'',typed:''}}),
      m:mv||null,tzOpts:TZ.map(([v,l])=>({v,l})),holOpts:Object.keys(HOL).map(k=>({v:k,l:HOL[k][0]})),wfOpts:Object.keys(WF).map(k=>({v:k,l:WF[k][0]})),mClose:()=>this.setState({m:null}),
      mSave:()=>{ if(Object.keys(this.mval()).length){this.setState({m:Object.assign({},m,{tried:true})});return;}
        const f={name:m.name.trim(),code:m.code.trim(),addr:m.addr.trim(),tz:m.tz,admins:m.admins,hol:m.hol,wf:m.wf};
        if(m.id) this.setState(st=>({brs:st.brs.map(b=>b.id===m.id?Object.assign({},b,f):b),m:null}));
        else this.setState(st=>({brs:st.brs.concat(Object.assign({id:'b'+Date.now(),rate:0,arch:false,sites:[]},f)),sel:'b'+Date.now(),m:null}));
        this.say(m.id?'Branch updated':f.name+' created'); },
      x:xv,xClose:()=>this.setState({x:null}),toast:s.toast
    };
  }
}

class AdminBranchesView extends AdminBranchesBase {
  view(S) {
    const tr = this.props.tr;
    const { br } = S;
    return (
<>
<div className="flex flex-col gap-[16px] relative">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("branches_sites")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{br?.sub}
</div>
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(br?.tabsV ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="h-[34px] p-[0_16px] border-0 text-[13px] font-medium cursor-pointer" style={{background:t?.bg,color:t?.fg}}>
{t?.l}
</button>
</Fragment>))}
</div>
</div>
{br?.isSitesV ? (<>
<AdminSites  />
</>) : null}
<div className="flex-col gap-[16px]" style={{display:br?.bDisp}}>
<div className="flex gap-[16px] items-start flex-wrap">
<div className="flex-[0_0_300px] w-[300px] max-w-[100%] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[12px] flex flex-col gap-[10px]">
<div className="flex gap-[8px]">
<div className="flex-1 flex items-center gap-[8px] h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={br?.q} onInput={br?.onQ} placeholder={tr("search_branches_or_sites")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%] min-w-[0]" />
</div>
<button onClick={br?.add} aria-label={tr("add_branch")} className="h-[34px] p-[0_12px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer whitespace-nowrap">
{tr("add_branch")}
</button>
</div>
<div className="flex flex-col gap-[4px]">
{(br?.list ?? []).map((b, $index) => (<Fragment key={$index}>
<div>
<div onClick={b?.pick} className="flex items-center gap-[10px] p-[10px] rounded-[10px] cursor-pointer hover:bg-hover" style={{background:b?.bg}}>
<div className="w-[34px] h-[34px] rounded-[9px] flex-none grid place-items-center [font:600_11px_'Geist_Mono',monospace]" style={{background:b?.ibg,color:b?.ifg}}>
{b?.code}
</div>
<div className="flex-1 min-w-[0]">
<div className="text-[13.5px] font-semibold">
{b?.name}
</div>
<div className="text-[12px] text-text-3">
{b?.counts}
</div>
</div>
<span className="w-[8px] h-[8px] rounded-[50%] flex-none" style={{background:b?.dot}} />
</div>
{(b?.sites ?? []).map((s, $index) => (<Fragment key={$index}>
<div onClick={b?.pick} className="flex items-center gap-[8px] p-[5px_10px_5px_54px] text-[12.5px] text-text-2 cursor-pointer">
<span className="w-[5px] h-[5px] rounded-[50%] bg-border-strong" />
<span className="flex-1 min-w-[0] whitespace-nowrap overflow-hidden text-ellipsis">
{s?.name}
</span>
<span className="text-text-3 text-[12px]">
{s?.emp}
</span>
</div>
</Fragment>))}
</div>
</Fragment>))}
{br?.noList ? (<>
<div className="p-[24px_8px] text-center text-text-3 text-[13px]">
{tr("no_branch_matches_p0",{p0:br?.q ?? ''})}
</div>
</>) : null}
</div>
{br?.hasArch ? (<>
<div className="border-t border-solid border-t-border pt-[8px]">
<button onClick={br?.togArch} className="w-[100%] flex justify-between h-[30px] p-[0_6px] border-0 bg-transparent text-text-2 text-[12.5px] font-medium cursor-pointer">
<span>
{tr("archived_p0",{p0:br?.archN ?? ''})}
</span>
<span>
{br?.archIcon}
</span>
</button>
{br?.archOpen ? (<>
{(br?.archived ?? []).map((a, $index) => (<Fragment key={$index}>
<div onClick={a?.pick} className="flex items-center gap-[10px] p-[8px_10px] rounded-[10px] cursor-pointer opacity-[.75]" style={{background:a?.bg}}>
<div className="flex-1">
<div className="text-[13px] font-medium">
{a?.name}
</div>
<div className="text-[12px] text-text-3">
{a?.counts}
</div>
</div>
</div>
</Fragment>))}
</>) : null}
</div>
</>) : null}
</div>
{br?.hasSel ? (<>
<div className="flex-[1_1_520px] min-w-[0] flex flex-col gap-[16px]">
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[18px_20px] flex gap-[16px] items-start flex-wrap">
<div className="flex-[1_1_280px] min-w-[0]">
<div className="flex items-center gap-[10px] flex-wrap">
<h2 className="m-[0] text-[20px] font-semibold tracking-[-.01em]">
{br?.d?.name}
</h2>
<span className="[font:600_11.5px_'Geist_Mono',monospace] p-[3px_8px] rounded-[6px] bg-neutral-bg text-neutral">
{br?.d?.code}
</span>
{br?.d?.archived ? (<>
<span className="p-[3px_9px] rounded-[6px] text-[12px] font-medium bg-warn-bg text-warn">
{tr("archived")}
</span>
</>) : null}
</div>
<div className="mt-[8px] flex flex-col gap-[3px] text-[13.5px] text-text-2">
<span>
{br?.d?.addr}
</span>
<span>
{tr("p0_p1_leave_p2",{p0:br?.d?.tz ?? '',p1:br?.d?.hol ?? '',p2:br?.d?.wf ?? ''})}
</span>
</div>
</div>
<div className="flex gap-[8px] flex-wrap">
{br?.d?.archived ? (<>
<button onClick={br?.restore} className="h-[34px] p-[0_13px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("restore")}
</button>
</>) : null}
{br?.d?.active ? (<>
<button onClick={br?.edit} className="h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("edit")}
</button>
</>) : null}
<button onClick={br?.delAsk} className="h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-bad text-[13px] font-medium cursor-pointer">
{br?.d?.delL}
</button>
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[12px]">
{(br?.d?.stats ?? []).map((s, $index) => (<Fragment key={$index}>
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
<div className="flex-[1_1_260px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[14.5px] mb-[8px]">
{tr("branch_admins")}
</div>
{(br?.d?.admins ?? []).map((a, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[8px_0]" style={{borderTop:a?.bt}}>
<div className="w-[30px] h-[30px] rounded-[50%] grid place-items-center text-[11.5px] font-semibold bg-info-bg text-info">
{a?.ini}
</div>
<div className="text-[13.5px] font-medium">
{a?.name}
</div>
</div>
</Fragment>))}
{br?.d?.noAdmins ? (<>
<div className="text-[13px] text-warn">
{tr("no_admin_assigned")}
</div>
</>) : null}
</div>
<div className="flex-[2_1_340px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px]">
<div className="font-semibold text-[14.5px] mb-[10px]">
{tr("employees_by_site")}
</div>
{(br?.d?.bars ?? []).map((b, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(100px,150px)_1fr_36px] gap-[10px] items-center p-[5px_0] text-[13px]">
<span className="whitespace-nowrap overflow-hidden text-ellipsis">
{b?.name}
</span>
<div className="h-[8px] rounded-[4px] bg-neutral-bg overflow-hidden">
<div className="h-[100%] bg-accent" style={{width:b?.w}} />
</div>
<span className="[font:12.5px_'Geist_Mono',monospace] text-text-2 text-right">
{b?.n}
</span>
</div>
</Fragment>))}
</div>
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[560px]">
<div className="p-[14px_18px] font-semibold text-[14.5px] border-b border-solid border-b-border">
{tr("sites")}
</div>
{(br?.d?.sites ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(150px,1.3fr)_80px_110px_1.2fr] gap-[12px] items-center p-[12px_18px] border-t border-solid border-t-border text-[13px]">
<div>
<div className="font-medium">
{s?.name}
</div>
<div className="text-[12px] text-text-3">
{s?.addr}
</div>
</div>
<span className="text-text-2">
{tr("p0_staff",{p0:s?.emp ?? ''})}
</span>
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px] text-text-2">
{tr("p0_p1_in",{p0:s?.pres ?? '',p1:s?.exp ?? ''})}
</span>
<div className="flex gap-[12px] justify-end">
{(s?.links ?? []).map((l, $index) => (<Fragment key={$index}>
<a href="#" onClick={l?.go} className="text-[12.5px]">
{l?.l}
</a>
</Fragment>))}
</div>
</div>
</Fragment>))}
{br?.d?.noSites ? (<>
<div className="p-[32px_18px] text-center text-text-3 text-[13.5px]">
{tr("no_sites_in_this_branch")}
</div>
</>) : null}
</div>
</div>
</div>
</>) : null}
</div>
</div>
{br?.m ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[640px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div className="font-semibold text-[16px]">
{br?.m?.title}
</div>
<button onClick={br?.mClose} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[20px] overflow-y-auto flex flex-col gap-[14px]">
{br?.m?.hasErr ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-bad-bg text-bad text-[13px] font-medium">
{tr("fix_the_highlighted_fields_to")}
</div>
</>) : null}
<div className="grid grid-cols-[2fr_1fr] gap-[14px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("branch_name")}
<input value={br?.m?.name} onInput={br?.m?.onName} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${br?.m?.nameBd}`}} />
<span className="text-[12px] text-bad font-normal">
{br?.m?.nameE}
</span>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("code")}
<input value={br?.m?.code} onInput={br?.m?.onCode} maxLength="4" className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${br?.m?.codeBd}`}} />
<span className="text-[12px] text-bad font-normal">
{br?.m?.codeE}
</span>
</label>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("address")}
<input value={br?.m?.addr} onInput={br?.m?.onAddr} placeholder={tr("street_postcode_city")} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${br?.m?.addrBd}`}} />
<span className="text-[12px] text-bad font-normal">
{br?.m?.addrE}
</span>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("timezone")}
<select value={br?.m?.tz} onChange={br?.m?.onTz} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(br?.tzOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("branch_admins")}
</div>
<div className="flex gap-[8px] flex-wrap">
{(br?.m?.adminChips ?? []).map((a, $index) => (<Fragment key={$index}>
<button onClick={a?.go} className="h-[32px] p-[0_12px] rounded-[999px] text-[13px] font-medium cursor-pointer" style={{border:`1px solid ${a?.bd}`,background:a?.bg,color:a?.fg}}>
{a?.name}
</button>
</Fragment>))}
</div>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[14px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("holiday_calendar")}
<select value={br?.m?.hol} onChange={br?.m?.onHol} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(br?.holOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<span className="text-[12px] text-text-3 font-normal">
{br?.m?.holN}
</span>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("leave_approval_workflow")}
<select value={br?.m?.wf} onChange={br?.m?.onWf} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(br?.wfOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<span className="text-[12px] text-text-3 font-normal">
{br?.m?.wfH}
</span>
</label>
</div>
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={br?.mClose} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={br?.mSave} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{br?.m?.saveL}
</button>
</div>
</div>
</div>
</>) : null}
{br?.x ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[520px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div className="font-semibold text-[16px]">
{br?.x?.title}
</div>
<button onClick={br?.xClose} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[20px] overflow-y-auto flex flex-col gap-[14px]">
{br?.x?.step1 ? (<>
{br?.x?.attached ? (<>
<div className="p-[12px_14px] rounded-[10px] bg-warn-bg text-warn text-[13px]">
<b>
{br?.x?.impact}
</b>
{tr("are_still_attached_to_p0",{p0:br?.x?.name ?? ''})}
</div>
</>) : null}
{br?.x?.empty ? (<>
<div className="text-[13.5px] text-text-2">
{tr("p0_has_no_sites_or",{p0:br?.x?.name ?? ''})}
</div>
</>) : null}
<div className="flex flex-col gap-[8px]">
{(br?.x?.choices ?? []).map((c, $index) => (<Fragment key={$index}>
<div onClick={c?.go} className="p-[12px_14px] rounded-[10px] cursor-pointer" style={{border:`1.5px solid ${c?.bd}`,background:c?.bg}}>
<div className="text-[13.5px] font-semibold">
{c?.l}
</div>
<div className="text-[12.5px] text-text-2 mt-[2px]">
{c?.h}
</div>
</div>
</Fragment>))}
</div>
</>) : null}
{br?.x?.step2 ? (<>
<div className="text-[13.5px] text-text-2">
{tr("move")}{" "}
<b className="text-text">
{br?.x?.impact}
</b>
{" "}{tr("to")}
</div>
<select value={br?.x?.target} onChange={br?.x?.onTarget} className="h-[36px] p-[0_9px] rounded-[9px] bg-surface text-text text-[13.5px]" style={{border:`1px solid ${br?.x?.tBd}`}}>
{(br?.x?.targets ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<div className="text-[12.5px] text-text-3">
{tr("attendance_history_stays_with_ea")}
</div>
</>) : null}
{br?.x?.typeConfirm ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("type")}{" "}
<b className="[font-family:'Geist_Mono',monospace] text-bad">
{br?.x?.code}
</b>
{" "}{tr("to_confirm_permanent_deletion")}
<input value={br?.x?.typed} onInput={br?.x?.onTyped} className="h-[36px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" />
</label>
</>) : null}
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={br?.x?.back} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{br?.x?.backL}
</button>
<button onClick={br?.x?.go} className="h-[36px] p-[0_16px] rounded-[9px] border-0 text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{background:br?.x?.goBg,opacity:br?.x?.goOp}}>
{br?.x?.goL}
</button>
</div>
</div>
</div>
</>) : null}
{br?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{br?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminBranches(props: any) {
  const tr = useTranslations('AdminBranches');
  return <AdminBranchesView {...props} tr={tr} />;
}
