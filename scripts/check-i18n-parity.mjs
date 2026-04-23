#!/usr/bin/env node
// Quick check that en/ar/fr have the same key shape.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const toUrl = (p) => pathToFileURL(resolve(p)).href;

const flatten = (obj, prefix = '') => {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
};

const load = async (lang) => {
  const mod = await import(toUrl(`src/i18n/${lang}.ts`));
  return mod[lang];
};

const [en, ar, fr] = await Promise.all(['en', 'ar', 'fr'].map(load));
const [enKeys, arKeys, frKeys] = [en, ar, fr].map((d) => new Set(flatten(d)));

const diff = (a, b) => [...a].filter((k) => !b.has(k));

const missingInAr = diff(enKeys, arKeys);
const missingInFr = diff(enKeys, frKeys);
const extraInAr = diff(arKeys, enKeys);
const extraInFr = diff(frKeys, enKeys);

console.log(`en keys: ${enKeys.size}`);
console.log(`ar keys: ${arKeys.size}`);
console.log(`fr keys: ${frKeys.size}`);
console.log('');
console.log(`missing in ar: ${missingInAr.length}`);
missingInAr.slice(0, 20).forEach((k) => console.log('  -', k));
console.log(`missing in fr: ${missingInFr.length}`);
missingInFr.slice(0, 20).forEach((k) => console.log('  -', k));
console.log(`extra in ar: ${extraInAr.length}`);
extraInAr.slice(0, 20).forEach((k) => console.log('  +', k));
console.log(`extra in fr: ${extraInFr.length}`);
extraInFr.slice(0, 20).forEach((k) => console.log('  +', k));

const hasMismatch =
  missingInAr.length || missingInFr.length || extraInAr.length || extraInFr.length;
process.exit(hasMismatch ? 1 : 0);
