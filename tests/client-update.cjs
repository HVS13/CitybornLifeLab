const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {E,P,C}=require('./update-fixtures.cjs');

// Replay through the actual native clock driver, whose public entry points
// also apply spouse and shattered-Sanity updates after every transition.
function replay(start,result){
  const runtime={state:P.copy(start),progress:0,speed:32,paused:false,auto:false};let index=0;
  for(let n=0;n<30000&&!C.finished(runtime.state);n++){
    const state=runtime.state;
    if(C.actionable(state)){
      const step=result.route[index++];assert.ok(step,'native replay has a planned choice');
      assert.equal(C.signature(state),step.signature,'native clock and planned state match before every choice');
      P.apply(state,step.i);
    }else E.fixtureTick(runtime,250);
  }
  assert.ok(C.finished(runtime.state));assert.equal(index,result.route.length);
  assert.equal(C.signature(runtime.state),C.signature(result.state),'native clock reproduces the complete ending');
}
for(const arMem of [{n:0},{n:1,prev:{name:'Previous',pick:'pillar'}}]){
  const options={seed:'A:0',name:'Tester',gender:'m',arMem},birth=E.create(E.data(),options);
  assert.equal(birth.ar.n,arMem.n+1);assert.equal(birth.ar.end,arMem.n?'extract':'mist');
  assert.ok(E.records(birth).includes('ar_arbiter'));
  const result=P.simulate(options,[]);assert.ok(result.complete);replay(birth,result);
  const file=P.pack(result,[],'life','en');assert.deepEqual(JSON.parse(JSON.stringify(P.validate(file).options.arMem)),arMem);
  assert.equal(C.arbiterStartMatches(file,arMem),true);
  assert.equal(C.arbiterStartMatches(file,{n:arMem.n+1}),false,'a later Arbiter cycle requires a new search');
  if(arMem.prev)assert.equal(C.arbiterStartMatches(file,{n:1,prev:{name:'Other',pick:'lock'}}),false);
  assert.throws(()=>P.validate({...file,options:{...options,arMem:{n:-1}}}),/Invalid Arbiter history/);
  console.log('Arbiter cycle passed:',birth.ar.n);
}
const sweep=E.create(E.data(),{seed:'sweep-test',name:'Tester',gender:'m'});
Object.assign(sweep,{age:35,job:'해결사',grade:1,plan:[],cursor:0});
sweep.stats={health:100,sanity:100,wealth:100,network:100,rep:100};sweep.flags.push('특색');
E.fixtureSweep(sweep);assert.equal(sweep.prompt.sw,'enter');
P.apply(sweep,2);assert.equal(sweep.prompt.sw,'rule');P.apply(sweep,0);
const battle=P.plan(sweep,[]).completed[0];assert.ok(battle);replay(sweep,battle);
console.log('Sweeper combat passed:',battle.route.length,'replay choices');

const sign=E.create(E.data(),{seed:'taboo-test',name:'Tester',gender:'m'});
Object.assign(sign,{age:95,job:'해결사',grade:1,plan:[],cursor:0});
sign.stats={health:100,sanity:100,wealth:100,network:100,rep:100};
E.fixtureTaboo(sign,'offer');P.apply(sign,0);
assert.equal(sign.prompt.kind,'taboo');assert.equal(sign.prompt.tb,'sign');
assert.equal(C.typing(sign),true);assert.deepEqual(Array.from(P.choices(sign)),[-1]);
const contract=P.copy(sign);
P.apply(sign,-1);E.fixtureTaboo(sign,'hunt');const hunt=P.copy(sign);
const predicted=P.copy(hunt);P.apply(predicted,-1);
assert.notEqual(C.signature(predicted),C.signature(hunt),'the native fallback resolves the hunt');
const actual=P.copy(hunt);E.choose(actual,E.data(),-1,{end:'win',day:1,hurt:0,wrong:[]});
assert.equal(actual.tb.caught.length,1,'explicit player results use the native handler');
assert.notEqual(C.signature(actual),C.signature(predicted),'manual results are not assumed to match fallback predictions');
const continuation=P.plan(actual,['record:tb_hunter']).completed[0];assert.ok(continuation);replay(actual,continuation);

// Execute the production UI handlers in a local harness; no browser or game
// storage is needed to verify pause, no automatic submission, and replanning.
const ui=fs.readFileSync('src/userscript.js','utf8');
function handler(name){const start=ui.indexOf('function '+name+'(');return ui.slice(start,ui.indexOf('\n}',start)+2);}
for(const input of [contract,hunt]){
  const state=P.copy(input),runtime={state,paused:false,auto:true},message={},file={seed:state.seed,scope:'life',lang:'en',mentorVoice:'plain',goals:['record:tb_hunter'],sort:'rarity',route:[{signature:C.signature(state),i:-1,afterSignature:C.signature(predicted)}]};
  let submissions=0,replanned;
  const context={C,active:{file,index:0},selected:file,auto:true,
    bridge:()=>({runtime,life:{togglePause:()=>runtime.paused=!runtime.paused,toggleAuto:()=>runtime.auto=!runtime.auto,choose:()=>submissions++}}),
    mentorVoice:()=> 'plain',lang:()=> 'en',saveLives:()=>{},controls:()=>{},say:()=>{},$:()=>message,
    nativeChoose:()=>submissions++,planCurrent:args=>replanned=args};
  vm.createContext(context);vm.runInContext(handler('stepRoute')+handler('stopFollowing')+handler('follow')+';stepRoute();',context);
  assert.equal(submissions,0);assert.equal(runtime.paused,true);assert.equal(runtime.auto,false);
  assert.equal(context.active.waitingForTyping.before,C.signature(state));assert.match(message.textContent,/Taboo Hunter/);
  vm.runInContext('follow();',context);assert.equal(replanned,undefined,'saved/in-progress minigames stay paused');
  runtime.state=P.copy(actual);vm.runInContext('follow();',context);
  assert.deepEqual(Array.from(replanned.goals),file.goals);assert.equal(replanned.sort,'rarity');assert.equal(replanned.followAfter,true);
}
console.log('Taboo Hunter passed: native fallback, actual-result continuation, manual pause and original-goal replanning.');

// Exercise the actual worker search boundary: the Arbiter memory must reach
// native creation and survive route export/import, rather than defaulting.
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8'),workerContext={crypto:{getRandomValues:a=>a.fill(0)},self:{postMessage:m=>{if(m.result)workerContext.result=m.result;if(m.error)throw Error(m.error);}}};
vm.createContext(workerContext);
vm.runInContext(built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"))+';workerMain();',workerContext);
workerContext.self.onmessage({data:{id:1,type:'search',lang:'en',mentorVoice:'plain',seed:'A:0',options:{name:'Tester',gender:'m',arMem:{n:1,prev:{name:'Previous',pick:'pillar'}}},goals:[],effort:'quick',sort:'recommended'}});
assert.ok(workerContext.result.results.length);
for(const file of workerContext.result.results){
  assert.equal(file.options.arMem.n,1);assert.equal(E.create(E.data(),file.options).ar.end,'extract');
  assert.ok(P.validate(file).complete);
}

// The production start handler checks history before calling the native
// home callback, which obtains memory from storage rather than route options.
(async()=>{
  const file=workerContext.result.results[0],elements={start:{},playStatus:{}},startAt=ui.indexOf("$('start').onclick=async()=>{"),end=ui.indexOf("$('resume').onclick",startAt);
  let starts=0;
  const context={C,selected:file,active:null,$:id=>elements[id],bridge:()=>({home:{onStart:()=>starts++}}),lang:()=> 'en',partnerSame:()=>false,
    eraSettings:()=>({eras:true,forceEra:''}),read:()=>({n:2}),saveLives:()=>{},waitForLife:async()=>true,follow:()=>{},renderPlay:()=>{}};
  vm.createContext(context);vm.runInContext(ui.slice(startAt,end),context);
  await elements.start.onclick();assert.equal(starts,0);assert.match(elements.playStatus.textContent,/Arbiter history changed/);
  context.read=()=>file.options.arMem;await elements.start.onclick();assert.equal(starts,1);
  console.log('Arbiter worker/start passed: current history captured, compatible export and changed-history start blocked.');
})().catch(error=>{console.error(error);process.exitCode=1;});
