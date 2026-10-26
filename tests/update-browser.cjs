const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,completeReplay,importFile,bridgeCode,P,C}=require('./browser-support.cjs');
const fixtures=require('./update-fixtures.cjs');
(async()=>{
  const browser=await launch();
  try{
    const {page,ui,ctx,errors}=await open(browser,{live:process.env.UPDATE_LIVE==='1',fast:true});
    await page.evaluate(s=>localStorage.setItem('cbl.save.v1',JSON.stringify(s)),fixtures.fight());
    await install(page);await ui.locator('#tabPlay').click();await ui.locator('#resume').click();
    await page.waitForFunction(()=>!!document.querySelector('.sh-overlay'));
    await ui.locator('#tabFind').click();await ui.locator('#min-health').fill('0');
    await ui.locator('#tabPlay').click();await ui.locator('#plan').click();await status(page,/Plan ready/,180000);
    const before=await native(page,'return b.runtime.state;');
    await ui.locator('#follow').click();await status(page,/Your input is needed/);
    assert.equal(await native(page,'return b.runtime.paused;'),true);
    assert.equal(C.signature(await native(page,'return b.runtime.state;')),C.signature(before),'no battle result is fabricated');
    assert.ok(await ui.locator('#follow').isDisabled());
    await page.reload({waitUntil:'networkidle'});await install(page);await status(page,/Route validated/);
    await ui.locator('#tabPlay').click();await ui.locator('#resume').click();
    await ui.locator('#playStatus').filter({hasText:/Finish and submit crafting or the corridor battle/}).waitFor();
    assert.equal(await native(page,'return b.runtime.paused;'),true,'corridor input stays paused after reload');
    // The fixture begins at the first corridor. Model the player's explicit
    // battle submission using the same native callback as its minigame.
    await native(page,'b.life.submitFight({won:true,cut:false,hp:5,nohit:true});');
    assert.ok((await native(page,'return b.runtime.state.sh.nohit;')).includes('엄지'));
    assert.ok(await ui.locator('#follow').isDisabled(),'another corridor still needs manual play');
    for(let i=0;i<4;i++)await native(page,'b.life.submitFight({won:true,cut:false,hp:5,nohit:true});');
    assert.equal(await native(page,'return b.runtime.state.sh.ending;'),'whole');
    await ui.locator('#tabFind').click();await ui.locator('#min-health').fill('100');await ui.locator('#tabPlay').click();
    await ui.locator('#follow').click();await completeReplay(page);
    assert.match(await ui.locator('#playStatus').textContent(),/Full replay matched/);
    const download=page.waitForEvent('download');await ui.locator('#export').click();
    const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    assert.deepEqual(file.goals,['stat:health:0']);assert.equal(file.startState.sh.ending,'whole');
    assert.equal(P.validate(file).terminalSignature,C.signature(await native(page,'return b.runtime.state;')));
    assert.deepEqual(errors,[]);await ctx.close();
    const timed=await open(browser,{live:process.env.UPDATE_LIVE==='1',fast:true});
    const state=fixtures.voyage(),plan=P.plan(state,['stat:health:0']);
    const route=P.pack({...plan.completed[0],options:{seed:state.seed,name:state.name,gender:state.gender}},['stat:health:0'],'life','en','current',state);
    await timed.page.evaluate(s=>localStorage.setItem('cbl.save.v1',JSON.stringify(s)),state);
    await install(timed.page);await timed.ui.locator('#tabPlay').click();await timed.ui.locator('#resume').click();
    await timed.page.waitForFunction(code=>{const b=Function(code+';return bridge();')();return !!b.life&&!!b.runtime?.state?.prompt?.realLimit;},bridgeCode);
    assert.equal(await native(timed.page,'return b.runtime.state.prompt.realLimit;'),10000);
    await timed.ui.locator('#plan').click();await status(timed.page,/real-time deadline/);
    await importFile(timed.page,route);await status(timed.page,/Route validated/);await timed.ui.locator('#follow').click();
    await completeReplay(timed.page);assert.match(await timed.ui.locator('#playStatus').textContent(),/Full replay matched/);
    assert.deepEqual(timed.errors,[]);await timed.ctx.close();
    // Both voice settings must survive route validation and export. Reject a
    // live mismatch before following even when the starting state is identical.
    const voice=await open(browser);await voice.page.evaluate(()=>localStorage.setItem('cbl.ui.mentorVoice','spider'));
    await voice.page.reload({waitUntil:'networkidle'});await install(voice.page);
    const old={...route,mentorVoice:'plain'};await importFile(voice.page,old);await status(voice.page,/Route validated/);
    await voice.page.evaluate(s=>localStorage.setItem('cbl.save.v1',JSON.stringify(s)),state);
    await voice.ui.locator('#resume').click();
    await voice.ui.locator('#playStatus').filter({hasText:/Mentor voice/}).waitFor();
    assert.ok(await voice.ui.locator('#stopAuto').isDisabled(),'voice mismatch prevents following');
    await voice.ctx.close();
    console.log('New browser mechanics passed: manual corridor results, original goals, full continuation and timed-route replay.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
