'use client';
/* eslint-disable */
// @ts-nocheck
import { useEffect } from 'react';

/** Any native <select> with 7+ options opens a searchable popover. Mount once in the root layout. */
export function SearchableSelects() {
  useEffect(() => {
    const self: any = {};

    const MIN=7;let pop=null,cleanup=null;
    const close=()=>{if(pop){pop.remove();pop=null;}if(cleanup){cleanup();cleanup=null;}};
    const setVal=(sel,v)=>{Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(sel,v);sel.dispatchEvent(new Event('change',{bubbles:true}));};
    const open=sel=>{
      close();
      const opts=Array.from(sel.options).filter(o=>!o.disabled);
      const host=sel.closest('[data-theme]')||document.body,r=sel.getBoundingClientRect();
      const below=window.innerHeight-r.bottom>300,w=Math.max(r.width,220);
      pop=document.createElement('div');
      pop.setAttribute('data-ss-pop','1');
      pop.style.cssText='position:fixed;z-index:300;left:'+Math.min(r.left,window.innerWidth-w-8)+'px;'+(below?'top:'+(r.bottom+4)+'px':'bottom:'+(window.innerHeight-r.top+4)+'px')+';width:'+w+'px;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-lg);overflow:hidden;font-family:inherit';
      const inp=document.createElement('input');
      inp.placeholder='Search…';inp.setAttribute('aria-label','Search options');
      inp.style.cssText='width:100%;box-sizing:border-box;height:38px;padding:0 12px;border:0;border-bottom:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:13px;outline:none';
      const list=document.createElement('div');list.setAttribute('role','listbox');list.style.cssText='max-height:240px;overflow-y:auto;padding:4px';
      pop.appendChild(inp);pop.appendChild(list);host.appendChild(pop);
      let act=0,shown=[];
      const render=()=>{
        const q=inp.value.trim().toLowerCase();
        shown=opts.filter(o=>!q||o.text.toLowerCase().includes(q));
        if(act>=shown.length)act=Math.max(0,shown.length-1);
        list.innerHTML='';
        if(!shown.length){const e=document.createElement('div');e.textContent='No matches';e.style.cssText='padding:12px;font-size:13px;color:var(--text-3);text-align:center';list.appendChild(e);return;}
        shown.forEach((o,i)=>{const it=document.createElement('div');it.setAttribute('role','option');it.textContent=o.text;
          const cur=o.value===sel.value;
          it.style.cssText='padding:8px 10px;border-radius:8px;font-size:13px;cursor:pointer;color:var(--text);display:flex;justify-content:space-between;gap:8px;background:'+(i===act?'var(--hover)':'transparent')+(cur?';font-weight:600':'');
          if(cur){const c=document.createElement('span');c.textContent='✓';c.style.color='var(--accent)';it.appendChild(c);}
          it.onmouseenter=()=>{act=i;render2();};it.onmousedown=ev=>{ev.preventDefault();pick(o);};list.appendChild(it);});
      };
      const render2=()=>{Array.from(list.children).forEach((c,i)=>{c.style.background=i===act?'var(--hover)':'transparent';});};
      const pick=o=>{close();setVal(sel,o.value);sel.focus();};
      inp.oninput=()=>{act=0;render();};
      inp.onkeydown=ev=>{
        if(ev.key==='Escape'){ev.preventDefault();close();sel.focus();}
        else if(ev.key==='ArrowDown'){ev.preventDefault();act=Math.min(shown.length-1,act+1);render2();const el=list.children[act];if(el&&el.scrollIntoView===undefined){}if(el)list.scrollTop=Math.max(0,el.offsetTop-80);}
        else if(ev.key==='ArrowUp'){ev.preventDefault();act=Math.max(0,act-1);render2();const el=list.children[act];if(el)list.scrollTop=Math.max(0,el.offsetTop-80);}
        else if(ev.key==='Enter'){ev.preventDefault();if(shown[act])pick(shown[act]);}
      };
      render();
      const idx=shown.findIndex(o=>o.value===sel.value);if(idx>0){act=idx;render();setTimeout(()=>{const el=list.children[idx];if(el)list.scrollTop=Math.max(0,el.offsetTop-80);},0);}
      setTimeout(()=>inp.focus(),0);
      const out=ev=>{if(pop&&!pop.contains(ev.target))close();};
      const away=ev=>{if(pop&&!pop.contains(ev.target))close();};
      document.addEventListener('mousedown',out,true);window.addEventListener('resize',close);window.addEventListener('scroll',away,true);
      cleanup=()=>{document.removeEventListener('mousedown',out,true);window.removeEventListener('resize',close);window.removeEventListener('scroll',away,true);};
    };
    const isBig=t=>t&&t.tagName==='SELECT'&&!t.disabled&&!t.multiple&&t.options.length>=MIN;
    self._ssDown=ev=>{const s=ev.target&&ev.target.closest?ev.target.closest('select'):null;if(isBig(s)&&!(pop&&pop.contains(ev.target))){ev.preventDefault();ev.stopPropagation();s.focus();open(s);}};
    self._ssKey=ev=>{const s=ev.target;if(isBig(s)&&[' ','Enter','ArrowDown','ArrowUp'].includes(ev.key)){ev.preventDefault();open(s);}};
    document.addEventListener('mousedown',self._ssDown,true);document.addEventListener('keydown',self._ssKey,true);
    self._ssOff=()=>{close();document.removeEventListener('mousedown',self._ssDown,true);document.removeEventListener('keydown',self._ssKey,true);};
  
    return () => self._ssOff && self._ssOff();
  }, []);
  return null;
}
