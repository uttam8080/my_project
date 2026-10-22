const fs = require('fs');
const home = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/Home-Ddjm1I4y.js', 'utf8');
const about = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/About-SWSniNCc.js', 'utf8');
console.log('HOME getSection count', home.split('getSection').length - 1);
console.log('HOME Institution / hero data paths');
for (const n of ['getSection', 'customerVoices', '.hero', 'institution', 'useCms', 'data.hero', 'stay']) {
  const c = home.split(n).length - 1;
  if (c) {
    const i = home.indexOf(n);
    console.log(n, c, home.substring(Math.max(0, i - 30), i + 100).replace(/\n/g, ' '));
  }
}
console.log('\nABOUT getSection usages');
let idx = 0;
let n = 0;
while ((idx = about.indexOf('getSection', idx)) !== -1 && n < 8) {
  console.log(about.substring(idx, idx + 80));
  idx += 10;
  n++;
}
// Does about set any id on wrappers?
console.log('\nABOUT id= occurrences', (about.match(/id:/g) || []).length);
console.log(about.substring(about.indexOf('return'), about.indexOf('return') + 800));
