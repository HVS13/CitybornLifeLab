if (document.getElementById('cityborn-advisor')) return;
const C=advisorCommon(),supported=[...document.scripts].some(s=>s.src.endsWith('/assets/'+C.source));
const host=document.createElement('div');host.id='cityborn-advisor';
const shadow=host.attachShadow({mode:'open'});document.body.append(host);
shadow.innerHTML=`<style>
:host{position:fixed;right:12px;top:12px;z-index:2147483647;width:420px;max-width:calc(100vw - 24px);font:13px/1.5 system-ui;color:#e9edf6;color-scheme:dark}
*{box-sizing:border-box}[hidden]{display:none!important}#panel{background:#171b24;border:1px solid #687489;border-radius:12px;box-shadow:0 12px 45px #0009;max-height:90vh;overflow:auto;padding:14px}
.topbar{position:sticky;top:-14px;z-index:5;background:#171b24;padding-top:3px;border-bottom:1px solid #354055}header{display:flex;justify-content:space-between;align-items:center;cursor:move;touch-action:none}h2{font-size:17px;margin:0}h3{font-size:14px;margin:15px 0 6px}p{margin:7px 0}small,.muted{color:#b2bfd1;font-size:12px}nav{display:flex;gap:5px;margin:14px 0}nav button{flex:1}nav button[aria-selected=true]{background:#384866;border-color:#abc5ef;color:white}
button,input,select{font:inherit;color:inherit;border:1px solid #65758d;border-radius:6px;padding:7px;background:#252e3e}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}button.primary{background:#d5b66d;color:#171b24;border-color:#d5b66d;font-weight:650}button.link{padding:3px 6px;background:transparent}input[type=number],input[type=text],input[type=search],select{width:100%;min-width:0}input[type=checkbox]{accent-color:#d5b66d;margin-right:5px}
label{display:block}.row{display:flex;gap:7px;align-items:end;margin:8px 0}.row>*{flex:1;min-width:0}.statInputs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.statInputs label{font-size:12px}.notice{white-space:pre-wrap;color:#c8dbfc;margin:8px 0}.warning{color:#efcc89}summary{cursor:pointer;padding:8px 0}.chips{display:flex;gap:5px;flex-wrap:wrap}.chips button{font-size:11px;padding:3px 7px}.goal{padding:7px 3px;border-bottom:1px solid #354055}.goal label{display:inline}.goal small{display:block;margin-left:22px;font-size:11px}.avoid{float:right;font-size:11px}#goals{max-height:220px;overflow:auto}#goalCount{display:block;margin:5px 0}
.card{border:1px solid #4b5d78;border-radius:8px;padding:10px;margin:9px 0;background:#1d2431}.card strong{color:#e8ce91}.tag{font-size:11px;border-radius:4px;padding:2px 5px;background:#354764}.tag.match{background:#244e43;color:#c7f3df}.tag.partial{background:#604d2c;color:#ffe5ae}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin:9px 0}.stats span{font-size:10px;color:#b6c5d9}.stats b{display:block;font-size:17px;color:#e9edf6}.missing{color:#f0c78e;font-size:12px}.hint{font-size:12px;color:#b7c5d9}#min{padding:3px 10px}#badge,#file{display:none}#stopJob{width:100%}#playNext{white-space:pre-wrap}.libraryTools{margin-top:12px}
</style><button id="badge">Cityborn Lab</button><section id="panel">
<div id="topbar" class="topbar"><header id="drag" tabindex="0" aria-label="Move panel with arrow keys or drag; Home resets"><h2>Cityborn Life Lab <small>${ADVISOR_VERSION}</small></h2><button id="min" aria-label="Minimize">−</button></header>
<nav role="tablist"><button id="tabFind" role="tab" aria-selected="true">Find a life</button><button id="tabPlay" role="tab" aria-selected="false">Play this life</button><button id="tabSaved" role="tab" aria-selected="false">Saved lives</button></nav></div>
<div id="status" class="notice" role="status">Loading…</div><div id="warning" class="warning"></div>
<button id="stopJob" hidden>Stop search</button>
<div id="viewFind" role="tabpanel">
<h3>What do you want at the ending?</h3><p class="hint">Set minimum final stats. Leave a field blank for no requirement. Values match the rounded numbers on the game's Final state screen.</p>
<div class="statInputs">${Object.entries(C.statNames).map(([key,name])=>`<label>${name}<input id="min-${key}" type="number" min="0" max="100" step="1" placeholder="Any" aria-label="Minimum final ${name}"></label>`).join('')}</div>
<div class="row"><label>Minimum age<input id="min-age" type="number" min="0" max="10000" step="1" placeholder="Any"></label><label>Ending<select id="ending"><option value="any">Any ending</option><option value="alive">Alive ending only</option></select></label></div>
<div class="row"><button id="copyStats" class="link">Use this life's stats</button><button id="copyTraits" class="link">Use this life's traits</button></div>
<div id="selectedGoals" class="chips"></div>
<details id="goalPicker"><summary>Browse traits & achievements · <span id="selected">0</span> selected</summary><p id="catalogSize" class="hint"></p><p class="hint">Browse the full list below, or search by name, ID, or achievement requirement. Check traits you want at the ending; use Avoid to exclude them. Achievements show the game's unlock hints.</p>
<label>Show<select id="goalKind"><option value="all">All traits & achievements</option><option value="trait">Traits</option><option value="achievement">Achievements</option></select></label>
<input id="filter" type="search" placeholder="Search a trait, achievement, or ID" aria-label="Filter goals">
<div class="row"><label><input id="onlySelected" type="checkbox">Selected only</label><button id="clear" class="link">Clear selections</button></div><small id="goalCount" role="status"></small><div id="goals" role="group" aria-label="Available traits and achievements"></div></details>
<details id="startSettings"><summary>Starting settings & search effort</summary>
<div class="row"><label>Name<input id="name" type="text" maxlength="12" placeholder="Seeded name"></label><label>Gender<select id="gender"><option value="m">Male</option><option value="f">Female</option></select></label></div>
<label>Birthplace<select id="birthplace"><option value="">Random</option></select></label><p class="hint">Uses the game’s birthplace seed prefix. This changes the full life seed. An existing prefix takes effect even with Random; conflicting selections are rejected.</p>
<label>Specific seed (optional)<input id="seed" type="text" placeholder="Leave blank for random seeds"></label>
<div class="row"><label>Random seeds<input id="count" type="number" min="1" max="500" value="3"></label><label>Search effort<select id="effort"><option value="quick">Quick</option><option value="thorough">Thorough</option></select></label></div>
<p class="hint">Each seed explores several routes; start with 1–3 seeds. Quick looks for a matching ending sooner. Thorough explores more alternatives. Neither can guarantee finding every possible route.</p></details>
<button id="search" class="primary">Find matching lives</button><p id="searchNote" class="hint">Results are predictions with replayable choices. Nothing starts automatically.</p><p class="hint">Partner’s gender follows the native game setting when searching. Festival results use fresh randomness: seed searches take the skip route. Play the Festival manually, then plan from the result to pursue its rewards.</p>
<label>Result & planning order<select id="sort">${Object.entries(C.sorts).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label><p class="hint">Completed goal matches always come first. Recommended compares alive endings, lifespan, then wellbeing. Your selected order also guides which search branches survive. Rarity compares achievement tiers from highest to lowest; count is separate. Combat potential is the engine’s broader combat measure for eligible careers; Fixer request rating is a different formula.</p>
<div id="results"></div></div>
<div id="viewPlay" role="tabpanel" hidden>
<h3 id="liveTitle">Your current life</h3><div id="liveStats"></div>
<button id="plan" class="primary">Plan the rest of this life</button><p class="hint">Uses the targets from Find a life. The game pauses while you plan and review.</p>
<div id="playPreview"></div><p id="playStatus" class="notice" role="status">Choose a searched life, import a route, or plan your current life.</p><div id="playNext" class="hint"></div>
<button id="resume" class="primary" disabled>Resume saved life</button><div class="row"><button id="start" disabled>Start from birth & follow</button><button id="goHome">Save & go home</button></div><p class="hint">Resume keeps your saved progress. Start begins the selected seed again from birth.</p>
<div class="row"><button id="follow" disabled>Follow route</button><button id="apply" disabled>Choose next step</button></div>
<p class="hint">Names, reflections, Workshop crafting and corridor battles are yours to complete. Submit in the game, then Resume after typing. Cosmetic entries keep the same choices when a native replay verifies the same gameplay outcome. Changes to randomness, such as custom child/partner/friend names, require a new search using the original targets. Crafting and corridor predictions use native fallback results; after crafting or corridor battles, the script replans from your actual result.</p>
<div class="row"><label>Following speed<select id="speed"><option value="1">x1</option><option value="4">x4</option><option value="8">x8</option><option value="32" selected>x32</option></select></label><button id="stopAuto" disabled>Pause & stop following</button></div>
<p class="hint">Following checks the live state before every choice and uses the route’s recorded Mentor voice setting. Manual game interaction stops following. Grand Voyage deadlines keep running while paused; follow a prepared route or choose manually. No route edits your game save or grants traits.</p></div>
<div id="viewSaved" role="tabpanel" hidden><p class="hint">Up to 8 recent saved lives. Selecting one validates it again before play. Export routes you want to keep longer.</p><div id="library"></div></div>
<div class="row libraryTools"><button id="import">Import route</button><button id="export" disabled>Export selected route</button><button id="copy" disabled>Copy selected seed</button></div><input id="file" type="file" accept=".json,application/json">
</section>`;
const $=id=>shadow.getElementById(id),say=text=>{$('status').textContent=text;};
function lang(){
  // Match the game's locale selection. The page attribute can be changed
  // independently of the native engine (for example by page translation).
  let savedLanguage;try{savedLanguage=localStorage.getItem('cbl.lang');}catch{return 'ko';}
  if(['en','ja','ko'].includes(savedLanguage))return savedLanguage;
  const locale=navigator.language||'ko';return /^ja/i.test(locale)?'ja':/^ko/i.test(locale)?'ko':'en';
}
const prefsKey='cityborn.lab.preferences.v3',libraryKey='cityborn.lab.lives.v3';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{$('warning').textContent='Local storage is full or unavailable. Export the route you want to keep.';}}
const newPreferences=read(prefsKey),saved=newPreferences||read('cityborn.advisor.preferences.v2')||{},stored=read(libraryKey)||{};
let chosen=new Set((saved.goals||[]).filter(g=>g.startsWith('record:')||g.startsWith('flag:')||g.startsWith('avoid:')));
let catalog=[],library=Array.isArray(stored.files)?stored.files:[],selected=null,active=null,results=[];
let ready=false,worker=null,pending=new Map(),sequence=0,generation=0,job=null,auto=false,view='Find',previewFile=null;
let position=saved.position&&Number.isFinite(saved.position.x)&&Number.isFinite(saved.position.y)?saved.position:null;
for(const {id,name} of ADVISOR_CATALOG.regions[lang()])$('birthplace').add(new Option(name,id));
for(const id of ['name','gender','birthplace','seed','count','effort','speed','ending','min-age','sort',...Object.keys(C.statNames).map(k=>'min-'+k)])if(saved[id]!=null)$(id).value=saved[id];
if(!$('birthplace').value)$('birthplace').value='';
if(!Object.hasOwn(C.sorts,$('sort').value))$('sort').value='recommended';
if(!newPreferences)$('count').value='3';
if(!['quick','thorough'].includes($('effort').value))$('effort').value='quick';
if(!['m','f'].includes($('gender').value))$('gender').value='m';
function draftGoals(){
  const goals=[...chosen];for(const key of Object.keys(C.statNames))if($('min-'+key).value!=='')goals.push(`stat:${key}:${Number($('min-'+key).value)}`);
  if($('min-age').value!=='')goals.push('age:'+Number($('min-age').value));if($('ending').value==='alive')goals.push('ending:alive');return goals;
}
function savePreferences(){write(prefsKey,{goals:[...chosen],...Object.fromEntries(['name','gender','birthplace','seed','count','effort','speed','ending','min-age','sort',...Object.keys(C.statNames).map(k=>'min-'+k)].map(id=>[id,$(id).value])),position,minimized:$('panel').hidden});renderDraftHint();}
function renderDraftHint(){
  $('searchNote').textContent=auto?'Pause following in Play this life before starting a new search.':results.length&&JSON.stringify(draftGoals())!==JSON.stringify(results[0].goals)?'Targets changed. Existing cards still show their original requirements; search again to use the new targets.':'Results are predictions with replayable choices. Nothing starts automatically.';
}
function saveLives(){write(libraryKey,{files:library,selected,active:active?{file:active.file,index:active.index,waitingForTyping:active.waitingForTyping}:null});}
function bridge(){
  const root=document.getElementById('root'),key=root&&Object.keys(root).find(k=>k.startsWith('__reactContainer$'));
  const internal=key&&root[key],start=internal?.stateNode?.current||internal,stack=start?[start]:[];
  let runtime=null,life=null,home=null,onHome=null;
  while(stack.length){
    const f=stack.pop(),p=f.memoizedProps;
    if(p?.life?.choose)life=p.life;if(typeof p?.onStart==='function'&&typeof p?.onResume==='function')home=p;
    if(p?.summary&&typeof p?.onHome==='function')onHome=p.onHome;
    for(let h=f.memoizedState;h&&typeof h==='object';h=h.next){const c=h.memoizedState?.current;if(c&&Object.hasOwn(c,'state')&&Object.hasOwn(c,'progress')&&Object.hasOwn(c,'paused')&&Object.hasOwn(c,'speed'))runtime=c;}
    if(f.sibling)stack.push(f.sibling);if(f.child)stack.push(f.child);
  }
  return {runtime,life,home,onHome};
}
function makeWorker(){
  const code=`${nativeEngine.toString()}\n${advisorCommon.toString()}\n${makePlanner.toString()}\n(${workerMain.toString()})();`,url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
  const owner=worker;
  worker.onmessage=({data:m})=>{const p=pending.get(m.id);if(!p)return;if(m.progress!=null){p.progress?.(m.progress);return;}pending.delete(m.id);m.error?p.reject(Error(m.error)):p.resolve(m.result);};
  worker.onerror=e=>{if(worker!==owner)return;cancel('Simulation failed: '+e.message);};
}
function partnerSame(){try{return localStorage.getItem('cbl.ui.loveSame')==='1';}catch{return false;}}
function mentorVoice(){try{return localStorage.getItem('cbl.ui.mentorVoice')==='spider'?'spider':'plain';}catch{return 'plain';}}
function request(type,args={},progress){const id=++sequence;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject,progress});worker.postMessage({id,type,lang:lang(),mentorVoice:mentorVoice(),...args});});}
function begin(kind){const task={kind,generation:++generation,pause:null};job=task;controls();return task;}
const current=task=>job===task&&task.generation===generation;
function release(task){if(task?.pause){const b=bridge();if(b.runtime===task.pause.runtime&&b.runtime.state===task.pause.state&&b.runtime.paused&&b.life)b.life.togglePause();task.pause=null;}}
function finish(task){if(current(task)){release(task);job=null;controls();}}
function cancel(message='Stopped. Completed results are kept.'){
  const searched=job?.kind==='search';++generation;release(job);job=null;
  if(pending.size){worker?.terminate();for(const p of pending.values())p.reject(Error('Cancelled'));pending.clear();if(ready)makeWorker();}
  say(message);controls();if(searched)showResults();
}
function switchView(next){view=next;for(const name of ['Find','Play','Saved']){$('view'+name).hidden=name!==next;$('tab'+name).setAttribute('aria-selected',String(name===next));}$('panel').scrollTop=0;renderPlay();}
function goalLabel(g){
  const [kind,key,value]=g.split(':');if(kind==='stat')return `${C.statNames[key]} ≥ ${value}`;if(kind==='age')return `Age ≥ ${key}`;if(g==='ending:alive')return 'Alive ending';
  if(kind==='avoid')return 'Avoid '+(catalog.find(c=>c.key==='flag:'+key)?.name||key);
  return catalog.find(c=>c.key===g)?.name||g;
}
function filterGoals(){
  const q=$('filter').value.trim().toLowerCase(),kind=$('goalKind').value;let shown=0;
  for(const el of $('goals').children){el.hidden=(kind!=='all'&&el.dataset.kind!==kind)||!el.textContent.toLowerCase().includes(q)||($('onlySelected').checked&&!el.querySelector('input:checked'));if(!el.hidden)shown++;}
  $('goalCount').textContent=shown?`${shown} of ${catalog.length} goals shown`:'No matching goals. Change the search or turn off Selected only.';
}
function syncGoals(){
  for(const input of $('goals').querySelectorAll('input'))input.checked=chosen.has(input.value);
  $('selected').textContent=chosen.size;$('selectedGoals').replaceChildren();
  for(const g of chosen){const button=document.createElement('button');button.textContent=goalLabel(g)+' ×';button.onclick=()=>{chosen.delete(g);syncGoals();savePreferences();};$('selectedGoals').append(button);}
  filterGoals();
}
function setDraft(goals){
  chosen=new Set(goals.filter(g=>g.startsWith('record:')||g.startsWith('flag:')||g.startsWith('avoid:')));
  for(const key of Object.keys(C.statNames))$('min-'+key).value='';$('min-age').value='';$('ending').value='any';
  for(const g of goals){const [kind,key,value]=g.split(':');if(kind==='stat')$('min-'+key).value=value;if(kind==='age')$('min-age').value=key;if(g==='ending:alive')$('ending').value='alive';}
  syncGoals();savePreferences();
}
function statsElement(stats){
  const el=document.createElement('div');el.className='stats';for(const [key,name] of Object.entries(C.statNames)){const item=document.createElement('div'),label=document.createElement('span'),value=document.createElement('b');label.textContent=name;value.textContent=stats[key];item.append(label,value);el.append(item);}return el;
}
function fileKey(file){return [file.lang,file.seed,file.terminalSignature,file.scope,file.origin,file.origin==='current'?C.signature(file.startState):'',JSON.stringify([...file.goals].sort())].join(':');}
function keep(file){library=[file,...library.filter(f=>fileKey(f)!==fileKey(file))].slice(0,8);saveLives();renderLibrary();}
function card(file,buttons=true){
  const el=document.createElement('article');el.className='card';const title=document.createElement('strong'),badge=document.createElement('span'),meta=document.createElement('p');
  const matches=file.matched.filter(Boolean).length,full=file.complete&&matches===file.goals.length&&file.scope==='life';
  badge.className='tag '+(full?'match':'partial');badge.textContent=file.scope==='birth'?'Birth only':full?(file.goals.length?'Match':'Completed'):'Partial';
  title.textContent=` Seed ${file.seed}`;meta.className='hint';meta.textContent=`${file.origin==='current'?'Continuation plan · ':''}${file.summary.region?'Birthplace: '+file.summary.region+' · ':''}${file.summary.currentRegion&&file.summary.currentRegion!==file.summary.region?'Final area: '+file.summary.currentRegion+' · ':''}${file.summary.job||'No steady job'} · age ${file.summary.age} · ${file.summary.alive?'alive ending':file.summary.cause||'ending'}`;
  el.append(badge,title,meta,statsElement(file.summary.stats));
  if(file.summary.comparison){
    const c=file.summary.comparison,details=document.createElement('details'),heading=document.createElement('summary'),text=document.createElement('p');
    heading.textContent='Comparison details';text.className='hint';
    text.textContent=`Wellbeing floor (Health/Sanity): ${Math.min(file.summary.stats.health,file.summary.stats.sanity)} · Total stats: ${Object.values(file.summary.stats).reduce((a,b)=>a+b,0)} · Highest achievement tier: ${c.rarity||'None'}${c.fixerPower!=null?' · Native Fixer request rating: '+c.fixerPower:''}${c.combatPotential!=null?' · Native combat potential: '+c.combatPotential.toFixed(2):''} · Achievements: ${c.achievementCount??file.summary.records.length}${c.promotion?.required?' · Promotion merit: '+c.promotion.current+'/'+c.promotion.required:''}. These are comparison metrics, not a win probability.`;
    details.append(heading,text);el.append(details);
  }
  const used=document.createElement('p');used.className='hint';used.textContent='Targets used: '+(file.goals.slice(0,3).map(goalLabel).join(' · ')||'No required conditions')+(file.goals.length>3?` · ${file.goals.length-3} more`:'');el.append(used);
  const progress=document.createElement('p');progress.className='hint';progress.textContent=file.goals.length?`${matches}/${file.goals.length} conditions met${file.scope==='birth'?' at birth — final outcome not predicted':''}`:'No required conditions · ranked by your selected order';el.append(progress);
  if(!full&&file.goals.length){const missing=document.createElement('p');missing.className='missing';missing.textContent='Missing: '+file.goals.filter((_,i)=>!file.matched[i]).map(goalLabel).join(', ');el.append(missing);}
  if(file.summary.flags.length){const traits=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent='Traits at '+(file.scope==='birth'?'birth':'the ending');text.className='hint';text.textContent=file.summary.flags.map(k=>catalog.find(c=>c.key==='flag:'+k)?.name).filter(Boolean).join(' · ')||'No listed traits';traits.append(summary,text);el.append(traits);}
  if(buttons){const row=document.createElement('div');row.className='row';const choose=document.createElement('button'),save=document.createElement('button');choose.className='primary chooseRoute';choose.disabled=!!job||auto;choose.textContent=file.origin==='current'?'Use this plan':'Choose this life';choose.onclick=()=>selectFile(file);save.textContent='Save';save.onclick=()=>{keep(file);say('Saved. Find it in Saved lives.');};row.append(choose,save);el.append(row);}
  return el;
}
function renderResults(){
  $('results').replaceChildren();renderDraftHint();if(!results.length)return;const h=document.createElement('h3');h.textContent='Compare completed outcomes';$('results').append(h);for(const file of [...results].sort((a,b)=>C.compareLives(a,b,$('sort').value)))$('results').append(card(file));
}
function showResults(){
  if(view!=='Find'||!results.length)return;
  $('panel').scrollTop+=$('results').getBoundingClientRect().top-$('panel').getBoundingClientRect().top-$('topbar').offsetHeight-8;
}
function renderLibrary(){
  $('library').replaceChildren();if(!library.length){$('library').textContent='No saved lives yet. Save a search result or import a route.';return;}
  for(const file of [...library].sort((a,b)=>C.compareLives(a,b,$('sort').value))){const el=card(file,false),row=document.createElement('div');row.className='row';const open=document.createElement('button'),remove=document.createElement('button');open.className='chooseRoute';open.disabled=!!job||auto;open.textContent='Validate & choose';open.onclick=()=>importRoute(file,null,true);remove.textContent='Remove';remove.onclick=()=>{library=library.filter(f=>fileKey(f)!==fileKey(file));saveLives();renderLibrary();};row.append(open,remove);el.append(row);$('library').append(el);}
}
function selectFile(file){
  stopFollowing(false);selected=file;active=null;keep(file);saveLives();switchView('Play');
  $('playStatus').textContent=file.origin==='current'?'Plan selected. Resume this same life, then follow its route.':'Life selected. Start it from the home screen, or follow if you are already playing this route.';
}
function controls(){
  const b=bridge(),s=b.runtime?.state,busy=!!job;
  for(const id of ['search','plan','import'])$(id).disabled=!ready||busy||auto;
  for(const button of shadow.querySelectorAll('.chooseRoute'))button.disabled=!ready||busy||auto;
  $('plan').disabled||=!s||C.finished(s);
  $('stopJob').hidden=!busy;$('stopJob').textContent=job?.kind==='plan'?'Cancel planning':'Stop '+(job?.kind==='import'?'validation':'search');
  $('copyStats').disabled=$('copyTraits').disabled=!ready||!s;
  $('export').disabled=$('copy').disabled=!ready||!selected||busy;
  $('start').disabled=!ready||busy||auto||!selected||selected.origin==='current'||!b.home;
  const savedLife=b.home?read('cbl.save.v1'):null,resumable=savedLife?.v===7&&(!savedLife.dead||savedLife.dead.voice);
  $('resume').disabled=!ready||busy||auto||!b.home||!resumable;
  $('resume').textContent=selected&&savedLife?.seed===selected.seed&&selected.scope==='life'?'Resume & follow saved life':'Resume saved life';
  $('goHome').disabled=busy||auto||(!b.life&&!b.onHome);
  $('goHome').textContent=s&&!C.finished(s)?'Save & go home':'Go to home';
  $('follow').disabled=!ready||busy||auto||!selected||selected.scope!=='life'||!s||C.finished(s)||s.seed!==selected.seed;
  $('follow').textContent=active?.waitingForTyping?'Resume after typing':'Follow route';
  if(active?.waitingForTyping&&s&&(C.signature(s)===active.waitingForTyping.before||['craft','shfight','jfgame'].includes(s.prompt?.kind)))$('follow').disabled=true;
  $('apply').disabled=!ready||busy||auto||!active||!s||!C.actionable(s);
  $('apply').disabled||=!!active?.waitingForTyping;
  $('stopAuto').disabled=!auto;
  $('search').textContent=$('seed').value.trim()?'Check this seed':'Find matching lives';
  renderDraftHint();
}
function renderPlay(){
  const b=bridge(),s=b.runtime?.state;
  $('liveTitle').textContent=s?`${s.name||'Your life'} · age ${s.age}${C.finished(s)?' · ended':''}`:'No life is currently open';
  $('liveStats').replaceChildren();if(s)$('liveStats').append(statsElement(C.displayStats(s)));
  if(previewFile!==selected){$('playPreview').replaceChildren();if(selected)$('playPreview').append(card(selected,false));previewFile=selected;}
  $('playNext').textContent=active?`Route progress: ${active.index}/${active.file.route.length} choices. Mentor voice: ${active.file.mentorVoice==='spider'?'House of Spiders':'Fingers'}. Targets: ${active.file.goals.map(goalLabel).join(', ')||'Strong overall life'}.`:'';
  controls();
}
function nativeChoose(b,i){if(i===-2)b.life.acceptVoice();else if(['reflect','name','color'].includes(b.runtime.state.prompt?.kind))b.life.submitReflection('');else b.life.choose(i);}
function stepRoute(){
  const b=bridge(),s=b.runtime?.state;if(!b.life||!s||!C.actionable(s))return false;
  if(mentorVoice()!==(active.file.mentorVoice??'plain'))throw Error('Restore this route’s Mentor voice setting, or plan your current life again.');
  if(lang()!==active.file.lang)throw Error('Restore this route’s language, or plan your current life again.');
  const sig=C.signature(s);let step=active.file.route[active.index];
  if(step?.signature!==sig){const index=active.file.route.findIndex(v=>v.signature===sig);if(index<0)throw Error('Your live state differs from this route. Use Plan the rest of this life to make a new plan.');active.index=index;step=active.file.route[index];}
  const festival=s.prompt?.jf==='enter'&&active.file.goals.some(g=>/^record:jf_(caught|stop|star)$/.test(g));
  if(C.typing(s)||festival){
    active.waitingForTyping={before:sig,after:festival?null:step.afterSignature};saveLives();
    if(b.runtime.auto)b.life.toggleAuto();
    stopFollowing(true,'Your input is needed: '+(festival?'your Festival target requires manual play. Enter the game':s.prompt.kind==='jfgame'?'J Corp. Festival':s.prompt.kind==='shfight'?'House of Spiders corridor battle':s.prompt.kind==='craft'?'Workshop crafting':s.prompt.text||s.prompt.question||'name or reflection')+'. Complete it in the game and submit, then click Resume after typing.');
    return false;
  }
  const text=C.label(s,step.i);nativeChoose(b,step.i);active.index++;saveLives();$('playStatus').textContent=`${auto?'Following':'Chose'} ${active.index}/${active.file.route.length}: ${text}`;return true;
}
function stopFollowing(pause=false,message){
  auto=false;if(pause){const b=bridge();if(b.life&&b.runtime?.state&&!C.finished(b.runtime.state)&&!b.runtime.paused)b.life.togglePause();}
  if(message){$('playStatus').textContent=message;say(message);}controls();
}
function follow(){
  const b=bridge(),s=b.runtime?.state;if(!selected||!b.life||!s)return;
  if(selected.scope!=='life'){$('playStatus').textContent='This older result predicts birth only. Plan the rest of this life for a complete route.';return;}
  if(s.seed!==selected.seed){$('playStatus').textContent='Start the selected seed first, or plan the life you are currently playing.';return;}
  if(mentorVoice()!==(selected.mentorVoice??'plain')){$('playStatus').textContent='Use this route’s Mentor voice setting first: '+(selected.mentorVoice??'plain');return;}
  if(lang()!==selected.lang){$('playStatus').textContent='Use the same game language as this route: '+selected.lang;return;}
  active=active?.file===selected?active:{file:selected,index:0};
  if(active.waitingForTyping){
    const sig=C.signature(s),waiting=active.waitingForTyping;
    if(['craft','shfight','jfgame'].includes(s.prompt?.kind)){stopFollowing(true,'Your input is needed. Finish and submit crafting, the corridor battle or the Festival in the game, then resume to plan from your actual result.');return;}
    if(sig===waiting.before){stopFollowing(true,'Your input is needed. Enter and submit your text in the game, then click Resume after typing.');return;}
    if(sig!==waiting.after){planCurrent({goals:[...active.file.goals],sort:active.file.sort||'recommended',followAfter:true});return;}
    active.index++;delete active.waitingForTyping;
  }
  if(b.runtime.auto)b.life.toggleAuto();b.life.setSpeed(Number($('speed').value));if(b.runtime.paused)b.life.togglePause();
  auto=true;saveLives();$('playStatus').textContent='Following this life. Manual game interaction stops following.';controls();
}
function validInputs(){for(const input of $('viewFind').querySelectorAll('input[type=number]'))if(!input.checkValidity()){say('Check '+(input.getAttribute('aria-label')||input.closest('label')?.textContent||'search settings')+': '+input.validationMessage);input.reportValidity();return false;}return true;}
async function search(){
  if(!validInputs())return;const task=begin('search'),goals=draftGoals(),options={name:$('name').value.trim(),gender:$('gender').value,loveSame:partnerSame(),birthplace:$('birthplace').value};savePreferences();
  $('startSettings').open=false;$('goalPicker').open=false;
  say('Searching complete lives. You can stop and keep completed results.');results=[];renderResults();
  try{
    const result=await request('search',{goals,options,seed:$('seed').value.trim(),count:Number($('count').value)||10,effort:$('effort').value,sort:$('sort').value},p=>{
      if(!current(task))return;if(p.results){results=p.results;renderResults();}
      say(`Checked ${p.tested}/${p.total} seeds${p.age!=null?` · exploring age ${p.age}`:''}${p.examined!=null?` · ${p.examined} branches evaluated`:''}.`);
    });
    if(!current(task))return;results=result.results;renderResults();
    const matches=results.filter(r=>r.matched.every(Boolean)).length;
    say(!goals.length&&results.length?`${results.length} completed outcomes shown. No required conditions were set.`:matches?`${matches} matching outcome${matches===1?'':'s'} shown. Compare the final stats, then choose a life.`:results.length?'No full match in this search. Closest completed lives are shown with missing conditions. Try more seeds, Thorough effort, or fewer conditions.':'No completed life within the route-search limit. Try Quick effort or a different seed.');showResults();
  }catch(e){if(current(task))say('Search failed: '+e.message);}finally{finish(task);}
}
async function planCurrent({goals=draftGoals(),sort=$('sort').value,followAfter=false}={}){
  if(!followAfter&&!validInputs())return;const b=bridge(),s=b.runtime?.state;if(!b.life||!s||C.finished(s))return;
  if(s.prompt?.kind==='jfgame'){say('Finish the Festival manually, then plan from your actual result. Its randomness is not determined by the seed.');return;}
  if(s.prompt?.realLimit){say('This voyage choice has a real-time deadline, even when the game is paused. Choose in the game or follow an existing route; plan after resolving this choice.');return;}
  let planned=false;
  const task=begin('plan'),snapshot=JSON.parse(JSON.stringify(s)),signature=C.signature(s),language=lang(),voice=mentorVoice();
  if(b.runtime.auto)b.life.toggleAuto();if(!b.runtime.paused){b.life.togglePause();task.pause={runtime:b.runtime,state:s};}
  say(followAfter?'Updating the remaining route for your entry…':'Planning complete outcomes for your current life…');
  if(followAfter)$('playStatus').textContent='Updating the remaining route for your entry…';
  try{
    let retained=null;
    if(followAfter&&active?.waitingForTyping)retained=await request('retainTyping',{file:active.file,index:active.index,state:snapshot});
    if(!current(task))return;
    const files=retained?[retained]:await request('plan',{state:snapshot,goals,effort:$('effort').value,sort},p=>{if(current(task))say(`Planning your life · exploring age ${p.age} · ${p.expanded} branches evaluated.`);});
    if(!current(task))return;if(bridge().runtime?.state!==s||C.signature(s)!==signature||lang()!==language||mentorVoice()!==voice)throw Error('The game changed during planning. Try again.');
    if(!files.length)throw Error('No completed route within this search limit. Try another effort.');
    selected=files[0];active={file:selected,index:0};keep(selected);saveLives();renderPlay();
    task.pause=null; // The explicitly paused review remains paused until Follow.
    planned=true;
    say(retained?'Your entry was preserved. The remaining choices and gameplay outcome are unchanged.':'Plan ready. The game is paused for review.');$('playStatus').textContent=`${selected.matched.filter(Boolean).length}/${selected.goals.length} conditions met in the predicted ending. Follow the route or choose one step at a time.`;
  }catch(e){if(current(task)){say('Planning stopped: '+e.message);if(followAfter)$('playStatus').textContent='Planning stopped: '+e.message;}}finally{finish(task);}
  if(planned&&followAfter)follow();
}
async function importRoute(file,resume=null,preserveDraft=false){
  if(auto)stopFollowing(false);if(job)cancel();const task=begin('import');say('Validating this route in the game engine…');
  try{
    const result=await request('validate',{file});if(!current(task))return;
    selected=result;active=resume?{file:result,index:resume.index||0,waitingForTyping:resume.waitingForTyping}:null;keep(result);
    if(!preserveDraft){setDraft(result.goals);for(const id of ['name','gender'])$(id).value=result.options[id];$('birthplace').value=result.options.birthplace||'';}
    savePreferences();saveLives();renderPlay();renderLibrary();
    say('Route validated. Auto-follow is off.');if(!resume)switchView('Play');
  }catch(e){if(current(task))say('Route rejected: '+e.message);}finally{finish(task);}
}
async function checkEnd(){
  const task=begin('check'),file=active.file,s=bridge().runtime.state;auto=false;
  try{const result=await request('check',{state:JSON.parse(JSON.stringify(s)),goals:file.goals});if(!current(task))return;
    const exact=active.index===file.route.length&&result.signature===file.terminalSignature;
    $('playStatus').textContent=`Life ended. ${result.matched.filter(Boolean).length}/${file.goals.length} conditions met. ${exact?'Full replay matched the predicted ending.':'The final state differs from the saved prediction.'}`;
    say(exact?'Completed: live ending verified.':'Completed with a different ending.');active=null;saveLives();renderPlay();
  }catch(e){if(current(task))say('Ending check failed: '+e.message);}finally{finish(task);}
}
for(const name of ['Find','Play','Saved'])$('tab'+name).onclick=()=>switchView(name);
$('search').onclick=search;$('plan').onclick=planCurrent;$('follow').onclick=follow;
$('stopAuto').onclick=()=>stopFollowing(true,'Following stopped. The game is paused.');$('stopJob').onclick=()=>cancel();
$('apply').onclick=()=>{try{stepRoute();renderPlay();}catch(e){$('playStatus').textContent=e.message;}};
async function waitForLife(seed){
  for(let i=0;i<80;i++){
    const b=bridge();if(b.life&&!b.home&&b.runtime?.state?.seed===seed)return true;
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  return false;
}
$('start').onclick=async()=>{
  const b=bridge();if(!selected||!b.home||selected.origin==='current')return;
  if(lang()!==selected.lang){$('playStatus').textContent='Use this route’s game language first: '+selected.lang;return;}
  if(partnerSame()!==(selected.options.loveSame??false)){$('playStatus').textContent='Use this route’s native Partner’s gender setting before starting: '+(selected.options.loveSame?'Same gender':'Opposite gender')+'.';return;}
  const file=selected;active={file,index:0};saveLives();b.home.onStart(file.options);
  // The native start callback changes its ref before React commits the live
  // controls. Wait for those controls, not merely an animation frame.
  if(await waitForLife(file.seed)&&selected===file){if(file.scope==='life')follow();else $('playStatus').textContent='Started this birth-only seed. Plan this life to predict its ending.';}
  else $('playStatus').textContent='Life started. Press Follow route when the game controls are ready.';renderPlay();
};
$('resume').onclick=async()=>{
  const b=bridge(),savedLife=read('cbl.save.v1');if(!b.home||!savedLife)return;
  b.home.onResume();await waitForLife(savedLife.seed);
  if(selected?.seed===savedLife.seed&&selected.scope==='life')follow();else $('playStatus').textContent='Saved life resumed. Plan it using your targets, or continue playing manually.';renderPlay();
};
$('goHome').onclick=()=>{const b=bridge();if(b.life){C.finished(b.runtime.state)?b.life.abandon():b.life.saveAndQuit();}else b.onHome?.();renderPlay();};
$('copyStats').onclick=()=>{const s=bridge().runtime?.state;if(!s)return;for(const [key,value] of Object.entries(C.displayStats(s)))$('min-'+key).value=value;savePreferences();say('Stats copied as minimum ending targets. You can adjust each value.');};
$('copyTraits').onclick=()=>{const s=bridge().runtime?.state;if(!s)return;for(const key of s.flags)if(catalog.some(c=>c.key==='flag:'+key)){chosen.delete('avoid:'+key);chosen.add('flag:'+key);}syncGoals();savePreferences();say('This life’s listed traits were added as ending requirements.');};
$('filter').oninput=filterGoals;$('goalKind').onchange=filterGoals;$('onlySelected').onchange=filterGoals;$('clear').onclick=()=>{chosen.clear();syncGoals();savePreferences();};
$('sort').onchange=()=>{savePreferences();renderResults();renderLibrary();};
for(const id of ['name','gender','birthplace','seed','count','effort','speed','ending','min-age',...Object.keys(C.statNames).map(k=>'min-'+k)])$(id).oninput=()=>{savePreferences();controls();if(id==='speed'&&auto)bridge().life?.setSpeed(Number($('speed').value));};
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];$('file').value='';if(file)try{await importRoute(JSON.parse(await file.text()));}catch(e){say('Could not read route: '+e.message);}};
$('export').onclick=()=>{if(!selected)return;const url=URL.createObjectURL(new Blob([JSON.stringify(selected,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`cityborn-${selected.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('copy').onclick=async()=>{if(selected)try{await navigator.clipboard.writeText(selected.seed);say('Copied seed '+selected.seed);}catch{say('Seed: '+selected.seed);}};
function movePanel(x,y){const r=host.getBoundingClientRect();position={x:Math.max(4,Math.min(x,innerWidth-r.width-4)),y:Math.max(4,Math.min(y,innerHeight-r.height-4))};host.style.left=position.x+'px';host.style.right='auto';host.style.top=position.y+'px';}
let drag=null;$('drag').onpointerdown=e=>{if(e.button||e.target.closest('button'))return;const r=host.getBoundingClientRect();drag={x:e.clientX-r.x,y:e.clientY-r.y};$('drag').setPointerCapture(e.pointerId);};
$('drag').onpointermove=e=>{if(drag)movePanel(e.clientX-drag.x,e.clientY-drag.y);};$('drag').onpointerup=$('drag').onpointercancel=()=>{if(drag){drag=null;savePreferences();}};
$('drag').onkeydown=e=>{if(e.target.closest('button')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();const r=host.getBoundingClientRect(),d=e.shiftKey?64:16;if(e.key==='Home'){position=null;host.style.left=host.style.right=host.style.top='';}else movePanel(r.x+(e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0),r.y+(e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0));savePreferences();};
$('min').onclick=()=>{$('panel').hidden=true;$('badge').style.display='block';host.style.width='auto';savePreferences();};$('badge').onclick=()=>{$('panel').hidden=false;$('badge').style.display='none';host.style.width='';if(position)movePanel(position.x,position.y);savePreferences();};
if(position)movePanel(position.x,position.y);if(saved.minimized)$('min').onclick();window.addEventListener('resize',()=>{if(position)movePanel(position.x,position.y);});
new ResizeObserver(()=>{if(position)movePanel(position.x,position.y);}).observe(host);
// Native keyboard shortcuts must never interpret typing in companion controls.
shadow.addEventListener('keydown',e=>e.stopPropagation());
document.addEventListener('pointerdown',e=>{if(!e.composedPath().includes(host)){if(auto)stopFollowing(false,'Stopped by manual game interaction.');if(job?.kind==='plan')cancel('Planning cancelled by manual game interaction.');}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(job)cancel();if(auto)stopFollowing(false,'Following stopped.');}else if(!e.composedPath().includes(host)&&auto)stopFollowing(false,'Stopped by manual keyboard input.');},true);
function renderCatalogue(){
    const data=ADVISOR_CATALOG;
    catalog=[...data.flags[lang()].map(([key,name])=>({key:'flag:'+key,name,hint:'Trait · Required at the ending.',trait:key})),...data.records.map(r=>({key:'record:'+r.key,name:r.label[lang()]||r.label.en,hint:r.hint?.[lang()]||r.hint?.en||'No unlock hint is provided by the game.'}))];
    $('catalogSize').textContent=`${data.flags[lang()].length} traits and ${data.records.length} achievements from the inspected game. The number selected is your targets, not the available total.`;
    const valid=new Set(catalog.flatMap(c=>[c.key,...(c.trait?['avoid:'+c.trait]:[])]));chosen=new Set([...chosen].filter(g=>valid.has(g)));
    for(const c of catalog){
      const el=document.createElement('div');el.className='goal';el.dataset.kind=c.trait?'trait':'achievement';const label=document.createElement('label'),input=document.createElement('input'),hint=document.createElement('small');input.type='checkbox';input.value=c.key;label.append(input,document.createTextNode(c.name+' ['+c.key.split(':')[1]+']'));hint.textContent=c.hint;el.append(label,hint);
      input.onchange=()=>{input.checked?chosen.add(c.key):chosen.delete(c.key);if(input.checked&&c.trait)chosen.delete('avoid:'+c.trait);syncGoals();savePreferences();};
      if(c.trait){const avoidLabel=document.createElement('label'),avoid=document.createElement('input');avoidLabel.className='avoid';avoid.type='checkbox';avoid.value='avoid:'+c.trait;avoidLabel.append(avoid,document.createTextNode('Avoid'));avoid.onchange=()=>{avoid.checked?chosen.add(avoid.value):chosen.delete(avoid.value);if(avoid.checked)chosen.delete(c.key);syncGoals();savePreferences();};el.prepend(avoidLabel);}
      $('goals').append(el);
    }
    syncGoals();
}
renderCatalogue();controls();renderLibrary();
if(!supported)say('The game has updated. You can browse the inspected catalogue, but update this companion before searching or following routes.');
else try{
  makeWorker();request('catalog').then(()=>{
    ready=true;renderLibrary();controls();say('Ready. Set your ending targets, then find a life.');
    const old=read('cityborn.advisor.route.v2'),usingLegacy=!stored.active?.file&&!stored.selected,restore=stored.active?.file||stored.selected||old?.found;
    if(restore)importRoute(restore,stored.active||(usingLegacy&&old?.active?{index:old.index||0}:null),true);
  }).catch(e=>say('Could not load companion: '+e.message));
  setInterval(()=>{
    controls();if(view==='Play'&&!job)renderPlay();if(!auto||job||!active)return;
    const s=bridge().runtime?.state;if(!s){stopFollowing(false,'Life closed. Following stopped.');return;}
    if(C.finished(s)){checkEnd();return;}
    if(C.actionable(s))try{stepRoute();}catch(e){stopFollowing(true,e.message);}
  },120);
}catch(e){say('Could not start companion: '+e.message);}
