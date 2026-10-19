'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const T={
  title:['Sign in to StaffSync','Connexion à StaffSync'],sub:['Welcome back. Sign in to your admin workspace.','Bon retour. Connectez-vous à votre espace administrateur.'],
  email:['Work email','E-mail professionnel'],password:['Password','Mot de passe'],forgot:['Forgot password?','Mot de passe oublié ?'],remember:['Remember me for 30 days','Se souvenir de moi pendant 30 jours'],
  signIn:['Sign in','Se connecter'],signingIn:['Signing in…','Connexion…'],or:['or','ou'],google:['Continue with Google','Continuer avec Google'],ms:['Continue with Microsoft','Continuer avec Microsoft'],
  noAccount:['New to StaffSync?','Nouveau sur StaffSync ?'],create:['Create a company account','Créer un compte entreprise'],
  wrongTitle:['Incorrect email or password','E-mail ou mot de passe incorrect'],
  lockTitle:['Account temporarily locked','Compte temporairement verrouillé'],lockDesc:['Too many failed attempts. For your security, sign-in is paused.','Trop de tentatives échouées. Par sécurité, la connexion est suspendue.'],lockReset:['Reset your password instead','Réinitialiser le mot de passe'],lockBtn:['Locked','Verrouillé'],
  deTitle:['This account has been deactivated','Ce compte a été désactivé'],deContact:['Contact your admin','Contacter votre administrateur'],deOther:['Use another account','Utiliser un autre compte'],
  offTitle:['You’re offline','Vous êtes hors ligne'],offDesc:['Check your connection. You can sign in once you’re back online.','Vérifiez votre connexion. Vous pourrez vous connecter une fois en ligne.'],retry:['Retry','Réessayer'],offBtn:['Waiting for connection','En attente de connexion'],
  eReq:['Enter your email.','Saisissez votre e-mail.'],eBad:['Enter a valid email, like name@company.com.','Saisissez un e-mail valide, ex. nom@entreprise.fr.'],pReq:['Enter your password.','Saisissez votre mot de passe.'],
  show:['Show password','Afficher le mot de passe'],hide:['Hide password','Masquer le mot de passe'],
  vpTitle:['Know who’s on site, right now.','Sachez qui est sur site, en temps réel.'],
  vpSub:['Geofenced check-ins, live attendance across every branch and site, and fraud flags you can actually act on.','Pointages géolocalisés, présences en direct sur toutes vos agences et sites, et alertes de fraude exploitables.'],
  c1:['GPS geofencing','Géorepérage GPS'],c2:['Leave approvals','Validation des congés'],c3:['Role-based access','Accès par rôle'],
  ilTitle:['Today · all sites','Aujourd’hui · tous les sites'],ilLive:['Live','En direct'],ilPresent:['present','présents'],ilOnTime:['On time','À l’heure'],ilLate:['Late','Retards'],ilFlag:['Flagged','Signalés'],ilCheckin:['Checked in · Part-Dieu Tower','Arrivée · Part-Dieu Tower'],
  demo:['Prototype: password “staffsync” signs in · emails starting with “former” are deactivated · 5 wrong tries locks the account','Prototype : mot de passe « staffsync » · e-mails commençant par « former » désactivés · 5 échecs verrouillent le compte'],
  privacy:['Privacy','Confidentialité'],terms:['Terms','Conditions'],status:['System status','État du service']
};
const EYE='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', EYEOFF='M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2';
const SUN='M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4', MOON='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z';
const LOCK_MS=15*60*1000, MAX=5;

class SignInBase extends DCLogic {
  renderVals(){ return {si:this.renderVals0()}; }
  state={lang:null,theme:null,email:'',password:'',remember:true,showPw:false,loading:false,tried:false,result:null,attempts:0,lockUntil:0,now:Date.now(),netOffline:false,toasts:[],w:1440,forced:null};
  componentDidMount(){
    this.onR=()=>this.setState({w:window.innerWidth}); this.onR(); window.addEventListener('resize',this.onR);
    this.onOff=()=>this.setState({netOffline:true}); this.onOn=()=>this.setState({netOffline:false}); window.addEventListener('offline',this.onOff); window.addEventListener('online',this.onOn);
    this.setState({netOffline:typeof navigator!=='undefined'&&navigator.onLine===false});
    this.tick=setInterval(()=>{ if(this.state.lockUntil>Date.now()||this.state.lockUntil) this.setState({now:Date.now()}); },1000);
    this.applyPreview();
  }
  componentWillUnmount(){ window.removeEventListener('resize',this.onR); window.removeEventListener('offline',this.onOff); window.removeEventListener('online',this.onOn); clearInterval(this.tick); clearTimeout(this.lt); }
  componentDidUpdate(pp){
    if(pp.theme!==this.props.theme) this.setState({theme:null});
    if(pp.lang!==this.props.lang) this.setState({lang:null});
    if(pp.previewState!==this.props.previewState) this.applyPreview();
  }
  applyPreview(){
    const p=this.props.previewState||'default'; clearTimeout(this.lt);
    const base={loading:false,result:null,tried:false,lockUntil:0,attempts:0,forced:p};
    if(p==='loading') Object.assign(base,{email:'claire@batiplus.fr',password:'staffsync',loading:true});
    if(p==='wrong') Object.assign(base,{email:'claire@batiplus.fr',password:'wrongpass',result:'wrong',attempts:3});
    if(p==='locked') Object.assign(base,{email:'claire@batiplus.fr',password:'',result:'locked',attempts:MAX,lockUntil:Date.now()+LOCK_MS-92000});
    if(p==='deactivated') Object.assign(base,{email:'former.lucas@batiplus.fr',password:'',result:'deactivated'});
    if(p==='default') Object.assign(base,{email:'',password:''});
    this.setState(base);
  }
  toast(msg,c){ const id=Math.random(); this.setState(s=>({toasts:[...s.toasts,{id,msg,c:c||'#16A34A'}]})); setTimeout(()=>this.setState(s=>({toasts:s.toasts.filter(x=>x.id!==id)})),3200); }
  nav(r){ if(this.props.onNavigate) this.props.onNavigate(r); else window.location.href='/'; }
  renderVals0(){
    const s=this.state, L=(s.lang||this.props.lang||'en')==='fr'?1:0, theme=s.theme||this.props.theme||'light', dark=theme==='dark';
    const t={}; for(const k in T) t[k]=T[k][L];
    const offline=s.netOffline||this.props.previewState==='offline';
    const lockLeft=Math.max(0,s.lockUntil-s.now), locked=s.result==='locked'&&lockLeft>0;
    if(s.result==='locked'&&lockLeft===0&&s.lockUntil){ setTimeout(()=>this.setState({result:null,lockUntil:0,attempts:0}),0); }
    const eErr=!s.tried?'':!s.email.trim()?t.eReq:!/^\S+@\S+\.\S+$/.test(s.email.trim())?t.eBad:'';
    const pErr=!s.tried?'':!s.password?t.pReq:'';
    const isWrong=s.result==='wrong', left=MAX-s.attempts;
    const blocked=s.loading||locked||offline;
    const mm=Math.floor(lockLeft/60000), ss=Math.floor(lockLeft/1000)%60;
    const seg=on=>({bg:on?'var(--accent-soft)':'transparent',fg:on?'var(--accent)':'var(--text-3)'});
    const submit=e=>{
      e.preventDefault(); if(blocked) return;
      const em=s.email.trim();
      if(!em||!/^\S+@\S+\.\S+$/.test(em)||!s.password){ this.setState({tried:true,result:null}); return; }
      this.setState({tried:false,loading:true,result:null});
      this.lt=setTimeout(()=>{
        if(/^former/i.test(em)) return this.setState({loading:false,result:'deactivated',password:''});
        if(s.password==='staffsync'){ this.setState({loading:false,attempts:0}); this.toast(L?'Connexion réussie — redirection…':'Signed in — redirecting…'); setTimeout(()=>this.nav('workspaces'),900); return; }
        const a=this.state.attempts+1;
        if(a>=MAX) this.setState({loading:false,attempts:a,result:'locked',lockUntil:Date.now()+LOCK_MS,now:Date.now(),password:''});
        else this.setState({loading:false,attempts:a,result:'wrong',password:''});
      },1300);
    };
    const sso=name=>()=>{ if(blocked) return; this.setState({loading:true,result:null}); this.lt=setTimeout(()=>{this.setState({loading:false});this.toast((L?'Redirection vers ':'Redirecting to ')+name+'…','#4F6BED');},900); };
    return {
      theme,t,compact:s.w<960,showBrand:s.w>=960,
      toggleTheme:()=>this.setState({theme:dark?'light':'dark'}),themeIcon:dark?SUN:MOON,
      en:seg(!L),fr:seg(!!L),setEn:()=>this.setState({lang:'en'},()=>this.props.onLang&&this.props.onLang('en')),setFr:()=>this.setState({lang:'fr'},()=>this.props.onLang&&this.props.onLang('fr')),
      vpChips:[t.c1,t.c2,t.c3],
      offline,retry:()=>{ const on=typeof navigator==='undefined'||navigator.onLine!==false; this.setState({netOffline:!on}); this.toast(on?(L?'Connexion rétablie':'Back online'):(L?'Toujours hors ligne':'Still offline'),on?'#16A34A':'#E59A00'); },
      isWrong,wrongDesc:left<=2?(L?`Plus que ${left} tentative${left>1?'s':''} avant le verrouillage du compte.`:`${left} attempt${left>1?'s':''} left before your account is locked.`):(L?'Vérifiez vos identifiants et réessayez.':'Check your details and try again.'),
      isLocked:locked,lockClock:String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0'),lockPct:(lockLeft/LOCK_MS*100)+'%',
      isDeact:s.result==='deactivated',deDesc:L?`L’accès de ${s.email||'ce compte'} à Batiplus Group a été retiré par un administrateur.`:`Access for ${s.email||'this account'} to Batiplus Group was removed by an administrator.`,
      contactAdmin:e=>{e.preventDefault();this.toast(L?'Demande envoyée à l’administrateur':'Request sent to your admin');},
      useOther:e=>{e.preventDefault();this.setState({result:null,email:'',password:''});},
      submit,email:s.email,password:s.password,onEmail:e=>this.setState({email:e.target.value,result:s.result==='deactivated'?null:s.result}),onPw:e=>this.setState({password:e.target.value}),
      remember:s.remember,onRemember:e=>this.setState({remember:e.target.checked}),
      hasEmailErr:!!eErr,emailErr:eErr,hasPwErr:!!pErr,pwErr:pErr,
      emailBd:eErr||s.result==='deactivated'?'var(--bad-dot)':isWrong?'var(--bad-dot)':'var(--border-strong)',pwBd:pErr||isWrong?'var(--bad-dot)':'var(--border-strong)',
      fieldsDisabled:s.loading||locked,fieldBg:s.loading||locked?'var(--surface-2)':'var(--surface)',
      pwType:s.showPw?'text':'password',eyeIcon:s.showPw?EYEOFF:EYE,pwAria:s.showPw?t.hide:t.show,togglePw:()=>this.setState({showPw:!s.showPw}),
      forgot:e=>{e.preventDefault();this.toast(L?`Lien de réinitialisation envoyé à ${s.email||'votre e-mail'}`:`Reset link sent to ${s.email||'your email'}`);},
      loading:s.loading,submitDisabled:blocked,btnLabel:s.loading?t.signingIn:locked?t.lockBtn:offline?t.offBtn:t.signIn,
      btnBg:locked||offline?'var(--neutral-bg)':'var(--accent)',btnFg:locked||offline?'var(--text-3)':'#fff',btnCursor:blocked?'not-allowed':'pointer',
      ssoGoogle:sso('Google'),ssoMs:sso('Microsoft'),ssoDisabled:blocked,ssoOpacity:blocked?.55:1,
      goCreate:e=>{e.preventDefault();this.nav('onboarding');},
      toasts:s.toasts
    };
  }
}

class SignInView extends SignInBase {
  view(S) {
    const tr = this.props.tr;
    const { si } = S;
    return (
<>
<div data-theme={si?.theme} className="min-h-[100vh] bg-surface text-text flex text-[14px] leading-[1.45]">
{si?.showBrand ? (<>
<section className="flex-[1_1_50%] relative overflow-hidden bg-[color:#0A2547] text-[color:#fff] flex flex-col p-[40px_48px] box-border min-h-[100vh]">
<div className="absolute inset-[0] [background-image:radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:22px_22px]" />
<div className="absolute w-[620px] h-[620px] right-[-220px] top-[-160px] rounded-[50%] border border-solid border-[color:rgba(255,255,255,.08)]" />
<div className="absolute w-[420px] h-[420px] right-[-120px] top-[-60px] rounded-[50%] border border-solid border-[color:rgba(255,255,255,.1)]" />
<div className="relative flex items-center gap-[10px]">
<div className="w-[38px] h-[38px] rounded-[10px] bg-[color:#fff] grid place-items-center overflow-hidden">
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[34px] h-[34px] object-contain" />
</div>
<span className="font-bold text-[18px] tracking-[-.01em]">
{tr("staffsync")}
</span>
</div>
<div className="relative flex-1 flex items-center justify-center p-[40px_0]">
<div className="relative w-[100%] max-w-[440px] h-[360px]">
<div className="absolute left-[0] top-[30px] w-[300px] rounded-[16px] bg-[color:#fff] text-[color:#0D1B2E] [box-shadow:0_24px_60px_rgba(0,0,0,.35)] p-[18px]">
<div className="flex justify-between items-center mb-[14px]">
<span className="font-semibold text-[13px]">
{si?.t?.ilTitle}
</span>
<span className="flex items-center gap-[6px] text-[11.5px] text-[color:#0F7A3F] font-medium">
<span className="w-[7px] h-[7px] rounded-[50%] bg-[color:#16A34A]" />
{si?.t?.ilLive}
</span>
</div>
<div className="flex items-baseline gap-[6px]">
<span className="text-[34px] font-semibold tracking-[-.02em]">
{"168"}
</span>
<span className="text-[12.5px] text-[color:#6F7A8B]">
{"/ 198 "}{si?.t?.ilPresent}
</span>
</div>
<div className="flex h-[8px] rounded-[8px] overflow-hidden gap-[2px] m-[12px_0_14px]">
<span className="flex-[152] bg-[color:#0B67DD]" />
<span className="flex-[16] bg-[color:#E59A00]" />
<span className="flex-[11] bg-[color:#E5372A]" />
<span className="flex-[19] bg-[color:#EEF1F5]" />
</div>
<div className="grid grid-cols-[repeat(3,1fr)] gap-[8px] text-[11.5px]">
<div className="p-[8px] rounded-[8px] bg-[color:#E5F4EA] text-[color:#0F7A3F]">
<div className="font-semibold text-[15px]">
{"152"}
</div>
{si?.t?.ilOnTime}
</div>
<div className="p-[8px] rounded-[8px] bg-[color:#FCF0D6] text-[color:#8F5300]">
<div className="font-semibold text-[15px]">
{"16"}
</div>
{si?.t?.ilLate}
</div>
<div className="p-[8px] rounded-[8px] bg-[color:#FCE9E7] text-[color:#B9241A]">
<div className="font-semibold text-[15px]">
{"4"}
</div>
{si?.t?.ilFlag}
</div>
</div>
</div>
<div className="absolute right-[0] top-[0] w-[200px] h-[170px] rounded-[16px] bg-[color:#E9EEF0] overflow-hidden [box-shadow:0_24px_60px_rgba(0,0,0,.35)] [animation:ssFloat_6s_ease-in-out_infinite]">
<svg viewBox="0 0 200 170" className="absolute inset-[0] w-[100%] h-[100%]">
<rect x="10" y="10" width="50" height="34" rx="3" fill="#DDE3DA" />
<rect x="132" y="102" width="58" height="50" rx="3" fill="#DDE3DA" />
<path d="M0 130 C 50 118, 90 160, 200 140 L200 170 L0 170Z" fill="#D3E4F2" />
<g stroke="#fff" fill="none" strokeLinecap="round">
<path d="M0 56 L200 48" strokeWidth="7" />
<path d="M74 0 L82 170" strokeWidth="7" />
<path d="M0 104 L200 96" strokeWidth="4" />
<path d="M150 0 L170 170" strokeWidth="4" />
</g>
<circle cx="110" cy="76" r="40" fill="rgba(11,103,221,.14)" stroke="#0B67DD" strokeWidth="1.6" strokeDasharray="5 4" />
<circle cx="100" cy="68" r="5" fill="#16A34A" stroke="#fff" strokeWidth="2" />
<circle cx="122" cy="82" r="5" fill="#16A34A" stroke="#fff" strokeWidth="2" />
<circle cx="108" cy="92" r="5" fill="#E59A00" stroke="#fff" strokeWidth="2" />
<circle cx="178" cy="22" r="5" fill="#E5372A" stroke="#fff" strokeWidth="2" />
</svg>
</div>
<div className="absolute right-[20px] bottom-[0] w-[250px] rounded-[14px] bg-[color:#fff] text-[color:#0D1B2E] [box-shadow:0_24px_60px_rgba(0,0,0,.35)] p-[12px_14px] flex gap-[12px] items-center [animation:ssFloat_6s_ease-in-out_-3s_infinite]">
<div className="w-[36px] h-[36px] rounded-[50%] bg-[color:oklch(0.93_0.045_150)] text-[color:oklch(0.42_0.1_150)] grid place-items-center text-[12.5px] font-semibold flex-none">
{tr("cd")}
</div>
<div className="flex-1 min-w-[0]">
<div className="font-semibold text-[13px]">
{tr("camille_durand")}
</div>
<div className="text-[11.5px] text-[color:#6F7A8B]">
{si?.t?.ilCheckin}
</div>
</div>
<span className="[font:500_11px_'Geist_Mono',monospace] p-[3px_7px] rounded-[999px] bg-[color:#E5F4EA] text-[color:#0F7A3F]">
{"07:54"}
</span>
</div>
</div>
</div>
<div className="relative max-w-[460px]">
<h2 className="m-[0] text-[30px] leading-[1.15] font-semibold tracking-[-.02em] [text-wrap:balance]">
{si?.t?.vpTitle}
</h2>
<div className="mt-[12px] text-[15px] text-[color:rgba(255,255,255,.78)] [text-wrap:pretty]">
{si?.t?.vpSub}
</div>
<div className="flex flex-wrap gap-[8px] mt-[20px]">
{(si?.vpChips ?? []).map((c, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[7px] h-[30px] p-[0_12px] rounded-[999px] bg-[color:rgba(255,255,255,.1)] border border-solid border-[color:rgba(255,255,255,.14)] text-[12.5px]">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7FB4FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 12l5 5L20 7" />
</svg>
{c}
</span>
</Fragment>))}
</div>
</div>
</section>
</>) : null}
<section className="flex-[1_1_50%] flex flex-col min-h-[100vh] box-border p-[24px_32px] bg-surface">
<div className="flex justify-between items-center gap-[12px]">
{si?.compact ? (<>
<div className="flex items-center gap-[8px]">
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[30px] h-[30px] object-contain" />
<span className="font-bold text-[16px]">
{tr("staffsync")}
</span>
</div>
</>) : null}
<div className="flex-1" />
<div className="flex items-center gap-[8px]">
<button onClick={si?.toggleTheme} title={tr("theme")} className="w-[32px] h-[32px] border border-solid border-border rounded-[8px] bg-transparent text-text-2 grid place-items-center cursor-pointer">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={si?.themeIcon} />
</svg>
</button>
<div role="group" aria-label={tr("language")} className="flex p-[3px] border border-solid border-border rounded-[9px] gap-[2px]">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-3 m-[5px_4px_0_5px]">
<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
</svg>
<button onClick={si?.setEn} className="border-0 h-[24px] p-[0_9px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:si?.en?.bg,color:si?.en?.fg}}>
{tr("en")}
</button>
<button onClick={si?.setFr} className="border-0 h-[24px] p-[0_9px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:si?.fr?.bg,color:si?.fr?.fg}}>
{tr("fr")}
</button>
</div>
</div>
</div>
<div className="flex-1 flex items-center justify-center p-[32px_0]">
<div className="w-[100%] max-w-[400px] flex flex-col gap-[20px]">
{si?.offline ? (<>
<div role="status" className="flex gap-[10px] items-start p-[12px_14px] rounded-[10px] bg-warn-bg text-warn [animation:ssIn_.2s_ease-out]">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[1px]">
<path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2.3-1.6M1.4 9a15 15 0 0 1 4.4-2.6M22.6 9A15 15 0 0 0 10.7 5M12 20h.01" />
</svg>
<div className="flex-1">
<div className="font-semibold text-[13.5px]">
{si?.t?.offTitle}
</div>
<div className="text-[12.5px]">
{si?.t?.offDesc}
</div>
</div>
<button onClick={si?.retry} className="h-[28px] p-[0_10px] rounded-[7px] border border-solid border-current bg-transparent text-[color:inherit] text-[12px] font-semibold cursor-pointer whitespace-nowrap">
{si?.t?.retry}
</button>
</div>
</>) : null}
<div>
<h1 className="m-[0] text-[26px] font-semibold tracking-[-.02em]">
{si?.t?.title}
</h1>
<div className="mt-[6px] text-text-2">
{si?.t?.sub}
</div>
</div>
{si?.isWrong ? (<>
<div role="alert" className="flex gap-[10px] p-[12px_14px] rounded-[10px] bg-bad-bg text-bad [animation:ssIn_.2s_ease-out]">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[1px]">
<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16h.01" />
</svg>
<div>
<div className="font-semibold text-[13.5px]">
{si?.t?.wrongTitle}
</div>
<div className="text-[12.5px]">
{si?.wrongDesc}
</div>
</div>
</div>
</>) : null}
{si?.isLocked ? (<>
<div role="alert" className="flex gap-[12px] p-[14px] rounded-[10px] bg-bad-bg text-bad [animation:ssIn_.2s_ease-out]">
<div className="w-[36px] h-[36px] rounded-[9px] bg-bad-dot text-[color:#fff] grid place-items-center flex-none">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
</svg>
</div>
<div className="flex-1">
<div className="font-semibold text-[13.5px]">
{si?.t?.lockTitle}
</div>
<div className="text-[12.5px]">
{si?.t?.lockDesc}
</div>
<div className="flex items-center gap-[10px] mt-[10px]">
<span className="[font:600_20px_'Geist_Mono',monospace] tracking-[.02em]">
{si?.lockClock}
</span>
<div className="flex-1 h-[4px] rounded-[4px] bg-[color:rgba(229,55,42,.2)] overflow-hidden">
<div className="h-[100%] bg-bad-dot" style={{width:si?.lockPct}} />
</div>
</div>
<div className="text-[12.5px] mt-[8px]">
<a href="#" onClick={si?.forgot} className="text-[color:inherit] underline">
{si?.t?.lockReset}
</a>
</div>
</div>
</div>
</>) : null}
{si?.isDeact ? (<>
<div role="alert" className="flex gap-[12px] p-[14px] rounded-[10px] bg-surface-2 border border-solid border-border-strong [animation:ssIn_.2s_ease-out]">
<div className="w-[36px] h-[36px] rounded-[9px] bg-neutral-bg text-text-2 grid place-items-center flex-none">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4 1.5M16 17h6" />
</svg>
</div>
<div className="flex-1">
<div className="font-semibold text-[13.5px]">
{si?.t?.deTitle}
</div>
<div className="text-[12.5px] text-text-2">
{si?.deDesc}
</div>
<div className="flex gap-[12px] mt-[8px] text-[12.5px]">
<a href="#" onClick={si?.contactAdmin}>
{si?.t?.deContact}
</a>
<a href="#" onClick={si?.useOther}>
{si?.t?.deOther}
</a>
</div>
</div>
</div>
</>) : null}
<form onSubmit={si?.submit} noValidate={true} className="flex flex-col gap-[16px]">
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{si?.t?.email}
</span>
<input value={si?.email} onChange={si?.onEmail} type="email" autoComplete="email" placeholder={tr("name_company_com")} disabled={si?.fieldsDisabled} className="h-[42px] p-[0_12px] rounded-[9px] text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${si?.emailBd}`,background:si?.fieldBg}} />
{si?.hasEmailErr ? (<>
<span className="text-[12.5px] text-bad">
{si?.emailErr}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="flex justify-between items-baseline">
<span className="text-[13px] font-medium">
{si?.t?.password}
</span>
<a href="#" onClick={si?.forgot} className="text-[12.5px] font-medium">
{si?.t?.forgot}
</a>
</span>
<div className="relative flex">
<input value={si?.password} onChange={si?.onPw} type={si?.pwType} autoComplete="current-password" placeholder="••••••••" disabled={si?.fieldsDisabled} className="flex-1 min-w-[0] h-[42px] p-[0_44px_0_12px] rounded-[9px] text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${si?.pwBd}`,background:si?.fieldBg}} />
<button type="button" onClick={si?.togglePw} aria-label={si?.pwAria} title={si?.pwAria} className="absolute right-[6px] top-[6px] w-[30px] h-[30px] border-0 rounded-[7px] bg-transparent text-text-3 grid place-items-center cursor-pointer hover:bg-hover hover:text-text">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={si?.eyeIcon} />
</svg>
</button>
</div>
{si?.hasPwErr ? (<>
<span className="text-[12.5px] text-bad">
{si?.pwErr}
</span>
</>) : null}
</label>
<label className="flex items-center gap-[9px] text-[13.5px] text-text-2 cursor-pointer self-start">
<input type="checkbox" checked={si?.remember} onChange={si?.onRemember} className="w-[16px] h-[16px] m-[0] [accent-color:#0B67DD]" />
{si?.t?.remember}{" "}
</label>
<button type="submit" disabled={si?.submitDisabled} className="flex items-center justify-center gap-[10px] h-[44px] border-0 rounded-[10px] text-[14.5px] font-semibold hover:[filter:brightness(1.06)]" style={{background:si?.btnBg,color:si?.btnFg,cursor:si?.btnCursor}}>
{si?.loading ? (<>
<span className="w-[16px] h-[16px] rounded-[50%] border-[2px] border-solid border-[color:rgba(255,255,255,.35)] [border-top-color:#fff] [animation:ssSpin_.7s_linear_infinite] box-border" />
</>) : null}
{" "}{si?.btnLabel}{" "}
</button>
</form>
<div className="flex items-center gap-[12px] text-text-3 text-[12px]">
<span className="flex-1 h-[1px] bg-border" />
{si?.t?.or}
<span className="flex-1 h-[1px] bg-border" />
</div>
<div className="flex flex-col gap-[10px]">
<button onClick={si?.ssoGoogle} disabled={si?.ssoDisabled} className="flex items-center justify-center gap-[10px] h-[42px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[14px] font-medium cursor-pointer hover:bg-hover" style={{opacity:si?.ssoOpacity}}>
<span className="w-[18px] h-[18px] grid place-items-center font-bold text-[16px] text-[color:#4285F4]">
{tr("g")}
</span>
{si?.t?.google}
</button>
<button onClick={si?.ssoMs} disabled={si?.ssoDisabled} className="flex items-center justify-center gap-[10px] h-[42px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[14px] font-medium cursor-pointer hover:bg-hover" style={{opacity:si?.ssoOpacity}}>
<span className="grid grid-cols-[7px_7px] gap-[1.5px]">
<span className="w-[7px] h-[7px] bg-[color:#F25022]" />
<span className="w-[7px] h-[7px] bg-[color:#7FBA00]" />
<span className="w-[7px] h-[7px] bg-[color:#00A4EF]" />
<span className="w-[7px] h-[7px] bg-[color:#FFB900]" />
</span>
{si?.t?.ms}
</button>
</div>
<div className="text-center text-[13.5px] text-text-2">
{si?.t?.noAccount}{" "}
<a href="#" onClick={si?.goCreate} className="font-medium">
{si?.t?.create}
</a>
</div>
<div className="text-[12px] text-text-3 text-center p-[8px_12px] rounded-[8px] bg-surface-2">
{si?.t?.demo}
</div>
</div>
</div>
<div className="flex justify-between flex-wrap gap-[8px] text-[12px] text-text-3">
<span>
{tr("2026_staffsync")}
</span>
<div className="flex gap-[16px]">
<a href="#" className="text-text-3">
{si?.t?.privacy}
</a>
<a href="#" className="text-text-3">
{si?.t?.terms}
</a>
<a href="#" className="text-text-3">
{si?.t?.status}
</a>
</div>
</div>
</section>
<div className="fixed left-[50%] bottom-[24px] [transform:translateX(-50%)] z-[40] flex flex-col gap-[8px] items-center">
{(si?.toasts ?? []).map((tt, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[11px_14px] rounded-[11px] bg-text text-surface shadow-pop text-[13.5px] [animation:ssIn_.2s_ease-out]">
<span className="w-[8px] h-[8px] rounded-[50%]" style={{background:tt?.c}} />
{tt?.msg}
</div>
</Fragment>))}
</div>
</div>
</>
    );
  }
}

export default function SignIn(props: any) {
  const tr = useTranslations('SignIn');
  return <SignInView {...props} tr={tr} />;
}
