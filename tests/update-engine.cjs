const assert=require('node:assert/strict'),{E,P,C,fight,voyage}=require('./update-fixtures.cjs');
const s=fight();assert.equal(s.prompt.kind,'shfight');assert.equal(C.typing(s),true);
assert.deepEqual(Array.from(P.choices(s)),[-1]);
const predicted=P.copy(s);P.apply(predicted,-1);assert.notEqual(C.signature(predicted),C.signature(s),'battle simulations invoke the native fallback');
const actual=P.copy(s);E.choose(actual,E.data(),-1,{won:true,cut:false,hp:5,nohit:true});
assert.ok(actual.sh.nohit.includes('엄지'),'actual battle result is accepted by native engine');
assert.notEqual(C.signature(actual),C.signature(predicted),'player-controlled results require a new plan');
const grand=voyage();assert.equal(grand.prompt.realLimit,10000);assert.ok(P.choices(grand).length);
const timeout=P.copy(grand);E.choose(timeout,E.data(),-99);assert.ok(timeout.dead,'native real-time expiry is a genuine terminal hazard');
const answered=P.copy(grand);P.apply(answered,P.choices(answered)[0]);assert.notEqual(C.signature(answered),C.signature(timeout));
const friend=E.create(E.data(),{seed:'friend-test',name:'Tester',gender:'m'});
friend.friend={g:'f',name:null};friend.prompt={kind:'name',field:'friend',choices:[],t:0};
const blank=P.copy(friend),named=P.copy(friend);E.choose(blank,E.data(),-1,{text:''});E.choose(named,E.data(),-1,{text:'Amber'});
assert.notEqual(blank.rngState,named.rngState,'friend naming can skip a random-name draw');
assert.ok(named.flags.includes('소꿉친구'));
for(const voice of ['plain','spider']){
  E.setVoice(voice);const state=E.create(E.data(),{seed:'voice',name:'Tester',gender:'m'});
  const file=P.pack({state,route:[],options:{seed:'voice',name:'Tester',gender:'m'}},[],'birth','en');
  assert.equal(file.mentorVoice,voice);E.setVoice(voice==='plain'?'spider':'plain');
  assert.equal(P.validate(file).mentorVoice,voice,'validation restores the route voice');
}
E.setVoice('plain');assert.throws(()=>P.validate({version:3,source:C.source,mentorVoice:'unknown'}),/Unknown mentor voice/);
const fixtures=require('./update-fixtures.cjs'),entry=fixtures.festival();
assert.deepEqual(Array.from(P.choices(entry)),[1],'seed-replay plans skip the unseeded Festival entry');
assert.throws(()=>P.apply(P.copy(entry),0),/unavailable/,'imports cannot approve unseeded entry actions');
const originalRandom=Math.random;
fixtures.random(()=>{throw Error('Unexpected unseeded random draw');});
const skipped=P.copy(entry);P.apply(skipped,1);assert.equal(skipped.jf.end,'walk');
const skipPlan=P.plan(entry,['record:jf_walk']);assert.ok(skipPlan.completed.length,'seeded planning can complete through the deterministic skip path');
fixtures.random(()=>0.1);const patched=P.copy(entry);E.choose(patched,E.data(),0);
fixtures.random(()=>0.9);const plain=P.copy(entry);E.choose(plain,E.data(),0);
assert.equal(patched.prompt.patch,true);assert.equal(plain.prompt.patch,false);
assert.equal(patched.rngState,plain.rngState,'Festival changes even with identical seeded RNG');
assert.notEqual(C.signature(patched),C.signature(plain));
assert.deepEqual(Array.from(P.choices(patched)),[]);
assert.throws(()=>P.plan(patched,[]),/Finish the Festival manually/);
E.choose(patched,E.data(),-1,{end:'jack',w:7,used:false});
assert.ok(E.records(patched).includes('jf_star'),'actual Festival results can be used by subsequent plans');
fixtures.random(originalRandom);
for(const loveSame of [false,true]){
  const options={seed:'partner-test',name:'Tester',gender:'m',loveSame},birth=E.create(E.data(),options);
  assert.equal(birth.partnerG,loveSame?'m':'f');
  const file=P.pack({state:birth,route:[],options},[],'birth','en');
  assert.equal(P.validate(file).options.loveSame,loveSame,'partner-gender choice survives validation');
  assert.throws(()=>P.validate({...file,options:{...options,loveSame:'yes'}}),/Invalid partner/);
}
console.log('Updated mechanics passed: native corridor fallback/actual result, timed voyage expiry, friend-name RNG, and route voice.');
console.log('Festival/partner tests passed: unseeded draw detection, deterministic skip plans, manual result and birth-setting round trips.');
