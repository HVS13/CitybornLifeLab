function advisorCommon() {
  const source = 'index-C_XxXzM6.js';
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
  const label=(s,i)=>i===-2?'Continue the post-death voice':i===-1?'Continue / leave blank / let pass':s.prompt.choices[i].label;
  const statNames={health:'Health',sanity:'Sanity',wealth:'Wealth',network:'Network',rep:'Reputation'};
  const displayStats=s=>Object.fromEntries(Object.keys(statNames).map(k=>[k,Math.round(s.stats[k])]));
  return {source,signature,legacySignature,finished,actionable,label,statNames,displayStats};
}
