#!/usr/bin/env node
// Verifies that every translation key used in src/ exists in messages/en.json and fr.json.
// Understands `const t = useTranslations("Ns")` / `await getTranslations("Ns")` and
// static keys (t("a.b")), conditional keys (t(cond ? "a" : "b")) and template keys (t(`a.${x}`)),
// which must resolve to an object.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const messages = { en: JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8")), fr: JSON.parse(fs.readFileSync(path.join(root, "messages/fr.json"), "utf8")) };
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(tsx?|mjs)$/.test(d.name) ? [path.join(dir, d.name)] : []));
const get = (obj, p) => p.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);

const problems = [];
let checked = 0;
for (const file of walk(path.join(root, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  // Every declaration with its position, so a call resolves to the nearest one above it.
  const decls = [...src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([^"]*)")?\s*\)/g)].map((m) => ({ name: m[1], ns: m[2] ?? "", at: m.index }));
  for (const name of new Set(decls.map((d) => d.name))) {
    const call = new RegExp(`(?<![\\w.])${name}\\(\\s*(?:"([^"]+)"|\`([^\`]+)\`)`, "g");
    // t(cond ? "a" : "b"): both branches are real keys. The condition may not contain parentheses.
    const ternary = new RegExp(`(?<![\\w.])${name}\\(\\s*([^?\\n(){}\`]*?)\\?\\s*"([^"]+)"\\s*:\\s*"([^"]+)"`, "g");
    const matches = [...src.matchAll(call), ...[...src.matchAll(ternary)].flatMap((m) => [2, 3].map((i) => Object.assign([m[0], m[i]], { index: m.index })))];
    for (const m of matches) {
      const decl = decls.filter((d) => d.name === name && d.at < m.index).pop();
      if (!decl) continue;
      const raw = m[1] ?? m[2];
      const line = src.slice(0, m.index).split("\n").length;
      const dynamic = raw.includes("${");
      const key = dynamic ? raw.slice(0, raw.indexOf("${")) : raw;
      const full = [decl.ns, key].filter(Boolean).join(".").replace(/\.$/, "");
      for (const l of ["en", "fr"]) {
        const v = get(messages[l], full);
        const ok = dynamic ? v && typeof v === "object" : v !== undefined && !(v && typeof v === "object");
        checked++;
        if (!ok) problems.push(`${path.relative(root, file)}:${line}  ${l}: ${full}${dynamic ? ".*" : ""}`);
      }
    }
  }
}
if (problems.length) {
  console.error([...new Set(problems)].join("\n"));
  console.error(`\n${new Set(problems).size} missing translation key(s)`);
  process.exit(1);
}
console.log(`keys OK: ${checked} lookups verified`);
