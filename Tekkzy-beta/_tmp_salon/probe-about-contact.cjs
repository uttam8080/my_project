const https = require('https');
const fs = require('fs');
function get(u) {
  return new Promise((res, rej) =>
    https
      .get(u, (r) => {
        const c = [];
        r.on('data', (d) => c.push(d));
        r.on('end', () => res(Buffer.concat(c).toString('utf8')));
      })
      .on('error', rej),
  );
}
(async () => {
  for (const file of ['About-SWSniNCc.js', 'Contact-mBuWI4FK.js', 'Home-Ddjm1I4y.js']) {
    const js = await get('https://products.tekkzy.com/resort1/assets/' + file);
    fs.writeFileSync('f:/tekkzy/Tekkzy/_tmp_salon/' + file, js);
    console.log('\n===', file, 'len', js.length);
    for (const n of [
      'aboutHero',
      'knowAboutUs',
      'weProvide',
      'visionaries',
      'visitOffices',
      'id:"',
      'id: "',
      "id:'",
      'getElementById',
    ]) {
      const count = js.split(n).length - 1;
      if (count) {
        let i = js.indexOf(n);
        console.log(n, count, 'sample:', js.substring(Math.max(0, i - 40), i + 80).replace(/\n/g, ' '));
      }
    }
  }
})();
