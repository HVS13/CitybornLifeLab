const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ctx={};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/common.js','utf8')+';globalThis.C=advisorCommon();',ctx);
const C=ctx.C;
function life({goals=['flag:Color'],matched=[true],alive=true,health=80,sanity=80,wealth=50,age=70,power=null,rarity=0}={}){
  return {goals,matched,scope:'life',complete:true,summary:{alive,age,stats:{health,sanity,wealth,network:50,rep:50},comparison:{fixerPower:power,rarityRank:rarity}}};
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
assert.ok(C.compareLives(life({goals:['stat:wealth:90'],matched:[false],wealth:80}),life({goals:['stat:wealth:90'],matched:[false],wealth:20,age:200}))<0,'partial results use numeric progress');
console.log('Ranking regressions passed: goal-first sorting, partial progress, survival, wellbeing, explicit stat/lifespan/rarity/power orders and stable ties.');
