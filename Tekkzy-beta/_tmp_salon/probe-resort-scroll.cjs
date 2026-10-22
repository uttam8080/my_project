const fs = require('fs');
const js = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-app.js', 'utf8');
const idx = js.indexOf('SCROLL_SECTION');
console.log('idx', idx);
console.log(js.substring(idx - 3000, idx + 250));

// Extract section catalog keys that have page + id
const re =
  /([a-zA-Z][a-zA-Z0-9_]*):\{id:"([a-zA-Z0-9_]+)",page:"([^"]+)",label:"([^"]*)"/g;
let m;
const rows = [];
while ((m = re.exec(js))) {
  rows.push({ key: m[1], id: m[2], page: m[3], label: m[4] });
}
console.log('\nSECTION CATALOG:');
for (const r of rows) console.log(`  ${r.id}  page=${r.page}  label=${r.label}`);

// Find the route map object near ScrollToHash / useEffect
const mapMatch = js.match(
  /navbar:"\/"[^}]{0,800}contactPage:"\/contact"|hero:"\/"[^}]{0,1200}/,
);
if (mapMatch) console.log('\nMAP SNIPPET:\n', mapMatch[0]);

const mapIdx = js.indexOf('navbar:"/"');
if (mapIdx >= 0) {
  console.log('\nnavbar map context:\n', js.substring(mapIdx, mapIdx + 900));
}
