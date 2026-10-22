function makePlanner(E) {
  const C=advisorCommon(),copy=s=>JSON.parse(JSON.stringify(s));
  function branch(s){
    // Native history entries are read-only except the last log entry. Copy
    // mutable state and that entry, rather than serializing the full history
    // for every alternative. This is specific to the inspected engine.
    const out=copy({...s,log:[],story:[],reflections:[]});
    out.log=s.log.slice();if(out.log.length)out.log[out.log.length-1]=copy(out.log[out.log.length-1]);
    out.story=(s.story||[]).slice();out.reflections=(s.reflections||[]).slice();return out;
  }
  const efforts={quick:3,thorough:8};
  const prerequisites=new Map(E.catalog.map(r=>[r.key,r.implies]));
  const recordTiers=new Map(E.catalog.map(r=>[r.key,r.tier]));
  const rarityTiers=Object.keys(E.rarityOrder).sort((a,b)=>E.rarityOrder[b]-E.rarityOrder[a]);
  function goalProgress(s,goals,records,met){
    if(!goals.length)return 1;
    const promotion=E.promotion(s),merit=promotion?.required?Math.max(0,Math.min(1,promotion.current/promotion.required)):0;
    return goals.reduce((sum,g,i)=>{
      if(met[i])return sum+1;
      const [kind,key,value]=g.split(':');let part=0;
      if(kind==='stat')part=C.displayStats(s)[key]/Math.max(1,Number(value));
      else if(kind==='age')part=s.age/Math.max(1,Number(key));
      else if(kind==='record'&&/^age(80|100|200)$/.test(key))part=s.age/Number(key.slice(3));
      else if((g==='record:color'||g==='flag:특색'||/^record:fixer_g[1-7]$/.test(g))&&s.job==='해결사'&&s.grade){
        const required=g.startsWith('record:fixer_g')?10-Number(key.slice(-1)):10;
        part=(10-s.grade+merit)/required;
      }else if(kind==='record'){
        const chain=[];let parent=prerequisites.get(key);
        while(parent&&!chain.includes(parent)){chain.push(parent);parent=prerequisites.get(parent);}
        part=chain.filter(k=>records.has(k)).length/(chain.length+1);
      }
      return sum+Math.max(0,Math.min(1,part));
    },0)/Math.max(1,goals.length);
  }
  function comparison(s,goals=[]){
    const details=E.recordDetails(s),rare=details[0],records=new Set(E.records(s));
    const counts=new Map();for(const key of records){const tier=recordTiers.get(key);if(tier)counts.set(tier,(counts.get(tier)||0)+1);}
    return {rarity:rare?.tierLabel||null,rarityRank:rare?E.rarityOrder[rare.tier]:-1,rarityProfile:rarityTiers.map(t=>counts.get(t)||0),achievementCount:records.size,
      combatPotential:E.combatPotential(s),fixerPower:E.fixerPower(s),promotion:E.promotion(s),goalProgress:goalProgress(s,goals,records,targets(s,goals))};
  }
  function outcome(s,goals){return {complete:C.finished(s),scope:'life',goals,matched:targets(s,goals),summary:{age:s.age,alive:!!s.dead?.alive,stats:C.displayStats(s),comparison:comparison(s,goals)}};}
  function choices(s){
    if(s.dead?.voice)return [-2];
    if(!s.prompt)return [];
    if(['reflect','name','color','craft'].includes(s.prompt.kind))return [-1];
    return s.prompt.choices.flatMap((c,i)=>c.locked?[]:[i]).concat(s.prompt.kind==='minor'?[-1]:[]);
  }
  function apply(s,i){
    if(!choices(s).includes(i))throw Error('Route action is unavailable or locked');
    if(i===-2)E.continue(s,E.data());else E.choose(s,E.data(),i,{text:''});
  }
  function advance(s){if(s.cursor<s.plan.length)E.advance(s,E.data());else E.year(s,E.data());}
  function targets(s,goals){
    const records=new Set(goals.some(g=>g.startsWith('record:'))?E.records(s):[]),stats=C.displayStats(s);
    return goals.map(g=>{
      const [kind,key,value]=g.split(':');
      if(kind==='record')return records.has(key);
      if(kind==='flag')return s.flags.includes(key);
      if(kind==='avoid')return !s.flags.includes(key);
      if(kind==='stat')return stats[key]>=Number(value);
      if(kind==='age')return s.age>=Number(key);
      if(g==='ending:alive')return C.finished(s) && !!s.dead.alive;
      return false;
    });
  }
  function score(s,goals,sort='recommended'){
    const stats=C.displayStats(s),met=targets(s,goals);
    const records=new Set(goals.some(g=>g.startsWith('record:'))?E.records(s):[]);
    let preference=0;
    if(Object.hasOwn(C.statNames,sort))preference=stats[sort]/100;
    else if(sort==='age')preference=Math.min(s.age/10000,1);
    else if(sort==='power')preference=Math.max(0,E.fixerPower(s)||0)/20;
    else if(sort==='potential'){const value=E.combatPotential(s);preference=value==null?0:0.5+Math.atan(value)/Math.PI;}
    else if(sort==='achievements')preference=E.records(s).length/Math.max(1,E.catalog.length);
    else if(sort==='rarity'){
      const c=comparison(s,goals),base=E.catalog.length+1;
      const profile=c.rarityProfile.reduce((sum,count,i)=>sum+count/Math.pow(base,i+1),0);
      preference=(c.rarityRank+1+profile)/(rarityTiers.length+1);
    }
    // This is a bounded search heuristic, not a native success probability.
    // The final comparator uses actual endings and the exact chosen metric.
    return met.filter(Boolean).length*1000000+goalProgress(s,goals,records,met)*100000+
      Math.min(1,preference)*10000+
      Object.values(stats).reduce((a,b)=>a+b,0)+Math.min(s.age,1000)*5+
      (C.finished(s)&&!s.dead.alive?-2000:0);
  }
  function checkGoals(goals){
    const allowed=new Set([...E.catalog.map(r=>'record:'+r.key),...Object.keys(E.flags).flatMap(k=>['flag:'+k,'avoid:'+k])]);
    if(!Array.isArray(goals)||new Set(goals).size!==goals.length)throw Error('Invalid or duplicate conditions');
    for(const g of goals){
      if(typeof g!=='string')throw Error('Invalid condition');
      if(allowed.has(g)||g==='ending:alive')continue;
      const stat=/^stat:(health|sanity|wealth|network|rep):(\d+)$/.exec(g),age=/^age:(\d+)$/.exec(g);
      if(stat&&Number(stat[2])<=100)continue;
      if(age&&Number(age[1])<=10000)continue;
      throw Error('Unknown achievement, trait, or stat condition: '+g);
    }
  }
  function plan(start,goals,effort='quick',progress=()=>{},sort='recommended'){
    checkGoals(goals);if(!efforts[effort])throw Error('Unknown search effort');
    if(!Object.hasOwn(C.sorts,sort))throw Error('Unknown result order');
    const root={state:copy(start),route:[],steps:0};
    let beam=[root],completed=[],expanded=0,incomplete=0;
    function settle(node){
      while(!C.finished(node.state)&&!C.actionable(node.state)&&node.steps<5000){advance(node.state);node.steps++;}
      if(C.finished(node.state)){
        const s=node.state;
        node.outcomeKey=JSON.stringify([s.age,s.dead.cause,!!s.dead.alive,C.displayStats(s),s.job,s.work,s.grade,comparison(s,goals),[...s.flags].sort(),[...E.records(s)].sort()]);
        node.value=score(s,goals,sort);node.order=outcome(s,goals);if(!completed.some(n=>n.outcomeKey===node.outcomeKey))completed.push(node);
        completed.sort((a,b)=>C.compareLives(a.order,b.order,sort));completed=completed.slice(0,3);return false;
      }
      if(node.steps>=5000){incomplete++;return false;}
      return true;
    }
    beam=beam.filter(settle);
    for(let depth=0;beam.length&&depth<600;depth++){
      const next=[];
      for(const node of beam){
        const signature=C.signature(node.state);
        for(const i of choices(node.state)){
          const step={signature,i},child={state:branch(node.state),route:[...node.route,step],steps:node.steps+1};
          apply(child.state,i);expanded++;
          if(C.typing(node.state))step.afterSignature=C.signature(child.state);
          if(settle(child)){child.value=score(child.state,goals,sort);next.push(child);}
        }
      }
      next.sort((a,b)=>b.value-a.value);beam=next.slice(0,efforts[effort]);
      if(depth%10===0)progress({age:beam[0]?.state.age||completed[0]?.state.age||start.age,expanded,completed:completed.length,best:completed[0]||null});
      if(effort==='quick'&&goals.length&&completed.some(n=>targets(n.state,goals).every(Boolean))){beam=[];break;}
    }
    incomplete+=beam.length;
    return {completed,expanded,incomplete};
  }
  function pack(result,goals,scope,lang,origin='seed',startState=null){
    const s=result.state;
    return {version:3,source:C.source,origin,seed:s.seed,options:result.options,goals:[...goals],scope,lang,
      effort:result.effort||'quick',sort:result.sort||'recommended',route:result.route,complete:scope==='birth'||C.finished(s),matched:targets(s,goals),
      terminalSignature:scope==='life'&&C.finished(s)?C.signature(s):null,
      ...(origin==='current'?{startState:copy(startState)}:{}),
      summary:{age:s.age,cause:s.dead?(E.cause?E.cause(s.dead.cause):s.dead.cause):null,alive:!!s.dead?.alive,job:E.job?E.job(s):s.job,
        region:E.data().regions?.find(r=>r.id===s.regionId)?.name||s.regionId,
        flags:[...s.flags],records:E.records(s),stats:C.displayStats(s),comparison:comparison(s,goals)}};
  }
  function simulate(options,goals,effort='quick',progress){
    const birth=E.create(E.data(),options),search=plan(birth,goals,effort,progress),best=search.completed[0];
    return best?{...best,seed:birth.seed,options,birth,effort,complete:true,matched:targets(best.state,goals)}:
      {state:birth,seed:birth.seed,options,birth,route:[],effort,complete:false,matched:targets(birth,goals)};
  }
  function validate(file){
    if(!file||![1,2,3].includes(file.version)||file.source!==C.source)throw Error('Unsupported route file or game version');
    if(!['en','ko','ja'].includes(file.lang)||!['birth','life'].includes(file.scope))throw Error('Missing route language or scope');
    if(!file.options||typeof file.options.seed!=='string'||!file.options.seed||file.options.seed!==file.options.seed.trim()||!['m','f'].includes(file.options.gender)||typeof file.options.name!=='string')throw Error('Invalid seed, name or gender');
    checkGoals(file.goals);
    if(!Array.isArray(file.route)||file.route.length>5000||(file.scope==='birth'&&file.route.length))throw Error('Invalid route length');
    const options={seed:file.options.seed,name:file.options.name,gender:file.options.gender};
    const origin=file.version===3&&file.origin==='current'?'current':'seed';
    if(origin==='current'&&(!file.startState||file.startState.v!==7||file.startState.seed!==options.seed))throw Error('Missing current-life starting state');
    const s=origin==='current'?copy(file.startState):E.create(E.data(),options),route=[];
    let cursor=0,steps=0;
    while(file.scope==='life'&&!C.finished(s)&&steps++<5000){
      if(C.actionable(s)){
        const step=file.route[cursor++];
        if(!step||(step.signature!==C.signature(s)&&!(file.version===1&&step.signature===C.legacySignature(s))))throw Error('Route does not match its seeded simulation');
        const checked={signature:C.signature(s),i:step.i},typing=C.typing(s);
        route.push(checked);apply(s,step.i);if(typing)checked.afterSignature=C.signature(s);
      }else advance(s);
    }
    if(cursor!==file.route.length||(file.scope==='life'&&!C.finished(s)))throw Error('Route is incomplete');
    return pack({state:s,options,route,effort:efforts[file.effort]?file.effort:'quick',sort:Object.hasOwn(C.sorts,file.sort)?file.sort:'recommended'},file.goals,file.scope,file.lang,origin,file.startState);
  }
  function gameplaySignature(state){
    // Only for comparing rebuilt predictions, never for accepting live steps.
    const s=copy(state);delete s.log;
    for(const key of ['colorName','egoName','relicName','childName','partnerName'])delete s[key];
    if(s.pinky)delete s.pinky.blade;
    if(s.weapon)delete s.weapon.name;
    s.reflections=(s.reflections||[]).map(({text,...entry})=>entry);
    if(s.dead)delete s.dead.text;
    return C.signature(s);
  }
  function retainAfterTyping(file,index,state){
    const checked=validate(file);
    if(!Number.isInteger(index)||index<0||index>=checked.route.length)return null;
    const expected=checked.origin==='current'?copy(checked.startState):E.create(E.data(),checked.options);
    let transitions=0;
    function settle(s){while(!C.finished(s)&&!C.actionable(s)){if(++transitions>10000)throw Error('Continuation exceeds replay limit');advance(s);}}
    for(let n=0;n<index;n++){settle(expected);apply(expected,checked.route[n].i);}
    settle(expected);if(!C.typing(expected))return null;
    const prompt=expected.prompt,field=prompt.kind==='color'?'color':prompt.field;
    if(prompt.kind!=='reflect'&&!['color','ego','relic','star','weapon'].includes(field))return null;
    const text=prompt.kind==='reflect'?state.reflections?.at(-1)?.text:
      field==='weapon'?state.weapon?.name:field==='star'?state.pinky?.blade:state[{color:'colorName',ego:'egoName',relic:'relicName'}[field]];
    if(typeof text!=='string')return null;
    const entered=copy(expected);E.choose(entered,E.data(),-1,{text});
    if(C.signature(entered)!==C.signature(state))return null; // Exactly this entry, no other game changes.
    apply(expected,-1);const actual=copy(state),route=[];
    for(const step of checked.route.slice(index+1)){
      settle(expected);settle(actual);
      if(C.finished(actual)||!choices(actual).includes(step.i)||gameplaySignature(actual)!==gameplaySignature(expected))return null;
      const typing=C.typing(actual),next={signature:C.signature(actual),i:step.i};
      apply(actual,step.i);apply(expected,step.i);if(typing)next.afterSignature=C.signature(actual);route.push(next);
    }
    settle(expected);settle(actual);
    if(!C.finished(actual)||gameplaySignature(actual)!==gameplaySignature(expected)||JSON.stringify(E.records(actual))!==JSON.stringify(E.records(expected)))return null;
    return pack({state:actual,options:{seed:state.seed,name:state.name,gender:state.gender},route,effort:checked.effort,sort:checked.sort},checked.goals,'life',checked.lang,'current',state);
  }
  return {copy,signature:C.signature,choices,apply,advance,targets,score,checkGoals,plan,simulate,pack,validate,gameplaySignature,retainAfterTyping};
}

function workerMain(){
  const E=nativeEngine(),P=makePlanner(E),C=advisorCommon();
  self.onmessage=({data:m})=>{
    try{
      E.lang(m.type==='validate'?m.file?.lang:m.lang||'en');
      const send=result=>self.postMessage({id:m.id,result});
      if(m.type==='catalog')return send({records:E.catalog,flags:Object.entries(E.flags)});
      if(m.type==='validate')return send(P.validate(m.file));
      if(m.type==='retainTyping')return send(P.retainAfterTyping(m.file,m.index,m.state));
      if(m.type==='check')return send({matched:P.targets(m.state,m.goals),signature:C.signature(m.state),complete:C.finished(m.state)});
      if(m.type==='plan'){
        const result=P.plan(m.state,m.goals,m.effort,({age,expanded,completed})=>self.postMessage({id:m.id,progress:{age,expanded,completed}}),m.sort);
        const options={seed:m.state.seed,name:m.state.name,gender:m.state.gender};
        return send(result.completed.map(n=>P.pack({...n,options,effort:m.effort,sort:m.sort},m.goals,'life',m.lang,'current',m.state)));
      }
      if(m.type==='search'){
        P.checkGoals(m.goals);
        const count=m.seed?1:Math.max(1,Math.min(500,Math.floor(m.count)||10));
        const words=new Uint32Array(count);crypto.getRandomValues(words);
        let results=[],examined=0;
        for(let n=0;n<count;n++){
          const options={name:m.options.name,gender:m.options.gender,seed:m.seed||String(words[n])};
          let lastBest=null;
          function update(candidates){
            results=results.filter(r=>r.file.seed!==options.seed);results.push(...candidates);
            results.sort((a,b)=>C.compareLives(a.file,b.file,m.sort));results=results.slice(0,5);
          }
          const search=P.plan(E.create(E.data(),options),m.goals,m.effort,p=>{
            let changed=false;
            if(p.best&&p.best!==lastBest){lastBest=p.best;update([{file:P.pack({...p.best,options,effort:m.effort,sort:m.sort},m.goals,'life',m.lang),value:p.best.value}]);changed=true;}
            self.postMessage({id:m.id,progress:{age:p.age,expanded:p.expanded,completed:p.completed,tested:n,total:count,...(changed?{results:results.map(r=>r.file)}:{})}});
          },m.sort);
          examined+=search.expanded;
          const candidates=search.completed.map(node=>({file:P.pack({...node,options,effort:m.effort,sort:m.sort},m.goals,'life',m.lang),value:node.value}));
          // Show different seeds in random search; keep alternative routes when
          // deliberately checking one seed.
          if(candidates.length)update(m.seed?candidates:candidates.slice(0,1));
          self.postMessage({id:m.id,progress:{tested:n+1,total:count,examined,results:results.map(r=>r.file)}});
        }
        return send({results:results.map(r=>r.file),tested:count,examined});
      }
    }catch(e){self.postMessage({id:m.id,error:e.message||String(e)});}
  };
}
