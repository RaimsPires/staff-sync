'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const T={
  title:['Choose a workspace','Choisissez un espace'],signOut:['Sign out','Se déconnecter'],create:['Create new company','Créer une entreprise'],
  createDesc:['Start a new workspace with its own branches, sites and team.','Démarrez un nouvel espace avec ses agences, sites et équipes.'],
  search:['Search companies','Rechercher une entreprise'],lastAccessed:['Last accessed','Dernier accès'],lastUsed:['Last used','Dernier utilisé'],
  suspended:['Trial ended','Essai terminé'],suspDesc:['Only an admin can reactivate this workspace.','Seul un administrateur peut réactiver cet espace.'],reactivate:['Choose a plan','Choisir une offre'],
  emptyDesc:['Check the spelling, or ask the company admin to invite you.','Vérifiez l’orthographe ou demandez une invitation à l’administrateur.'],clear:['Clear search','Effacer'],
  missing:['Don’t see your company? Ask its admin to send an invitation to claire@batiplus.fr.','Vous ne voyez pas votre entreprise ? Demandez une invitation pour claire@batiplus.fr.']
};
const CO=[
  {id:'bp',name:'Batiplus Group',mono:'B',logo:'#0D1B2E',role:'admin',scope:['Whole company','Toute l’entreprise'],meta:['198 employees · 5 sites','198 employés · 5 sites'],last:['Today, 08:12','Aujourd’hui, 08:12'],isLast:1},
  {id:'nr',name:'Nettoyage Rhône Services',mono:'NR',logo:'oklch(0.55 0.13 160)',role:'branch',scope:['Lyon branch','Agence Lyon'],meta:['86 employees · 12 sites','86 employés · 12 sites'],last:['Yesterday, 17:40','Hier, 17:40']},
  {id:'sp',name:'SécuriPort Marseille',mono:'SP',logo:'oklch(0.55 0.15 25)',role:'site',scope:['Port Vieux Yard','Port Vieux Yard'],meta:['42 employees · 3 sites','42 employés · 3 sites'],last:['12 Oct','12 oct.']},
  {id:'ld',name:'Logistique Delta',mono:'LD',logo:'oklch(0.5 0.14 290)',role:'branch',scope:['Paris Nord branch','Agence Paris Nord'],meta:['310 employees · 9 sites','310 employés · 9 sites'],last:['28 Sep','28 sept.']},
  {id:'am',name:'Atelier Moreau & Fils',mono:'AM',logo:'oklch(0.6 0.1 70)',role:'admin',scope:['Whole company','Toute l’entreprise'],meta:['14 employees · 1 site','14 employés · 1 site'],last:['2 Aug','2 août'],suspended:1}
];
const ROLE={admin:[['Company admin','Administratrice'],'var(--accent-soft)','var(--accent)'],branch:[['Branch manager','Responsable d’agence'],'var(--violet-bg)','var(--violet)'],site:[['Site manager','Cheffe de site'],'var(--ok-bg)','var(--ok)']};
const SUN='M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4', MOON='M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z';
class WorkspacesBase extends DCLogic {
  renderVals(){ return {ws:this.renderVals0()}; }
  state={lang:null,theme:null,q:'',entering:null};
  componentDidUpdate(pp){ if(pp.theme!==this.props.theme) this.setState({theme:null}); if(pp.lang!==this.props.lang) this.setState({lang:null}); }
  componentWillUnmount(){ clearTimeout(this.lt); }
  nav(r,o){ if(this.props.onNavigate) this.props.onNavigate(r,o); else window.location.href='/'; }
  renderVals0(){
    const s=this.state,L=(s.lang||this.props.lang||'en')==='fr'?1:0,theme=s.theme||this.props.theme||'light',dark=theme==='dark';
    const t={}; for(const k in T) t[k]=T[k][L];
    const q=s.q.trim().toLowerCase();
    const list=CO.filter(c=>!q||c.name.toLowerCase().includes(q)||ROLE[c.role][0][L].toLowerCase().includes(q));
    const seg=on=>({bg:on?'var(--accent-soft)':'transparent',fg:on?'var(--accent)':'var(--text-3)'});
    const cards=list.map(c=>{const r=ROLE[c.role], busy=s.entering===c.id, dis=!!c.suspended||(!!s.entering&&!busy);
      return {name:c.name,mono:c.mono,logoBg:c.logo,role:r[0][L],roleBg:r[1],roleFg:r[2],scope:c.scope[L],meta:c.meta[L],last:c.last[L],isLast:!!c.isLast,suspended:!!c.suspended,
        disabled:dis,cursor:dis?'default':'pointer',opacity:c.suspended?.6:s.entering&&!busy?.5:1,bd:busy?'var(--accent)':'var(--border)',loading:busy,showArrow:!busy&&!c.suspended,
        go:()=>{ if(dis||s.entering) return; this.setState({entering:c.id}); this.lt=setTimeout(()=>{this.setState({entering:null});this.nav('dashboard',{role:c.role});},800); },
        reactivate:e=>{e.preventDefault();e.stopPropagation();this.nav('onboarding',{step:8});}};});
    return {
      theme,t,toggleTheme:()=>this.setState({theme:dark?'light':'dark'}),themeIcon:dark?SUN:MOON,en:seg(!L),fr:seg(!!L),setEn:()=>this.setState({lang:'en'},()=>this.props.onLang&&this.props.onLang('en')),setFr:()=>this.setState({lang:'fr'},()=>this.props.onLang&&this.props.onLang('fr')),
      subtitle:L?`Vous avez accès à ${CO.length} entreprises. Choisissez celle à ouvrir.`:`You have access to ${CO.length} companies. Pick the one you want to open.`,
      q:s.q,onQ:e=>this.setState({q:e.target.value}),hasQ:!!s.q,clearQ:()=>this.setState({q:''}),
      cards,empty:cards.length===0,emptyTitle:L?`Aucune entreprise ne correspond à « ${s.q} »`:`No companies match “${s.q}”`,
      createNew:()=>this.nav('onboarding'),signOut:()=>this.nav('signin')
    };
  }
}

class WorkspacesView extends WorkspacesBase {
  view(S) {
    const tr = this.props.tr;
    const { ws } = S;
    return (
<>
<div data-theme={ws?.theme} className="min-h-[100vh] bg-bg text-text flex flex-col text-[14px] leading-[1.45]">
<header className="flex items-center justify-between gap-[12px] p-[16px_28px] border-b border-solid border-b-border bg-surface">
<div className="flex items-center gap-[9px]">
<div className="w-[30px] h-[30px] rounded-[8px] bg-[color:#fff] border border-solid border-border grid place-items-center overflow-hidden">
<img src="/staffsync-logo.png" alt={tr("staffsync")} className="w-[26px] h-[26px] object-contain" />
</div>
<span className="font-bold text-[15px]">
{tr("staffsync")}
</span>
</div>
<div className="flex items-center gap-[10px]">
<button onClick={ws?.toggleTheme} title={tr("theme")} className="w-[32px] h-[32px] border border-solid border-border rounded-[8px] bg-transparent text-text-2 grid place-items-center cursor-pointer">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d={ws?.themeIcon} />
</svg>
</button>
<div className="flex p-[3px] border border-solid border-border rounded-[9px] gap-[2px]">
<button onClick={ws?.setEn} className="border-0 h-[24px] p-[0_9px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:ws?.en?.bg,color:ws?.en?.fg}}>
{tr("en")}
</button>
<button onClick={ws?.setFr} className="border-0 h-[24px] p-[0_9px] rounded-[6px] text-[12px] font-semibold cursor-pointer" style={{background:ws?.fr?.bg,color:ws?.fr?.fg}}>
{tr("fr")}
</button>
</div>
<div className="w-[1px] h-[24px] bg-border" />
<div className="flex items-center gap-[9px]">
<div className="w-[32px] h-[32px] rounded-[50%] bg-[color:oklch(0.93_0.045_30)] text-[color:oklch(0.42_0.1_30)] grid place-items-center text-[12px] font-semibold">
{tr("cv")}
</div>
<div className="leading-[1.25]">
<div className="font-semibold text-[13px]">
{tr("claire_vasseur")}
</div>
<div className="text-[12px] text-text-3">
{tr("claire_batiplus_fr")}
</div>
</div>
</div>
<button onClick={ws?.signOut} className="flex items-center gap-[6px] h-[32px] p-[0_11px] border border-solid border-border rounded-[8px] bg-transparent text-text-2 text-[12.5px] font-medium cursor-pointer hover:bg-hover hover:text-bad">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
</svg>
{ws?.t?.signOut}
</button>
</div>
</header>
<main className="flex-1 flex justify-center p-[40px_24px_64px]">
<div className="w-[100%] max-w-[880px] flex flex-col gap-[20px]">
<div className="flex items-end justify-between gap-[16px] flex-wrap">
<div>
<h1 className="m-[0] text-[26px] font-semibold tracking-[-.02em]">
{ws?.t?.title}
</h1>
<div className="mt-[6px] text-text-2">
{ws?.subtitle}
</div>
</div>
<button onClick={ws?.createNew} className="flex items-center gap-[7px] h-[38px] p-[0_14px] rounded-[10px] border border-solid border-border-strong bg-surface text-text text-[13.5px] font-medium cursor-pointer hover:bg-hover">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
<path d="M12 5v14M5 12h14" />
</svg>
{ws?.t?.create}
</button>
</div>
<div className="flex items-center gap-[10px] h-[42px] p-[0_14px] border border-solid border-border-strong rounded-[10px] bg-surface text-text-3 focus-within:border-accent">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3" />
</svg>
<input value={ws?.q} onChange={ws?.onQ} placeholder={ws?.t?.search} className="flex-1 min-w-[0] border-0 [outline:0] bg-transparent text-text text-[14px]" />
{ws?.hasQ ? (<>
<button onClick={ws?.clearQ} title={tr("clear")} className="w-[24px] h-[24px] border-0 rounded-[6px] bg-neutral-bg text-text-2 grid place-items-center cursor-pointer">
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
<path d="M18 6L6 18M6 6l12 12" />
</svg>
</button>
</>) : null}
</div>
<div className="flex flex-col gap-[10px]">
{(ws?.cards ?? []).map((c, $index) => (<Fragment key={$index}>
<button onClick={c?.go} disabled={c?.disabled} className="flex items-center gap-[16px] p-[16px_18px] rounded-[14px] bg-surface text-text text-left shadow-card w-[100%] hover:border-border-strong hover:bg-surface-2" style={{border:`1px solid ${c?.bd}`,cursor:c?.cursor,opacity:c?.opacity}}>
<div className="w-[48px] h-[48px] rounded-[12px] text-[color:#fff] grid place-items-center font-bold text-[18px] flex-none" style={{background:c?.logoBg}}>
{c?.mono}
</div>
<div className="flex-1 min-w-[0] flex flex-col gap-[5px]">
<div className="flex items-center gap-[8px] flex-wrap">
<span className="font-semibold text-[15px]">
{c?.name}
</span>
{c?.isLast ? (<>
<span className="text-[11px] font-semibold p-[2px_7px] rounded-[999px] bg-ok-bg text-ok">
{ws?.t?.lastUsed}
</span>
</>) : null}
{c?.suspended ? (<>
<span className="text-[11px] font-semibold p-[2px_7px] rounded-[999px] bg-warn-bg text-warn">
{ws?.t?.suspended}
</span>
</>) : null}
</div>
<div className="flex items-center gap-[8px] flex-wrap text-[12.5px] text-text-2">
<span className="inline-flex items-center h-[22px] p-[0_8px] rounded-[999px] font-semibold text-[12px]" style={{background:c?.roleBg,color:c?.roleFg}}>
{c?.role}
</span>
<span>
{c?.scope}
</span>
<span className="text-text-3">
{"·"}
</span>
<span className="text-text-3">
{c?.meta}
</span>
</div>
</div>
<div className="flex flex-col items-end gap-[4px] flex-none min-w-[120px]">
<span className="text-[12px] text-text-3">
{ws?.t?.lastAccessed}
</span>
<span className="text-[13px] font-medium">
{c?.last}
</span>
</div>
<div className="w-[32px] h-[32px] rounded-[9px] grid place-items-center text-text-3 flex-none">
{c?.loading ? (<>
<span className="w-[16px] h-[16px] rounded-[50%] border-[2px] border-solid border-border-strong [border-top-color:var(--accent)] [animation:ssSpin_.7s_linear_infinite] box-border" />
</>) : null}
{c?.showArrow ? (<>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M9 6l6 6-6 6" />
</svg>
</>) : null}
</div>
</button>
{c?.suspended ? (<>
<div className="flex items-center gap-[8px] m-[-4px_0_4px_18px] text-[12.5px] text-warn">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 3l10 18H2zM12 10v4M12 17h.01" />
</svg>
{ws?.t?.suspDesc}{" "}
<a href="#" onClick={c?.reactivate} className="font-medium">
{ws?.t?.reactivate}
</a>
</div>
</>) : null}
</Fragment>))}
{ws?.empty ? (<>
<div className="p-[48px_20px] text-center bg-surface border border-dashed border-border-strong rounded-[14px]">
<div className="font-semibold text-[15px]">
{ws?.emptyTitle}
</div>
<div className="text-text-3 text-[13px] m-[4px_0_14px]">
{ws?.t?.emptyDesc}
</div>
<button onClick={ws?.clearQ} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{ws?.t?.clear}
</button>
</div>
</>) : null}
<button onClick={ws?.createNew} className="flex items-center gap-[16px] p-[16px_18px] rounded-[14px] border-[1.5px] border-dashed border-border-strong bg-transparent text-text-2 text-left cursor-pointer w-[100%] hover:border-accent hover:text-accent hover:bg-accent-soft">
<div className="w-[48px] h-[48px] rounded-[12px] border-[1.5px] border-dashed border-current grid place-items-center flex-none">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
<path d="M12 5v14M5 12h14" />
</svg>
</div>
<div>
<div className="font-semibold text-[14.5px]">
{ws?.t?.create}
</div>
<div className="text-[12.5px] text-text-3">
{ws?.t?.createDesc}
</div>
</div>
</button>
</div>
<div className="text-[12.5px] text-text-3 text-center">
{ws?.t?.missing}
</div>
</div>
</main>
</div>
</>
    );
  }
}

export default function Workspaces(props: any) {
  const tr = useTranslations('Workspaces');
  return <WorkspacesView {...props} tr={tr} />;
}
