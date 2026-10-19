const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,importFile,bridgeCode,P,C}=require('./browser-support.cjs');
(async()=>{
  const browser=await launch();
  try{
    const test=await open(browser,{live:process.env.PLAYER_LIVE==='1',fast:true,delay:true}),{page,ui}=test;await install(page);
    assert.equal(await ui.locator('#viewFind').isVisible(),true);
    assert.equal(await ui.locator('#viewPlay').isVisible(),false);
    await ui.locator('#drag').press('Shift+ArrowDown');await ui.locator('#drag').press('Shift+ArrowDown');
    await ui.locator('#goalPicker > summary').click();await ui.locator('#startSettings > summary').click();
    await page.waitForFunction(()=>document.querySelector('#cityborn-advisor').getBoundingClientRect().bottom<=innerHeight+1);
    await ui.locator('#startSettings > summary').click();
    await ui.locator('#filter').fill('특색');
    await ui.locator('input[value="flag:특색"]').check();await ui.locator('input[value="avoid:특색"]').check();
    assert.equal(await ui.locator('input[value="flag:특색"]').isChecked(),false,'want and avoid cannot both be selected');
    assert.match(await ui.locator('#selectedGoals').textContent(),/Avoid Color/);
    await ui.locator('#clear').click();await ui.locator('#filter').fill('');await ui.locator('#goalPicker > summary').click();
    await ui.locator('#min-health').fill('101');await ui.locator('#search').click();await status(page,/Check Minimum final Health/);
    await ui.locator('#min-health').fill('');await ui.locator('#min-wealth').fill('90');
    await ui.locator('#startSettings > summary').click();await ui.locator('#seed').fill('123456');
    await ui.locator('#search').click();await status(page,/matching outcome/);
    const cards=ui.locator('#results .card');assert.ok(await cards.count()>0);
    assert.match(await cards.first().textContent(),/Comparison details/);
    await ui.locator('#sort').selectOption('wealth');
    const wealthValues=await cards.evaluateAll(nodes=>nodes.map(n=>Number(n.querySelectorAll('.stats b')[2].textContent)));
    assert.deepEqual(wealthValues,[...wealthValues].sort((a,b)=>b-a),'explicit wealth sorting orders matching results');
    await ui.locator('#sort').selectOption('recommended');
    assert.match(await cards.first().textContent(),/Wealth ≥ 90/);assert.equal(await cards.first().locator('.tag').textContent(),'Match');
    assert.equal(await native(page,'return b.runtime?.state||null;'),null,'search never starts or edits a game life');
    assert.ok(await cards.first().locator('.stats b').nth(2).textContent()>=90);
    const bar=await ui.locator('#topbar').boundingBox(),panel=await ui.locator('#panel').boundingBox();
    assert.ok(bar.y>=panel.y&&bar.y<panel.y+20,'navigation stays visible when showing search results');
    assert.equal(await ui.locator('#topbar').evaluate(el=>{const r=el.getBoundingClientRect();return el.getRootNode().elementFromPoint(r.left+4,r.top+4)?.closest('#topbar')===el;}),true,'sticky navigation is reachable above scrolled results');
    await page.screenshot({path:'analysis/player-browser.png',clip:await ui.boundingBox()});
    await cards.first().getByRole('button',{name:'Choose this life',exact:true}).click();
    assert.equal(await ui.locator('#viewPlay').isVisible(),true);
    const download=page.waitForEvent('download');await ui.locator('#export').click();
    const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    assert.equal(file.version,3);assert.equal(file.scope,'life');assert.ok(file.matched.every(Boolean));assert.ok(file.summary.stats.wealth>=90);
    assert.equal(P.validate(file).terminalSignature,file.terminalSignature);
    await ui.locator('#start').click();
    await ui.locator('#playStatus').filter({hasText:/Following \d+\//}).waitFor().catch(async e=>{
      console.log('Start diagnostics:',await ui.locator('#playStatus').textContent(),await ui.locator('#status').textContent(),await native(page,'return {age:b.runtime?.state?.age,event:b.runtime?.state?.prompt?.eventId,paused:b.runtime?.paused,hasLife:!!b.life};'));
      throw e;
    });
    await ui.locator('#stopAuto').click();assert.equal(await native(page,'return b.runtime.paused;'),true);
    // Arrange a real active prompt, then prove form keyboard input cannot fire
    // the game's numeric choice shortcuts through the shadow root boundary.
    await native(page,'if(b.runtime.paused)b.life.togglePause();');
    await page.waitForFunction(code=>!!Function(code+';return bridge();')().runtime?.state?.prompt,bridgeCode);
    await native(page,'if(!b.runtime.paused)b.life.togglePause();');
    const before=await native(page,'return b.runtime.state;');
    await ui.locator('#tabFind').click();await ui.locator('#min-health').pressSequentially('10');
    assert.equal(C.signature(await native(page,'return b.runtime.state;')),C.signature(before),'typing numeric targets does not choose native options');
    await ui.locator('#tabPlay').click();assert.match(await ui.locator('#playNext').textContent(),/Wealth ≥ 90/,'draft target edits do not erase or silently change the current route');
    // Stop one delayed planning job and start another; late replies must not
    // unpause or overwrite the new job.
    await page.evaluate(()=>window.__advisorDelay=1000);await ui.locator('#plan').click();await ui.locator('#stopJob').click();
    assert.equal(await native(page,'return b.runtime.paused;'),true,'cancellation preserves a preexisting native pause');
    await page.evaluate(()=>window.__advisorDelay=0);await ui.locator('#plan').click();await status(page,/Plan ready/);
    assert.equal(await native(page,'return b.runtime.paused;'),true,'review stays paused');
    const ready=await ui.locator('#status').textContent();await page.waitForTimeout(1200);assert.equal(await ui.locator('#status').textContent(),ready);
    assert.equal(await ui.locator('#start').isDisabled(),true,'a current-life tail cannot be started as a new seeded life');
    const currentDownload=page.waitForEvent('download');await ui.locator('#export').click();
    const current=JSON.parse(fs.readFileSync(await (await currentDownload).path(),'utf8'));
    assert.equal(current.origin,'current');assert.equal(P.validate(current).terminalSignature,current.terminalSignature);
    await ui.locator('#tabSaved').click();assert.ok(await ui.locator('#library .card').count()>=2,'seed routes and current-life tails are saved separately');
    await ui.locator('#tabFind').click();await ui.locator('#min-rep').fill('61');
    await page.reload({waitUntil:'networkidle'});await install(page);await status(page,/Route validated/);
    assert.equal(await ui.locator('#stopAuto').isDisabled(),true,'following stays off after reload');
    await ui.locator('#tabFind').click();assert.equal(await ui.locator('#min-health').inputValue(),'10');
    assert.equal(await ui.locator('#min-rep').inputValue(),'61','restoring a route does not overwrite new search targets');
    await importFile(page,{...file,source:'wrong.js'});await status(page,/Route rejected/);
    // No match is never relabeled as a success, and real ended stats/traits
    // can be copied into a new search without inventing UI labels.
    await ui.locator('#tabFind').click();await ui.locator('#min-health').fill('100');await ui.locator('#min-wealth').fill('100');await ui.locator('#min-sanity').fill('100');
    await ui.locator('#startSettings > summary').click();await ui.locator('#seed').fill('123456');await ui.locator('#search').click();
    await ui.locator('#results .card').first().waitFor({timeout:90000});
    if(await ui.locator('#stopJob').isVisible())await ui.locator('#stopJob').click();
    assert.ok(await ui.locator('#results .card').count()>0,'stopping preserves completed candidates even inside a seed');
    for(const el of await ui.locator('#results .card').all())if((await el.locator('.tag').textContent())==='Match'){
      const values=await el.locator('.stats b').allTextContents();assert.ok(+values[0]>=100&&+values[1]>=100&&+values[2]>=100);
    }
    await page.setViewportSize({width:390,height:844});await ui.locator('#panel').screenshot({path:'analysis/player-mobile.png'});
    const box=await ui.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390,'panel fits a narrow viewport');
    assert.ok(box.y>=0&&box.y+box.height<=845,'expanding the interface keeps it within the viewport');
    await ui.locator('#min').click();assert.ok((await ui.boundingBox()).width<200,'minimized companion is actually compact');
    await ui.locator('#badge').click();assert.ok(await ui.locator('#panel').isVisible());
    const legacy=await open(browser),legacyFile={...file,version:2,goals:['record:age80']};
    await legacy.page.evaluate(({legacyFile})=>{
      localStorage.setItem('cityborn.advisor.preferences.v2',JSON.stringify({goals:['record:born_head'],count:'500',name:'Legacy',gender:'m'}));
      localStorage.setItem('cityborn.advisor.route.v2',JSON.stringify({found:legacyFile,index:0,active:false}));
    },{legacyFile});
    await install(legacy.page);await status(legacy.page,/Route validated/);
    assert.equal(await legacy.ui.locator('#count').inputValue(),'3','old birth-search batch sizes do not become huge full-life searches');
    assert.ok(await legacy.ui.locator('input[value="record:born_head"]').isChecked(),'migration keeps the player’s draft goals');
    assert.ok(await legacy.ui.locator('#stopAuto').isDisabled());await legacy.ctx.close();
    assert.deepEqual(test.errors,[]);console.log('Player browser flows passed: final-stat-only search, result comparison, starting/following, numeric input isolation, current-life planning, cancellation, saved lives, import/export, persistence and mobile layout.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
