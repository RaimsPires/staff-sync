'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const EVENTS=[['fraud','Fraud flag raised'],['noshow','No-show after grace period'],['miss','Missing check-out'],['lvnew','New leave request'],['lvdec','Leave decision'],['unc','Uncovered intervention']];
const CH=['In-app','Push','Email'];
const TZ=[['Europe/Paris','Europe/Paris (UTC+1/+2)'],['Europe/London','Europe/London (UTC+0/+1)'],['Europe/Brussels','Europe/Brussels (UTC+1/+2)']];
const V0={name:'Claire Vasseur',email:'claire.vasseur@staffsync.io',phone:'06 12 45 78 99',lang:'en',tz:'Europe/Paris',notif:{fraud:[1,1,1],noshow:[1,1,0],miss:[1,0,1],lvnew:[1,1,1],lvdec:[1,0,1],unc:[1,1,1]}};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const code=()=>Math.floor(Math.random()*1679616).toString(36).padStart(4,'0');
const genCodes=()=>Array.from({length:8},()=>code()+'-'+code());
const O=a=>a.map(x=>({v:x[0],l:x[1]}));
class AdminProfileBase extends DCLogic {
  state={tab:this.props.tab||'profile',v:JSON.parse(JSON.stringify(V0)),base:JSON.stringify(V0),tried:false,pwd:{cur:'',nw:'',cf:'',err:''},tf:{step:'off',code:'',err:'',codes:[],key:'JBSW-Y3DP-EHPK'},sessions:[{id:'s1',dev:'Chrome · macOS',meta:'Lyon, France · active now',cur:true},{id:'s2',dev:'Safari · iPhone',meta:'Lyon, France · 2 hours ago'},{id:'s3',dev:'Edge · Windows',meta:'Paris, France · 3 days ago'}],c:null,toast:null};
  componentDidUpdate(pp){if(pp.tab!==this.props.tab&&this.props.tab)this.setState({tab:this.props.tab});}
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  dirty(){return JSON.stringify(this.state.v)!==this.state.base;}
  errs(){const v=this.state.v,e={};if(!v.name.trim())e.name='Required';if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))e.email='Enter a valid email';return e;}
  setTab(tab){if(tab===this.state.tab)return;if(this.dirty()){this.setState({c:{title:'Unsaved changes',msg:'Leave without saving your changes?',noL:'Stay',okL:'Discard & leave',act:()=>this.setState(s=>({v:JSON.parse(s.base),tab,tried:false,c:null}))}});return;}this.setState({tab,tried:false});}
  renderVals(){return{p:this.rv()};}
  rv(){
    const s=this.state,pr=this.props,v=s.v,er=s.tried?this.errs():{},T=this,dirty=this.dirty();
    const setV=(k,x)=>this.setState(st=>({v:Object.assign({},st.v,{[k]:x}),base:JSON.stringify(Object.assign({},JSON.parse(st.base),{[k]:x}))}));
    const fld=(k,l,h,t,o)=>({l,h,bt:'1px solid var(--border)',isText:false,isSel:false,isView:true,show:t==='sel'?((o||[]).find(x=>x.v===v[k])||{l:v[k]}).l:v[k],val:v[k],opts:o||[],err:er[k]||'',ebd:er[k]?'var(--bad-dot)':'var(--border-strong)',on:ev=>setV(k,ev.target.value)});
    const fields=[fld('name','Full name','','text'),fld('email','Email','Used to sign in.','text'),fld('phone','Phone','','text'),fld('lang','Language','Dashboard and emails.','sel',O([['en','English'],['fr','Français']])),fld('tz','Timezone','','sel',O(TZ))];fields[0].bt='0';
    const canSet=!!pr.canSettings;
    const tf=s.tf,cells=[];let r=hash(tf.key)||1;const rnd=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;r>>>=0;return r;};
    for(let y=0;y<21;y++)for(let x=0;x<21;x++){const f=x<7&&y<7||x>13&&y<7||x<7&&y>13;if(f){const ox=x>13?x-14:x,oy=y>13?y-14:y;if(ox===0||ox===6||oy===0||oy===6||(ox>=2&&ox<=4&&oy>=2&&oy<=4))cells.push({x,y});}else if(!(x===7||y===7||(x===13&&y<8)||(y===13&&x<8))&&rnd()%2)cells.push({x,y});}
    const P=s.pwd,setP=(k,x)=>this.setState(st=>({pwd:Object.assign({},st.pwd,{[k]:x,err:''})})),perr=m=>this.setState(st=>({pwd:Object.assign({},st.pwd,{err:m})}));
    const setTf=o=>this.setState(st=>({tf:Object.assign({},st.tf,o)}));
    return{
      ini:v.name.split(' ').map(w=>w[0]).join('').slice(0,2),name:v.name,email:v.email,role:pr.roleName||'Company admin',scope:pr.scope||'Whole company',onPhoto:()=>this.say('Photo updated'),
      tabs:[['profile','Profile'],['security','Security'],['notif','Notifications']].map(([k,l])=>({l,bd:s.tab===k?'var(--accent)':'transparent',fg:s.tab===k?'var(--text)':'var(--text-2)',fw:s.tab===k?600:500,go:()=>this.setTab(k)})),
      t1:s.tab==='profile',t2:s.tab==='security',t3:s.tab==='notif',fields,
      access:[{k:'Role',v:pr.roleName||'Company admin',c:'var(--text)'},{k:'Data scope',v:pr.scope||'Whole company',c:'var(--text)'},{k:'Company settings',v:canSet?'Allowed':'No access',c:canSet?'var(--ok)':'var(--text-3)'}],
      canSet,setBg:canSet?'var(--surface-2)':'var(--warn-bg)',setFg:canSet?'var(--text-2)':'var(--warn)',setMsg:canSet?'Company-wide settings (attendance rules, leave policies, billing…) are managed separately from your personal profile.':'Your role doesn’t include company settings. A company admin can grant the “Settings” permission in Users & roles.',openSet:()=>pr.onOpenSettings&&pr.onOpenSettings(),
      pw:[['cur','Current password'],['nw','New password'],['cf','Confirm new password']].map(([k,l],i)=>({l,val:P[k],bt:i?'1px solid var(--border)':'0',on:ev=>setP(k,ev.target.value)})),pwErr:P.err,
      pwGo:()=>{if(!P.cur)return perr('Enter your current password');if(P.nw.length<10)return perr('New password must be at least 10 characters');if(P.nw!==P.cf)return perr('Passwords don’t match');this.setState({pwd:{cur:'',nw:'',cf:'',err:''}});this.say('Password updated · other sessions signed out');},
      tf:{off:tf.step==='off',setup:tf.step==='setup',on:tf.step==='on',done:tf.step==='codes',qr:cells,key:tf.key,code:tf.code,cbd:tf.err?'var(--bad-dot)':'var(--border-strong)',err:tf.err,codes:tf.codes,codesT:tf.step==='codes'?'Save these backup codes. Each works once if you lose your phone.':'New backup codes',
        onCode:ev=>setTf({code:ev.target.value.replace(/\D/g,''),err:''}),start:()=>setTf({step:'setup',code:'',err:'',codes:[]}),cancel:()=>setTf({step:'off',code:''}),verify:()=>{if(!/^\d{6}$/.test(tf.code)){setTf({err:'Enter the 6-digit code from your app'});return;}setTf({step:'codes',codes:genCodes(),err:''});},
        dl:()=>{try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([tf.codes.join('\n')],{type:'text/plain'}));a.download='staffsync-backup-codes.txt';a.click();}catch(e){}},doneGo:()=>{setTf({step:'on',codes:[]});this.say('Two-factor authentication is on');},regen:()=>setTf({step:'codes',codes:genCodes()}),
        disable:()=>this.setState({c:{title:'Turn off two-factor?',msg:'Your account will only be protected by your password.',noL:'Cancel',okL:'Turn off',act:()=>this.setState({tf:{step:'off',code:'',err:'',codes:[],key:tf.key},c:null},()=>this.say('Two-factor turned off'))}})},
      sessions:s.sessions.map((x,i)=>({dev:x.dev,meta:x.meta,bt:i?'1px solid var(--border)':'0',curOp:x.cur?1:0,can:!x.cur,out:()=>{this.setState(st=>({sessions:st.sessions.filter(y=>y.id!==x.id)}));this.say('Signed out '+x.dev);}})),outAll:()=>{this.setState(st=>({sessions:st.sessions.filter(x=>x.cur)}));this.say('Signed out of other sessions');},
      notif:EVENTS.map(([id,name])=>({name,ch:CH.map((c,i)=>({bd:v.notif[id][i]?'var(--accent)':'var(--border-strong)',bg:v.notif[id][i]?'var(--accent)':'transparent',op:v.notif[id][i]?1:0,go:()=>setV('notif',Object.assign({},v.notif,{[id]:v.notif[id].map((x,j)=>j===i?(x?0:1):x)}))}))})),
      dirty,dirtyL:Object.keys(er).length?'Fix the highlighted fields to save.':'You have unsaved changes.',discard:()=>this.setState(st=>({v:JSON.parse(st.base),tried:false})),save:()=>{if(Object.keys(this.errs()).length){this.setState({tried:true});return;}this.setState(st=>({base:JSON.stringify(st.v),tried:false}));this.say('Profile saved');},
      editProfile:()=>this.setState({m:{kind:'prof',d:{name:v.name,email:v.email,phone:v.phone,lang:v.lang,tz:v.tz},tried:false}}),
      pwGo:()=>this.setState({m:{kind:'pwd',d:{cur:'',nw:'',cf:''},tried:false}}),pwErr:'',
      pw:[],mv:(this._mv=(()=>{const sm=s.m;if(!sm)return null;const d=sm.d,t=sm.tried,e={},setM=o=>this.setState(st=>({m:Object.assign({},st.m,o)}));
        const F=(k,l,t2,o)=>({l,isText:t2!=='sel',isSel:t2==='sel',type:t2==='password'?'password':'text',opts:o||[],val:d[k],on:ev=>setM({d:Object.assign({},d,{[k]:ev.target.value})}),err:t?e[k]||'':'',ebd:t&&e[k]?'var(--bad-dot)':'var(--border-strong)'});
        if(sm.kind==='prof'){if(!d.name.trim())e.name='Required';if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email))e.email='Enter a valid email';
          return{title:'Edit personal details',okL:'Save',fields:[F('name','Full name','text'),F('email','Email','text'),F('phone','Phone','text'),F('lang','Language','sel',O([['en','English'],['fr','Français']])),F('tz','Timezone','sel',O(TZ))],ok:()=>{if(Object.keys(e).length){setM({tried:true});return;}this.setState(st=>({v:Object.assign({},st.v,d),base:JSON.stringify(Object.assign({},JSON.parse(st.base),d)),m:null}),()=>this.say('Profile saved'));}};}
        if(!d.cur)e.cur='Enter your current password';if(d.nw.length<10)e.nw='At least 10 characters';if(d.nw!==d.cf)e.cf='Passwords don’t match';
        return{title:'Change password',okL:'Update password',fields:[F('cur','Current password','password'),F('nw','New password','password'),F('cf','Confirm new password','password')],ok:()=>{if(Object.keys(e).length){setM({tried:true});return;}this.setState({m:null},()=>this.say('Password updated · other sessions signed out'));}};})()),
      mNo:()=>this.setState({m:null}),mOk:()=>{this._mv&&this._mv.ok&&this._mv.ok();},
      c:s.c,cNo:()=>this.setState({c:null}),cOk:()=>s.c&&s.c.act&&s.c.act(),toast:s.toast
    };
  }
}

class AdminProfileView extends AdminProfileBase {
  view(S) {
    const tr = this.props.tr;
    const { p } = S;
    return (
<>
<div className="flex flex-col gap-[16px] relative max-w-[900px]">
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[20px] flex gap-[18px] items-center flex-wrap">
<div className="w-[72px] h-[72px] rounded-[50%] flex-none grid place-items-center text-[24px] font-semibold bg-info-bg text-info">
{p?.ini}
</div>
<div className="flex-[1_1_260px] min-w-[0]">
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{p?.name}
</h1>
<div className="mt-[6px] flex gap-[6px_14px] flex-wrap text-[13.5px] text-text-2">
<span>
{p?.email}
</span>
<span>
{p?.role}
</span>
<span>
{p?.scope}
</span>
</div>
</div>
<label className="h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer flex items-center">
<input type="file" accept="image/*" onChange={p?.onPhoto} className="hidden" />
{tr("change_photo")}
</label>
</div>
<div className="flex gap-[2px] border-b border-solid border-b-border">
{(p?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
</button>
</Fragment>))}
</div>
{p?.t1 ? (<>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[14px_18px] border-b border-solid border-b-border flex items-center gap-[12px]">
<div className="flex-1 font-semibold text-[14.5px]">
{tr("personal_details")}
</div>
<button onClick={p?.editProfile} className="h-[32px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("edit_details")}
</button>
</div>
{(p?.fields ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(160px,1fr)_minmax(220px,1.4fr)] gap-[8px_24px] p-[12px_18px] items-center" style={{borderTop:f?.bt}}>
<div>
<div className="text-[13.5px] font-medium">
{f?.l}
</div>
<div className="text-[12.5px] text-text-3">
{f?.h}
</div>
</div>
<div className="flex flex-col gap-[4px]">
{f?.isView ? (<>
<span className="text-[13.5px]">
{f?.show}
</span>
</>) : null}
{f?.isText ? (<>
<input value={f?.val} onInput={f?.on} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${f?.ebd}`}} />
</>) : null}
{f?.isSel ? (<>
<select value={f?.val} onChange={f?.on} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
<span className="text-[12px] text-bad">
{f?.err}
</span>
</div>
</div>
</Fragment>))}
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[12px]">
<div className="font-semibold text-[14.5px]">
{tr("your_role_access")}
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[1px] bg-border border border-solid border-border rounded-[10px] overflow-hidden">
{(p?.access ?? []).map((a, $index) => (<Fragment key={$index}>
<div className="bg-surface p-[10px_12px]">
<div className="text-[11.5px] text-text-3">
{a?.k}
</div>
<div className="text-[13.5px] font-medium mt-[2px]" style={{color:a?.c}}>
{a?.v}
</div>
</div>
</Fragment>))}
</div>
<div className="flex items-center gap-[12px] flex-wrap p-[10px_12px] rounded-[10px] text-[13px]" style={{background:p?.setBg,color:p?.setFg}}>
<span className="flex-1 min-w-[200px]">
{p?.setMsg}
</span>
{p?.canSet ? (<>
<button onClick={p?.openSet} className="h-[32px] p-[0_13px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("open_company_settings")}
</button>
</>) : null}
</div>
</section>
</>) : null}
{p?.t2 ? (<>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[14px_18px] border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px]">
{tr("password")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("use_at_least_10_characters")}
</div>
</div>
{(p?.pw ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(160px,1fr)_minmax(220px,1.4fr)] gap-[8px_24px] p-[12px_18px] items-center" style={{borderTop:f?.bt}}>
<div className="text-[13.5px] font-medium">
{f?.l}
</div>
<input type="password" value={f?.val} onInput={f?.on} className="h-[36px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px] [outline:none]" />
</div>
</Fragment>))}
<div className="p-[12px_18px] border-t border-solid border-t-border flex gap-[10px] items-center">
<button onClick={p?.pwGo} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("change_password")}
</button>
<span className="text-[12.5px] text-bad">
{p?.pwErr}
</span>
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[14px]">
<div>
<div className="font-semibold text-[14.5px]">
{tr("two_factor_authentication")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("protects_your_account_if_your")}
</div>
</div>
{p?.tf?.off ? (<>
<button onClick={p?.tf?.start} className="self-start h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("set_up_two_factor")}
</button>
</>) : null}
{p?.tf?.setup ? (<>
<div className="flex gap-[20px] flex-wrap items-start">
<div className="w-[140px] h-[140px] border border-solid border-border rounded-[12px] p-[10px] bg-[color:#fff]">
<svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
{(p?.tf?.qr ?? []).map((c, $index) => (<Fragment key={$index}>
<rect x={c?.x} y={c?.y} width="1" height="1" fill="#0D1B2E" />
</Fragment>))}
</svg>
</div>
<div className="flex-1 min-w-[220px] flex flex-col gap-[10px]">
<div className="text-[13px] text-text-2">
{tr("1_scan_the_code_with")}{" "}
<b className="[font-family:'Geist_Mono',monospace] text-text">
{p?.tf?.key}
</b>
{"."}
<br />
{tr("2_enter_the_6_digit")}
</div>
<div className="flex gap-[8px] items-center">
<input value={p?.tf?.code} onInput={p?.tf?.onCode} maxLength="6" placeholder="000000" inputMode="numeric" className="w-[130px] h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text [font:15px_'Geist_Mono',monospace] tracking-[.2em] [outline:none]" style={{border:`1px solid ${p?.tf?.cbd}`}} />
<button onClick={p?.tf?.verify} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("verify")}
</button>
<button onClick={p?.tf?.cancel} className="h-[36px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</div>
<span className="text-[12px] text-bad">
{p?.tf?.err}
</span>
</div>
</div>
</>) : null}
{p?.tf?.codes?.length ? (<>
<div className="p-[12px] rounded-[10px] bg-surface-2 border border-solid border-border">
<div className="text-[13px] font-medium mb-[8px]">
{p?.tf?.codesT}
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-[6px]">
{(p?.tf?.codes ?? []).map((c, $index) => (<Fragment key={$index}>
<span className="[font:13px_'Geist_Mono',monospace]">
{c}
</span>
</Fragment>))}
</div>
<div className="mt-[10px] flex gap-[8px]">
<button onClick={p?.tf?.dl} className="h-[30px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("download")}
</button>
{p?.tf?.done ? (<>
<button onClick={p?.tf?.doneGo} className="h-[30px] p-[0_12px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[12.5px] cursor-pointer">
{tr("i_ve_saved_them")}
</button>
</>) : null}
</div>
</div>
</>) : null}
{p?.tf?.on ? (<>
<div className="flex items-center gap-[10px] flex-wrap">
<span className="p-[3px_10px] rounded-[999px] text-[12.5px] font-medium bg-ok-bg text-ok">
{tr("enabled")}
</span>
<button onClick={p?.tf?.regen} className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("new_backup_codes")}
</button>
<button onClick={p?.tf?.disable} className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-bad text-[13px] cursor-pointer">
{tr("turn_off")}
</button>
</div>
</>) : null}
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[14px_18px] flex items-center gap-[12px] border-b border-solid border-b-border">
<div className="flex-1">
<div className="font-semibold text-[14.5px]">
{tr("active_sessions")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("devices_signed_in_to_your")}
</div>
</div>
<button onClick={p?.outAll} className="h-[32px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("sign_out_all_others")}
</button>
</div>
{(p?.sessions ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[14px] p-[12px_18px] flex-wrap" style={{borderTop:r?.bt}}>
<div className="flex-1 min-w-[180px]">
<div className="text-[13.5px] font-medium">
{r?.dev}{" "}
<span className="text-[11.5px] p-[2px_7px] rounded-[999px] bg-ok-bg text-ok" style={{opacity:r?.curOp}}>
{tr("this_device")}
</span>
</div>
<div className="text-[12.5px] text-text-3">
{r?.meta}
</div>
</div>
{r?.can ? (<>
<button onClick={r?.out} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("sign_out")}
</button>
</>) : null}
</div>
</Fragment>))}
</section>
</>) : null}
{p?.t3 ? (<>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[520px]">
<div className="p-[14px_18px] border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px]">
{tr("my_notifications")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{tr("only_affects_you_company_wide")}
</div>
</div>
<div className="grid grid-cols-[minmax(220px,1.6fr)_repeat(3,80px)] gap-[6px] p-[0_18px] h-[34px] items-center bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
<div>
{tr("event")}
</div>
<div className="text-center">
{tr("in_app")}
</div>
<div className="text-center">
{tr("push")}
</div>
<div className="text-center">
{tr("email")}
</div>
</div>
{(p?.notif ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(220px,1.6fr)_repeat(3,80px)] gap-[6px] p-[11px_18px] items-center border-t border-solid border-t-border">
<div className="text-[13.5px] font-medium">
{r?.name}
</div>
{(r?.ch ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="grid place-items-center">
<div onClick={c?.go} className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-[color:#fff] cursor-pointer" style={{border:`1.5px solid ${c?.bd}`,background:c?.bg}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:c?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
</div>
</Fragment>))}
</div>
</Fragment>))}
</div>
</section>
</>) : null}
{p?.dirty ? (<>
<div className="sticky bottom-[12px] z-[5] flex items-center gap-[10px] p-[10px_14px] rounded-[12px] bg-surface border border-solid border-warn-dot shadow-pop">
<span className="w-[8px] h-[8px] rounded-[50%] bg-warn-dot" />
<span className="text-[13px] flex-1">
{p?.dirtyL}
</span>
<button onClick={p?.discard} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("discard")}
</button>
<button onClick={p?.save} className="h-[34px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("save_changes")}
</button>
</div>
</>) : null}
{p?.c ? (<>
<div className="fixed inset-[0] bg-overlay z-[60] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[420px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[16px]">
{p?.c?.title}
</div>
<div className="text-[13.5px] text-text-2">
{p?.c?.msg}
</div>
<div className="flex gap-[8px] justify-end">
<button onClick={p?.cNo} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{p?.c?.noL}
</button>
<button onClick={p?.cOk} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{p?.c?.okL}
</button>
</div>
</div>
</div>
</>) : null}
{p?.mv ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[440px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border font-semibold text-[16px]">
{p?.mv?.title}
</div>
<div className="p-[18px_20px] overflow-y-auto flex flex-col gap-[14px]">
{(p?.mv?.fields ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{f?.l}
{f?.isText ? (<>
<input type={f?.type} value={f?.val} onInput={f?.on} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${f?.ebd}`}} />
</>) : null}
{f?.isSel ? (<>
<select value={f?.val} onChange={f?.on} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
<span className="text-[12px] text-bad font-normal">
{f?.err}
</span>
</div>
</Fragment>))}
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={p?.mNo} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={p?.mOk} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{p?.mv?.okL}
</button>
</div>
</div>
</div>
</>) : null}
{p?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{p?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminProfile(props: any) {
  const tr = useTranslations('AdminProfile');
  return <AdminProfileView {...props} tr={tr} />;
}
