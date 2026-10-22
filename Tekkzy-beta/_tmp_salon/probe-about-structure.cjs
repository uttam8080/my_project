const fs = require('fs');
const about = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/About-SWSniNCc.js', 'utf8');
const contact = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/Contact-mBuWI4FK.js', 'utf8');
console.log('ABOUT head', about.slice(0, 1500));
console.log('\n--- about section/class markers ---');
for (const n of [
  'section',
  'Know About',
  'knowAbout',
  'We Provide',
  'visionar',
  'Crafting',
  'className',
]) {
  const i = about.toLowerCase().indexOf(n.toLowerCase());
  if (i >= 0) console.log(n, about.substring(i, i + 120).replace(/\n/g, ' '));
}
console.log('\nCONTACT head', contact.slice(0, 2000));
