function makePlanner(E) {
  const C=advisorCommon();
  const copy=s=>JSON.parse(JSON.stringify(s));
  const profiles={balanced:{years:3,decisions:12,steps:160},deep:{years:10,decisions:40,steps:480},life:{years:Infinity,decisions:600,steps:5000}};
  function choices(s) {
    if(s.dead?.voice)return [-2];
    if(!s.prompt)return [];
    if(['reflect','name','color'].includes(s.prompt.kind))return [-1];
    return s.prompt.choices.flatMap((c,i)=>c.locked?[]:[i]).concat(s.prompt.kind==='minor'?[-1]:[]);
  }
  function targets(s,goals) {
    const records=new Set(goals.some(g=>g.startsWith('record:'))?E.records(s):[]);
    return goals.map(g=>g.startsWith('record:')?records.has(g.slice(7)):s.flags.includes(g.slice(5)));
  }
  function score(s,goals,baseAge=s.age) {
    const st=s.stats;
    return targets(s,goals).filter(Boolean).length*1000000+
      (C.finished(s) && !s.dead.alive?-10000:0)+(s.age-baseAge)*100+
      st.health*2+st.sanity*1.5+st.wealth*.6+st.network*.4+st.rep*.4+
      (s.heir?(s.heir.ji+s.heir.yong+s.heir.in)*8:0)+(s.grade?(10-s.grade)*15:0);
  }
  function apply(s,i) {
    if(!choices(s).includes(i))throw Error('Route action is unavailable or locked');
    if(i===-2)E.continue(s,E.data());
    else E.choose(s,E.data(),i,{text:''});
  }
  function greedy(s,goals) {
    let best=null;
    for(const i of choices(s)) {
      const next=copy(s);apply(next,i);
      const value=score(next,goals);
      if(!best || value>best.value)best={i,value,next};
    }
    if(!best)throw Error('No supported unlocked choices');
    return best;
  }
  function advance(s) {
    if(s.cursor<s.plan.length)E.advance(s,E.data());
    else E.year(s,E.data());
  }
  function recommend(s,goals,profile='balanced') {
    const limits=profiles[profile];
    if(!limits)throw Error('Unknown evaluation depth');
    const rows=[];
    for(const i of choices(s)) {
      const next=copy(s);apply(next,i);
      let steps=0,decisions=0;
      while(!C.finished(next) && next.age<s.age+limits.years && steps<limits.steps && decisions<limits.decisions) {
        steps++;
        if(C.actionable(next)){const g=greedy(next,goals);apply(next,g.i);decisions++;}
        else advance(next);
      }
      rows.push({i,value:score(next,goals,s.age),age:next.age,dead:C.finished(next),
        matched:targets(next,goals).filter(Boolean).length,label:C.label(s,i),
        stats:{...next.stats},steps,decisions,complete:C.finished(next)});
    }
    rows.sort((a,b)=>b.value-a.value);
    if(!rows.length)throw Error('No supported unlocked choices');
    return {signature:C.signature(s),best:rows[0].i,rows,profile};
  }
  function simulate(options,goals,profile='balanced',progress=()=>{}) {
    const s=E.create(E.data(),options),birth=copy(s),route=[];
    let steps=0;
    while(!C.finished(s) && steps++<5000) {
      if(C.actionable(s)) {
        const r=recommend(s,goals,profile);
        route.push({signature:r.signature,i:r.best});apply(s,r.best);
        if(route.length%10===0)progress(s,route.length);
      }else advance(s);
    }
    return {seed:s.seed,options,birth,state:s,route,profile,complete:C.finished(s),matched:targets(s,goals)};
  }
  function pack(result,goals,scope,lang) {
    const s=result.state;
    return {version:2,source:C.source,seed:s.seed,options:result.options,goals:[...goals],scope,lang,
      profile:result.profile||'balanced',route:result.route,complete:result.complete,matched:targets(s,goals),
      terminalSignature:scope==='life' && result.complete?C.signature(s):null,
      summary:{age:s.age,cause:s.dead?.cause||null,flags:[...s.flags],records:E.records(s),stats:{...s.stats}}};
  }
  function validate(file) {
    if(!file || ![1,2].includes(file.version) || file.source!==C.source)throw Error('Unsupported route file or game version');
    if(!['en','ko','ja'].includes(file.lang) || !['birth','life'].includes(file.scope))throw Error('Missing route language or search scope');
    if(!file.options || typeof file.options.seed!=='string' || !file.options.seed || file.options.seed!==file.options.seed.trim() || !['m','f'].includes(file.options.gender) || typeof file.options.name!=='string')throw Error('Invalid seed, name or gender');
    const allowed=new Set([...E.catalog.map(r=>'record:'+r.key),...Object.keys(E.flags).map(k=>'flag:'+k)]);
    if(!Array.isArray(file.goals) || !file.goals.length || new Set(file.goals).size!==file.goals.length || file.goals.some(g=>!allowed.has(g)))throw Error('Unknown or duplicate achievement or trait goal');
    if(!Array.isArray(file.route) || file.route.length>5000 || (file.scope==='birth' && file.route.length))throw Error('Invalid route length');
    const options={seed:file.options.seed,name:file.options.name,gender:file.options.gender};
    const s=E.create(E.data(),options),route=[];
    let cursor=0,steps=0;
    while(file.scope==='life' && !C.finished(s) && steps++<5000) {
      if(C.actionable(s)) {
        const step=file.route[cursor++];
        if(!step || (step.signature!==C.signature(s) && !(file.version===1 && step.signature===C.legacySignature(s))))throw Error('Route does not match its seeded simulation');
        route.push({signature:C.signature(s),i:step.i});apply(s,step.i);
      }else advance(s);
    }
    if(cursor!==file.route.length || (file.scope==='life' && !C.finished(s)))throw Error('Route is incomplete');
    return pack({state:s,options,route,matched:targets(s,file.goals),profile:profiles[file.profile]?file.profile:'balanced',complete:true},file.goals,file.scope,file.lang);
  }
  return {copy,signature:C.signature,choices,targets,score,apply,advance,recommend,simulate,pack,validate,profiles};
}

function workerMain() {
  const E=nativeEngine(),P=makePlanner(E),C=advisorCommon();
  self.onmessage=({data:m})=>{
    try {
      E.lang(m.type==='validate'?m.file?.lang:m.lang||'en');
      if(m.type==='catalog')return self.postMessage({id:m.id,result:{records:E.catalog,flags:Object.entries(E.flags)}});
      if(m.type==='validate')return self.postMessage({id:m.id,result:P.validate(m.file)});
      if(m.type==='check')return self.postMessage({id:m.id,result:{matched:P.targets(m.state,m.goals),signature:C.signature(m.state),complete:C.finished(m.state)}});
      if(m.type==='recommend')return self.postMessage({id:m.id,result:P.recommend(m.state,m.goals,m.profile)});
      if(m.type==='search') {
        let best=null;
        const count=Math.max(1,Math.min(500,Math.floor(m.count)||1)),words=new Uint32Array(count);
        crypto.getRandomValues(words);
        for(let n=0;n<count;n++) {
          const options={name:m.options.name,gender:m.options.gender,seed:String(words[n])};
          const progress=(s,decisions)=>self.postMessage({id:m.id,progress:n,total:count,age:s.age,decisions});
          let result;
          if(m.scope==='birth') {
            const s=E.create(E.data(),options);
            result={options,state:s,route:[],complete:true,matched:P.targets(s,m.goals)};
          }else result=P.simulate(options,m.goals,m.profile,progress);
          const packed=P.pack(result,m.goals,m.scope,m.lang),matches=result.matched.filter(Boolean).length;
          const improved=result.complete && (!best || matches>best.matched.filter(Boolean).length);
          if(improved)best=packed;
          self.postMessage({id:m.id,progress:n+1,total:count,matches,best:improved?best:null});
          if(result.complete && result.matched.every(Boolean))return self.postMessage({id:m.id,result:packed});
        }
        self.postMessage({id:m.id,result:best});
      }
    }catch(e){self.postMessage({id:m.id,error:e.message||String(e)});}
  };
}
