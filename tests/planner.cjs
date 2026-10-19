const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('src/common.js','utf8')+'\n'+fs.readFileSync('src/planner.js','utf8')+';globalThis.make=makePlanner;globalThis.C=advisorCommon();',context);
const initial=()=>({seed:'test',age:0,rngState:1,cursor:0,plan:[],flags:[],log:[],stats:{health:50,sanity:50,wealth:0,network:0,rep:0},prompt:{kind:'major',choices:[{label:'Rich but doomed'},{label:'Stable future'}]}});
const E={data:()=>({}),records:s=>s.age>=20?['long_life']:[],catalog:[],flags:{},
  choose(s,d,i){s.bad=i===0;s.stats.wealth=s.bad?100:0;s.prompt=null;},
  year(s){s.age++;if(s.bad && s.age===5)s.dead={alive:false};else if(s.age===20)s.dead={alive:true};},advance(){throw Error('no planned events');}};
const P=context.make(E),s=initial(),before=JSON.stringify(s);
assert.equal(P.recommend(s,[],'balanced').best,0,'short horizon sees the attractive early reward');
assert.equal(P.recommend(s,[],'deep').best,1,'deeper evaluation detects the later death');
const lifetime=P.recommend(s,['record:long_life'],'life');
assert.equal(lifetime.best,1);assert.ok(lifetime.rows[0].complete);assert.equal(lifetime.rows[0].matched,1);
assert.equal(JSON.stringify(s),before,'all evaluation depths leave source state unchanged');
const changed=initial();changed.flags.push('new progress');assert.notEqual(P.signature(changed),P.signature(s));
const reordered=Object.fromEntries(Object.entries(s).reverse());assert.equal(P.signature(reordered),P.signature(s));
const limited={...s,dead:{voice:true}};assert.equal(context.C.finished(limited),false);
const terminal={...initial(),age:20,prompt:null,dead:{alive:true}};
assert.equal(P.pack({state:terminal,options:{},route:[],complete:true,matched:[false]},['record:long_life'],'life','en').matched[0],true,'export match claims are computed from the supplied goals and state');
console.log('Planner regressions passed: delayed consequence, terminal goals, purity, full-state identity, and pending voice.');
