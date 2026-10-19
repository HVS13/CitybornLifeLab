const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8');
const core=built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"));
const ctx={console};vm.createContext(ctx);vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);',ctx);
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
console.log(JSON.stringify({passed:true,seed:result.seed,age:result.state.age,choices:cursor,achievements:E.records(result.state).length}));
