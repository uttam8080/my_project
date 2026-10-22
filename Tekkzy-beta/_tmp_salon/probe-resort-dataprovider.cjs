const fs = require('fs');
const js = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-app.js', 'utf8');

for (const n of [
  'UPDATE_INSTITUTION_DATA',
  '__TEKKZY_APPLY_CMS_DATA__',
  'addEventListener("message"',
  "addEventListener('message'",
  'schemaVersion',
  'data.json',
]) {
  let idx = 0;
  let count = 0;
  while ((idx = js.indexOf(n, idx)) !== -1 && count < 3) {
    console.log(
      '\n[' + n + '] @' + idx + ':\n',
      js.substring(Math.max(0, idx - 250), idx + 450).replace(/\n/g, ' '),
    );
    idx += n.length;
    count++;
  }
  if (count === 0) console.log('\n[' + n + '] NOT FOUND');
}
