import { resolveSiteDisplayName } from './templateUtils';

/**
 * Sites that finished payment but did not finish deploy/live setup.
 */
export function needsContinueDeploy(site) {
  if (!site || site.status === 'LIVE') return false;

  const domainStatus = String(site.domainStatus || '').toLowerCase();
  const paymentStatus = String(site.paymentStatus || '').toLowerCase();
  const subscriptionStatus = String(site.subscriptionStatus || '').toLowerCase();

  if (paymentStatus === 'paid') return true;
  if (['awaiting_deploy', 'provisioning', 'failed', 'paid'].includes(domainStatus)) {
    return true;
  }
  if (subscriptionStatus === 'active' && site.requestedDomain && site.status !== 'LIVE') {
    return true;
  }

  return false;
}

export function getSiteDisplayDomain(site) {
  if (!site) return '';
  return (
    site.requestedDomain ||
    site.domain ||
    (site.domainType === 'subdomain' && site.domainName
      ? `${site.domainName}.tekkzy.com`
      : site.domainName) ||
    ''
  );
}

function getSiteDisplayTitle(site) {
  return resolveSiteDisplayName(site);
}

function isOwnedDomainSite(site, displayDomain) {
  if (!site || !displayDomain) return false;

  const paymentStatus = String(site.paymentStatus || '').toLowerCase();
  const domainStatus = String(site.domainStatus || '').toLowerCase();
  const subscriptionStatus = String(site.subscriptionStatus || '').toLowerCase();

  return (
    paymentStatus === 'paid' ||
    ['active', 'awaiting_deploy', 'provisioning', 'paid'].includes(domainStatus) ||
    (subscriptionStatus === 'active' && Boolean(displayDomain)) ||
    (site.status === 'LIVE' && Boolean(displayDomain))
  );
}

/**
 * Paid / owned domains currently attached to the user's sites.
 * Includes which site is using each domain.
 */
export function listOwnedDomains(sites = [], excludeSiteId = null) {
  const byDomain = new Map();

  for (const site of sites) {
    if (!site || (excludeSiteId && site.siteId === excludeSiteId)) continue;

    const displayDomain = String(getSiteDisplayDomain(site) || '')
      .trim()
      .toLowerCase();
    if (!displayDomain) continue;
    if (!isOwnedDomainSite(site, displayDomain)) continue;

    const existing = byDomain.get(displayDomain);
    const score =
      (site.status === 'LIVE' ? 3 : 0) +
      (site.cloudfrontId ? 2 : 0) +
      (String(site.paymentStatus || '').toLowerCase() === 'paid' ? 1 : 0);

    if (!existing || score > existing.score) {
      const deployType =
        site.deployType === 'register' || site.domainType === 'custom'
          ? 'connect'
          : site.deployType ||
            (site.domainType === 'subdomain' ? 'subdomain' : 'connect');

      const setupIncomplete = needsContinueDeploy(site);

      byDomain.set(displayDomain, {
        domain: displayDomain,
        displayDomain,
        sourceSiteId: site.siteId,
        sourceSiteName: getSiteDisplayTitle(site),
        attachedSiteId: site.siteId,
        attachedSiteName: getSiteDisplayTitle(site),
        domainType: site.domainType || (deployType === 'subdomain' ? 'subdomain' : 'custom'),
        deployType,
        hostedZoneId: site.hostedZoneId || null,
        billingCycle: site.billingCycle || 'monthly',
        paymentStatus: site.paymentStatus || null,
        domainStatus: site.domainStatus || null,
        status: site.status || 'DRAFT',
        isLive: site.status === 'LIVE',
        setupIncomplete,
        renewedAt: site.planRenewalDate || null,
        score,
      });
    }
  }

  return Array.from(byDomain.values()).sort((a, b) =>
    a.displayDomain.localeCompare(b.displayDomain),
  );
}

/**
 * Paid / owned domains the user can point at another site (skip payment).
 */
export function listReusableDomains(sites = [], excludeSiteId = null) {
  return listOwnedDomains(sites, excludeSiteId);
}

export function buildContinueDeployState(site) {
  const displayDomain = getSiteDisplayDomain(site);

  const rawDomain = String(displayDomain || '')
    .replace(/\.tekkzy\.com$/i, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  const deployType =
    site.deployType ||
    (site.domainType === 'subdomain'
      ? 'subdomain'
      : site.domainType === 'connect'
        ? 'connect'
        : 'register');

  return {
    domain: rawDomain || displayDomain,
    displayDomain: displayDomain || rawDomain,
    type: deployType,
    contact: site.deployContact || null,
    billingCycle: site.billingCycle || 'monthly',
    domainType: site.domainType || (deployType === 'subdomain' ? 'subdomain' : 'custom'),
    hostedZoneId: site.hostedZoneId || null,
    registrationYears: site.billingCycle === 'yearly' ? 1 : null,
    resume: true,
  };
}

export function buildReuseDeployState(domainItem, attachResult = {}) {
  const displayDomain =
    attachResult.displayDomain ||
    attachResult.domain ||
    domainItem.displayDomain ||
    domainItem.domain;

  const deployType =
    attachResult.deployType ||
    domainItem.deployType ||
    (domainItem.domainType === 'subdomain' ? 'subdomain' : 'connect');

  const rawDomain = String(displayDomain || '')
    .replace(/\.tekkzy\.com$/i, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  return {
    domain: deployType === 'subdomain' ? rawDomain : displayDomain,
    displayDomain,
    type: deployType === 'register' ? 'connect' : deployType,
    contact: null,
    billingCycle: attachResult.billingCycle || domainItem.billingCycle || 'monthly',
    domainType:
      attachResult.domainType ||
      domainItem.domainType ||
      (deployType === 'subdomain' ? 'subdomain' : 'custom'),
    hostedZoneId: attachResult.hostedZoneId || domainItem.hostedZoneId || null,
    reusedDomain: true,
    reusedInfrastructure: Boolean(attachResult.reusedInfrastructure),
    sourceSiteId: attachResult.sourceSiteId || domainItem.sourceSiteId,
    resume: true,
  };
}

export function getContinueDeployPath(siteId) {
  return `/deploy/${siteId}/progress`;
}
