const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ctx={};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/common.js','utf8')+';globalThis.C=advisorCommon();',ctx);
const C=ctx.C;
function life({goals=['flag:Color'],matched=[true],alive=true,health=80,sanity=80,wealth=50,age=70,power=null,potential=null,rarity=0,profile=Array(7).fill(0),count=0,progress}={}){
  return {goals,matched,scope:'life',complete:true,summary:{alive,age,stats:{health,sanity,wealth,network:50,rep:50},comparison:{fixerPower:power,combatPotential:potential,rarityRank:rarity,rarityProfile:profile,achievementCount:count,goalProgress:progress}}};
}
const partial=life({matched:[false],age:300,wealth:100,power:20,rarity:9}),match=life({alive:false,health:1,sanity:1,wealth:0,age:20});
for(const sort of Object.keys(C.sorts))assert.ok(C.compareLives(match,partial,sort)<0,'required goal fit outranks '+sort);
assert.ok(C.compareLives(life(),life({alive:false,age:200,wealth:100}))<0,'recommended prefers an alive ending');
assert.ok(C.compareLives(life({health:5,age:100}),life())<0,'years actually lived outrank terminal health');
assert.ok(C.compareLives(life(),life({health:5,wealth:100}))<0,'equal lifespans prefer wellbeing before wealth');
assert.ok(C.compareLives(life({wealth:100,health:5}),life(),'wealth')<0);
assert.ok(C.compareLives(life({age:100,health:5}),life(),'age')<0);
assert.ok(C.compareLives(life({rarity:5}),life(),'rarity')<0);
assert.ok(C.compareLives(life({power:6}),life({power:null}),'power')<0,'Fixer-only metric treats other careers as not applicable');
assert.equal(C.compareLives(life(),life()),0,'ties preserve stable source order');
assert.ok(C.compareLives(life({rarity:4,profile:[0,0,2,0,0,0,0]}),life({rarity:4,profile:[0,0,1,10,0,0,0]}),'rarity')<0,'rarity ties prefer more achievements in the higher tier');
assert.ok(C.compareLives(life({count:20}),life({count:5,rarity:6}),'achievements')<0,'achievement count is a separate preference');
assert.ok(C.compareLives(life({potential:12}),life({potential:null,power:15}),'potential')<0,'combat potential is separate from Fixer request rating');
assert.ok(C.compareLives(life({potential:-2}),life({potential:null}),'potential')<0,'an unavailable rating is not a numeric score of -1');
assert.ok(C.compareLives(life({goals:[],matched:[],progress:1,wealth:100}),life({goals:[],matched:[],wealth:20}),'wealth')<0,'new and existing no-goal routes use the same satisfaction baseline');
assert.ok(C.compareLives(life({matched:[false],progress:.8}),life({matched:[false],progress:.2,age:200}))<0,'native prerequisite progress orders incomplete goals');
assert.ok(C.compareLives(life({goals:['stat:wealth:90'],matched:[false],wealth:80}),life({goals:['stat:wealth:90'],matched:[false],wealth:20,age:200}))<0,'partial results use numeric progress');
console.log('Ranking regressions passed: goal-first sorting, partial progress, survival, wellbeing, explicit stat/lifespan/rarity/power orders and stable ties.');
