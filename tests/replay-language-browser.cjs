const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,bridgeCode,completeReplay,C}=require('./browser-support.cjs');
(async()=>{
  const browser=await launch();
  try{
    const test=await open(browser,{live:process.env.REPLAY_LIVE==='1',language:'en',fast:true}),{page,ui}=test;
    await install(page);
    await native(page,'b.home.onStart({seed:"1289324438",name:"",gender:"m"});');
    await page.waitForFunction(code=>{
      const b=Function(code+';return bridge();')();
      if(!b.life||!b.runtime.state?.prompt)return false;
      if(!b.runtime.paused)b.life.togglePause();return true;
    },bridgeCode);
    // Reproduce the reported pattern: a fresh current-life plan accepts one
    // choice, then diverges because subsequent events use the wrong language.
    await page.evaluate(()=>document.documentElement.lang='ko');
    await ui.locator('#tabPlay').click();await ui.locator('#plan').click();
    await status(page,/Plan ready/,180000);
    const download=page.waitForEvent('download');await ui.locator('#export').click();
    const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    assert.equal(file.lang,'en','planning must use the native saved language, not the page attribute');
    assert.equal(file.startState.age,1,'regression starts at the reported age');
    assert.ok(file.route.length>2,'the test must continue beyond one choice');
    await ui.locator('#follow').click();
    // This client no longer produces a naming prompt on this regression's
    // selected route. The seeded replay test requires a natural typing pause;
    // keep this case focused on the original age-1 language mismatch.
    await completeReplay(page);
    assert.match(await ui.locator('#playStatus').textContent(),/Full replay matched the predicted ending/);
    const state=await native(page,'return b.runtime.state;');
    assert.equal(C.signature(state),file.terminalSignature);
    assert.equal(await page.evaluate(()=>document.documentElement.lang),'ko','the test keeps the conflicting attribute throughout replay');
    assert.deepEqual(test.errors,[]);
    console.log(JSON.stringify({passed:true,seed:file.seed,language:file.lang,pageLanguage:'ko',origin:file.origin,choices:file.route.length,age:state.age,stats:C.displayStats(state)}));
    await test.ctx.close();
    // No saved language: the native game uses the browser language, rather
    // than the page attribute. Cover this at startup without another replay.
    const fallback=await open(browser,{language:'en'});
    await fallback.page.evaluate(()=>{localStorage.removeItem('cbl.lang');document.documentElement.lang='ko';});
    await install(fallback.page);
    assert.match(await fallback.ui.locator('input[value="flag:고아"]').locator('..').textContent(),/Orphan/);
    assert.deepEqual(fallback.errors,[]);await fallback.ctx.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
