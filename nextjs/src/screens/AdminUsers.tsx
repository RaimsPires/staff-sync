'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminRoleEditor from './AdminRoleEditor';

const BR=['Lyon','Paris Nord','Marseille'];
const SITES=[['pd','Part-Dieu Tower'],['cf','Confluence Depot'],['sd','Saint-Denis Hub'],['rl','Roissy Logistics'],['pv','Port Vieux Yard']];
const MK={att:['view','create','edit','delete'],proxy:['view','create'],fraud:['view','approve'],emp:['view','create','edit','delete'],site:['view','create','edit','delete'],branch:['view','create','edit','delete'],sch:['view','create','edit','delete'],lva:['view','approve'],lvs:['view','edit'],rep:['view'],exp:['create'],usr:['view','create','edit','delete'],audit:['view'],set:['view','edit'],bill:['view','edit']};
const PALL=[].concat(...Object.keys(MK).map(m=>MK[m].map(a=>m+'.'+a)));
const A=(m,...x)=>x.map(y=>m+'.'+y);
const SCK={company:'Whole company',branches:'Selected branches',ownBranch:'Own branch',sites:'Selected sites',ownSite:'Own site',self:'Self only'};
const KIND={company:'company',branches:'branch',ownBranch:'branch',sites:'site',ownSite:'site',self:'company'};
const CLR=['info','violet','orange','ok','warn','neutral'];
const R0=[
 {id:'admin',name:'Company admin',desc:'Full access to every branch, site and setting, including users and billing.',scope:'company',scopeK:'company',scopeIds:[],def:true,perms:PALL.slice()},
 {id:'hr',name:'HR manager',desc:'Manages people, leave and attendance across the company. No user administration.',scope:'company',scopeK:'company',scopeIds:[],def:true,perms:[].concat(A('att','view','create','edit'),A('fraud','view','approve'),A('emp','view','create','edit'),A('site','view'),A('branch','view'),A('sch','view','create','edit'),A('lva','view','approve'),A('lvs','view'),A('rep','view'),A('exp','create'),A('audit','view'))},
 {id:'branch',name:'Branch manager',desc:'Runs one or more branches: schedules, approvals, employees and sites inside their scope.',scope:'branch',scopeK:'ownBranch',scopeIds:[],def:true,perms:[].concat(A('att','view','create','edit'),A('proxy','view','create'),A('fraud','view','approve'),A('emp','view','create','edit'),A('site','view'),A('sch','view','create','edit'),A('lva','view','approve'),A('rep','view'),A('exp','create'))},
 {id:'site',name:'Site manager',desc:'Handles daily operations on assigned sites, including proxy check-ins.',scope:'site',scopeK:'ownSite',scopeIds:[],def:true,perms:[].concat(A('att','view'),A('proxy','view','create'),A('emp','view'),A('site','view'),A('sch','view'),A('lva','view'))},
 {id:'viewer',name:'Read-only viewer',desc:'Can see data within their scope but cannot change anything.',scope:'any',scopeK:'branches',scopeIds:['Lyon','Paris Nord','Marseille'],def:true,perms:[].concat(A('att','view'),A('emp','view'),A('site','view'),A('branch','view'),A('sch','view'),A('lva','view'),A('rep','view'))},
 {id:'payroll',name:'Payroll officer',desc:'Reads timesheets and reports for payroll runs across the company.',scope:'company',scopeK:'company',scopeIds:[],def:false,perms:[].concat(A('att','view'),A('emp','view'),A('lva','view'),A('rep','view'),A('exp','create'))}];
const U0=[
 {id:'u1',name:'Claire Vasseur',email:'claire.vasseur@staffsync.io',role:'admin',scope:{k:'company',ids:[]},last:'Active now',status:'active',me:true},
 {id:'u2',name:'Julien Roche',email:'julien.roche@staffsync.io',role:'admin',scope:{k:'company',ids:[]},last:'Today, 09:41',status:'active'},
 {id:'u3',name:'Marc Olivier',email:'marc.olivier@staffsync.io',role:'branch',scope:{k:'branch',ids:['Paris Nord']},last:'Today, 08:12',status:'active'},
 {id:'u4',name:'Nadia Koné',email:'nadia.kone@staffsync.io',role:'branch',scope:{k:'branch',ids:['Lyon','Marseille']},last:'Yesterday',status:'active'},
 {id:'u5',name:'Sarah Benoît',email:'sarah.benoit@staffsync.io',role:'site',scope:{k:'site',ids:['pv']},last:'Oct 13',status:'active'},
 {id:'u6',name:'Hugo Martel',email:'hugo.martel@staffsync.io',role:'site',scope:{k:'site',ids:['pd','cf']},last:'Oct 9',status:'active'},
 {id:'u7',name:'Lucie Perrin',email:'lucie.perrin@staffsync.io',role:'payroll',scope:{k:'company',ids:[]},last:'Oct 2',status:'active'},
 {id:'u8',name:'Théo Gauthier',email:'theo.gauthier@acme-hr.fr',role:'hr',scope:{k:'company',ids:[]},last:'—',status:'invited'},
 {id:'u9',name:'Camille Duval',email:'camille.duval@staffsync.io',role:'viewer',scope:{k:'branch',ids:['Lyon']},last:'Aug 21',status:'revoked'}];
const AV=[['var(--info-bg)','var(--info)'],['var(--violet-bg)','var(--violet)'],['var(--orange-bg)','var(--orange)'],['var(--ok-bg)','var(--ok)'],['var(--warn-bg)','var(--warn)']];
const ST={active:['Active','var(--ok-bg)','var(--ok)'],invited:['Invited','var(--info-bg)','var(--info)'],revoked:['Revoked','var(--neutral-bg)','var(--neutral)']};
const siteN=id=>(SITES.find(s=>s[0]===id)||[0,id])[1];
class AdminUsersBase extends DCLogic {
  state={tab:'users',roles:R0,users:U0,q:'',frole:'all',fst:'all',menu:null,inv:null,rm:null,re:null,rdel:null,toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  role(id){return this.state.roles.find(r=>r.id===id)||R0[0];}
  scopeL(s,role){if(s.k==='company')return 'Whole company';if(s.k==='branch')return s.ids.length===1?s.ids[0]:s.ids.length+' branches';return s.ids.length===1?siteN(s.ids[0]):s.ids.length+' sites';}
  scopeTip(s){return s.k==='company'?'All branches and sites':s.k==='branch'?s.ids.join(', '):s.ids.map(siteN).join(', ');}
  admins(){return this.state.users.filter(u=>u.role==='admin'&&u.status!=='revoked');}
  renderVals(){return{u:this.rv()};}
  rv(){
    const s=this.state,T=this,set=k=>ev=>this.setState({[k]:ev.target.value});
    const cntOf=id=>s.users.filter(u=>u.role===id&&u.status!=='revoked').length;
    const clr=id=>{const i=s.roles.findIndex(r=>r.id===id),c=CLR[(i<0?5:i)%CLR.length];return['var(--'+c+'-bg)','var(--'+c+')'];};
    const q=s.q.trim().toLowerCase();
    const list=s.users.filter(u=>(s.frole==='all'||u.role===s.frole)&&(s.fst==='all'||u.status===s.fst)&&(!q||u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)));
    const rows=list.map((u,i)=>{const av=AV[(u.name.charCodeAt(0)+u.name.length)%AV.length],rc=clr(u.role),st=ST[u.status],open=s.menu===u.id;
      const lastAdmin=u.role==='admin'&&u.status!=='revoked'&&this.admins().length<=1;
      const acts=[];
      if(u.status!=='revoked')acts.push({l:'Change role',c:'var(--text)',go:()=>this.setState({menu:null,inv:{mode:'edit',id:u.id,role:u.role,kind:u.scope.k,ids:u.scope.ids.slice(),tried:false}})});
      if(u.status==='invited')acts.push({l:'Resend invite',c:'var(--text)',go:()=>{this.setState({menu:null});this.say('Invite resent to '+u.email);}});
      if(u.status==='revoked')acts.push({l:'Restore access',c:'var(--ok)',go:()=>{this.setState(st=>({menu:null,users:st.users.map(x=>x.id===u.id?Object.assign({},x,{status:'active',last:'—'}):x)}));this.say(u.name+' can sign in again');}});
      else if(u.me)acts.push({l:'You can’t revoke yourself',c:'var(--text-3)',go:()=>this.setState({menu:null})});
      else acts.push({l:'Revoke access',c:'var(--bad)',go:()=>{if(lastAdmin){this.setState({menu:null});this.say('Keep at least one Company admin');return;}this.setState({menu:null,rm:u.id});}});
      return{name:u.name,you:u.me?' (you)':'',email:u.email,ini:u.name.split(' ').map(w=>w[0]).join('').slice(0,2),avBg:av[0],avFg:av[1],role:s.roles.find(r=>r.id===u.role)?s.roles.find(r=>r.id===u.role).name:'—',rBg:rc[0],rFg:rc[1],scope:this.scopeL(u.scope),scopeTip:this.scopeTip(u.scope),last:u.last,st:st[0],stBg:st[1],stFg:st[2],op:u.status==='revoked'?.6:1,
        menu:ev=>{ev.stopPropagation();this.setState({menu:open?null:u.id});},mbg:open?'var(--hover)':'transparent',menuOpen:open,mtop:i>=list.length-2&&list.length>3?'-100px':'46px',acts};});
    // invite modal
    const iv=s.inv,ir=iv?this.role(iv.role):null,taken=iv&&iv.mode==='new'&&s.users.some(u=>u.email.toLowerCase()===(iv.email||'').trim().toLowerCase());
    const eErr=iv&&iv.tried&&iv.mode==='new'?(!(iv.email||'').trim()?'Email is required':!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(iv.email.trim())?'Enter a valid email address':taken?'This person already has access':''):'';
    const needK=ir?(ir.scope==='any'?iv.kind:ir.scope):null,sErr=iv&&iv.tried&&needK!=='company'&&!iv.ids.length?'Select at least one '+(needK==='branch'?'branch':'site'):'';
    const setIv=p=>this.setState(st=>({inv:Object.assign({},st.inv,p)}));
    const invOpt=ir?(needK==='branch'?BR.map(b=>[b,b]):needK==='site'?SITES:[]):[];
    const invV=iv&&{title:iv.mode==='new'?'Invite user':'Change role & scope',isNew:iv.mode==='new',isEdit:iv.mode==='edit',email:iv.email||'',onEmail:ev=>setIv({email:ev.target.value}),eBd:eErr?'var(--bad-dot)':'var(--border-strong)',eErr,
      who:iv.mode==='edit'?s.users.find(u=>u.id===iv.id).name:'',mail:iv.mode==='edit'?s.users.find(u=>u.id===iv.id).email:'',
      roles:s.roles.map(r=>({l:r.name,d:r.desc,bg:iv.role===r.id?'var(--accent-soft)':'var(--surface)',bd:iv.role===r.id?'var(--accent)':'var(--border)',rb:iv.role===r.id?'var(--accent)':'var(--border-strong)',dot:iv.role===r.id?1:0,go:()=>setIv({role:r.id,kind:r.scope==='any'?(iv.kind==='company'?'branch':iv.kind):r.scope,ids:[]})})),
      fixed:needK==='company',fixedL:'Whole company — this role isn’t limited to branches or sites.',pick:needK!=='company',
      kinds:ir&&ir.scope==='any'?[['company','Whole company'],['branch','Branches'],['site','Sites']].map(([k,l])=>({l,bg:iv.kind===k?'var(--accent)':'var(--surface)',fg:iv.kind===k?'#fff':'var(--text-2)',go:()=>setIv({kind:k,ids:[]})})):[{l:needK==='branch'?'Branches':'Sites',bg:'var(--accent)',fg:'#fff',go:()=>{}}],
      chips:invOpt.map(([k,l])=>{const on=iv.ids.includes(k);return{l,bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:()=>setIv({ids:on?iv.ids.filter(x=>x!==k):iv.ids.concat(k)})};}),sErr,
      msg:iv.msg==null?'You’ve been invited to manage attendance on StaffSync. Accept to set your password.':iv.msg,onMsg:ev=>setIv({msg:ev.target.value}),btn:iv.mode==='new'?'Send invite':'Save changes'};
    const rm=s.rm&&s.users.find(u=>u.id===s.rm);
    const adminsN=this.admins().length;
    return{
      sub:s.tab==='users'?s.users.filter(u=>u.status==='active').length+' active · '+s.users.filter(u=>u.status==='invited').length+' invited · '+adminsN+' Company admin'+(adminsN===1?'':'s'):s.roles.length+' roles · '+s.roles.filter(r=>!r.def).length+' custom',
      tabs:[['users','Dashboard users',s.users.length],['roles','Roles',s.roles.length]].map(([k,l,n])=>({l,n,bd:s.tab===k?'var(--accent)':'transparent',fg:s.tab===k?'var(--text)':'var(--text-2)',fw:s.tab===k?600:500,nbg:s.tab===k?'var(--accent)':'var(--neutral-bg)',nfg:s.tab===k?'#fff':'var(--neutral)',go:()=>this.setState({tab:k,menu:null})})),
      isUsers:s.tab==='users',isRoles:s.tab==='roles',stop:ev=>ev.stopPropagation(),closeMenu:()=>{if(s.menu)this.setState({menu:null});},
      primaryL:s.tab==='users'?'Invite user':'Create role',primary:()=>s.tab==='users'?this.setState({inv:{mode:'new',email:'',role:'site',kind:'site',ids:[],tried:false}}):this.setState({re:{mode:'create',role:null}}),
      q:s.q,onQ:set('q'),filters:[{val:s.frole,on:set('frole'),opts:[{v:'all',l:'All roles'}].concat(s.roles.map(r=>({v:r.id,l:r.name})))},{val:s.fst,on:set('fst'),opts:[{v:'all',l:'Any status'},{v:'active',l:'Active'},{v:'invited',l:'Invited'},{v:'revoked',l:'Revoked'}]}],rows,noRows:rows.length===0,
      inv:invV,invNo:()=>this.setState({inv:null}),
      invGo:()=>{const e=eErr||sErr;if(e||(iv.mode==='new'&&(!(iv.email||'').trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(iv.email.trim())||taken))||(needK!=='company'&&!iv.ids.length)){setIv({tried:true});return;}
        const sc={k:needK==='any'?iv.kind:needK,ids:needK==='company'||iv.kind==='company'&&ir.scope==='any'?[]:iv.ids.slice()};
        if(ir.scope==='any'&&iv.kind==='company'){sc.k='company';sc.ids=[];}
        if(iv.mode==='new'){const em=iv.email.trim();this.setState(st=>({users:st.users.concat({id:'u'+Date.now(),name:em.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),email:em,role:iv.role,scope:sc,last:'—',status:'invited'}),inv:null}));this.say('Invite sent to '+em);}
        else{const cur=s.users.find(u=>u.id===iv.id);if(cur.role==='admin'&&iv.role!=='admin'&&adminsN<=1){this.say('Keep at least one Company admin');return;}this.setState(st=>({users:st.users.map(u=>u.id===iv.id?Object.assign({},u,{role:iv.role,scope:sc}):u),inv:null}));this.say(cur.name+' is now '+ir.name);}},
      rm:rm?{name:rm.name}:null,rmNo:()=>this.setState({rm:null}),rmYes:()=>{const n=rm.name;this.setState(st=>({users:st.users.map(u=>u.id===rm.id?Object.assign({},u,{status:'revoked'}):u),rm:null}));this.say('Access revoked for '+n);},
      permTotal:PALL.length,
      roles:s.roles.map(r=>{const c=clr(r.id),n=cntOf(r.id),ask=s.rdel===r.id;return{name:r.name,desc:r.desc,bg:c[0],fg:c[1],kind:r.def?'Default':'Custom',users:n,pl:n===1?'':'s',has:n===1?'has':'have',perms:r.perms.length,scopeK:SCK[r.scopeK||'company'],custom:!r.def,
        blocked:ask&&n>0,asking:ask&&n===0,edit:()=>this.setState({re:{mode:r.def?'view':'edit',role:r}}),editL:r.def?'View':'Edit',
        dup:()=>this.setState({re:{mode:'duplicate',role:r}}),
        del:()=>this.setState({rdel:ask?null:r.id}),no:()=>this.setState({rdel:null}),yes:()=>{this.setState(st=>({roles:st.roles.filter(x=>x.id!==r.id),rdel:null}));this.say('Role “'+r.name+'” deleted');},
        seeUsers:ev=>{ev.preventDefault();this.setState({tab:'users',frole:r.id,rdel:null});}};}),
      reOpen:!!s.re,mainDisp:s.re?'none':'flex',reRole:s.re&&s.re.role||null,reMode:s.re?s.re.mode:'create',rolesAll:s.roles,reUsers:s.re&&s.re.role?cntOf(s.re.role.id):0,reCancel:()=>this.setState({re:null}),
      reDup:()=>{const role=s.re&&s.re.role;this.setState({re:null},()=>this.setState({re:{mode:'duplicate',role}}));},
      reSave:d=>{const data={name:d.name,desc:d.desc||'Custom role.',perms:d.perms,scopeK:d.scopeK,scopeIds:d.scopeIds,scope:KIND[d.scopeK]};
        if(d.id)this.setState(st=>({roles:st.roles.map(r=>r.id===d.id?Object.assign({},r,data):r),re:null}));else this.setState(st=>({roles:st.roles.concat(Object.assign({id:'c'+Date.now(),def:false},data)),re:null}));this.say(d.id?'Role updated':'Role created');},
      toast:s.toast
    };
  }
}

class AdminUsersView extends AdminUsersBase {
  view(S) {
    const tr = this.props.tr;
    const { u } = S;
    return (
<>
<div onClick={u?.closeMenu} className="flex flex-col gap-[14px] relative">
<div className="flex-col gap-[14px]" style={{display:u?.mainDisp}}>
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("users_roles")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{u?.sub}
</div>
</div>
<button onClick={u?.primary} className="h-[36px] p-[0_15px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{u?.primaryL}
</button>
</div>
<div className="flex gap-[2px] border-b border-solid border-b-border">
{(u?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="flex items-center gap-[8px] h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
<span className="min-w-[20px] h-[20px] p-[0_6px] rounded-[10px] grid place-items-center [font:600_11px_'Geist_Mono',monospace]" style={{background:t?.nbg,color:t?.nfg}}>
{t?.n}
</span>
</button>
</Fragment>))}
</div>
{u?.isUsers ? (<>
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex items-center gap-[8px] h-[34px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3 flex-[1_1_200px] max-w-[300px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={u?.q} onInput={u?.onQ} placeholder={tr("search_name_or_email")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%]" />
</div>
{(u?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[900px]">
<div className="grid grid-cols-[minmax(220px,1.6fr)_150px_minmax(150px,1fr)_120px_100px_36px] gap-[12px] items-center p-[0_16px] h-[38px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div>
{tr("user")}
</div>
<div>
{tr("role")}
</div>
<div>
{tr("scope")}
</div>
<div>
{tr("last_active")}
</div>
<div>
{tr("status")}
</div>
<div />
</div>
{(u?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(220px,1.6fr)_150px_minmax(150px,1fr)_120px_100px_36px] gap-[12px] items-center p-[11px_16px] border-b border-solid border-b-border text-[13px] relative hover:bg-hover" style={{opacity:r?.op}}>
<div className="flex items-center gap-[10px] min-w-[0]">
<div className="w-[34px] h-[34px] rounded-[50%] flex-none grid place-items-center text-[12px] font-semibold" style={{background:r?.avBg,color:r?.avFg}}>
{r?.ini}
</div>
<div className="min-w-[0]">
<div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{r?.name}
<span className="text-text-3 font-normal">
{r?.you}
</span>
</div>
<div className="text-[12px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{r?.email}
</div>
</div>
</div>
<div>
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium" style={{background:r?.rBg,color:r?.rFg}}>
{r?.role}
</span>
</div>
<div title={r?.scopeTip} className="text-text-2">
{r?.scope}
</div>
<div className="text-text-3 text-[12.5px]">
{r?.last}
</div>
<div>
<span className="p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.stBg,color:r?.stFg}}>
{r?.st}
</span>
</div>
<button onClick={r?.menu} aria-label={tr("row_actions")} className="w-[30px] h-[30px] rounded-[8px] border-0 text-text-2 cursor-pointer grid place-items-center" style={{background:r?.mbg}}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
<circle cx="12" cy="5" r="1.8" />
<circle cx="12" cy="12" r="1.8" />
<circle cx="12" cy="19" r="1.8" />
</svg>
</button>
{r?.menuOpen ? (<>
<div onClick={u?.stop} className="absolute right-[16px] z-[20] w-[190px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop" style={{top:r?.mtop}}>
{(r?.acts ?? []).map((a, $index) => (<Fragment key={$index}>
<button onClick={a?.go} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-[13px] cursor-pointer hover:bg-hover" style={{color:a?.c}}>
{a?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
</Fragment>))}
{u?.noRows ? (<>
<div className="p-[44px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_users_match")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{u?.isRoles ? (<>
<div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-[12px]">
{(u?.roles ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[10px]">
<div className="flex items-center gap-[8px]">
<span className="p-[3px_10px] rounded-[999px] text-[12.5px] font-semibold" style={{background:r?.bg,color:r?.fg}}>
{r?.name}
</span>
<span className="text-[11.5px] text-text-3">
{r?.kind}
</span>
<div className="flex-1" />
<span className="text-[12.5px] text-text-2">
{tr("p0_user_p1",{p0:r?.users ?? '',p1:r?.pl ?? ''})}
</span>
</div>
<div className="text-[13px] text-text-2 leading-[1.45] min-h-[36px]">
{r?.desc}
</div>
<div className="text-[12px] text-text-3">
{tr("p0_of_p1_permissions_p2",{p0:r?.perms ?? '',p1:u?.permTotal ?? '',p2:r?.scopeK ?? ''})}
</div>
{r?.blocked ? (<>
<div className="p-[8px_10px] rounded-[8px] bg-warn-bg text-warn text-[12.5px]">
{tr("p0_user_p1_still_p2",{p0:r?.users ?? '',p1:r?.pl ?? '',p2:r?.has ?? ''})}
<div className="mt-[6px]">
<a href="#" onClick={r?.seeUsers} className="text-[12.5px]">
{tr("show_these_users")}
</a>
</div>
</div>
</>) : null}
{r?.asking ? (<>
<div className="p-[8px_10px] rounded-[8px] bg-bad-bg text-bad text-[12.5px] flex gap-[8px] items-center">
{tr("delete_p0",{p0:r?.name ?? ''})}
<div className="flex-1" />
<button onClick={r?.yes} className="h-[26px] p-[0_10px] border-0 rounded-[7px] bg-bad-dot text-[color:#fff] text-[12.5px] cursor-pointer">
{tr("delete")}
</button>
<button onClick={r?.no} className="h-[26px] p-[0_8px] border-0 bg-transparent text-bad text-[12.5px] cursor-pointer">
{tr("cancel")}
</button>
</div>
</>) : null}
<div className="flex gap-[6px] mt-[2px]">
<button onClick={r?.edit} className="h-[30px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{r?.editL}
</button>
<button onClick={r?.dup} className="h-[30px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("duplicate")}
</button>
{r?.custom ? (<>
<button onClick={r?.del} className="h-[30px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("delete")}
</button>
</>) : null}
</div>
</div>
</Fragment>))}
</div>
</>) : null}
</div>
{u?.inv ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[520px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div className="font-semibold text-[16px]">
{u?.inv?.title}
</div>
<button onClick={u?.invNo} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[20px] overflow-y-auto flex flex-col gap-[14px]">
{u?.inv?.isNew ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("email")}
<input value={u?.inv?.email} onInput={u?.inv?.onEmail} placeholder={tr("name_company_com")} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${u?.inv?.eBd}`}} />
<span className="text-[12px] text-bad font-normal">
{u?.inv?.eErr}
</span>
</label>
</>) : null}
{u?.inv?.isEdit ? (<>
<div className="text-[13.5px]">
<b className="font-semibold">
{u?.inv?.who}
</b>
{" "}
<span className="text-text-3">
{"· "}{u?.inv?.mail}
</span>
</div>
</>) : null}
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("role")}
<div className="flex flex-col gap-[6px]">
{(u?.inv?.roles ?? []).map((o, $index) => (<Fragment key={$index}>
<div onClick={o?.go} className="flex gap-[10px] items-start p-[9px_12px] rounded-[10px] cursor-pointer" style={{border:`1.5px solid ${o?.bd}`,background:o?.bg}}>
<span className="w-[16px] h-[16px] rounded-[50%] mt-[2px] flex-none grid place-items-center" style={{border:`1.5px solid ${o?.rb}`}}>
<span className="w-[8px] h-[8px] rounded-[50%] bg-accent" style={{opacity:o?.dot}} />
</span>
<span>
<span className="text-[13.5px] font-medium text-text">
{o?.l}
</span>
<span className="block text-[12px] text-text-3 font-normal">
{o?.d}
</span>
</span>
</div>
</Fragment>))}
</div>
</div>
<div className="flex flex-col gap-[8px] text-[12.5px] font-medium text-text-2">
{tr("scope")}
{u?.inv?.fixed ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-surface-2 border border-solid border-border font-normal">
{u?.inv?.fixedL}
</div>
</>) : null}
{u?.inv?.pick ? (<>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden self-start">
{(u?.inv?.kinds ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="h-[32px] p-[0_13px] border-0 text-[12.5px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
{u?.inv?.chips?.length ? (<>
<div className="flex gap-[6px] flex-wrap">
{(u?.inv?.chips ?? []).map((c, $index) => (<Fragment key={$index}>
<button onClick={c?.go} className="h-[30px] p-[0_11px] rounded-[999px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${c?.bd}`,background:c?.bg,color:c?.fg}}>
{c?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</>) : null}
<span className="text-[12px] text-bad font-normal">
{u?.inv?.sErr}
</span>
</div>
{u?.inv?.isNew ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("message")}{" "}
<span className="font-normal text-text-3">
{tr("optional")}
</span>
<textarea rows="3" value={u?.inv?.msg} onInput={u?.inv?.onMsg} className="resize-y p-[9px_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] [outline:none]" />
</label>
</>) : null}
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={u?.invNo} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={u?.invGo} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{u?.inv?.btn}
</button>
</div>
</div>
</div>
</>) : null}
{u?.rm ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[400px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[16px]">
{tr("revoke_access_for_p0",{p0:u?.rm?.name ?? ''})}
</div>
<div className="text-[13.5px] text-text-2">
{tr("they_will_be_signed_out")}
</div>
<div className="flex gap-[8px] justify-end">
<button onClick={u?.rmNo} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={u?.rmYes} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("revoke_access")}
</button>
</div>
</div>
</div>
</>) : null}
{u?.reOpen ? (<>
<AdminRoleEditor role={u?.reRole} mode={u?.reMode} roles={u?.rolesAll} userCount={u?.reUsers} onSave={u?.reSave} onCancel={u?.reCancel} onDuplicate={u?.reDup} />
</>) : null}
{u?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{u?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminUsers(props: any) {
  const tr = useTranslations('AdminUsers');
  return <AdminUsersView {...props} tr={tr} />;
}
