const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,completeReplay,E,C}=require('./browser-support.cjs');
(async()=>{
  const browser=await launch();
  try{
    for(const field of ['color','ego','relic','child','partner','star','reflect']){
      const test=await open(browser,{live:process.env.TYPING_LIVE==='1',fast:true}),{page,ui}=test;
      E.lang('en');
      // Isolated native save fixtures expose each real text-entry dialog.
      // This test does not claim that these titles were earned in a playthrough.
      const state=E.create(E.data(),{seed:'typing-'+field,name:'Tester',gender:'m'});
      state.age=95;state.plan=[];state.cursor=0;state.stats={health:90,sanity:80,wealth:80,network:80,rep:80};
      state.prompt={kind:['color','reflect'].includes(field)?field:'name',field,age:95,question:'Your '+field,text:field+' entry',choices:[],t:0};
      if(field==='color'){state.flags.push('특색');state.job='해결사';state.grade=1;state.colorAsked=true;}
      if(field==='star')state.pinky={star:0,at:0,blade:null};
      await page.evaluate(state=>localStorage.setItem('cbl.save.v1',JSON.stringify(state)),state);
      await install(page);await ui.locator('#tabPlay').click();await ui.locator('#resume').click();
      await ui.locator('#tabFind').click();await ui.locator('#min-wealth').fill('20');
      await ui.locator('#tabPlay').click();await ui.locator('#plan').click();await status(page,/Plan ready/,180000);
      const before=await native(page,'return b.runtime.state;');
      const originalDownload=page.waitForEvent('download');await ui.locator('#export').click();
      const original=JSON.parse(fs.readFileSync(await (await originalDownload).path(),'utf8'));
      await ui.locator(field==='reflect'?'#apply':'#follow').click();await status(page,/Your input is needed/);
      assert.equal(await native(page,'return b.runtime.paused;'),true,field+' must pause');
      assert.equal(await native(page,'return b.runtime.auto;'),false,'native auto must stay off');
      assert.equal(C.signature(await native(page,'return b.runtime.state;')),C.signature(before),field+' must not be submitted automatically');
      assert.ok(await ui.locator('#follow').isDisabled(),'must submit before resuming');
      assert.match(await ui.locator('#playNext').textContent(),/0\//,'typing does not count as an applied route choice');
      // Waiting survives reload; the script never resumes automatically.
      if(field==='color'){
        await ui.locator('#goHome').click();await page.reload({waitUntil:'networkidle'});await install(page);await status(page,/Route validated/);
        await ui.locator('#tabPlay').click();await ui.locator('#resume').click();
        assert.equal(await ui.locator('#follow').textContent(),'Resume after typing');
        assert.ok(await ui.locator('#follow').isDisabled());
      }
      const text=field==='reflect'?'I chose this path myself.':'Amber Vow';
      await ui.locator('#min').click();
      const input=page.locator(field==='reflect'?'.modal textarea':'.modal input');await input.fill(text);
      await page.locator('.modal .choices button').first().click();
      const entered=await native(page,'return b.runtime.state;');
      if(field==='reflect')assert.equal(entered.reflections.at(-1).text,text);
      else assert.equal(field==='star'?entered.pinky.blade:entered[{color:'colorName',ego:'egoName',relic:'relicName',child:'childName',partner:'partnerName'}[field]],text);
      assert.equal(await native(page,'return b.runtime.paused;'),true,'submission does not restart following');
      await ui.locator('#badge').click();
      if(['color','ego','relic','star','reflect','child'].includes(field)){
        // Replanning must retain this route's goals, not a newly edited draft.
        await ui.locator('#tabFind').click();await ui.locator('#min-wealth').fill('100');await ui.locator('#tabPlay').click();
        await ui.locator('#follow').click();await completeReplay(page);
        assert.match(await ui.locator('#playStatus').textContent(),/Full replay matched/);
        const download=page.waitForEvent('download');await ui.locator('#export').click();
        const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
        assert.deepEqual(file.goals,['stat:wealth:20']);
        assert.equal(file.sort,original.sort,'continuation retains the original ranking preference');
        if(field!=='child'){
          assert.deepEqual(file.route.map(s=>s.i),original.route.slice(1).map(s=>s.i),'cosmetic input retains every remaining choice');
          for(const key of ['age','stats','flags','records','alive','cause'])assert.deepEqual(file.summary[key],original.summary[key],'cosmetic input preserves '+key);
        }
        const final=await native(page,'return b.runtime.state;');
        assert.equal(C.signature(final),file.terminalSignature);
        if(field==='reflect')assert.ok(final.reflections.some(r=>r.text===text));
        else assert.equal(field==='star'?final.pinky.blade:final[{color:'colorName',ego:'egoName',relic:'relicName',child:'childName'}[field]],text);
      }
      assert.deepEqual(test.errors,[]);console.log('Manual typing passed:',field);await test.ctx.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
