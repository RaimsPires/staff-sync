'use client';
/* eslint-disable */
// @ts-nocheck  (auto-ported view logic; type progressively)
import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { DCLogic } from '@/lib/dc-logic';


const SN={pd:['Part-Dieu Tower','Lyon'],cf:['Confluence Depot','Lyon'],sd:['Saint-Denis Hub','Paris Nord'],rl:['Roissy Logistics','Paris Nord'],pv:['Port Vieux Yard','Marseille']};
const BRS=['Lyon','Paris Nord','Marseille'];
const EM=[['Amélie Fontaine','sd'],['Karim Benali','rl'],['Léa Moreau','pd'],['Thomas Girard','cf'],['Inès Haddad','pv'],['Paul Lambert','sd'],['Sofia Rossi','rl'],['Hugo Petit','sd'],['Nora Diallo','cf'],['Elena Marchand','cf'],['Bastien Leroy','pv'],['Georges Aubert','pd'],['Monique Vidal','pv'],['Marc Olivier','sd']];
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rnd=s=>(hash(s)%1000)/1000;
const ICO={timesheet:'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',hours:'M4 20V10M10 20V4M16 20v-8M22 20H2',lateness:'M12 3v9l5 3M3 12a9 9 0 1 0 3-6.7L3 8',absences:'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM18 8l4 4m0-4l-4 4',overtime:'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM17 2l3 3',leave:'M3 6h18M3 12h18M8 3v6M16 3v6M5 21h14a2 2 0 0 0 2-2V8H3v11a2 2 0 0 0 2 2z',flagged:'M5 21V4M5 4h12l-2 4 2 4H5',site:'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',proxy:'M16 11a4 4 0 1 0-8 0M12 15c-4 0-7 2-7 5M17 14l2 2 3-3'};
const T={
 timesheet:{l:'Timesheet',d:'Scheduled vs worked hours per person, ready for payroll.',cols:[['sch','Scheduled','h',1,(r,w)=>w*8],['wrk','Worked','h',1,(r,w)=>w*8*(.9+r()*.15)],['brk','Breaks','h',1,(r,w)=>w*.5],['ot','Overtime','h',1,(r,w)=>w*r()*.9],['days','Days worked','d',1,(r,w)=>w-(r()<.15?1:0)]],def:['sch','wrk','ot','days']},
 hours:{l:'Hours worked',d:'Worked hours with variance against the plan.',cols:[['wrk','Worked','h',1,(r,w)=>w*8*(.88+r()*.2)],['sch','Scheduled','h',1,(r,w)=>w*8],['var','Variance','h',1,(r,w,c)=>c.wrk-c.sch],['avg','Avg per day','h',0,(r,w,c)=>c.wrk/Math.max(1,w)]],def:['wrk','sch','var']},
 lateness:{l:'Lateness',d:'Late arrivals, minutes lost and punctuality.',cols:[['n','Late arrivals','n',1,(r,w)=>Math.round(w*r()*.35)],['min','Minutes late','min',1,(r,w,c)=>Math.round(c.n*(8+r()*20))],['avg','Avg minutes','min',0,(r,w,c)=>c.n?c.min/c.n:0],['ot','On-time rate','%',0,(r,w,c)=>Math.max(0,100-c.n/Math.max(1,w)*100)]],def:['n','min','ot']},
 absences:{l:'Absences',d:'Excused and unexcused absences.',cols:[['n','Absences','d',1,(r,w)=>Math.round(w*r()*.18)],['exc','Excused','d',1,(r,w,c)=>Math.round(c.n*r())],['unx','Unexcused','d',1,(r,w,c)=>c.n-c.exc],['rate','Absence rate','%',0,(r,w,c)=>c.n/Math.max(1,w)*100]],def:['n','exc','unx']},
 overtime:{l:'Overtime',d:'Overtime hours, approved or pending.',cols:[['ot','Overtime','h',1,(r,w)=>w*r()*1.1],['apr','Approved','h',1,(r,w,c)=>c.ot*(.6+r()*.4)],['pen','Pending','h',1,(r,w,c)=>c.ot-c.apr],['sh','Shifts over 8 h','n',1,(r,w)=>Math.round(w*r()*.5)]],def:['ot','apr','pen']},
 leave:{l:'Leave taken',d:'Days taken per leave type.',cols:[['an','Annual','d',1,(r,w)=>Math.round(w*r()*.35*2)/2],['rtt','RTT','d',1,(r,w)=>Math.round(w*r()*.1*2)/2],['sick','Sick','d',1,(r,w)=>Math.round(w*r()*.1)],['fam','Family event','d',1,(r,w)=>r()<.15?1:0],['tot','Total','d',1,(r,w,c)=>c.an+c.rtt+c.sick+c.fam]],def:['an','rtt','sick','tot']},
 flagged:{l:'Flagged check-ins',d:'Fraud and anomaly flags and how they were resolved.',cols:[['n','Flags','n',1,(r,w)=>Math.round(w*r()*.22)],['apr','Approved','n',1,(r,w,c)=>Math.round(c.n*r()*.6)],['rej','Rejected','n',1,(r,w,c)=>Math.round((c.n-c.apr)*r()*.7)],['open','Still open','n',1,(r,w,c)=>c.n-c.apr-c.rej]],def:['n','apr','rej','open']},
 site:{l:'Site attendance summary',d:'Expected vs present, lates and flags per site.',cols:[['exp','Expected','n',1,(r,w)=>Math.round(w*(3+r()*5))],['pres','Present','n',1,(r,w,c)=>Math.round(c.exp*(.86+r()*.12))],['rate','Attendance','%',0,(r,w,c)=>c.pres/Math.max(1,c.exp)*100],['late','Lates','n',1,(r,w,c)=>Math.round(c.pres*r()*.1)],['fl','Flags','n',1,(r,w,c)=>Math.round(c.pres*r()*.03)]],def:['exp','pres','rate','late']},
 proxy:{l:'Proxy check-ins',d:'Check-ins made on behalf of employees.',cols:[['n','Proxy check-ins','n',1,(r,w)=>Math.round(w*r()*.3)],['qr','Via badge QR','n',1,(r,w,c)=>Math.round(c.n*(.4+r()*.4))],['man','Manual by manager','n',1,(r,w,c)=>c.n-c.qr],['dl','Avg delay','min',0,(r,w)=>5+r()*25]],def:['n','qr','man']}
};
const CATS=[['Time & attendance',['timesheet','hours','lateness','absences','overtime']],['Leave',['leave']],['Sites & compliance',['site','flagged','proxy']]];
const RANGES={month:['This month','Oct 1 – 15','2026-10-01','2026-10-15'],last:['Last month','September','2026-09-01','2026-09-30'],'7':['Last 7 days','Oct 9 – 15','2026-10-09','2026-10-15'],q:['Last quarter','Jul – Sep','2026-07-01','2026-09-30'],custom:['Custom range','Custom','','']};
const pms=s=>{const[y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DAYMS=864e5;
const fdate=s=>{const d=new Date(pms(s));return d.getUTCDate()+' '+MN[d.getUTCMonth()];};
const GL={employee:'Employee',site:'Site',branch:'Branch',day:'Day'};
const FREQ={daily:'Daily',weekly:'Weekly',monthly:'Monthly'},DOW=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const fmtV=(v,u)=>u==='%'?Math.round(v)+'%':(Math.round(v*10)/10).toString();
const EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
class AdminReportsBase extends DCLogic {
  state={tab:'lib',q:'',view:false,type:'timesheet',range:'month',from:'2026-10-01',to:'2026-10-15',brs:[],sites:[],emps:[],empQ:'',group:'employee',cols:T.timesheet.def.slice(),chart:'',vmode:'table',pop:null,scope:false,loaded:null,
    saved:[
      {id:'r1',name:'Weekly lateness – Paris Nord',type:'lateness',range:'7',from:'',to:'',brs:['Paris Nord'],sites:[],emps:[],group:'employee',cols:T.lateness.def.slice(),sched:{freq:'weekly',day:'Monday',time:'08:00',rec:['marc.olivier@staffsync.io','claire.vasseur@staffsync.io'],fmt:'pdf',on:true},last:'Last sent Mon 12 Oct'},
      {id:'r2',name:'Monthly timesheets – all sites',type:'timesheet',range:'last',from:'',to:'',brs:[],sites:[],emps:[],group:'employee',cols:T.timesheet.def.slice(),sched:{freq:'monthly',day:'1st',time:'07:00',rec:['payroll@staffsync.io'],fmt:'xlsx',on:true},last:'Last sent 1 Oct'},
      {id:'r3',name:'Flag review – Lyon',type:'flagged',range:'month',from:'',to:'',brs:['Lyon'],sites:[],emps:[],group:'site',cols:T.flagged.def.slice(),sched:null,last:'Never sent'}],
    smenu:null,sv:null,sc:null,del:null,toast:null};
  componentWillUnmount(){clearTimeout(this.tt);}
  say(m){this.setState({toast:m});clearTimeout(this.tt);this.tt=setTimeout(()=>this.setState({toast:null}),2600);}
  rng(){const s=this.state;if(s.range==='custom')return[s.from,s.to];const r=RANGES[s.range];return[r[2],r[3]];}
  data(){
    const s=this.state,spec=T[s.type],[f,t]=this.rng(),n=f&&t?Math.max(0,Math.round((pms(t)-pms(f))/DAYMS)+1):0,cols=spec.cols.filter(c=>s.cols.includes(c[0]));
    if(!n||!cols.length)return{rows:[],cols,n};
    const inSite=k=>(!s.brs.length||s.brs.includes(SN[k][1]))&&(!s.sites.length||s.sites.includes(k));
    let keys=[];
    if(s.group==='employee')keys=EM.filter(e=>inSite(e[1])&&(!s.emps.length||s.emps.includes(e[0]))).map(e=>[e[0],e[0]]);
    else if(s.group==='site')keys=Object.keys(SN).filter(inSite).map(k=>[SN[k][0],k]);
    else if(s.group==='branch')keys=BRS.filter(b=>(!s.brs.length||s.brs.includes(b))&&Object.keys(SN).some(k=>SN[k][1]===b&&inSite(k))).map(b=>[b,b]);
    else for(let i=0;i<Math.min(n,31);i++){const d=pms(f)+i*DAYMS;keys.push([new Date(d).getUTCDate()+' '+MN[new Date(d).getUTCMonth()],String(d)]);}
    const wdAll=Math.max(1,Math.round(n*5/7)),size=k=>s.group==='employee'?1:s.group==='site'?EM.filter(e=>e[1]===k[1]).length||1:s.group==='branch'?EM.filter(e=>SN[e[1]][1]===k[1]).length:EM.filter(e=>inSite(e[1])).length;
    const rows=keys.map(k=>{const w=s.group==='day'?(new Date(+k[1]).getUTCDay()%6===0?0:1):wdAll,mult=size(k),r2=nm=>()=>rnd(s.type+k[1]+nm+f),ctx={};
      spec.cols.forEach(c=>{ctx[c[0]]=c[4](r2(c[0]),w*mult,ctx);});
      return{k:k[0],vals:cols.map(c=>ctx[c[0]])};});
    return{rows,cols,n};
  }
  open(x){this.setState({type:x.type,range:x.range,from:x.from||'2026-10-01',to:x.to||'2026-10-15',brs:x.brs.slice(),sites:x.sites.slice(),emps:x.emps.slice(),group:x.group,cols:x.cols.slice(),chart:'',loaded:x.id,view:true,pop:null,vmode:'table'});}
  snap(){const s=this.state;return{type:s.type,range:s.range,from:s.from,to:s.to,brs:s.brs.slice(),sites:s.sites.slice(),emps:s.emps.slice(),group:s.group,cols:s.cols.slice()};}
  csv(){const D=this.data();return[[GL[this.state.group]].concat(D.cols.map(c=>c[1]+' ('+c[2]+')'))].concat(D.rows.map(r=>[r.k].concat(r.vals.map((v,i)=>fmtV(v,D.cols[i][2]))))).map(l=>l.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');}
  scSum(c){const f=c.freq,r=c.rec.length,when=f==='daily'?'every day':f==='weekly'?'every '+c.day:'on the '+c.day+' of each month';return'Sends '+when+' at '+c.time+' to '+r+' recipient'+(r===1?'':'s')+' as '+({csv:'CSV',xlsx:'Excel',pdf:'PDF'})[c.fmt]+'.';}
  renderVals(){return{r:this.rv()};}
  rv(){
    const s=this.state,T0=T[s.type],D=this.data(),[f,t]=this.rng(),fmtName={csv:'CSV',xlsx:'Excel',pdf:'PDF'};
    const togList=(k,v)=>()=>this.setState(x=>({[k]:x[k].includes(v)?x[k].filter(i=>i!==v):x[k].concat(v)}));
    const pop=k=>ev=>{ev.stopPropagation();this.setState({pop:s.pop===k?null:k});};
    const siteOpts=Object.keys(SN).filter(k=>!s.brs.length||s.brs.includes(SN[k][1]));
    const badRange=!f||!t||pms(t)<pms(f);
    const chartCol=(s.chart&&D.cols.find(c=>c[0]===s.chart))?s.chart:(D.cols[0]?D.cols[0][0]:''),ci=D.cols.findIndex(c=>c[0]===chartCol);
    const top=D.rows.slice().sort((a,b)=>b.vals[ci]-a.vals[ci]).slice(0,12),mx=Math.max(1,...top.map(x=>Math.abs(x.vals[ci]||0)));
    const src=s.group==='day'?D.rows.slice(0,31):top;
    const bars=ci<0?[]:src.map(x=>({l:x.k.split(' ')[0],tip:x.k+': '+fmtV(x.vals[ci],D.cols[ci][2])+' '+D.cols[ci][2],v:fmtV(x.vals[ci],D.cols[ci][2]),h:Math.max(0,Math.abs(x.vals[ci]))/mx*78}));
    const totals=D.cols.map((c,i)=>{const arr=D.rows.map(r=>r.vals[i]),sum=arr.reduce((a,b)=>a+b,0);return fmtV(c[3]?sum:sum/Math.max(1,arr.length),c[2]);});
    const rangeShort=s.range==='custom'?(f&&t?fdate(f)+' – '+fdate(t):'Pick dates'):RANGES[s.range][0];
    const nScope=(s.brs.length?1:0)+(s.sites.length?1:0)+(s.emps.length?1:0);
    const scopeL=nScope?[s.brs.length&&(s.brs.length===1?s.brs[0]:s.brs.length+' branches'),s.sites.length&&(s.sites.length===1?SN[s.sites[0]][0].split(' ')[0]:s.sites.length+' sites'),s.emps.length&&(s.emps.length===1?s.emps[0].split(' ')[0]:s.emps.length+' people')].filter(Boolean).join(' · '):'Everything';
    const sv=s.sv,sc=s.sc;
    const scopeOf=x=>(x.brs.length?x.brs.join(', '):'All branches')+' · '+(x.sites.length?x.sites.length+' sites':'all sites')+' · '+(x.range==='custom'?'custom dates':RANGES[x.range][0].toLowerCase());
    const schedL=x=>!x.sched?'Not scheduled':(x.sched.on?'':'Paused · ')+FREQ[x.sched.freq]+' · '+(x.sched.freq==='weekly'?x.sched.day.slice(0,3)+' ':x.sched.freq==='monthly'?x.sched.day+' ':'')+x.sched.time+' · '+fmtName[x.sched.fmt];
    const nSched=s.saved.filter(x=>x.sched).length;
    const openSc=x=>this.setState({smenu:null,sc:{id:x?x.id:null,name:x?x.name:'',tried:false,freq:x&&x.sched?x.sched.freq:'weekly',day:x&&x.sched?x.sched.day:'Monday',time:x&&x.sched?x.sched.time:'08:00',rec:x&&x.sched?x.sched.rec.slice():['claire.vasseur@staffsync.io'],fmt:x&&x.sched?x.sched.fmt:'pdf',on:x&&x.sched?x.sched.on:true,email:'',eTried:false,existing:!!(x&&x.sched)}});
    const setSc=k=>ev=>{const v=ev.target.value;this.setState(st=>({sc:Object.assign({},st.sc,{[k]:v})}));};
    const addRec=()=>{const st=this.state.sc,e=st.email.trim();if(!e)return;if(!EMAIL.test(e)){this.setState({sc:Object.assign({},st,{eTried:true})});return;}this.setState({sc:Object.assign({},st,{rec:st.rec.includes(e)?st.rec:st.rec.concat(e),email:'',eTried:false})});};
    const eBad=sc&&sc.eTried&&sc.email&&!EMAIL.test(sc.email);
    const sc2=sc&&{for:sc.id?s.saved.find(x=>x.id===sc.id).name:'Current report: '+T0.l,needName:!sc.id,name:sc.name,onName:ev=>{const v=ev.target.value;this.setState(st=>({sc:Object.assign({},st.sc,{name:v})}));},nBd:sc.tried&&!sc.name.trim()?'var(--bad-dot)':'var(--border-strong)',
      freqs:Object.keys(FREQ).map(k=>({l:FREQ[k],bg:sc.freq===k?'var(--accent)':'var(--surface)',fg:sc.freq===k?'#fff':'var(--text-2)',go:()=>this.setState(st=>({sc:Object.assign({},st.sc,{freq:k,day:k==='weekly'?'Monday':k==='monthly'?'1st':''})}))})),
      dayL:sc.freq==='daily'?'On':sc.freq==='weekly'?'Day of week':'Day of month',day:sc.day,onDay:setSc('day'),dayOpts:sc.freq==='daily'?[{v:'',l:'Every day'}]:sc.freq==='weekly'?DOW.map(d=>({v:d,l:d})):['1st','5th','15th','Last day'].map(d=>({v:d,l:d})),time:sc.time,onTime:setSc('time'),
      rec:sc.rec.map(e=>({e,del:()=>this.setState(st=>({sc:Object.assign({},st.sc,{rec:st.sc.rec.filter(x=>x!==e)})}))})),email:sc.email,onEmail:ev=>{const v=ev.target.value;this.setState(st=>({sc:Object.assign({},st.sc,{email:v})}));},
      eBd:eBad?'var(--bad-dot)':'var(--border-strong)',recErr:sc.tried&&!sc.rec.length?'Add at least one recipient':eBad?'Enter a valid email address':'',onKey:ev=>{if(ev.key==='Enter'){ev.preventDefault();addRec();}},addRec,
      fmts:Object.keys(fmtName).map(k=>({l:fmtName[k],bg:sc.fmt===k?'var(--accent)':'var(--surface)',fg:sc.fmt===k?'#fff':'var(--text-2)',go:()=>this.setState(st=>({sc:Object.assign({},st.sc,{fmt:k})}))})),
      togOn:()=>this.setState(st=>({sc:Object.assign({},st.sc,{on:!st.sc.on})})),onBg:sc.on?'var(--accent)':'var(--border-strong)',onL:sc.on?'19px':'2px',sum:this.scSum(sc),hasExisting:sc.existing,
      remove:()=>{this.setState(st=>({saved:st.saved.map(x=>x.id===sc.id?Object.assign({},x,{sched:null,last:'Never sent'}):x),sc:null}));this.say('Schedule removed');}};
    const q=s.q.trim().toLowerCase();
    const cats=CATS.map(([name,ks])=>({name,cards:ks.filter(k=>!q||T[k].l.toLowerCase().includes(q)||T[k].d.toLowerCase().includes(q)).map(k=>({l:T[k].l,d:T[k].d,ico:ICO[k],go:()=>this.setState({type:k,cols:T[k].def.slice(),chart:'',loaded:null,view:true,pop:null,vmode:'table',range:'month',brs:[],sites:[],emps:[],group:'employee'})}))})).filter(g=>g.cards.length);
    const popF=k=>({[k]:pop(k)});
    return{
      isLib:!s.view,isView:s.view,tabLib:s.tab==='lib',tabSaved:s.tab==='saved',stop:ev=>ev.stopPropagation(),closePop:()=>{if(s.pop||s.smenu)this.setState({pop:null,smenu:null});},
      tabs:[['lib','All reports',Object.keys(T).length],['saved','Saved & scheduled',s.saved.length]].map(([k,l,n])=>({l,n,bd:s.tab===k?'var(--accent)':'transparent',fg:s.tab===k?'var(--text)':'var(--text-2)',fw:s.tab===k?600:500,nbg:s.tab===k?'var(--accent)':'var(--neutral-bg)',nfg:s.tab===k?'#fff':'var(--neutral)',go:()=>this.setState({tab:k,smenu:null})})),
      q:s.q,onQ:ev=>this.setState({q:ev.target.value}),cats,noCards:cats.length===0,
      saved:s.saved.map(x=>({name:x.name,scope:scopeOf(x),type:T[x.type].l,sched:schedL(x),sc:x.sched?(x.sched.on?'var(--ok)':'var(--warn)'):'var(--text-3)',last:x.last,open:()=>this.open(x),schedL:x.sched?'Edit schedule':'Schedule email',
        menu:ev=>{ev.stopPropagation();this.setState({smenu:s.smenu===x.id?null:x.id});},menuOpen:s.smenu===x.id,schedule:()=>openSc(x),del:()=>this.setState({del:x.id,smenu:null}),asking:s.del===x.id,askSched:x.sched?' and its email schedule':'',no:()=>this.setState({del:null}),yes:()=>{this.setState(st=>({saved:st.saved.filter(y=>y.id!==x.id),del:null,loaded:st.loaded===x.id?null:st.loaded}));this.say('Report deleted');}})),noSaved:s.saved.length===0,
      back:()=>this.setState({view:false,pop:null,scope:false}),title:T0.l+(s.loaded?' · '+(s.saved.find(x=>x.id===s.loaded)||{name:''}).name:''),
      pop:{export:pop('export'),range:pop('range'),group:pop('group'),cols:pop('cols')},isPop:{export:s.pop==='export',range:s.pop==='range',group:s.pop==='group',cols:s.pop==='cols'},
      exps:[['csv','Export CSV'],['xlsx','Export Excel'],['pdf','Export PDF']].map(([k,l])=>({l,go:()=>{this.setState({pop:null});if(!D.rows.length){this.say('Nothing to export yet');return;}
        if(k==='pdf'){this.say('PDF is being prepared · '+D.rows.length+' rows');return;}
        try{const a=document.createElement('a'),txt=k==='csv'?this.csv():this.csv().replace(/","/g,'\t').replace(/^"|"$/gm,'');a.href=URL.createObjectURL(new Blob([txt],{type:'text/'+(k==='csv'?'csv':'tab-separated-values')}));a.download=T0.l.toLowerCase().replace(/\W+/g,'-')+(k==='csv'?'.csv':'.xls');a.click();this.say('Exported '+D.rows.length+' rows as '+(k==='csv'?'CSV':'Excel'));}catch(e){this.say('Export unavailable');}}})),
      rangeShort,rangeBd:badRange?'var(--bad-dot)':'var(--border-strong)',rangeErr:s.range==='custom'&&badRange?(f&&t?'End date is before the start date.':'Choose both dates.'):'',
      rangeOpts:Object.keys(RANGES).map(k=>({l:RANGES[k][0]+(k!=='custom'?' · '+RANGES[k][1]:''),tick:s.range===k?'✓':'',bg:s.range===k?'var(--accent-soft)':'transparent',go:()=>this.setState({range:k,pop:k==='custom'?'range':null})})),custom:s.range==='custom',from:s.from,to:s.to,onFrom:ev=>this.setState({from:ev.target.value}),onTo:ev=>this.setState({to:ev.target.value}),toBd:f&&t&&pms(t)<pms(f)?'var(--bad-dot)':'var(--border-strong)',
      groupL:GL[s.group],groups:Object.keys(GL).map(k=>({l:GL[k],tick:s.group===k?'✓':'',bg:s.group===k?'var(--accent-soft)':'transparent',go:()=>this.setState({group:k,pop:null})})),
      colN:s.cols.length,colBd:s.cols.length?'var(--border-strong)':'var(--bad-dot)',colErr:s.cols.length?'':'Select at least one column',colList:T0.cols.map(c=>{const on=s.cols.includes(c[0]);return{l:c[1],u:c[2],bg:on?'var(--accent)':'transparent',bd:on?'var(--accent)':'var(--border-strong)',op:on?1:0,go:()=>this.setState(x=>({cols:x.cols.includes(c[0])?x.cols.filter(i=>i!==c[0]):x.cols.concat(c[0])}))};}),
      scopeL,scopeBd:nScope?'var(--accent)':'var(--border-strong)',scopeBg:nScope?'var(--accent-soft)':'var(--surface)',openScope:()=>this.setState({scope:true,pop:null}),scope:s.scope,scopeDone:()=>this.setState({scope:false}),scopeReset:()=>this.setState({brs:[],sites:[],emps:[],empQ:''}),
      brChips:BRS.map(b=>{const on=s.brs.includes(b);return{l:b,bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:()=>this.setState(x=>({brs:on?x.brs.filter(i=>i!==b):x.brs.concat(b),sites:[]}))};}),
      siteChips:siteOpts.map(k=>{const on=s.sites.includes(k);return{l:SN[k][0],bg:on?'var(--accent)':'var(--surface)',fg:on?'#fff':'var(--text-2)',bd:on?'var(--accent)':'var(--border-strong)',go:togList('sites',k)};}),
      empHint:s.emps.length?s.emps.length+' selected':'all',empQ:s.empQ,onEmpQ:ev=>this.setState({empQ:ev.target.value}),empList:EM.filter(e=>e[0].toLowerCase().includes(s.empQ.toLowerCase())).map(e=>{const on=s.emps.includes(e[0]);return{n:e[0],bg:on?'var(--accent)':'transparent',bd:on?'var(--accent)':'var(--border-strong)',op:on?1:0,go:togList('emps',e[0])};}),
      vmodes:[['table','Table'],['chart','Chart']].map(([k,l])=>({l,bg:s.vmode===k?'var(--accent)':'var(--surface)',fg:s.vmode===k?'#fff':'var(--text-2)',go:()=>this.setState({vmode:k})})),isTable:s.vmode==='table',isChart:s.vmode==='chart',
      prevSub:D.rows.length+' '+(s.group==='day'?'days':s.group==='branch'?'branches':s.group+'s')+' · '+(badRange?'':fdate(f)+' – '+fdate(t)+' 2026'),hasRows:D.rows.length>0,noRows:D.rows.length===0,noRowsL:!s.cols.length?'Select at least one column to see the report.':badRange?'Fix the date range to see the report.':'Nothing matches this scope. Widen the scope or reset it.',
      chartCol,onChartCol:ev=>this.setState({chart:ev.target.value}),chartOpts:D.cols.map(c=>({v:c[0],l:c[1]})),bars,chartW:Math.max(300,bars.length*34),
      heads:D.cols.map(c=>({l:c[1]+(c[2]==='%'?'':' ('+c[2]+')')})),rows:D.rows.map(r=>({k:r.k,cells:r.vals.map((v,i)=>fmtV(v,D.cols[i][2]))})),totals,rowN:D.rows.length,rowNoun:s.group==='day'?'days':s.group==='branch'?'branches':s.group+'s',tableW:Math.max(520,180+D.cols.length*120),
      openSave:()=>this.setState({pop:null,sv:{id:s.loaded,name:s.loaded?(s.saved.find(x=>x.id===s.loaded)||{name:''}).name:'',tried:false}}),
      sv:sv?{title:sv.id?'Update saved report':'Save report',name:sv.name,onName:ev=>{const v=ev.target.value;this.setState(st=>({sv:Object.assign({},st.sv,{name:v})}));},bd:sv.tried&&!sv.name.trim()?'var(--bad-dot)':'var(--border-strong)',err:sv.tried&&!sv.name.trim()?'Give the report a name':'',btn:sv.id?'Update':'Save'}:null,
      svNo:()=>this.setState({sv:null}),svGo:()=>{if(!sv.name.trim()){this.setState({sv:Object.assign({},sv,{tried:true})});return;}const cfg=this.snap();
        if(sv.id)this.setState(st=>({saved:st.saved.map(x=>x.id===sv.id?Object.assign({},x,cfg,{name:sv.name.trim()}):x),sv:null}));else{const id='r'+Date.now();this.setState(st=>({saved:st.saved.concat(Object.assign({id,name:sv.name.trim(),sched:null,last:'Never sent'},cfg)),loaded:id,sv:null}));}this.say('Report saved');},
      openSched:()=>openSc(s.loaded?s.saved.find(x=>x.id===s.loaded):null),sc:sc2,scNo:()=>this.setState({sc:null}),
      scGo:()=>{if(!sc.rec.length||(!sc.id&&!sc.name.trim())){this.setState({sc:Object.assign({},sc,{tried:true})});return;}const sched={freq:sc.freq,day:sc.day,time:sc.time,rec:sc.rec,fmt:sc.fmt,on:sc.on};
        if(sc.id)this.setState(st=>({saved:st.saved.map(x=>x.id===sc.id?Object.assign({},x,{sched,last:'Next send '+(sc.freq==='daily'?'tomorrow':sc.freq==='weekly'?sc.day:'1 Nov')}):x),sc:null}));
        else{const id='r'+Date.now(),cfg=this.snap();this.setState(st=>({saved:st.saved.concat(Object.assign({id,name:sc.name.trim(),sched,last:'Next send soon'},cfg)),loaded:id,sc:null}));}this.say('Schedule saved · '+sc.rec.length+' recipient'+(sc.rec.length===1?'':'s'));},
      toast:s.toast
    };
  }
}

class AdminReportsView extends AdminReportsBase {
  view(S) {
    const tr = this.props.tr;
    const { r } = S;
    return (
<>
<div onClick={r?.closePop} className="flex flex-col gap-[16px] relative">
{r?.isLib ? (<>
<div className="flex items-end justify-between gap-[14px] flex-wrap">
<div>
<h1 className="m-[0] text-[24px] font-semibold tracking-[-.02em]">
{tr("reports")}
</h1>
<div className="mt-[4px] text-text-2 text-[13.5px]">
{tr("choose_a_report_to_open")}
</div>
</div>
</div>
<div className="flex gap-[2px] border-b border-solid border-b-border">
{(r?.tabs ?? []).map((t, $index) => (<Fragment key={$index}>
<button onClick={t?.go} className="flex items-center gap-[8px] h-[40px] p-[0_14px] border-0 mb-[-1px] bg-transparent text-[13.5px] cursor-pointer" style={{borderBottom:`2px solid ${t?.bd}`,color:t?.fg,fontWeight:t?.fw}}>
{t?.l}
<span className="min-w-[20px] h-[20px] p-[0_6px] rounded-[10px] grid place-items-center [font:600_11px_'Geist_Mono',monospace]" style={{background:t?.nbg,color:t?.nfg}}>
{t?.n}
</span>
</button>
</Fragment>))}
</div>
{r?.tabLib ? (<>
<div className="flex items-center gap-[8px] h-[36px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text-3 max-w-[340px]">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
<circle cx="11" cy="11" r="7" />
<path d="M21 21l-4.3-4.3" />
</svg>
<input value={r?.q} onInput={r?.onQ} placeholder={tr("search_reports")} className="border-0 [outline:0] bg-transparent text-text text-[13px] w-[100%]" />
</div>
{(r?.cats ?? []).map((g, $index) => (<Fragment key={$index}>
<div className="flex flex-col gap-[10px]">
<div className="text-[12px] font-semibold text-text-3 uppercase tracking-[.05em]">
{g?.name}
</div>
<div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[12px]">
{(g?.cards ?? []).map((c, $index) => (<Fragment key={$index}>
<button onClick={c?.go} className="text-left flex gap-[12px] items-start p-[14px_16px] rounded-[12px] border border-solid border-border bg-surface cursor-pointer shadow-card hover:border-accent">
<span className="w-[34px] h-[34px] rounded-[9px] flex-none grid place-items-center bg-accent-soft text-accent">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d={c?.ico} />
</svg>
</span>
<span>
<span className="block text-[14px] font-semibold text-text">
{c?.l}
</span>
<span className="block text-[12.5px] text-text-3 leading-[1.4] mt-[2px]">
{c?.d}
</span>
</span>
</button>
</Fragment>))}
</div>
</div>
</Fragment>))}
{r?.noCards ? (<>
<div className="p-[40px_16px] text-center text-text-3 text-[13.5px]">
{tr("no_report_matches_p0",{p0:r?.q ?? ''})}
</div>
</>) : null}
</>) : null}
{r?.tabSaved ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div className="min-w-[760px]">
{(r?.saved ?? []).map((s, $index) => (<Fragment key={$index}>
<div className="border-b border-solid border-b-border">
<div className="grid grid-cols-[minmax(200px,1.4fr)_140px_minmax(190px,1.2fr)_200px] gap-[12px] items-center p-[13px_18px] text-[13px]">
<div className="min-w-[0]">
<div className="font-medium">
{s?.name}
</div>
<div className="text-[12px] text-text-3">
{s?.scope}
</div>
</div>
<div>
<span className="p-[3px_9px] rounded-[999px] text-[12px] font-medium bg-accent-soft text-accent">
{s?.type}
</span>
</div>
<div className="flex flex-col gap-[2px]">
<span className="text-[12.5px] font-medium" style={{color:s?.sc}}>
{s?.sched}
</span>
<span className="text-[12px] text-text-3">
{s?.last}
</span>
</div>
<div className="flex gap-[6px] justify-end">
<button onClick={s?.open} className="h-[30px] p-[0_12px] rounded-[8px] border-0 bg-accent text-[color:#fff] text-[12.5px] font-medium cursor-pointer">
{tr("open")}
</button>
<div className="relative">
<button onClick={s?.menu} aria-label={tr("more")} className="w-[30px] h-[30px] rounded-[8px] border border-solid border-border-strong bg-surface text-text-2 cursor-pointer grid place-items-center">
<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
<circle cx="5" cy="12" r="1.8" />
<circle cx="12" cy="12" r="1.8" />
<circle cx="19" cy="12" r="1.8" />
</svg>
</button>
{s?.menuOpen ? (<>
<div onClick={r?.stop} className="absolute right-[0] top-[36px] z-[20] w-[170px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
<button onClick={s?.schedule} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13px] cursor-pointer hover:bg-hover">
{s?.schedL}
</button>
<button onClick={s?.del} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-bad text-[13px] cursor-pointer hover:bg-hover">
{tr("delete")}
</button>
</div>
</>) : null}
</div>
</div>
</div>
{s?.asking ? (<>
<div className="flex gap-[10px] items-center p-[10px_18px] bg-bad-bg text-[13px] text-bad">
{tr("delete_p0_p1",{p0:s?.name ?? '',p1:s?.askSched ?? ''})}
<div className="flex-1" />
<button onClick={s?.yes} className="h-[28px] p-[0_12px] rounded-[8px] border-0 bg-bad-dot text-[color:#fff] text-[12.5px] cursor-pointer">
{tr("delete")}
</button>
<button onClick={s?.no} className="h-[28px] p-[0_10px] border-0 bg-transparent text-bad text-[12.5px] cursor-pointer">
{tr("cancel")}
</button>
</div>
</>) : null}
</div>
</Fragment>))}
{r?.noSaved ? (<>
<div className="p-[44px_16px] text-center text-text-3 text-[13.5px]">
{tr("nothing_saved_yet_open_a")}
</div>
</>) : null}
</div>
</div>
</>) : null}
</>) : null}
{r?.isView ? (<>
<div className="flex items-center gap-[12px] flex-wrap">
<button onClick={r?.back} aria-label={tr("back_to_reports")} className="flex items-center gap-[6px] h-[32px] p-[0_10px_0_6px] border-0 rounded-[8px] bg-transparent text-text-2 text-[13px] cursor-pointer hover:bg-hover">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M15 6l-6 6 6 6" />
</svg>
{tr("reports")}
</button>
<h2 className="m-[0] text-[20px] font-semibold tracking-[-.01em] flex-1 min-w-[160px]">
{r?.title}
</h2>
<button onClick={r?.openSave} className="h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("save")}
</button>
<button onClick={r?.openSched} className="h-[34px] p-[0_13px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] font-medium cursor-pointer">
{tr("schedule")}
</button>
<div className="relative">
<button onClick={r?.pop?.export} className="h-[34px] p-[0_14px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("export")}
</button>
{r?.isPop?.export ? (<>
<div onClick={r?.stop} className="absolute right-[0] top-[40px] z-[20] w-[150px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(r?.exps ?? []).map((e, $index) => (<Fragment key={$index}>
<button onClick={e?.go} className="block w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] bg-transparent text-text text-[13px] cursor-pointer hover:bg-hover">
{e?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
</div>
<div className="flex gap-[8px] flex-wrap items-center p-[10px_12px] bg-surface border border-solid border-border rounded-[12px] shadow-card">
<div className="relative">
<button onClick={r?.pop?.range} className="flex items-center gap-[8px] h-[34px] p-[0_12px] rounded-[9px] bg-surface text-text text-[13px] cursor-pointer" style={{border:`1px solid ${r?.rangeBd}`}}>
<span className="text-text-3">
{tr("dates")}
</span>
<b className="font-medium">
{r?.rangeShort}
</b>
{"▾"}
</button>
{r?.isPop?.range ? (<>
<div onClick={r?.stop} className="absolute left-[0] top-[40px] z-[20] w-[250px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(r?.rangeOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="flex items-center gap-[8px] w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] text-text text-[13px] cursor-pointer hover:bg-hover" style={{background:o?.bg}}>
<span className="w-[14px] text-accent font-bold">
{o?.tick}
</span>
{o?.l}
</button>
</Fragment>))}
{r?.custom ? (<>
<div className="flex gap-[6px] p-[8px_6px_6px]">
<input type="date" value={r?.from} onInput={r?.onFrom} className="flex-1 min-w-[0] h-[32px] p-[0_6px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px]" />
<input type="date" value={r?.to} onInput={r?.onTo} className="flex-1 min-w-[0] h-[32px] p-[0_6px] rounded-[8px] bg-surface text-text text-[12.5px]" style={{border:`1px solid ${r?.toBd}`}} />
</div>
</>) : null}
</div>
</>) : null}
</div>
<div className="relative">
<button onClick={r?.pop?.group} className="flex items-center gap-[8px] h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
<span className="text-text-3">
{tr("group_by")}
</span>
<b className="font-medium">
{r?.groupL}
</b>
{"▾"}
</button>
{r?.isPop?.group ? (<>
<div onClick={r?.stop} className="absolute left-[0] top-[40px] z-[20] w-[190px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(r?.groups ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="flex items-center gap-[8px] w-[100%] text-left h-[34px] p-[0_10px] border-0 rounded-[8px] text-text text-[13px] cursor-pointer hover:bg-hover" style={{background:o?.bg}}>
<span className="w-[14px] text-accent font-bold">
{o?.tick}
</span>
{o?.l}
</button>
</Fragment>))}
</div>
</>) : null}
</div>
<button onClick={r?.openScope} className="flex items-center gap-[8px] h-[34px] p-[0_12px] rounded-[9px] text-text text-[13px] cursor-pointer" style={{border:`1px solid ${r?.scopeBd}`,background:r?.scopeBg}}>
<span className="text-text-3">
{tr("scope")}
</span>
<b className="font-medium">
{r?.scopeL}
</b>
{"▾"}
</button>
<div className="relative">
<button onClick={r?.pop?.cols} className="flex items-center gap-[8px] h-[34px] p-[0_12px] rounded-[9px] bg-surface text-text text-[13px] cursor-pointer" style={{border:`1px solid ${r?.colBd}`}}>
<span className="text-text-3">
{tr("columns")}
</span>
<b className="font-medium">
{r?.colN}
</b>
{"▾"}
</button>
{r?.isPop?.cols ? (<>
<div onClick={r?.stop} className="absolute left-[0] top-[40px] z-[20] w-[240px] p-[6px] rounded-[12px] bg-surface border border-solid border-border shadow-pop">
{(r?.colList ?? []).map((c, $index) => (<Fragment key={$index}>
<div onClick={c?.go} className="flex items-center gap-[10px] p-[7px_10px] rounded-[8px] cursor-pointer text-[13px] hover:bg-hover">
<div className="w-[16px] h-[16px] rounded-[4px] grid place-items-center text-[color:#fff]" style={{border:`1.5px solid ${c?.bd}`,background:c?.bg}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{opacity:c?.op}}>
<path d="M5 12l5 5 9-10" />
</svg>
</div>
{c?.l}
<span className="ml-[auto] text-[11.5px] text-text-3">
{c?.u}
</span>
</div>
</Fragment>))}
<div className="p-[4px_10px_2px] text-[12px] text-bad">
{r?.colErr}
</div>
</div>
</>) : null}
</div>
<div className="flex-1" />
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(r?.vmodes ?? []).map((v, $index) => (<Fragment key={$index}>
<button onClick={v?.go} className="h-[34px] p-[0_14px] border-0 text-[13px] font-medium cursor-pointer" style={{background:v?.bg,color:v?.fg}}>
{v?.l}
</button>
</Fragment>))}
</div>
</div>
{r?.rangeErr ? (<>
<div className="text-[12.5px] text-bad">
{r?.rangeErr}
</div>
</>) : null}
{r?.hasRows ? (<>
<div className="flex items-center gap-[12px] flex-wrap">
<span className="text-[13px] text-text-2">
{r?.prevSub}
</span>
<div className="flex-1" />
{r?.isChart ? (<>
<label className="flex items-center gap-[8px] text-[12.5px] text-text-2">
{tr("metric")}
<select value={r?.chartCol} onChange={r?.onChartCol} className="h-[30px] p-[0_8px] rounded-[8px] border border-solid border-border-strong bg-surface text-text text-[12.5px]">
{(r?.chartOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
</>) : null}
</div>
{r?.isChart ? (<>
<div className="border border-solid border-border rounded-[12px] p-[18px_16px_10px] bg-surface shadow-card overflow-x-auto">
<div className="flex items-end gap-[8px] h-[260px]" style={{minWidth:`${r?.chartW}px`}}>
{(r?.bars ?? []).map((b, $index) => (<Fragment key={$index}>
<div title={b?.tip} className="flex-1 min-w-[26px] h-[100%] flex flex-col justify-end items-center gap-[4px]">
<span className="[font:11px_'Geist_Mono',monospace] text-text-3">
{b?.v}
</span>
<div className="w-[100%] max-w-[48px] min-h-[2px] rounded-[5px_5px_0_0] bg-accent" style={{height:`${b?.h}%`}} />
</div>
</Fragment>))}
</div>
<div className="flex gap-[8px] mt-[6px]" style={{minWidth:`${r?.chartW}px`}}>
{(r?.bars ?? []).map((b, $index) => (<Fragment key={$index}>
<div className="flex-1 min-w-[26px] text-center text-[11px] text-text-3 whitespace-nowrap overflow-hidden text-ellipsis">
{b?.l}
</div>
</Fragment>))}
</div>
</div>
</>) : null}
{r?.isTable ? (<>
<div className="bg-surface border border-solid border-border rounded-[12px] shadow-card overflow-x-auto">
<div style={{minWidth:`${r?.tableW}px`}}>
<div className="flex bg-surface-2 border-b border-solid border-b-border text-[11.5px] font-semibold text-text-3 uppercase tracking-[.04em] rounded-[12px_12px_0_0]">
<div className="flex-[1.6] min-w-[0] p-[10px_16px]">
{r?.groupL}
</div>
{(r?.heads ?? []).map((h, $index) => (<Fragment key={$index}>
<div className="flex-1 min-w-[0] p-[10px_16px] text-right">
{h?.l}
</div>
</Fragment>))}
</div>
{(r?.rows ?? []).map((x, $index) => (<Fragment key={$index}>
<div className="flex border-b border-solid border-b-border text-[13px] hover:bg-hover">
<div className="flex-[1.6] min-w-[0] p-[10px_16px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
{x?.k}
</div>
{(x?.cells ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="flex-1 min-w-[0] p-[10px_16px] text-right [font-family:'Geist_Mono',monospace] text-[12.5px] text-text-2">
{c}
</div>
</Fragment>))}
</div>
</Fragment>))}
<div className="flex bg-surface-2 text-[13px] font-semibold rounded-[0_0_12px_12px]">
<div className="flex-[1.6] min-w-[0] p-[11px_16px]">
{tr("total_p0_p1",{p0:r?.rowN ?? '',p1:r?.rowNoun ?? ''})}
</div>
{(r?.totals ?? []).map((c, $index) => (<Fragment key={$index}>
<div className="flex-1 min-w-[0] p-[11px_16px] text-right [font-family:'Geist_Mono',monospace] text-[12.5px]">
{c}
</div>
</Fragment>))}
</div>
</div>
</div>
</>) : null}
</>) : null}
{r?.noRows ? (<>
<div className="p-[48px_16px] text-center text-text-3 text-[13.5px] border border-dashed border-border-strong rounded-[12px] bg-surface">
{r?.noRowsL}
</div>
</>) : null}
</>) : null}
{r?.scope ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div onClick={r?.stop} className="w-[100%] max-w-[520px] max-h-[calc(100vh_-_32px)] bg-surface rounded-[14px] shadow-pop flex flex-col overflow-hidden">
<div className="p-[16px_20px] border-b border-solid border-b-border flex justify-between items-center">
<div>
<div className="font-semibold text-[16px]">
{tr("report_scope")}
</div>
<div className="text-[12.5px] text-text-3">
{tr("leave_a_section_empty_to")}
</div>
</div>
<button onClick={r?.scopeDone} aria-label={tr("close")} className="w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-text-2 text-[20px] cursor-pointer">
{"×"}
</button>
</div>
<div className="p-[18px_20px] overflow-y-auto flex flex-col gap-[16px]">
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("branches")}
<div className="flex gap-[6px] flex-wrap">
{(r?.brChips ?? []).map((c, $index) => (<Fragment key={$index}>
<button onClick={c?.go} className="h-[30px] p-[0_12px] rounded-[999px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${c?.bd}`,background:c?.bg,color:c?.fg}}>
{c?.l}
</button>
</Fragment>))}
</div>
</div>
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("sites")}
<div className="flex gap-[6px] flex-wrap">
{(r?.siteChips ?? []).map((c, $index) => (<Fragment key={$index}>
<button onClick={c?.go} className="h-[30px] p-[0_12px] rounded-[999px] text-[12.5px] font-medium cursor-pointer" style={{border:`1px solid ${c?.bd}`,background:c?.bg,color:c?.fg}}>
{c?.l}
</button>
</Fragment>))}
</div>
</div>
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("employees")}{" "}
<span className="font-normal text-text-3">
{"· "}{r?.empHint}
</span>
<div className="border border-solid border-border-strong rounded-[10px] overflow-hidden">
<input value={r?.empQ} onInput={r?.onEmpQ} placeholder={tr("search_employees")} className="w-[100%] box-border h-[34px] p-[0_12px] border-0 border-b border-solid border-b-border bg-surface-2 text-text text-[13px] [outline:none]" />
<div className="max-h-[150px] overflow-y-auto">
{(r?.empList ?? []).map((p, $index) => (<Fragment key={$index}>
<div onClick={p?.go} className="flex items-center gap-[10px] p-[7px_12px] cursor-pointer text-[13px] font-normal hover:bg-hover">
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
</div>
<div className="p-[12px_20px] border-t border-solid border-t-border flex gap-[8px] items-center">
<button onClick={r?.scopeReset} className="mr-[auto] h-[34px] p-[0_10px] border-0 bg-transparent text-accent text-[13px] cursor-pointer">
{tr("reset_to_everything")}
</button>
<button onClick={r?.scopeDone} className="h-[36px] p-[0_18px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("done")}
</button>
</div>
</div>
</div>
</>) : null}
{r?.sv ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[400px] bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[14px]">
<div className="font-semibold text-[16px]">
{r?.sv?.title}
</div>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("report_name")}
<input value={r?.sv?.name} onInput={r?.sv?.onName} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${r?.sv?.bd}`}} />
<span className="text-[12px] text-bad font-normal">
{r?.sv?.err}
</span>
</label>
<div className="text-[12.5px] text-text-3">
{tr("keeps_the_dates_scope_grouping")}
</div>
<div className="flex gap-[8px] justify-end">
<button onClick={r?.svNo} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={r?.svGo} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{r?.sv?.btn}
</button>
</div>
</div>
</div>
</>) : null}
{r?.sc ? (<>
<div className="fixed inset-[0] bg-overlay z-[55] grid place-items-center p-[16px]">
<div className="w-[100%] max-w-[480px] max-h-[calc(100vh_-_32px)] overflow-y-auto bg-surface rounded-[14px] shadow-pop p-[20px] flex flex-col gap-[14px]">
<div>
<div className="font-semibold text-[16px]">
{tr("schedule_email_delivery")}
</div>
<div className="text-[12.5px] text-text-3 mt-[2px]">
{r?.sc?.for}
</div>
</div>
{r?.sc?.needName ? (<>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("report_name")}
<input value={r?.sc?.name} onInput={r?.sc?.onName} className="h-[36px] p-[0_11px] rounded-[9px] bg-surface text-text text-[13.5px] [outline:none]" style={{border:`1px solid ${r?.sc?.nBd}`}} />
</label>
</>) : null}
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("frequency")}
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(r?.sc?.freqs ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="flex-1 h-[34px] border-0 text-[13px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
</div>
<div className="grid grid-cols-[1fr_1fr] gap-[12px]">
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{r?.sc?.dayL}
<select value={r?.sc?.day} onChange={r?.sc?.onDay} className="h-[36px] p-[0_9px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px]">
{(r?.sc?.dayOpts ?? []).map((o, $index) => (<Fragment key={$index}>
<option value={o?.v}>
{o?.l}
</option>
</Fragment>))}
</select>
</label>
<label className="flex flex-col gap-[5px] text-[12.5px] font-medium text-text-2">
{tr("send_at")}
<input type="time" value={r?.sc?.time} onInput={r?.sc?.onTime} className="h-[36px] p-[0_8px] rounded-[9px] border border-solid border-border-strong bg-surface text-text" />
</label>
</div>
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("recipients")}
<div className="flex gap-[6px] flex-wrap">
{(r?.sc?.rec ?? []).map((c, $index) => (<Fragment key={$index}>
<span className="flex items-center gap-[6px] p-[4px_6px_4px_10px] rounded-[999px] bg-neutral-bg text-neutral text-[12.5px] font-normal">
{c?.e}
<button onClick={c?.del} aria-label={tr("remove")} className="w-[18px] h-[18px] border-0 rounded-[50%] bg-transparent text-neutral cursor-pointer text-[14px] leading-[1]">
{"×"}
</button>
</span>
</Fragment>))}
</div>
<div className="flex gap-[8px]">
<input value={r?.sc?.email} onInput={r?.sc?.onEmail} onKeyDown={r?.sc?.onKey} placeholder={tr("name_company_com")} className="flex-1 h-[34px] p-[0_10px] rounded-[9px] bg-surface text-text text-[13px] [outline:none]" style={{border:`1px solid ${r?.sc?.eBd}`}} />
<button onClick={r?.sc?.addRec} className="h-[34px] p-[0_12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("add")}
</button>
</div>
<span className="text-[12px] text-bad font-normal">
{r?.sc?.recErr}
</span>
</div>
<div className="flex flex-col gap-[6px] text-[12.5px] font-medium text-text-2">
{tr("format")}
<div className="flex border border-solid border-border-strong rounded-[9px] overflow-hidden">
{(r?.sc?.fmts ?? []).map((o, $index) => (<Fragment key={$index}>
<button onClick={o?.go} className="flex-1 h-[34px] border-0 text-[13px] cursor-pointer" style={{background:o?.bg,color:o?.fg}}>
{o?.l}
</button>
</Fragment>))}
</div>
</div>
<div className="flex items-center justify-between gap-[12px]">
<div>
<div className="text-[13.5px] font-medium">
{tr("active")}
</div>
<div className="text-[12.5px] text-text-3">
{tr("paused_schedules_keep_their_sett")}
</div>
</div>
<div onClick={r?.sc?.togOn} role="switch" className="w-[40px] h-[23px] rounded-[12px] relative cursor-pointer flex-none" style={{background:r?.sc?.onBg}}>
<div className="absolute top-[2px] w-[19px] h-[19px] rounded-[50%] bg-[color:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,.25)]" style={{left:r?.sc?.onL}} />
</div>
</div>
<div className="p-[10px_12px] rounded-[10px] bg-surface-2 border border-solid border-border text-[12.5px] text-text-2">
{r?.sc?.sum}
</div>
<div className="flex gap-[8px] justify-end items-center">
{r?.sc?.hasExisting ? (<>
<button onClick={r?.sc?.remove} className="mr-[auto] h-[36px] p-[0_12px] border-0 bg-transparent text-bad text-[13px] cursor-pointer">
{tr("remove_schedule")}
</button>
</>) : null}
<button onClick={r?.scNo} className="h-[36px] p-[0_14px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13px] cursor-pointer">
{tr("cancel")}
</button>
<button onClick={r?.scGo} className="h-[36px] p-[0_16px] rounded-[9px] border-0 bg-accent text-[color:#fff] text-[13px] font-medium cursor-pointer">
{tr("save_schedule")}
</button>
</div>
</div>
</div>
</>) : null}
{r?.toast ? (<>
<div className="fixed bottom-[24px] left-[50%] [transform:translateX(-50%)] z-[70] p-[11px_16px] rounded-[10px] bg-text text-bg text-[13px] shadow-pop">
{r?.toast}
</div>
</>) : null}
</div>
</>
    );
  }
}

export default function AdminReports(props: any) {
  const tr = useTranslations('AdminReports');
  return <AdminReportsView {...props} tr={tr} />;
}
