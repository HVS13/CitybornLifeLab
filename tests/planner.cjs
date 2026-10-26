const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/common.js','utf8')+'\n'+fs.readFileSync('src/planner.js','utf8')+';globalThis.make=makePlanner;globalThis.C=advisorCommon();',ctx);
const initial=()=>({v:7,seed:'test',age:0,rngState:1,cursor:0,plan:[],flags:[],log:[],story:[],reflections:[],stats:{health:99,sanity:50,wealth:0,network:0,rep:0},prompt:{kind:'major',choices:Array.from({length:5},(_,i)=>({label:'Path '+i}))}});
const E={data:()=>({regions:[]}),records:()=>[],catalog:[],flags:{Color:'Color'},
 voice:()=>'plain',setVoice:()=>{},recordDetails:()=>[],rarityOrder:{},combatPotential:()=>null,fixerPower:()=>null,promotion:()=>null,
 choose(s,d,i){if(s.stage!==1){s.path=i;s.stage=1;s.stats.wealth=i===4?0:100-i;s.prompt={kind:'major',choices:[{label:'Finish'}]};}else{s.prompt=null;s.stats.health=s.path===4?85:11;if(s.path===4)s.flags.push('Color');}},
 year(s){s.age=20;s.dead={alive:false};},advance(){throw Error('No scheduled events');}};
const P=ctx.make(E),s=initial(),before=JSON.stringify(s);
const quick=P.plan(s,['flag:Color'],'quick'),thorough=P.plan(s,['flag:Color'],'thorough');
assert.ok(quick.completed.length);assert.ok(thorough.completed.length);
assert.equal(P.targets(quick.completed[0].state,['flag:Color'])[0],false,'bounded quick search can miss a low-scoring prerequisite');
assert.equal(P.targets(thorough.completed[0].state,['flag:Color'])[0],true,'alternative paths retain a delayed reward');
assert.equal(JSON.stringify(s),before,'planning does not consume or mutate live state');
const terminal=quick.completed[0].state;
assert.equal(P.targets(terminal,['stat:health:80'])[0],false,'high starting health cannot pass a low final-health check');
const rounded={...terminal,stats:{health:79.6,sanity:42.6,wealth:99.6,network:97.9,rep:91.5}};
assert.ok(P.targets(rounded,['stat:health:80','stat:sanity:43','stat:wealth:100','stat:network:98','stat:rep:92']).every(Boolean),'thresholds use the final screen’s displayed rounding');
assert.equal(P.targets(thorough.completed[0].state,['avoid:Color'])[0],false);
assert.throws(()=>P.checkGoals(['stat:health:101']),/Unknown/);assert.throws(()=>P.checkGoals(['stat:fake:80']),/Unknown/);
assert.throws(()=>P.checkGoals(['flag:Color','flag:Color']),/duplicate/);
const reordered=Object.fromEntries(Object.entries(s).reverse());assert.equal(P.signature(reordered),P.signature(s));
const changed=initial();changed.stats.health--;assert.notEqual(P.signature(changed),P.signature(s));
assert.equal(ctx.C.finished({...s,dead:{voice:true}}),false);
const combat=ctx.make({...E,combatPotential:s=>s.path===4?12:1});
const combatPlan=combat.plan(initial(),['flag:Color'],'quick',()=>{},'potential');
assert.equal(combatPlan.completed[0].state.path,4,'explicit combat sorting guides pruning before the delayed reward');
const milestones=ctx.make({...E,catalog:[{key:'entry'},{key:'rank',implies:'entry'},{key:'leader',implies:'rank'}],records:s=>s.milestones||[]});
const novice={...initial(),milestones:[]},promoted={...initial(),milestones:['entry','rank']};
assert.ok(milestones.score(promoted,['record:leader'])>milestones.score(novice,['record:leader']),'native implied achievements guide an unmet target');
assert.ok(P.score({...initial(),job:'해결사',grade:2},['flag:특색'])>P.score({...initial(),job:'해결사',grade:9},['flag:특색']),'Color progress follows Fixer grades');
assert.equal(P.pack({state:terminal,route:[],options:{}},[],'life','en').summary.comparison.goalProgress,1,'no requirements are fully satisfied for comparison with existing routes');
console.log('Planner regressions passed: alternative routes, final-only stats, displayed rounding, avoid traits, legal conditions, purity, and state identity.');
