const {chromium}=require('playwright');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/cityborn-advisor.user.js','utf8');
const core=source.slice(source.indexOf('function nativeEngine()'),source.indexOf("if (document.getElementById('cityborn-advisor'))"));
const context={};vm.createContext(context);vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);globalThis.C=advisorCommon();',context);
const {E,P,C}=context;
const uiSource=fs.readFileSync('src/userscript.js','utf8');
const bridgeCode=uiSource.slice(uiSource.indexOf('function bridge()'),uiSource.indexOf('function makeWorker()'));
const game='https://project-moon-life.cityborn.workers.dev/';
const waitStatus=(page,pattern,timeout=60000)=>page.locator('#cityborn-advisor').locator('#status').filter({hasText:pattern}).waitFor({timeout});
const native=(page,body,args={})=>page.evaluate(({code,body,args})=>Function('args',code+';const b=bridge();'+body)(args),{code:bridgeCode,body,args});
async function install(page){await page.addScriptTag({content:source});await waitStatus(page,/Ready\.|Route validated/);}
async function importFile(page,file){await page.locator('#cityborn-advisor').locator('#file').setInputFiles({name:'route.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});}
async function fastClock(browser,language='en',delayWorker=false){
 const ctx=await browser.newContext({viewport:{width:1440,height:1100},locale:'en-US'});
 await ctx.addInitScript(({language,delayWorker})=>{
  localStorage.setItem('cbl.lang',language);
  // Test only: native requestAnimationFrame callbacks receive 250ms-ish elapsed
  // ticks. T2 still applies its own 250ms cap, events, timers, holds and RNG.
  const raf=requestAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>raf(t=>callback(t*16));
  if(delayWorker){
   const RealWorker=window.Worker;
   window.Worker=class extends RealWorker{
    set onmessage(handler){super.onmessage=event=>setTimeout(()=>handler(event),window.__advisorDelay||0);}
   };
  }
 },{language,delayWorker});
 const page=await ctx.newPage();await page.goto(game,{waitUntil:'networkidle'});return {ctx,page};
}
(async()=>{
 const browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
 const errors=[],results=[];
 browser.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
 try{
  const basic=await fastClock(browser,'en',true),page=basic.page;
  page.on('pageerror',e=>errors.push(e.message));await install(page);
  let ui=page.locator('#cityborn-advisor');
  const initialBox=await ui.boundingBox();await ui.locator('#drag').press('ArrowLeft');
  const movedBox=await ui.boundingBox();assert.ok(movedBox.x<initialBox.x,'panel can be moved with the keyboard');
  await ui.locator('input[value="record:born_head"]').check();
  await ui.locator('#count').fill('100');await ui.locator('#search').click();
  await ui.locator('#found').filter({hasText:'Complete match'}).waitFor();
  const download=page.waitForEvent('download');await ui.locator('#export').click();
  const exported=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
  assert.equal(exported.version,2);assert.ok(exported.matched.every(Boolean));
  await page.reload({waitUntil:'networkidle'});await install(page);ui=page.locator('#cityborn-advisor');
  await waitStatus(page,/Route validated/);assert.equal(await ui.locator('#auto').textContent(),'Start Auto');
  assert.equal(Math.round((await ui.boundingBox()).x),Math.round(movedBox.x),'panel position survives reload');
  assert.ok(await ui.locator('input[value="record:born_head"]').isChecked());
  await importFile(page,{...exported,source:'wrong.js'});await waitStatus(page,/Route rejected/);
  await importFile(page,exported);await waitStatus(page,/Route validated/);
  // Mutually exclusive birth goals must remain explicitly partial.
  await ui.locator('input[value="record:born_outskirts"]').check();
  await ui.locator('#count').fill('30');await ui.locator('#search').click();
  await waitStatus(page,/No complete match/);assert.match(await ui.locator('#found').textContent(),/Best partial/);
  await ui.locator('#start').click();await native(page,'b.life.setSpeed(32);');
  await page.waitForFunction(code=>!!Function(code+';return bridge();')().runtime?.state?.prompt,bridgeCode);
  await native(page,'b.life.togglePause();');
  // Cancelling a delayed evaluation must not affect the next job or prior pause.
  await page.evaluate(()=>window.__advisorDelay=1200);await ui.locator('#advise').click();
  await ui.locator('#stop').click();await page.evaluate(()=>window.__advisorDelay=0);
  await ui.locator('#advise').click();
  await ui.locator('#advice').filter({hasText:'★'}).waitFor();
  const status=await ui.locator('#status').textContent();
  await page.waitForTimeout(1400);assert.equal(await ui.locator('#status').textContent(),status);
  assert.equal(await native(page,'return b.runtime.paused;'),true,'prior native pause is preserved');
  await ui.locator('#apply').click();assert.equal(await native(page,'return b.runtime.paused;'),true);
  // Forced native fixture: a pending voice is continued, never reported as final.
  const voice=await native(page,"const s=b.runtime.state;s.dead={age:s.age,cause:'뒤틀림',t:.5,voice:true};s.prompt=null;s.plan=[];s.cursor=0;return s;");
  E.lang('en');E.continue(voice,E.data());await ui.locator('#auto').click();
  await page.waitForFunction(code=>!!Function(code+';return bridge();')().runtime?.state?.dr,bridgeCode);
  await ui.locator('#stop').click();
  assert.equal(P.signature(await native(page,'return b.runtime.state;')),P.signature(voice),'Auto voice callback matches native engine transition');
  await page.screenshot({path:'analysis/browser.png'});
  results.push({case:'UI, panel position, export/import, reload persistence, partial results, cancellation, manual apply, pause ownership, forced native voice continuation',passed:true});
  await basic.ctx.close();

  const files=[];
  E.lang('en');
  const fixture=fs.existsSync('analysis/replay-fixture.json')?P.validate(JSON.parse(fs.readFileSync('analysis/replay-fixture.json','utf8'))):P.pack(P.simulate({seed:'123456',name:'',gender:'m'},[]),['record:age80'],'life','en');
  files.push(fixture);
  E.lang('ja');
  files.push(P.pack(P.simulate({seed:'42',name:'Kai',gender:'f'},[]),['record:age80'],'life','ja'));
  for(let index=0;index<files.length;index++){
   const file=files[index],test=await fastClock(browser,file.lang),p=test.page;
   p.on('pageerror',e=>errors.push(e.message));await install(p);await importFile(p,file);await waitStatus(p,/Route validated/);
   let panel=p.locator('#cityborn-advisor');await panel.locator('#start').click();await native(p,'b.life.setSpeed(32);');
   await panel.locator('#auto').click();
   if(index===0){
    await waitStatus(p,/Following saved route/);
    await panel.locator('#stop').click();await native(p,'b.life.saveAndQuit();');
    await p.reload({waitUntil:'networkidle'});await install(p);await waitStatus(p,/Route validated/);
    panel=p.locator('#cityborn-advisor');assert.equal(await panel.locator('#auto').textContent(),'Start Auto');
    await native(p,'b.home.onResume();');await native(p,'b.life.setSpeed(32);');await panel.locator('#auto').click();
   }
   await p.waitForFunction(()=>{
    const text=document.querySelector('#cityborn-advisor').shadowRoot.getElementById('status').textContent;
    return /Life ended\.|Evaluation stopped:|Final-state check failed/.test(text);
   },null,{timeout:180000});
   const message=await panel.locator('#status').textContent();assert.match(message,/Full replay matched/,message);
   const state=await native(p,'return b.runtime.state;');
   E.lang(file.lang);assert.equal(P.signature(state),file.terminalSignature,'complete native state matches offline route');
   assert.deepEqual(Array.from(E.records(state)).sort(),Array.from(file.summary.records).sort());
   results.push({case:'Full native replay',seed:file.seed,language:file.lang,gender:file.options.gender,age:state.age,choices:file.route.length,reloadResume:index===0,passed:true});
   console.log(JSON.stringify(results.at(-1)));await test.ctx.close();
  }
  // A different bundle must not expose enabled execution controls.
  const unsupported=await browser.newPage();await unsupported.goto(game,{waitUntil:'networkidle'});
  await unsupported.evaluate(()=>document.querySelectorAll('script[src*="/assets/index-"]').forEach(s=>s.remove()));
  await unsupported.addScriptTag({content:source});
  assert.ok(await unsupported.locator('#cityborn-advisor').locator('#auto').isDisabled());
  assert.ok(await unsupported.locator('#cityborn-advisor').locator('#search').isDisabled());
  await unsupported.close();
  assert.deepEqual(errors,[]);
  fs.writeFileSync('analysis/browser-results.json',JSON.stringify({passed:true,clock:'accelerated native rAF; unchanged native T2 cap and state transitions',results},null,2));
  console.log('Browser integration regressions passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
