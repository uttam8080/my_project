const https = require('https');
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
  const index = await get('https://products.tekkzy.com/resort1/assets/index-CyUEeSJD.js');
  const about = index.match(/About-[A-Za-z0-9_-]+\.js/);
  const contact = index.match(/Contact-[A-Za-z0-9_-]+\.js/);
  const home = index.match(/Home-[A-Za-z0-9_-]+\.js/);
  console.log({ about: about && about[0], contact: contact && contact[0], home: home && home[0] });
  for (const [name, m] of [
    ['about', about],
    ['contact', contact],
    ['home', home],
  ]) {
    if (!m) continue;
    const js = await get('https://products.tekkzy.com/resort1/assets/' + m[0]);
    const ids = [...js.matchAll(/id:"([a-zA-Z0-9_-]+)"/g)].map((x) => x[1]);
    console.log(name, [...new Set(ids)].join(', '));
    // also id={'...'} patterns
    const ids2 = [...js.matchAll(/id:\s*"([a-zA-Z0-9_-]+)"/g)].map((x) => x[1]);
    console.log(name, 'alt', [...new Set(ids2)].join(', '));
  }
})();
