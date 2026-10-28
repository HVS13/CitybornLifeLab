const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,importFile,completeReplay,bridgeCode,E,P,C}=require('./browser-support.cjs');
const fixtures=require('./update-fixtures.cjs');
(async()=>{
  const browser=await launch();
  try{
    const festival=await open(browser,{live:process.env.UPDATE_LIVE==='1',fast:true}),{page,ui}=festival;
    const entry=fixtures.festival(),prepared=P.plan(entry,['record:jf_stop']);
    const partial=P.pack({...prepared.completed[0],options:{seed:entry.seed,name:entry.name,gender:entry.gender,loveSame:false}},['record:jf_stop'],'life','en','current',entry);
    assert.equal(partial.matched[0],false,'seed simulation does not promise the unseeded reward');
    await page.evaluate(s=>localStorage.setItem('cbl.save.v1',JSON.stringify(s)),entry);
    await install(page);await importFile(page,partial);await status(page,/Route validated/);await ui.locator('#resume').click();
    await page.waitForFunction(code=>{const b=Function(code+';return bridge();')();return !!b.life&&b.runtime.state?.prompt?.jf==='enter';},bridgeCode);
    await status(page,/Festival target requires manual play/);
    assert.equal(C.signature(await native(page,'return b.runtime.state;')),C.signature(entry),'Festival goal pauses before automatically skipping the offer');
    // Model the player's entry through the native choice callback. The
    // advisor deliberately cannot choose this unseeded action for a replay.
    await native(page,'b.life.choose(0);if(!b.runtime.paused)b.life.togglePause();');
    await page.locator('.jf-overlay').waitFor();await ui.locator('#plan').click();await status(page,/Finish the Festival manually/);
    assert.equal(await native(page,'return b.runtime.state.prompt.kind;'),'jfgame');
    assert.ok(await ui.locator('#stopAuto').isDisabled());
    await native(page,'b.life.saveFestival({wins:3,used:false});');
    await ui.locator('#goHome').click();await page.reload({waitUntil:'networkidle'});await install(page);await status(page,/Route validated/);
    await ui.locator('#tabPlay').click();await ui.locator('#resume').click();await page.locator('.jf-overlay').waitFor();
    assert.equal(await native(page,'return b.runtime.state.prompt.progress.wins;'),3,'native Festival progress survives reload');
    // Model the player's submitted result, not a fabricated advisor result.
    await native(page,'b.life.submitFestival({end:"stop",w:5,used:false});if(!b.runtime.paused)b.life.togglePause();');
    assert.equal(await native(page,'return b.runtime.state.jf.end;'),'stop');
    await ui.locator('#tabFind').click();await ui.locator('#min-health').fill('100');
    await ui.locator('#tabPlay').click();await ui.locator('#follow').click();await status(page,/Plan ready/,180000);
    const download=page.waitForEvent('download');await ui.locator('#export').click();
    const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    assert.equal(file.startState.jf.w,5);assert.deepEqual(file.goals,['record:jf_stop']);
    assert.equal(P.validate(file).terminalSignature,file.terminalSignature);
    await completeReplay(page); // Resume after input already starts following.
    assert.match(await ui.locator('#playStatus').textContent(),/Full replay matched/);
    assert.equal(C.signature(await native(page,'return b.runtime.state;')),file.terminalSignature);
    assert.deepEqual(festival.errors,[]);await festival.ctx.close();
    const partner=await open(browser,{live:process.env.UPDATE_LIVE==='1',fast:true});
    await partner.page.evaluate(()=>localStorage.setItem('cbl.ui.loveSame','1'));await partner.page.reload({waitUntil:'networkidle'});await install(partner.page);
    const options={seed:'partner-test',gender:'m',name:'Tester',loveSame:false};
    const birth=P.pack({state:E.create(E.data(),options),options,route:[]},[],'birth','en');
    await importFile(partner.page,birth);await status(partner.page,/Route validated/);await partner.ui.locator('#start').click();
    assert.match(await partner.ui.locator('#playStatus').textContent(),/Partner’s gender setting/);
    assert.equal(await native(partner.page,'return b.runtime?.state||null;'),null,'wrong birth preference must not replace the save');
    const sameOptions={...options,loveSame:true},same=P.pack({state:E.create(E.data(),sameOptions),options:sameOptions,route:[]},[],'birth','en');
    await importFile(partner.page,same);await status(partner.page,/Route validated/);await partner.ui.locator('#start').click();
    await partner.page.waitForFunction(code=>{const b=Function(code+';return bridge();')();if(!b.life||!b.runtime.state)return false;if(!b.runtime.paused)b.life.togglePause();return true;},bridgeCode);
    assert.equal(await native(partner.page,'return b.runtime.state.partnerG;'),'m');
    await partner.ui.locator('#tabFind').click();await partner.ui.locator('#min-health').fill('0');await partner.ui.locator('#tabPlay').click();
    await partner.ui.locator('#plan').click();await status(partner.page,/Plan ready/,180000);
    const pd=partner.page.waitForEvent('download');await partner.ui.locator('#export').click();
    const pf=JSON.parse(fs.readFileSync(await (await pd).path(),'utf8'));
    assert.equal(pf.options.loveSame,true,'continuations retain the preference stored in the life');
    assert.equal(P.validate(pf).terminalSignature,pf.terminalSignature);
    await partner.ui.locator('#follow').click();await completeReplay(partner.page);
    assert.match(await partner.ui.locator('#playStatus').textContent(),/Full replay matched/);
    await partner.ui.locator('#tabFind').click();await partner.ui.locator('#startSettings > summary').click();
    await partner.ui.locator('#seed').fill('123456');await partner.ui.locator('#search').click();
    await status(partner.page,/matching outcome/,180000);
    await partner.ui.locator('#results .card').first().getByRole('button',{name:'Choose this life',exact:true}).click();
    const searched=partner.page.waitForEvent('download');await partner.ui.locator('#export').click();
    const sf=JSON.parse(fs.readFileSync(await (await searched).path(),'utf8'));
    assert.equal(sf.options.loveSame,true,'seed searches capture the native partner preference');
    assert.equal(E.create(E.data(),sf.options).partnerG,'m');assert.equal(P.validate(sf).terminalSignature,sf.terminalSignature);
    assert.deepEqual(partner.errors,[]);await partner.ctx.close();
    console.log('Festival/partner browser passed: manual play, reload, actual-result planning, birth preference guard and full replays.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
