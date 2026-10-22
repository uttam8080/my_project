const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }),
        );
      })
      .on('error', reject);
  });
}

(async () => {
  // 1. Served bridge vs local bridge
  const served = await get('https://products.tekkzy.com/_tekkzy/preview-bridge.js?cb=' + Date.now());
  const local = fs.readFileSync('f:/tekkzy/Tekkzy/src/pages/builder/preview-bridge.js', 'utf8');
  const h = (s) => crypto.createHash('md5').update(s.replace(/\r\n/g, '\n')).digest('hex');
  console.log('bridge served:', served.status, 'len', served.body.length, 'md5', h(served.body));
  console.log('bridge local :', 'len', local.length, 'md5', h(local));
  console.log('match:', h(served.body) === h(local));

  // 2. resort1 index.html — bridge script tag present?
  const resort = await get('https://products.tekkzy.com/resort1/?cb=' + Date.now());
  console.log('resort1 index status', resort.status, 'hasBridgeTag', resort.body.includes('/_tekkzy/preview-bridge.js'));

  // 3. Sanity: salon (working template) index for comparison
  const salon = await get('https://products.tekkzy.com/salon1/?cb=' + Date.now());
  console.log('salon1 hasBridgeTag', salon.body.includes('/_tekkzy/preview-bridge.js'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
