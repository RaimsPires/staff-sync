#!/usr/bin/env node
// Fails when the English and French message catalogs differ in keys or ICU placeholders.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const load = (l) => JSON.parse(fs.readFileSync(path.join(root, "messages", `${l}.json`), "utf8"));
const flatten = (obj, prefix = "", out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
};
const placeholders = (s) => [...s.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]).sort().join(",");

const en = flatten(load("en"));
const fr = flatten(load("fr"));
const problems = [];

for (const k of Object.keys(en)) if (!(k in fr)) problems.push(`missing in fr: ${k}`);
for (const k of Object.keys(fr)) if (!(k in en)) problems.push(`missing in en: ${k}`);
for (const k of Object.keys(en)) {
  if (k in fr && placeholders(en[k]) !== placeholders(fr[k])) problems.push(`placeholder mismatch: ${k} (en: ${placeholders(en[k])} / fr: ${placeholders(fr[k])})`);
}

if (problems.length) {
  console.error(problems.slice(0, 60).join("\n"));
  if (problems.length > 60) console.error(`… and ${problems.length - 60} more`);
  process.exit(1);
}
console.log(`i18n OK: ${Object.keys(en).length} keys in en and fr`);
