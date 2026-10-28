const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:1000},locale:'en-US',serviceWorkers:'block'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    if(process.env.FILTER_LIVE!=='1'){
      // CI uses the captured native client so the visual regression has no
      // dependency on the live site's uptime, updates, or network resources.
      await page.route('https://project-moon-life.cityborn.workers.dev/**',route=>{
        const path=new URL(route.request().url()).pathname;
        if(path==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><body><div id="root"></div><script type="module" src="/assets/index-BCA1cgB3.js"></script></body></html>'});
        if(path==='/assets/index-BCA1cgB3.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync('analysis/game.bundle.js','utf8')});
        return route.fulfill({status:404,body:''});
      });
    }
    await page.goto('https://project-moon-life.cityborn.workers.dev/',{waitUntil:'networkidle'});
    await page.addScriptTag({content:fs.readFileSync('dist/cityborn-advisor.user.js','utf8')});
    const ui=page.locator('#cityborn-advisor');
    await ui.locator('#status').filter({hasText:'Ready.'}).waitFor();
    await ui.locator('#goalPicker > summary').click();
    const labels=ui.locator('#goals > .goal'),visible=ui.locator('#goals > .goal:visible');
    const total=await labels.count();assert.ok(total>10);
    assert.match(await ui.locator('#catalogSize').textContent(),/51 traits and 294 achievements/);
    assert.equal(await visible.count(),345,'opening the picker lists everything without a query');
    assert.equal(await visible.first().getAttribute('data-kind'),'trait','traits are discoverable first');
    await ui.locator('#goalPicker').screenshot({path:'analysis/filter-browser.png'});
    await ui.locator('#goalKind').selectOption('trait');
    assert.equal(await visible.count(),51,'browse every displayed native trait');
    await ui.locator('#filter').fill('Color');
    assert.equal(await visible.count(),1,'type and query filters intersect');
    await ui.locator('#filter').fill('');
    await ui.locator('#goalKind').selectOption('achievement');
    assert.equal(await visible.count(),294,'browse every native achievement');
    assert.ok(await visible.first().locator('small').textContent(),'achievement includes its native hint');
    await ui.locator('#goalKind').selectOption('all');
    await ui.locator('#filter').fill('cl_arbiter');
    assert.equal(await visible.count(),1,'achievements without native hints remain searchable');
    assert.match(await visible.first().textContent(),/No unlock hint is provided by the game/);
    await ui.locator('#filter').fill('');
    await ui.locator('#filter').pressSequentially('born_head');
    const diagnostics=await labels.evaluateAll(nodes=>({total:nodes.length,hidden:nodes.filter(n=>n.hidden).length,rendered:nodes.filter(n=>getComputedStyle(n).display!=='none').length}));
    console.log('Exact ID filter:',JSON.stringify(diagnostics));
    assert.equal(await visible.count(),1,'born_head must render only its matching goal');
    assert.match(await visible.first().textContent(),/\[born_head\]/);
    assert.match(await ui.locator('#goalCount').textContent(),/^1 of /);
    await ui.locator('#filter').fill('  BORN_HEAD  ');
    assert.equal(await visible.count(),1,'search trims whitespace and ignores case');
    await ui.locator('#filter').fill('no-such-goal-6cf15a');
    assert.equal(await visible.count(),0,'unmatched query hides every goal');
    assert.match(await ui.locator('#goalCount').textContent(),/No matching goals/);
    await ui.locator('#filter').fill('');
    assert.equal(await visible.count(),total,'clearing restores every goal');
    await ui.locator('input[value="record:born_head"]').check();
    await ui.locator('#onlySelected').check();
    assert.equal(await visible.count(),1,'selected-only hides unselected rows');
    await ui.locator('#filter').fill('born_outskirts');
    assert.equal(await visible.count(),0,'query and selected-only intersect');
    await ui.locator('#onlySelected').uncheck();
    assert.equal(await visible.count(),1);
    await ui.locator('#filter').fill('');
    await ui.locator('#clear').click();
    assert.equal(await visible.count(),total);
    await ui.locator('#onlySelected').check();
    assert.equal(await visible.count(),0);
    await ui.locator('#onlySelected').uncheck();
    // Requirements are searchable as well as labels and IDs.
    await ui.locator('#filter').fill('Be born in the A, B or C Corp. district');
    assert.equal(await visible.count(),1);
    await ui.locator('#min').click();
    assert.equal(await ui.locator('#panel').isVisible(),false,'minimize must actually hide its panel');
    await ui.locator('#badge').click();
    assert.equal(await ui.locator('#panel').isVisible(),true);
    assert.deepEqual(errors,[]);
    // Previously an unknown client skipped catalogue initialization entirely.
    // Also cover blocked workers and startup that has not answered yet.
    const support=require('./browser-support.cjs');
    for(const mode of ['updated-client','blocked-worker','loading-worker']){
      const test=await support.open(browser),{page:p,ui:u}=test;
      await p.evaluate(mode=>{
        if(mode==='updated-client')document.querySelector('script[src*="/assets/index-"]').src='/assets/unknown-future-client.js';
        else if(mode==='blocked-worker')window.Worker=class{constructor(){throw Error('Workers blocked for regression');}};
        else window.Worker=class{postMessage(){} terminate(){}};
      },mode);
      await p.addScriptTag({content:support.source});
      await u.locator('#goalPicker > summary').click();
      assert.equal(await u.locator('#goals > .goal:visible').count(),345,mode+' must retain the visible catalogue');
      assert.ok(await u.locator('#search').isDisabled(),mode+' must not enable unavailable simulation');
      if(mode==='updated-client')assert.match(await u.locator('#status').textContent(),/game has updated/);
      if(mode==='blocked-worker')assert.match(await u.locator('#status').textContent(),/Workers blocked/);
      await u.locator('#goalKind').selectOption('trait');
      assert.equal(await u.locator('#goals > .goal:visible').count(),51);
      await u.locator('#filter').fill('Color');
      await u.locator('input[value="flag:특색"]').check();
      assert.equal(await u.locator('#selected').textContent(),'1');
      await test.ctx.close();
    }
    console.log('Catalogue regressions passed: all traits/achievements, type filters, hints, unknown client, worker blocked, worker still loading.');
    console.log(`Filter browser regressions passed (${process.env.FILTER_LIVE==='1'?'live site':'captured client'}): ID, case/whitespace, no match, clear, selected-only, combined filters, requirements, minimize.`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
