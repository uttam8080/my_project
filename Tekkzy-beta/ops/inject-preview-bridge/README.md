# Auto-inject preview bridge

Whenever any `*.html` is uploaded to `products.tekkzy.com`, Lambda
`tekkzy-inject-preview-bridge` injects:

```html
<script src="/_tekkzy/preview-bridge.js" defer></script>
```

That keeps builder scroll/highlight working after template re-uploads — no manual HTML patching and no builder code changes per upload.

## Deploy / update

```bash
node ops/inject-preview-bridge/deploy.cjs
```

## One-shot sweep (optional)

```bash
node ops/inject-preview-bridge/ensure-all.cjs
```
