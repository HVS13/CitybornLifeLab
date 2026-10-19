const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const built=fs.readFileSync('dist/cityborn-advisor.user.js','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(built.slice(built.indexOf('function nativeEngine()'),built.indexOf("if (document.getElementById('cityborn-advisor'))"))+';globalThis.E=nativeEngine();E.lang("en");globalThis.P=makePlanner(E);globalThis.C=advisorCommon();',ctx);
const {E,P,C}=ctx;
function finish(state,entry){
  const s=P.copy(state),trace=[];let first=true,postEntry;
  for(let n=0;n<5000&&!C.finished(s);n++){
    if(C.actionable(s)){
      const i=P.choices(s)[0];trace.push([s.age,s.prompt?.kind,s.prompt?.eventId,i,s.rngState]);
      if(first){E.choose(s,E.data(),i,{text:entry});postEntry=P.copy(s);first=false;}else P.apply(s,i);
    }else P.advance(s);
  }
  assert.ok(C.finished(s));return {s,trace,postEntry};
}
for(const seed of ['1289324438','42','123456'])for(const field of ['color','ego','relic','star','reflect','child','partner']){
  const s=E.create(E.data(),{seed,name:'Tester',gender:'m'});
  s.age=25;s.plan=[];s.cursor=0;s.stats={health:90,sanity:80,wealth:80,network:80,rep:80};
  s.prompt={kind:['color','reflect'].includes(field)?field:'name',field,age:25,question:'Your '+field,choices:[],t:0};
  if(field==='color'){s.flags.push('특색');s.colorAsked=true;s.job='해결사';s.grade=1;}
  if(field==='ego'){s.flags.push('E.G.O개화');s.egoAsked=true;}
  if(field==='relic'){s.flags.push('유물');s.relicAsked=true;}
  if(field==='star')s.pinky={star:0,at:0,blade:null};
  const blank=finish(s,''),named=finish(s,'Amber Vow'),cosmetic=!['child','partner'].includes(field);
  if(cosmetic){
    assert.deepEqual(named.trace,blank.trace,field+': same seed follows identical events, choices and RNG');
    assert.equal(P.gameplaySignature(named.s),P.gameplaySignature(blank.s),field+': identical complete gameplay state');
    assert.deepEqual(E.records(named.s),E.records(blank.s),field+': identical achievements');
  }else assert.notEqual(named.postEntry.rngState,blank.postEntry.rngState,field+': custom entry skips the native name draw');
  console.log(JSON.stringify({seed,field,sameRngAfterEntry:named.postEntry.rngState===blank.postEntry.rngState,samePath:JSON.stringify(named.trace)===JSON.stringify(blank.trace),blankAge:blank.s.age,namedAge:named.s.age,sameFinalStats:JSON.stringify(named.s.stats)===JSON.stringify(blank.s.stats)}));
}
// The identical-complete-state comparisons above deliberately ignore cosmetic
// text only. Full fingerprints must continue to distinguish the actual names.
const named=E.create(E.data(),{seed:'names',name:'Tester',gender:'m'}),changed=P.copy(named);changed.colorName='Amber Vow';
assert.notEqual(C.signature(named),C.signature(changed));
console.log('Paired naming tests passed: 21 controlled native scenarios, 42 complete lives.');
