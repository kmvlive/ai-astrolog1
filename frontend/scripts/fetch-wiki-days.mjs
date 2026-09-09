import fs from "fs";

const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function clean(w) {
  return w
    .replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

function cleanTarget(w) {
  return w
    .replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

const SKIP = new Set([
  "память","обретение","преставление","перенесение","прославление",
  "мощей","мощам","икона","иконы","образ","образу"
]);

// Извлекает имя святого из "Память преподобного Пимена Великого" → "Пимена"
function extractSaintName(line) {
  const text = clean(line);
  if (/^Собор\b/i.test(text)) return null;
  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 2; i < Math.min(words.length, 5); i++) {
    const w = words[i].replace(/[,.:;\-()"'\[\]{}]/g, "");
    if (!/^[А-ЯЁ][а-яё]+$/.test(w)) continue;
    if (w.length < 3) continue;
    if (SKIP.has(w.toLowerCase())) continue;
    if (/ого|его|аго|ому|ему|ым|им$/.test(w)) continue;
    return w;
  }
  return null;
}

// Извлекает имя из "род. Иванов Иван Иванович" для секции Родились
function extractPersonName(line) {
  const text = clean(line);
  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < Math.min(words.length, 3); i++) {
    const w = words[i].replace(/[,.:;\-()"'\[\]{}]/g, "");
    if (!/^[А-ЯЁ][а-яё]+$/.test(w)) continue;
    if (w.length < 3) continue;
    return w;
  }
  return null;
}

const out = {};
for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= 31; d++) {
    const probe = new Date(Date.UTC(2024, m - 1, d));
    if (probe.getUTCMonth() !== m - 1) continue;
    const key = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const page = `${d}_${MONTHS[m - 1]}`;
    const buckets = { intl: [], natl: [], rel: [], names: [] };
    try {
      const r = await fetch(
        `https://ru.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`,
        { headers: { "User-Agent": "ai-astrolog-calendar-bot/1.0 (admin@neiro-astro.ru)" } }
      );
      const j = await r.json();
      const wt = j?.parse?.wikitext ?? "";
      const parts = wt.split(/(={2,3}[^\n=]+={2,3})/);
      let cur = "", sub = "", relZone = false, namesZone = false, bornZone = false;
      for (const part of parts) {
        const h = part.match(/^={2,3}\s*([^=\n]+?)\s*={2,3}$/);
        if (h) {
          const name = h[1].toLowerCase();
          if (part.startsWith("===")) sub = name; else { cur = name; sub = ""; }
          relZone = cur.includes("религ") || cur.includes("православ") || sub.includes("религ") || sub.includes("православ");
          namesZone = name.includes("именин") || name.includes("имен");
          bornZone = name.includes("родились") || name.includes("родил");
          continue;
        }
        const holidayZone = !relZone && !namesZone && !bornZone && (cur.includes("праздник") || cur.includes("памятные"));
        let relCat = false;
        for (const line of part.split("\n")) {
          const bm = line.match(/^(\*+)\s*(.+)$/);
          if (!bm) continue;
          const stars = bm[1].length;
          const txt = clean(bm[2]);
          if (!txt || txt.length < 4) continue;
          if (stars === 1 && /:\s*$/.test(txt)) {
            relCat = /православ|католич|ислам/i.test(txt);
            continue;
          }
          if (stars === 1) relCat = relCat && false;
          
          if (namesZone) {
            const n = extractSaintName(cleanTarget(bm[2])) || extractPersonName(cleanTarget(bm[2]));
            if (n && !buckets.names.includes(n)) buckets.names.push(n);
          } else if (relZone || (relCat && stars >= 2)) {
            buckets.rel.push(txt);
            const n = extractSaintName(cleanTarget(bm[2]));
            if (n && !buckets.names.includes(n)) buckets.names.push(n);
          } else if (holidayZone) {
            if (sub.includes("международ")) buckets.intl.push(txt);
            else if (sub.includes("националь") || sub.includes("росс")) buckets.natl.push(txt);
            else if (!sub) buckets.intl.push(txt);
          }
        }
      }
    } catch (e) { buckets.err = true; }
    out[key] = buckets;
    await new Promise((r) => setTimeout(r, 60));
  }
  console.log(`месяц ${m} готов`);
}
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/wiki-days.json", JSON.stringify(out));
const days = Object.values(out);
console.log("ГОТОВО:",
  "международные:", days.filter((x) => x.intl.length).length,
  "| национальные:", days.filter((x) => x.natl.length).length,
  "| православные:", days.filter((x) => x.rel.length).length,
  "| именины:", days.filter((x) => x.names.length).length);
