'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const T={
  coMeta:['Construction · 198 employees · 5 sites','Construction · 198 employés · 5 sites'],
  invitedYou:['invited you to join the workspace','vous invite à rejoindre l’espace'],sent:['Branch manager · sent 13 Oct','Responsable d’agence · envoyée le 13 oct.'],
  yourRole:['Your role','Votre rôle'],roleName:['Site manager','Chef de site'],
  p1:['View attendance for Part-Dieu Tower','Voir les présences de Part-Dieu Tower'],p2:['Check in employees without a smartphone','Pointer pour les employés sans smartphone'],p3:['View leave requests for your site','Voir les demandes de congé de votre site'],p4:['Approve leave or resolve fraud flags','Approuver les congés ou traiter les fraudes'],
  expires:['This invitation expires on 20 Oct 2026.','Cette invitation expire le 20 oct. 2026.'],
  title:['Accept your invitation','Accepter l’invitation'],sub:['Set up your login to start managing your site.','Créez vos identifiants pour gérer votre site.'],
  orPw:['or set a password','ou choisissez un mot de passe'],email:['Email','E-mail'],name:['Full name','Nom complet'],password:['Password','Mot de passe'],pwPh:['At least 8 characters','8 caractères minimum'],
  accept:['Accept and join Batiplus Group','Accepter et rejoindre Batiplus Group'],joining:['Joining…','Connexion…'],
  legal:['By accepting, you agree to the','En acceptant, vous acceptez les'],terms:['Terms of Service','Conditions d’utilisation'],
  notYou:['Not Nadia?','Vous n’êtes pas Nadia ?'],decline:['Decline invitation','Refuser l’invitation'],
  eName:['Enter your full name.','Saisissez votre nom complet.'],ePw:['Use at least 8 characters with letters and numbers.','Au moins 8 caractères avec lettres et chiffres.'],
  show:['Show password','Afficher'],hide:['Hide password','Masquer'],
  expTitle:['This invitation has expired','Cette invitation a expiré'],expDesc:['Invitations are valid for 7 days. Marc Olivier sent this one on 3 Oct. Ask for a new link to join.','Les invitations sont valables 7 jours. Marc Olivier l’a envoyée le 3 oct. Demandez un nouveau lien.'],
  expPrimary:['Request a new invitation','Demander une nouvelle invitation'],toSignIn:['Go to sign in','Aller à la connexion'],
  usedTitle:['This invitation was already used','Cette invitation a déjà été utilisée'],usedDesc:['It was accepted on 14 Oct at 09:21. If that was you, sign in with the same email.','Elle a été acceptée le 14 oct. à 09:21. Si c’était vous, connectez-vous avec le même e-mail.'],
  usedPrimary:['Sign in as nadia.kone@batiplus.fr','Se connecter (nadia.kone@batiplus.fr)'],usedSecondary:['It wasn’t me','Ce n’était pas moi']
};
const EYE='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', EYEOFF='M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2';
const SUN='M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4', MOON='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z';
class InviteBase extends DCLogic {
  renderVals(){ return {iv:this.renderVals0()}; }
  state={lang:null,theme:null,name:'Nadia Koné',pw:'',showPw:false,tried:false,loading:false,toasts:[],declined:false};
  componentDidUpdate(pp){ if(pp.theme!==this.props.theme) this.setState({theme:null}); if(pp.lang!==this.props.lang) this.setState({lang:null}); }
  componentWillUnmount(){ clearTimeout(this.lt); }
  nav(r,o){ if(this.props.onNavigate) this.props.onNavigate(r,o); else window.location.href='/'; }
  toast(msg){ const id=Math.random(); this.setState(s=>({toasts:[...s.toasts,{id,msg}]})); setTimeout(()=>this.setState(s=>({toasts:s.toasts.filter(x=>x.id!==id)})),3200); }
  renderVals0(){
    const s=this.state,L=(s.lang||this.props.lang||'en')==='fr'?1:0,theme=s.theme||this.props.theme||'light',dark=theme==='dark';
    const t={}; for(const k in T) t[k]=T[k][L];
    const st=this.props.inviteState||'valid';
    const p=s.pw, r=[p.length>=8,/[a-z]/.test(p)&&/[A-Z]/.test(p),/\d/.test(p),/[^A-Za-z0-9]/.test(p)]; let sc=p?r.filter(Boolean).length:0; if(p.length<8) sc=Math.min(sc,1);
    const cols=['var(--bad-dot)','var(--bad-dot)','var(--warn-dot)','var(--ok-dot)','var(--ok-dot)'];
    const nameErr=s.tried&&s.name.trim().split(/\s+/).length<2?t.eName:'', pwErr=s.tried&&(sc<2||p.length<8)?t.ePw:'';
    const seg=on=>({bg:on?'var(--accent-soft)':'transparent',fg:on?'var(--accent)':'var(--text-3)'});
    const join=()=>{ this.setState({loading:true}); this.lt=setTimeout(()=>{ this.setState({loading:false}); this.nav('dashboard',{role:'site'}); },1200); };
    const dead=st==='expired'?{title:t.expTitle,desc:t.expDesc,icon:'M12 7v5l3 2',badgeBg:'var(--warn-dot)',primaryLabel:t.expPrimary,secondaryLabel:t.toSignIn,
        primary:()=>this.toast(L?'Demande envoyée à Marc Olivier':'Request sent to Marc Olivier'),secondary:()=>this.nav('signin')}
      :{title:t.usedTitle,desc:t.usedDesc,icon:'M5 12l5 5L20 7',badgeBg:'var(--accent)',primaryLabel:t.usedPrimary,secondaryLabel:t.usedSecondary,
        primary:()=>this.nav('signin'),secondary:()=>this.toast(L?'Signalé à la sécurité StaffSync':'Reported to StaffSync security')};
    return {
      theme,t,toggleTheme:()=>this.setState({theme:dark?'light':'dark'}),themeIcon:dark?SUN:MOON,en:seg(!L),fr:seg(!!L),setEn:()=>this.setState({lang:'en'},()=>this.props.onLang&&this.props.onLang('en')),setFr:()=>this.setState({lang:'fr'},()=>this.props.onLang&&this.props.onLang('fr')),
      isValid:st==='valid',isDead:st!=='valid',cardMax:st==='valid'?'860px':'520px',dead,
      perms:[[t.p1,1],[t.p2,1],[t.p3,1],[t.p4,0]].map(([label,ok])=>({label,icon:ok?'M5 12l5 5L20 7':'M18 6L6 18M6 6l12 12',ic:ok?'var(--ok-dot)':'var(--text-3)',c:ok?'var(--text)':'var(--text-3)'})),
      name:s.name,onName:e=>this.setState({name:e.target.value}),pw:s.pw,onPw:e=>this.setState({pw:e.target.value}),
      hasNameErr:!!nameErr,nameErr,hasPwErr:!!pwErr,pwErr,nameBd:nameErr?'var(--bad-dot)':'var(--border-strong)',pwBd:pwErr?'var(--bad-dot)':'var(--border-strong)',
      pwType:s.showPw?'text':'password',eyeIcon:s.showPw?EYEOFF:EYE,pwAria:s.showPw?t.hide:t.show,togglePw:()=>this.setState({showPw:!s.showPw}),
      bars:[1,2,3,4].map(i=>sc>=i?cols[sc]:'var(--neutral-bg)'),pwColor:cols[sc],pwLabel:p?(L?['Trop faible','Faible','Moyen','Bon','Fort']:['Too weak','Weak','Fair','Good','Strong'])[sc]:'',
      loading:s.loading,btnLabel:s.loading?t.joining:t.accept,
      accept:e=>{e.preventDefault(); if(s.loading) return; if(s.name.trim().split(/\s+/).length<2||sc<2||p.length<8){this.setState({tried:true});return;} join();},
      sso:()=>{ if(!s.loading) join(); },
      decline:e=>{e.preventDefault();this.toast(L?'Invitation refusée':'Invitation declined');setTimeout(()=>this.nav('signin'),900);},
      toasts:s.toasts
    };
  }
}

class InviteView extends InviteBase {
  view(S) {
    const tr = this.props.tr;
    const { iv } = S;
    return (
<>
<div data-theme={iv?.theme} className="min-h-[100vh] bg-bg text-text flex flex-col text-[14px] leading-[1.45]">
<header className="flex items-center justify-between gap-[12px] p-[20px_28px]">
<div className="flex items-center gap-[9px]">
<div className="w-[30px] h-[30px] rounded-[8px] bg-[color:#fff] border border-solid border-border grid place-items-center overflow-hidden">
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[26px] h-[26px] object-contain" />
</div>
<span className="font-bold text-[15px]">
{tr("staffsync")}
</span>
</div>
<div className="flex items-center gap-[8px]">
<button onClick={iv?.toggleTheme} title={tr("theme")} className="w-[32px] h-[32px] border border-solid border-border rounded-[8px] bg-surface text-text-2 grid place-items-center cursor-pointer">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={iv?.themeIcon} />
</svg>
</button>
<div className="flex p-[3px] border border-solid border-border rounded-[9px] gap-[2px] bg-surface">
<button onClick={iv?.setEn} className="border-0 h-[24px] p-[0_9px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:iv?.en?.bg,color:iv?.en?.fg}}>
{tr("en")}
</button>
<button onClick={iv?.setFr} className="border-0 h-[24px] p-[0_9px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:iv?.fr?.bg,color:iv?.fr?.fg}}>
{tr("fr")}
</button>
</div>
</div>
</header>
<main className="flex-1 flex justify-center items-start p-[16px_20px_56px]">
<div className="w-[100%] [animation:ssIn_.25s_ease-out]" style={{maxWidth:iv?.cardMax}}>
{iv?.isValid ? (<>
<div className="bg-surface border border-solid border-border rounded-[16px] shadow-card overflow-hidden flex flex-wrap">
<div className="flex-[1_1_300px] p-[28px] bg-surface-2 border-r border-solid border-r-border flex flex-col gap-[20px] box-border">
<div className="flex items-center gap-[14px]">
<div className="w-[56px] h-[56px] rounded-[14px] bg-[color:#0D1B2E] text-[color:#fff] grid place-items-center font-bold text-[22px] flex-none">
{tr("b")}
</div>
<div>
<div className="font-semibold text-[17px]">
{tr("batiplus_group")}
</div>
<div className="text-[12.5px] text-text-3">
{iv?.t?.coMeta}
</div>
</div>
</div>
<div className="flex gap-[10px] items-center p-[12px] rounded-[12px] bg-surface border border-solid border-border">
<div className="w-[34px] h-[34px] rounded-[50%] bg-[color:oklch(0.93_0.045_250)] text-[color:oklch(0.42_0.1_250)] grid place-items-center text-[12.5px] font-semibold flex-none">
{tr("mo")}
</div>
<div className="text-[13.5px] [text-wrap:pretty]">
<strong>
{tr("marc_olivier")}
</strong>
{" "}
<span className="text-text-2">
{iv?.t?.invitedYou}
</span>
<div className="text-[12px] text-text-3">
{iv?.t?.sent}
</div>
</div>
</div>
<div className="flex flex-col gap-[10px]">
<div className="text-[11px] font-semibold text-text-3 uppercase tracking-[.06em]">
{iv?.t?.yourRole}
</div>
<div className="flex flex-wrap gap-[8px] items-center">
<span className="inline-flex items-center gap-[6px] h-[28px] p-[0_11px] rounded-[999px] bg-accent-soft text-accent text-[13px] font-semibold">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
</svg>
{iv?.t?.roleName}
</span>
<span className="inline-flex items-center gap-[6px] h-[28px] p-[0_11px] rounded-[999px] bg-neutral-bg text-text-2 text-[13px] font-medium">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
</svg>
{tr("part_dieu_tower")}
</span>
</div>
<div className="flex flex-col gap-[7px] mt-[4px]">
{(iv?.perms ?? []).map((p, $index) => (<Fragment key={$index}>
<div className="flex gap-[9px] text-[13px]" style={{color:p?.c}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[2px]" style={{color:p?.ic}}>
<path d={p?.icon} />
</svg>
{p?.label}
</div>
</Fragment>))}
</div>
</div>
<div className="mt-[auto] text-[12px] text-text-3">
{iv?.t?.expires}
</div>
</div>
<form onSubmit={iv?.accept} className="flex-[1_1_340px] p-[28px] flex flex-col gap-[16px] box-border">
<div>
<h1 className="m-[0] text-[22px] font-semibold tracking-[-.02em]">
{iv?.t?.title}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{iv?.t?.sub}
</div>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[8px]">
<button type="button" onClick={iv?.sso} className="flex items-center justify-center gap-[8px] h-[40px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer hover:bg-hover">
<span className="font-bold text-[15px] text-[color:#4285F4]">
{tr("g")}
</span>
{tr("google")}
</button>
<button type="button" onClick={iv?.sso} className="flex items-center justify-center gap-[8px] h-[40px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer hover:bg-hover">
<span className="grid grid-cols-[6px_6px] gap-[1.5px]">
<span className="w-[6px] h-[6px] bg-[color:#F25022]" />
<span className="w-[6px] h-[6px] bg-[color:#7FBA00]" />
<span className="w-[6px] h-[6px] bg-[color:#00A4EF]" />
<span className="w-[6px] h-[6px] bg-[color:#FFB900]" />
</span>
{tr("microsoft")}
</button>
</div>
<div className="flex items-center gap-[12px] text-text-3 text-[12px]">
<span className="flex-1 h-[1px] bg-border" />
{iv?.t?.orPw}
<span className="flex-1 h-[1px] bg-border" />
</div>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{iv?.t?.email}
</span>
<div className="flex items-center gap-[8px] h-[40px] p-[0_12px] rounded-[9px] border border-solid border-border bg-surface-2 text-text-2">
<span className="flex-1">
{tr("nadia_kone_batiplus_fr")}
</span>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
</svg>
</div>
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{iv?.t?.name}
</span>
<input value={iv?.name} onChange={iv?.onName} disabled={iv?.loading} className="h-[40px] p-[0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${iv?.nameBd}`}} />
{iv?.hasNameErr ? (<>
<span className="text-[12.5px] text-bad">
{iv?.nameErr}
</span>
</>) : null}
</label>
<label className="flex flex-col gap-[6px]">
<span className="text-[13px] font-medium">
{iv?.t?.password}
</span>
<div className="relative flex">
<input value={iv?.pw} onChange={iv?.onPw} type={iv?.pwType} autoComplete="new-password" placeholder={iv?.t?.pwPh} disabled={iv?.loading} className="flex-1 min-w-[0] h-[40px] p-[0_44px_0_12px] rounded-[9px] bg-surface text-text text-[14px] [outline:none] focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]" style={{border:`1px solid ${iv?.pwBd}`}} />
<button type="button" onClick={iv?.togglePw} title={iv?.pwAria} className="absolute right-[5px] top-[5px] w-[30px] h-[30px] border-0 rounded-[7px] bg-transparent text-text-3 grid place-items-center cursor-pointer">
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={iv?.eyeIcon} />
</svg>
</button>
</div>
<div className="flex items-center gap-[10px]">
<div className="flex-1 grid grid-cols-[repeat(4,1fr)] gap-[4px]">
{(iv?.bars ?? []).map((b, $index) => (<Fragment key={$index}>
<span className="h-[4px] rounded-[4px]" style={{background:b}} />
</Fragment>))}
</div>
<span className="text-[12px] font-medium min-w-[52px] text-right" style={{color:iv?.pwColor}}>
{iv?.pwLabel}
</span>
</div>
{iv?.hasPwErr ? (<>
<span className="text-[12.5px] text-bad">
{iv?.pwErr}
</span>
</>) : null}
</label>
<button type="submit" disabled={iv?.loading} className="flex items-center justify-center gap-[10px] h-[44px] border-0 rounded-[10px] bg-accent text-[color:#fff] text-[14.5px] font-semibold cursor-pointer mt-[4px] hover:bg-accent-hover">
{iv?.loading ? (<>
<span className="w-[16px] h-[16px] rounded-[50%] border-[2px] border-solid border-[color:rgba(255,255,255,.35)] [border-top-color:#fff] [animation:ssSpin_.7s_linear_infinite] box-border" />
</>) : null}
{iv?.btnLabel}{" "}
</button>
<div className="text-[12px] text-text-3 text-center [text-wrap:pretty]">
{iv?.t?.legal}{" "}
<a href="#">
{iv?.t?.terms}
</a>
</div>
<div className="text-[12.5px] text-text-2 text-center">
{iv?.t?.notYou}{" "}
<a href="#" onClick={iv?.decline}>
{iv?.t?.decline}
</a>
</div>
</form>
</div>
</>) : null}
{iv?.isDead ? (<>
<div className="bg-surface border border-solid border-border rounded-[16px] shadow-card p-[36px_32px] text-center flex flex-col items-center gap-[12px]">
<div className="relative mb-[6px]">
<div className="w-[60px] h-[60px] rounded-[15px] bg-[color:#0D1B2E] text-[color:#fff] grid place-items-center font-bold text-[24px] opacity-[.5]">
{tr("b")}
</div>
<div className="absolute right-[-8px] bottom-[-8px] w-[28px] h-[28px] rounded-[50%] text-[color:#fff] border-[3px] border-solid border-surface grid place-items-center" style={{background:iv?.dead?.badgeBg}}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
<path d={iv?.dead?.icon} />
</svg>
</div>
</div>
<h1 className="m-[0] text-[22px] font-semibold tracking-[-.02em]">
{iv?.dead?.title}
</h1>
<div className="text-text-2 max-w-[380px] [text-wrap:pretty]">
{iv?.dead?.desc}
</div>
<div className="flex gap-[16px] flex-wrap justify-center m-[6px_0_4px] p-[10px_14px] rounded-[10px] bg-surface-2 text-[12.5px] text-text-2">
<span>
{tr("batiplus_group")}
</span>
<span className="text-text-3">
{"·"}
</span>
<span>
{iv?.t?.roleName}
</span>
<span className="text-text-3">
{"·"}
</span>
<span>
{tr("nadia_kone_batiplus_fr")}
</span>
</div>
<div className="flex gap-[8px] flex-wrap justify-center mt-[6px]">
<button onClick={iv?.dead?.secondary} className="h-[40px] p-[0_16px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[13.5px] font-medium cursor-pointer hover:bg-hover">
{iv?.dead?.secondaryLabel}
</button>
<button onClick={iv?.dead?.primary} className="h-[40px] p-[0_16px] rounded-[10px] border-0 bg-accent text-[color:#fff] text-[13.5px] font-medium cursor-pointer hover:bg-accent-hover">
{iv?.dead?.primaryLabel}
</button>
</div>
</div>
</>) : null}
</div>
</main>
<div className="fixed left-[50%] bottom-[24px] [transform:translateX(-50%)] z-[40] flex flex-col gap-[8px] items-center">
{(iv?.toasts ?? []).map((tt, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] p-[11px_14px] rounded-[11px] bg-text text-surface shadow-pop text-[13.5px] [animation:ssIn_.2s_ease-out]">
<span className="w-[8px] h-[8px] rounded-[50%] bg-[color:#16A34A]" />
{tt?.msg}
</div>
</Fragment>))}
</div>
</div>
</>
    );
  }
}

export default function Invite(props: any) {
  const tr = useTranslations('Invite');
  return <InviteView {...props} tr={tr} />;
}
