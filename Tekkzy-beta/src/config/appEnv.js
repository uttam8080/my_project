/**
 * App stage + API/payment endpoints.
 * Set VITE_APP_STAGE to "beta" or "prod" in .env / CI.
 */

const DEFAULT_BETA_API =
  'https://tg2d8qq95k.execute-api.us-east-2.amazonaws.com/dev';
const DEFAULT_PROD_API =
  'https://2f2ebijesj.execute-api.us-east-1.amazonaws.com/prod';

function normalizeStage(value) {
  const stage = String(value || '')
    .trim()
    .toLowerCase();
  if (stage === 'prod' || stage === 'production') return 'prod';
  if (stage === 'beta' || stage === 'dev' || stage === 'development') return 'beta';
  return '';
}

function resolveStageFromHost() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('beta') || host.includes('localhost') || host === '127.0.0.1') {
    return 'beta';
  }
  if (host === 'tekkzy.com' || host === 'www.tekkzy.com') {
    return 'prod';
  }
  return '';
}

/** Explicit env wins; otherwise infer from hostname; default beta. */
export function resolveAppStage() {
  return (
    normalizeStage(import.meta.env.VITE_APP_STAGE) ||
    resolveStageFromHost() ||
    'beta'
  );
}

export function isProdStage(stage = resolveAppStage()) {
  return stage === 'prod';
}

export function resolveApiEndpoint(stage = resolveAppStage()) {
  // Optional hard override (legacy / local debugging)
  const explicit = String(import.meta.env.VITE_API_ENDPOINT || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const beta =
    String(import.meta.env.VITE_API_ENDPOINT_BETA || '').trim() || DEFAULT_BETA_API;
  const prod =
    String(import.meta.env.VITE_API_ENDPOINT_PROD || '').trim() || DEFAULT_PROD_API;

  if (stage === 'prod') {
    return prod.replace(/\/$/, '');
  }
  return beta.replace(/\/$/, '');
}

export function resolveApiRegion(stage = resolveAppStage()) {
  const explicit = String(import.meta.env.VITE_API_REGION || '').trim();
  if (explicit) return explicit;

  const beta =
    String(import.meta.env.VITE_API_REGION_BETA || '').trim() ||
    import.meta.env.VITE_AWS_REGION ||
    'us-east-2';
  const prod =
    String(import.meta.env.VITE_API_REGION_PROD || '').trim() || 'us-east-1';

  if (stage === 'prod') {
    return prod;
  }
  return beta;
}

export function resolveRazorpayKeyId(stage = resolveAppStage()) {
  const explicit = String(import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
  if (explicit) return explicit;

  const beta = String(import.meta.env.VITE_RAZORPAY_KEY_ID_BETA || '').trim();
  const prod = String(import.meta.env.VITE_RAZORPAY_KEY_ID_PROD || '').trim();

  if (stage === 'prod') {
    return prod || beta;
  }
  return beta || prod;
}

export const appStage = resolveAppStage();
export const apiEndpoint = resolveApiEndpoint(appStage);
export const apiRegion = resolveApiRegion(appStage);
