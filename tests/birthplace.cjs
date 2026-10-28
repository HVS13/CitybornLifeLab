const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"))+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);',ctx);
const {E,P}=ctx;
for(const {id} of E.data().regions){
  const seed=P.birthSeed('123456',id),state=E.create(E.data(),{seed,name:'Tester',gender:'m'});
  assert.equal(state.regionId,id,'native birth matches selected '+id);
  assert.equal(P.birthSeed(seed,id),seed,'no duplicate prefix');
  assert.equal(P.birthSeed(seed,''),seed,'Random retains explicit seed prefixes');
}
assert.equal(P.birthSeed('123456',''),'123456','Random keeps old seeds unchanged');
assert.equal(P.birthSeed('123456','outskirts'),'OUT:123456');
assert.throws(()=>P.birthSeed('A:123456','H'),/different birthplace/);
assert.throws(()=>P.birthSeed('123456','missing'),/Unknown birthplace/);
const options={seed:'OUT:123456',name:'Tester',gender:'m',birthplace:'outskirts'};
const state=E.create(E.data(),options),file=P.pack({state,options,route:[]},[],'birth','en');
const moved=P.copy(state);moved.bornRegionId=moved.regionId;moved.regionId='A';
const movedFile=P.pack({state:moved,options,route:[]},[],'birth','en');
assert.equal(movedFile.summary.region,E.data().regions.find(r=>r.id==='outskirts').name,'birthplace survives migration');
assert.equal(movedFile.summary.currentRegion,E.data().regions.find(r=>r.id==='A').name,'current area is reported separately');
assert.equal(P.validate(file).options.birthplace,'outskirts','selection survives export/import validation');
assert.equal(P.validate(file).seed,options.seed);
assert.throws(()=>P.validate({...file,options:{...options,birthplace:'H'}}),/different birthplace/);
assert.throws(()=>P.validate({...file,options:{...options,seed:'123456'}}),/does not match route seed/);
const old=JSON.parse(JSON.stringify(file));delete old.options.birthplace;
for(const version of [1,2,3])assert.equal(P.validate({...old,version}).seed,options.seed,'old prefixed route files remain valid');
console.log('Birthplace passed: every native region, prefixes, conflicts, Random and compatible route files.');
