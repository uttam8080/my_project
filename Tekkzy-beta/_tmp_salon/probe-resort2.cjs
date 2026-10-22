const fs = require('fs');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject);
  });
}

(async () => {
  const dataRaw = await get('https://products.tekkzy.com/resort1/data.json');
  fs.writeFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-data.json', dataRaw);
  const live = JSON.parse(dataRaw);
  console.log('LIVE pages:');
  for (const p of live.pages || []) {
    console.log(
      ' ',
      p.slug,
      '->',
      (p.sections || []).map((s) => `${s.id}:${s.type}`).join(' | '),
    );
  }

  const js = fs.readFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-app.js', 'utf8');
  let i = js.indexOf('SCROLL');
  let n = 0;
  while (i !== -1 && n < 5) {
    console.log('--- SCROLL @', i);
    console.log(js.substring(i, i + 800));
    i = js.indexOf('SCROLL', i + 1);
    n++;
  }

  const needles = [
    'visitOffices',
    'contactPage',
    'contact-form',
    'id:"contact"',
    "id:'contact'",
    'mapEmbed',
    'socialMedia',
    'aboutHero',
    'knowAboutUs',
    'weProvide',
    'visionaries',
    'customerVoices',
    'SCROLL_SECTION',
    'sectionMap',
  ];
  for (const needle of needles) {
    let idx = 0;
    let c = 0;
    while ((idx = js.indexOf(needle, idx)) !== -1 && c < 2) {
      console.log(
        `\n${needle}@${idx}:`,
        js.substring(Math.max(0, idx - 60), idx + 200).replace(/\n/g, ' '),
      );
      idx += needle.length;
      c++;
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
