const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,completeReplay,E,P,C}=require('./browser-support.cjs');
(async()=>{
  const browser=await launch();
  try{
    const {page,ui,ctx,errors}=await open(browser,{live:process.env.TYPING_LIVE==='1',fast:true});
    // A controlled native save exposes crafting without claiming this career
    // or minigame score was earned in a natural playthrough.
    const state=E.create(E.data(),{seed:'craft-regression',name:'Tester',gender:'m'});
    state.age=95;state.plan=[];state.cursor=0;state.job='공방 직원';state.flags.push('공방');
    state.stats={health:90,sanity:80,wealth:80,network:80,rep:80};
    state.ws={shop:'Test Workshop',field:'날붙이',cls:3,rank:4,best:4,fame:80,gear:5,stock:3,hands:3,guard:2,warn:0,since:25,rankAt:90,tierSeen:1,bestTier:1,lastBig:null,lastWin:null,fingers:[],exclAsked:[],patron:null,mp:null,mpDelay:0,mpNext:null,patent:null,contract:0,teach:false,exclOffer:null,investDue:false};
    state.prompt={kind:'craft',age:95,field:state.ws.field,shop:state.ws.shop,gear:5,stock:3,hands:3,seed:state.seed+':craft:95',progress:null,t:0};
    assert.deepEqual(Array.from(P.choices(state)),[-1]);
    const fallback=P.copy(state);P.apply(fallback,-1);
    assert.ok(fallback.ws.mp,'planner uses the native crafting fallback');
    await page.evaluate(s=>localStorage.setItem('cbl.save.v1',JSON.stringify(s)),state);
    await install(page);await ui.locator('#tabPlay').click();await ui.locator('#resume').click();
    await ui.locator('#tabFind').click();await ui.locator('#min-wealth').fill('20');
    await ui.locator('#tabPlay').click();await ui.locator('#plan').click();await status(page,/Plan ready/,180000);
    await ui.locator('#follow').click();await status(page,/Your input is needed/);
    assert.equal(await native(page,'return b.runtime.paused;'),true);
    assert.equal(C.signature(await native(page,'return b.runtime.state;')),C.signature(state),'following never submits crafting');
    await ui.locator('#min').click();await page.locator('.craft-modal input').fill('Amber Vow');
    await page.getByRole('button',{name:'Make it under this name',exact:true}).click();
    await ui.locator('#badge').click();
    assert.ok(await ui.locator('#follow').isDisabled(),'saving the name is not a completed craft');
    // Simulate the player's minigame progress through the native callback.
    await native(page,'b.life.saveCraft({name:"Amber Vow",named:true,scores:[5,20,45,30]});');
    assert.ok(await ui.locator('#follow').isDisabled(),'all scores still require explicit submission');
    await page.reload({waitUntil:'networkidle'});await install(page);await status(page,/Route validated/);
    await ui.locator('#tabPlay').click();await ui.locator('#resume').click();
    await page.locator('.craft-modal').waitFor();await status(page,/Finish and submit crafting/);
    assert.ok(await ui.locator('#follow').isDisabled(),'unfinished crafting stays paused across reload');
    await native(page,'b.life.submitCraft({name:"Amber Vow",scores:[5,20,45,30]});');
    assert.equal(await native(page,'return b.runtime.state.ws.mp.score;'),100);
    assert.equal(await native(page,'return b.runtime.paused;'),true);
    await ui.locator('#tabFind').click();await ui.locator('#min-wealth').fill('100');await ui.locator('#tabPlay').click();
    await ui.locator('#follow').click();await completeReplay(page);
    assert.match(await ui.locator('#playStatus').textContent(),/Full replay matched/);
    const download=page.waitForEvent('download');await ui.locator('#export').click();
    const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    assert.deepEqual(file.goals,['stat:wealth:20'],'craft continuation retains original targets');
    assert.equal(file.startState.ws.mp.name,'Amber Vow');assert.equal(file.startState.ws.mp.score,100);
    assert.equal(C.signature(await native(page,'return b.runtime.state;')),file.terminalSignature);
    assert.deepEqual(errors,[]);await ctx.close();
    console.log('Crafting passed: native fallback, manual name, progress/reload pause, actual-score replanning, original targets and complete replay.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
