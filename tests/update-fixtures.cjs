const fs=require('node:fs'),vm=require('node:vm');
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8'),ctx={};vm.createContext(ctx);
// Test-only access to native prompt constructors. Production exports and saves
// are unchanged; these fixtures do not claim naturally earned careers.
const core=built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"))
  .replace('data:ot,','data:ot,fixtureFight:Op,fixtureCrew:s=>{Gv(s,ot());s.crew.rank=5;Ep(s,.4,true);},');
vm.runInContext(core+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);globalThis.C=advisorCommon();',ctx);
const {E,P,C}=ctx;
function fight(){
  const s=E.create(E.data(),{seed:'corridor-test',gender:'m',name:'Tester',spider:true});
  s.age=35;s.plan=[];s.cursor=0;s.sh.stage='hall';s.sh.cur='엄지';s.sh.child='Child';
  E.fixtureFight(s,.4);return s;
}
function voyage(){const s=E.create(E.data(),{seed:'grand-test',gender:'m',name:'Tester'});s.age=45;s.plan=[];s.cursor=0;E.fixtureCrew(s);return s;}
module.exports={E,P,C,fight,voyage};
