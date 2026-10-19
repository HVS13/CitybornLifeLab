if (document.getElementById('cityborn-advisor')) return;
const C=advisorCommon();
const supported=[...document.scripts].some(s=>s.src.endsWith('/assets/'+C.source));
const host=document.createElement('div');host.id='cityborn-advisor';
const shadow=host.attachShadow({mode:'open'});document.body.append(host);
shadow.innerHTML=`<style>
:host{position:fixed;right:12px;top:12px;z-index:2147483647;color:#eee;font:13px/1.45 system-ui;max-width:calc(100vw - 24px)}
*{box-sizing:border-box}section{width:390px;max-width:100%;max-height:88vh;overflow:auto;background:#161a22;border:1px solid #788295;border-radius:10px;padding:12px;box-shadow:0 6px 30px #0009}
header{display:flex;align-items:center;justify-content:space-between;cursor:move;touch-action:none}h3{margin:0}button,input,select{font:inherit;color:inherit;background:#252d3b;border:1px solid #768298;border-radius:4px;padding:6px}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}input[type=text],input[type=search],select{max-width:100%;width:100%}input[type=checkbox]{margin-right:6px}label{display:block;margin:6px 0}.row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.row>*{flex:1;min-width:0}small{color:#b9c1d0}.hint{display:block;color:#aeb8ca;font-size:11px;margin-left:22px}#goals{max-height:180px;overflow:auto;border:1px solid #445063;padding:5px}#goals label{font-size:12px}#status,#found,#warning{white-space:pre-wrap;margin:8px 0;color:#d7e6ff}#warning{color:#efc785}#advice{max-height:200px;overflow:auto;white-space:pre-wrap}summary{cursor:pointer;padding:6px 0}#min{width:auto}#badge{display:none}#file{display:none}
</style><button id="badge">Life Advisor</button><section id="panel">
<header id="drag" tabindex="0" aria-label="Move advisor: drag or use arrow keys; Home resets position"><h3>Cityborn Life Advisor <small>${ADVISOR_VERSION}</small></h3><button id="min" aria-label="Minimize">−</button></header>
<small>Native seeded simulation. Highest evaluated score; no guaranteed optimal life.</small>
<label>Evaluation depth<select id="profile"><option value="balanced">Balanced · 3 years / 12 future choices</option><option value="deep">Deep · 10 years / 40 future choices</option><option value="life">Life rollout · up to 600 future choices (slow)</option></select></label>
<div class="row"><button id="advise">Evaluate choices</button><button id="auto">Start Auto</button><button id="stop">Stop</button></div>
<div id="status" role="status">Loading…</div><div id="warning"></div><div id="advice"></div><button id="apply" disabled>Apply recommended choice</button>
<details open><summary>Achievement & trait goals (<span id="selected">0</span>)</summary>
<small>All goals must match. Traits must be present at the checked state. Some goals conflict.</small>
<input id="filter" type="search" placeholder="Search goals, requirements, or IDs" aria-label="Filter goals">
<div class="row"><label><input id="onlySelected" type="checkbox">Selected only</label><button id="clear">Clear goals</button></div><div id="goals"></div>
</details>
<details open><summary>Filtered random seeds & saved route</summary>
<div class="row"><label>Check<select id="scope"><option value="birth">At birth (fast)</option><option value="life">At end of simulated life</option></select></label><label>Try seeds<input id="count" type="number" min="1" max="500" value="25" style="width:100%"></label></div>
<label>Name (blank = seeded name)<input id="name" type="text" maxlength="12"></label>
<label>Gender<select id="gender"><option value="m">Male</option><option value="f">Female</option></select></label>
<button id="search">Find matching seed</button><div id="found"></div>
<div class="row"><button id="start" disabled>Start found seed</button><button id="copy" disabled>Copy seed</button></div>
<div class="row"><button id="export" disabled>Export route</button><button id="import">Import route</button></div><input id="file" type="file" accept=".json,application/json">
<small>Goals, settings, and the latest route are saved locally. Auto stays off after reload. Resume the game, then enable Auto to rejoin a saved route. The game's save is separate.</small>
</details></section>`;
const $=id=>shadow.getElementById(id);
const lang=()=>['en','ja','ko'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
const say=text=>{$('status').textContent=text;};
const preferencesKey='cityborn.advisor.preferences.v2',routeKey='cityborn.advisor.route.v2';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function write(key,value){try{value==null?localStorage.removeItem(key):localStorage.setItem(key,JSON.stringify(value));}catch{$('warning').textContent='Local storage is unavailable or full. Export your route before leaving.';}}
const saved=read(preferencesKey)||{};
let position=saved.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.y)?saved.position:null;
const chosen=new Set(Array.isArray(saved.goals)?saved.goals:[]);
let worker=null,sequence=0,pending=new Map(),generation=0,working=null,auto=false,ready=false;
let found=null,replay=null,latest=null,catalog=[];
for(const id of ['profile','scope','count','name','gender'])if(saved[id]!=null)$(id).value=saved[id];
if(!['balanced','deep','life'].includes($('profile').value))$('profile').value='balanced';
if(!['birth','life'].includes($('scope').value))$('scope').value='birth';
if(!['m','f'].includes($('gender').value))$('gender').value='m';
function savePreferences(){write(preferencesKey,{goals:[...chosen],...Object.fromEntries(['profile','scope','count','name','gender'].map(id=>[id,$(id).value])),minimized:$('panel').hidden,position});}
function saveRoute(){write(routeKey,found?{found,index:replay?.index||0,active:!!replay}:null);}
function bridge() {
  const root=document.getElementById('root');
  const key=root && Object.keys(root).find(k=>k.startsWith('__reactContainer$'));
  const internal=key && root[key],start=internal?.stateNode?.current||internal;
  const stack=start?[start]:[];let runtime=null,life=null,home=null;
  while(stack.length) {
    const f=stack.pop(),props=f.memoizedProps;
    if(props?.life?.choose)life=props.life;
    if(typeof props?.onStart==='function' && typeof props?.onResume==='function')home=props;
    for(let h=f.memoizedState;h && typeof h==='object';h=h.next) {
      const c=h.memoizedState?.current;
      if(c && Object.hasOwn(c,'state') && Object.hasOwn(c,'progress') && Object.hasOwn(c,'paused') && Object.hasOwn(c,'speed'))runtime=c;
    }
    if(f.sibling)stack.push(f.sibling);
    if(f.child)stack.push(f.child);
  }
  return {runtime,life,home};
}
function makeWorker() {
  const code=`${nativeEngine.toString()}\n${advisorCommon.toString()}\n${makePlanner.toString()}\n(${workerMain.toString()})();`;
  const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
  worker.onmessage=({data:m})=>{
    const p=pending.get(m.id);if(!p)return;
    if(m.progress!=null){p.progress?.(m);return;}
    pending.delete(m.id);m.error?p.reject(Error(m.error)):p.resolve(m.result);
  };
  worker.onerror=e=>{
    if(ready)stop('Worker failed: '+e.message);
    else{for(const p of pending.values())p.reject(Error(e.message));pending.clear();say('Worker failed: '+e.message);}
  };
}
function request(type,args={},progress){
  const id=++sequence;
  return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject,progress});worker.postMessage({id,type,lang:lang(),...args});});
}
function controls() {
  for(const id of ['advise','search','import','clear','profile','scope','count','name','gender'])$(id).disabled=!ready || !!working;
  $('auto').disabled=!ready || (!!working && !auto);
  $('auto').textContent=auto?'Stop Auto':'Start Auto';
  $('stop').disabled=!ready;
  $('apply').disabled=!ready || !!working || !latest;
  for(const id of ['start','copy','export'])$(id).disabled=!ready || !!working || !found;
}
function begin(kind){const job={generation:++generation,kind,paused:null};working=job;controls();return job;}
const current=job=>working===job && generation===job.generation;
function releasePause(job){
  if(!job?.paused)return;
  const b=bridge();if(b.runtime===job.paused && b.runtime.state===job.pausedState && b.runtime.paused && b.life)b.life.togglePause();
  job.paused=null;
}
function finish(job){if(current(job)){releasePause(job);working=null;controls();}}
function stop(message='Stopped. Manual control restored.') {
  if(!ready){say('Loading the advisor…');return;}
  ++generation;auto=false;releasePause(working);working=null;latest=null;
  if(pending.size){
    worker.terminate();for(const p of pending.values())p.reject(Error('Cancelled'));pending.clear();
    if(supported && ready)makeWorker();
  }
  controls();say(message);
}
function filterGoals(){
  const q=$('filter').value.toLowerCase();
  for(const el of $('goals').children)el.hidden=!el.textContent.toLowerCase().includes(q)||($('onlySelected').checked && !chosen.has(el.querySelector('input').value));
}
function syncGoals(){
  $('selected').textContent=chosen.size;
  for(const input of $('goals').querySelectorAll('input'))input.checked=chosen.has(input.value);
  filterGoals();
}
function invalidate(){
  stop('Goals changed. Evaluate again or search new seeds.');
  found=null;replay=null;saveRoute();renderFound();syncGoals();savePreferences();
}
function renderFound(){
  if(!found){$('found').textContent='';controls();return;}
  const n=found.matched.filter(Boolean).length;
  const missing=found.goals.filter((_,i)=>!found.matched[i]).map(g=>catalog.find(c=>c.key===g)?.label||g);
  $('found').textContent=`${n===found.goals.length?'Complete match':'Best partial'} • seed ${found.seed}\n${found.scope==='birth'?'At birth':'Life ended'} at age ${found.summary.age} • goals ${n}/${found.goals.length} • ${found.route.length} choices${missing.length?'\nMissing: '+missing.join(', '):''}`;
  controls();
}
function chooseNative(b,i){
  if(i===-2)b.life.acceptVoice();
  else if(['reflect','name','color'].includes(b.runtime.state.prompt?.kind))b.life.submitReflection('');
  else b.life.choose(i);
}
function applyAdvice(r){
  const b=bridge(),s=b.runtime?.state;
  if(!b.life || !s || C.signature(s)!==r.signature){latest=null;controls();say('State changed. Evaluate again before applying.');return false;}
  chooseNative(b,r.best);
  if(r.replay && replay){replay.index++;saveRoute();}
  latest=null;controls();return true;
}
async function evaluate(apply=false){
  if(working)return;
  const b=bridge(),s=b.runtime?.state;
  if(!s || !C.actionable(s)){if(!auto)say('Waiting for an active choice.');return;}
  if(!b.life)return stop('Game controls unavailable. Reload the page.');
  const job=begin('evaluate'),requestedLang=lang();
  try{
    if(b.runtime.auto)b.life.toggleAuto();
    if(!b.runtime.paused){b.life.togglePause();job.paused=b.runtime;job.pausedState=s;}
    const signature=C.signature(s);let r;
    if(replay){
      if(lang()!==found.lang)throw Error('Restore the route’s language before replaying');
      let step=replay.route[replay.index];
      if(step?.signature!==signature){
        const index=replay.route.findIndex(v=>v.signature===signature);
        if(index<0)throw Error('Replay diverged: live stats, history, event, or random state differ. Start the saved seed again, or clear goals to use fresh advice.');
        replay.index=index;step=replay.route[index];
      }
      r={signature,best:step.i,rows:[{i:step.i,label:C.label(s,step.i)}],replay:true};
    }else r=await request('recommend',{state:JSON.parse(JSON.stringify(s)),goals:[...chosen],profile:$('profile').value});
    if(!current(job))return;
    if(lang()!==requestedLang || bridge().runtime?.state!==s || C.signature(s)!==signature)throw Error('State or language changed during evaluation. Evaluate again.');
    latest=r;
    $('advice').textContent=r.rows.map((v,i)=>`${i===0?'★':' '} ${v.i===-2?'Voice':v.i+1||'–'}. ${v.label}${v.age!=null?`\n  Projected age ${v.age} · ${v.dead?'life ended':'still alive'} · goals ${v.matched}/${chosen.size}\n  Health ${Math.round(v.stats.health)} · Sanity ${Math.round(v.stats.sanity)} · Wealth ${Math.round(v.stats.wealth)}`:''}`).join('\n');
    say(r.replay?`Following saved route · choice ${replay.index+1}/${replay.route.length}.`:`${$('profile').selectedOptions[0].textContent}. Projected trajectories use a greedy follow-up policy; these are not win probabilities.`);
    if(apply && auto)applyAdvice(r);
  }catch(e){if(current(job))stop('Evaluation stopped: '+e.message);}
  finally{finish(job);}
}
async function checkEnd(b){
  if(working)return;
  auto=false;const job=begin('check');
  try{
    const r=await request('check',{state:JSON.parse(JSON.stringify(b.runtime.state)),goals:[...chosen]});
    if(!current(job))return;
    const exact=!replay || (replay.index===replay.route.length && r.signature===found.terminalSignature);
    say(`Life ended. Live goals ${r.matched.filter(Boolean).length}/${chosen.size}. ${replay?(exact?'Full replay matched the saved simulation.':'Replay final state differs from the saved simulation.'):''}`);
    replay=null;saveRoute();
  }catch(e){if(current(job))say('Final-state check failed: '+e.message);}
  finally{finish(job);}
}
async function importRoute(file,resume=null){
  stop('Validating route against the native simulation…');const job=begin('import');
  try{
    const result=await request('validate',{file});if(!current(job))return;
    found=result;chosen.clear();for(const g of result.goals)chosen.add(g);
    for(const id of ['name','gender'])$(id).value=result.options[id];
    $('scope').value=result.scope;$('profile').value=result.profile;
    replay=result.scope==='life' && (resume?.active??true)?{route:result.route,index:resume?.index||0}:null;
    syncGoals();savePreferences();saveRoute();renderFound();say('Route validated and saved. Start its seed, or resume that life and enable Auto.');
  }catch(e){if(current(job))say('Route rejected: '+e.message);}
  finally{finish(job);}
}
function movePanel(x,y){
  const rect=host.getBoundingClientRect();position={x:Math.max(4,Math.min(x,innerWidth-rect.width-4)),y:Math.max(4,Math.min(y,innerHeight-rect.height-4))};
  host.style.left=position.x+'px';host.style.right='auto';host.style.top=position.y+'px';
}
let drag=null;
$('drag').onpointerdown=e=>{
  if(e.button!==0 || e.target.closest('button'))return;
  const rect=host.getBoundingClientRect();drag={x:e.clientX-rect.x,y:e.clientY-rect.y};$('drag').setPointerCapture(e.pointerId);
};
$('drag').onpointermove=e=>{if(drag)movePanel(e.clientX-drag.x,e.clientY-drag.y);};
$('drag').onpointerup=$('drag').onpointercancel=()=>{if(drag){drag=null;savePreferences();}};
$('drag').onkeydown=e=>{
  if(e.target.closest('button') || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();const rect=host.getBoundingClientRect(),step=e.shiftKey?64:16;
  if(e.key==='Home'){position=null;host.style.left='';host.style.right='';host.style.top='';}
  else movePanel(rect.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),rect.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0));
  savePreferences();
};
window.addEventListener('resize',()=>{if(position)movePanel(position.x,position.y);});
$('min').onclick=()=>{$('panel').hidden=true;$('badge').style.display='block';savePreferences();};
$('badge').onclick=()=>{$('panel').hidden=false;$('badge').style.display='none';if(position)movePanel(position.x,position.y);savePreferences();};
if(position)movePanel(position.x,position.y);
if(saved.minimized)$('min').onclick();
$('stop').onclick=()=>stop();$('advise').onclick=()=>evaluate();
$('apply').onclick=()=>{if(latest)applyAdvice(latest);};
$('auto').onclick=()=>{
  if(auto)return stop();
  const b=bridge();if(!b.runtime?.state || C.finished(b.runtime.state))return say('Start or resume a life first.');
  if(b.runtime.auto)b.life.toggleAuto();
  auto=true;controls();say('Auto active for this life. Escape or manual game interaction stops it.');evaluate(true);
};
$('filter').oninput=filterGoals;$('onlySelected').onchange=filterGoals;
$('clear').onclick=()=>{chosen.clear();invalidate();};
for(const id of ['profile','scope','count','name','gender'])$(id).onchange=()=>{
  stop('Settings saved.');if(id==='scope')$('count').value=$('scope').value==='life'?'5':'25';savePreferences();
};
$('search').onclick=async()=>{
  if(!chosen.size)return say('Select at least one goal.');
  stop('Searching seeds…');found=null;replay=null;saveRoute();renderFound();
  const job=begin('search'),goals=[...chosen],count=Math.max(1,Math.min(500,Math.floor(Number($('count').value)||25)));
  $('count').value=count;savePreferences();
  try{
    const result=await request('search',{count,goals,scope:$('scope').value,profile:$('profile').value,options:{name:$('name').value.trim(),gender:$('gender').value}},m=>{
      if(!current(job))return;
      if(m.best){found=m.best;saveRoute();renderFound();}
      say(`Searching ${m.progress}/${m.total} seeds${m.age!=null?` · current life age ${m.age} · ${m.decisions} decisions`:''}${m.matches!=null?` · latest goals ${m.matches}/${goals.length}`:''}. Stop keeps the best completed partial result.`);
    });
    if(!current(job))return;
    if(result){found=result;saveRoute();renderFound();}
    say(found && found.matched.every(Boolean)?'Matching seed found. Start it from the home screen; enable Auto to replay.':`No complete match in ${count} seeds. ${found?'Best completed partial result saved; missing goals are listed below.':'No complete life was found within the simulation limit.'}`);
  }catch(e){if(current(job))say('Search failed: '+e.message);}
  finally{finish(job);}
};
$('start').onclick=()=>{
  if(!found)return;
  const b=bridge();if(!b.home)return say('Return to the game’s home screen first. Your current life will not be replaced.');
  if(lang()!==found.lang)return say('Restore the language used for this route first.');
  replay=found.scope==='life'?{route:found.route,index:0}:null;saveRoute();
  b.home.onStart(found.options);say(`Started seed ${found.seed}. Enable Auto to follow its route. Use native x32 for faster progress.`);
};
$('copy').onclick=async()=>{if(found)try{await navigator.clipboard.writeText(found.seed);say('Seed copied.');}catch{say('Copy unavailable. Seed: '+found.seed);}};
$('export').onclick=()=>{
  if(!found)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(found,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`cityborn-${found.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{
  const file=$('file').files[0];$('file').value='';if(!file)return;
  try{await importRoute(JSON.parse(await file.text()));}catch(e){say('Could not read route: '+e.message);}
};
document.addEventListener('pointerdown',e=>{if((auto || working?.kind==='evaluate') && !e.composedPath().includes(host))stop('Stopped by manual game interaction.');},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')stop();
  else if((auto || working?.kind==='evaluate') && !e.composedPath().includes(host))stop('Stopped by manual keyboard input.');
},true);
controls();
if(!supported)say('Game version changed. Update the advisor before using it. Supported bundle: '+C.source);
else {
  try{
    makeWorker();
    request('catalog').then(c=>{
      catalog=[...c.records.map(r=>({key:'record:'+r.key,label:`Achievement: ${r.label[lang()]||r.label.en} [${r.key}]`,hint:r.hint[lang()]||r.hint.en})),...c.flags.map(([key,label])=>({key:'flag:'+key,label:`Trait: ${label} [${key}]`,hint:'Must be present at the checked state.'}))];
      const valid=new Set(catalog.map(c=>c.key));for(const g of chosen)if(!valid.has(g))chosen.delete(g);
      for(const item of catalog){
        const label=document.createElement('label'),input=document.createElement('input'),hint=document.createElement('small');
        input.type='checkbox';input.value=item.key;input.onchange=()=>{input.checked?chosen.add(item.key):chosen.delete(item.key);invalidate();};
        hint.className='hint';hint.textContent=item.hint;label.append(input,document.createTextNode(item.label),hint);$('goals').append(label);
      }
      ready=true;syncGoals();controls();say(`Ready. ${c.records.length} achievements and ${c.flags.length} traits.`);
      const stored=read(routeKey);if(stored?.found)importRoute(stored.found,stored);
    }).catch(e=>say('Initialization failed: '+e.message));
    setInterval(()=>{
      if(!auto || working)return;
      const b=bridge();if(!b.runtime?.state)return stop('Life closed. Auto stopped.');
      if(C.finished(b.runtime.state)){checkEnd(b);return;}
      evaluate(true);
    },150);
  }catch(e){say('Could not start the simulation worker: '+e.message);}
}
