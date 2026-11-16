const fs=require('node:fs'),vm=require('node:vm');
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8'),ctx={};vm.createContext(ctx);
// Test-only access to native prompt constructors. Production exports and saves
// are unchanged; these fixtures do not claim naturally earned careers.
const native=fs.readFileSync('analysis/game.bundle.js','utf8'),tickStart=native.indexOf('function eE('),tick=native.slice(tickStart,native.indexOf('\n}',tickStart)+2);
const core=built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"))
  .replace('data:Dt,',`data:Dt,fixtureFestival:s=>e8(s,Dt(),{t:.4}),fixtureFight:Ov,fixtureCrew:s=>{KY(s,Dt());s.crew.rank=5;Ev(s,.4,true);},fixtureSweep:s=>s$(s,Dt(),.4),fixtureTaboo:(s,phase)=>l8(s,Dt(),{tb:phase,t:.4}),fixtureCinqJoin:s=>wI(s,.4),fixtureCinqDuel:s=>{const event=Dt().events.find(e=>e.choices?.some(c=>c.cqDuel?.stage===1)),i=event.choices.findIndex(c=>c.cqDuel);oI(s,Dt(),event,i,{t:.4},event.choices[i].label);},fixtureTick:(r,ms)=>{const ZF=250;return (${tick})(r,Dt(),ms);},`);
vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);globalThis.C=advisorCommon();globalThis.nativeMath=Math;',ctx);
const {E,P,C}=ctx;
function fight(){
  const s=E.create(E.data(),{seed:'corridor-test',gender:'m',name:'Tester',spider:true});
  s.age=35;s.plan=[];s.cursor=0;s.sh.stage='hall';s.sh.cur='엄지';s.sh.child='Child';
  E.fixtureFight(s,.4);return s;
}
function voyage(){const s=E.create(E.data(),{seed:'grand-test',gender:'m',name:'Tester'});s.age=45;s.plan=[];s.cursor=0;E.fixtureCrew(s);return s;}
function festival(){const s=E.create(E.data(),{seed:'J:festival-test',gender:'m',name:'Tester'});s.age=26;s.plan=[];s.cursor=0;E.fixtureFestival(s);return s;}
function random(fn){ctx.nativeMath.random=fn;}
module.exports={E,P,C,fight,voyage,festival,random};
