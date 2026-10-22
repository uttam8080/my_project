const fs = require('fs');
const home = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/Home-Ddjm1I4y.js', 'utf8');
// Find each section component's null/loading guard
const markers = ['id:"hero"', 'id:"stay"', 'id:"gallery"', 'id:"pricing"', 'id:"booking"', 'id:"customerVoices"', 'id:"faq"'];
for (const m of markers) {
  const i = home.indexOf(m);
  console.log('\n', m, 'context:', home.substring(i, i + 60));
}
// Check hero component export for getSection failure
const heroStart = home.indexOf('feature-grid');
console.log('\nfeature-grid area', home.substring(heroStart - 100, heroStart + 400));

// How does DataProvider work with legacy vs pages?
const index = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-app.js', 'utf8');
for (const n of ['getSection', 'pages', 'InstitutionId', 'VALIDATE', 'schemaVersion']) {
  console.log(n, (index.split(n).length - 1));
}
