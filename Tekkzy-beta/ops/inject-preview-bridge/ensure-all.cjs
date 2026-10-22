/**
 * One-shot: ensure every *.html under products.tekkzy.com has the preview bridge.
 * Run anytime after bulk uploads if you want an immediate sweep (Lambda also auto-patches).
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BUCKET = "products.tekkzy.com";
const SCRIPT_TAG = '<script src="/_tekkzy/preview-bridge.js" defer></script>';
const BRIDGE_SRC = "/_tekkzy/preview-bridge.js";

function aws(args) {
  const r = spawnSync("aws", args, { encoding: "utf8", shell: true, maxBuffer: 50_000_000 });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || args.join(" "));
  return r.stdout;
}

const listed = aws(["s3api", "list-objects-v2", "--bucket", BUCKET, "--query", "Contents[].Key", "--output", "json"]);
const keys = JSON.parse(listed || "[]").filter(
  (k) => typeof k === "string" && k.toLowerCase().endsWith(".html") && !k.startsWith("_tekkzy/"),
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ensure-bridge-"));
let patched = 0;
let skipped = 0;

for (const key of keys) {
  const local = path.join(tmp, key.replace(/[\\/]/g, "__"));
  aws(["s3", "cp", `s3://${BUCKET}/${key}`, local]);
  let html = fs.readFileSync(local, "utf8");
  if (html.includes(BRIDGE_SRC) || html.includes("preview-bridge.js")) {
    skipped += 1;
    continue;
  }
  if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `  ${SCRIPT_TAG}\n</head>`);
  else if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `  ${SCRIPT_TAG}\n</body>`);
  else html += `\n${SCRIPT_TAG}\n`;
  fs.writeFileSync(local, html);
  aws(["s3", "cp", local, `s3://${BUCKET}/${key}`, "--content-type", "text/html", "--cache-control", "no-cache"]);
  patched += 1;
  console.log("patched", key);
}

console.log(JSON.stringify({ total: keys.length, patched, skipped }, null, 2));
