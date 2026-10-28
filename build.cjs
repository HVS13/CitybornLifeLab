const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const source = fs.readFileSync('analysis/game.bundle.js', 'utf8');
const start = source.indexOf('const hb =');
const end = source.indexOf('function Mc(');
if (start < 0 || end < start) throw Error('Inspected engine boundaries missing');
const engine = source.slice(start, end);
const engineExports = `return {create:(data,options)=>pg(data,{...options,boost:true}),data:st,birthplace:seed=>Tc(st(),seed),birthPrefix:hx,choose:Ua,continue:O2,advance:pA,year:bj,records:s=>[...tk(iv(s).map(r=>r.key))],recordDetails:s=>dv(iv(s),st().rarity),rarityOrder:ag,combatPotential:s=>s.dr&&s.dr.end!=='return'?null:la(s),fixerPower:s=>s.job==='해결사'&&(!s.dr||s.dr.end==='return')?Us(s):null,promotion:s=>s.dr&&s.dr.end!=='return'?null:s.job==='해결사'&&s.grade>=1&&!s.flags.includes('특색')?{current:s.merit||0,required:kt(s)}:bn(s)?{current:oa(s),required:vt(s)}:null,job:Ie,cause:gb,catalog:Aw,flags:b1,lang:Kd,voice:()=>Yc,setVoice:Cx};`;
const factory = `function nativeEngine(){${engine}\n${engineExports}}`;
// Browsing must not depend on worker startup or live-client compatibility.
const inspected = vm.runInNewContext('('+factory+')()');
const catalogue = {records: inspected.catalog, flags: {},regions:{}};
for (const language of ['en','ja','ko']) {
  inspected.lang(language);
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
fs.writeFileSync('analysis/source.json', JSON.stringify({url:'https://project-moon-life.cityborn.workers.dev/assets/index-BCA1cgB3.js', inspected:'2026-10-28', formattedSourceSha256:crypto.createHash('sha256').update(source).digest('hex')},null,2));
console.log('Built dist/cityborn-advisor.user.js');
