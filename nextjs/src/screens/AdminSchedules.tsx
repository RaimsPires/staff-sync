'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';
import AdminScheduleModal from './AdminScheduleModal';

const B0=Date.UTC(2026,9,12),DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const EM=[['Amélie Fontaine','Machinist','sd'],['Karim Benali','Forklift operator','rl'],['Léa Moreau','Cleaner','pd'],['Thomas Girard','Technician','cf'],['Inès Haddad','Electrician','pv'],['Paul Lambert','Driver','sd'],['Sofia Rossi','Loader','rl'],['Hugo Petit','Welder','sd'],['Nora Diallo','Inspector','cf'],['Elena Marchand','Cleaner','cf']];
const EMP={};EM.forEach(e=>EMP[e[0]]={role:e[1],site:e[2],br:SN[e[2]][1]});
const HOL={20:'All Saints',30:'Armistice Day'};
const LEAVE={'Karim Benali':[15,16],'Léa Moreau':[14],'Hugo Petit':[17,18],'Nora Diallo':[22,23],'Sofia Rossi':[8]};
const PX=56,H0=360,H1=1260,TW=(H1-H0)/60*PX;
const ICO={rec:'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',int:'M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z'};
const dt=d=>new Date(B0+d*864e5);
const iso=d=>dt(d).toISOString().slice(0,10),fromIso=s=>{const[y,m,dd]=s.split('-').map(Number);return Math.round((Date.UTC(y,m-1,dd)-B0)/864e5);};
const pad=n=>String(n).padStart(2,'0'),fm=m=>pad(Math.floor(m/60))+':'+pad(m%60),tm=s=>{const a=s.split(':').map(Number);return a[0]*60+a[1];};
const wd=d=>((d%7)+7)%7;
const mkShifts=()=>{let n=0;const out=[];const add=(d,emp,site,s,e,type,title)=>out.push({id:'s'+(n++),d,emp,site,s,e,type,title:title||''});
  EM.forEach((em,i)=>{const days=i%3===2?[0,1,3]:[0,1,2,3,4],hrs=i%4===1?[600,1080]:i%4===3?[360,840]:[480,960];
    for(let d=-14;d<=34;d++){if(!days.includes(wd(d))||HOL[d])continue;if((LEAVE[em[0]]||[]).includes(d)&&d!==16)continue;add(d,em[0],em[2],hrs[0],hrs[1],'rec');}});
  [[15,'Amélie Fontaine','sd',1020,1200,'Night prep'],[16,'Thomas Girard','cf',780,1020,'Chiller repair'],[17,'Inès Haddad','pv',1020,1140,'Evening crane check'],[9,'Paul Lambert','sd',1020,1140,'Fleet check'],[21,'Hugo Petit','sd',1020,1140,'Press maintenance']].forEach(a=>add(...a.slice(0,6).slice(0,5).concat(['int',a[5]])));
  return out;};
const INTS=[{id:'u1',title:'Boiler failure',site:'pd',d:14,s:840,e:1080},{id:'u2',title:'Evening patrol',site:'sd',d:15,s:1080,e:1380},{id:'u3',title:'Dock inspection',site:'pv',d:17,s:540,e:660},{id:'u4',title:'Fire-door audit',site:'cf',d:16,s:600,e:720},{id:'u5',title:'Cargo scan',site:'rl',d:18,s:420,e:600}];
class AdminSchedulesBase extends DCLogic {
  state=(()=>{const sh=mkShifts(),dirty={};sh.filter(x=>x.type==='int'&&x.d>=14).forEach(x=>dirty[x.id]=1);return {mod:false,view:'week',group:'emp',anchor:14,br:'all',site:'all',emp:'all',type:'all',shifts:sh,ints:INTS,dirty,delN:0,drop:null,f:null,pub:null,toast:null,nid:1000};})();
  componentDidMount(){
    this._mm=ev=>{const r=this._rs;if(!r)return;const sh=this.state.shifts.find(x=>x.id===r.id);if(!sh)return;
      const step=r.mode==='week'?Math.round((ev.clientY-r.y)/10)*15:Math.round(((ev.clientX-r.x)/PX*60)/15)*15;const e=Math.max(sh.s+15,Math.min(1439,r.e0+step));
      if(e!==sh.e){this._rsc=true;this.setState(s=>({shifts:s.shifts.map(x=>x.id===r.id?Object.assign({},x,{e}):x)}));}};
    this._mu=()=>{if(this._rs){if(this._rsc)this.dirt(this._rs.id);this._rs=null;this._rsc=false;this._noClick=true;setTimeout(()=>{this._noClick=false;},50);}};
    window.addEventListener('mousemove',this._mm);window.addEventListener('mouseup',this._mu);
  }
  componentWillUnmount(){window.removeEventListener('mousemove',this._mm);window.removeEventListener('mouseup',this._mu);clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  dirt(id){this.setState(s=>({dirty:Object.assign({},s.dirty,{[id]:1})}));}
  conf(shifts){const c={},by={};shifts.forEach(x=>{if(x.emp)(by[x.emp+'|'+x.d]=by[x.emp+'|'+x.d]||[]).push(x);});
    shifts.forEach(x=>{if(!x.emp)return;if((LEAVE[x.emp]||[]).includes(x.d)){c[x.id]=x.emp.split(' ')[0]+' is on approved leave this day.';return;}
      const o=by[x.emp+'|'+x.d].find(y=>y.id!==x.id&&x.s<y.e&&y.s<x.e);if(o)c[x.id]='Double-booked: overlaps '+SN[o.site][0]+' '+fm(o.s)+'–'+fm(o.e)+'.';});return c;}
  vis(x){const s=this.state;return(s.site==='all'||x.site===s.site)&&(s.type==='all'||x.type===s.type)&&(s.emp==='all'||x.emp===s.emp)&&(s.br==='all'||SN[x.site][1]===s.br);}
  newId(){const n=this.state.nid;this.setState({nid:n+1});return 'n'+n;}
  openNew(d,emp,site,s0){const e0=emp&&EMP[emp]?emp:'';this.setState({f:{id:null,type:'rec',ttl:'',emp:e0,site:site||(e0?EMP[e0].site:Object.keys(SN)[0]),date:iso(d),s:fm(s0==null?480:s0),e:fm((s0==null?480:s0)+480>1439?1439:(s0==null?480:s0)+480),tried:false}});}
  openEdit(x){if(this._noClick)return;this.setState({f:{id:x.id,type:x.type,ttl:x.title,emp:x.emp||'',site:x.site,date:iso(x.d),s:fm(x.s),e:fm(x.e),tried:false}});}
  doDrop(ev,g,d,minute){ev.preventDefault();const dr=this._drag;this._drag=null;this.setState({drop:null});if(!dr)return;const gr=this.state.group;
    if(dr.k==='shift'){const sh=this.state.shifts.find(x=>x.id===dr.id);if(!sh)return;const p={d};if(g!=null){if(gr==='emp'){p.emp=g||null;}else p.site=g;}
      if(minute!=null){const len=sh.e-sh.s,ns=Math.max(H0,Math.min(1439-len,Math.round(minute/15)*15));p.s=ns;p.e=ns+len;}
      this.setState(s=>({shifts:s.shifts.map(x=>x.id===dr.id?Object.assign({},x,p):x)}));this.dirt(dr.id);this.say('Shift moved');}
    else if(dr.k==='int'){const it=this.state.ints.find(x=>x.id===dr.id);if(!it)return;const id=this.newId();
      const sh={id,d,emp:g!=null&&gr==='emp'&&g?g:null,site:g!=null&&gr==='site'?g:it.site,s:minute!=null?Math.round(minute/15)*15:it.s,e:minute!=null?Math.round(minute/15)*15+(it.e-it.s):it.e,type:'int',title:it.title};if(sh.e>1439)sh.e=1439;
      this.setState(s=>({shifts:s.shifts.concat(sh),ints:s.ints.filter(x=>x.id!==it.id)}));this.dirt(id);this.say(sh.emp?it.title+' assigned to '+sh.emp.split(' ')[0]:it.title+' scheduled — still needs an employee');}
    else if(dr.k==='emp'){const id=this.newId(),site=g!=null&&gr==='site'?g:(this.state.site!=='all'?this.state.site:EMP[dr.n].site),s0=minute!=null?Math.round(minute/15)*15:480;
      const emp=dr.n;this.setState(s=>({shifts:s.shifts.concat({id,d,emp,site,s:s0,e:Math.min(1439,s0+480),type:'rec',title:''})}));this.dirt(id);this.say('Shift added for '+emp.split(' ')[0]);}}
  fval(){const f=this.state.f,e={};if(f.type==='rec'&&!f.emp)e.emp='Choose an employee for a recurring shift';if(tm(f.e)<=tm(f.s))e.time='End time must be after start time';return e;}
  renderVals(){return {sc:this.rv()};}
  rv(){
    const s=this.state,T=this,L=s.view,sc=s;
    const C=this.conf(s.shifts),nConf=Object.keys(C).filter(id=>{const x=s.shifts.find(y=>y.id===id);return x&&this.vis(x);}).length;
    const mon=Math.floor(s.anchor/7)*7,dirtyN=Object.keys(s.dirty).filter(id=>s.shifts.some(x=>x.id===id)).length+s.delN;
    const brs=['Lyon','Paris Nord','Marseille'],sitesA=Object.keys(SN).filter(k=>s.br==='all'||SN[k][1]===s.br),emps=EM.filter(e=>(s.br==='all'||SN[e[2]][1]===s.br));
    const setK=k=>ev=>this.setState({[k]:ev.target.value});
    const blk=(x,mode)=>{const c=C[x.id],un=!x.emp,t=x.type,col=un?['transparent','var(--text-2)']:t==='int'?['var(--orange-bg)','var(--orange)']:['var(--accent-soft)','var(--accent)'];const sn=SN[x.site][0];
      const line=s.group==='site'||L==='month'?(x.emp||'Unassigned')+(t==='int'&&x.title?' · '+x.title:''):sn+(t==='int'&&x.title?' · '+x.title:'');
      return {id:x.id,time:fm(x.s)+'–'+fm(x.e),line,short:fm(x.s)+' '+(x.emp?x.emp.split(' ')[0]:'Open')+' · '+sn.split(' ')[0],ico:ICO[t],bg:col[0],fg:col[1],bd:c?'2px solid var(--bad-dot)':un?'1.5px dashed var(--border-strong)':'1px solid transparent',tip:c||(sn+(x.title?' · '+x.title:'')),conf:!!c,dirty:s.dirty[x.id]?1:0,dotR:c?'24px':'5px',
        dragStart:ev=>{this._drag={k:'shift',id:x.id};try{ev.dataTransfer.setData('text/plain',x.id);ev.dataTransfer.effectAllowed='move';}catch(e){}},dragEnd:()=>this.setState({drop:null}),
        click:ev=>{ev.stopPropagation();this.openEdit(x);},stop:ev=>ev.stopPropagation(),rs:ev=>{ev.stopPropagation();ev.preventDefault();this._rs={id:x.id,x:ev.clientX,y:ev.clientY,e0:x.e,mode};this._rsc=false;},
        over:ev=>{if(un&&this._drag&&this._drag.k==='emp'){ev.preventDefault();ev.stopPropagation();}},
        dropOn:ev=>{if(un&&this._drag&&this._drag.k==='emp'){ev.preventDefault();ev.stopPropagation();const n=this._drag.n;this._drag=null;this.setState(st=>({drop:null,shifts:st.shifts.map(y=>y.id===x.id?Object.assign({},y,{emp:n}):y)}));this.dirt(x.id);this.say(n.split(' ')[0]+' assigned');}}};};
    const over=key=>ev=>{ev.preventDefault();if(s.drop!==key)this.setState({drop:key});};
    const inRange=(a,b)=>s.shifts.filter(x=>x.d>=a&&x.d<=b&&this.vis(x));
    let groupsRows=null;
    const rowsFor=(a,b)=>{const sh=inRange(a,b);let rows;
      if(s.group==='emp'){rows=emps.filter(e=>s.emp==='all'||e[0]===s.emp).map(e=>({key:e[0],label:e[0],sub:e[1]+' · '+SN[e[2]][0].split(' ')[0],emp:e[0]}));if(sh.some(x=>!x.emp))rows.unshift({key:'',label:'Unassigned',sub:'Needs an employee',emp:null});}
      else rows=sitesA.filter(k=>s.site==='all'||k===s.site).map(k=>({key:k,label:SN[k][0],sub:SN[k][1],site:k}));
      return {rows,sh};};
    const shOf=(sh,r,d)=>sh.filter(x=>x.d===d&&(s.group==='emp'?(x.emp||'')===r.key:x.site===r.key)).sort((p,q)=>p.s-q.s);
    const leaveOn=(r,d)=>s.group==='emp'&&r.emp&&(LEAVE[r.emp]||[]).includes(d)&&(s.type==='all');
    const leaveBd=(r,d,sh)=>sh.some(x=>C[x.id]&&C[x.id].includes('leave'))?'2px solid var(--bad-dot)':'1px solid transparent';
    const out={isWeek:L==='week',isDay:L==='day',isMonth:L==='month',hasGroup:L!=='month',gLabel:s.group==='emp'?'Employee':'Site'};
    // header range
    if(L==='week'){const a=dt(mon),b=dt(mon+6);out.range=a.getUTCDate()+' '+MN[a.getUTCMonth()].slice(0,3)+' – '+b.getUTCDate()+' '+MN[b.getUTCMonth()].slice(0,3)+' '+b.getUTCFullYear();}
    else if(L==='day'){const a=dt(s.anchor);out.range=DN[wd(s.anchor)]+' '+a.getUTCDate()+' '+MN[a.getUTCMonth()]+' '+a.getUTCFullYear();}
    else{const a=dt(s.anchor);out.range=MN[a.getUTCMonth()]+' '+a.getUTCFullYear();}
    const todayD=3;
    if(L==='week'){const {rows,sh}=rowsFor(mon,mon+6);
      out.wdays=[0,1,2,3,4,5,6].map(i=>{const d=mon+i,a=dt(d),h=HOL[d],t=d===todayD;return {n:DN[i],num:a.getUTCDate(),hol:h||'',bg:h?'var(--hover)':t?'var(--accent-soft)':'transparent',fg:t?'var(--accent)':'var(--text)'};});
      out.wrows=rows.map(r=>({label:r.label,sub:r.sub,cells:[0,1,2,3,4,5,6].map(i=>{const d=mon+i,key=r.key+'|'+d,cs=shOf(sh,r,d),lv=leaveOn(r,d);return {bg:s.drop===key?'var(--accent-soft)':HOL[d]?'var(--hover)':'transparent',leave:lv,leaveBd:leaveBd(r,d,cs),leaveTip:r.emp?r.emp+' · approved leave':'',blocks:cs.map(x=>blk(x,'week')),
        click:()=>this.openNew(d,r.emp,r.site),over:over(key),drop:ev=>this.doDrop(ev,r.key,d,null)};})}));
      out.noRows=rows.length===0;}
    if(L==='day'){const d=s.anchor,{rows,sh}=rowsFor(d,d);out.dayW=(168+TW)+'px';out.trackW=TW;out.dayTitle=s.group==='emp'?'Employee':'Site';out.dayHol=HOL[d]||'';
      out.hours=[];out.grid=[];for(let m=H0;m<H1;m+=60){out.hours.push({x:(m-H0)/60*PX,l:fm(m)});out.grid.push({x:(m-H0)/60*PX});}
      out.drows=rows.map(r=>{const cs=shOf(sh,r,d),lanes=[];const bl=cs.map(x=>{let ln=lanes.findIndex(e=>e<=x.s);if(ln<0){ln=lanes.length;lanes.push(0);}lanes[ln]=x.e;return Object.assign(blk(x,'day'),{x:Math.max(0,(x.s-H0)/60*PX),w:Math.max(40,(x.e-x.s)/60*PX-2),y:4+ln*36});});
        const key=r.key+'|'+d,mn=ev=>{const b=ev.currentTarget.getBoundingClientRect();return H0+((ev.clientX-b.left)/PX)*60;};
        return {label:r.label,sub:r.sub,h:Math.max(1,lanes.length)*36+8,blocks:bl,leave:leaveOn(r,d),leaveBd:leaveBd(r,d,cs),leaveTip:r.emp?r.emp+' · approved leave':'',bg:s.drop===key?'var(--accent-soft)':HOL[d]?'var(--hover)':'transparent',
          click:ev=>this.openNew(d,r.emp,r.site,Math.round(mn(ev)/30)*30),over:over(key),drop:ev=>this.doDrop(ev,r.key,d,mn(ev))};});
      out.noRows=rows.length===0;}
    if(L==='month'){const a=dt(s.anchor),y=a.getUTCFullYear(),m=a.getUTCMonth(),first=Math.round((Date.UTC(y,m,1)-B0)/864e5),last=Math.round((Date.UTC(y,m+1,0)-B0)/864e5),start=Math.floor(first/7)*7;
      out.mHead=DN;const weeks=[];for(let w=start;w<=last;w+=7){weeks.push({cells:[0,1,2,3,4,5,6].map(i=>{const d=w+i,inM=d>=first&&d<=last,cs=s.shifts.filter(x=>x.d===d&&this.vis(x)).sort((p,q)=>p.s-q.s),h=HOL[d],key='m|'+d;
        return {num:dt(d).getUTCDate(),hol:h||'',op:inM?1:.45,bg:s.drop===key?'var(--accent-soft)':h?'var(--hover)':'transparent',nBg:d===todayD?'var(--accent)':'transparent',nFg:d===todayD?'#fff':'var(--text)',conf:cs.some(x=>C[x.id]),
          chips:cs.slice(0,3).map(x=>blk(x,'month')),more:cs.length>3,moreN:cs.length-3,click:()=>this.setState({view:'day',anchor:d}),over:over(key),drop:ev=>this.doDrop(ev,null,d,null)};})});}
      out.mweeks=weeks;}
    const pubAffected=new Set(Object.keys(s.dirty).map(id=>(s.shifts.find(x=>x.id===id)||{}).emp).filter(Boolean)).size;
    const added=Object.keys(s.dirty).filter(id=>s.shifts.some(x=>x.id===id)).length;
    return Object.assign(out,{
      openSched:()=>this.setState({mod:true}),mOpen:s.mod,mBase:B0,mPeople:EM,mSites:SN,mShifts:s.shifts,mLeave:LEAVE,mHol:HOL,mClose:()=>this.setState({mod:false}),
      mSave:(list,mode,o)=>{let n=s.nid;const add=list.map(x=>Object.assign({},x,{id:'n'+(n++)}));this.setState(st=>({shifts:st.shifts.concat(add),nid:n,mod:false,dirty:mode==='draft'?Object.assign({},st.dirty,...add.map(x=>({[x.id]:1}))):st.dirty,anchor:add.length?add[0].d:st.anchor}));this.say((mode==='draft'?'Saved as draft':'Published')+' · '+add.length+' shift'+(add.length===1?'':'s')+(o.notify?' · employees notified':''));},
      pubL:dirtyN?dirtyN+' unpublished change'+(dirtyN===1?'':'s'):'All changes published',pubC:dirtyN?'var(--warn)':'var(--ok)',pubDot:dirtyN?'var(--warn-dot)':'var(--ok-dot)',pubOp:dirtyN?1:.45,nConf,confPl:nConf===1?'':'s',
      views:[['day','Day'],['week','Week'],['month','Month']].map(([k,l])=>({l,bg:L===k?'var(--accent)':'var(--surface)',fg:L===k?'#fff':'var(--text-2)',go:()=>this.setState({view:k})})),
      groups:[['emp','Employees'],['site','Sites']].map(([k,l])=>({l,bg:s.group===k?'var(--accent)':'var(--surface)',fg:s.group===k?'#fff':'var(--text-2)',go:()=>this.setState({group:k})})),
      prev:()=>this.setState({anchor:s.anchor-(L==='week'?7:L==='day'?1:30)}),next:()=>this.setState({anchor:s.anchor+(L==='week'?7:L==='day'?1:30)}),today:()=>this.setState({anchor:todayD}),
      filters:[{val:s.br,on:ev=>this.setState({br:ev.target.value,site:'all',emp:'all'}),opts:[{v:'all',l:'All branches'}].concat(brs.map(b=>({v:b,l:b})))},{val:s.site,on:setK('site'),opts:[{v:'all',l:'All sites'}].concat(sitesA.map(k=>({v:k,l:SN[k][0]})))},{val:s.emp,on:setK('emp'),opts:[{v:'all',l:'All employees'}].concat(emps.map(e=>({v:e[0],l:e[0]})))},{val:s.type,on:setK('type'),opts:[{v:'all',l:'All types'},{v:'rec',l:'Recurring'},{v:'int',l:'Intervention'}]}],
      hasFilter:s.br!=='all'||s.site!=='all'||s.emp!=='all'||s.type!=='all',clearF:()=>this.setState({br:'all',site:'all',emp:'all',type:'all'}),
      ints:s.ints.filter(i=>(s.site==='all'||i.site===s.site)&&(s.br==='all'||SN[i.site][1]===s.br)).map(i=>({title:i.title,site:SN[i.site][0],when:DN[wd(i.d)]+' '+dt(i.d).getUTCDate()+' '+MN[dt(i.d).getUTCMonth()].slice(0,3)+' · '+fm(i.s)+'–'+fm(i.e),dragStart:ev=>{this._drag={k:'int',id:i.id};try{ev.dataTransfer.setData('text/plain',i.id);ev.dataTransfer.effectAllowed='move';}catch(e){}},dragEnd:()=>this.setState({drop:null})})),noInts:s.ints.length===0,
      empChips:EM.map(e=>({n:e[0],dragStart:ev=>{this._drag={k:'emp',n:e[0]};try{ev.dataTransfer.setData('text/plain',e[0]);ev.dataTransfer.effectAllowed='copy';}catch(e2){}},dragEnd:()=>this.setState({drop:null})})),
      newShift:()=>this.openNew(L==='day'?s.anchor:Math.max(mon,Math.min(mon+4,todayD>=mon&&todayD<=mon+6?todayD:mon)),null,null,null),
      copyWeek:()=>{const prev=s.shifts.filter(x=>x.d>=mon-7&&x.d<=mon-1&&this.vis(x)),have=new Set(s.shifts.filter(x=>x.d>=mon&&x.d<=mon+6).map(x=>[x.d,x.emp,x.site,x.s,x.e].join()));
        let n=s.nid;const add=[];prev.forEach(x=>{const d=x.d+7;if(HOL[d]||have.has([d,x.emp,x.site,x.s,x.e].join()))return;if(x.emp&&(LEAVE[x.emp]||[]).includes(d)&&false)return;add.push(Object.assign({},x,{id:'n'+(n++),d}));});
        if(!add.length){this.say('Nothing to copy — this week already has the previous week’s shifts');return;}
        this.setState(st=>({shifts:st.shifts.concat(add),nid:n,dirty:Object.assign({},st.dirty,...add.map(x=>({[x.id]:1})))}));this.say(add.length+' shifts copied from the previous week');},
      f:s.f?this.fview():null,fClose:()=>this.setState({f:null}),
      fSave:()=>{const f=s.f;if(Object.keys(this.fval()).length){this.setState({f:Object.assign({},f,{tried:true})});return;}
        const p={emp:f.emp||null,site:f.site,d:fromIso(f.date),s:tm(f.s),e:tm(f.e),type:f.type,title:f.type==='int'?f.ttl.trim():''};
        if(f.id){this.setState(st=>({shifts:st.shifts.map(x=>x.id===f.id?Object.assign({},x,p):x),f:null}));this.dirt(f.id);}else{const id=this.newId();this.setState(st=>({shifts:st.shifts.concat(Object.assign({id},p)),f:null}));this.dirt(id);}
        this.say(f.id?'Shift updated':'Shift added');},
      fDel:()=>{const id=s.f.id;this.setState(st=>({shifts:st.shifts.filter(x=>x.id!==id),f:null,delN:st.dirty[id]?st.delN:st.delN+1,dirty:Object.keys(st.dirty).reduce((o,k)=>{if(k!==id)o[k]=1;return o;},{})}));this.say('Shift deleted');},
      openPub:()=>{if(dirtyN)this.setState({pub:{notify:true}});else this.say('Nothing to publish');},pubNo:()=>this.setState({pub:null}),
      pub:s.pub?{sum:[{n:added,l:'added or edited'},{n:s.delN,l:'deleted'},{n:pubAffected,l:'employees affected'}],notify:s.pub.notify,notifyH:s.pub.notify?'Push and SMS to '+pubAffected+' employee'+(pubAffected===1?'':'s')+'.':'Employees will see changes without a message.',bg:s.pub.notify?'var(--accent)':'var(--border-strong)',left:s.pub.notify?'19px':'2px',tog:()=>this.setState({pub:{notify:!s.pub.notify}}),hasConf:nConf>0}:null,
      pubYes:()=>{const nf=s.pub.notify;this.setState({pub:null,dirty:{},delN:0});this.say('Schedule published'+(nf?' · '+pubAffected+' employees notified':''));},toast:s.toast
    });
  }
  fview(){const s=this.state,f=s.f,er=f.tried?this.fval():{},T=this;
    const sim=s.shifts.filter(x=>x.id!==f.id).concat(f.emp&&tm(f.e)>tm(f.s)?[{id:'__f',emp:f.emp,site:f.site,d:fromIso(f.date),s:tm(f.s),e:tm(f.e)}]:[]);const w=this.conf(sim)['__f']||'';
    const set=k=>ev=>{const v=ev.target.value;this.setState(st=>({f:Object.assign({},st.f,{[k]:v})}));};
    return {title:f.id?'Edit shift':'New shift',saveL:f.id?'Save changes':'Add shift',editing:!!f.id,isInt:f.type==='int',ttl:f.ttl,onTtl:set('ttl'),emp:f.emp,onEmp:ev=>{const v=ev.target.value;this.setState(st=>({f:Object.assign({},st.f,{emp:v,site:v&&!st.f.id?EMP[v].site:st.f.site})}));},
      empOpts:[{v:'',l:'Unassigned'}].concat(EM.map(e=>({v:e[0],l:e[0]+' · '+e[1]}))),empBd:er.emp?'var(--bad-dot)':'var(--border-strong)',empE:er.emp||'',site:f.site,onSite:set('site'),siteOpts:Object.keys(SN).map(k=>({v:k,l:SN[k][0]})),
      date:f.date,onDate:set('date'),s:f.s,e:f.e,onS:set('s'),onE:set('e'),timeBd:er.time?'var(--bad-dot)':'var(--border-strong)',timeE:er.time||'',warn:w,
      types:[['rec','Recurring'],['int','Intervention']].map(([k,l])=>({l,bg:f.type===k?'var(--accent)':'var(--surface)',fg:f.type===k?'#fff':'var(--text-2)',go:()=>this.setState(st=>({f:Object.assign({},st.f,{type:k})}))}))};}
}

class AdminSchedulesView extends AdminSchedulesBase {
  view(S) {
    const tr = this.props.tr;
    const { sc } = S;
    return (
<>
<div className="flex flex-col gap-[14px] relative">
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("schedules")}
</h1>
<div className="mt-[4px] flex items-center gap-[12px] flex-wrap text-[13.5px] text-text-2">
<span className="flex items-center gap-[7px]" style={{color:sc?.pubC}}>
<span className="w-[8px] h-[8px] rounded-[50%]" style={{background:sc?.pubDot}} />
{sc?.pubL}
</span>
{sc?.nConf ? (<>
<span className="flex items-center gap-[7px] text-bad">
<span className="w-[8px] h-[8px] rounded-[2px] border-[2px] border-solid border-bad-dot" />
{tr("p0_conflict_p1",{p0:sc?.nConf ?? '',p1:sc?.confPl ?? ''})}
</span>
</>) : null}
</div>
</div>
<div className="flex gap-[8px] flex-wrap">
{sc?.isWeek ? (<>
<button onClick={sc?.copyWeek} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("copy_previous_week")}
</button>
</>) : null}
<button onClick={sc?.newShift} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("add_shift")}
</button>
<button onClick={sc?.openSched} className="h-[36px] p-[0_13px] rounded-[9px] border border-solid border-accent bg-accent-soft text-accent text-[13px] font-medium cursor-pointer">
{tr("new_schedule")}
</button>
<button onClick={sc?.openPub} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer" style={{opacity:sc?.pubOp}}>
{tr("publish_changes")}
</button>
</div>
</div>
<div className="flex gap-[8px] flex-wrap items-center">
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(sc?.views ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_14px] border-0 text-[13px] font-medium cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
<div className="flex items-center gap-[4px]">
<button onClick={sc?.prev} aria-label={tr("previous")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text cursor-pointer text-[16px]">
{"‹"}
</button>
<button onClick={sc?.today} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("today")}
</button>
<button onClick={sc?.next} aria-label={tr("next")} className="w-[34px] h-[34px] rounded-[9px] border border-solid border-border-strong bg-surface text-text cursor-pointer text-[16px]">
{"›"}
</button>
</div>
<div className="font-semibold text-[15px] min-w-[150px]">
{sc?.range}
</div>
{sc?.hasGroup ? (<>
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(sc?.groups ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_12px] border-0 text-[13px] cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
</>) : null}
{(sc?.filters ?? []).map((f, $index) => (<Fragment key={$index}>
<select value={f?.val} onChange={f?.on} className="h-[34px] p-[0_10px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] max-w-[170px]">
{(f?.opts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</Fragment>))}
{sc?.hasFilter ? (<>
<button onClick={sc?.clearF} className="h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("clear")}
</button>
</>) : null}
</div>
<div className="flex gap-[16px] items-start flex-wrap">
<div className="flex-[1_1_640px] min-w-[0] flex flex-col gap-[10px]">
<div className="flex gap-[16px] flex-wrap text-[12px] text-text-2">
<span className="flex items-center gap-[6px]">
<span className="w-[12px] h-[12px] rounded-[4px] bg-accent-soft border border-solid border-accent" />
{tr("recurring")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[12px] h-[12px] rounded-[4px] bg-orange-bg border border-solid border-orange" />
{tr("intervention")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[12px] h-[12px] rounded-[4px] bg-info-bg border border-solid border-info" />
{tr("leave")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[12px] h-[12px] rounded-[4px] border-[1.5px] border-dashed border-border-strong" />
{tr("unassigned")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[12px] h-[12px] rounded-[4px] bg-hover border border-solid border-border-strong" />
{tr("holiday")}
</span>
<span className="flex items-center gap-[6px]">
<span className="w-[12px] h-[12px] rounded-[4px] border-[2px] border-solid border-bad-dot" />
{tr("conflict")}
</span>
</div>
{sc?.isWeek ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[1064px]">
<div className="grid grid-cols-[168px_repeat(7,minmax(128px,1fr))] border-b border-solid border-b-border bg-surface-2 rounded-[12px_12px_0_0]">
<div className="p-[10px_14px] text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
{sc?.gLabel}
</div>
{(sc?.wdays ?? []).map((d, $index) => (<Fragment key={$index}>
<div className="p-[8px_8px] border-l border-solid border-l-border" style={{background:d?.bg}}>
<div className="text-[11.5px] font-semibold uppercase" style={{color:d?.fg}}>
{d?.n}
</div>
<div className="text-[15px] font-semibold" style={{color:d?.fg}}>
{d?.num}
</div>
<div className="text-[11px] text-text-3 min-h-[14px]">
{d?.hol}
</div>
</div>
</Fragment>))}
</div>
{(sc?.wrows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[168px_repeat(7,minmax(128px,1fr))] border-b border-solid border-b-border">
<div className="p-[10px_14px] flex flex-col justify-center">
<div className="text-[13px] font-medium">
{r?.label}
</div>
<div className="text-[12px] text-text-3">
{r?.sub}
</div>
</div>
{(r?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<div onClick={c?.click} onDragOver={c?.over} onDrop={c?.drop} className="border-l border-solid border-l-border p-[5px] min-h-[72px] flex flex-col gap-[4px] [cursor:cell]" style={{background:c?.bg}}>
{c?.leave ? (<>
<div title={c?.leaveTip} className="p-[6px_8px] rounded-[7px] bg-info-bg text-info text-[12px] font-medium" style={{border:c?.leaveBd}}>
{tr("leave")}
</div>
</>) : null}
{(c?.blocks ?? []).map((b, $index) => (<Fragment key={$index}>
<div draggable="true" onDragStart={b?.dragStart} onDragEnd={b?.dragEnd} onDragOver={b?.over} onDrop={b?.dropOn} onClick={b?.click} title={b?.tip} className="relative p-[5px_8px_9px] rounded-[7px] text-[12px] cursor-grab leading-[1.3]" style={{background:b?.bg,color:b?.fg,border:b?.bd}}>
<div className="flex items-center gap-[5px] whitespace-nowrap [font-family:'Geist_Mono',monospace] text-[11.5px] font-semibold">
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
<path d={b?.ico} />
</svg>
{b?.time}
{b?.conf ? (<>
<span className="ml-[auto] w-[15px] h-[15px] rounded-[50%] bg-bad-dot text-[color:#fff] [font:700_10px_sans-serif] grid place-items-center">
{"!"}
</span>
</>) : null}
</div>
<div className="whitespace-nowrap overflow-hidden text-ellipsis">
{b?.line}
</div>
<span className="absolute top-[4px] w-[6px] h-[6px] rounded-[50%] bg-warn-dot" style={{right:b?.dotR,opacity:b?.dirty}} />
<div onMouseDown={b?.rs} onClick={b?.stop} draggable="false" title={tr("drag_to_change_end_time")} className="absolute left-[8px] right-[8px] bottom-[2px] h-[5px] rounded-[3px] bg-current opacity-[.28] [cursor:ns-resize]" />
</div>
</Fragment>))}
</div>
</Fragment>))}
</div>
</Fragment>))}
{sc?.noRows ? (<>
<div className="p-[48px_16px] text-center text-text-3 text-[13.5px]">
{tr("nothing_matches_the_filters")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{sc?.isDay ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div style={{minWidth:sc?.dayW}}>
<div className="flex border-b border-solid border-b-border bg-surface-2 rounded-[12px_12px_0_0]">
<div className="flex-none w-[168px] p-[10px_14px] text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em]">
{sc?.dayTitle}
<div className="[text-transform:none] font-medium text-text-2 mt-[2px]">
{sc?.dayHol}
</div>
</div>
<div className="relative flex-none h-[46px]" style={{width:`${sc?.trackW}px`}}>
{(sc?.hours ?? []).map((h, $index) => (<Fragment key={$index}>
<div className="absolute top-[0] bottom-[0] p-[14px_0_0_5px] border-l border-solid border-l-border [font:11px_'Geist_Mono',monospace] text-text-3" style={{left:`${h?.x}px`}}>
{h?.l}
</div>
</Fragment>))}
</div>
</div>
{(sc?.drows ?? []).map((r, $index) => (<Fragment key={$index}>
<div className="flex border-b border-solid border-b-border">
<div className="flex-none w-[168px] p-[10px_14px] flex flex-col justify-center">
<div className="text-[13px] font-medium">
{r?.label}
</div>
<div className="text-[12px] text-text-3">
{r?.sub}
</div>
</div>
<div onClick={r?.click} onDragOver={r?.over} onDrop={r?.drop} className="relative flex-none [cursor:cell]" style={{width:`${sc?.trackW}px`,height:`${r?.h}px`,background:r?.bg}}>
{(sc?.grid ?? []).map((g, $index) => (<Fragment key={$index}>
<div className="absolute top-[0] bottom-[0] border-l border-solid border-l-border pointer-events-none" style={{left:`${g?.x}px`}} />
</Fragment>))}
{r?.leave ? (<>
<div title={r?.leaveTip} className="absolute left-[0] right-[0] top-[4px] bottom-[4px] rounded-[8px] bg-info-bg text-info p-[6px_10px] text-[12.5px] font-medium pointer-events-none" style={{border:r?.leaveBd}}>
{tr("on_approved_leave")}
</div>
</>) : null}
{(r?.blocks ?? []).map((b, $index) => (<Fragment key={$index}>
<div draggable="true" onDragStart={b?.dragStart} onDragEnd={b?.dragEnd} onDragOver={b?.over} onDrop={b?.dropOn} onClick={b?.click} title={b?.tip} className="absolute h-[32px] box-border p-[3px_14px_3px_8px] rounded-[7px] text-[12px] cursor-grab overflow-hidden leading-[1.25]" style={{left:`${b?.x}px`,top:`${b?.y}px`,width:`${b?.w}px`,background:b?.bg,color:b?.fg,border:b?.bd}}>
<div className="flex items-center gap-[5px] [font-family:'Geist_Mono',monospace] text-[11px] font-semibold">
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
<path d={b?.ico} />
</svg>
{b?.time}
{b?.conf ? (<>
<span className="w-[14px] h-[14px] rounded-[50%] bg-bad-dot text-[color:#fff] [font:700_9.5px_sans-serif] grid place-items-center">
{"!"}
</span>
</>) : null}
</div>
<div className="whitespace-nowrap overflow-hidden text-ellipsis">
{b?.line}
</div>
<div onMouseDown={b?.rs} onClick={b?.stop} draggable="false" title={tr("drag_to_change_end_time")} className="absolute right-[0] top-[0] bottom-[0] w-[8px] bg-current opacity-[.25] [cursor:ew-resize]" />
</div>
</Fragment>))}
</div>
</div>
</Fragment>))}
{sc?.noRows ? (<>
<div className="p-[48px_16px] text-center text-text-3 text-[13.5px]">
{tr("nothing_matches_the_filters")}
</div>
</>) : null}
</div>
</div>
</>) : null}
{sc?.isMonth ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[760px]">
<div className="grid grid-cols-[repeat(7,1fr)] bg-surface-2 border-b border-solid border-b-border rounded-[12px_12px_0_0]">
{(sc?.mHead ?? []).map((h, $index) => (<Fragment key={$index}>
<div className="p-[9px_10px] text-[11.5px] font-semibold text-text-3 uppercase">
{h}
</div>
</Fragment>))}
</div>
{(sc?.mweeks ?? []).map((w, $index) => (<Fragment key={$index}>
<div className="grid grid-cols-[repeat(7,1fr)]">
{(w?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<div onClick={c?.click} onDragOver={c?.over} onDrop={c?.drop} className="min-h-[104px] p-[6px] border-t border-solid border-t-border border-l border-l-border flex flex-col gap-[3px] cursor-pointer" style={{background:c?.bg,opacity:c?.op}}>
<div className="flex items-center gap-[6px]">
<span className="w-[22px] h-[22px] rounded-[50%] grid place-items-center text-[12px] font-semibold" style={{background:c?.nBg,color:c?.nFg}}>
{c?.num}
</span>
<span className="text-[11px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{c?.hol}
</span>
{c?.conf ? (<>
<span className="ml-[auto] w-[8px] h-[8px] rounded-[50%] bg-bad-dot" />
</>) : null}
</div>
{(c?.chips ?? []).map((b, $index) => (<Fragment key={$index}>
<div draggable="true" onDragStart={b?.dragStart} onDragEnd={b?.dragEnd} onClick={b?.click} title={b?.tip} className="p-[2px_6px] rounded-[5px] text-[11px] whitespace-nowrap overflow-hidden text-ellipsis cursor-grab" style={{background:b?.bg,color:b?.fg,border:b?.bd}}>
{b?.short}
</div>
</Fragment>))}
{c?.more ? (<>
<div className="text-[11px] text-text-3 pl-[4px]">
{tr("p0_more",{p0:c?.moreN ?? ''})}
</div>
</>) : null}
</div>
</Fragment>))}
</div>
</Fragment>))}
</div>
</div>
</>) : null}
</div>
<aside className="flex-[0_0_260px] w-[260px] max-w-[100%] flex flex-col gap-[14px]">
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_14px] border-b border-solid border-b-border">
<div className="font-semibold text-[14px]">
{tr("unassigned_interventions")}
</div>
<div className="text-[12px] text-text-3 mt-[2px]">
{tr("drag_onto_a_day_or")}
</div>
</div>
{(sc?.ints ?? []).map((i, $index) => (<Fragment key={$index}>
<div draggable="true" onDragStart={i?.dragStart} onDragEnd={i?.dragEnd} className="p-[10px_14px] border-t border-solid border-t-border cursor-grab flex gap-[10px] items-start">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] flex-none">
<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
</svg>
<div className="min-w-[0]">
<div className="text-[13px] font-medium">
{i?.title}
</div>
<div className="text-[12px] text-text-3">
{i?.site}{" · "}{i?.when}
</div>
</div>
</div>
</Fragment>))}
{sc?.noInts ? (<>
<div className="p-[22px_14px] text-[13px] text-text-3 text-center">
{tr("all_interventions_are_covered")}
</div>
</>) : null}
</div>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-hidden">
<div className="p-[12px_14px] border-b border-solid border-b-border">
<div className="font-semibold text-[14px]">
{tr("employees")}
</div>
<div className="text-[12px] text-text-3 mt-[2px]">
{tr("drag_onto_a_day_to")}
</div>
</div>
<div className="p-[10px_12px] flex flex-wrap gap-[6px] max-h-[200px] overflow-y-auto">
{(sc?.empChips ?? []).map((e, $index) => (<Fragment key={$index}>
<div draggable="true" onDragStart={e?.dragStart} onDragEnd={e?.dragEnd} className="p-[5px_10px] rounded-[999px] border border-solid border-border-strong bg-surface text-[12.5px] cursor-grab">
{e?.n}
</div>
</Fragment>))}
</div>
</div>
</aside>
</div>
{sc?.f ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[480px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div className="font-semibold text-[16px]">
{sc?.f?.title}
</div>
<button onClick={sc?.fClose} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[20px] overflow-y-auto flex flex-col gap-[14px]">
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden self-start">
{(sc?.f?.types ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="h-[32px] p-[0_14px] border-0 text-[13px] cursor-pointer" style={{background:t?.bg,color:t?.fg}}>
{t?.l}
</button>
</Fragment>))}
</div>
{sc?.f?.isInt ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("intervention_title")}
<input value={sc?.f?.ttl} onInput={sc?.f?.onTtl} placeholder={tr("e_g_boiler_inspection")} className="h-[36px] p-[0_11px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px] [outline:none]" />
</label>
</>) : null}
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("employee")}
<select value={sc?.f?.emp} onChange={sc?.f?.onEmp} className="h-[36px] p-[0_9px] rounded-[9px] bg-surface text-text text-[13.5px]" style={{border:`1px solid ${sc?.f?.empBd}`}}>
{(sc?.f?.empOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
<span className="text-[12px] text-bad font-normal">
{sc?.f?.empE}
</span>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("site")}
<select value={sc?.f?.site} onChange={sc?.f?.onSite} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(sc?.f?.siteOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<div className="grid grid-cols-[1.3fr_1fr_1fr] gap-[10px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("date")}
<input type="date" value={sc?.f?.date} onInput={sc?.f?.onDate} className="h-[36px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("start")}
<input type="time" value={sc?.f?.s} onInput={sc?.f?.onS} className="h-[36px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("end")}
<input type="time" value={sc?.f?.e} onInput={sc?.f?.onE} className="h-[36px] p-[0_8px] rounded-[9px] bg-surface text-text" style={{border:`1px solid ${sc?.f?.timeBd}`}} />
</label>
</div>
<span className="text-[12px] text-bad">
{sc?.f?.timeE}
</span>
{sc?.f?.warn ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-bad-bg text-bad text-[13px]">
<b>
{tr("conflict_2")}
</b>
{tr("p0_you_can_still_save",{p0:sc?.f?.warn ?? ''})}
</div>
</>) : null}
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex gap-[8px] items-center">
{sc?.f?.editing ? (<>
<button onClick={sc?.fDel} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-bad text-[13px] cursor-pointer">
{tr("delete")}
</button>
</>) : null}
<div className="flex-1" />
<button onClick={sc?.fClose} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={sc?.fSave} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{sc?.f?.saveL}
</button>
</div>
</div>
</div>
</>) : null}
{sc?.mOpen ? (<>
<AdminScheduleModal base={sc?.mBase} people={sc?.mPeople} sites={sc?.mSites} shifts={sc?.mShifts} leave={sc?.mLeave} hol={sc?.mHol} onSave={sc?.mSave} onClose={sc?.mClose} />
</>) : null}
{sc?.pub ? (<>
<div className="fixed inset-[0] bg-overlay z-[50] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[440px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[14px]">
<div className="font-semibold text-[16px]">
{tr("publish_schedule_changes")}
</div>
<div className="grid grid-cols-[repeat(3,1fr)] gap-[8px]">
{(sc?.pub?.sum ?? []).map((x, $index) => (<Fragment key={$index}>
<div className="p-[10px] rounded-[10px] border border-solid border-border text-center">
<div className="text-[22px] font-semibold">
{x?.n}
</div>
<div className="text-[12px] text-text-3">
{x?.l}
</div>
</div>
</Fragment>))}
</div>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{tr("notify_employees")}
</div>
<div className="text-[12.5px] text-text-3">
{sc?.pub?.notifyH}
</div>
</div>
<div onClick={sc?.pub?.tog} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:sc?.pub?.bg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:sc?.pub?.left}} />
</div>
</div>
{sc?.pub?.hasConf ? (<>
<div className="p-[10px_12px] rounded-[10px] bg-warn-bg text-warn text-[13px]">
{tr("p0_conflict_p1_still_open",{p0:sc?.nConf ?? '',p1:sc?.confPl ?? ''})}
</div>
</>) : null}
<div className="flex gap-[8px] justify-end">
<button onClick={sc?.pubNo} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={sc?.pubYes} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("publish")}
</button>
</div>
</div>
</div>
</>) : null}
{sc?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{sc?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminSchedules(props: any) {
  const tr = useTranslations('AdminSchedules');
  return <AdminSchedulesView {...props} tr={tr} />;
}
