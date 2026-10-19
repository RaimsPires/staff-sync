'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const W=760,H=480,Z=[1,2,4,8,16,32,64],BASE=0.62;
const BR=['Lyon','Paris Nord','Marseille','Bordeaux'];
const MG=['Nadia Koné','Julien Roche','Marc Olivier','Sarah Benoît','Hugo Martel'];
const EMP=['Amélie Fontaine','Karim Benali','Léa Moreau','Thomas Girard','Inès Haddad','Paul Lambert','Sofia Rossi','Hugo Petit','Nora Diallo','Yanis Boucher','Camille Roux','Mehdi Cherif','Elena Marchand','Bastien Leroy','Georges Aubert','Monique Vidal'];
const TZ=[['Europe/Paris','Europe/Paris (UTC+1/+2)'],['Europe/London','Europe/London (UTC+0/+1)'],['Europe/Brussels','Europe/Brussels (UTC+1/+2)'],['Europe/Madrid','Europe/Madrid (UTC+1/+2)'],['Indian/Reunion','Indian/Reunion (UTC+4)']];
const ADDR=[['12 Rue de la Part-Dieu, 69003 Lyon',560,420],['4 Quai Rambaud, 69002 Lyon',545,447],['88 Avenue du Président Wilson, 93210 Saint-Denis',520,150],['Zone Cargo 4, 95700 Roissy-en-France',578,118],['21 Quai du Port, 13002 Marseille',580,640],['5 Cours du Médoc, 33300 Bordeaux',330,520],['17 Rue Solférino, 59000 Lille',540,38],['30 Rue de la République, 69002 Lyon',552,432],['2 Boulevard de la Villette, 75019 Paris',510,168],['45 Avenue du Prado, 13008 Marseille',572,652]];
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const hex=(x,y,rm)=>{const r=rm/100,k=[1,.88,1.08,.94,1.04,.9];return k.map((m,i)=>{const t=i/6*Math.PI*2;return {x:x+Math.cos(t)*r*m,y:y+Math.sin(t)*r*m};});};
const init=(site)=>{const e=!!site;const g=e?{shape:site.gt==='circle'?'circle':'poly',cx:site.x,cy:site.y,r:site.r,pts:site.gt==='circle'?[]:hex(site.x,site.y,site.r),set:true,drawing:false}:{shape:'circle',cx:null,cy:null,r:150,pts:[],set:false,drawing:false};
  return {name:e?site.name:'',code:e?(site.code||site.id.toUpperCase().slice(0,3)):'',codeTouched:e,br:e?site.br:'Lyon',addr:e?site.addr:'',tz:e&&site.tz||'Europe/Paris',mgrs:e?[].concat(site.mgrs||site.mgr?(site.mgrs||[site.mgr]):[]):[],emps:[],empQ:'',hs:'08:00',he:'16:00',hb:'30',selfie:e?site.selfie:true,qr:e?site.qr:true,dev:false,offline:true,acc:'50',active:e?site.active:true,
    geo:g,mcx:e?site.x:550,mcy:e?site.y:300,mz:e?5:0,mapType:'street',tried:false,sugOpen:false,toast:null};};
class AdminSiteEditorBase extends DCLogic {
  state=init(this.props.emp);
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2600); }
  sc(){ return BASE*Z[this.state.mz]; }
  w2s(x,y){ const sc=this.sc(); return {x:W/2+(x-this.state.mcx)*sc,y:H/2+(y-this.state.mcy)*sc}; }
  evW(ev){ const b=ev.currentTarget.getBoundingClientRect?ev.currentTarget.ownerSVGElement||ev.currentTarget:ev.currentTarget; const svg=ev.currentTarget.closest?ev.currentTarget.closest('svg'):b; const r=svg.getBoundingClientRect(),sc=this.sc(); return {x:this.state.mcx+((ev.clientX-r.left)/r.width*W-W/2)/sc,y:this.state.mcy+((ev.clientY-r.top)/r.height*H-H/2)/sc}; }
  geoSet(p){ this.setState(s=>({geo:Object.assign({},s.geo,p)})); }
  poly(p){ return p.pts.length>=3&&!p.drawing; }
  geoInfo(){ const g=this.state.geo,o={ok:false,area:0,per:0};
    if(g.shape==='circle'){ if(g.set&&g.r>=30){o.ok=true;o.area=Math.PI*g.r*g.r;o.per=2*Math.PI*g.r;o.cx=g.cx;o.cy=g.cy;o.rad=g.r;} }
    else if(g.pts.length>=3&&!g.drawing){ o.ok=true;const p=g.pts;let a=0,pr=0,mx=0,my=0;p.forEach((q,i)=>{const n=p[(i+1)%p.length];a+=q.x*n.y-n.x*q.y;pr+=Math.hypot(n.x-q.x,n.y-q.y);mx+=q.x;my+=q.y;});mx/=p.length;my/=p.length;o.area=Math.abs(a/2)*1e4;o.per=pr*100;o.cx=mx;o.cy=my;o.rad=Math.sqrt(o.area/Math.PI); }
    return o; }
  errs(){ const s=this.state,e={},sites=this.props.sites||[],gi=this.geoInfo();
    if(!s.name.trim()) e.name='Name is required'; else if(sites.some(x=>x.id!==(this.props.emp&&this.props.emp.id)&&x.name.toLowerCase()===s.name.trim().toLowerCase())) e.name='A site with this name exists';
    if(!s.code.trim()) e.code='Code is required'; else if(sites.some(x=>x.id!==(this.props.emp&&this.props.emp.id)&&(x.code||'').toUpperCase()===s.code.trim().toUpperCase())) e.code='Code already in use';
    if(!s.addr.trim()) e.addr='Choose or type an address';
    if(!gi.ok) e.geo=s.geo.shape==='circle'?(s.geo.set?'Radius must be at least 30 m':'Place the pin on the map to define the geofence'):'Draw at least 3 points and finish the shape';
    const a=+s.acc; if(!(a>=5&&a<=500)) e.acc='Enter between 5 and 500 m';
    if(s.he<=s.hs) e.hours='End time must be after start time';
    return e; }
  overl(){ const gi=this.geoInfo(),id=this.props.emp&&this.props.emp.id; if(!gi.ok) return []; return (this.props.sites||[]).filter(x=>x.id!==id&&x.active!==false&&Math.hypot(x.x-gi.cx,x.y-gi.cy)*100<x.r+gi.rad); }
  setAddrQuery(v){ this.setState({addr:v,sugOpen:v.trim().length>=2}); }
  pickAddr(a){ const g=this.state.geo; const upd={addr:a[0],sugOpen:false,mcx:a[1],mcy:a[2],mz:5}; this.setState(Object.assign(upd,{geo:g.shape==='circle'?Object.assign({},g,{cx:a[1],cy:a[2],set:true}):g.pts.length?Object.assign({},g,{pts:g.pts.map(p=>({x:p.x+a[1]-(g.pts.reduce((t,q)=>t+q.x,0)/g.pts.length),y:p.y+a[2]-(g.pts.reduce((t,q)=>t+q.y,0)/g.pts.length)}))}):g})); }
  renderVals(){ return {ed:this.rv()}; }
  rv(){
    const s=this.state,p=this.props,add=!p.emp,g=s.geo,sc=this.sc(),e=s.tried?this.errs():{},T=this;
    const gi=this.geoInfo(),ov=this.overl();
    const bd=k=>e[k]?'var(--bad-dot)':'var(--border-strong)';
    const sat=s.mapType==='sat',mp=sat?{sat:true,bg:'#2E3B31',block:'#3A4A3D',road:'#6B7A6F',water:'#1D3445',ofc:'#E8EDF2'}:{sat:false,bg:'var(--map-bg)',block:'var(--map-block)',road:'var(--map-road)',water:'var(--map-water)',ofc:'#4A5668'};
    const sp=this.w2s.bind(this);
    const c=g.shape==='circle'&&g.set?sp(g.cx,g.cy):null,crp=g.shape==='circle'?g.r/100*sc:0;
    const sv=g.pts.map(q=>sp(q.x,q.y));
    const ptsStr=sv.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ');
    const closed=g.shape==='poly'&&g.pts.length>=3&&!g.drawing;
    const verts=g.shape==='poly'?sv.map((q,i)=>({x:q.x.toFixed(1),y:q.y.toFixed(1),r:g.drawing&&i===0&&g.pts.length>=3?10:7,fill:g.drawing&&i===0&&g.pts.length>=3?'#2F7DF0':'#fff',cur:g.drawing?(i===0?'pointer':'default'):'move',
      down:ev=>{ if(g.drawing) return; ev.stopPropagation(); this._drag={t:'v',i}; this._moved=false; },
      click:ev=>{ ev.stopPropagation(); if(g.drawing&&i===0&&g.pts.length>=3) this.geoSet({drawing:false}); },
      del:ev=>{ ev.preventDefault(); ev.stopPropagation(); if(!g.drawing&&g.pts.length>3) this.geoSet({pts:g.pts.filter((_,j)=>j!==i)}); else this.say('A polygon needs at least 3 vertices'); }})):[];
    const others=(p.sites||[]).filter(x=>!(p.emp&&x.id===p.emp.id)).map(x=>{const q=sp(x.x,x.y);return {x:q.x.toFixed(1),y:q.y.toFixed(1),r:Math.max(5,x.r/100*sc).toFixed(1),n:x.name,ty:(q.y-Math.max(5,x.r/100*sc)-5).toFixed(0)};}).filter(o=>o.x>-40&&o.x<W+40&&o.y>-40&&o.y<H+40);
    const fmtA=a=>a>=10000?(a/10000).toFixed(2)+' ha':Math.round(a).toLocaleString('en')+' m²',fmtP=m=>m>=1000?(m/1000).toFixed(2)+' km':Math.round(m)+' m';
    const code=s.code.trim().toUpperCase(),qrUrl='staffsync://site/'+(code||'NEW');
    const cells=[];let r=hash(qrUrl+s.name)||1;const rnd=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;r>>>=0;return r;};
    for(let y=0;y<21;y++)for(let x=0;x<21;x++){const f=x<7&&y<7||x>13&&y<7||x<7&&y>13;if(f){const ox=x>13?x-14:x,oy=y>13?y-14:y;if(ox===0||ox===6||oy===0||oy===6||(ox>=2&&ox<=4&&oy>=2&&oy<=4))cells.push({x,y});}else if(!(x===7||y===7||(x===13&&y<8)||(y===13&&x<8))&&rnd()%2)cells.push({x,y});}
    const set=k=>ev=>this.setState({[k]:ev.target.value});
    const sugs=ADDR.filter(a=>a[0].toLowerCase().includes(s.addr.trim().toLowerCase())).slice(0,5).map(a=>({l:a[0],go:()=>this.pickAddr(a)}));
    const tg=k=>()=>this.setState(x=>({[k]:!x[k]}));
    const TG=[['selfie','Require selfie','Employees take a photo at check-in.'],['qr','Require QR scan','Check-in only after scanning the site QR code.'],['dev','Registered device only','Block check-ins from unregistered phones.'],['offline','Allow offline check-in','Records sync when the phone is back online.']];
    const ids=Object.keys(e),nn=ids.length;
    const overlapNames=ov.map(x=>x.name).join(', ');
    return {
      title:add?'Add site':'Edit '+s.name,saveL:add?'Create site':'Save changes',cancel:()=>p.onCancel&&p.onCancel(),stop:ev=>ev.stopPropagation(),
      hasErr:nn>0,errN:nn,errPl:nn===1?'':'s',overlap:ov.length>0,overlapNames,e,bd:{name:bd('name'),code:bd('code'),addr:bd('addr'),acc:bd('acc'),hours:bd('hours')},geoBd:e.geo?'var(--bad-dot)':'var(--border)',
      name:s.name,onName:ev=>{const v=ev.target.value;this.setState(x=>({name:v,code:x.codeTouched?x.code:v.replace(/[^A-Za-z]/g,'').slice(0,4).toUpperCase()}));},
      code:s.code,onCode:ev=>this.setState({code:ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''),codeTouched:true}),
      br:s.br,onBr:set('br'),brOpts:BR.map(b=>({v:b,l:b})),tz:s.tz,onTz:set('tz'),tzOpts:TZ.map(([v,l])=>({v,l})),
      addr:s.addr,onAddr:ev=>this.setAddrQuery(ev.target.value),addrFocus:()=>{if(s.addr.trim().length>=2)this.setState({sugOpen:true});},sugOpen:s.sugOpen&&sugs.length>0,sugs,
      mgrChips:MG.map(n=>{const on=s.mgrs.includes(n);return {n,bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:()=>this.setState(x=>({mgrs:on?x.mgrs.filter(i=>i!==n):x.mgrs.concat(n)}))};}),
      empN:s.emps.length,empQ:s.empQ,onEmpQ:set('empQ'),emps:EMP.filter(n=>n.toLowerCase().includes(s.empQ.toLowerCase())).map(n=>{const on=s.emps.includes(n);return {n,bg:on?'var(--accent)':'transparent',bd:on?'var(--accent)':'var(--border-strong)',op:on?1:0,go:()=>this.setState(x=>({emps:on?x.emps.filter(i=>i!==n):x.emps.concat(n)}))};}),
      hs:s.hs,he:s.he,hb:s.hb,onHs:set('hs'),onHe:set('he'),onHb:set('hb'),
      toggles:TG.map(([k,l,h])=>({l,h,bg:s[k]?'var(--accent)':'var(--border-strong)',left:s[k]?'19px':'2px',go:tg(k)})),
      acc:s.acc,onAcc:set('acc'),statuses:[[true,'Active'],[false,'Inactive']].map(([v,l])=>({l,bg:s.active===v?'var(--accent)':'var(--surface)',fg:s.active===v?'#fff':'var(--text-2)',go:()=>this.setState({active:v})})),
      shapes:[['circle','Circle'],['poly','Polygon']].map(([k,l])=>({l,bg:g.shape===k?'var(--accent)':'var(--surface)',fg:g.shape===k?'#fff':'var(--text-2)',
        go:()=>{ if(g.shape===k) return; if(k==='poly'){ const cx=g.set?g.cx:s.mcx,cy=g.set?g.cy:s.mcy; this.setState({geo:g.set?Object.assign({},g,{shape:'poly',pts:hex(cx,cy,g.r),drawing:false}):Object.assign({},g,{shape:'poly',pts:[],drawing:true})}); } else this.setState({geo:Object.assign({},g,{shape:'circle',cx:gi.ok&&g.shape==='poly'?gi.cx:g.cx,cy:gi.ok&&g.shape==='poly'?gi.cy:g.cy,set:gi.ok||g.set,r:gi.ok&&g.shape==='poly'?Math.max(30,Math.round(gi.rad/10)*10):g.r,drawing:false})}); }})),
      mapTypes:[['street','Street'],['sat','Satellite']].map(([k,l])=>({l,bg:s.mapType===k?'var(--accent)':'var(--surface)',fg:s.mapType===k?'#fff':'var(--text-2)',go:()=>this.setState({mapType:k})})),
      locate:()=>{ const fb=()=>{const b=ADDR[0];this.pickAddr(b);this.say('Location unavailable here — placed at a sample position');}; if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>{const x=(pos.coords.longitude+2)*100,y=(51.2-pos.coords.latitude)*87.5;this.setState(st=>({mcx:x,mcy:y,mz:5,geo:st.geo.shape==='circle'?Object.assign({},st.geo,{cx:x,cy:y,set:true}):st.geo}));this.say('Pin moved to your location');},fb,{timeout:4000}); } else fb(); },
      mp,world:'translate('+(W/2-s.mcx*sc).toFixed(1)+' '+(H/2-s.mcy*sc).toFixed(1)+') scale('+sc.toFixed(3)+')',others,
      cursor:g.shape==='poly'&&g.drawing?'crosshair':g.shape==='circle'&&!g.set?'crosshair':'grab',
      showCircle:!!c&&g.shape==='circle',showPin:!!c&&g.shape==='circle',cx:c?c.x.toFixed(1):0,cy:c?c.y.toFixed(1):0,crp:crp.toFixed(1),hx:c?(c.x+crp).toFixed(1):0,
      showPoly:closed,showLine:g.shape==='poly'&&g.drawing&&g.pts.length>1,polyPts:ptsStr,polyFill:'rgba(11,103,221,.18)',verts,
      dragPin:ev=>{ev.stopPropagation();this._drag={t:'pin'};this._moved=false;},dragHandle:ev=>{ev.stopPropagation();this._drag={t:'h'};this._moved=false;},
      mapMove:ev=>{ const d=this._drag; if(!d) return; const w=this.evW(ev); this._moved=true;
        if(d.t==='pin') this.geoSet({cx:w.x,cy:w.y});
        else if(d.t==='h') this.geoSet({r:Math.max(30,Math.min(2000,Math.round(Math.hypot(w.x-g.cx,w.y-g.cy)*100/10)*10))});
        else this.setState(st=>({geo:Object.assign({},st.geo,{pts:st.geo.pts.map((q,i)=>i===d.i?{x:w.x,y:w.y}:q)})})); },
      mapUp:()=>{ if(this._drag){ this._drag=null; this._justDragged=this._moved; } },
      mapClick:ev=>{ if(this._justDragged){this._justDragged=false;return;} const w=this.evW(ev);
        if(g.shape==='circle') this.geoSet({cx:w.x,cy:w.y,set:true});
        else if(g.drawing) this.geoSet({pts:g.pts.concat({x:w.x,y:w.y})}); },
      zIn:()=>this.setState({mz:Math.min(6,s.mz+1)}),zOut:()=>this.setState({mz:Math.max(0,s.mz-1)}),
      hint:g.shape==='circle'?(g.set?'Drag the pin to move it · drag the white handle to resize':'Click the map to place the pin'):g.drawing?(g.pts.length<3?'Click to add points ('+g.pts.length+'/3 minimum)':'Click the first point or “Finish shape” to close'):'Drag vertices to reshape · right-click a vertex to delete it',
      isCircle:g.shape==='circle',isPoly:g.shape==='poly',r:g.r,onR:ev=>this.geoSet({r:Math.max(0,+ev.target.value||0)}),
      finish:()=>{ if(g.pts.length>=3) this.geoSet({drawing:false}); },finOp:g.drawing&&g.pts.length>=3?1:.45,redraw:()=>this.geoSet({pts:[],drawing:true}),vN:g.pts.length,
      measures:[{k:'Area',v:gi.ok?fmtA(gi.area):'—'},{k:'Perimeter',v:gi.ok?fmtP(gi.per):'—'},{k:'Center',v:gi.ok?(51.2-gi.cy/87.5).toFixed(5)+', '+(gi.cx/100-2).toFixed(5):'—'}],
      qr:cells,qrUrl,qrNote:add&&!s.code?'Preview only. Enter a site code to generate the real code.':'Post this at the entrance. Employees scan it for QR check-in'+(s.qr?'.':' — currently QR is not required, but still works as a fallback.'),
      qrPrint:()=>this.say('Sent to the printer'),
      qrDl:()=>{ try{const rects=cells.map(c=>'<rect x="'+c.x+'" y="'+c.y+'" width="1" height="1"/>').join('');const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 25 25" width="400" height="400"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/><g fill="#0D1B2E">'+rects+'</g></svg>';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));a.download='qr-'+(code||'site')+'.svg';a.click();this.say('QR code downloaded');}catch(err){this.say('Download unavailable');} },
      save:()=>{ const er=this.errs(); if(Object.keys(er).length){this.setState({tried:true});return;}
        p.onSave&&p.onSave({id:p.emp?p.emp.id:null,name:s.name.trim(),code:s.code.trim().toUpperCase(),br:s.br,addr:s.addr.trim(),tz:s.tz,mgrs:s.mgrs,emp:s.emps.length,gt:g.shape==='circle'?'circle':'poly',r:Math.round(gi.rad),x:gi.cx,y:gi.cy,selfie:s.selfie,qr:s.qr,dev:s.dev,offline:s.offline,acc:+s.acc,active:s.active,hours:s.hs+'–'+s.he}); },
      toast:s.toast
    };
  }
}

class AdminSiteEditorView extends AdminSiteEditorBase {
  view(S) {
    const tr = this.props.tr;
    const { ed } = S;
    return (
<>
<div className="flex flex-col gap-[16px] relative">
<div className="flex items-center gap-[12px] flex-wrap">
<button onClick={ed?.cancel} className="flex items-center gap-[6px] h-[30px] p-[0_10px_0_6px] border-0 rounded-[8px] bg-transparent text-text-2 text-[13px] cursor-pointer hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M15 6l-6 6 6 6" />
</svg>
{tr("sites")}
</button>
<h2 className="m-[0] text-[20px] font-semibold tracking-[-.01em]">
{ed?.title}
</h2>
<div className="flex-1" />
<button onClick={ed?.cancel} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={ed?.save} className="h-[36px] p-[0_18px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{ed?.saveL}
</button>
</div>
{ed?.hasErr ? (<>
<div className="p-[11px_14px] rounded-[10px] bg-bad-bg text-bad text-[13px] font-medium">
{tr("p0_thing_p1_to_fix",{p0:ed?.errN ?? '',p1:ed?.errPl ?? ''})}
</div>
</>) : null}
{ed?.overlap ? (<>
<div className="p-[11px_14px] rounded-[10px] bg-warn-bg text-warn text-[13px]">
<b>
{tr("overlapping_geofence")}
</b>
{tr("this_area_overlaps_p0_employees",{p0:ed?.overlapNames ?? ''})}
</div>
</>) : null}
<div className="flex gap-[16px] items-start flex-wrap">
<div className="flex-[1_1_400px] max-w-[480px] min-w-[0] flex flex-col gap-[16px]">
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[14px]">
<div className="font-semibold text-[14.5px]">
{tr("details")}
</div>
<div className="grid grid-cols-[2fr_1fr] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("site_name")}
<input value={ed?.name} onInput={ed?.onName} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${ed?.bd?.name}`}} />
<span className="text-[12px] text-bad font-normal">
{ed?.e?.name}
</span>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("code")}
<input value={ed?.code} onInput={ed?.onCode} maxLength="6" className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${ed?.bd?.code}`}} />
<span className="text-[12px] text-bad font-normal">
{ed?.e?.code}
</span>
</label>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("branch")}
<select value={ed?.br} onChange={ed?.onBr} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(ed?.brOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="relative flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("address")}
<input value={ed?.addr} onInput={ed?.onAddr} onFocus={ed?.addrFocus} placeholder={tr("search_an_address")} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${ed?.bd?.addr}`}} />
{ed?.sugOpen ? (<>
<div className="absolute left-[0] right-[0] top-[62px] z-[15] bg-surface border border-solid border-border rounded-[10px] shadow-pop p-[4px] max-h-[220px] overflow-y-auto">
{(ed?.sugs ?? []).map((s, $index) => (<Fragment key={$index}>
<button onClick={s?.go} className="block w-[100%] text-left p-[8px_10px] border-0 rounded-[8px] bg-transparent text-text text-[13px] font-normal cursor-pointer hover:bg-hover">
{s?.l}
</button>
</Fragment>))}
</div>
</>) : null}
<span className="text-[12px] text-bad font-normal">
{ed?.e?.addr}
</span>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("timezone")}
<select value={ed?.tz} onChange={ed?.onTz} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(ed?.tzOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("site_managers")}
</div>
<div className="flex gap-[6px] flex-wrap">
{(ed?.mgrChips ?? []).map((a, $index) => (<Fragment key={$index}>
<button onClick={a?.go} className="h-[30px] p-[0_11px] rounded-[999px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${a?.bd}`,background:a?.bg,color:a?.fg}}>
{a?.n}
</button>
</Fragment>))}
</div>
</div>
<div className="flex flex-col gap-[6px]">
<div className="flex justify-between text-[12.5px] font-medium text-text-2">
<span>
{tr("assigned_employees")}
</span>
<span className="text-text-3 font-normal">
{tr("p0_selected",{p0:ed?.empN ?? ''})}
</span>
</div>
<div className="border border-solid border-border-strong rounded-[10px] overflow-hidden">
<input value={ed?.empQ} onInput={ed?.onEmpQ} placeholder={tr("search_employees")} className="w-[100%] box-border h-[34px] p-[0_11px] border-0 border-b border-solid border-b-border bg-surface-2 text-text text-[13px] [outline:none]" />
<div className="max-h-[150px] overflow-y-auto">
{(ed?.emps ?? []).map((p, $index) => (<Fragment key={$index}>
<div onClick={p?.go} className="flex items-center gap-[10px] p-[7px_11px] cursor-pointer text-[13px] hover:bg-hover">
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${p?.bd}`,background:p?.bg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:p?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
{p?.n}
</div>
</Fragment>))}
</div>
</div>
</div>
</section>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex flex-col gap-[14px]">
<div className="font-semibold text-[14.5px]">
{tr("attendance_rules")}
</div>
<div className="grid grid-cols-[1fr_1fr_1fr] gap-[10px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("start")}
<input type="time" value={ed?.hs} onInput={ed?.onHs} className="h-[34px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("end")}
<input type="time" value={ed?.he} onInput={ed?.onHe} className="h-[34px] p-[0_8px] rounded-[9px] bg-surface text-text" style={{border:`1px solid ${ed?.bd?.hours}`}} />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("break_min")}
<input type="number" min="0" step="5" value={ed?.hb} onInput={ed?.onHb} className="h-[34px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text [font-family:'Geist_Mono',monospace]" />
</label>
</div>
<span className="text-[12px] text-bad mt-[-8px]">
{ed?.e?.hours}
</span>
{(ed?.toggles ?? []).map((t, $index) => (<Fragment key={$index}>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{t?.l}
</div>
<div className="text-[12.5px] text-text-3">
{t?.h}
</div>
</div>
<div onClick={t?.go} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:t?.bg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:t?.left}} />
</div>
</div>
</Fragment>))}
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("minimum_gps_accuracy_meters")}
<div className="flex items-center gap-[10px]">
<input type="number" min="5" step="5" value={ed?.acc} onInput={ed?.onAcc} className="h-[34px] w-[110px] p-[0_10px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${ed?.bd?.acc}`}} />
<span className="text-[12.5px] text-text-3 font-normal">
{tr("check_ins_less_accurate_than",{p0:ed?.acc ?? ''})}
</span>
</div>
<span className="text-[12px] text-bad font-normal">
{ed?.e?.acc}
</span>
</label>
<div className="flex flex-col gap-[6px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("status")}
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden self-start">
{(ed?.statuses ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="h-[32px] p-[0_16px] border-0 text-[13px] font-medium cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
</div>
</section>
</div>
<div className="flex-[2_1_520px] min-w-[0] flex flex-col gap-[16px]">
<section className="bg-surface rounded-[12px] shadow-card overflow-hidden" style={{border:`1px solid ${ed?.geoBd}`}}>
<div className="p-[12px_14px] flex gap-[10px] items-center flex-wrap border-b border-solid border-b-border">
<div className="font-semibold text-[14.5px] mr-[6px]">
{tr("geofence")}
</div>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(ed?.shapes ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="h-[32px] p-[0_13px] border-0 text-[13px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
<div className="flex-1" />
<button onClick={ed?.locate} className="h-[32px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("use_my_location")}
</button>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(ed?.mapTypes ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="h-[32px] p-[0_12px] border-0 text-[13px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
</div>
<div className="relative" style={{background:ed?.mp?.bg}}>
<svg viewBox="0 0 760 480" width="100%" onClick={ed?.mapClick} onMouseMove={ed?.mapMove} onMouseUp={ed?.mapUp} onMouseLeave={ed?.mapUp} className="block select-none" style={{cursor:ed?.cursor}}>
<rect width="760" height="480" fill={ed?.mp?.bg} />
<g transform={ed?.world}>
<path d="M-200 700 Q 250 640 330 720 L 330 900 L -200 900Z" fill={ed?.mp?.water} />
<path d="M440 680 Q 580 690 700 665 L 900 665 L900 900 L440 900Z" fill={ed?.mp?.water} />
{ed?.mp?.sat ? (<>
<path d="M380 380 h90 v50 h-90z M600 120 h80 v70 h-80z M450 100 h60 v40 h-60z M480 160 h30 v28 h-30z M600 400 h60 v40 h-60z" fill={ed?.mp?.block} />
</>) : null}
<path d="M-100 160 L 1100 150 M -100 430 L 1100 410 M 520 -200 L 560 900 M 330 -200 L 390 900 M 740 -200 L 700 900 M 300 560 L 800 520" stroke={ed?.mp?.road} strokeWidth="5" fill="none" vectorEffect="non-scaling-stroke" />
</g>
{(ed?.others ?? []).map((o, $index) => (<Fragment key={$index}>
<g>
<circle cx={o?.x} cy={o?.y} r={o?.r} fill="rgba(150,160,175,.18)" stroke={ed?.mp?.ofc} strokeWidth="1.2" strokeDasharray="4 4" />
<circle cx={o?.x} cy={o?.y} r="4" fill={ed?.mp?.ofc} />
<text x={o?.x} y={o?.ty} fontSize="11" textAnchor="middle" fill={ed?.mp?.ofc}>
{o?.n}
</text>
</g>
</Fragment>))}
{ed?.showCircle ? (<>
<circle cx={ed?.cx} cy={ed?.cy} r={ed?.crp} fill="rgba(11,103,221,.18)" stroke="#2F7DF0" strokeWidth="2.2" />
<line x1={ed?.cx} y1={ed?.cy} x2={ed?.hx} y2={ed?.cy} stroke="#2F7DF0" strokeWidth="1.4" strokeDasharray="4 3" />
<circle cx={ed?.hx} cy={ed?.cy} r="7" fill="#fff" stroke="#2F7DF0" strokeWidth="2.5" onMouseDown={ed?.dragHandle} onClick={ed?.stop} className="[cursor:ew-resize]" />
</>) : null}
{ed?.showPoly ? (<>
<polygon points={ed?.polyPts} fill={ed?.polyFill} stroke="#2F7DF0" strokeWidth="2.2" strokeLinejoin="round" />
</>) : null}
{ed?.showLine ? (<>
<polyline points={ed?.polyPts} fill="none" stroke="#2F7DF0" strokeWidth="2.2" strokeDasharray="5 4" />
</>) : null}
{(ed?.verts ?? []).map((v, $index) => (<Fragment key={$index}>
<circle cx={v?.x} cy={v?.y} r={v?.r} fill={v?.fill} stroke="#2F7DF0" strokeWidth="2.5" onMouseDown={v?.down} onClick={v?.click} onContextMenu={v?.del} style={{cursor:v?.cur}} />
</Fragment>))}
{ed?.showPin ? (<>
<g onMouseDown={ed?.dragPin} onClick={ed?.stop} className="cursor-move">
<circle cx={ed?.cx} cy={ed?.cy} r="9" fill="var(--accent)" stroke="#fff" strokeWidth="3" />
<circle cx={ed?.cx} cy={ed?.cy} r="3" fill="#fff" />
</g>
</>) : null}
</svg>
<div className="absolute top-[10px] right-[10px] flex flex-col gap-[5px]">
<button onClick={ed?.zIn} aria-label={tr("zoom_in")} className="w-[32px] h-[32px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[17px] cursor-pointer">
{"+"}
</button>
<button onClick={ed?.zOut} aria-label={tr("zoom_out")} className="w-[32px] h-[32px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[17px] cursor-pointer">
{"−"}
</button>
</div>
<div className="absolute left-[10px] bottom-[10px] p-[6px_10px] rounded-[9px] bg-surface border border-solid border-border text-[12px] text-text-2 max-w-[calc(100%_-_80px)]">
{ed?.hint}
</div>
</div>
<div className="p-[12px_14px] border-t border-solid border-t-border flex gap-[14px_22px] flex-wrap items-end">
{ed?.isCircle ? (<>
<div className="flex flex-col gap-[6px] flex-[1_1_240px]">
<div className="text-[12.5px] font-medium text-text-2">
{tr("radius")}
</div>
<div className="flex items-center gap-[10px]">
<input type="range" min="30" max="1000" step="10" value={ed?.r} onInput={ed?.onR} className="flex-1" />
<input type="number" min="30" step="10" value={ed?.r} onInput={ed?.onR} className="h-[32px] w-[84px] p-[0_8px] rounded-[8px] border border-solid border-border-strong bg-surface text-text [font:13px_'Geist_Mono',monospace]" />
<span className="text-[12.5px] text-text-3">
{tr("m")}
</span>
</div>
</div>
</>) : null}
{ed?.isPoly ? (<>
<div className="flex gap-[8px] flex-wrap flex-[1_1_240px] items-center">
<button onClick={ed?.finish} className="h-[32px] p-[0_12px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[12.5px] font-medium cursor-pointer" style={{opacity:ed?.finOp}}>
{tr("finish_shape")}
</button>
<button onClick={ed?.redraw} className="h-[32px] p-[0_12px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("redraw")}
</button>
<span className="text-[12.5px] text-text-3">
{tr("p0_vertices",{p0:ed?.vN ?? ''})}
</span>
</div>
</>) : null}
<div className="flex gap-[18px] flex-wrap">
{(ed?.measures ?? []).map((m, $index) => (<Fragment key={$index}>
<div>
<div className="text-[11.5px] text-text-3">
{m?.k}
</div>
<div className="[font:600_13.5px_'Geist_Mono',monospace]">
{m?.v}
</div>
</div>
</Fragment>))}
</div>
</div>
<div className="p-[0_14px_12px] text-[12px] text-bad">
{ed?.e?.geo}
</div>
</section>
</div>
</div>
<section className="bg-surface border border-solid border-border rounded-[12px] shadow-card p-[16px_18px] flex gap-[20px] items-center flex-wrap">
<div className="w-[132px] h-[132px] border border-solid border-border rounded-[12px] p-[10px] bg-[color:#fff] flex-none">
<svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
{(ed?.qr ?? []).map((c, $index) => (<Fragment key={$index}>
<rect x={c?.x} y={c?.y} width="1" height="1" fill="#0D1B2E" />
</Fragment>))}
</svg>
</div>
<div className="flex-[1_1_280px] flex flex-col gap-[6px]">
<div className="font-semibold text-[14.5px]">
{tr("site_qr_code")}
</div>
<div className="text-[13px] text-text-2">
{ed?.qrNote}
</div>
<div className="[font:12px_'Geist_Mono',monospace] text-text-3">
{ed?.qrUrl}
</div>
<div className="flex gap-[8px] mt-[4px]">
<button onClick={ed?.qrPrint} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("print")}
</button>
<button onClick={ed?.qrDl} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("download_svg")}
</button>
</div>
</div>
</section>
{ed?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{ed?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminSiteEditor(props: any) {
  const tr = useTranslations('AdminSiteEditor');
  return <AdminSiteEditorView {...props} tr={tr} />;
}
