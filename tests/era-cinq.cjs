const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {E,P,C}=require('./update-fixtures.cjs');
const ui=fs.readFileSync('src/userscript.js','utf8');
function handler(name){const start=ui.indexOf('function '+name+'(');return ui.slice(start,ui.indexOf('\n}',start)+2);}
function replay(start,result){
  const runtime={state:P.copy(start),progress:0,speed:32,paused:false,auto:false};let index=0;
  for(let n=0;n<30000&&!C.finished(runtime.state);n++){
    if(C.actionable(runtime.state)){
      const step=result.route[index++];assert.ok(step);
      assert.equal(C.signature(runtime.state),step.signature);
      assert.equal(P.apply(runtime.state,step.i),step.shin||0);
    }else E.fixtureTick(runtime,250);
  }
  assert.ok(C.finished(runtime.state));assert.equal(index,result.route.length);
  assert.equal(C.signature(runtime.state),C.signature(result.state));
}
const options={seed:'0',name:'Tester',gender:'m',eras:true,forceEra:''};
const era=E.create(E.data(),options),off=E.create(E.data(),{...options,eras:false});
assert.ok(era.smw);assert.equal(off.smw,undefined);
assert.ok(E.create(E.data(),{...options,eras:false,forceEra:'smoke'}).smw,'the URL override also applies with Eras off');
const eraPlan=P.plan(era,['record:smw_era']).completed[0];assert.ok(eraPlan);replay(era,eraPlan);
const eraFile=P.pack({...eraPlan,options},['record:smw_era'],'life','en');
assert.equal(P.validate(eraFile).options.eras,true);
assert.equal(P.validate(eraFile).options.forceEra,'');
assert.throws(()=>P.validate({...eraFile,options:{...options,eras:false}}),'changing a route birth setting changes its state');
assert.throws(()=>P.validate({...eraFile,options:{...options,eras:'on'}}),/Invalid era setting/);
console.log('Smoke War passed: native birth setting, URL override, route validation and full native-clock replay.');

const hardOptions={seed:'123456',name:'Tester',gender:'m',hard:true};
const hard=P.simulate(hardOptions,[]);
assert.ok(hard.complete);assert.equal(hard.birth.hard,true);
assert.equal(E.create(E.data(),{...hardOptions,hard:false}).hard,undefined);
const hardFile=P.pack(hard,[],'life','en');
assert.equal(P.validate(hardFile).options.hard,true);
assert.equal(hardFile.summary.hard,true);
assert.throws(()=>P.validate({...hardFile,options:{...hardOptions,hard:false}}),/seeded simulation/);
replay(hard.birth,hard);

const join=E.create(E.data(),{seed:'123456',name:'Tester',gender:'m',eras:false});
Object.assign(join,{age:95,job:'해결사',grade:3,plan:[],cursor:0,prompt:null,org:{type:'assoc',ko:'섕크 협회',name:'Cinq Association',sec:3,first:3,at:95}});
join.stats={health:100,sanity:100,wealth:100,network:100,rep:100};
E.fixtureCinqJoin(join);assert.equal(join.prompt.kind,'cq');assert.equal(join.prompt.cq,'join');
assert.equal(C.typing(join),true);assert.deepEqual(Array.from(P.choices(join)),[-1]);
const named=P.copy(join);E.choose(named,E.data(),-1,{style:'rock',name:'Amber Vow'});
assert.equal(named.cq.style,'rock');assert.equal(named.cq.weapon,'Amber Vow');
const predictedJoin=P.copy(join);P.apply(predictedJoin,-1);assert.notEqual(C.signature(predictedJoin),C.signature(named));
const duel=P.copy(named);E.fixtureCinqDuel(duel);assert.equal(duel.prompt.cq,'duel');
const fallback=P.copy(duel);P.apply(fallback,-1);
const actual=P.copy(duel);E.choose(actual,E.data(),-1,{win:true});
assert.equal(actual.cq.wins,1);assert.equal(actual.prompt.cq,'reward');
const reward=P.copy(actual);E.choose(actual,E.data(),-1,{pick:0});
assert.equal(actual.prompt,null);
const continuation=P.plan(actual,[]).completed[0];assert.ok(continuation);replay(actual,continuation);
for(const start of [join,duel,reward]){
  const state=P.copy(start),runtime={state,paused:false,auto:true},message={},file={seed:state.seed,scope:'life',lang:'en',goals:[],route:[{signature:C.signature(state),i:-1,afterSignature:C.signature(fallback)}]};
  let submissions=0,replanned;
  const context={C,active:{file,index:0},selected:file,auto:true,
    bridge:()=>({runtime,life:{togglePause:()=>runtime.paused=!runtime.paused,toggleAuto:()=>runtime.auto=!runtime.auto}}),
    mentorVoice:()=> 'plain',lang:()=> 'en',saveLives:()=>{},controls:()=>{},say:()=>{},$:()=>message,
    nativeChoose:()=>submissions++,planCurrent:args=>replanned=args};
  vm.createContext(context);vm.runInContext(handler('stepRoute')+handler('stopFollowing')+handler('follow')+';stepRoute();',context);
  assert.equal(submissions,0);assert.equal(runtime.paused,true);assert.equal(runtime.auto,false);assert.match(message.textContent,/Cinq/);
  vm.runInContext('follow();',context);assert.equal(replanned,undefined,'unfinished Cinq input stays paused');
  runtime.state=P.copy(actual);vm.runInContext('follow();',context);assert.equal(replanned.followAfter,true);
}
console.log('Cinq passed: native style/name, duel result, reward, full continuation, pause and resume handlers.');

// Use a genuine native event and the native auto policy for Shin/Mang. The
// planned level must be forwarded unchanged through the production follower.
const shin=P.copy(off);Object.assign(shin,{age:95,job:'해결사',grade:3,shin:{lv:2,mang:true,use:0},plan:[],cursor:0});
const event=E.data().events.find(e=>e.major&&e.choices?.some(c=>c.outcomes?.some(o=>o.death)));
assert.ok(event);shin.prompt={kind:'major',eventId:event.id,choices:event.choices.map(c=>({label:c.label,odds:{die:20}})),shin:{lv:2,mangOk:true},t:.4};
const level=E.shinForChoice(shin,0);assert.equal(level,2);
const applied=P.copy(shin),direct=P.copy(shin);assert.equal(P.apply(applied,0),level);E.choose(direct,E.data(),0,{text:'',shin:level});
assert.equal(C.signature(applied),C.signature(direct));
assert.equal(applied._shinLv,undefined,'the native transient modifier is removed');
const shinPlan=P.plan(shin,[]).completed[0];assert.ok(shinPlan);assert.equal(shinPlan.route[0].shin,2);
replay(shin,shinPlan);
let chosen;const follower={nativeChoose:null};vm.createContext(follower);
vm.runInContext(handler('nativeChoose')+';this.chooseNative=nativeChoose;',follower);
follower.chooseNative({runtime:{state:shin},life:{choose:(i,opts)=>chosen={i,opts}}},0,level);
assert.equal(chosen.opts.shin,level);

const bridgeRuntime={state:off,progress:0,paused:false,speed:1};
const lcTree={memoizedProps:{gateIn:false,onExit:()=>{},life:{choose:()=>{}}},memoizedState:{memoizedState:{current:bridgeRuntime}},child:null,sibling:null};
const bridgeContext={document:{getElementById:()=>({'__reactContainer$test':lcTree})}};vm.createContext(bridgeContext);
vm.runInContext(handler('bridge')+';this.result=bridge();',bridgeContext);
assert.equal(bridgeContext.result.extra,true);assert.equal(bridgeContext.result.life,null);assert.equal(bridgeContext.result.runtime,null);

E.lang('zh');const zhOptions={seed:'123456',name:'Tester',gender:'m',eras:false},zh=P.simulate(zhOptions,[]);assert.ok(zh.complete);
replay(E.create(E.data(),zhOptions),zh);const zhFile=P.pack(zh,[],'life','zh');assert.equal(P.validate(zhFile).lang,'zh');E.lang('en');
const language={localStorage:{getItem:()=> 'zh'},navigator:{language:'en-US'}};vm.createContext(language);vm.runInContext(handler('lang')+';this.value=lang();',language);assert.equal(language.value,'zh');
console.log('Shin/Mang, separate-mode isolation and Chinese native-clock/route language passed.');

(async()=>{
  const elements={start:{},playStatus:{}},a=ui.indexOf("$('start').onclick=async()=>{"),b=ui.indexOf("$('resume').onclick",a);let starts=0;
  const context={C,selected:eraFile,active:null,$:id=>elements[id],bridge:()=>({home:{onStart:()=>starts++}}),lang:()=> 'en',partnerSame:()=>false,hardMode:()=>false,
    read:()=>({}),eraSettings:()=>({eras:false,forceEra:''}),saveLives:()=>{},waitForLife:async()=>true,follow:()=>{},renderPlay:()=>{}};
  vm.createContext(context);vm.runInContext(ui.slice(a,b),context);await elements.start.onclick();
  assert.equal(starts,0);assert.match(elements.playStatus.textContent,/Eras/);
  context.eraSettings=()=>({eras:true,forceEra:'smoke'});await elements.start.onclick();assert.equal(starts,0);
  context.eraSettings=()=>({eras:true,forceEra:''});await elements.start.onclick();assert.equal(starts,1);
  context.selected=hardFile;await elements.start.onclick();assert.equal(starts,1);
  assert.match(elements.playStatus.textContent,/difficulty to Hard/);
  context.hardMode=()=>true;await elements.start.onclick();assert.equal(starts,2);
  console.log('Start handler passed: era setting and URL must match before native start.');
})().catch(error=>{console.error(error);process.exitCode=1;});
