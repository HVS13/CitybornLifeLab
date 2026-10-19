const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const vm=require('node:vm');
(async()=>{
 const browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://project-moon-life.cityborn.workers.dev/',{waitUntil:'networkidle'});
 await page.addScriptTag({content:fs.readFileSync('dist/cityborn-advisor.user.js','utf8')});
 const ui=page.locator('#cityborn-advisor');
 await ui.locator('#status').filter({hasText:'Ready.'}).waitFor({timeout:30000});
 await ui.locator('input[value="record:born_head"]').check();
 await ui.locator('#count').fill('100');
 await ui.locator('#search').click();
 await ui.locator('#found').filter({hasText:'Seed'}).waitFor({timeout:60000});
 await ui.locator('#start').click();
 await page.getByRole('button',{name:'x32',exact:true}).click();
 await ui.locator('#auto').click();
 await page.waitForFunction(()=>document.querySelector('#cityborn-advisor').shadowRoot.querySelector('#advice').textContent.includes('★'),null,{timeout:45000});
 await ui.locator('#stop').click();
 assert.match(await ui.locator('#status').textContent(),/Stopped/);
 await page.screenshot({path:'analysis/browser.png'});
 console.log(JSON.stringify({status:await ui.locator('#status').textContent(),found:await ui.locator('#found').textContent(),advice:await ui.locator('#advice').textContent(),errors}));
 assert.deepEqual(errors,[]);
 // Compare native timed prompts against the offline route, not just engine-to-engine replay.
 const source=fs.readFileSync('dist/cityborn-advisor.user.js','utf8');
 const core=source.slice(source.indexOf('function nativeEngine()'),source.indexOf("if (document.getElementById('cityborn-advisor'))"));
 const context={};vm.createContext(context);vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);',context);
 const options={seed:'123456',gender:'m',name:''};
 const state=context.E.create(context.E.data(),options),route=[];
 while(route.length<3 && !state.dead) {
  if(state.prompt){const r=context.P.recommend(state,[]);route.push({signature:r.signature,i:r.best});context.P.apply(state,r.best);}
  else context.P.advance(state);
 }
 const uiSource=fs.readFileSync('src/userscript.js','utf8');
 const bridgeCode=uiSource.slice(uiSource.indexOf('function bridge()'),uiSource.indexOf('function makeWorker()'));
 const second=await browser.newPage();await second.goto('https://project-moon-life.cityborn.workers.dev/',{waitUntil:'networkidle'});
 await second.evaluate(({code,options})=>{const b=Function(code+';return bridge();')();b.home.onStart(options);},{code:bridgeCode,options});
 await second.getByRole('button',{name:'x32',exact:true}).click();
 for(const step of route) {
  await second.waitForFunction(code=>!!Function(code+';return bridge();')().runtime?.state?.prompt,bridgeCode,{timeout:30000});
  const snapshot=await second.evaluate(code=>{const b=Function(code+';return bridge();')();b.life.togglePause();return b.runtime.state;},bridgeCode);
  assert.equal(context.P.signature(snapshot),step.signature,'native timed prompt matches simulated route');
  await second.evaluate(({code,i})=>{const b=Function(code+';return bridge();')();if(['reflect','name','color'].includes(b.runtime.state.prompt.kind))b.life.submitReflection('');else b.life.choose(i);b.life.togglePause();},{code:bridgeCode,i:step.i});
 }
 console.log('Native timed replay: 3 prompts matched the offline route.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
