const fs = require('fs');
const home = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/Home-Ddjm1I4y.js', 'utf8');
const index = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-app.js', 'utf8');
// overflow / scroll containers
for (const n of ['overflow-y', 'overflow-auto', 'h-screen', 'min-h-screen', 'scrollTo', 'ScrollRestoration']) {
  console.log(n, (home.split(n).length - 1) + (index.split(n).length - 1));
}
// Layout wrapper around outlet
const i = index.indexOf('Outlet');
console.log('Outlet ctx', index.substring(i - 200, i + 200));
// Navbar id?
console.log('navbar id in index', (index.match(/id:\"navbar\"/g) || []).length);
