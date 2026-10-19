const fs = require('node:fs');
const crypto = require('node:crypto');
const source = fs.readFileSync('analysis/game.bundle.js', 'utf8');
const start = source.indexOf('const vw =');
const end = source.indexOf('function $2()');
if (start < 0 || end < start) throw Error('Inspected engine boundaries missing');
const engine = source.slice(start, end);
const engineExports = `return {create:zu,data:mt,choose:Ti,advance:hx,year:o0,records:s=>[...P2(eb(s).map(r=>r.key))],catalog:gd,flags:pp,lang:_s};`;
const factory = `function nativeEngine(){${engine}\n${engineExports}}`;
const planner = fs.readFileSync('src/planner.js', 'utf8');
const ui = fs.readFileSync('src/userscript.js', 'utf8');
const metadata = `// ==UserScript==
// @name         Cityborn Life Advisor
// @namespace    https://github.com/HVS13/CitybornLifeLab
// @version      1.0.0
// @description  Native simulation choice advisor, opt-in auto choices, and goal-filtered seed search.
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
fs.writeFileSync('dist/cityborn-advisor.user.js', metadata + '\n(() => {\n"use strict";\n' + factory + '\n' + planner + '\n' + ui + '\n})();\n');
fs.writeFileSync('dist/cityborn-advisor.meta.js', metadata);
fs.writeFileSync('analysis/source.json', JSON.stringify({url:'https://project-moon-life.cityborn.workers.dev/assets/index-C_XxXzM6.js', inspected:'2026-10-19', formattedSourceSha256:crypto.createHash('sha256').update(source).digest('hex')},null,2));
console.log('Built dist/cityborn-advisor.user.js');
