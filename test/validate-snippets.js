global.window = {};
const path = require("path");
require(path.join(__dirname, "..", "frontend", "code", "code-snippets.js"));
const s = global.window.CODE_SNIPPETS;
console.log("total snippets:", s.length);
const langs = {}, levels = {};
for (const x of s) {
  langs[x.lang] = (langs[x.lang] || 0) + 1;
  levels[x.level] = (levels[x.level] || 0) + 1;
  const nonAscii = x.text.match(/[^\x00-\x7F]/g) || [];
  if (nonAscii.length) console.log("NON-ASCII in", x.title, nonAscii);
  const dq = (x.text.match(/"/g) || []).length;
  if (dq % 2 !== 0) console.log("UNBALANCED double-quotes:", x.title);
  console.log(`  [${x.lang}/${x.level}] ${x.title} — ${x.text.length} chars, ${x.text.split("\n").length} lines`);
}
console.log("langs:", JSON.stringify(langs), "levels:", JSON.stringify(levels));
// verify shuffle works
console.log("shuffle(6) ids:", global.window.shuffleCodeSnippets(6).map(x => x.id).join(","));
