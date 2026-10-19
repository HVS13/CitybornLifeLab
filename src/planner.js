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
  function choices(s){
    if(s.dead?.voice)return [-2];
    if(!s.prompt)return [];
    if(['reflect','name','color'].includes(s.prompt.kind))return [-1];
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
  function score(s,goals){
    const met=targets(s,goals),stats=C.displayStats(s);
    const progress=goals.reduce((total,g,i)=>{
      if(met[i])return total+1;
      const [kind,key,value]=g.split(':');
      if(kind==='stat')return total+Math.max(0,Math.min(1,stats[key]/Math.max(1,Number(value))));
      if(kind==='age')return total+Math.min(1,s.age/Math.max(1,Number(key)));
      if(g==='record:age80'||g==='record:age100')return total+Math.min(1,s.age/(g==='record:age80'?80:100));
      return total;
    },0)/Math.max(1,goals.length);
    return met.filter(Boolean).length*1000000+progress*100000+
      Object.values(stats).reduce((a,b)=>a+b,0)+Math.min(s.age,1000)*5+
      (C.finished(s)&&!s.dead.alive?-2000:0)+(s.grade?(10-s.grade)*8:0)+
      (s.heir?(s.heir.ji+s.heir.yong+s.heir.in)*2:0);
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
  function plan(start,goals,effort='quick',progress=()=>{}){
    checkGoals(goals);if(!efforts[effort])throw Error('Unknown search effort');
    const root={state:copy(start),route:[],steps:0};
    let beam=[root],completed=[],expanded=0,incomplete=0;
    function settle(node){
      while(!C.finished(node.state)&&!C.actionable(node.state)&&node.steps<5000){advance(node.state);node.steps++;}
      if(C.finished(node.state)){
        const s=node.state;
        node.outcomeKey=JSON.stringify([s.age,s.dead.cause,!!s.dead.alive,C.displayStats(s),s.job,s.work,s.grade,[...s.flags].sort(),[...E.records(s)].sort()]);
        node.value=score(s,goals);if(!completed.some(n=>n.outcomeKey===node.outcomeKey))completed.push(node);
        completed.sort((a,b)=>b.value-a.value);completed=completed.slice(0,3);return false;
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
          if(settle(child)){child.value=score(child.state,goals);next.push(child);}
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
      effort:result.effort||'quick',route:result.route,complete:scope==='birth'||C.finished(s),matched:targets(s,goals),
      terminalSignature:scope==='life'&&C.finished(s)?C.signature(s):null,
      ...(origin==='current'?{startState:copy(startState)}:{}),
      summary:{age:s.age,cause:s.dead?(E.cause?E.cause(s.dead.cause):s.dead.cause):null,alive:!!s.dead?.alive,job:E.job?E.job(s):s.job,
        region:E.data().regions?.find(r=>r.id===s.regionId)?.name||s.regionId,
        flags:[...s.flags],records:E.records(s),stats:C.displayStats(s)}};
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
    return pack({state:s,options,route,effort:efforts[file.effort]?file.effort:'quick'},file.goals,file.scope,file.lang,origin,file.startState);
  }
  return {copy,signature:C.signature,choices,apply,advance,targets,score,checkGoals,plan,simulate,pack,validate};
}

function workerMain(){
  const E=nativeEngine(),P=makePlanner(E),C=advisorCommon();
  self.onmessage=({data:m})=>{
    try{
      E.lang(m.type==='validate'?m.file?.lang:m.lang||'en');
      const send=result=>self.postMessage({id:m.id,result});
      if(m.type==='catalog')return send({records:E.catalog,flags:Object.entries(E.flags)});
      if(m.type==='validate')return send(P.validate(m.file));
      if(m.type==='check')return send({matched:P.targets(m.state,m.goals),signature:C.signature(m.state),complete:C.finished(m.state)});
      if(m.type==='plan'){
        const result=P.plan(m.state,m.goals,m.effort,({age,expanded,completed})=>self.postMessage({id:m.id,progress:{age,expanded,completed}}));
        const options={seed:m.state.seed,name:m.state.name,gender:m.state.gender};
        return send(result.completed.map(n=>P.pack({...n,options,effort:m.effort},m.goals,'life',m.lang,'current',m.state)));
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
            results.sort((a,b)=>b.value-a.value);results=results.slice(0,5);
          }
          const search=P.plan(E.create(E.data(),options),m.goals,m.effort,p=>{
            let changed=false;
            if(p.best&&p.best!==lastBest){lastBest=p.best;update([{file:P.pack({...p.best,options,effort:m.effort},m.goals,'life',m.lang),value:p.best.value}]);changed=true;}
            self.postMessage({id:m.id,progress:{age:p.age,expanded:p.expanded,completed:p.completed,tested:n,total:count,...(changed?{results:results.map(r=>r.file)}:{})}});
          });
          examined+=search.expanded;
          const candidates=search.completed.map(node=>({file:P.pack({...node,options,effort:m.effort},m.goals,'life',m.lang),value:node.value}));
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
