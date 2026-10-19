const fs=require('node:fs'),vm=require('node:vm');
const {chromium}=require('playwright');
const source=fs.readFileSync('dist/cityborn-advisor.user.js','utf8');
const core=source.slice(source.indexOf('function nativeEngine()'),source.indexOf("if (document.getElementById('cityborn-advisor'))"));
const context={};vm.createContext(context);vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);globalThis.C=advisorCommon();',context);
const uiSource=fs.readFileSync('src/userscript.js','utf8');
const bridgeCode=uiSource.slice(uiSource.indexOf('function bridge()'),uiSource.indexOf('function makeWorker()'));
const game='https://project-moon-life.cityborn.workers.dev/';
const launch=()=>chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
async function open(browser,{live=false,language='en',fast=false,delay=false,width=1440}={}){
  const ctx=await browser.newContext({viewport:{width,height:1100},locale:'en-US',serviceWorkers:'block'});
  await ctx.addInitScript(({language,fast,delay})=>{
    localStorage.setItem('cbl.lang',language);
    if(fast){const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>cb(t*16));}
    if(delay){const Real=Worker;window.Worker=class extends Real{set onmessage(fn){super.onmessage=e=>setTimeout(()=>fn(e),window.__advisorDelay||0);}};}
  },{language,fast,delay});
  if(!live)await ctx.route(game+'**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><body><div id="root"></div><script type="module" src="/assets/index-BujUmHjK.js"></script></body></html>'});
    if(path==='/assets/index-BujUmHjK.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync('analysis/game.bundle.js','utf8')});
    return route.fulfill({status:404,body:''});
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(game,{waitUntil:'networkidle'});
  return {ctx,page,errors,ui:page.locator('#cityborn-advisor')};
}
async function install(page){await page.addScriptTag({content:source});await page.locator('#cityborn-advisor').locator('#status').filter({hasText:/Ready\.|Route validated/}).waitFor();}
const native=(page,body,args={})=>page.evaluate(({code,body,args})=>Function('args',code+';const b=bridge();'+body)(args),{code:bridgeCode,body,args});
const status=(page,pattern,timeout=90000)=>page.locator('#cityborn-advisor').locator('#status').filter({hasText:pattern}).waitFor({timeout});
const importFile=(page,file)=>page.locator('#cityborn-advisor').locator('#file').setInputFiles({name:'route.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});
async function completeReplay(page,timeout=240000){
  const deadline=Date.now()+timeout,ui=page.locator('#cityborn-advisor');let entries=0;
  while(Date.now()<deadline){
    await ui.locator('#playStatus').filter({hasText:/Your input is needed|Life ended|differs|Restore this route/}).waitFor({timeout:Math.max(1,deadline-Date.now())});
    const message=await ui.locator('#playStatus').textContent();
    if(!message.startsWith('Your input is needed'))return {message,entries};
    if(!await native(page,'return b.runtime.paused;'))throw Error('Typing must pause the native game');
    // A test user explicitly chooses a blank entry; production following
    // never submits it. The original predicted route must still replay.
    await native(page,'b.life.submitReflection("");');entries++;
    await ui.locator('#follow').click();
  }
  throw Error('Replay timed out');
}
module.exports={launch,open,install,native,status,importFile,completeReplay,source,bridgeCode,...context};
