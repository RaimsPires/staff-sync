'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const NAV=[['company','Company profile','Your organisation’s identity and regional defaults.'],['attendance','Attendance rules','How check-ins are validated and what counts as late, early or missing.'],['leave','Leave policies','Leave types, approval workflow and public holidays.'],['notif','Notifications','Who is told what, and through which channel.'],['integ','Integrations','Payroll export, API access, webhooks and single sign-on.'],['billing','Billing','Plan, usage, invoices and payment method.'],['danger','Danger zone','Irreversible actions for the whole company.']];
const TZ=[['Europe/Paris','Europe/Paris (UTC+1/+2)'],['Europe/London','Europe/London (UTC+0/+1)'],['Europe/Brussels','Europe/Brussels (UTC+1/+2)'],['Europe/Madrid','Europe/Madrid (UTC+1/+2)']];
const O=a=>a.map(x=>({v:x[0],l:x[1]}));
const HOLC=[['fr','France (national)'],['alsace','France – Alsace-Moselle'],['be','Belgium (national)'],['custom','Custom calendar']];
const EVENTS=[['fraud','Fraud flag raised','A check-in is flagged as suspicious.'],['noshow','No-show after grace period','Employee hasn’t checked in on time.'],['miss','Missing check-out','Shift ended without a check-out.'],['lvnew','New leave request','An employee submits leave.'],['lvdec','Leave decision','A request is approved or rejected.'],['unc','Uncovered intervention','An intervention has nobody assigned.']];
const CH=['In-app','Push','Email','SMS'],ROLES=['Company admin','HR manager','Branch manager','Site manager','Employee'];
const DEF_N={fraud:[[1,1,1,0],[1,0,0,1,0]],noshow:[[1,1,0,0],[0,0,1,1,0]],miss:[[1,0,1,0],[0,1,1,1,0]],lvnew:[[1,1,1,0],[0,1,1,0,0]],lvdec:[[1,1,1,0],[0,0,0,0,1]],unc:[[1,1,1,1],[1,0,1,1,0]]};
const COLORS=[['#2F7DF0','Blue'],['#7C5CE6','Violet'],['#E07A2E','Orange'],['#2F9E6B','Green'],['#D4A017','Amber'],['#6F7A8B','Grey']];
const T0=[{id:'t1',name:'Annual leave',col:'#2F7DF0',paid:true,allow:25,doc:false,notice:14,half:true,carry:5},{id:'t2',name:'RTT',col:'#7C5CE6',paid:true,allow:10,doc:false,notice:7,half:true,carry:0},{id:'t3',name:'Sick leave',col:'#E07A2E',paid:true,allow:5,doc:true,notice:0,half:false,carry:0},{id:'t4',name:'Family event',col:'#2F9E6B',paid:true,allow:4,doc:true,notice:3,half:true,carry:0},{id:'t5',name:'Unpaid leave',col:'#6F7A8B',paid:false,allow:0,doc:false,notice:14,half:false,carry:0}];
const V0={name:'Acme Facility Services',addr:'12 Rue de la Part-Dieu, 69003 Lyon',tz:'Europe/Paris',lang:'en',dfmt:'DD/MM/YYYY',tfmt:'24h',wk:'monday',
 grace:'10',early:'5',autoOut:'23:59',miss:'flag',ot:'daily8',otApp:true,gps:'50',mock:true,selfie:false,qr:true,offline:true,sync:'24',
 wf:'two',hLyon:'fr',hParis:'fr',hMrs:'fr',
 pay:'silae',paySplit:true,sso:'none',ssoDom:'',ssoUrl:'',ssoForce:false,
 pName:'Claire Vasseur',pMail:'claire.vasseur@staffsync.io',pPhone:'06 12 45 78 99',pLang:'en',
 notif:Object.keys(DEF_N).reduce((o,k)=>{o[k]={ch:DEF_N[k][0].slice(),roles:DEF_N[k][1].slice()};return o;},{})};
const PLANS=[['starter','Starter',3,10,'Up to 10 employees'],['growth','Growth',4,20,'Up to 20 employees'],['scale','Scale',5,100,'Up to 100 employees']];
const USED=19;
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const code=n=>{let r=hash('bk'+n+Date.now())||1;let s='';for(let i=0;i<4;i++){r^=r<<13;r^=r>>>17;r^=r<<5;r>>>=0;s+=(r%36).toString(36);}return s;};
const rndKey=p=>p+Array.from({length:24},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('');
const genCodes=()=>Array.from({length:8},()=>code(Math.random())+'-'+code(Math.random()));
class AdminSettingsBase extends DCLogic {
  state={sec:'company',v:JSON.parse(JSON.stringify(V0)),base:JSON.stringify(V0),tried:false,types:T0,keys:[{id:'k1',name:'Payroll sync',prefix:'ss_live_9f3k…',meta:'Created 12 Aug · used today'}],hooks:[{id:'h1',url:'https://payroll.acme.fr/hooks/staffsync',events:['Check-in flagged','Leave approved'],on:true,secret:'whsec_••••'}],plan:'growth',tf:{step:'off',code:'',err:'',codes:[],key:'JBSW-Y3DP-EHPK'},sessions:[{id:'s1',dev:'Chrome · macOS',meta:'Lyon, France · active now',cur:true},{id:'s2',dev:'Safari · iPhone',meta:'Lyon, France · 2 hours ago'},{id:'s3',dev:'Edge · Windows',meta:'Paris, France · 3 days ago'}],pwd:{cur:'',nw:'',cf:'',err:''},pop:null,m:null,c:null,toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  dirty(){return JSON.stringify(this.state.v)!==this.state.base;}
  secFields(sec){const F=(k,l,h,t,o)=>Object.assign({k,l,h,t},o);
    return({
      company:[['Company profile','Shown on invoices, reports and emails.',[F('logo','Logo','Square image, at least 200 px.','logo'),F('name','Company name','','text',{req:1}),F('addr','Address','Registered address.','text',{req:1}),F('tz','Default timezone','Used for new branches and reports.','sel',{opts:O(TZ)}),F('lang','Language','Dashboard and email language.','sel',{opts:O([['en','English'],['fr','Français']])}),F('dfmt','Date format','','sel',{opts:O([['DD/MM/YYYY','31/12/2026'],['MM/DD/YYYY','12/31/2026'],['YYYY-MM-DD','2026-12-31']])}),F('tfmt','Time format','','sel',{opts:O([['24h','24-hour (14:30)'],['12h','12-hour (2:30 PM)']])}),F('wk','Week starts on','Affects schedules and calendars.','sel',{opts:O([['monday','Monday'],['sunday','Sunday'],['saturday','Saturday']])})]]],
      attendance:[['Punctuality','Defaults for new sites. Sites can override them.',[F('grace','Grace period for lateness','Minutes after shift start before someone counts as late.','num',{unit:'min',min:0,max:120}),F('early','Early-leave tolerance','Minutes before shift end that are still fine.','num',{unit:'min',min:0,max:120})]],
        ['Check-out & overtime','',[F('autoOut','Auto check-out time','Open shifts are closed at this time.','time'),F('miss','Missing check-out handling','','sel',{opts:O([['flag','Flag for review'],['auto','Auto check-out at shift end'],['ignore','Ignore']])}),F('ot','Overtime rule','','sel',{opts:O([['daily8','Daily, over 8 hours'],['weekly40','Weekly, over 40 hours'],['approval','Only when approved']])}),F('otApp','Overtime needs approval','Overtime stays pending until a manager approves.','tog')]],
        ['Verification','',[F('gps','Minimum GPS accuracy','Check-ins less accurate than this are flagged.','num',{unit:'m',min:5,max:500}),F('mock','Block mock locations','Reject check-ins from spoofed GPS.','tog'),F('selfie','Require selfie by default','','tog'),F('qr','Require QR scan by default','','tog'),F('offline','Allow offline check-in','Records are kept on the phone until it syncs.','tog'),F('sync','Max sync delay','Offline check-ins older than this are flagged.','num',{unit:'hours',min:1,max:168})]]],
      leave:[['Approval workflow','',[F('wf','Approval levels','','sel',{opts:O([['one','One level — site or branch manager'],['two','Two levels — manager, then HR']])})]],['Public holidays by branch','Holidays are excluded from leave duration.',[F('hLyon','Lyon','','sel',{opts:O(HOLC)}),F('hParis','Paris Nord','','sel',{opts:O(HOLC)}),F('hMrs','Marseille','','sel',{opts:O(HOLC)})]]],
      integ:[['Payroll export','',[F('pay','Export format','Used by timesheet and overtime exports.','sel',{opts:O([['silae','Silae'],['payfit','PayFit'],['adp','ADP'],['csv','Generic CSV'],['xlsx','Excel']])}),F('paySplit','Split overtime into its own column','','tog')]]],
      account:[['Profile','',[F('pName','Full name','','text',{req:1}),F('pMail','Email','Used to sign in.','text',{req:1,mail:1}),F('pPhone','Phone','','text'),F('pLang','Language','','sel',{opts:O([['en','English'],['fr','Français']])})]]]}[sec]||[]);}
  errs(){const v=this.state.v,e={};for(const g of this.secFields(this.state.sec))for(const f of g[2]){const x=v[f.k];if(f.req&&!String(x).trim())e[f.k]='Required';else if(f.mail&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))e[f.k]='Enter a valid email';else if(f.t==='num'&&(x===''||isNaN(+x)||+x<f.min||+x>f.max))e[f.k]='Enter a number from '+f.min+' to '+f.max;}
    if(this.state.sec==='integ'&&v.sso!=='none'){if(!v.ssoDom.trim())e.ssoDom='Required';if(v.sso==='saml'&&!/^https?:\/\//.test(v.ssoUrl))e.ssoUrl='Enter the metadata URL';}return e;}
  go(sec){if(sec===this.state.sec)return;if(this.dirty()){this.setState({c:{title:'Unsaved changes',msg:'You have unsaved changes in this section. Leave without saving?',noL:'Stay',okL:'Discard & leave',bg:'var(--bad-dot)',op:1,act:()=>this.setState(s=>({v:JSON.parse(s.base),sec,tried:false,c:null,pop:null}))}});return;}this.setState({sec,tried:false,pop:null});}
  conf(o){this.setState({c:Object.assign({noL:'Cancel',bg:'var(--bad-dot)',op:1},o)});}
  renderVals(){return{s:this.rv()};}
  rv(){
    const st=this.state,v=st.v,sec=st.sec,T=this,er=st.tried?this.errs():{},dirty=this.dirty();
    const setV=(k,x)=>this.setState(s=>({v:Object.assign({},s.v,{[k]:x}),base:JSON.stringify(Object.assign({},JSON.parse(s.base),{[k]:x}))}));
    const sw=on=>({tbg:on?'var(--accent)':'var(--border-strong)',tl:on?'19px':'2px'});
    const mkF0=(f,i)=>Object.assign({l:f.l,h:f.h,bt:i?'1px solid var(--border)':'0',isText:f.t==='text',isNum:f.t==='num',isSel:f.t==='sel',isTog:f.t==='tog',isTime:false,isLogo:f.t==='logo',type:f.t==='time'?'time':'text',val:v[f.k],opts:f.opts||[],unit:f.unit||'',err:er[f.k]||'',ebd:er[f.k]?'var(--bad-dot)':'var(--border-strong)',ini:(v.name||'?')[0],
      on:f.t==='tog'?()=>setV(f.k,!v[f.k]):f.t==='logo'?()=>T.say('Logo uploaded'):ev=>setV(f.k,ev.target.value)},f.t==='tog'?sw(v[f.k]):{},f.t==='time'?{isText:true}:{});
    const mkF=(f,i)=>{const o=mkF0(f,i);if(f.t==='tog'||f.t==='logo')return Object.assign(o,{isView:false});const sl=(f.opts||[]).find(x=>x.v===v[f.k]);return Object.assign(o,{isView:true,isText:false,isNum:false,isSel:false,show:f.t==='sel'?(sl?sl.l:v[f.k]):f.t==='num'?v[f.k]+' '+(f.unit||''):String(v[f.k]||'—')});};
    const B=(kind,o)=>Object.assign({bd:'var(--border)',tc:'var(--text)',title:'',bsub:'',act:'',actGo:()=>{},actBd:'1px solid var(--border-strong)',actBg:'var(--surface)',actFg:'var(--text)',isForm:false,isTypes:false,isMatrix:false,isKeys:false,isHooks:false,isPlans:false,isInv:false,isPay:false,isTwofa:false,isSessions:false,isDanger:false,btn:'',btnErr:'',btnGo:()=>{},fields:[],rows:[],empty:false,emptyL:''},{['is'+kind]:true},o);
    const forms=this.secFields(sec).map(g=>{const sp=g[2].filter(f=>f.t!=='tog'&&f.t!=='logo');return B('Form',Object.assign({title:g[0],bsub:g[1],fields:g[2].map(mkF)},sp.length?{act:'Edit',actGo:()=>this.setState({m:{kind:'edit',title:g[0],specs:sp,d:sp.reduce((o,f)=>{o[f.k]=String(v[f.k]);return o;},{}),tried:false}})}:{}));});
    let blocks=forms;
    const fld=(l,k,t,o)=>Object.assign({l,k,t,ph:'',err:''},o);
    const modal=m=>this.setState({m});
    const typeModal=t=>{const d=t?Object.assign({},t):{name:'',col:COLORS[0][0],paid:true,allow:'20',doc:false,notice:'0',half:true,carry:'0'};d.allow=String(d.allow);d.notice=String(d.notice);d.carry=String(d.carry);modal({kind:'type',id:t?t.id:null,d,tried:false});};
    if(sec==='leave')blocks=[forms[0],B('Types',{title:'Leave types',bsub:'Each type has its own allowance and rules.',act:'Add leave type',actGo:()=>typeModal(null),actBd:'0',actBg:'var(--accent)',actFg:'#fff',rows:st.types.map(t=>({name:t.name,col:t.col,paid:t.paid?'Paid':'Unpaid',allow:t.allow,doc:t.doc?'Yes':'—',notice:t.notice?t.notice+' d':'—',half:t.half?'Yes':'No',carry:t.carry?t.carry+' d':'—',edit:()=>typeModal(t),del:()=>this.conf({title:'Delete “'+t.name+'”?',msg:'Existing requests keep their type, but employees can no longer request it.',okL:'Delete',act:()=>this.setState(s=>({types:s.types.filter(x=>x.id!==t.id),c:null}),()=>this.say('Leave type deleted'))})}))}),forms[1]];
    if(sec==='notif')blocks=[B('Matrix',{title:'Notification matrix',bsub:'Tick the channels for each event, then choose who receives it.',rows:EVENTS.map(([id,name,desc])=>{const n=v.notif[id],open=st.pop===id;return{name,desc,ch:CH.map((c,i)=>({bd:n.ch[i]?'var(--accent)':'var(--border-strong)',bg:n.ch[i]?'var(--accent)':'transparent',op:n.ch[i]?1:0,go:()=>setV('notif',Object.assign({},v.notif,{[id]:Object.assign({},n,{ch:n.ch.map((x,j)=>j===i?(x?0:1):x)})}))})),
      who:n.roles.some(Boolean)?ROLES.filter((r,i)=>n.roles[i]).map(r=>r.split(' ')[0]).join(', '):'Nobody',rbd:n.roles.some(Boolean)?'var(--border-strong)':'var(--warn-dot)',popOpen:open,pop:ev=>{ev.stopPropagation();this.setState({pop:open?null:id});},
      roles:ROLES.map((l,i)=>({l,bd:n.roles[i]?'var(--accent)':'var(--border-strong)',bg:n.roles[i]?'var(--accent)':'transparent',op:n.roles[i]?1:0,go:()=>setV('notif',Object.assign({},v.notif,{[id]:Object.assign({},n,{roles:n.roles.map((x,j)=>j===i?(x?0:1):x)})}))}))};})})];
    if(sec==='integ'){const sso=[B('Form',{title:'Single sign-on',bsub:'Let people sign in with your identity provider.',act:'Edit',actGo:()=>this.setState({m:{kind:'edit',title:'Single sign-on',blockSso:true,d:{sso:v.sso,ssoDom:v.ssoDom,ssoUrl:v.ssoUrl},tried:false}}),fields:[mkF({k:'sso',l:'Provider',h:'',t:'sel',opts:O([['none','Not configured'],['google','Google Workspace'],['entra','Microsoft Entra ID'],['saml','Generic SAML 2.0']])},0)].concat(v.sso==='none'?[]:[mkF({k:'ssoDom',l:'Email domain',h:'People with this domain use SSO.',t:'text'},1)]).concat(v.sso==='saml'?[mkF({k:'ssoUrl',l:'Metadata URL',h:'',t:'text'},2)]:[]).concat(v.sso==='none'?[]:[mkF({k:'ssoForce',l:'Require SSO',h:'Disables password sign-in for this domain.',t:'tog'},3)]),btn:v.sso==='none'?'':'Test connection',btnGo:()=>{const e=this.errs();if(e.ssoDom||e.ssoUrl){this.setState({tried:true});return;}this.say('Connection to '+v.sso+' succeeded');}})];
      blocks=[forms[0],B('Keys',{title:'API keys',bsub:'Keys give programmatic access. Treat them like passwords.',act:'Create key',actGo:()=>modal({kind:'key',name:'',tried:false}),actBd:'0',actBg:'var(--accent)',actFg:'#fff',rows:st.keys.map(k=>({name:k.name,prefix:k.prefix,meta:k.meta,del:()=>this.conf({title:'Revoke “'+k.name+'”?',msg:'Anything using this key will stop working immediately.',okL:'Revoke key',act:()=>this.setState(s=>({keys:s.keys.filter(x=>x.id!==k.id),c:null}),()=>this.say('Key revoked'))})})),empty:!st.keys.length,emptyL:'No API keys yet.'}),
        B('Hooks',{title:'Webhooks',bsub:'We send a signed POST to your URL when these events happen.',act:'Add webhook',actGo:()=>modal({kind:'hook',url:'',events:['Check-in flagged'],tried:false,secret:rndKey('whsec_')}),actBd:'0',actBg:'var(--accent)',actFg:'#fff',rows:st.hooks.map(h=>({url:h.url,events:h.events.join(', ')||'No events',bg:h.on?'var(--accent)':'var(--border-strong)',left:h.on?'19px':'2px',tog:()=>this.setState(s=>({hooks:s.hooks.map(x=>x.id===h.id?Object.assign({},x,{on:!x.on}):x)})),del:()=>this.conf({title:'Delete this webhook?',msg:h.url,okL:'Delete',act:()=>this.setState(s=>({hooks:s.hooks.filter(x=>x.id!==h.id),c:null}),()=>this.say('Webhook deleted'))})})),empty:!st.hooks.length,emptyL:'No webhooks yet.'})].concat(sso);}
    if(sec==='billing'){const pl=PLANS.find(p=>p[0]===st.plan);blocks=[B('Plans',{title:'Plan & usage',bsub:'Renews on 1 November 2026 · billed monthly',usage:USED+' of '+pl[3]+' employees',uNote:pl[3]-USED<=2?(pl[3]-USED)+' seat'+(pl[3]-USED===1?'':'s')+' left':'',uc:'var(--warn)',uw:Math.round(USED/pl[3]*100)+'%',ubar:USED/pl[3]>.9?'var(--warn-dot)':'var(--accent)',
        plans:PLANS.map(p=>{const cur=p[0]===st.plan,small=p[3]<USED,up=p[3]>pl[3];return{name:p[1],price:'€'+p[2]+' per employee / month',cap:p[4],bd:cur?'var(--accent)':'var(--border)',bg:cur?'var(--accent-soft)':'var(--surface)',cur:cur?1:0,btn:cur?'Your plan':small?'Too many employees':up?'Upgrade':'Downgrade',dis:cur||small,op:cur||small?.5:1,go:()=>this.conf({title:(up?'Upgrade':'Downgrade')+' to '+p[1]+'?',msg:'New price €'+p[2]+' per employee per month from your next invoice.',bg:'var(--accent)',okL:'Confirm',act:()=>this.setState({plan:p[0],c:null},()=>this.say('Plan changed to '+p[1]))})};})}),
      B('Pay',{title:'Payment method',act:'Update',actGo:()=>modal({kind:'card',num:'',exp:'',tried:false}),card:'Visa ending 4242',exp:'Expires 08/2028 · Claire Vasseur'}),
      B('Inv',{title:'Invoices',rows:[['INV-2026-10','1 Oct 2026','€76.00','Paid'],['INV-2026-09','1 Sep 2026','€76.00','Paid'],['INV-2026-08','1 Aug 2026','€72.00','Paid'],['INV-2026-07','1 Jul 2026','€68.00','Paid'],['INV-2026-06','1 Jun 2026','€64.00','Paid']].map(r=>({id:r[0],date:r[1],amt:r[2],st:r[3],bg:'var(--ok-bg)',fg:'var(--ok)',dl:ev=>{ev.preventDefault();T.say('Downloading '+r[0]);}}))})];}
    if(sec==='account'){const tf=st.tf,cells=[];let r=hash(tf.key)||1;const rnd=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;r>>>=0;return r;};for(let y=0;y<21;y++)for(let x=0;x<21;x++){const f=x<7&&y<7||x>13&&y<7||x<7&&y>13;if(f){const ox=x>13?x-14:x,oy=y>13?y-14:y;if(ox===0||ox===6||oy===0||oy===6||(ox>=2&&ox<=4&&oy>=2&&oy<=4))cells.push({x,y});}else if(!(x===7||y===7||(x===13&&y<8)||(y===13&&x<8))&&rnd()%2)cells.push({x,y});}
      const P=st.pwd,pf=(k,l)=>({l,h:'',bt:'0',isText:true,isNum:false,isSel:false,isTog:false,isLogo:false,type:'password',val:P[k],unit:'',err:'',ebd:'var(--border-strong)',on:ev=>{const x=ev.target.value;this.setState(s=>({pwd:Object.assign({},s.pwd,{[k]:x,err:''})}));}});
      blocks=[forms[0],B('Form',{title:'Password',bsub:'Use at least 10 characters.',fields:[pf('cur','Current password'),pf('nw','New password'),pf('cf','Confirm new password')].map((f,i)=>Object.assign(f,{bt:i?'1px solid var(--border)':'0'})),btn:'Update password',btnErr:P.err,btnGo:()=>{if(!P.cur)return this.setState(s=>({pwd:Object.assign({},s.pwd,{err:'Enter your current password'})}));if(P.nw.length<10)return this.setState(s=>({pwd:Object.assign({},s.pwd,{err:'New password must be at least 10 characters'})}));if(P.nw!==P.cf)return this.setState(s=>({pwd:Object.assign({},s.pwd,{err:'Passwords don’t match'})}));this.setState({pwd:{cur:'',nw:'',cf:'',err:''}});this.say('Password updated · other sessions signed out');}}),
        B('Twofa',{title:'Two-factor authentication',bsub:'Protects your account if your password is stolen.',off:tf.step==='off',setup:tf.step==='setup',on:tf.step==='on',qr:cells,key:tf.key,code:tf.code,cbd:tf.err?'var(--bad-dot)':'var(--border-strong)',err:tf.err,codes:tf.codes,codesT:tf.step==='codes'?'Save these backup codes. Each works once if you lose your phone.':'New backup codes',done:tf.step==='codes',
          onCode:ev=>{const x=ev.target.value.replace(/\D/g,'');this.setState(s=>({tf:Object.assign({},s.tf,{code:x,err:''})}));},start:()=>this.setState(s=>({tf:Object.assign({},s.tf,{step:'setup',code:'',err:'',codes:[]})})),cancel:()=>this.setState(s=>({tf:Object.assign({},s.tf,{step:'off',code:''})})),
          verify:()=>{if(!/^\d{6}$/.test(tf.code)){this.setState(s=>({tf:Object.assign({},s.tf,{err:'Enter the 6-digit code from your app'})}));return;}this.setState(s=>({tf:Object.assign({},s.tf,{step:'codes',codes:genCodes(),err:''})}));},
          dl:()=>{try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([tf.codes.join('\n')],{type:'text/plain'}));a.download='staffsync-backup-codes.txt';a.click();}catch(e){}},doneGo:()=>{this.setState(s=>({tf:Object.assign({},s.tf,{step:'on',codes:[]})}));this.say('Two-factor authentication is on');},
          regen:()=>this.setState(s=>({tf:Object.assign({},s.tf,{step:'codes',codes:genCodes()})})),disable:()=>this.conf({title:'Turn off two-factor?',msg:'Your account will only be protected by your password.',okL:'Turn off',act:()=>this.setState(s=>({tf:{step:'off',code:'',err:'',codes:[],key:s.tf.key},c:null}),()=>this.say('Two-factor turned off'))})}),
        B('Sessions',{title:'Active sessions',bsub:'Devices currently signed in to your account.',act:'Sign out all others',actGo:()=>{this.setState(s=>({sessions:s.sessions.filter(x=>x.cur)}));this.say('Signed out of other sessions');},rows:st.sessions.map(x=>({dev:x.dev,meta:x.meta,curOp:x.cur?1:0,can:!x.cur,out:()=>{this.setState(s=>({sessions:s.sessions.filter(y=>y.id!==x.id)}));this.say('Signed out '+x.dev);}}))})];}
    if(sec==='danger')blocks=[B('Danger',{bd:'var(--bad-dot)',title:'Danger zone',tc:'var(--bad)',bsub:'These actions can’t be undone.',rows:[{l:'Export all data',h:'Employees, attendance, leave and the audit log as a ZIP. We’ll email you a download link.',btn:'Request export',bd:'1px solid var(--border-strong)',bg:'var(--surface)',fg:'var(--text)',bt:'0',go:()=>this.say('Export requested · link will be emailed to you')},{l:'Delete company',h:'Permanently deletes '+V0.name+' with all its branches, employees, records and users.',btn:'Delete company',bd:'0',bg:'var(--bad-dot)',fg:'#fff',bt:'1px solid var(--border)',go:()=>this.setState({c:{title:'Delete '+V0.name+'?',msg:'All data will be erased within 30 days. Everyone loses access immediately.',typed:true,word:V0.name,val:'',noL:'Cancel',okL:'Delete company',bg:'var(--bad-dot)',op:.45,act:()=>{this.setState({c:null});this.say('Deletion scheduled · check your email to confirm');}}})}]})];
    // modal
    let m=null;const sm=st.m;
    if(sm){const setM=p=>this.setState(s=>({m:Object.assign({},s.m,p)}));const t=sm.tried;
      if(sm.kind==='edit'){const specs=sm.blockSso?[{k:'sso',l:'Provider',t:'sel',opts:O([['none','Not configured'],['google','Google Workspace'],['entra','Microsoft Entra ID'],['saml','Generic SAML 2.0']])}].concat(sm.d.sso==='none'?[]:[{k:'ssoDom',l:'Email domain',t:'text',req:1}]).concat(sm.d.sso==='saml'?[{k:'ssoUrl',l:'Metadata URL',t:'text',req:1,url:1}]:[]):sm.specs;const ee={};specs.forEach(f=>{const x=sm.d[f.k];if(f.req&&!String(x).trim())ee[f.k]='Required';else if(f.mail&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))ee[f.k]='Enter a valid email';else if(f.t==='num'&&(x===''||isNaN(+x)||+x<f.min||+x>f.max))ee[f.k]='Enter a number from '+f.min+' to '+f.max;else if(f.url&&!/^https?:\/\//.test(x))ee[f.k]='Enter a valid URL';});
        m={title:sm.title,okL:'Save',noL:'Cancel',fields:specs.map(f=>({l:f.l,isText:f.t==='text'||f.t==='time',isNum:f.t==='num',isSel:f.t==='sel',type:f.t==='time'?'time':'text',opts:f.opts||[],ph:'',val:sm.d[f.k],on:ev=>setM({d:Object.assign({},sm.d,{[f.k]:ev.target.value})}),err:t?ee[f.k]||'':'',ebd:t&&ee[f.k]?'var(--bad-dot)':'var(--border-strong)'})),ok:()=>{if(Object.keys(ee).length){setM({tried:true});return;}const patch={};specs.forEach(f=>{patch[f.k]=sm.d[f.k];});this.setState(s=>({v:Object.assign({},s.v,patch),base:JSON.stringify(Object.assign({},JSON.parse(s.base),patch)),m:null}),()=>this.say('Saved'));}};}
      if(sm.kind==='type'){const d=sm.d,sd=p=>setM({d:Object.assign({},d,p)}),bad=!d.name.trim(),badA=d.allow===''||+d.allow<0;
        m={title:sm.id?'Edit leave type':'Add leave type',okL:sm.id?'Save':'Add',noL:'Cancel',fields:[{l:'Name',isText:true,val:d.name,on:ev=>sd({name:ev.target.value}),err:t&&bad?'Name is required':'',ebd:t&&bad?'var(--bad-dot)':'var(--border-strong)'},{l:'Colour',isChips:true,chips:COLORS.map(c=>({l:c[1],dot:c[0],bd:d.col===c[0]?'var(--accent)':'var(--border)',bg:d.col===c[0]?'var(--accent-soft)':'var(--surface)',fg:'var(--text)',go:()=>sd({col:c[0]})}))},{l:'Paid',isTog:true,on:()=>sd({paid:!d.paid}),...sw(d.paid)},{l:'Allowance per year (days)',isNum:true,val:d.allow,on:ev=>sd({allow:ev.target.value}),err:t&&badA?'Enter 0 or more':'',ebd:t&&badA?'var(--bad-dot)':'var(--border-strong)'},{l:'Document required',isTog:true,on:()=>sd({doc:!d.doc}),...sw(d.doc)},{l:'Minimum notice (days)',isNum:true,val:d.notice,on:ev=>sd({notice:ev.target.value}),err:'',ebd:'var(--border-strong)'},{l:'Half days allowed',isTog:true,on:()=>sd({half:!d.half}),...sw(d.half)},{l:'Carry-over max (days)',isNum:true,val:d.carry,on:ev=>sd({carry:ev.target.value}),err:'',ebd:'var(--border-strong)'}],
          ok:()=>{if(bad||badA){setM({tried:true});return;}const nt={id:sm.id||'t'+Date.now(),name:d.name.trim(),col:d.col,paid:d.paid,allow:+d.allow,doc:d.doc,notice:+d.notice||0,half:d.half,carry:+d.carry||0};this.setState(s=>({types:sm.id?s.types.map(x=>x.id===sm.id?nt:x):s.types.concat(nt),m:null}),()=>this.say(sm.id?'Leave type updated':'Leave type added'));}};}
      if(sm.kind==='key'){const bad=!sm.name.trim();m=sm.secret?{title:'Key created',noL:'Done',okL:'',note:'Copy it now. You won’t be able to see it again.',secretL:'Secret key',secret:sm.secret,fields:[],ok:()=>{}}:{title:'Create API key',okL:'Create key',noL:'Cancel',fields:[{l:'Key name',isText:true,ph:'e.g. Payroll sync',val:sm.name,on:ev=>setM({name:ev.target.value}),err:t&&bad?'Give the key a name':'',ebd:t&&bad?'var(--bad-dot)':'var(--border-strong)'}],ok:()=>{if(bad){setM({tried:true});return;}const s2=rndKey('ss_live_');this.setState(s=>({keys:s.keys.concat({id:'k'+Date.now(),name:sm.name.trim(),prefix:s2.slice(0,12)+'…',meta:'Created just now · never used'}),m:Object.assign({},s.m,{secret:s2})}));}};}
      if(sm.kind==='hook'){const EV=['Check-in flagged','Check-in created','Leave requested','Leave approved','Employee deactivated','Schedule published'],badU=!/^https:\/\/.+\..+/.test(sm.url),badE=!sm.events.length;
        m={title:'Add webhook',okL:'Add webhook',noL:'Cancel',secretL:'Signing secret (shown once)',secret:sm.secret,fields:[{l:'Endpoint URL',isText:true,ph:'https://example.com/hooks',val:sm.url,on:ev=>setM({url:ev.target.value}),err:t&&badU?'Enter an HTTPS URL':'',ebd:t&&badU?'var(--bad-dot)':'var(--border-strong)'},{l:'Events',isChips:true,err:t&&badE?'Pick at least one event':'',chips:EV.map(e=>{const on=sm.events.includes(e);return{l:e,dot:on?'var(--accent)':'var(--border-strong)',bd:on?'var(--accent)':'var(--border)',bg:on?'var(--accent-soft)':'var(--surface)',fg:'var(--text)',go:()=>setM({events:on?sm.events.filter(x=>x!==e):sm.events.concat(e)})};})}],
          ok:()=>{if(badU||badE){setM({tried:true});return;}this.setState(s=>({hooks:s.hooks.concat({id:'h'+Date.now(),url:sm.url.trim(),events:sm.events,on:true}),m:null}),()=>this.say('Webhook added'));}};}
      if(sm.kind==='card'){const bn=sm.num.replace(/\s/g,'').length<13,be=!/^(0[1-9]|1[0-2])\/\d{2}$/.test(sm.exp);m={title:'Update payment method',okL:'Save card',noL:'Cancel',fields:[{l:'Card number',isText:true,ph:'4242 4242 4242 4242',val:sm.num,on:ev=>setM({num:ev.target.value}),err:t&&bn?'Enter a valid card number':'',ebd:t&&bn?'var(--bad-dot)':'var(--border-strong)'},{l:'Expiry (MM/YY)',isText:true,ph:'08/28',val:sm.exp,on:ev=>setM({exp:ev.target.value}),err:t&&be?'Use MM/YY':'',ebd:t&&be?'var(--bad-dot)':'var(--border-strong)'}],ok:()=>{if(bn||be){setM({tried:true});return;}this.setState({m:null});this.say('Payment method updated');}};}
    }
    const c=st.c;const nv=NAV.find(n=>n[0]===sec);
    return{
      nav:NAV.map(n=>({l:n[1],bg:sec===n[0]?'var(--accent-soft)':'transparent',fg:sec===n[0]?'var(--accent)':n[0]==='danger'?'var(--bad)':'var(--text)',fw:sec===n[0]?600:500,dot:sec===n[0]?'var(--accent)':'var(--border-strong)',go:()=>this.go(n[0])})),
      title:nv[1],sub:nv[2],blocks,stop:ev=>ev.stopPropagation(),closePop:()=>{if(st.pop)this.setState({pop:null});},
      dirty,dirtyL:Object.keys(er).length?'Fix the highlighted fields to save.':'You have unsaved changes.',discard:()=>this.setState(s=>({v:JSON.parse(s.base),tried:false})),save:()=>{if(Object.keys(this.errs()).length){this.setState({tried:true});return;}this.setState(s=>({base:JSON.stringify(s.v),tried:false}));this.say('Settings saved');},
      m,mNo:()=>this.setState({m:null}),mOk:()=>sm&&m&&m.ok&&m.ok(),
      c:c?{title:c.title,msg:c.msg,typed:!!c.typed,word:c.word,val:c.val,onVal:ev=>this.setState(s=>({c:Object.assign({},s.c,{val:ev.target.value,op:ev.target.value===s.c.word?1:.45})})),noL:c.noL,okL:c.okL,bg:c.bg,op:c.op}:null,cNo:()=>this.setState({c:null}),cOk:()=>{if(c.typed&&c.val!==c.word)return;c.act&&c.act();},toast:st.toast
    };
  }
}

class AdminSettingsView extends AdminSettingsBase {
  view(S) {
    const tr = this.props.tr;
    const { s } = S;
    return (
<>
<div onClick={s?.closePop} className="flex gap-[20px] items-start flex-wrap relative">
<nav className="flex-[0_0_220px] w-[220px] max-w-[100%] flex flex-col gap-[2px] bg-surface border border-solid border-border rounded-[12px] shadow-card p-[8px]">
<div className="p-[8px_10px_6px] text-[11.5px] font-semibold text-text-3 uppercase tracking-[.05em]">
{tr("settings")}
</div>
{(s?.nav ?? []).map((n, $index) => (<Fragment key={$index}>
<button onClick={n?.go} className="flex items-center gap-[10px] h-[36px] p-[0_10px] border-0 rounded-[8px] text-[13.5px] text-left cursor-pointer hover:bg-hover" style={{background:n?.bg,color:n?.fg,fontWeight:n?.fw}}>
<span className="w-[6px] h-[6px] rounded-[50%]" style={{background:n?.dot}} />
{n?.l}
</button>
</Fragment>))}
</nav>
<div className="flex-[1_1_560px] min-w-[0] flex flex-col gap-[14px]">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{s?.title}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{s?.sub}
</div>
</div>
{(s?.blocks ?? []).map((b, $index) => (<Fragment key={$index}>
<section className="bg-surface rounded-[12px] shadow-card overflow-hidden" style={{border:`1px solid ${b?.bd}`}}>
{b?.title ? (<>
<div className="p-[14px_18px] flex items-center gap-[12px] flex-wrap border-b border-solid border-b-border">
<div className="flex-1 min-w-[180px]">
<div className="font-semibold text-[14.5px]" style={{color:b?.tc}}>
{b?.title}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{b?.bsub}
</div>
</div>
{b?.act ? (<>
<button onClick={b?.actGo} className="h-[32px] p-[0_13px] rounded-[9px] text-[13px] font-medium cursor-pointer" style={{border:b?.actBd,background:b?.actBg,color:b?.actFg}}>
{b?.act}
</button>
</>) : null}
</div>
</>) : null}
{b?.isForm ? (<>
{(b?.fields ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(180px,1fr)_minmax(220px,1.2fr)] gap-[8px_24px] p-[13px_18px] items-center" style={{borderTop:f?.bt}}>
<div>
<div className="text-[13.5px] font-medium">
{f?.l}
</div>
<div className="text-[12.5px] text-text-3 mt-[1px]">
{f?.h}
</div>
</div>
<div className="flex flex-col gap-[4px] items-start">
{f?.isView ? (<>
<span className="text-[13.5px] text-text [word-break:break-word]">
{f?.show}
</span>
</>) : null}
{f?.isText ? (<>
<input type={f?.type} value={f?.val} onInput={f?.on} className="w-[100%] box-border h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${f?.ebd}`}} />
</>) : null}
{f?.isNum ? (<>
<div className="flex items-center gap-[8px]">
<input type="number" value={f?.val} onInput={f?.on} className="w-[100px] h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${f?.ebd}`}} />
<span className="text-[12.5px] text-text-3">
{f?.unit}
</span>
</div>
</>) : null}
{f?.isSel ? (<>
<select value={f?.val} onChange={f?.on} className="w-[100%] h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
{f?.isTog ? (<>
<div onClick={f?.on} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer" style={{background:f?.tbg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:f?.tl}} />
</div>
</>) : null}
{f?.isLogo ? (<>
<div className="flex items-center gap-[12px]">
<div className="w-[56px] h-[56px] rounded-[12px] bg-accent-soft text-accent grid place-items-center font-bold text-[18px]">
{f?.ini}
</div>
<label className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer flex items-center">
<input type="file" accept="image/*" onChange={f?.on} className="hidden" />
{tr("upload_logo")}
</label>
</div>
</>) : null}
<span className="text-[12px] text-bad">
{f?.err}
</span>
</div>
</div>
</Fragment>))}
{b?.btn ? (<>
<div className="p-[12px_18px] border-t border-solid border-t-border flex gap-[10px] items-center">
<button onClick={b?.btnGo} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{b?.btn}
</button>
<span className="text-[12.5px] text-bad">
{b?.btnErr}
</span>
</div>
</>) : null}
</>) : null}
{b?.isTypes ? (<>
<div className="overflow-x-auto">
<div className="min-w-[760px]">
<div className="grid grid-cols-[minmax(160px,1.4fr)_80px_90px_70px_80px_70px_80px_120px] gap-[10px] p-[0_18px] h-[34px] items-center bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
<div>
{tr("type")}
</div>
<div>
{tr("pay")}
</div>
<div>
{tr("days_year")}
</div>
<div>
{tr("doc")}
</div>
<div>
{tr("notice")}
</div>
<div>
{tr("half")}
</div>
<div>
{tr("carry_over")}
</div>
<div />
</div>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(160px,1.4fr)_80px_90px_70px_80px_70px_80px_120px] gap-[10px] p-[11px_18px] items-center border-t border-solid border-t-border text-[13px]">
<div className="flex items-center gap-[9px]">
<span className="w-[12px] h-[12px] rounded-[4px]" style={{background:r?.col}} />
<span className="font-medium">
{r?.name}
</span>
</div>
<span>
{r?.paid}
</span>
<span className="[font-family:'Geist_Mono',monospace]">
{r?.allow}
</span>
<span>
{r?.doc}
</span>
<span>
{r?.notice}
</span>
<span>
{r?.half}
</span>
<span>
{r?.carry}
</span>
<div className="flex gap-[6px] justify-end">
<button onClick={r?.edit} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("edit")}
</button>
<button onClick={r?.del} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("delete")}
</button>
</div>
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{b?.isMatrix ? (<>
<div className="overflow-x-auto">
<div className="min-w-[700px]">
<div className="grid grid-cols-[minmax(210px,1.6fr)_repeat(4,64px)_190px] gap-[6px] p-[0_18px] h-[36px] items-center bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
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
<div className="text-center">
{tr("sms")}
</div>
<div>
{tr("sent_to")}
</div>
</div>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(210px,1.6fr)_repeat(4,64px)_190px] gap-[6px] p-[10px_18px] items-center border-t border-solid border-t-border relative">
<div>
<div className="text-[13.5px] font-medium">
{r?.name}
</div>
<div className="text-[12px] text-text-3">
{r?.desc}
</div>
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
<div className="relative">
<button onClick={r?.pop} className="w-[100%] h-[32px] p-[0_10px] rounded-[8px] bg-surface text-text text-[12.5px] text-left cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis" style={{border:`1px solid ${r?.rbd}`}}>
{r?.who}{" ▾"}
</button>
{r?.popOpen ? (<>
<div onClick={s?.stop} className="absolute right-[0] top-[36px] z-[20] w-[200px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(r?.roles ?? []).map((o, $index) => (<Fragment key={$index}>
<div onClick={o?.go} className="flex items-center gap-[10px] p-[7px_10px] rounded-[8px] cursor-pointer text-[13px] hover:bg-hover">
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${o?.bd}`,background:o?.bg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:o?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
{o?.l}
</div>
</Fragment>))}
</div>
</>) : null}
</div>
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{b?.isKeys ? (<>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[14px] p-[12px_18px] border-t border-solid border-t-border flex-wrap">
<div className="flex-1 min-w-[160px]">
<div className="text-[13.5px] font-medium">
{r?.name}
</div>
<div className="[font:12px_'Geist_Mono',monospace] text-text-3">
{r?.prefix}
</div>
</div>
<div className="text-[12.5px] text-text-3">
{r?.meta}
</div>
<button onClick={r?.del} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("revoke")}
</button>
</div>
</Fragment>))}
{b?.empty ? (<>
<div className="p-[24px_18px] text-text-3 text-[13px]">
{b?.emptyL}
</div>
</>) : null}
</>) : null}
{b?.isHooks ? (<>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[14px] p-[12px_18px] border-t border-solid border-t-border flex-wrap">
<div className="flex-1 min-w-[200px]">
<div className="[font:13px_'Geist_Mono',monospace] [word-break:break-all]">
{r?.url}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{r?.events}
</div>
</div>
<div onClick={r?.tog} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:r?.bg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:r?.left}} />
</div>
<button onClick={r?.del} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-bad text-[12.5px] cursor-pointer">
{tr("delete")}
</button>
</div>
</Fragment>))}
{b?.empty ? (<>
<div className="p-[24px_18px] text-text-3 text-[13px]">
{b?.emptyL}
</div>
</>) : null}
</>) : null}
{b?.isPlans ? (<>
<div className="p-[16px_18px] flex flex-col gap-[6px]">
<div className="flex justify-between text-[13px]">
<span className="font-medium">
{b?.usage}
</span>
<span style={{color:b?.uc}}>
{b?.uNote}
</span>
</div>
<div className="h-[8px] rounded-[4px] bg-neutral-bg overflow-hidden">
<div className="h-[100%]" style={{width:b?.uw,background:b?.ubar}} />
</div>
</div>
<div className="p-[0_18px_18px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
{(b?.plans ?? []).map((p, $index) => (<Fragment key={$index}>
<div className="rounded-[12px] p-[14px] flex flex-col gap-[6px]" style={{border:`1.5px solid ${p?.bd}`,background:p?.bg}}>
<div className="flex items-center gap-[8px]">
<b className="text-[15px]">
{p?.name}
</b>
<span className="text-[11.5px] p-[2px_8px] rounded-[999px] bg-accent text-[color:#fff]" style={{opacity:p?.cur}}>
{tr("current")}
</span>
</div>
<div className="text-[13px] text-text-2">
{p?.price}
</div>
<div className="text-[12.5px] text-text-3">
{p?.cap}
</div>
<button onClick={p?.go} disabled={p?.dis} className="mt-[6px] h-[32px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer" style={{opacity:p?.op}}>
{p?.btn}
</button>
</div>
</Fragment>))}
</div>
</>) : null}
{b?.isInv ? (<>
<div className="overflow-x-auto">
<div className="min-w-[520px]">
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[130px_1fr_100px_90px_90px] gap-[10px] p-[11px_18px] items-center border-t border-solid border-t-border text-[13px]">
<span className="[font-family:'Geist_Mono',monospace] text-[12.5px]">
{r?.id}
</span>
<span className="text-text-2">
{r?.date}
</span>
<span className="[font-family:'Geist_Mono',monospace]">
{r?.amt}
</span>
<span>
<span className="p-[2px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.bg,color:r?.fg}}>
{r?.st}
</span>
</span>
<a href="#" onClick={r?.dl} className="text-[12.5px] text-right">
{tr("download")}
</a>
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{b?.isPay ? (<>
<div className="p-[14px_18px] flex items-center gap-[14px] flex-wrap">
<div className="w-[48px] h-[32px] rounded-[6px] bg-info-bg text-info grid place-items-center [font:700_11px_sans-serif]">
{tr("visa")}
</div>
<div className="flex-1">
<div className="text-[13.5px] font-medium">
{b?.card}
</div>
<div className="text-[12.5px] text-text-3">
{b?.exp}
</div>
</div>
</div>
</>) : null}
{b?.isTwofa ? (<>
<div className="p-[16px_18px] flex flex-col gap-[14px]">
{b?.off ? (<>
<div className="text-[13.5px] text-text-2">
{tr("add_a_second_step_at")}
</div>
</>) : null}
{b?.setup ? (<>
<div className="flex gap-[20px] flex-wrap items-start">
<div className="w-[140px] h-[140px] border border-solid border-border rounded-[12px] p-[10px] bg-[color:#fff]">
<svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
{(b?.qr ?? []).map((c, $index) => (<Fragment key={$index}>
<rect x={c?.x} y={c?.y} width="1" height="1" fill="#0D1B2E" />
</Fragment>))}
</svg>
</div>
<div className="flex-1 min-w-[220px] flex flex-col gap-[10px]">
<div className="text-[13px] text-text-2">
{tr("1_scan_this_code_with")}{" "}
<b className="[font-family:'Geist_Mono',monospace] text-text">
{b?.key}
</b>
{"."}
<br />
{tr("2_enter_the_6_digit")}
</div>
<div className="flex gap-[8px] items-center">
<input value={b?.code} onInput={b?.onCode} maxLength="6" placeholder="000000" inputMode="numeric" className="w-[130px] h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text [font:15px_'Geist_Mono',monospace] tracking-[.2em] [outline:none]" style={{border:`1px solid ${b?.cbd}`}} />
<button onClick={b?.verify} className="h-[36px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("verify")}
</button>
<button onClick={b?.cancel} className="h-[36px] p-[0_10px] border-0 bg-transparent text-text-2 text-[13px] cursor-pointer">
{tr("cancel")}
</button>
</div>
<span className="text-[12px] text-bad">
{b?.err}
</span>
</div>
</div>
</>) : null}
{b?.codes?.length ? (<>
<div className="p-[12px] rounded-[10px] bg-surface-2 border border-solid border-border">
<div className="text-[13px] font-medium mb-[8px]">
{b?.codesT}
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-[6px]">
{(b?.codes ?? []).map((c, $index) => (<Fragment key={$index}>
<span className="[font:13px_'Geist_Mono',monospace]">
{c}
</span>
</Fragment>))}
</div>
<div className="mt-[10px] flex gap-[8px]">
<button onClick={b?.dl} className="h-[30px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("download")}
</button>
{b?.done ? (<>
<button onClick={b?.doneGo} className="h-[30px] p-[0_12px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[12.5px] cursor-pointer">
{tr("i_ve_saved_them")}
</button>
</>) : null}
</div>
</div>
</>) : null}
{b?.on ? (<>
<div className="flex items-center gap-[10px] flex-wrap">
<span className="p-[3px_10px] rounded-[999px] text-[12.5px] font-medium bg-ok-bg text-ok">
{tr("enabled")}
</span>
<button onClick={b?.regen} className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("new_backup_codes")}
</button>
<button onClick={b?.disable} className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-bad text-[13px] cursor-pointer">
{tr("turn_off")}
</button>
</div>
</>) : null}
{b?.off ? (<>
<button onClick={b?.start} className="self-start h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("set_up_two_factor")}
</button>
</>) : null}
</div>
</>) : null}
{b?.isSessions ? (<>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[14px] p-[12px_18px] border-t border-solid border-t-border flex-wrap">
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
</>) : null}
{b?.isDanger ? (<>
{(b?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[16px] p-[16px_18px] flex-wrap" style={{borderTop:r?.bt}}>
<div className="flex-1 min-w-[220px]">
<div className="text-[13.5px] font-semibold">
{r?.l}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{r?.h}
</div>
</div>
<button onClick={r?.go} className="h-[34px] p-[0_14px] rounded-[9px] text-[13px] font-medium cursor-pointer" style={{border:r?.bd,background:r?.bg,color:r?.fg}}>
{r?.btn}
</button>
</div>
</Fragment>))}
</>) : null}
</section>
</Fragment>))}
{s?.dirty ? (<>
<div className="sticky bottom-[12px] z-[5] flex items-center gap-[10px] p-[10px_14px] rounded-[12px] bg-surface border border-solid border-warn-dot shadow-pop">
<span className="w-[8px] h-[8px] rounded-[50%] bg-warn-dot" />
<span className="text-[13px] flex-1">
{s?.dirtyL}
</span>
<button onClick={s?.discard} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("discard")}
</button>
<button onClick={s?.save} className="h-[34px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("save_changes")}
</button>
</div>
</>) : null}
</div>
{s?.m ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[460px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border font-semibold text-[16px]">
{s?.m?.title}
</div>
<div className="p-[18px_20px] overflow-y-auto flex flex-col gap-[14px]">
{s?.m?.note ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-warn-bg text-warn text-[13px]">
{s?.m?.note}
</div>
</>) : null}
{(s?.m?.fields ?? []).map((f, $index) => (<Fragment key={$index}>
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{f?.l}{" "}
{f?.isText ? (<>
<input type={f?.type} value={f?.val} onInput={f?.on} placeholder={f?.ph} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${f?.ebd}`}} />
</>) : null}
{f?.isNum ? (<>
<input type="number" value={f?.val} onInput={f?.on} className="w-[120px] h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${f?.ebd}`}} />
</>) : null}
{f?.isTog ? (<>
<div onClick={f?.on} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer" style={{background:f?.tbg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:f?.tl}} />
</div>
</>) : null}
{f?.isSel ? (<>
<select value={f?.val} onChange={f?.on} className="w-[100%] h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</>) : null}
{f?.isChips ? (<>
<div className="flex gap-[6px] flex-wrap">
{(f?.chips ?? []).map((c, $index) => (<Fragment key={$index}>
<button onClick={c?.go} className="h-[30px] p-[0_11px] rounded-[999px] text-[12.5px] font-medium cursor-pointer flex items-center gap-[6px]" style={{border:`1.5px solid ${c?.bd}`,background:c?.bg,color:c?.fg}}>
<span className="w-[9px] h-[9px] rounded-[50%]" style={{background:c?.dot}} />
{c?.l}
</button>
</Fragment>))}
</div>
</>) : null}
<span className="text-[12px] text-bad font-normal">
{f?.err}
</span>
</div>
</Fragment>))}
{s?.m?.secret ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-surface-2 border border-solid border-border">
<div className="text-[12px] text-text-3 mb-[4px]">
{s?.m?.secretL}
</div>
<div className="[font:13px_'Geist_Mono',monospace] [word-break:break-all]">
{s?.m?.secret}
</div>
</div>
</>) : null}
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={s?.mNo} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{s?.m?.noL}
</button>
{s?.m?.okL ? (<>
<button onClick={s?.mOk} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{s?.m?.okL}
</button>
</>) : null}
</div>
</div>
</div>
</>) : null}
{s?.c ? (<>
<div className="fixed inset-[0] bg-overlay z-[60] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[420px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[16px]">
{s?.c?.title}
</div>
<div className="text-[13.5px] text-text-2">
{s?.c?.msg}
</div>
{s?.c?.typed ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("type")}{" "}
<b className="[font-family:'Geist_Mono',monospace] text-bad">
{s?.c?.word}
</b>
{" "}{tr("to_confirm")}
<input value={s?.c?.val} onInput={s?.c?.onVal} className="h-[36px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" />
</label>
</>) : null}
<div className="flex gap-[8px] justify-end">
<button onClick={s?.cNo} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{s?.c?.noL}
</button>
<button onClick={s?.cOk} className="h-[34px] p-[0_14px] rounded-[9px] border-0 text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{background:s?.c?.bg,opacity:s?.c?.op}}>
{s?.c?.okL}
</button>
</div>
</div>
</div>
</>) : null}
{s?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{s?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminSettings(props: any) {
  const tr = useTranslations('AdminSettings');
  return <AdminSettingsView {...props} tr={tr} />;
}
