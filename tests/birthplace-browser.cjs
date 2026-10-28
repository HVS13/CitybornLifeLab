const fs=require('node:fs'),assert=require('node:assert/strict');
const {launch,open,install,native,status,completeReplay,importFile,E,P,C}=require('./browser-support.cjs');
(async()=>{
  const browser=await launch();
  try{
    const {page,ui,ctx,errors}=await open(browser,{live:process.env.BIRTHPLACE_LIVE==='1',fast:true});await install(page);
    await ui.locator('#startSettings > summary').click();
    const options=await ui.locator('#birthplace option').evaluateAll(nodes=>nodes.map(n=>({id:n.value,name:n.textContent})));
    assert.deepEqual(options,[{id:'',name:'Random'},...Array.from(E.data().regions,r=>({id:r.id,name:r.name}))],'dropdown uses every native region and label');
    await ui.locator('#birthplace').selectOption('H');await ui.locator('#seed').fill('A:123456');
    await ui.locator('#search').click();await status(page,/different birthplace/);
    assert.equal(await native(page,'return b.runtime?.state||null;'),null,'conflicting search never starts a life');
    await ui.locator('#startSettings > summary').click();
    await ui.locator('#birthplace').selectOption('outskirts');await ui.locator('#seed').fill('');await ui.locator('#count').fill('1');
    await ui.locator('#name').fill('Tester');await ui.locator('#min-health').fill('0');
    await page.reload({waitUntil:'networkidle'});await install(page);
    await ui.locator('#startSettings > summary').click();assert.equal(await ui.locator('#birthplace').inputValue(),'outskirts','birthplace preference survives reload');
    // Fix the advisor's random-seed source so CI exercises the random-search
    // branch reproducibly; the game still uses its unmodified seeded RNG.
    await page.workers()[0].evaluate(()=>{crypto.getRandomValues=words=>{words.fill(123456);return words;};});
    await ui.locator('#search').click();await status(page,/matching outcome/,180000);
    const cards=ui.locator('#results .card');assert.ok(await cards.count()>0);
    assert.match(await cards.first().textContent(),/Seed OUT:\d+/);
    assert.ok((await cards.first().textContent()).includes('Birthplace: '+E.data().regions.find(r=>r.id==='outskirts').name));
    await cards.first().getByRole('button',{name:'Choose this life',exact:true}).click();
    const download=page.waitForEvent('download');await ui.locator('#export').click();
    const file=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    assert.equal(file.seed,'OUT:123456','random search prefixes the generated seed');
    assert.equal(file.options.birthplace,'outskirts');assert.equal(E.create(E.data(),file.options).regionId,'outskirts');
    assert.equal(P.validate(file).terminalSignature,file.terminalSignature);
    await ui.locator('#tabFind').click();await ui.locator('#startSettings > summary').click();await ui.locator('#birthplace').selectOption('H');
    await importFile(page,file);await status(page,/Route validated/);
    assert.equal(await ui.locator('#birthplace').inputValue(),'outskirts','import restores the explicit starting selection');
    await ui.locator('#tabPlay').click();await ui.locator('#start').click();await completeReplay(page);
    assert.match(await ui.locator('#playStatus').textContent(),/Full replay matched/);
    const final=await native(page,'return b.runtime.state;');
    assert.equal(final.bornRegionId||final.regionId,'outskirts','migration does not change birthplace');
    assert.equal(file.summary.region,E.data().regions.find(r=>r.id==='outskirts').name);
    assert.equal(file.summary.currentRegion,E.data().regions.find(r=>r.id===final.regionId).name);
    assert.equal(C.signature(final),file.terminalSignature);
    assert.deepEqual(errors,[]);await ctx.close();
    console.log('Birthplace browser passed: native options, conflict, persisted random-region search, export/import, start and full replay.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
