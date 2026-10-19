if (document.getElementById('cityborn-advisor')) return;
const supported = [...document.scripts].some(s=>s.src.endsWith('/assets/index-C_XxXzM6.js'));
const host=document.createElement('div'); host.id='cityborn-advisor';
const shadow=host.attachShadow({mode:'open'}); document.body.append(host);
shadow.innerHTML=`<style>
:host{position:fixed;right:12px;top:12px;z-index:2147483647;color:#eee;font:13px/1.45 system-ui;max-width:calc(100vw - 24px)}
*{box-sizing:border-box}section{width:370px;max-width:100%;max-height:88vh;overflow:auto;background:#161a22;border:1px solid #788295;border-radius:10px;padding:12px;box-shadow:0 6px 30px #0009}
header{display:flex;align-items:center;justify-content:space-between}h3{margin:0}button,input,select{font:inherit;color:inherit;background:#252d3b;border:1px solid #768298;border-radius:4px;padding:6px}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}input[type=text],input[type=search]{width:100%}input[type=checkbox]{margin-right:6px}label{display:block;margin:6px 0}.row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.row>*{flex:1}small{color:#b9c1d0}#goals{max-height:180px;overflow:auto;border:1px solid #445063;padding:5px}#goals label{font-size:12px}#status{white-space:pre-wrap;margin:8px 0;color:#d7e6ff}#advice{max-height:160px;overflow:auto;white-space:pre-wrap}summary{cursor:pointer;padding:6px 0}#min{flex:0}#badge{display:none}a{color:#a9caff}
</style><button id="badge">Life Advisor</button><section id="panel">
<header><h3>Cityborn Life Advisor</h3><button id="min" aria-label="Minimize">−</button></header>
<small>Native engine • 3-year / 12-choice lookahead. Best evaluated choice, not a guaranteed optimal life.</small>
<div class="row"><button id="advise">Evaluate choices</button><button id="auto">Start Auto</button><button id="stop">Stop</button></div>
<div id="status" role="status">Loading…</div><div id="advice"></div>
<details open><summary>Achievement & trait goals (<span id="selected">0</span>)</summary>
<small>All selected goals must match. Traits must be present at the checked state. Some goals conflict.</small>
<input id="filter" type="search" placeholder="Search achievements, traits, or IDs" aria-label="Filter goals"><div id="goals"></div>
</details>
<details open><summary>Filtered random seeds</summary>
<div class="row"><label>Check<select id="scope"><option value="birth">At birth (fast)</option><option value="life">At end of simulated life</option></select></label><label>Try seeds<input id="count" type="number" min="1" max="500" value="25" style="width:100%"></label></div>
<label>Name (blank = seeded name)<input id="name" type="text" maxlength="12"></label>
<label>Gender <select id="gender"><option value="m">Male</option><option value="f">Female</option></select></label>
<button id="search">Find matching seed</button><div id="found"></div>
<div class="row"><button id="start" disabled>Start found seed</button><button id="export" disabled>Export seed & route</button></div>
<small>Search stays in a local worker and does not touch your save. Starting requires the game's home screen. Full-life matches include a replayable choice route.</small>
</details></section>`;
const $=id=>shadow.getElementById(id);
let worker,sequence=0,pending=new Map(),auto=false,busy=false,searching=false,found=null,replay=null,pausedByUs=null;
let latest=null;
const chosen=new Set();
const lang=()=>['en','ja','ko'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
const say=text=>{$('status').textContent=text;};
const signature=s=>{
  const prompt=s.prompt?{...s.prompt}:null;
  if(prompt)delete prompt.remainingMs;
  return JSON.stringify([s.seed,s.age,s.rngState,s.cursor,prompt]);
};
function bridge() {
  const root=document.getElementById('root');
  const key=root && Object.keys(root).find(k=>k.startsWith('__reactContainer$'));
  const internal=key && root[key];
  const start=internal?.stateNode?.current || internal;
  const stack=start?[start]:[]; let runtime=null,life=null,home=null;
  while(stack.length) {
    const f=stack.pop();
    const props=f.memoizedProps;
    if(props?.life?.choose) life=props.life;
    if(typeof props?.onStart==='function' && typeof props?.onResume==='function') home=props;
    for(let h=f.memoizedState;h && typeof h==='object';h=h.next) {
      const c=h.memoizedState?.current;
      if(c && Object.hasOwn(c,'state') && Object.hasOwn(c,'progress') && Object.hasOwn(c,'paused') && Object.hasOwn(c,'speed')) runtime=c;
    }
    if(f.sibling) stack.push(f.sibling);
    if(f.child) stack.push(f.child);
  }
  return {runtime,life,home};
}
function makeWorker() {
  const code=`${nativeEngine.toString()}\n${makePlanner.toString()}\n(${workerMain.toString()})();`;
  const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  worker=new Worker(url); URL.revokeObjectURL(url);
  worker.onmessage=({data:m})=>{
    const p=pending.get(m.id); if(!p)return;
    if(m.progress!=null) {say(`Searching ${m.progress}/${$('count').value} seeds; latest matched ${m.matches}/${chosen.size} goals.`);return;}
    pending.delete(m.id);
    if(m.error)p.reject(Error(m.error));else p.resolve(m);
  };
  worker.onerror=e=>{for(const p of pending.values())p.reject(Error(e.message));pending.clear();stop('Worker failed: '+e.message);};
}
function request(type,args={}) {
  const id=++sequence;
  return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,type,lang:lang(),...args});});
}
function releasePause() {
  if(pausedByUs) {
    const b=bridge();
    if(b.runtime===pausedByUs && b.runtime.paused && b.life) b.life.togglePause();
    pausedByUs=null;
  }
}
function stop(message='Stopped. Manual control restored.') {
  auto=false; $('auto').textContent='Start Auto';
  releasePause();
  if(pending.size || searching) {
    worker.terminate();for(const p of pending.values())p.reject(Error('Cancelled'));pending.clear();makeWorker();
  }
  searching=false;busy=false; $('search').disabled=false;say(message);
}
function invalidate() {
  stop('Goals changed. Evaluate again or search new seeds.');
  found=null; replay=null;latest=null;$('found').textContent='';$('start').disabled=true;$('export').disabled=true;
  $('selected').textContent=chosen.size;
}
async function evaluate(apply=false) {
  if(busy||searching)return;
  const b=bridge(),s=b.runtime?.state;
  if(!s || s.dead || !s.prompt) {if(!auto)say('Waiting for an active choice.');return;}
  if(!b.life) {stop('Game controls unavailable. Reload the page.');return;}
  busy=true;
  try {
    if(b.runtime.auto)b.life.toggleAuto();
    if(!b.runtime.paused) {b.life.togglePause();pausedByUs=b.runtime;}
    const snap=JSON.parse(JSON.stringify(s)),sig=signature(s);
    let r;
    if(replay && replay.index<replay.route.length) {
      const step=replay.route[replay.index];
      if(step.signature!==sig) {replay=null;stop('Seed replay diverged (settings, language, or manual choice changed). Evaluate again to continue.');return;}
      r={signature:sig,best:step.i,rows:[{i:step.i,label:step.i<0?'Continue / leave blank / let pass':s.prompt.choices[step.i]?.label}],replay:true};
    } else r=(await request('recommend',{state:snap,goals:[...chosen]})).result;
    const current=bridge();
    if(current.runtime?.state!==s || signature(s)!==sig) {latest=null;say('Choice changed during evaluation. Evaluate again.');return;}
    latest=r;
    $('advice').textContent=r.rows.map((v,i)=>`${i===0?'★':' '} ${v.i+1 || '–'}. ${v.label}${v.age!=null?` → age ${v.age}, ${v.dead?'life ended':'alive'}, goals ${v.matched}/${chosen.size}`:''}`).join('\n');
    say(r.replay?'Following the matching seed’s verified simulation route.':'Choices ranked using exact seeded outcomes and bounded lookahead.');
    if(apply && auto) {
      if(['reflect','name','color'].includes(s.prompt.kind)) current.life.submitReflection('');
      else current.life.choose(r.best);
      if(r.replay) replay.index++;
    }
  } catch(e) {if(e.message!=='Cancelled')stop('Evaluation failed: '+e.message);}
  finally {releasePause();busy=false;}
}
$('min').onclick=()=>{$('panel').style.display='none';$('badge').style.display='block';};
$('badge').onclick=()=>{$('panel').style.display='block';$('badge').style.display='none';};
$('stop').onclick=()=>stop();
$('advise').onclick=()=>evaluate();
$('auto').onclick=()=>{
  if(auto)return stop();
  if(searching)return say('Stop the seed search first.');
  const b=bridge();
  if(!b.runtime?.state || b.runtime.state.dead)return say('Start or resume a life first.');
  if(b.runtime.auto)b.life.toggleAuto();
  auto=true;$('auto').textContent='Auto running';say('Auto active for this life. Escape or manual game interaction stops it.');evaluate(true);
};
$('scope').onchange=()=>{$('count').value=$('scope').value==='life'?'5':'25';};
$('filter').oninput=()=>{
  const q=$('filter').value.toLowerCase();
  for(const el of $('goals').children)el.hidden=!el.textContent.toLowerCase().includes(q);
};
$('search').onclick=async()=>{
  if(!chosen.size)return say('Select at least one goal.');
  stop('Searching seeds…'); found=null;replay=null;$('found').textContent='';$('start').disabled=true;$('export').disabled=true;
  searching=true;$('search').disabled=true;
  const goals=[...chosen],scope=$('scope').value;
  const count=Math.max(1,Math.min(500,Math.floor(Number($('count').value)||25)));$('count').value=count;
  try {
    const m=await request('search',{count,goals,scope,options:{name:$('name').value.trim(),gender:$('gender').value}});
    if(m.result) {
      found={...m.result,goals,scope,lang:lang()};
      $('found').textContent=`Seed ${found.seed} • ${found.state.dead?'ended at':'age'} ${found.state.age} • matched ${goals.length}/${goals.length} • ${found.route.length} choices`;
      $('start').disabled=false;$('export').disabled=false;
      say('Matching seed found. Start it from the home screen; enable Auto to follow its route.');
    } else say(`No complete match in ${count} attempts. Best partial: ${m.best?.matches||0}/${goals.length}. Try more seeds, fewer goals, or full-life search for later achievements.`);
  }catch(e){if(e.message!=='Cancelled')say('Search failed: '+e.message);}
  finally{searching=false;$('search').disabled=false;}
};
$('start').onclick=()=>{
  if(!found)return;
  const b=bridge();
  if(!b.home)return say('Return to the game’s home screen first. Your current life will not be replaced.');
  if(lang()!==found.lang)return say('Restore the language used for the seed search first.');
  replay=found.scope==='life'?{route:found.route,index:0}:null;
  b.home.onStart(found.options);say(`Started seed ${found.seed}. Enable Auto to follow the matching route.`);
};
$('export').onclick=()=>{
  if(!found)return;
  const blob=new Blob([JSON.stringify({version:1,source:'index-C_XxXzM6.js',...found},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`cityborn-${found.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.addEventListener('pointerdown',e=>{if(auto && !e.composedPath().includes(host))stop('Auto stopped by manual game interaction.');},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')stop();
  else if(auto && !e.composedPath().includes(host))stop('Auto stopped by manual keyboard input.');
},true);
if(!supported) {
  for(const el of shadow.querySelectorAll('button:not(#min):not(#badge),input,select'))el.disabled=true;
  say('Game version changed. This script supports index-C_XxXzM6.js only; update the engine before using advice.');
} else {
  makeWorker();
  request('catalog').then(({result:c})=>{
    const entries=[...c.records.map(r=>({key:'record:'+r.key,label:`Achievement: ${r.label[lang()]||r.label.en} [${r.key}]`,hint:r.hint[lang()]||r.hint.en})),...c.flags.map(([key,label])=>({key:'flag:'+key,label:`Trait: ${label} [${key}]`,hint:'Must be present at the checked state.'}))];
    for(const item of entries) {
      const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=item.key;
      input.onchange=()=>{input.checked?chosen.add(item.key):chosen.delete(item.key);invalidate();};
      label.title=item.hint;label.append(input,document.createTextNode(item.label));$('goals').append(label);
    }
    say(`Ready. ${c.records.length} achievements and ${c.flags.length} traits. Select goals or evaluate the current choice.`);
  }).catch(e=>say('Initialization failed: '+e.message));
  setInterval(()=>{
    if(!auto)return;
    const b=bridge();
    if(!b.runtime?.state || b.runtime.state.dead) {stop('Life ended. Auto stopped.');return;}
    evaluate(true);
  },300);
}
