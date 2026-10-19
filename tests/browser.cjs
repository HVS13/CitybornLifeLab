const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,importFile,completeReplay,E,P,C}=require('./browser-support.cjs');
(async()=>{
  const browser=await launch(),results=[];
  try{
    for(const [index,language] of ['en','ja'].entries()){
      const test=await open(browser,{live:true,language,fast:true}),{page,ui}=test;await install(page);E.lang(language);
      let file;
      if(index===0){
        const result=P.simulate({seed:'123456',name:'',gender:'m'},['stat:wealth:90']);
        assert.ok(result.complete);file=P.pack(result,['stat:wealth:90'],'life',language);
        await importFile(page,file);await status(page,/Route validated/);await ui.locator('#start').click();
        await ui.locator('#playStatus').filter({hasText:/Following \d+\//}).waitFor();await ui.locator('#stopAuto').click();
        await ui.locator('#goHome').click();await page.reload({waitUntil:'networkidle'});await install(page);await status(page,/Route validated/);
        await ui.locator('#tabPlay').click();assert.ok(await ui.locator('#stopAuto').isDisabled(),'reload never starts following');
        assert.match(await ui.locator('#resume').textContent(),/Resume & follow/);await ui.locator('#resume').click();
      }else{
        // Start through a compatible birth-only import, then use the actual
        // player flow to plan the current life against all five stat targets.
        const options={seed:'42',name:'Kai',gender:'f'},birth=E.create(E.data(),options);
        const birthFile=P.pack({state:birth,options,route:[]},[],'birth',language);
        await importFile(page,birthFile);await status(page,/Route validated/);await ui.locator('#start').click();
        await ui.locator('#tabFind').click();
        for(const [key,value] of Object.entries({health:20,sanity:30,wealth:60,network:40,rep:40}))await ui.locator('#min-'+key).fill(String(value));
        await ui.locator('#tabPlay').click();await ui.locator('#plan').click();await status(page,/Plan ready/);
        const download=page.waitForEvent('download');await ui.locator('#export').click();file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
        assert.equal(file.origin,'current');assert.equal(file.goals.filter(g=>g.startsWith('stat:')).length,5);
        assert.equal(P.validate(file).terminalSignature,file.terminalSignature);await ui.locator('#follow').click();
      }
      await completeReplay(page);
      const message=await ui.locator('#playStatus').textContent();assert.match(message,/Full replay matched/,message);
      const state=await native(page,'return b.runtime.state;');
      assert.equal(C.signature(state),file.terminalSignature,'entire terminal state matches');
      assert.deepEqual({...C.displayStats(state)},{...file.summary.stats},'all five displayed final stats match');
      assert.deepEqual(Array.from(E.records(state)).sort(),Array.from(file.summary.records).sort());
      await ui.locator('#tabFind').click();await ui.locator('#copyStats').click();
      for(const [key,value] of Object.entries(C.displayStats(state)))assert.equal(await ui.locator('#min-'+key).inputValue(),String(value));
      await ui.locator('#copyTraits').click();assert.ok(Number(await ui.locator('#selected').textContent())>0);
      results.push({seed:file.seed,language,origin:file.origin,age:state.age,choices:file.route.length,stats:C.displayStats(state),matched:file.matched,goals:file.goals,reloadResume:index===0,passed:true});
      console.log(JSON.stringify(results.at(-1)));assert.deepEqual(test.errors,[]);await test.ctx.close();
    }
    fs.writeFileSync('analysis/browser-results.json',JSON.stringify({passed:true,clock:'accelerated native rAF with unchanged native tick cap',results},null,2));
    console.log('Native player workflows passed: seeded start/follow, save/reload/resume, current-life planning, five final stat filters, and copying real final stats/traits.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
