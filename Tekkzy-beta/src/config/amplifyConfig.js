// Amplify config reads from environment variables defined in .env
// Set real values in .env (never commit secrets to source control)

import {
  apiEndpoint,
  apiRegion,
  appStage,
  isProdStage,
  resolveAppStage,
} from './appEnv';

function normalizeCognitoDomain(domain) {
  if (!domain) {
    return '';
  }

  return String(domain)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function resolveCognitoDomain() {
  const explicit = normalizeCognitoDomain(import.meta.env.VITE_COGNITO_DOMAIN);
  if (explicit) {
    return explicit;
  }

  const betaDomain = normalizeCognitoDomain(import.meta.env.VITE_APP_AUTH_DOMAIN_BETA);
  const prodDomain = normalizeCognitoDomain(import.meta.env.VITE_APP_AUTH_DOMAIN_PROD);
  const stage = resolveAppStage();

  if (isProdStage(stage)) {
    return prodDomain || betaDomain;
  }
  return betaDomain || prodDomain;
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

const cognitoDomain = resolveCognitoDomain();
const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

// Cognito requires exact matches for Allowed callback / sign-out URLs.
// Include both with and without trailing slash for each known origin.
const KNOWN_APP_ORIGINS = [
  appOrigin,
  'https://beta.tekkzy.com',
  'https://tekkzy.com',
  'https://www.tekkzy.com',
  'http://localhost:5173',
];

const redirectSignIn = uniqueUrls(
  KNOWN_APP_ORIGINS.flatMap((origin) => [`${origin}/redirect`]),
);

const redirectSignOut = uniqueUrls(
  KNOWN_APP_ORIGINS.flatMap((origin) => [origin, `${origin}/`]),
);

const loginWith = {
  email: true,
};

if (cognitoDomain) {
  loginWith.oauth = {
    domain: cognitoDomain,
    scopes: ['email', 'openid', 'profile'],
    redirectSignIn,
    redirectSignOut,
    responseType: 'code',
  };
} else if (import.meta.env.DEV) {
  console.warn(
    '[Tekkzy Auth] Google sign-in is disabled: set VITE_APP_AUTH_DOMAIN_BETA ' +
      'and/or VITE_APP_AUTH_DOMAIN_PROD in .env (or VITE_COGNITO_DOMAIN to override).',
  );
}

export const isOAuthConfigured = Boolean(cognitoDomain);
export { cognitoDomain, redirectSignOut, appStage };

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId:
        import.meta.env.VITE_USER_POOL_ID ||
        import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId:
        import.meta.env.VITE_USER_POOL_CLIENT_ID ||
        import.meta.env.VITE_COGNITO_CLIENT_ID,
      identityPoolId:
        import.meta.env.VITE_IDENTITY_POOL_ID ||
        import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
      loginWith,
    },
  },
  API: {
    REST: {
      main: {
        // Must be the real API Gateway URL. A same-origin Vite proxy breaks
        // SigV4 (host/path in the signature won't match what API Gateway sees).
        endpoint: apiEndpoint,
        region: apiRegion,
      },
    },
  },
};

export default amplifyConfig;
