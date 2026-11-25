const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const source = fs.readFileSync('analysis/game.bundle.js', 'utf8');
const start = source.indexOf('const t1 =');
const end = source.indexOf('const Tu =');
const vendor = source.indexOf('var s1 =',start),rules = source.indexOf('  ei =',vendor);
if (start < 0 || vendor < start || rules < vendor || end < rules) throw Error('Inspected engine boundaries missing');
// This client puts React DOM between localization and the native rules.
const engine = source.slice(start,vendor)+'const '+source.slice(rules,end).trimStart();
const engineExports = `return {create:(data,options)=>Sk(data,{...options,boost:true}),data:qt,birthplace:seed=>ly(qt(),seed),birthPrefix:S2,choose:Qa,continue:SY,advance:ZM,year:gC,records:s=>[...V5(Tv(s).map(r=>r.key))],recordDetails:s=>_v(Tv(s),qt().rarity),rarityOrder:sk,combatPotential:s=>s.dr&&s.dr.end!=='return'?null:Oo(s),fixerPower:s=>s.job==='해결사'&&(!s.dr||s.dr.end==='return')?ic(s):null,promotion:s=>s.dr&&s.dr.end!=='return'?null:s.job==='해결사'&&s.grade>=1&&!s.flags.includes('특색')?{current:s.merit||0,required:oo(s)}:zi(s)?{current:sr(s),required:Ho(s)}:null,job:_t,cause:Cp,catalog:xb,groups:l0,flags:K4,lang:El,voice:()=>pf,setVoice:o5,shinForChoice:(s,i)=>IC(s,s.prompt,i)};`;
const factory = `function nativeEngine(){${engine}\n${engineExports}}`;
// Browsing must not depend on worker startup or live-client compatibility.
const inspected = vm.runInNewContext('('+factory+')()');
const catalogue = {records: inspected.catalog, flags: {},regions:{},groups:{}};
for (const language of ['en','ja','ko','zh']) {
  inspected.lang(language);
  catalogue.groups[language] = inspected.groups.map(({id,label})=>[id,label()]);
  catalogue.flags[language] = Object.entries(inspected.flags);
  catalogue.regions[language] = inspected.data().regions.map(({id,name})=>({id,name}));
}
const planner = fs.readFileSync('src/planner.js', 'utf8');
const common = fs.readFileSync('src/common.js', 'utf8');
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const ui = fs.readFileSync('src/userscript.js', 'utf8');
const metadata = `// ==UserScript==
// @name         Cityborn Life Advisor
// @namespace    https://github.com/HVS13/CitybornLifeLab
// @version      ${version}
// @description  Find and replay lives by final stats, traits and achievements, or plan the rest of your current life.
// @homepageURL  https://github.com/HVS13/CitybornLifeLab
// @supportURL   https://github.com/HVS13/CitybornLifeLab/issues
// @downloadURL  https://raw.githubusercontent.com/HVS13/CitybornLifeLab/main/dist/cityborn-advisor.user.js
// @updateURL    https://raw.githubusercontent.com/HVS13/CitybornLifeLab/main/dist/cityborn-advisor.meta.js
// @match        https://project-moon-life.cityborn.workers.dev/*
// @grant        none
// @sandbox      raw
// @run-at       document-idle
// ==/UserScript==
`;
fs.mkdirSync('dist', {recursive:true});
fs.writeFileSync('dist/cityborn-advisor.user.js', metadata + '\n(() => {\n"use strict";\n' + factory + '\n' + common + '\n' + planner + '\nconst ADVISOR_VERSION='+JSON.stringify(version)+';\nconst ADVISOR_CATALOG='+JSON.stringify(catalogue)+';\n' + ui + '\n})();\n');
fs.writeFileSync('dist/cityborn-advisor.meta.js', metadata);
fs.writeFileSync('analysis/source.json', JSON.stringify({url:'https://project-moon-life.cityborn.workers.dev/assets/index-CVgdJU9k.js', inspected:'2026-11-25', formattedSourceSha256:crypto.createHash('sha256').update(source).digest('hex')},null,2));
console.log('Built dist/cityborn-advisor.user.js');
