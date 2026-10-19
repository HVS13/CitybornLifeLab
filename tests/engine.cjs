const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8');
const core=built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"));
const ctx={console};vm.createContext(ctx);vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);globalThis.C=advisorCommon();',ctx);
const {E,P}=ctx;
const opts={seed:'123456',name:'',gender:'m'};
const initial=E.create(E.data(),opts), original=JSON.stringify(initial);
const result=P.simulate(opts,[]);
assert.ok(result.complete,'bounded full life completes');
assert.equal(JSON.stringify(initial),original,'simulation does not mutate unrelated state');
const replay=E.create(E.data(),opts);let cursor=0,steps=0;
while(!replay.dead && steps++<5000){
  if(replay.prompt){
    const step=result.route[cursor++];assert.equal(P.signature(replay),step.signature,'every replay random state and prompt match');
    const before=JSON.stringify(replay),advice=P.recommend(replay,[]);
    assert.equal(JSON.stringify(replay),before,'advice does not consume live randomness');
    assert.equal(advice.best,step.i,'same policy produces same action');P.apply(replay,step.i);
  }else P.advance(replay);
}
assert.equal(JSON.stringify(replay),JSON.stringify(result.state),'full route reproduces complete state');
assert.equal(cursor,result.route.length);
const head=E.create(E.data(),{seed:'x',gender:'m',regionId:'A'});
assert.equal(P.targets(head,['record:born_head'])[0],true);
assert.equal(P.targets(head,['flag:absent'])[0],false);
const s=P.copy(result.birth);s.prompt={kind:'major',eventId:'test',choices:[{locked:true},{locked:false}]};
assert.deepEqual(Array.from(P.choices(s)),[1],'locked choices excluded');
const sig=P.signature(s);s.prompt.remainingMs=1234;
assert.equal(P.signature(s),sig,'real-time minor countdown is not route identity');
s.prompt.choices[1].locked=true;
assert.notEqual(P.signature(s),sig,'changed legal choice invalidates route');
const tampered=P.copy(result.birth),before=P.signature(tampered);
tampered.stats.health--;
assert.notEqual(P.signature(tampered),before,'stat changes invalidate route even with same RNG and prompt');
const v=P.copy(result.birth);v.dead={age:0,cause:'뒤틀림',t:.5,voice:true};v.prompt=null;
assert.equal(ctx.C.finished(v),false,'post-death voice is not a completed life');
assert.deepEqual(Array.from(P.choices(v)),[-2]);P.apply(v,-2);
assert.equal(v.dead,null);assert.equal(v.prompt.eventId,'dr_voice','native voice transition creates continuation');
const file=P.pack(result,['record:age80'],'life','en');
const imported=P.validate({...file,matched:[false],summary:{age:9999}});
assert.equal(imported.summary.age,result.state.age,'import recomputes summary');
assert.equal(imported.matched[0],E.records(result.state).includes('age80'),'import recomputes goal claims');
assert.equal(imported.terminalSignature,P.signature(result.state));
const broken=P.copy(file);broken.route[0].i=999;
assert.throws(()=>P.validate(broken),/unavailable|locked/);
assert.throws(()=>P.validate({...file,route:file.route.slice(1)}),/does not match/);
assert.throws(()=>P.validate({...file,source:'unknown.js'}),/Unsupported/);
assert.throws(()=>P.validate({...file,goals:['record:age80','record:age80']}),/duplicate/);
assert.throws(()=>P.validate({...file,options:{...file.options,seed:' '+file.seed}}),/Invalid seed/);
const legacy=P.copy(file),oldState=E.create(E.data(),opts);legacy.version=1;let oldCursor=0;
while(!ctx.C.finished(oldState)){
  if(ctx.C.actionable(oldState)){const step=legacy.route[oldCursor++];step.signature=ctx.C.legacySignature(oldState);P.apply(oldState,step.i);}
  else P.advance(oldState);
}
assert.equal(P.validate(legacy).terminalSignature,file.terminalSignature,'complete v1 exports migrate by native replay');
fs.writeFileSync('analysis/replay-fixture.json',JSON.stringify(file));
console.log(JSON.stringify({passed:true,seed:result.seed,age:result.state.age,choices:cursor,achievements:E.records(result.state).length}));
