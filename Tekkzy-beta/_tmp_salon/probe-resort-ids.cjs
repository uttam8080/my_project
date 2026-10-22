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
  const data = JSON.parse(await get('https://products.tekkzy.com/resort1/data.json'));
  console.log('live top keys:', Object.keys(data));
  console.log('has pages:', Array.isArray(data.pages));
  console.log('has navbar:', !!data.navbar, 'has navigation:', !!data.navigation);

  const html = await get('https://products.tekkzy.com/resort1/');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  console.log('ssr ids:', ids.filter((id) => !id.startsWith('_')).slice(0, 50));

  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
  console.log('scripts:', scripts.slice(0, 20));

  // download main app js and find id: "..."
  const appJs = scripts.find((s) => /assets\/index|assets\/.*\.js/.test(s)) || scripts.find((s) => s.includes('/assets/'));
  console.log('picked script', appJs);
  if (appJs) {
    const url = appJs.startsWith('http') ? appJs : `https://products.tekkzy.com${appJs.startsWith('/') ? '' : '/resort1/'}${appJs.replace(/^\//, '')}`;
    const full = appJs.startsWith('http')
      ? appJs
      : appJs.startsWith('/resort1')
        ? `https://products.tekkzy.com${appJs}`
        : `https://products.tekkzy.com/resort1/${appJs.replace(/^\.\//, '')}`;
    console.log('fetching', full);
    const js = await get(full);
    fs.writeFileSync('f:/tekkzy/Tekkzy/_tmp_salon/resort-app.js', js);
    const needles = [
      'id:"hero"',
      "id:'hero'",
      'id:"stay"',
      'id:"gallery"',
      'id:"pricing"',
      'id:"booking"',
      'id:"faq"',
      'id:"customerVoices"',
      'id:"about"',
      'id:"contact"',
      'id:"navbar"',
      'id:"footer"',
      'id:"features"',
      'id:"categories"',
      'id:"products"',
      'id:"trust"',
      'id:"testimonials"',
      'id:"coffeeProducts"',
      'knowAboutUs',
      'weProvide',
      'visionaries',
      'about-know',
      'about-we',
      'about-vision',
      'contact-form',
      'contactPage',
      'SCROLL',
    ];
    for (const n of needles) {
      const count = js.split(n).length - 1;
      if (count) console.log(n, count);
    }
    // extract id="..." patterns in JSX-ish
    const idAssigns = [...js.matchAll(/id:\s*["']([a-zA-Z0-9_-]+)["']/g)].map((m) => m[1]);
    const unique = [...new Set(idAssigns)].filter((id) => id.length < 40);
    console.log('js id assigns sample:', unique.slice(0, 80).join(', '));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
