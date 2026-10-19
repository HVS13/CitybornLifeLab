function makePlanner(E) {
  const copy = s => JSON.parse(JSON.stringify(s));
  const signature = s => {
    const prompt=s.prompt?{...s.prompt}:null;
    if(prompt)delete prompt.remainingMs;
    return JSON.stringify([s.seed,s.age,s.rngState,s.cursor,prompt]);
  };
  const choices = s => ['reflect','name','color'].includes(s.prompt?.kind) ? [-1] :
    (s.prompt?.choices || []).flatMap((c,i)=>c.locked?[]:[i]).concat(s.prompt?.kind==='minor'?[-1]:[]);
  function targets(s, goals) {
    const records = new Set(goals.some(g=>g.startsWith('record:')) ? E.records(s) : []);
    return goals.map(g=>g.startsWith('record:')?records.has(g.slice(7)):s.flags.includes(g.slice(5)));
  }
  function score(s, goals, baseAge = s.age) {
    const st = s.stats;
    return targets(s,goals).filter(Boolean).length*1000000 +
      (s.dead && !s.dead.alive ? -10000 : 0) + (s.age-baseAge)*100 +
      st.health*2 + st.sanity*1.5 + st.wealth*.6 + st.network*.4 + st.rep*.4 +
      (s.heir ? (s.heir.ji+s.heir.yong+s.heir.in)*8 : 0) +
      (s.grade ? (10-s.grade)*15 : 0);
  }
  function apply(s, i) { E.choose(s,E.data(),i,{text:''}); }
  function greedy(s,goals) {
    let best=null;
    for(const i of choices(s)) {
      const next=copy(s); apply(next,i);
      const value=score(next,goals);
      if(!best || value>best.value) best={i,value,next};
    }
    if(!best) throw Error('No supported unlocked choices');
    return best;
  }
  function advance(s) {
    if(s.cursor<s.plan.length) E.advance(s,E.data());
    else E.year(s,E.data());
  }
  function recommend(s,goals) {
    const rows=[];
    for(const i of choices(s)) {
      const next=copy(s); apply(next,i);
      // Equal, deterministic, bounded lookahead for every available action.
      let steps=0, decisions=0;
      while(!next.dead && next.age<s.age+3 && steps++<160 && decisions<12) {
        if(next.prompt) { const g=greedy(next,goals); apply(next,g.i); decisions++; }
        else advance(next);
      }
      rows.push({i,value:score(next,goals,s.age),age:next.age,dead:!!next.dead,
        matched:targets(next,goals).filter(Boolean).length,
        label:i<0?'Continue / leave blank / let pass':s.prompt.choices[i].label});
    }
    rows.sort((a,b)=>b.value-a.value);
    if(!rows.length) throw Error('No supported unlocked choices');
    return {signature:signature(s),best:rows[0].i,rows};
  }
  function simulate(options,goals) {
    const s=E.create(E.data(),options),birth=copy(s),route=[];
    let steps=0;
    while(!s.dead && steps++<5000) {
      if(s.prompt) {
        const r=recommend(s,goals);
        route.push({signature:r.signature,i:r.best}); apply(s,r.best);
      } else advance(s);
    }
    return {seed:s.seed,options,birth,state:s,route,complete:!!s.dead,matched:targets(s,goals)};
  }
  return {copy,signature,choices,targets,score,apply,advance,recommend,simulate};
}

function workerMain() {
  const E=nativeEngine(),P=makePlanner(E);
  self.onmessage=async ({data:m})=>{
    try {
      E.lang(m.lang || 'en');
      if(m.type==='catalog') return self.postMessage({id:m.id,result:{records:E.catalog,flags:Object.entries(E.flags)}});
      if(m.type==='recommend') return self.postMessage({id:m.id,result:P.recommend(m.state,m.goals)});
      if(m.type==='search') {
        let best=null;
        const words=new Uint32Array(m.count); crypto.getRandomValues(words);
        for(let n=0;n<m.count;n++) {
          const options={...m.options,seed:String(words[n])};
          let result;
          if(m.scope==='birth') {
            const s=E.create(E.data(),options);
            result={seed:s.seed,options,birth:s,state:s,route:[],complete:true,matched:P.targets(s,m.goals)};
          } else result=P.simulate(options,m.goals);
          const matches=result.matched.filter(Boolean).length;
          if(!best || matches>best.matched.filter(Boolean).length) best=result;
          self.postMessage({id:m.id,progress:n+1,matches});
          if(result.complete && result.matched.every(Boolean)) return self.postMessage({id:m.id,result});
        }
        self.postMessage({id:m.id,result:null,best:best && {seed:best.seed,matches:best.matched.filter(Boolean).length}});
      }
    } catch(e) { self.postMessage({id:m.id,error:e.stack||String(e)}); }
  };
}
