'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const STEPS=[
  ['Create account','Your admin login','Create your account','Start your 14-day free trial. No card required.'],
  ['Verify email','6-digit code','Check your inbox','Enter the code to verify your work email.'],
  ['Company','Name, size, locale','Tell us about your company','We use this to set defaults for your workspace and mobile app.'],
  ['First branch','Region or city','Add your first branch','A branch groups the sites in one region. You can add more later.'],
  ['First site','Location & geofence','Add your first site','Employees can check in only from inside this geofence. Check-ins from outside are recorded and flagged.'],
  ['Working hours','Days & lateness','Set default working hours','These hours apply to new schedules unless a site or employee overrides them.'],
  ['Invite team','Employees & managers','Invite your team','Add people now or import a CSV. You can always do this later.'],
  ['Choose plan','Billed per employee','Choose a plan','Pick what fits now. You can change plans at any time.']
];
const SIZES=['1–25','26–50','51–250','251–1000','1000+'];
const ADDR=[['17 Boulevard Vivier-Merle','69003 Lyon, France'],['52 Quai Rambaud','69002 Lyon, France'],['8 Rue du Landy','93200 Saint-Denis, France'],['Zone Cargo 4, Rue du Te','95700 Roissy-en-France, France'],['Quai de Rive Neuve','13007 Marseille, France'],['14 Rue de la Part-Dieu','69003 Lyon, France']];
const FREE=/@(gmail|yahoo|hotmail|outlook|live|icloud|orange|free|laposte)\./i;
const CHECK='M5 12l5 5L20 7', DOT='M12 12h.01';
const SUN='M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4', MOON='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z';
const toMin=s=>{const [h,m]=(s||'0:0').split(':').map(Number);return h*60+m;}, fmt=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

class OnboardingBase extends DCLogic {
  renderVals(){ return {ob:this.renderVals0()}; }
  state={step:null,maxStep:1,tried:{},theme:null,showPw:false,code:['','','','','',''],resendAt:0,now:Date.now(),sugOpen:false,toasts:[],w:1440,
    f:{name:'',email:'',password:'',dial:'+33',phone:'',terms:false,company:'',logo:'',industry:'',size:'',country:'France',tz:'Europe/Paris (UTC+2)',lang:'fr',
       branch:'',street:'',zip:'',city:'',siteName:'',siteAddr:'',pin:[300,210],radius:150,days:[1,1,1,1,1,0,0],start:'08:00',end:'17:00',grace:10,
       mode:'manual',people:[{name:'',contact:'',role:'site'},{name:'',contact:'',role:'employee'}],csvName:'',csvRows:[],csvCount:0,billing:'yearly',plan:''},
    checks:[false,false,false]};
  codeRefs=[0,1,2,3,4,5].map(()=>React.createRef());
  mapRef=React.createRef();
  componentDidMount(){ this.onR=()=>this.setState({w:window.innerWidth}); this.onR(); window.addEventListener('resize',this.onR); this.tick=setInterval(()=>this.setState({now:Date.now()}),1000); }
  componentWillUnmount(){ window.removeEventListener('resize',this.onR); clearInterval(this.tick); }
  componentDidUpdate(pp){ if(pp.theme!==this.props.theme) this.setState({theme:null}); if(pp.startStep!==this.props.startStep) this.setState({step:null}); }
  cur(){ return this.state.step ?? Math.min(9,Math.max(1,this.props.startStep||1)); }
  nav(r){ if(this.props.onNavigate) this.props.onNavigate(r); else window.location.href='/'; }
  set(k,v){ this.setState(s=>({f:Object.assign({},s.f,{[k]:v})})); }
  toast(msg,c){ const id=Math.random(); this.setState(s=>({toasts:[...s.toasts,{id,msg,c:c||'#16A34A'}]})); setTimeout(()=>this.setState(s=>({toasts:s.toasts.filter(x=>x.id!==id)})),3600); }
  pwScore(p){ const r=[p.length>=8,/[a-z]/.test(p)&&/[A-Z]/.test(p),/\d/.test(p),/[^A-Za-z0-9]/.test(p)]; let sc=r.filter(Boolean).length; if(p.length>=12&&sc>=3) sc=4; if(p.length<8) sc=Math.min(sc,1); return {sc:p?sc:0,r}; }
  personErr(p){ const any=p.name.trim()||p.contact.trim(); if(!any) return null; if(!p.name.trim()) return {k:'name',m:'Add a name for this person.'}; if(!p.contact.trim()) return {k:'contact',m:'Add a phone number or email so we can send the invite.'};
    const c=p.contact.trim(); if(c.includes('@')?!/^\S+@\S+\.\S+$/.test(c):c.replace(/[^\d]/g,'').length<8) return {k:'contact',m:'That doesn’t look like a valid phone number or email.'}; return null; }
  validate(step){
    const f=this.state.f,e={};
    if(step===1){ if(!f.name.trim()) e.name='Enter your full name.'; else if(f.name.trim().split(/\s+/).length<2) e.name='Enter your first and last name.';
      if(!f.email.trim()) e.email='Enter your work email.'; else if(!/^\S+@\S+\.\S+$/.test(f.email)) e.email='Enter a valid email address, like name@company.com.'; else if(FREE.test(f.email)) e.email='Use your work email. Personal addresses (Gmail, Outlook…) can’t create a company workspace.';
      const p=this.pwScore(f.password); if(!f.password) e.password='Create a password.'; else if(p.sc<2) e.password='Password is too weak. Use at least 8 characters with a mix of letters and numbers.';
      if(f.phone.replace(/\D/g,'').length<8) e.phone='Enter a valid phone number.'; if(!f.terms) e.terms='You need to accept the terms to continue.'; }
    if(step===2){ const c=this.state.code.join(''); if(c.length<6) e.code='Enter all 6 digits.'; else if(c==='000000') e.code='That code is incorrect. Check the latest email or request a new code.'; }
    if(step===3){ if(!f.company.trim()) e.company='Enter your company name.'; if(!f.industry) e.industry='Select an industry.'; if(!f.size) e.size='Select your company size.'; }
    if(step===4){ if(!f.branch.trim()) e.branch='Give this branch a name.'; if(!f.street.trim()) e.street='Enter the street address.'; if(!/^\d{4,5}$/.test(f.zip.trim())) e.zip='Enter a valid postal code.'; if(!f.city.trim()) e.city='Enter the city.'; }
    if(step===5){ if(!f.siteName.trim()) e.siteName='Give this site a name.'; if(!f.siteAddr.trim()) e.siteAddr='Search and select the site address.'; }
    if(step===6){ if(!f.days.some(Boolean)) e.days='Select at least one working day.'; if(toMin(f.end)<=toMin(f.start)) e.end='End time must be after start time. For night shifts, create a custom schedule after setup.'; }
    if(step===7){ if(f.mode==='manual'){ f.people.forEach((p,i)=>{const pe=this.personErr(p); if(pe) e['p'+i]=pe;}); } }
    if(step===8){ if(!f.plan) e.plan='Select a plan to continue.'; }
    return e;
  }
  goStep(n){ this.setState(s=>({step:n,maxStep:Math.max(s.maxStep,n)})); if(n===2&&this.state.resendAt<Date.now()) this.setState({resendAt:Date.now()+30000}); if(typeof window!=='undefined') window.scrollTo(0,0); }
  next(){ const st=this.cur(), e=this.validate(st); if(Object.keys(e).length){ this.setState(s=>({tried:Object.assign({},s.tried,{[st]:true})})); return; } this.goStep(st+1); }

  renderVals0(){
    const s=this.state,f=s.f,step=this.cur(),theme=s.theme||this.props.theme||'light',dark=theme==='dark',compact=s.w<1000;
    const errs=s.tried[step]?this.validate(step):{}, nErr=Object.keys(errs).length;
    const keys=['name','email','password','phone','terms','code','company','industry','size','branch','street','zip','city','siteName','siteAddr','days','end','plan','csv'];
    const err={},has={},bd={},on={}; keys.forEach(k=>{err[k]=errs[k]||'';has[k]=!!errs[k];bd[k]=errs[k]?'var(--bad-dot)':'var(--border-strong)';});
    ['name','email','password','dial','phone','company','industry','tz','branch','street','zip','city','siteName','start','end'].forEach(k=>on[k]=e=>this.set(k,e.target.value));
    on.terms=e=>this.set('terms',e.target.checked); on.radius=e=>this.set('radius',+e.target.value); on.grace=e=>this.set('grace',+e.target.value);
    const steps=STEPS.map((x,i)=>{const n=i+1,done=n<step||step===9,curr=n===step,locked=n>s.maxStep||step===9||(step>=3&&n<=2);
      return {n,label:x[0],sub:x[1],done,notDone:!done,notLast:n<8,locked,cursor:locked?'default':'pointer',go:()=>{if(!locked&&n!==step)this.goStep(n);},
        dotBg:done?'var(--accent)':curr?'var(--surface)':'var(--surface-2)',dotFg:done?'#fff':curr?'var(--accent)':'var(--text-3)',dotBd:done?'0':curr?'2px solid var(--accent)':'1px solid var(--border-strong)',
        lineC:done?'var(--accent)':'var(--border)',weight:curr?600:500,labelC:curr||done?'var(--text)':'var(--text-3)'};});
    const pw=this.pwScore(f.password), pwCols=['var(--bad-dot)','var(--bad-dot)','var(--warn-dot)','var(--ok-dot)','var(--ok-dot)'];
    const pwLabel=f.password?['Too weak','Weak','Fair','Good','Strong'][pw.sc]:'';
    const pwRules=[['8+ characters',pw.r[0]],['Upper & lowercase',pw.r[1]],['A number',pw.r[2]],['A symbol',pw.r[3]]].map(([label,ok])=>({label,c:ok?'var(--ok)':'var(--text-3)',icon:ok?CHECK:DOT}));
    const code=s.code;
    const setCode=(i,v)=>{const c=[...this.state.code];c[i]=v;this.setState({code:c});};
    const codeBoxes=code.map((v,i)=>({v,ref:this.codeRefs[i],aria:'Digit '+(i+1),bd:has.code?'var(--bad-dot)':v?'var(--accent)':'var(--border-strong)',
      change:e=>{const d=e.target.value.replace(/\D/g,'').slice(-1);setCode(i,d);if(d&&i<5)this.codeRefs[i+1].current&&this.codeRefs[i+1].current.focus();},
      key:e=>{if(e.key==='Backspace'&&!this.state.code[i]&&i>0){this.codeRefs[i-1].current.focus();}}}));
    const left=Math.max(0,Math.ceil((s.resendAt-s.now)/1000));
    const sugQ=f.siteAddr.trim().toLowerCase();
    const sugs=ADDR.filter(a=>!sugQ||(a[0]+' '+a[1]).toLowerCase().includes(sugQ)||sugQ.length<3).slice(0,4).map((a,i)=>({line1:a[0],line2:a[1],pick:()=>{this.set('siteAddr',a[0]+', '+a[1]);this.set('pin',[260+i*24,190+(i%2)*30]);this.setState({sugOpen:false});}}));
    const [px,py]=f.pin, fenceR=f.radius/100*60/ (600/600);
    const pinPath=`M${px} ${py-4} C ${px-14} ${py-22}, ${px-14} ${py-40}, ${px} ${py-40} C ${px+14} ${py-40}, ${px+14} ${py-22}, ${px} ${py-4}Z`;
    const lat=(45.7605+(210-py)*0.00002).toFixed(5), lng=(4.8590+(px-300)*0.00003).toFixed(5);
    const dayL=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const days=dayL.map((l,i)=>({label:l,bd:f.days[i]?'var(--accent)':'var(--border-strong)',bg:f.days[i]?'var(--accent-soft)':'var(--surface)',fg:f.days[i]?'var(--accent)':'var(--text-2)',go:()=>{const d=[...f.days];d[i]=d[i]?0:1;this.set('days',d);}}));
    const st=toMin(f.start),en=toMin(f.end),dur=Math.max(0,en-st);
    const workDays=dayL.filter((_,i)=>f.days[i]); const dayRange=workDays.length===5&&f.days.slice(0,5).every(Boolean)?'Mon–Fri':workDays.join(', ')||'no days';
    const people=f.people.map((p,i)=>{const pe=s.tried[7]?this.personErr(p):null; const upd=(k,v)=>{const arr=f.people.map((q,j)=>j===i?Object.assign({},q,{[k]:v}):q);this.set('people',arr);};
      return {name:p.name,contact:p.contact,role:p.role,onName:e=>upd('name',e.target.value),onContact:e=>upd('contact',e.target.value),onRole:e=>upd('role',e.target.value),
        remove:()=>this.set('people',f.people.length>1?f.people.filter((_,j)=>j!==i):[{name:'',contact:'',role:'employee'}]),
        hasErr:!!pe,err:pe?pe.m:'',bdName:pe&&pe.k==='name'?'var(--bad-dot)':'var(--border-strong)',bdContact:pe&&pe.k==='contact'?'var(--bad-dot)':'var(--border-strong)'};});
    const invited=f.mode==='manual'?f.people.filter(p=>p.name.trim()&&p.contact.trim()).length:f.csvCount;
    const yearly=f.billing==='yearly', sizeIdx=SIZES.indexOf(f.size);
    const recId=sizeIdx<=0?'trial':sizeIdx===1?'starter':sizeIdx<=2?'business':'enterprise';
    const PL=[
      {id:'trial',name:'Free trial',price:'€0',unit:'for 14 days',note:'Full Business features',cap:'Up to 25 employees',feats:['1 branch, 3 sites','Mobile check-in with geofence','Leave requests']},
      {id:'starter',name:'Starter',price:yearly?'€2.40':'€3',unit:'/ employee / mo',note:yearly?'Billed yearly':'Billed monthly',cap:'Up to 50 employees',feats:['Unlimited sites','Fraud flags & GPS proof','Check-in on behalf']},
      {id:'business',name:'Business',price:yearly?'€4':'€5',unit:'/ employee / mo',note:yearly?'Billed yearly':'Billed monthly',cap:'Up to 250 employees',feats:['Everything in Starter','Branch & site-level roles','Polygon geofences','Payroll exports']},
      {id:'enterprise',name:'Enterprise',price:'Custom',unit:'',note:'Volume pricing',cap:'250+ employees',feats:['SSO & SCIM','Custom data retention','Dedicated success manager']}];
    const plans=PL.map(p=>{const sel=f.plan===p.id;return Object.assign({},p,{rec:p.id===recId&&!!f.size,go:()=>this.set('plan',p.id),bd:sel?'2px solid var(--accent)':has.plan?'1px solid var(--bad-dot)':'1px solid var(--border)',sh:sel?'0 0 0 4px var(--accent-soft)':'var(--shadow)',radio:sel?'5px solid var(--accent)':'1.5px solid var(--border-strong)'});});
    const planName=(PL.find(p=>p.id===f.plan)||{}).name||'—';
    const first=(f.name.trim().split(/\s+/)[0])||'there';
    const ck=s.checks, CK=[['Download the mobile app','Send employees the iOS and Android links by SMS','Send links'],['Invite site managers','They can check in employees who don’t have a smartphone','Invite'],['Create schedules','Assign employees to '+(f.siteName||'your site')+' with recurring shifts or one-off interventions','Open planner']];
    const checklist=CK.map((c,i)=>({title:c[0],sub:c[1],cta:c[2],done:ck[i],bd:ck[i]?'0':'1.5px solid var(--border-strong)',bg:ck[i]?'var(--ok-dot)':'transparent',deco:ck[i]?'line-through':'none',fg:ck[i]?'var(--text-3)':'var(--text)',
      toggle:()=>{const a=[...this.state.checks];a[i]=!a[i];this.setState({checks:a});},act:()=>{const a=[...this.state.checks];a[i]=true;this.setState({checks:a});this.toast(i===0?'Download links sent':i===1?'Invite sent':'Planner opens in the admin dashboard');}}));
    const csvSample='name,phone_or_email,role,site\nCamille Durand,+33612345678,employee,Part-Dieu Tower\nYanis Benali,yanis@batiplus.fr,site_manager,Part-Dieu Tower\n';
    const seg=on=>({bg:on?'var(--surface)':'transparent',fg:on?'var(--text)':'var(--text-2)',sh:on?'0 1px 2px rgba(0,0,0,.1)':'none'});
    const tab=on=>({bd:on?'var(--accent)':'transparent',fg:on?'var(--text)':'var(--text-3)'});
    return {
      theme,compact,showRail:!compact,steps,step,toggleTheme:()=>this.setState({theme:dark?'light':'dark'}),themeIcon:dark?SUN:MOON,
      progressLabel:step===9?'Setup complete':`Step ${step} of 8 · ${STEPS[step-1][0]}`,progressPct:(step===9?100:Math.round((step-1)/8*100))+'%',
      canSave:step>=3&&step<=8,saveLater:()=>this.toast(`Progress saved. We emailed ${f.email||'you'} a link to resume.`),
      contentMax:step===5||step===8?'960px':step===7?'760px':step===9?'720px':'580px',
      inWizard:step<=8,isDone:step===9,stepEyebrow:`STEP ${step} / 8`,stepTitle:(STEPS[step-1]||[])[2]||'',stepDesc:(STEPS[step-1]||[])[3]||'',
      showSummary:nErr>0,summaryText:nErr===1?'Fix 1 field to continue.':`Fix ${nErr} fields to continue.`,
      is1:step===1,is2:step===2,is3:step===3,is4:step===4,is5:step===5,is6:step===6,is7:step===7,is8:step===8,
      f,on,err,has,bd,
      sso:()=>{this.set('name',this.state.f.name||'Claire Vasseur');this.set('email','claire@batiplus.fr');this.toast('Signed in with SSO — email already verified');this.setState({step:3,maxStep:3});},
      pwType:s.showPw?'text':'password',pwToggleLabel:s.showPw?'Hide':'Show',togglePw:()=>this.setState({showPw:!s.showPw}),
      pwBars:[1,2,3,4].map(i=>pw.sc>=i?pwCols[pw.sc]:'var(--neutral-bg)'),pwLabel,pwColor:pwCols[pw.sc],pwRules,
      emailShown:f.email||'your email',codeBoxes,
      onPaste:e=>{const d=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(d.length){e.preventDefault();this.setState({code:[0,1,2,3,4,5].map(i=>d[i]||'')});}},
      resendWaiting:left>0,resendReady:left===0,resendClock:'0:'+String(left).padStart(2,'0'),
      resend:e=>{e.preventDefault();this.setState({resendAt:Date.now()+30000,code:['','','','','','']});this.toast('New code sent to '+(f.email||'your email'));},
      changeEmail:e=>{e.preventDefault();this.goStep(1);},
      hasLogo:!!f.logo,logoBg:f.logo?'url('+f.logo+')':'none',noLogo:!f.logo,onLogo:e=>{const file=e.target.files&&e.target.files[0];if(file)this.set('logo',URL.createObjectURL(file));},
      sizes:SIZES.map(z=>({label:z,go:()=>this.set('size',z),bd:f.size===z?'var(--accent)':has.size?'var(--bad-dot)':'var(--border-strong)',bg:f.size===z?'var(--accent-soft)':'var(--surface)',fg:f.size===z?'var(--accent)':'var(--text-2)'})),
      onCountry:e=>{const c=e.target.value;const tz={France:'Europe/Paris (UTC+2)',Belgium:'Europe/Brussels (UTC+2)',Switzerland:'Europe/Zurich (UTC+2)',Canada:'America/Montreal (UTC−4)','United Kingdom':'Europe/London (UTC+1)'}[c];this.setState(s2=>({f:Object.assign({},s2.f,{country:c,tz})}));},
      langEn:seg(f.lang==='en'),langFr:seg(f.lang==='fr'),setLangEn:()=>this.set('lang','en'),setLangFr:()=>this.set('lang','fr'),
      companyShown:f.company||'Company',
      onAddr:e=>{this.set('siteAddr',e.target.value);this.setState({sugOpen:true});},openSug:()=>this.setState({sugOpen:true}),showSug:s.sugOpen&&sugs.length>0,sugs,
      radiusHint:f.radius<100?'Tight fence. Good for a single building, but GPS drift indoors may cause false flags.':f.radius>300?'Wide fence. Covers large yards or depots, but people nearby could check in without being on site.':'Recommended for most sites. Covers the building plus a margin for GPS accuracy.',
      mapRef:this.mapRef,onMapClick:e=>{if(e.target.closest&&e.target.closest('input'))return;const r=this.mapRef.current.getBoundingClientRect();const sc=Math.max(600/r.width,420/r.height);const offX=(r.width*sc-600)/2,offY=(r.height*sc-420)/2;
        const x=(e.clientX-r.left)*sc-offX,y=(e.clientY-r.top)*sc-offY;this.set('pin',[Math.round(x),Math.round(y)]);this.setState({sugOpen:false});},
      pinX:px,pinY:py,pinHeadY:py-27,pinPath,fenceR:Math.round(fenceR),coords:`${lat}° N, ${lng}° E`,
      days,graceW:Math.max(2,f.grace*2.4)+'px',ruleOnTime:`On time: check-in before ${fmt(st+f.grace)} (${f.start} + ${f.grace} min grace)`,ruleLate:`Late: check-in from ${fmt(st+f.grace+1)} onwards`,
      ruleHours:`${dayRange}, ${f.start}–${f.end} · ${Math.floor(dur/60)}h${dur%60?String(dur%60).padStart(2,'0'):''} per day`,
      tabManual:tab(f.mode==='manual'),tabCsv:tab(f.mode==='csv'),modeManual:()=>this.set('mode','manual'),modeCsv:()=>this.set('mode','csv'),isManual:f.mode==='manual',isCsv:f.mode==='csv',
      people,addPerson:()=>this.set('people',[...f.people,{name:'',contact:'',role:'employee'}]),
      csvBd:f.csvName?'var(--ok-dot)':'var(--border-strong)',csvTitle:f.csvName?`${f.csvName} · ${f.csvCount} people found`:'Drop a CSV file or click to browse',csvSub:f.csvName?'Click to replace the file':'Up to 5,000 rows · UTF-8',
      hasCsvRows:f.csvRows.length>0,csvRows:f.csvRows,
      onCsv:e=>{const file=e.target.files&&e.target.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>{const lines=String(rd.result).trim().split(/\r?\n/).slice(1).filter(Boolean);
        this.setState(s2=>({f:Object.assign({},s2.f,{csvName:file.name,csvCount:lines.length,csvRows:lines.slice(0,4).map(l=>{const c=l.split(',');return {a:c[0]||'',b:c[1]||'',c:c[2]||''};})})}));};rd.readAsText(file);},
      downloadTemplate:e=>{e.preventDefault();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csvSample],{type:'text/csv'}));a.download='staffsync-team-template.csv';a.click();},
      billM:seg(!yearly),billY:seg(yearly),billMonthly:()=>this.set('billing','monthly'),billYearly:()=>this.set('billing','yearly'),plans,sizeShown:f.size?f.size+' people':'',
      doneTitle:`You’re all set, ${first}!`,doneSub:`${f.company||'Your company'} is ready. Employees can start checking in at ${f.siteName||'your first site'} as soon as they install the app.`,
      recap:[{k:'Company',v:f.company||'—'},{k:'Branch → Site',v:(f.branch||'—')+' → '+(f.siteName||'—')},{k:'Hours',v:`${dayRange} ${f.start}–${f.end}`},{k:'Invited · Plan',v:`${invited} · ${planName}`}],
      checklist,checkDone:ck.filter(Boolean).length,
      canBack:step>1&&step!==3,back:()=>this.goStep(step-1),skip:()=>{this.set('people',[{name:'',contact:'',role:'employee'}]);this.goStep(8);},
      next:()=>this.next(),nextOpacity:1,
      nextLabel:step===1?'Create account':step===2?'Verify':step===7?(invited?`Send ${invited} invite${invited>1?'s':''}`:'Continue'):step===8?(f.plan==='trial'||!f.plan?'Start free trial':'Start trial on '+planName):'Continue',
      goSignIn:e=>{e.preventDefault();this.nav('signin');},goDash:e=>{e.preventDefault();this.nav('dashboard');},
      toasts:s.toasts
    };
  }
}

class OnboardingView extends OnboardingBase {
  view(S) {
    const tr = this.props.tr;
    const { ob } = S;
    return (
<>
<div data-theme={ob?.theme} className="min-h-[100vh] bg-bg text-text flex text-[14px] leading-[1.45]">
{ob?.showRail ? (<>
<aside className="w-[300px] flex-none bg-surface border-r border-solid border-r-border flex flex-col sticky top-[0] h-[100vh] box-border p-[24px_20px]">
<div className="flex items-center gap-[10px] mb-[32px]">
<div className="w-[34px] h-[34px] rounded-[9px] bg-[color:#fff] border border-solid border-border grid place-items-center overflow-hidden">
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[30px] h-[30px] object-contain" />
</div>
<div className="font-bold text-[16px] tracking-[-.01em]">
{tr("staffsync")}
</div>
</div>
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em] mb-[12px]">
{tr("set_up_your_workspace")}
</div>
<div className="flex flex-col flex-1">
{(ob?.steps ?? []).map((s, $index) => (<Fragment key={$index}>
<button onClick={s?.go} disabled={s?.locked} className="flex gap-[12px] items-start border-0 bg-transparent text-left p-[0] text-[color:inherit]" style={{cursor:s?.cursor}}>
<div className="flex flex-col items-center self-stretch">
<span className="w-[26px] h-[26px] rounded-[50%] box-border grid place-items-center [font:600_12px_'Geist_Mono',monospace] flex-none" style={{background:s?.dotBg,color:s?.dotFg,border:s?.dotBd}}>
{s?.done ? (<>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5L20 7" />
</svg>
</>) : null}
{s?.notDone ? (<>
{s?.n}
</>) : null}
</span>
{s?.notLast ? (<>
<span className="w-[2px] flex-1 min-h-[14px] m-[3px_0] rounded-[2px]" style={{background:s?.lineC}} />
</>) : null}
</div>
<div className="p-[3px_0_16px]">
<div className="text-[13.5px]" style={{fontWeight:s?.weight,color:s?.labelC}}>
{s?.label}
</div>
<div className="text-[12px] text-text-3">
{s?.sub}
</div>
</div>
</button>
</Fragment>))}
</div>
<div className="border-t border-solid border-t-border pt-[16px] text-[12.5px] text-text-3">
{tr("need_help")}{" "}
<a href="#">
{tr("book_a_15_min_setup")}
</a>
</div>
</aside>
</>) : null}
<div className="flex-1 min-w-[0] flex flex-col">
<header className="h-[60px] flex-none flex items-center gap-[14px] p-[0_28px] border-b border-solid border-b-border bg-surface">
{ob?.compact ? (<>
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[28px] h-[28px] object-contain" />
</>) : null}
<div className="flex flex-col gap-[6px] flex-1 max-w-[340px]">
<div className="text-[12.5px] text-text-2">
{ob?.progressLabel}
</div>
<div className="h-[4px] rounded-[4px] bg-neutral-bg overflow-hidden">
<div className="h-[100%] bg-accent rounded-[4px] [transition:width_.3s]" style={{width:ob?.progressPct}} />
</div>
</div>
<div className="flex-1" />
{ob?.canSave ? (<>
<button onClick={ob?.saveLater} className="flex items-center gap-[7px] h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border bg-transparent text-text-2 text-[13px] font-medium cursor-pointer hover:bg-hover">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7" />
</svg>
{tr("save_and_continue_later")}
</button>
</>) : null}
<button onClick={ob?.toggleTheme} title={tr("theme")} className="w-[34px] h-[34px] border border-solid border-border rounded-[9px] bg-transparent text-text-2 grid place-items-center cursor-pointer">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={ob?.themeIcon} />
</svg>
</button>
</header>
<main className="flex-1 flex justify-center p-[36px_28px_56px] box-border">
<div key={ob?.step} className="w-[100%] flex flex-col gap-[22px] [animation:ssIn_.25s_ease-out]" style={{maxWidth:ob?.contentMax}}>
{ob?.inWizard ? (<>
<div>
<div className="[font:500_12px_'Geist_Mono',monospace] text-accent mb-[6px]">
{ob?.stepEyebrow}
</div>
<h1 className="m-[0] text-[26px] font-semibold tracking-[-.02em]">
{ob?.stepTitle}
</h1>
<div className="mt-[6px] text-text-2 text-[14px] [text-wrap:pretty]">
{ob?.stepDesc}
</div>
</div>
</>) : null}
{ob?.showSummary ? (<>
<div className="flex gap-[10px] items-center p-[11px_14px] rounded-[10px] bg-bad-bg text-bad text-[13px] font-medium">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
<path d="M12 3l10 18H2zM12 10v4M12 17h.01" />
</svg>
{ob?.summaryText}
</div>
</>) : null}
{ob?.is1 ? (<>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[24px] flex flex-col gap-[18px]">
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
<button onClick={ob?.sso} className="flex items-center justify-center gap-[10px] h-[42px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[14px] font-medium cursor-pointer hover:bg-hover">
<span className="w-[18px] h-[18px] grid place-items-center font-bold text-[15px] text-[color:#4285F4]">
{tr("g")}
</span>
{tr("sign_up_with_google")}
</button>
<button onClick={ob?.sso} className="flex items-center justify-center gap-[10px] h-[42px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[14px] font-medium cursor-pointer hover:bg-hover">
<span className="grid grid-cols-[7px_7px] gap-[1.5px]">
<span className="w-[7px] h-[7px] bg-[color:#F25022]" />
<span className="w-[7px] h-[7px] bg-[color:#7FBA00]" />
<span className="w-[7px] h-[7px] bg-[color:#00A4EF]" />
<span className="w-[7px] h-[7px] bg-[color:#FFB900]" />
</span>
{tr("sign_up_with_microsoft")}
</button>
</div>
<div className="flex items-center gap-[12px] text-text-3 text-[12px]">
<span className="flex-1 h-[1px] bg-border" />
{tr("or_with_your_work_email")}
<span className="flex-1 h-[1px] bg-border" />
</div>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("full_name")}
</span>
<input value={ob?.f?.name} onChange={ob?.on?.name} placeholder={tr("claire_vasseur")} autoComplete="name" className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.name}`}} />
{ob?.has?.name ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.name}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("work_email")}
</span>
<input value={ob?.f?.email} onChange={ob?.on?.email} type="email" placeholder={tr("claire_batiplus_fr")} autoComplete="email" className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.email}`}} />
{ob?.has?.email ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.email}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("password")}
</span>
<div className="relative flex">
<input value={ob?.f?.password} onChange={ob?.on?.password} type={ob?.pwType} placeholder={tr("at_least_8_characters")} autoComplete="new-password" className="flex-1 h-[40px] p-[0_64px_0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.password}`}} />
<button onClick={ob?.togglePw} type="button" className="absolute right-[6px] top-[6px] h-[28px] p-[0_9px] border-0 rounded-[6px] bg-surface-2 text-text-2 text-[12px] font-medium cursor-pointer">
{ob?.pwToggleLabel}
</button>
</div>
<div className="flex items-center gap-[10px]">
<div className="flex-1 grid grid-cols-[repeat(4,1fr)] gap-[4px]">
{(ob?.pwBars ?? []).map((b, $index) => (<Fragment key={$index}>
<span className="h-[4px] rounded-[4px]" style={{background:b}} />
</Fragment>))}
</div>
<span className="text-[12px] font-medium min-w-[52px] text-right" style={{color:ob?.pwColor}}>
{ob?.pwLabel}
</span>
</div>
<div className="flex flex-wrap gap-[4px_14px] text-[12px]">
{(ob?.pwRules ?? []).map((r, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[5px]" style={{color:r?.c}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
<path d={r?.icon} />
</svg>
{r?.label}
</span>
</Fragment>))}
</div>
{ob?.has?.password ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.password}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("phone")}{" "}
<span className="text-text-3 font-normal">
{tr("for_account_recovery")}
</span>
</span>
<div className="flex gap-[8px]">
<select value={ob?.f?.dial} onChange={ob?.on?.dial} className="h-[40px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[14px]">
<option value="+33">
{"🇫🇷 +33"}
</option>
<option value="+32">
{"🇧🇪 +32"}
</option>
<option value="+41">
{"🇨🇭 +41"}
</option>
<option value="+1">
{"🇨🇦 +1"}
</option>
<option value="+44">
{"🇬🇧 +44"}
</option>
</select>
<input value={ob?.f?.phone} onChange={ob?.on?.phone} type="tel" placeholder="6 12 34 56 78" className="flex-1 min-w-[0] h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.phone}`}} />
</div>
{ob?.has?.phone ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.phone}
</span>
</>) : null}
</label>
<div className="flex flex-col gap-[6px]">
<label className="flex gap-[10px] items-start cursor-pointer text-[13.5px] text-text-2">
<input type="checkbox" checked={ob?.f?.terms} onChange={ob?.on?.terms} className="w-[16px] h-[16px] m-[2px_0_0] [accent-color:#0B67DD]" />
<span>
{tr("i_agree_to_the")}{" "}
<a href="#">
{tr("terms_of_service")}
</a>
{" "}{tr("and")}{" "}
<a href="#">
{tr("privacy_policy")}
</a>
{tr("including_processing_of_employee")}
</span>
</label>
{ob?.has?.terms ? (<>
<span className="text-[12.5px] text-bad pl-[26px]">
{ob?.err?.terms}
</span>
</>) : null}
</div>
</div>
<div className="text-[13px] text-text-3 text-center">
{tr("already_have_an_account")}{" "}
<a href="#" onClick={ob?.goSignIn}>
{tr("sign_in")}
</a>
</div>
</>) : null}
{ob?.is2 ? (<>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[28px_24px] flex flex-col items-center gap-[18px] text-center">
<div className="w-[52px] h-[52px] rounded-[14px] bg-accent-soft text-accent grid place-items-center">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M3 5h18v14H3zM3 6l9 7 9-7" />
</svg>
</div>
<div className="text-[14px] text-text-2">
{tr("we_sent_a_6_digit")}{" "}
<strong className="text-text">
{ob?.emailShown}
</strong>
</div>
<div onPaste={ob?.onPaste} className="flex gap-[8px]">
{(ob?.codeBoxes ?? []).map((c, $index) => (<Fragment key={$index}>
<input ref={c?.ref} value={c?.v} onChange={c?.change} onKeyDown={c?.key} inputMode="numeric" maxLength="1" aria-label={c?.aria} className="w-[48px] h-[56px] text-center rounded-[10px] bg-surface text-text [font:600_22px_'Geist_Mono',monospace] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${c?.bd}`}} />
</Fragment>))}
</div>
{ob?.has?.code ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.code}
</span>
</>) : null}
<div className="text-[13px] text-text-3">
{ob?.resendWaiting ? (<>
<span>
{tr("resend_code_in")}{" "}
<span className="[font-family:'Geist_Mono',monospace] text-text-2">
{ob?.resendClock}
</span>
</span>
</>) : null}
{ob?.resendReady ? (<>
<span>
{tr("didn_t_get_it")}{" "}
<a href="#" onClick={ob?.resend}>
{tr("resend_code")}
</a>
</span>
</>) : null}
<span>
{" "}{"·"}{" "}
<a href="#" onClick={ob?.changeEmail}>
{tr("change_email")}
</a>
</span>
</div>
<div className="text-[12px] text-text-3 p-[8px_12px] bg-surface-2 rounded-[8px]">
{tr("prototype_any_6_digits_work")}
</div>
</div>
</>) : null}
{ob?.is3 ? (<>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[24px] flex flex-col gap-[18px]">
<div className="flex gap-[16px] items-center">
<label className="w-[72px] h-[72px] rounded-[14px] border-[1.5px] border-dashed border-border-strong bg-surface-2 grid place-items-center cursor-pointer overflow-hidden flex-none text-text-3 hover:border-accent">
<input type="file" accept="image/*" onChange={ob?.onLogo} className="hidden" />
{ob?.hasLogo ? (<>
<div role="img" aria-label={tr("logo")} className="w-[100%] h-[100%] [background:center/contain_no-repeat]" style={{backgroundImage:ob?.logoBg}} />
</>) : null}
{ob?.noLogo ? (<>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
</svg>
</>) : null}
</label>
<div>
<div className="font-medium text-[13.5px]">
{tr("company_logo")}{" "}
<span className="text-text-3 font-normal">
{tr("optional")}
</span>
</div>
<div className="text-[12.5px] text-text-3">
{tr("shown_in_the_mobile_app")}
</div>
</div>
</div>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("company_name")}
</span>
<input value={ob?.f?.company} onChange={ob?.on?.company} placeholder={tr("batiplus_group")} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.company}`}} />
{ob?.has?.company ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.company}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("industry")}
</span>
<select value={ob?.f?.industry} onChange={ob?.on?.industry} className="h-[40px] p-[0_10px] rounded-[9px] bg-surface text-text text-[14px]" style={{border:`1px solid ${ob?.bd?.industry}`}}>
<option value="">
{tr("select_an_industry")}
</option>
<option>
{tr("construction")}
</option>
<option>
{tr("logistics_warehousing")}
</option>
<option>
{tr("cleaning_facility_services")}
</option>
<option>
{tr("security")}
</option>
<option>
{tr("retail")}
</option>
<option>
{tr("manufacturing")}
</option>
<option>
{tr("healthcare")}
</option>
<option>
{tr("other")}
</option>
</select>
{ob?.has?.industry ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.industry}
</span>
</>) : null}
</label>
<div className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("company_size")}
</span>
<div className="flex flex-wrap gap-[8px]">
{(ob?.sizes ?? []).map((z, $index) => (<Fragment key={$index}>
<button onClick={z?.go} className="h-[36px] p-[0_14px] rounded-[9px] text-[13px] font-medium cursor-pointer" style={{border:`1px solid ${z?.bd}`,background:z?.bg,color:z?.fg}}>
{z?.label}
</button>
</Fragment>))}
</div>
{ob?.has?.size ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.size}
</span>
</>) : null}
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("country")}
</span>
<select value={ob?.f?.country} onChange={ob?.onCountry} className="h-[40px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[14px]">
<option>
{tr("france")}
</option>
<option>
{tr("belgium")}
</option>
<option>
{tr("switzerland")}
</option>
<option>
{tr("canada")}
</option>
<option>
{tr("united_kingdom")}
</option>
</select>
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("default_timezone")}
</span>
<select value={ob?.f?.tz} onChange={ob?.on?.tz} className="h-[40px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[14px]">
<option>
{tr("europe_paris_utc_2")}
</option>
<option>
{tr("europe_brussels_utc_2")}
</option>
<option>
{tr("europe_zurich_utc_2")}
</option>
<option>
{tr("america_montreal_utc_4")}
</option>
<option>
{tr("europe_london_utc_1")}
</option>
</select>
</label>
</div>
<div className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("default_language")}{" "}
<span className="text-text-3 font-normal">
{tr("employees_can_change_it_in")}
</span>
</span>
<div className="flex p-[3px] border border-solid border-border rounded-[10px] gap-[3px] self-start bg-surface-2">
<button onClick={ob?.setLangEn} className="border-0 h-[32px] p-[0_16px] rounded-[7px] text-[13px] font-medium cursor-pointer" style={{background:ob?.langEn?.bg,color:ob?.langEn?.fg,boxShadow:ob?.langEn?.sh}}>
{tr("english")}
</button>
<button onClick={ob?.setLangFr} className="border-0 h-[32px] p-[0_16px] rounded-[7px] text-[13px] font-medium cursor-pointer" style={{background:ob?.langFr?.bg,color:ob?.langFr?.fg,boxShadow:ob?.langFr?.sh}}>
{tr("fran_ais")}
</button>
</div>
</div>
</div>
</>) : null}
{ob?.is4 ? (<>
<div className="flex gap-[12px] p-[12px_14px] rounded-[10px] bg-surface border border-solid border-border text-[13px] text-text-2">
<div className="flex items-center gap-[6px] [font:500_12px_'Geist_Mono',monospace] whitespace-nowrap flex-wrap">
<span className="p-[3px_8px] rounded-[6px] bg-neutral-bg">
{ob?.companyShown}
</span>
<span>
{"→"}
</span>
<span className="p-[3px_8px] rounded-[6px] bg-accent-soft text-accent">
{tr("branch")}
</span>
<span>
{"→"}
</span>
<span className="p-[3px_8px] rounded-[6px] bg-neutral-bg">
{tr("sites")}
</span>
</div>
<span className="[text-wrap:pretty]">
{tr("branches_group_sites_usually_by")}
</span>
</div>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[24px] flex flex-col gap-[18px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("branch_name")}
</span>
<input value={ob?.f?.branch} onChange={ob?.on?.branch} placeholder={tr("lyon")} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.branch}`}} />
{ob?.has?.branch ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.branch}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("street_address")}
</span>
<input value={ob?.f?.street} onChange={ob?.on?.street} placeholder={tr("17_boulevard_vivier_merle")} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.street}`}} />
{ob?.has?.street ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.street}
</span>
</>) : null}
</label>
<div className="grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)] gap-[16px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("postal_code")}
</span>
<input value={ob?.f?.zip} onChange={ob?.on?.zip} placeholder="69003" className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] min-w-[0] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.zip}`}} />
{ob?.has?.zip ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.zip}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("city")}
</span>
<input value={ob?.f?.city} onChange={ob?.on?.city} placeholder={tr("lyon")} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] min-w-[0] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.city}`}} />
{ob?.has?.city ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.city}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("country")}
</span>
<input value={ob?.f?.country} readOnly className="h-[40px] p-[0_12px] rounded-[9px] border border-solid border-border bg-surface-2 text-text-2 text-[14px] [outline:none] min-w-[0]" />
</label>
</div>
</div>
</>) : null}
{ob?.is5 ? (<>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card overflow-hidden flex flex-wrap">
<div className="flex-[1_1_300px] p-[24px] flex flex-col gap-[18px] box-border">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("site_name")}
</span>
<input value={ob?.f?.siteName} onChange={ob?.on?.siteName} placeholder={tr("part_dieu_tower")} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.siteName}`}} />
{ob?.has?.siteName ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.siteName}
</span>
</>) : null}
</label>
<div className="flex flex-col gap-[6px] relative">
<span className="text-[13px] font-medium">
{tr("address")}
</span>
<div className="flex items-center gap-[8px] h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text-3" style={{border:`1px solid ${ob?.bd?.siteAddr}`}}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input value={ob?.f?.siteAddr} onChange={ob?.onAddr} onFocus={ob?.openSug} placeholder={tr("search_an_address")} className="flex-1 min-w-[0] border-0 [outline:0] bg-transparent text-text text-[14px]" />
</div>
{ob?.showSug ? (<>
<div className="absolute top-[70px] left-[0] right-[0] z-[5] bg-surface border border-solid border-border rounded-[10px] shadow-pop overflow-hidden">
{(ob?.sugs ?? []).map((g, $index) => (<Fragment key={$index}>
<button onClick={g?.pick} className="flex gap-[10px] items-start w-[100%] p-[10px_12px] border-0 bg-transparent text-left cursor-pointer text-text hover:bg-hover">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 mt-[2px] flex-none">
<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
</svg>
<span>
<span className="block text-[13.5px] font-medium">
{g?.line1}
</span>
<span className="block text-[12px] text-text-3">
{g?.line2}
</span>
</span>
</button>
</Fragment>))}
</div>
</>) : null}
{ob?.has?.siteAddr ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.siteAddr}
</span>
</>) : null}
</div>
<div className="flex flex-col gap-[10px]">
<div className="flex justify-between items-baseline">
<span className="text-[13px] font-medium">
{tr("geofence_radius")}
</span>
<span className="[font:600_15px_'Geist_Mono',monospace] text-accent">
{tr("p0_m",{p0:ob?.f?.radius ?? ''})}
</span>
</div>
<input type="range" min="50" max="500" step="10" value={ob?.f?.radius} onChange={ob?.on?.radius} className="w-[100%]" />
<div className="flex justify-between [font:400_11px_'Geist_Mono',monospace] text-text-3">
<span>
{tr("50_m")}
</span>
<span>
{tr("500_m")}
</span>
</div>
<div className="text-[12.5px] text-text-2 p-[10px_12px] rounded-[9px] bg-surface-2 [text-wrap:pretty]">
{ob?.radiusHint}
</div>
</div>
</div>
<div onClick={ob?.onMapClick} ref={ob?.mapRef} className="flex-[1.4_1_380px] min-h-[360px] relative bg-map-bg border-l border-solid border-l-border [cursor:crosshair] overflow-hidden">
<svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-[0] w-[100%] h-[100%]">
<rect x="30" y="24" width="120" height="70" rx="4" className="[fill:var(--map-block)]" />
<rect x="200" y="20" width="150" height="60" rx="4" className="[fill:var(--map-block)]" />
<rect x="420" y="110" width="150" height="90" rx="4" className="[fill:var(--map-block)]" />
<rect x="30" y="140" width="110" height="100" rx="4" className="[fill:var(--map-block)]" />
<rect x="390" y="16" width="190" height="56" rx="4" className="[fill:var(--map-block)]" />
<rect x="200" y="250" width="130" height="60" rx="4" className="[fill:var(--map-block)]" />
<path d="M0 340 C 120 310, 220 400, 360 370 S 540 320, 600 344 L600 420 L0 420Z" className="[fill:var(--map-water)]" />
<g strokeLinecap="round" className="[stroke:var(--map-road)] [fill:none]">
<path d="M0 106 L600 92" strokeWidth="10" />
<path d="M170 0 L184 420" strokeWidth="10" />
<path d="M0 236 L600 222" strokeWidth="7" />
<path d="M370 0 L452 420" strokeWidth="7" />
<path d="M260 92 L272 236" strokeWidth="4" />
<path d="M0 170 L600 160" strokeWidth="4" />
<path d="M520 0 L534 230" strokeWidth="4" />
</g>
<circle cx={ob?.pinX} cy={ob?.pinY} r={ob?.fenceR} className="[fill:var(--fence)] [stroke:var(--accent)] [stroke-width:2] [stroke-dasharray:7_5] [transition:r_.15s]" />
<circle cx={ob?.pinX} cy={ob?.pinY} r="4" className="[fill:var(--accent)]" />
<path d={ob?.pinPath} className="[fill:var(--accent)] [stroke:var(--surface)] [stroke-width:2.5]" />
<circle cx={ob?.pinX} cy={ob?.pinHeadY} r="5" className="[fill:#fff]" />
</svg>
<div className="absolute left-[14px] top-[14px] p-[7px_11px] rounded-[9px] bg-surface border border-solid border-border shadow-card text-[12.5px] text-text-2 flex gap-[7px] items-center pointer-events-none">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
</svg>
{tr("click_the_map_to_move")}
</div>
<div className="absolute right-[14px] bottom-[14px] p-[6px_10px] rounded-[8px] bg-surface border border-solid border-border [font:500_11.5px_'Geist_Mono',monospace] text-text-2 pointer-events-none">
{ob?.coords}
</div>
<div className="absolute left-[14px] bottom-[14px] flex items-center gap-[6px] pointer-events-none">
<span className="w-[60px] h-[4px] border-[1.5px] border-solid border-text-2 border-t-0 box-border" />
<span className="[font:500_11px_'Geist_Mono',monospace] text-text-2">
{tr("100_m")}
</span>
</div>
</div>
</div>
</>) : null}
{ob?.is6 ? (<>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card p-[24px] flex flex-col gap-[22px]">
<div className="flex flex-col gap-[8px]">
<span className="text-[13px] font-medium">
{tr("working_days")}
</span>
<div className="flex flex-wrap gap-[8px]">
{(ob?.days ?? []).map((dy, $index) => (<Fragment key={$index}>
<button onClick={dy?.go} className="w-[52px] h-[44px] rounded-[10px] text-[13px] font-semibold cursor-pointer" style={{border:`1px solid ${dy?.bd}`,background:dy?.bg,color:dy?.fg}}>
{dy?.label}
</button>
</Fragment>))}
</div>
{ob?.has?.days ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.days}
</span>
</>) : null}
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[16px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("start_time")}
</span>
<input type="time" value={ob?.f?.start} onChange={ob?.on?.start} className="h-[40px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font:500_14px_'Geist_Mono',monospace] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" />
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{tr("end_time")}
</span>
<input type="time" value={ob?.f?.end} onChange={ob?.on?.end} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text [font:500_14px_'Geist_Mono',monospace] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${ob?.bd?.end}`}} />
</label>
</div>
{ob?.has?.end ? (<>
<span className="text-[12.5px] text-bad mt-[-14px]">
{ob?.err?.end}
</span>
</>) : null}
<div className="flex flex-col gap-[10px]">
<div className="flex justify-between items-baseline">
<span className="text-[13px] font-medium">
{tr("grace_period_for_lateness")}
</span>
<span className="[font:600_15px_'Geist_Mono',monospace] text-accent">
{tr("p0_min",{p0:ob?.f?.grace ?? ''})}
</span>
</div>
<input type="range" min="0" max="30" step="5" value={ob?.f?.grace} onChange={ob?.on?.grace} className="w-[100%]" />
<div className="flex justify-between [font:400_11px_'Geist_Mono',monospace] text-text-3">
<span>
{"0"}
</span>
<span>
{"5"}
</span>
<span>
{"10"}
</span>
<span>
{"15"}
</span>
<span>
{"20"}
</span>
<span>
{"25"}
</span>
<span>
{"30"}
</span>
</div>
</div>
<div className="border border-solid border-border rounded-[12px] p-[16px] bg-surface-2 flex flex-col gap-[12px]">
<div className="text-[12px] font-semibold text-text-3 uppercase tracking-[.06em]">
{tr("how_check_ins_will_be")}
</div>
<div className="relative h-[28px] rounded-[7px] overflow-hidden flex [font:500_11.5px_'Geist_Mono',monospace]">
<div className="flex-1 bg-ok-bg text-ok grid place-items-center">
{tr("on_time")}
</div>
<div className="bg-ok-bg text-ok grid place-items-center border-l border-dashed border-l-ok-dot" style={{width:ob?.graceW}} />
<div className="flex-[1.4] bg-warn-bg text-warn grid place-items-center">
{tr("late")}
</div>
</div>
<div className="flex flex-col gap-[6px] text-[13px] text-text-2">
<span className="flex gap-[8px] items-center">
<span className="w-[8px] h-[8px] rounded-[50%] bg-ok-dot" />
{ob?.ruleOnTime}
</span>
<span className="flex gap-[8px] items-center">
<span className="w-[8px] h-[8px] rounded-[50%] bg-warn-dot" />
{ob?.ruleLate}
</span>
<span className="flex gap-[8px] items-center">
<span className="w-[8px] h-[8px] rounded-[50%] bg-text-3" />
{ob?.ruleHours}
</span>
</div>
</div>
<div className="text-[12.5px] text-text-3">
{tr("these_are_company_defaults_you")}
</div>
</div>
</>) : null}
{ob?.is7 ? (<>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card overflow-hidden">
<div className="flex gap-[20px] p-[0_24px] border-b border-solid border-b-border">
<button onClick={ob?.modeManual} className="border-0 bg-transparent p-[14px_0_12px] mb-[-1px] text-[13.5px] font-medium cursor-pointer" style={{borderBottom:`2px solid ${ob?.tabManual?.bd}`,color:ob?.tabManual?.fg}}>
{tr("add_manually")}
</button>
<button onClick={ob?.modeCsv} className="border-0 bg-transparent p-[14px_0_12px] mb-[-1px] text-[13.5px] font-medium cursor-pointer" style={{borderBottom:`2px solid ${ob?.tabCsv?.bd}`,color:ob?.tabCsv?.fg}}>
{tr("upload_csv")}
</button>
</div>
{ob?.isManual ? (<>
<div className="p-[20px_24px] flex flex-col gap-[10px]">
<div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_160px_36px] gap-[10px] text-[12px] text-text-3 font-medium">
<span>
{tr("full_name")}
</span>
<span>
{tr("phone_or_email")}
</span>
<span>
{tr("role")}
</span>
<span />
</div>
{(ob?.people ?? []).map((p, $index) => (<Fragment key={$index}>
<div className="flex flex-col gap-[4px]">
<div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_160px_36px] gap-[10px]">
<input value={p?.name} onChange={p?.onName} placeholder={tr("name")} className="h-[38px] p-[0_10px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none] min-w-[0] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${p?.bdName}`}} />
<input value={p?.contact} onChange={p?.onContact} placeholder={tr("33_6_or_name_company")} className="h-[38px] p-[0_10px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none] min-w-[0] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${p?.bdContact}`}} />
<select value={p?.role} onChange={p?.onRole} className="h-[38px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px] min-w-[0]">
<option value="employee">
{tr("employee")}
</option>
<option value="site">
{tr("site_manager")}
</option>
<option value="branch">
{tr("branch_manager")}
</option>
<option value="admin">
{tr("admin")}
</option>
</select>
<button onClick={p?.remove} title={tr("remove")} className="w-[36px] h-[38px] rounded-[9px] border border-solid border-border bg-transparent text-text-3 grid place-items-center cursor-pointer hover:text-bad hover:bg-bad-bg">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</div>
{p?.hasErr ? (<>
<span className="text-[12.5px] text-bad">
{p?.err}
</span>
</>) : null}
</div>
</Fragment>))}
<button onClick={ob?.addPerson} className="self-start flex items-center gap-[6px] h-[34px] p-[0_12px] rounded-[9px] border border-dashed border-border-strong bg-transparent text-accent text-[13px] font-medium cursor-pointer mt-[4px] hover:bg-accent-soft">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
<path d="M12 5v14M5 12h14" />
</svg>
{tr("add_another_person")}
</button>
<div className="text-[12.5px] text-text-3 mt-[6px] [text-wrap:pretty]">
{tr("people_with_a_phone_number")}
</div>
</div>
</>) : null}
{ob?.isCsv ? (<>
<div className="p-[20px_24px] flex flex-col gap-[14px]">
<label className="flex flex-col items-center gap-[8px] p-[32px_20px] rounded-[12px] bg-surface-2 cursor-pointer text-center hover:border-accent" style={{border:`1.5px dashed ${ob?.csvBd}`}}>
<input type="file" accept=".csv,text/csv" onChange={ob?.onCsv} className="hidden" />
<div className="w-[44px] h-[44px] rounded-[12px] bg-accent-soft text-accent grid place-items-center">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
</svg>
</div>
<div className="font-semibold">
{ob?.csvTitle}
</div>
<div className="text-[12.5px] text-text-3">
{ob?.csvSub}
</div>
</label>
{ob?.hasCsvRows ? (<>
<div className="border border-solid border-border rounded-[10px] overflow-hidden text-[13px]">
{(ob?.csvRows ?? []).map((cr, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[1fr_1.3fr_.8fr] gap-[10px] p-[8px_12px] border-b border-solid border-b-border">
<span>
{cr?.a}
</span>
<span className="text-text-2">
{cr?.b}
</span>
<span className="text-text-2">
{cr?.c}
</span>
</div>
</Fragment>))}
</div>
</>) : null}
{ob?.has?.csv ? (<>
<span className="text-[12.5px] text-bad">
{ob?.err?.csv}
</span>
</>) : null}
<div className="flex items-center gap-[10px] text-[13px] text-text-2">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6" />
</svg>
{tr("columns_name_phone_or_email")}{" "}
<a href="#" onClick={ob?.downloadTemplate}>
{tr("download_csv_template")}
</a>
</div>
</div>
</>) : null}
</div>
</>) : null}
{ob?.is8 ? (<>
<div className="flex justify-center">
<div className="flex p-[3px] border border-solid border-border rounded-[11px] gap-[3px] bg-surface">
<button onClick={ob?.billMonthly} className="border-0 h-[34px] p-[0_18px] rounded-[8px] text-[13px] font-medium cursor-pointer" style={{background:ob?.billM?.bg,color:ob?.billM?.fg}}>
{tr("monthly")}
</button>
<button onClick={ob?.billYearly} className="border-0 h-[34px] p-[0_14px] rounded-[8px] text-[13px] font-medium cursor-pointer flex items-center gap-[8px]" style={{background:ob?.billY?.bg,color:ob?.billY?.fg}}>
{tr("yearly")}
<span className="text-[11px] font-semibold p-[2px_6px] rounded-[999px] bg-ok-bg text-ok">
{"−20%"}
</span>
</button>
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px]">
{(ob?.plans ?? []).map((pl, $index) => (<Fragment key={$index}>
<button onClick={pl?.go} className="relative text-left flex flex-col gap-[14px] p-[20px_18px] rounded-[14px] bg-surface text-text cursor-pointer" style={{border:pl?.bd,boxShadow:pl?.sh}}>
{pl?.rec ? (<>
<span className="absolute top-[-10px] left-[18px] text-[11px] font-semibold p-[3px_8px] rounded-[999px] bg-accent text-[color:#fff]">
{tr("recommended_for_p0",{p0:ob?.sizeShown ?? ''})}
</span>
</>) : null}
<div className="flex justify-between items-center">
<span className="font-semibold text-[15px]">
{pl?.name}
</span>
<span className="w-[18px] h-[18px] rounded-[50%] box-border bg-surface" style={{border:pl?.radio}} />
</div>
<div>
<div className="flex items-baseline gap-[4px]">
<span className="text-[28px] font-semibold tracking-[-.02em]">
{pl?.price}
</span>
<span className="text-[12.5px] text-text-3">
{pl?.unit}
</span>
</div>
<div className="text-[12.5px] text-text-2 min-h-[18px]">
{pl?.note}
</div>
</div>
<div className="text-[12.5px] font-medium p-[6px_10px] rounded-[8px] bg-surface-2 text-text-2">
{pl?.cap}
</div>
<div className="flex flex-col gap-[7px]">
{(pl?.feats ?? []).map((ft, $index) => (<Fragment key={$index}>
<span className="flex gap-[8px] text-[12.5px] text-text-2">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-ok-dot flex-none mt-[2px]">
<path d="M5 12l5 5L20 7" />
</svg>
{ft}
</span>
</Fragment>))}
</div>
</button>
</Fragment>))}
</div>
<div className="text-[12.5px] text-text-3 text-center">
{tr("every_plan_starts_with_a")}
</div>
</>) : null}
{ob?.isDone ? (<>
<div className="text-center flex flex-col items-center gap-[10px] pt-[12px]">
<div className="w-[64px] h-[64px] rounded-[50%] bg-ok-bg text-ok grid place-items-center">
<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5L20 7" />
</svg>
</div>
<h1 className="m-[8px_0_0] text-[28px] font-semibold tracking-[-.02em]">
{ob?.doneTitle}
</h1>
<div className="text-text-2 max-w-[460px] [text-wrap:pretty]">
{ob?.doneSub}
</div>
</div>
<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px]">
{(ob?.recap ?? []).map((rc, $index) => (<Fragment key={$index}>
<div className="p-[12px_14px] rounded-[11px] bg-surface border border-solid border-border">
<div className="text-[12px] text-text-3">
{rc?.k}
</div>
<div className="font-semibold text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis">
{rc?.v}
</div>
</div>
</Fragment>))}
</div>
<div className="bg-surface border border-solid border-border rounded-[14px] shadow-card overflow-hidden">
<div className="flex justify-between items-center p-[16px_20px] border-b border-solid border-b-border">
<span className="font-semibold">
{tr("next_steps")}
</span>
<span className="[font:500_12px_'Geist_Mono',monospace] text-text-3">
{ob?.checkDone}{"/3"}
</span>
</div>
{(ob?.checklist ?? []).map((ck, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[14px] p-[14px_20px] border-b border-solid border-b-border">
<button onClick={ck?.toggle} className="w-[22px] h-[22px] rounded-[50%] text-[color:#fff] grid place-items-center cursor-pointer flex-none p-[0]" style={{border:ck?.bd,background:ck?.bg}}>
{ck?.done ? (<>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5L20 7" />
</svg>
</>) : null}
</button>
<div className="flex-1 min-w-[0]">
<div className="font-medium" style={{textDecoration:ck?.deco,color:ck?.fg}}>
{ck?.title}
</div>
<div className="text-[12.5px] text-text-3">
{ck?.sub}
</div>
</div>
<button onClick={ck?.act} className="h-[32px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] font-medium cursor-pointer whitespace-nowrap hover:bg-hover">
{ck?.cta}
</button>
</div>
</Fragment>))}
</div>
<div className="flex justify-center">
<a href="#" onClick={ob?.goDash} className="flex items-center gap-[8px] h-[42px] p-[0_20px] rounded-[10px] bg-accent text-[color:#fff] font-medium no-underline">
{tr("go_to_dashboard")}
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12h14M13 6l6 6-6 6" />
</svg>
</a>
</div>
</>) : null}
{ob?.inWizard ? (<>
<div className="flex items-center gap-[10px] pt-[4px]">
{ob?.canBack ? (<>
<button onClick={ob?.back} className="flex items-center gap-[6px] h-[42px] p-[0_16px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[14px] font-medium cursor-pointer hover:bg-hover">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M19 12H5M11 6l-6 6 6 6" />
</svg>
{tr("back")}
</button>
</>) : null}
<div className="flex-1" />
{ob?.is7 ? (<>
<button onClick={ob?.skip} className="h-[42px] p-[0_14px] rounded-[10px] border-0 bg-transparent text-text-2 text-[14px] font-medium cursor-pointer hover:text-text">
{tr("skip_for_now")}
</button>
</>) : null}
<button onClick={ob?.next} className="flex items-center gap-[8px] h-[42px] p-[0_20px] rounded-[10px] border-0 bg-accent text-[color:#fff] text-[14px] font-medium cursor-pointer hover:bg-accent-hover" style={{opacity:ob?.nextOpacity}}>
{ob?.nextLabel}
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12h14M13 6l6 6-6 6" />
</svg>
</button>
</div>
</>) : null}
</div>
</main>
</div>
<div className="fixed right-[20px] bottom-[20px] z-[40] flex flex-col gap-[8px] items-end">
{(ob?.toasts ?? []).map((tt, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] min-w-[280px] max-w-[400px] p-[12px_14px] rounded-[11px] bg-text text-surface shadow-pop text-[13.5px] [animation:ssIn_.2s_ease-out]">
<span className="w-[20px] h-[20px] rounded-[50%] grid place-items-center flex-none text-[color:#fff]" style={{background:tt?.c}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5L20 7" />
</svg>
</span>
<span className="flex-1">
{tt?.msg}
</span>
</div>
</Fragment>))}
</div>
</div>
</>
    );
  }
}

export default function Onboarding(props: any) {
  const tr = useTranslations('Onboarding');
  return <OnboardingView {...props} tr={tr} />;
}
