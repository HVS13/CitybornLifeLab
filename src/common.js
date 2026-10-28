function advisorCommon() {
  const source = 'index-BCA1cgB3.js';
  function normalized(s) {
    const state={...s,prompt:s.prompt?{...s.prompt}:null};
    delete state.savedProgress;
    if(state.prompt)delete state.prompt.remainingMs;
    return state;
  }
  function signature(s) {
    // Include all simulation fields. Ignore only the UI clock/save cursor.
    const text=JSON.stringify(normalized(s),(_,v)=>v && typeof v==='object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])) : v);
    let a=2166136261,b=5381;
    for(let i=0;i<text.length;i++) {
      const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b,33)^c;
    }
    return `s2:${(a>>>0).toString(16).padStart(8,'0')}${(b>>>0).toString(16).padStart(8,'0')}`;
  }
  function legacySignature(s) {
    return JSON.stringify([s.seed,s.age,s.rngState,s.cursor,normalized(s).prompt]);
  }
  const finished=s=>!!s.dead && !s.dead.voice;
  const actionable=s=>!!s.prompt || !!s.dead?.voice;
  const typing=s=>['reflect','name','color','craft','shfight','jfgame'].includes(s.prompt?.kind);
  const label=(s,i)=>i===-2?'Continue the post-death voice':i===-1?'Continue / leave blank / let pass':s.prompt.choices[i].label;
  const statNames={health:'Health',sanity:'Sanity',wealth:'Wealth',network:'Network',rep:'Reputation'};
  const displayStats=s=>Object.fromEntries(Object.keys(statNames).map(k=>[k,Math.round(s.stats[k])]));
  const sorts={recommended:'Recommended',age:'Lifespan',health:'Health',sanity:'Sanity',wealth:'Wealth',network:'Network',rep:'Reputation',rarity:'Achievement rarity',power:'Fixer request rating',potential:'Combat potential (native)',achievements:'Achievement count'};
  function compareLives(a,b,sort='recommended'){
    function values(file){
      const s=file.summary,stats=s.stats,goals=file.goals,met=file.matched.filter(Boolean).length,complete=file.complete&&file.scope==='life';
      const progress=goals.length?goals.reduce((sum,g,i)=>{
        if(file.matched[i])return sum+1;
        const [kind,key,value]=g.split(':');
        if(kind==='stat')return sum+Math.max(0,Math.min(1,stats[key]/Math.max(1,Number(value))));
        const age=kind==='age'?Number(key):g==='record:age80'?80:g==='record:age100'?100:0;
        return sum+(age?Math.min(1,s.age/age):0);
      },0)/goals.length:1;
      const base=[Number(complete&&met===goals.length),Number(complete),goals.length?met/goals.length:1,s.comparison?.goalProgress??progress];
      if(sort==='age')base.push(s.age);
      else if(Object.hasOwn(statNames,sort))base.push(stats[sort]);
      else if(sort==='rarity')base.push(s.comparison?.rarityRank??-1,...(s.comparison?.rarityProfile||Array(7).fill(0)));
      else if(sort==='achievements')base.push(s.comparison?.achievementCount??s.records?.length??0);
      else if(sort==='potential')base.push(s.comparison?.combatPotential??-Infinity);
      else if(sort==='power')base.push(s.comparison?.fixerPower??-1);
      return [...base,Number(s.alive),s.age,Math.min(stats.health,stats.sanity),Object.values(stats).reduce((sum,v)=>sum+v,0)];
    }
    const av=values(a),bv=values(b);for(let i=0;i<av.length;i++)if(av[i]!==bv[i])return bv[i]-av[i];return 0;
  }
  return {source,signature,legacySignature,finished,actionable,typing,label,statNames,displayStats,sorts,compareLives};
}
