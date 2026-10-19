'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminSiteEditor from './AdminSiteEditor';
import AdminSiteDetail from './AdminSiteDetail';

const MG=['Nadia Koné','Julien Roche','Marc Olivier','Sarah Benoît','Hugo Martel'];
const BR=['Lyon','Paris Nord','Marseille','Bordeaux'];
const Z=[1,2,4,8,16,32],BASE=0.62,W=760,H=500;
const S=(id,name,br,addr,x,y,gt,r,mgr,emp,exp,pres,selfie,qr,active)=>({id,name,br,addr,x,y,gt,r,mgr,emp,exp,pres,selfie,qr,active});
const SITES=[
 S('pd','Part-Dieu Tower','Lyon','12 Rue de la Part-Dieu, Lyon',560,420,'circle',150,'Nadia Koné',42,38,35,true,true,true),
 S('cf','Confluence Depot','Lyon','4 Quai Rambaud, Lyon',545,447,'poly',180,'Julien Roche',31,27,25,true,false,true),
 S('sd','Saint-Denis Hub','Paris Nord','88 Av. Wilson, Saint-Denis',520,150,'circle',200,'Marc Olivier',58,52,46,false,true,true),
 S('rl','Roissy Logistics','Paris Nord','Zone Cargo 4, Roissy-en-France',578,118,'poly',350,'Marc Olivier',47,41,38,true,true,true),
 S('pv','Port Vieux Yard','Marseille','21 Quai du Port, Marseille',580,640,'circle',160,'Sarah Benoît',36,31,30,true,false,true),
 S('bx','Bordeaux Dock','Bordeaux','5 Cours du Médoc, Bordeaux',330,520,'circle',220,'Hugo Martel',0,0,0,false,true,false),
 S('li','Lille Annex','Paris Nord','17 Rue Solférino, Lille',540,38,'circle',120,'Marc Olivier',12,10,7,true,true,true)];
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const fenceL=x=>(x.gt==='circle'?'Circle · '+x.r+' m':'Polygon · ~'+x.r+' m');
class AdminSitesBase extends DCLogic {
  state={det:null,ed:null,sites:SITES,view:'map',q:'',br:'all',mgr:'all',stt:'all',sel:null,cx:550,cy:300,zi:0,menu:null,m:null,qrM:null,dx:null,toast:null};
  componentWillUnmount(){ clearTimeout(this.tt); }
  say(m){ this.setState({toast:m}); clearTimeout(this.tt); this.tt=setTimeout(()=>this.setState({toast:null}),2400); }
  vis(){ const s=this.state,q=s.q.trim().toLowerCase();
    return s.sites.filter(x=>(s.br==='all'||x.br===s.br)&&(s.mgr==='all'||x.mgr===s.mgr)&&(s.stt==='all'||(s.stt==='active')===x.active)&&(!q||x.name.toLowerCase().includes(q)||x.addr.toLowerCase().includes(q))); }
  focus(x){ this.setState({sel:x.id,cx:x.x,cy:x.y,zi:Math.max(this.state.zi,4)}); }
  mval(){ const m=this.state.m,e={}; if(!m.name.trim()) e.name='Name is required'; else if(this.state.sites.some(x=>x.id!==m.id&&x.name.toLowerCase()===m.name.trim().toLowerCase())) e.name='A site with this name exists';
    if(!m.addr.trim()) e.addr='Address is required'; if(!(+m.r>=50)) e.r='Minimum 50 m'; const la=parseFloat(m.lat),lo=parseFloat(m.lng); if(m.lat===''||m.lng==='') e.loc='Set a location: click the map or enter coordinates'; else if(isNaN(la)||isNaN(lo)||la<-90||la>90||lo<-180||lo>180) e.loc='Enter valid coordinates (latitude −90 to 90, longitude −180 to 180)'; return e; }
  w2g(x,y){ return {lat:(51.2-y/87.5).toFixed(5),lng:(x/100-2).toFixed(5)}; }
  g2w(lat,lng){ return {x:(lng+2)*100,y:(51.2-lat)*87.5}; }
  setLoc(x,y){ const g=this.w2g(x,y); this.setState(st=>({m:Object.assign({},st.m,{lat:g.lat,lng:g.lng,mcx:x,mcy:y})})); }
  renderVals(){ return {st:this.rv()}; }
  rv(){
    const s=this.state,T=this,list=this.vis(),sc=BASE*Z[s.zi];
    const col=x=>!x.active?'var(--neutral-dot)':x.exp&&x.pres/x.exp<.85?'var(--warn-dot)':'var(--ok-dot)';
    const pos=x=>({x:W/2+(x.x-s.cx)*sc,y:H/2+(x.y-s.cy)*sc});
    const sel=s.sites.find(x=>x.id===s.sel);
    const set=k=>ev=>this.setState({[k]:ev.target.value});
    const mgrs=MG;
    // clustering
    const items=list.map(x=>Object.assign({s:x},pos(x))),cl=[],used={};
    items.forEach((a,i)=>{ if(used[i]) return; const g=[a];used[i]=1; items.forEach((b,j)=>{ if(!used[j]&&Math.hypot(a.x-b.x,a.y-b.y)<46){used[j]=1;g.push(b);} }); cl.push(g); });
    const fences=[],pins=[];
    cl.forEach(g=>{
      if(g.length>1){const cx=g.reduce((t,a)=>t+a.x,0)/g.length,cy=g.reduce((t,a)=>t+a.y,0)/g.length,wx=g.reduce((t,a)=>t+a.s.x,0)/g.length,wy=g.reduce((t,a)=>t+a.s.y,0)/g.length;
        pins.push({x:cx.toFixed(1),y:cy.toFixed(1),rr:17,ring:0,selOp:0,col:'var(--accent)',txt:g.length,ty:(cy+4.5).toFixed(1),fs:13,go:ev=>{ev.stopPropagation();this.setState({cx:wx,cy:wy,zi:Math.min(5,s.zi+1),sel:null});}});}
      else{const a=g[0],x=a.s,c=col(x),on=x.id===s.sel,rpx=Math.max(5,x.r/100*sc);
        let f={circle:x.gt==='circle',poly:x.gt!=='circle',x:a.x.toFixed(1),y:a.y.toFixed(1),r:rpx.toFixed(1),col:c,fill:'var(--fence)',dash:x.active?'0':'5 4',pts:''};
        if(x.gt!=='circle'){const n=hash(x.id),k=[1,.82,1.1,.9,1.05,.85];f.pts=k.map((m,i)=>{const t=i/6*Math.PI*2+(n%7)*.1;return (a.x+Math.cos(t)*rpx*m*1.1).toFixed(1)+','+(a.y+Math.sin(t)*rpx*m*1.1).toFixed(1);}).join(' ');}
        if(rpx>9) fences.push(f);
        pins.push({x:a.x.toFixed(1),y:a.y.toFixed(1),rr:on?9:7,ring:on?15:0,selOp:on?.5:0,col:c,txt:'',ty:0,fs:0,go:ev=>{ev.stopPropagation();this.setState({sel:x.id});}});}
    });
    const cities=[['PARIS',520,170],['LYON',560,435],['MARSEILLE',580,660],['BORDEAUX',330,540],['LILLE',540,52]].map(([n,wx,wy])=>({n,x:(W/2+(wx-s.cx)*sc+18).toFixed(0),y:(H/2+(wy-s.cy)*sc-14).toFixed(0),op:s.zi<=2?0.9:0}));
    const today=x=>x.active?x.pres+'/'+x.exp:'—';
    const pv=sel&&{name:sel.name,branch:sel.br,addr:sel.addr,fence:fenceL(sel),today:today(sel),mgr:sel.mgr,stL:sel.active?'Active':'Inactive',stC:sel.active?'var(--ok)':'var(--text-3)',view:()=>this.setState({det:sel.id}),edit:()=>this.openEdit(sel),qr:()=>this.openQr(sel)};
    const side=list.map(x=>({name:x.name,branch:x.br,fence:fenceL(x),today:today(x),col:col(x),bg:x.id===s.sel?'var(--accent-soft)':'transparent',go:()=>this.focus(x)}));
    const rows=list.map((x,i)=>{const open=s.menu===x.id,acts=[{l:'View',c:'var(--text)',go:()=>this.setState({menu:null,det:x.id})},{l:'Edit',c:'var(--text)',go:()=>this.openEdit(x)},{l:'Print QR code',c:'var(--text)',go:()=>this.openQr(x)},x.active?{l:'Deactivate',c:'var(--bad)',go:()=>this.setState({menu:null,dx:x.id})}:{l:'Reactivate',c:'var(--ok)',go:()=>{this.setState(st=>({menu:null,sites:st.sites.map(y=>y.id===x.id?Object.assign({},y,{active:true}):y)}));this.say(x.name+' reactivated');}}];
      return {name:x.name,branch:x.br,addr:x.addr,fence:fenceL(x),mgr:x.mgr,emp:x.emp,today:today(x),pw:(x.exp?Math.round(x.pres/x.exp*100):0)+'%',col:col(x),sBg:x.selfie?'var(--ok-bg)':'var(--neutral-bg)',sFg:x.selfie?'var(--ok)':'var(--neutral-dot)',qBg:x.qr?'var(--ok-bg)':'var(--neutral-bg)',qFg:x.qr?'var(--ok)':'var(--neutral-dot)',stL:x.active?'Active':'Inactive',stBg:x.active?'var(--ok-bg)':'var(--neutral-bg)',stFg:x.active?'var(--ok)':'var(--neutral)',op:x.active?1:.65,
        view:ev=>{ev.preventDefault();this.setState({det:x.id});},menu:ev=>{ev.stopPropagation();this.setState({menu:open?null:x.id});},mbg:open?'var(--hover)':'transparent',menuOpen:open,mtop:i>=list.length-2&&list.length>3?'-130px':'46px',acts};});
    const m=s.m,me=m&&m.tried?this.mval():{};
    let mm={};
    if(m){const la=parseFloat(m.lat),lo=parseFloat(m.lng),ok=!isNaN(la)&&!isNaN(lo)&&m.lat!==''&&m.lng!=='',w=ok?this.g2w(la,lo):null,msc=0.4*Z[m.mz];
      const sp=(x,y)=>({x:200+(x-m.mcx)*msc,y:130+(y-m.mcy)*msc});
      const pp=w?sp(w.x,w.y):{x:0,y:0};
      mm={world:'translate('+(200-m.mcx*msc).toFixed(1)+' '+(130-m.mcy*msc).toFixed(1)+') scale('+msc.toFixed(3)+')',others:s.sites.filter(y=>y.id!==m.id).map(y=>sp(y.x,y.y)).filter(p=>p.x>0&&p.x<400&&p.y>0&&p.y<260).map(p=>({x:p.x.toFixed(1),y:p.y.toFixed(1)})),hasPin:ok,noPin:!ok,px:pp.x.toFixed(1),py:pp.y.toFixed(1),pr:Math.max(8,(+m.r||0)/100*msc).toFixed(1),lat:m.lat,lng:m.lng,locE:me.loc||'',locBd:me.loc?'var(--bad-dot)':'var(--border-strong)',
        mapClick:ev=>{const b=ev.currentTarget.getBoundingClientRect(),px=(ev.clientX-b.left)/b.width*400,py=(ev.clientY-b.top)/b.height*260;this.setLoc(m.mcx+(px-200)/msc,m.mcy+(py-130)/msc);},
        onLat:ev=>{const v=ev.target.value;this.setState(x=>({m:Object.assign({},x.m,{lat:v})}));const n=parseFloat(v),o=parseFloat(m.lng);if(!isNaN(n)&&!isNaN(o)){const q=this.g2w(n,o);this.setState(x=>({m:Object.assign({},x.m,{mcx:q.x,mcy:q.y})}));}},
        onLng:ev=>{const v=ev.target.value;this.setState(x=>({m:Object.assign({},x.m,{lng:v})}));const n=parseFloat(m.lat),o=parseFloat(v);if(!isNaN(n)&&!isNaN(o)){const q=this.g2w(n,o);this.setState(x=>({m:Object.assign({},x.m,{mcx:q.x,mcy:q.y})}));}},
        zIn:()=>this.setState(x=>({m:Object.assign({},x.m,{mz:Math.min(5,x.m.mz+1)})})),zOut:()=>this.setState(x=>({m:Object.assign({},x.m,{mz:Math.max(0,x.m.mz-1)})})),
        find:()=>{ if(!m.addr.trim()){this.say('Type an address first');return;} const h=hash(m.addr),b=s.sites.find(y=>y.br===m.br)||{x:500,y:300},x=b.x+((h%60)-30),y=b.y+(((h>>4)%60)-30);this.setLoc(x,y);this.setState(st=>({m:Object.assign({},st.m,{mz:3})}));this.say('Address found — drag the pin by clicking to fine-tune'); }};}
    const sm=k=>ev=>{const v=ev.target.value;this.setState(x=>({m:Object.assign({},x.m,{[k]:v})}));};
    const tg=k=>()=>this.setState(x=>({m:Object.assign({},x.m,{[k]:!x.m[k]})}));
    const mv=m&&Object.assign({},mm,{title:m.id?'Edit site':'Add site',name:m.name,addr:m.addr,br:m.br,mgr:m.mgr,r:m.r,onName:sm('name'),onAddr:sm('addr'),onBr:sm('br'),onMgr:sm('mgr'),onR:sm('r'),nameE:me.name||'',addrE:me.addr||'',rE:me.r||'',nameBd:me.name?'var(--bad-dot)':'var(--border-strong)',addrBd:me.addr?'var(--bad-dot)':'var(--border-strong)',rBd:me.r?'var(--bad-dot)':'var(--border-strong)',saveL:m.id?'Save changes':'Create site',
      gts:[['circle','Circle'],['poly','Polygon']].map(([k,l])=>({l,bg:m.gt===k?'var(--accent)':'var(--surface)',fg:m.gt===k?'#fff':'var(--text-2)',go:()=>this.setState(x=>({m:Object.assign({},x.m,{gt:k})}))})),
      opts:[['selfie','Require selfie'],['qr','QR check-in']].map(([k,l])=>({l,bg:m[k]?'var(--accent)':'var(--border-strong)',left:m[k]?'19px':'2px',go:tg(k)}))});
    let qrM=null;
    if(s.qrM){const x=s.sites.find(y=>y.id===s.qrM),cells=[];let r=hash(x.id+x.name)||1;const rnd=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;r>>>=0;return r;};
      for(let yy=0;yy<21;yy++)for(let xx=0;xx<21;xx++){const f=xx<7&&yy<7||xx>13&&yy<7||xx<7&&yy>13;if(f){const ox=xx>13?xx-14:xx,oy=yy>13?yy-14:yy;if(ox===0||ox===6||oy===0||oy===6||(ox>=2&&ox<=4&&oy>=2&&oy<=4))cells.push({x:xx,y:yy});}else if(!(xx===7||yy===7||(xx===13&&yy<8)||(yy===13&&xx<8))&&rnd()%2)cells.push({x:xx,y:yy});}
      qrM={name:x.name,cells};}
    const dxs=s.dx&&s.sites.find(y=>y.id===s.dx);
    return {
      views:[['map','Map'],['list','List']].map(([k,l])=>({l,bg:s.view===k?'var(--accent)':'var(--surface)',fg:s.view===k?'#fff':'var(--text-2)',go:()=>this.setState({view:k,menu:null})})),isMap:s.view==='map',isList:s.view==='list',
      q:s.q,onQ:set('q'),closeMenu:()=>{if(s.menu)this.setState({menu:null});},stop:ev=>ev.stopPropagation(),
      filters:[{val:s.br,on:set('br'),opts:[{v:'all',l:'All branches'}].concat(BR.map(b=>({v:b,l:b})))},{val:s.mgr,on:set('mgr'),opts:[{v:'all',l:'All managers'}].concat(mgrs.map(b=>({v:b,l:b})))},{val:s.stt,on:set('stt'),opts:[{v:'all',l:'Any status'},{v:'active',l:'Active'},{v:'inactive',l:'Inactive'}]}],
      hasFilter:s.br!=='all'||s.mgr!=='all'||s.stt!=='all'||!!s.q,clearF:()=>this.setState({br:'all',mgr:'all',stt:'all',q:''}),
      add:()=>this.setState({ed:{id:null}}),edOpen:!!s.ed,listDisp:s.ed||s.det?'none':'flex',detOpen:!!s.det&&!s.ed,detSite:s.det?s.sites.find(y=>y.id===s.det):null,detBack:()=>this.setState({det:null}),detEdit:()=>this.setState({ed:{id:s.det}}),detQr:()=>this.setState({qrM:s.det}),edSite:s.ed&&s.ed.id?s.sites.find(y=>y.id===s.ed.id):null,edSites:s.sites,edCancel:()=>this.setState({ed:null,det:s.det}),
      edSave:d=>{const f={name:d.name,code:d.code,br:d.br,addr:d.addr,tz:d.tz,mgrs:d.mgrs,mgr:d.mgrs[0]||'—',gt:d.gt,r:d.r,x:d.x,y:d.y,selfie:d.selfie,qr:d.qr,active:d.active};if(d.id)this.setState(st=>({sites:st.sites.map(y=>y.id===d.id?Object.assign({},y,f):y),ed:null}));else{const id='n'+Date.now();this.setState(st=>({sites:st.sites.concat(Object.assign({id,emp:d.emp,exp:0,pres:0},f)),ed:null,sel:id,cx:d.x,cy:d.y,zi:4}));}this.say(d.id?'Site updated':d.name+' created');},
      world:'translate('+(W/2-s.cx*sc).toFixed(1)+' '+(H/2-s.cy*sc).toFixed(1)+') scale('+sc.toFixed(3)+')',cities,fences,pins,
      zIn:()=>this.setState({zi:Math.min(5,s.zi+1)}),zOut:()=>this.setState({zi:Math.max(0,s.zi-1)}),fit:()=>this.setState({cx:550,cy:300,zi:0,sel:null}),bgClick:()=>{if(s.sel)this.setState({sel:null});},
      hasPrev:!!pv,pv,closePrev:()=>this.setState({sel:null}),countL:list.length+' site'+(list.length===1?'':'s')+(s.zi===0&&cl.some(g=>g.length>1)?' · zoom in to split clusters':''),side,empty:list.length===0,rows,
      m:mv||null,brOpts:BR.map(b=>({v:b,l:b})),mgrPick:MG.map(b=>({v:b,l:b})),mClose:()=>this.setState({m:null}),
      mSave:()=>{ if(Object.keys(this.mval()).length){this.setState({m:Object.assign({},m,{tried:true})});return;}
        const w=this.g2w(parseFloat(m.lat),parseFloat(m.lng)),f={name:m.name.trim(),addr:m.addr.trim(),br:m.br,mgr:m.mgr,gt:m.gt,r:+m.r,selfie:m.selfie,qr:m.qr,x:w.x,y:w.y};
        if(m.id) this.setState(st=>({sites:st.sites.map(y=>y.id===m.id?Object.assign({},y,f):y),m:null}));
        else {const id='n'+Date.now();this.setState(st=>({sites:st.sites.concat(Object.assign({id,emp:0,exp:0,pres:0,active:true},f)),m:null,sel:id,cx:w.x,cy:w.y}));}
        this.say(m.id?'Site updated':f.name+' added'); },
      qrM,qrClose:()=>this.setState({qrM:null}),qrPrint:()=>this.say('Sent to the printer'),
      dx:dxs?{name:dxs.name,msg:dxs.emp?dxs.emp+' assigned employees will no longer be able to check in here. History is kept.':'No employees are assigned. History is kept.'}:null,dxNo:()=>this.setState({dx:null}),
      dxYes:()=>{const n=dxs.name,id=dxs.id;this.setState(st=>({dx:null,sites:st.sites.map(y=>y.id===id?Object.assign({},y,{active:false}):y)}));this.say(n+' deactivated');},
      toast:s.toast
    };
  }
  openEdit(x){ this.setState({menu:null,ed:{id:x.id}}); }
  openEditOld(x){ const g=this.w2g(x.x,x.y); this.setState({menu:null,m:{id:x.id,name:x.name,addr:x.addr,br:x.br,mgr:x.mgr,gt:x.gt,r:x.r,selfie:x.selfie,qr:x.qr,tried:false,lat:g.lat,lng:g.lng,mcx:x.x,mcy:x.y,mz:3}}); }
  openQr(x){ this.setState({menu:null,qrM:x.id}); }
}

class AdminSitesView extends AdminSitesBase {
  view(S) {
    const tr = this.props.tr;
    const { st } = S;
    return (
<>
<div onClick={st?.closeMenu} className="flex flex-col gap-[14px] relative">
{st?.edOpen ? (<>
<AdminSiteEditor emp={st?.edSite} sites={st?.edSites} onSave={st?.edSave} onCancel={st?.edCancel} />
</>) : null}
{st?.detOpen ? (<>
<AdminSiteDetail site={st?.detSite} onBack={st?.detBack} onEdit={st?.detEdit} onQr={st?.detQr} />
</>) : null}
<div className="flex-col gap-[14px]" style={{display:st?.listDisp}}>
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(st?.views ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_14px] border-0 text-[13px] font-medium cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
<div className="flex items-center gap-[8px] h-[34px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3 flex-[1_1_200px] max-w-[280px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={st?.q} onInput={st?.onQ} placeholder={tr("search_site_or_address")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%]" />
</div>
{(st?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
{st?.hasFilter ? (<>
<button onClick={st?.clearF} className="h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("clear")}
</button>
</>) : null}
<div className="flex-1" />
<button onClick={st?.add} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("add_site")}
</button>
</div>
{st?.isMap ? (<>
<div className="flex gap-[16px] items-stretch flex-wrap">
<div className="flex-[1_1_520px] min-w-[0] relative border border-solid border-border rounded-[12px] shadow-card overflow-hidden bg-map-bg">
<svg viewBox="0 0 760 500" width="100%" onClick={st?.bgClick} className="block">
<rect width="760" height="500" fill="var(--map-bg)" />
<g transform={st?.world}>
<path d="M-200 700 Q 250 640 330 720 L 330 900 L -200 900Z" fill="var(--map-water)" />
<path d="M440 680 Q 580 690 700 665 L 900 665 L900 900 L440 900Z" fill="var(--map-water)" />
<path d="M-100 160 L 1100 150 M -100 430 L 1100 410 M 520 -200 L 560 900 M 330 -200 L 390 900 M 740 -200 L 700 900 M 300 560 L 800 520" stroke="var(--map-road)" strokeWidth="5" fill="none" vectorEffect="non-scaling-stroke" />
<path d="M-100 290 L 1100 300 M 450 -200 L 470 900" stroke="var(--map-road)" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke" />
</g>
{(st?.cities ?? []).map((c, $index) => (<Fragment key={$index}>
<text x={c?.x} y={c?.y} fontSize="12" fill="var(--text-3)" fontWeight="600" letterSpacing=".08em" opacity={c?.op}>
{c?.n}
</text>
</Fragment>))}
{(st?.fences ?? []).map((g, $index) => (<Fragment key={$index}>
<g>
{g?.circle ? (<>
<circle cx={g?.x} cy={g?.y} r={g?.r} fill={g?.fill} stroke={g?.col} strokeWidth="1.6" strokeDasharray={g?.dash} />
</>) : null}
{g?.poly ? (<>
<polygon points={g?.pts} fill={g?.fill} stroke={g?.col} strokeWidth="1.6" strokeDasharray={g?.dash} />
</>) : null}
</g>
</Fragment>))}
{(st?.pins ?? []).map((p, $index) => (<Fragment key={$index}>
<g onClick={p?.go} className="cursor-pointer">
<circle cx={p?.x} cy={p?.y} r={p?.rr} fill={p?.col} stroke="#fff" strokeWidth="2.5" />
<circle cx={p?.x} cy={p?.y} r={p?.ring} fill="none" stroke={p?.col} strokeWidth="1.5" opacity={p?.selOp} />
<text x={p?.x} y={p?.ty} textAnchor="middle" fontSize={p?.fs} fontWeight="700" fill="#fff" className="pointer-events-none">
{p?.txt}
</text>
</g>
</Fragment>))}
</svg>
<div className="absolute top-[12px] right-[12px] flex flex-col gap-[6px]">
<button onClick={st?.zIn} aria-label={tr("zoom_in")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[18px] cursor-pointer">
{"+"}
</button>
<button onClick={st?.zOut} aria-label={tr("zoom_out")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[18px] cursor-pointer">
{"−"}
</button>
<button onClick={st?.fit} aria-label={tr("fit_all_sites")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-2 text-[11px] font-semibold cursor-pointer">
{tr("fit")}
</button>
</div>
<div className="absolute left-[12px] bottom-[12px] flex gap-[12px] p-[6px_10px] rounded-[9px] bg-surface border border-solid border-border text-[12px] text-text-2">
<span className="flex items-center gap-[6px]">
<span className="w-[9px] h-[9px] rounded-[50%] bg-ok-dot" />
{tr("on_track")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[9px] h-[9px] rounded-[50%] bg-warn-dot" />
{tr("behind")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[9px] h-[9px] rounded-[50%] bg-neutral-dot" />
{tr("inactive")}
</span>
</div>
{st?.hasPrev ? (<>
<div onClick={st?.stop} className="absolute left-[12px] top-[12px] w-[min(300px,calc(100%_-_70px))] bg-surface border border-solid border-border rounded-[12px] shadow-pop p-[14px] flex flex-col gap-[10px]">
<div className="flex justify-between gap-[8px]">
<div>
<div className="font-semibold text-[15px]">
{st?.pv?.name}
</div>
<div className="text-[12.5px] text-text-3">
{st?.pv?.branch}{" · "}{st?.pv?.addr}
</div>
</div>
<button onClick={st?.closePrev} aria-label={tr("close")} className="w-[26px] h-[26px] border-0 rounded-[7px] bg-transparent text-text-2 text-[18px] cursor-pointer flex-none">
{"×"}
</button>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[8px] text-[12.5px]">
<div>
<div className="text-text-3">
{tr("geofence")}
</div>
<div className="font-medium">
{st?.pv?.fence}
</div>
</div>
<div>
<div className="text-text-3">
{tr("present_today")}
</div>
<div className="font-medium">
{st?.pv?.today}
</div>
</div>
<div>
<div className="text-text-3">
{tr("manager")}
</div>
<div className="font-medium">
{st?.pv?.mgr}
</div>
</div>
<div>
<div className="text-text-3">
{tr("status")}
</div>
<div className="font-medium" style={{color:st?.pv?.stC}}>
{st?.pv?.stL}
</div>
</div>
</div>
<div className="flex gap-[6px]">
<button onClick={st?.pv?.view} className="flex-1 h-[32px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[12.5px] font-medium cursor-pointer">
{tr("view")}
</button>
<button onClick={st?.pv?.edit} className="flex-1 h-[32px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("edit")}
</button>
<button onClick={st?.pv?.qr} className="flex-1 h-[32px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("print_qr")}
</button>
</div>
</div>
</>) : null}
</div>
<div className="flex-[0_0_300px] w-[300px] max-w-[100%] max-h-[520px] overflow-y-auto bg-surface border border-solid border-border rounded-[12px] shadow-card">
<div className="p-[12px_14px] border-b border-solid border-b-border text-[12.5px] text-text-3 sticky top-[0] bg-surface">
{st?.countL}
</div>
{(st?.side ?? []).map((s, $index) => (<Fragment key={$index}>
<div onClick={s?.go} className="flex items-center gap-[10px] p-[11px_14px] border-b border-solid border-b-border cursor-pointer hover:bg-hover" style={{background:s?.bg}}>
<span className="w-[9px] h-[9px] rounded-[50%] flex-none" style={{background:s?.col}} />
<div className="flex-1 min-w-[0]">
<div className="text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{s?.name}
</div>
<div className="text-[12px] text-text-3">
{s?.branch}{" · "}{s?.fence}
</div>
</div>
<span className="[font:12px_'Geist_Mono',monospace] text-text-2">
{s?.today}
</span>
</div>
</Fragment>))}
{st?.empty ? (<>
<div className="p-[32px_16px] text-center text-text-3 text-[13px]">
{tr("no_sites_match_the_filters")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{st?.isList ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[1180px]">
<div className="grid grid-cols-[minmax(180px,1.4fr)_100px_minmax(170px,1.3fr)_120px_minmax(130px,1fr)_80px_110px_90px_90px_36px] gap-[12px] items-center p-[0_14px] h-[38px] border-b border-solid border-b-border bg-surface-2 text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div>
{tr("site")}
</div>
<div>
{tr("branch")}
</div>
<div>
{tr("address")}
</div>
<div>
{tr("geofence")}
</div>
<div>
{tr("manager")}
</div>
<div>
{tr("staff")}
</div>
<div>
{tr("present")}
</div>
<div>
{tr("verify")}
</div>
<div>
{tr("status")}
</div>
<div />
</div>
{(st?.rows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[minmax(180px,1.4fr)_100px_minmax(170px,1.3fr)_120px_minmax(130px,1fr)_80px_110px_90px_90px_36px] gap-[12px] items-center p-[11px_14px] border-b border-solid border-b-border text-[13px] relative hover:bg-hover" style={{opacity:r?.op}}>
<a href="#" onClick={r?.view} className="font-medium text-text">
{r?.name}
</a>
<div className="text-text-2">
{r?.branch}
</div>
<div className="text-text-2 text-[12.5px]">
{r?.addr}
</div>
<div className="text-text-2">
{r?.fence}
</div>
<div className="text-text-2">
{r?.mgr}
</div>
<div className="text-text-2">
{r?.emp}
</div>
<div className="flex items-center gap-[8px]">
<span className="[font:12.5px_'Geist_Mono',monospace] text-text-2">
{r?.today}
</span>
<div className="w-[34px] h-[5px] rounded-[3px] bg-neutral-bg overflow-hidden">
<div className="h-[100%]" style={{width:r?.pw,background:r?.col}} />
</div>
</div>
<div className="flex gap-[6px]">
<span title={tr("selfie")} className="w-[26px] h-[26px] rounded-[7px] grid place-items-center" style={{background:r?.sBg,color:r?.sFg}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M4 8h3l2-3h6l2 3h3v11H4z" />
<circle cx="12" cy="13" r="3.5" />
</svg>
</span>
<span title={tr("qr")} className="w-[26px] h-[26px] rounded-[7px] grid place-items-center" style={{background:r?.qBg,color:r?.qFg}}>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
<rect x="4" y="4" width="6" height="6" />
<rect x="14" y="4" width="6" height="6" />
<rect x="4" y="14" width="6" height="6" />
<path d="M14 14h3v3h-3zM19 19h1" />
</svg>
</span>
</div>
<div>
<span className="p-[3px_8px] rounded-[6px] text-[12px] font-medium" style={{background:r?.stBg,color:r?.stFg}}>
{r?.stL}
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
<div onClick={st?.stop} className="absolute right-[14px] z-[20] w-[190px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop" style={{top:r?.mtop}}>
{(r?.acts ?? []).map((a, $index) => (<Fragment key={$index}>
<button onClick={a?.go} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-[13px] cursor-pointer hover:bg-hover" style={{color:a?.c}}>
{a?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
</Fragment>))}
{st?.empty ? (<>
<div className="p-[48px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_sites_match_the_filters")}
</div>
</>) : null}
</div>
</div>
</>) : null}
</div>
{st?.m ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[560px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div className="font-semibold text-[16px]">
{st?.m?.title}
</div>
<button onClick={st?.mClose} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[20px] overflow-y-auto flex flex-col gap-[14px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("site_name")}
<input value={st?.m?.name} onInput={st?.m?.onName} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${st?.m?.nameBd}`}} />
<span className="text-[12px] text-bad font-normal">
{st?.m?.nameE}
</span>
</label>
<div className="grid grid-cols-[1fr_1fr] gap-[14px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("branch")}
<select value={st?.m?.br} onChange={st?.m?.onBr} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(st?.brOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("manager")}
<select value={st?.m?.mgr} onChange={st?.m?.onMgr} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(st?.mgrPick ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("address_2")}
<input value={st?.m?.addr} onInput={st?.m?.onAddr} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${st?.m?.addrBd}`}} />
<span className="text-[12px] text-bad font-normal">
{st?.m?.addrE}
</span>
</label>
<div className="flex flex-col gap-[8px]">
<div className="flex items-center justify-between gap-[8px] flex-wrap">
<div className="text-[12.5px] font-medium text-text-2">
{tr("location")}
</div>
<button onClick={st?.m?.find} className="h-[28px] p-[0_10px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px] cursor-pointer">
{tr("find_address_on_map")}
</button>
</div>
<div className="relative rounded-[10px] overflow-hidden bg-map-bg" style={{border:`1px solid ${st?.m?.locBd}`}}>
<svg viewBox="0 0 400 260" width="100%" onClick={st?.m?.mapClick} className="block [cursor:crosshair]">
<rect width="400" height="260" fill="var(--map-bg)" />
<g transform={st?.m?.world}>
<path d="M-200 700 Q 250 640 330 720 L 330 900 L -200 900Z" fill="var(--map-water)" />
<path d="M440 680 Q 580 690 700 665 L 900 665 L900 900 L440 900Z" fill="var(--map-water)" />
<path d="M-100 160 L 1100 150 M -100 430 L 1100 410 M 520 -200 L 560 900 M 330 -200 L 390 900 M 740 -200 L 700 900 M 300 560 L 800 520" stroke="var(--map-road)" strokeWidth="5" fill="none" vectorEffect="non-scaling-stroke" />
</g>
{(st?.m?.others ?? []).map((o, $index) => (<Fragment key={$index}>
<circle cx={o?.x} cy={o?.y} r="4" fill="var(--neutral-dot)" stroke="#fff" strokeWidth="1.5" />
</Fragment>))}
{st?.m?.hasPin ? (<>
<circle cx={st?.m?.px} cy={st?.m?.py} r={st?.m?.pr} fill="var(--fence)" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 4" />
<circle cx={st?.m?.px} cy={st?.m?.py} r="8" fill="var(--accent)" stroke="#fff" strokeWidth="2.5" />
</>) : null}
</svg>
<div className="absolute top-[8px] right-[8px] flex flex-col gap-[4px]">
<button onClick={st?.m?.zIn} aria-label={tr("zoom_in")} className="w-[28px] h-[28px] rounded-[7px] border border-solid border-border-strong bg-surface text-text text-[16px] cursor-pointer">
{"+"}
</button>
<button onClick={st?.m?.zOut} aria-label={tr("zoom_out")} className="w-[28px] h-[28px] rounded-[7px] border border-solid border-border-strong bg-surface text-text text-[16px] cursor-pointer">
{"−"}
</button>
</div>
{st?.m?.noPin ? (<>
<div className="absolute left-[8px] bottom-[8px] p-[5px_9px] rounded-[8px] bg-surface border border-solid border-border text-[12px] text-text-2">
{tr("click_the_map_to_drop")}
</div>
</>) : null}
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("latitude")}
<input value={st?.m?.lat} onInput={st?.m?.onLat} placeholder="45.7600" inputMode="decimal" className="h-[34px] p-[0_10px] rounded-[9px] bg-surface text-text [font:13px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${st?.m?.locBd}`}} />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("longitude")}
<input value={st?.m?.lng} onInput={st?.m?.onLng} placeholder="4.8500" inputMode="decimal" className="h-[34px] p-[0_10px] rounded-[9px] bg-surface text-text [font:13px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${st?.m?.locBd}`}} />
</label>
</div>
<span className="text-[12px] text-bad">
{st?.m?.locE}
</span>
</div>
<div className="flex gap-[14px] items-end flex-wrap">
<div className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("geofence")}
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(st?.m?.gts ?? []).map((g, $index) => (<Fragment key={$index}>
<button onClick={g?.go} className="h-[34px] p-[0_13px] border-0 text-[13px] cursor-pointer" style={{background:g?.bg,color:g?.fg}}>
{g?.l}
</button>
</Fragment>))}
</div>
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("radius_size_m")}
<input type="number" min="50" step="10" value={st?.m?.r} onInput={st?.m?.onR} className="h-[34px] w-[130px] p-[0_10px] rounded-[9px] bg-surface text-text [font:13.5px_'Geist_Mono',monospace] [outline:none]" style={{border:`1px solid ${st?.m?.rBd}`}} />
</label>
<span className="text-[12px] text-bad">
{st?.m?.rE}
</span>
</div>
<div className="flex gap-[18px] flex-wrap">
{(st?.m?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<div className="flex items-center gap-[10px] text-[13px]">
<div onClick={o?.go} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer" style={{background:o?.bg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:o?.left}} />
</div>
{o?.l}
</div>
</Fragment>))}
</div>
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex justify-end gap-[8px]">
<button onClick={st?.mClose} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={st?.mSave} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{st?.m?.saveL}
</button>
</div>
</div>
</div>
</>) : null}
{st?.qrM ? (<>
<div onClick={st?.qrClose} className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div onClick={st?.stop} className="w-[100%] max-w-[380px] bg-surface rounded-[14px] shadow-pop p-[22px] flex flex-col items-center gap-[12px] text-center">
<div className="font-semibold text-[16px]">
{st?.qrM?.name}
</div>
<div className="w-[200px] h-[200px] border border-solid border-border rounded-[12px] p-[12px] bg-[color:#fff]">
<svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
{(st?.qrM?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<rect x={c?.x} y={c?.y} width="1" height="1" fill="#0D1B2E" />
</Fragment>))}
</svg>
</div>
<div className="text-[12.5px] text-text-3">
{tr("post_this_at_the_site")}
</div>
<div className="flex gap-[8px] w-[100%]">
<button onClick={st?.qrClose} className="flex-1 h-[36px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("close")}
</button>
<button onClick={st?.qrPrint} className="flex-1 h-[36px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("print")}
</button>
</div>
</div>
</div>
</>) : null}
{st?.dx ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[420px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[12px]">
<div className="font-semibold text-[16px]">
{tr("deactivate_p0",{p0:st?.dx?.name ?? ''})}
</div>
<div className="text-[13.5px] text-text-2">
{st?.dx?.msg}
</div>
<div className="flex gap-[8px] justify-end">
<button onClick={st?.dxNo} className="h-[34px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={st?.dxYes} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-bad-dot text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("deactivate")}
</button>
</div>
</div>
</div>
</>) : null}
{st?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{st?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminSites(props: any) {
  const tr = useTranslations('AdminSites');
  return <AdminSitesView {...props} tr={tr} />;
}
