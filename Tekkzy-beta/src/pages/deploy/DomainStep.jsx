import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiLoader } from 'react-icons/fi';
import { useDeployment } from '../../context/useDeployment';
import { useApi } from '../../context/ApiContext';
import { isProdStage } from '../../config/appEnv';
import {
  buildReuseDeployState,
  listReusableDomains,
} from '../../utils/siteDeployUtils';

const FALLBACK_PRICING = {
  subdomain: { monthly: 99, yearly: 999, currency: 'INR' },
  customDomain: { monthly: 99, yearly: 999, currency: 'INR' },
  graceDays: 7,
};

const formatInr = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const FIELD =
  'w-full bg-transparent border-0 border-b border-white/[0.12] rounded-none px-0 py-2.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors';

const DomainStep = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { checkSubdomain, checkCustomDomain, attachDomain } = useDeployment();
  const { getDomainPricing, userSites, listUserSites } = useApi();

  const [option, setOption] = useState('subdomain');
  const [inputValue, setInputValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [status, setStatus] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [registrationPricing, setRegistrationPricing] = useState(null);
  const [pricing, setPricing] = useState(FALLBACK_PRICING);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedOwnedDomain, setSelectedOwnedDomain] = useState(null);
  const [contact, setContact] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'IN',
    zip: '',
  });

  // Custom/own domain: available on beta; Coming soon on prod. Subdomain always on.
  const CUSTOM_DOMAIN_COMING_SOON = isProdStage();

  useEffect(() => {
    if (CUSTOM_DOMAIN_COMING_SOON && option === 'register') {
      setOption('subdomain');
    }
  }, [option]);

  useEffect(() => {
    listUserSites().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      try {
        const data = await getDomainPricing();
        if (cancelled || !data) return;

        setPricing({
          subdomain: {
            monthly: Number(data?.subdomain?.monthly ?? FALLBACK_PRICING.subdomain.monthly),
            yearly: Number(data?.subdomain?.yearly ?? FALLBACK_PRICING.subdomain.yearly),
            currency: data?.subdomain?.currency || 'INR',
          },
          customDomain: {
            monthly: Number(data?.customDomain?.monthly ?? FALLBACK_PRICING.customDomain.monthly),
            yearly: Number(data?.customDomain?.yearly ?? FALLBACK_PRICING.customDomain.yearly),
            currency: data?.customDomain?.currency || 'INR',
          },
          graceDays: Number(data?.graceDays ?? FALLBACK_PRICING.graceDays),
        });
      } catch (err) {
        console.warn('Domain pricing unavailable, using defaults:', err?.message || err);
      }
    };

    loadPricing();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownedDomains = useMemo(
    () => listReusableDomains(userSites, siteId),
    [userSites, siteId],
  );

  const selectedPlanPricing = useMemo(() => {
    if (option === 'reuse') {
      return {
        amount: 0,
        currency: 'INR',
        monthly: 0,
        yearly: 0,
        label: 'already paid',
        domainType: selectedOwnedDomain?.domainType || 'custom',
        isRegistration: false,
      };
    }

    if (option === 'register' && registrationPricing?.amountInr) {
      return {
        amount: registrationPricing.amountInr,
        currency: 'INR',
        monthly: registrationPricing.amountInr,
        yearly: registrationPricing.amountInr,
        label: 'per year',
        domainType: 'custom',
        awsPriceUsd: registrationPricing.awsPriceUsd,
        markupUsd: registrationPricing.markupUsd,
        totalUsd: registrationPricing.totalUsd,
        isRegistration: true,
      };
    }

    const plan = option === 'subdomain' ? pricing.subdomain : pricing.customDomain;
    const amount = billingCycle === 'yearly' ? plan.yearly : plan.monthly;
    return {
      amount,
      currency: plan.currency || 'INR',
      monthly: plan.monthly,
      yearly: plan.yearly,
      label: billingCycle === 'yearly' ? 'per year' : 'per month',
      domainType: option === 'subdomain' ? 'subdomain' : 'custom',
      isRegistration: false,
    };
  }, [option, billingCycle, pricing, registrationPricing, selectedOwnedDomain]);

  const previewDomain = useMemo(() => {
    if (option === 'reuse') {
      return selectedOwnedDomain?.displayDomain || 'your-paid-domain.com';
    }
    const value = inputValue.trim().toLowerCase();
    if (!value) return option === 'subdomain' ? 'your-site.tekkzy.com' : 'yourbrand.com';
    return option === 'subdomain' ? `${value}.tekkzy.com` : value;
  }, [inputValue, option, selectedOwnedDomain]);

  const normalizeDomainInput = (value) => value.trim().toLowerCase();
  const isDomainFormatValid = (value) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value);
  const isSubdomainFormatValid = (value) => /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(value);

  const missingContactField = useMemo(() => {
    const required = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'country', 'zip'];
    return required.find((key) => !String(contact[key] || '').trim());
  }, [contact]);

  const handleCheck = async () => {
    const normalizedInput = normalizeDomainInput(inputValue);
    setIsChecking(true);
    setStatus(null);
    setAlternatives([]);
    setRegistrationPricing(null);

    try {
      if (option === 'subdomain') {
        if (!isSubdomainFormatValid(normalizedInput)) {
          setStatus({
            available: false,
            message: 'Use letters, numbers, and hyphens only (2–63 chars).',
          });
          return;
        }

        const result = await checkSubdomain(normalizedInput);
        setStatus(
          result?.available
            ? { available: true, message: 'Available', domain: `${normalizedInput}.tekkzy.com` }
            : {
                available: false,
                message: result?.error || result?.message || 'This subdomain is taken.',
                domain: `${normalizedInput}.tekkzy.com`,
              },
        );
        return;
      }

      if (!isDomainFormatValid(normalizedInput)) {
        setStatus({
          available: false,
          message: 'Enter a full domain like mybrand.com',
        });
        return;
      }

      const result = await checkCustomDomain(normalizedInput);
      const alts = Array.isArray(result?.suggestions)
        ? result.suggestions
        : Array.isArray(result?.alternatives)
          ? result.alternatives
          : [];

      setAlternatives(alts.filter((item) => item?.domain));
      if (result?.pricing) setRegistrationPricing(result.pricing);

      setStatus({
        available: Boolean(result?.available),
        message: result?.available
          ? 'Available to register'
          : result?.message || 'Domain is not available',
        domain: result?.domain || normalizedInput,
      });
    } catch (err) {
      setStatus({
        available: false,
        message: err?.message || 'Could not check availability.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const selectAlternative = (alt) => {
    if (!alt?.domain) return;
    setInputValue(alt.domain);
    setRegistrationPricing(alt.pricing || null);
    setStatus({
      available: true,
      message: 'Available to register',
      domain: alt.domain,
    });
  };

  const buildNavState = () => {
    const chosenDomain =
      option === 'subdomain'
        ? normalizeDomainInput(status?.domain || inputValue).replace(/\.tekkzy\.com$/i, '')
        : normalizeDomainInput(status?.domain || inputValue);
    const displayDomain =
      option === 'subdomain' ? `${chosenDomain}.tekkzy.com` : chosenDomain;

    return {
      domain: chosenDomain,
      displayDomain,
      type: option === 'register' ? 'register' : option,
      contact: option === 'register' ? contact : null,
      billingCycle: option === 'register' ? 'yearly' : billingCycle,
      domainType: selectedPlanPricing.domainType,
      registrationYears: option === 'register' ? 1 : null,
      price: {
        amount: selectedPlanPricing.amount,
        currency: selectedPlanPricing.currency || 'INR',
        monthly: selectedPlanPricing.monthly,
        yearly: selectedPlanPricing.yearly,
        awsPriceUsd: selectedPlanPricing.awsPriceUsd,
        markupUsd: selectedPlanPricing.markupUsd,
        totalUsd: selectedPlanPricing.totalUsd,
        isRegistration: Boolean(selectedPlanPricing.isRegistration),
      },
    };
  };

  const handleReuseContinue = async () => {
    if (!selectedOwnedDomain?.displayDomain) return;

    setIsAttaching(true);
    setStatus(null);

    try {
      const attachResult = await attachDomain({
        siteId,
        domain: selectedOwnedDomain.displayDomain,
        sourceSiteId: selectedOwnedDomain.sourceSiteId,
      });

      navigate(`/deploy/${siteId}/progress`, {
        state: buildReuseDeployState(selectedOwnedDomain, attachResult),
      });
    } catch (err) {
      setStatus({
        available: false,
        message: err?.message || 'Could not attach this domain to the site.',
      });
    } finally {
      setIsAttaching(false);
    }
  };

  const handleContinue = () => {
    if (option === 'reuse') {
      handleReuseContinue();
      return;
    }

    if (option === 'register' && missingContactField) {
      setStatus({
        available: false,
        message: 'Complete registrant details before continuing.',
      });
      return;
    }

    if (!status?.available) return;
    navigate(`/deploy/${siteId}/payment`, { state: buildNavState() });
  };

  // Own/custom domain purchase stays in the codebase but is gated until ready.
  const options = [
    {
      id: 'subdomain',
      title: 'Tekkzy subdomain',
      description: 'Fastest path live. Hosted on tekkzy.com.',
      price: pricing.subdomain,
      priceMode: 'hosting',
    },
    {
      id: 'register',
      title: 'Custom domain',
      description: CUSTOM_DOMAIN_COMING_SOON
        ? 'Bring your own domain — coming soon.'
        : 'AWS registration cost + $5 Tekkzy fee, billed in INR.',
      price: pricing.customDomain,
      priceMode: 'registration',
      comingSoon: CUSTOM_DOMAIN_COMING_SOON,
    },
    ...(ownedDomains.length > 0
      ? [
          {
            id: 'reuse',
            title: 'Use a domain I already paid for',
            description: 'Point another site at your existing domain — no new payment.',
            priceMode: 'reuse',
          },
        ]
      : []),
  ];

  return (
    <div className="h-full min-h-0 w-full flex flex-col gap-4">
      <div className="shrink-0 space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-1">
              Step 1 of 2
            </p>
            <h1 className="text-[1.5rem] lg:text-[1.7rem] font-semibold tracking-tight text-white leading-tight">
              Choose how people find you
            </h1>
          </div>
          <div className="hidden sm:inline-flex p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] shrink-0">
            {option === 'register' ? (
              <span className="px-3 py-1.5 text-[12px] text-white/55">Registration · 1 year</span>
            ) : option === 'reuse' ? (
              <span className="px-3 py-1.5 text-[12px] text-white/55">Already paid</span>
            ) : (
              ['monthly', 'yearly'].map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                    billingCycle === cycle
                      ? 'bg-white text-black font-medium'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={`grid gap-2.5 ${
            options.length > 2 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {options.map((item) => {
            const selected = option === item.id;
            const comingSoon = Boolean(item.comingSoon);
            const amount =
              item.priceMode === 'registration' || item.priceMode === 'reuse'
                ? null
                : billingCycle === 'yearly'
                  ? item.price.yearly
                  : item.price.monthly;
            return (
              <button
                key={item.id}
                type="button"
                disabled={comingSoon}
                aria-disabled={comingSoon}
                title={comingSoon ? 'Coming soon' : undefined}
                onClick={() => {
                  if (comingSoon) return;
                  setOption(item.id);
                  setStatus(null);
                  setAlternatives([]);
                  setRegistrationPricing(null);
                  setInputValue('');
                  if (item.id !== 'reuse') setSelectedOwnedDomain(null);
                }}
                className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                  comingSoon
                    ? 'border-white/[0.06] bg-white/[0.015] opacity-55 cursor-not-allowed'
                    : selected
                      ? 'border-white/20 bg-white/[0.035]'
                      : 'border-white/[0.07] hover:border-white/15 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      comingSoon
                        ? 'border-white/15'
                        : selected
                          ? 'border-white'
                          : 'border-white/25'
                    }`}
                  >
                    {selected && !comingSoon && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-medium text-white">{item.title}</div>
                        {comingSoon && (
                          <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/45">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/40 truncate">{item.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {comingSoon ? (
                        <div className="text-[12px] font-medium text-white/35">Soon</div>
                      ) : item.priceMode === 'reuse' ? (
                        <div className="text-[12px] font-medium text-emerald-400/90">Free</div>
                      ) : item.priceMode === 'registration' ? (
                        <div className="text-[12px] font-medium text-white/80">AWS + $5</div>
                      ) : (
                        <div className="text-[13px] font-medium text-white tabular-nums">
                          {formatInr(amount)}
                          <span className="text-[10px] text-white/35 ml-1">
                            {billingCycle === 'yearly' ? '/yr' : '/mo'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {option === 'reuse' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 max-w-3xl">
          <section className="min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 overflow-hidden">
            <label className="block text-[12px] text-white/40 mb-2">
              Domains on your account
            </label>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {ownedDomains.map((item) => {
                const selected = selectedOwnedDomain?.displayDomain === item.displayDomain;
                return (
                  <button
                    key={item.displayDomain}
                    type="button"
                    onClick={() => {
                      setSelectedOwnedDomain(item);
                      setStatus({
                        available: true,
                        message: item.isLive
                          ? `Currently live on ${item.sourceSiteName}. Redeploying moves it to this site.`
                          : 'Paid and ready to attach to this site.',
                        domain: item.displayDomain,
                      });
                    }}
                    className={`w-full text-left rounded-lg border px-3.5 py-3 transition-colors ${
                      selected
                        ? 'border-white/20 bg-white/[0.04]'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-white truncate">
                          {item.displayDomain}
                        </p>
                        <p className="text-[12px] text-white/40 truncate">
                          From {item.sourceSiteName}
                          {item.isLive ? ' · currently live' : ' · paid'}
                        </p>
                      </div>
                      {selected && (
                        <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <FiCheck size={12} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {status && !status.available && (
              <p className="mt-3 text-[12px] text-red-300/80">{status.message}</p>
            )}

            <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
              <p className="text-[12px] text-white/30 truncate">
                {selectedOwnedDomain
                  ? `Redeploy ${selectedOwnedDomain.displayDomain} · no payment`
                  : 'Select a paid domain to continue'}
              </p>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedOwnedDomain || isAttaching}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isAttaching ? (
                  <>
                    <FiLoader className="animate-spin" /> Attaching
                  </>
                ) : (
                  <>
                    Deploy to this domain
                    <FiArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div
          className={`flex-1 min-h-0 grid gap-4 ${
            option === 'register'
              ? 'grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]'
              : 'grid-cols-1 max-w-3xl'
          }`}
        >
          <section className="min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 overflow-hidden">
            <label className="block text-[12px] text-white/40 mb-2">
              {option === 'subdomain' ? 'Subdomain' : 'Domain name'}
            </label>
            <div className="flex gap-2.5 shrink-0">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setStatus(null);
                    setAlternatives([]);
                    setRegistrationPricing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheck();
                  }}
                  placeholder={option === 'subdomain' ? 'studio' : 'studio.com'}
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.1] rounded-lg pl-3.5 pr-24 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  autoComplete="off"
                  spellCheck={false}
                />
                {option === 'subdomain' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-white/30 pointer-events-none">
                    .tekkzy.com
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCheck}
                disabled={!inputValue.trim() || isChecking}
                className="h-11 px-5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 shrink-0"
              >
                {isChecking ? (
                  <>
                    <FiLoader className="animate-spin" /> Checking
                  </>
                ) : (
                  'Check'
                )}
              </button>
            </div>

            <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3">
              {status && (
                <div
                  className={`rounded-lg border px-3.5 py-3 ${
                    status.available
                      ? 'border-white/15 bg-white/[0.03]'
                      : 'border-red-500/25 bg-red-500/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          status.available
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {status.available ? <FiCheck size={12} /> : <span className="text-[11px]">!</span>}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-white truncate">
                          {status.domain || previewDomain}
                        </p>
                        <p
                          className={`text-[12px] ${
                            status.available ? 'text-white/45' : 'text-red-300/80'
                          }`}
                        >
                          {status.message}
                        </p>
                      </div>
                    </div>
                    {status.available && selectedPlanPricing.amount > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-semibold tabular-nums text-white">
                          {formatInr(selectedPlanPricing.amount)}
                        </p>
                        <p className="text-[10px] text-white/35">
                          {selectedPlanPricing.isRegistration
                            ? `AWS $${selectedPlanPricing.awsPriceUsd ?? '—'} + $${selectedPlanPricing.markupUsd ?? 5}`
                            : selectedPlanPricing.label}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {option === 'register' && alternatives.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/35 mb-2">
                    Available alternatives
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alternatives.map((alt) => (
                      <button
                        key={alt.domain}
                        type="button"
                        onClick={() => selectAlternative(alt)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] px-3 py-2.5 text-left transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="text-[13px] text-white font-medium truncate">
                          {alt.domain}
                        </span>
                        <span className="text-[12px] tabular-nums text-white/65 shrink-0">
                          {alt.pricing?.amountInr ? formatInr(alt.pricing.amountInr) : '—'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!status && !isChecking && (
                <p className="text-[12px] text-white/30 pt-1">
                  Enter a domain and check availability to see pricing.
                </p>
              )}
            </div>

            {option !== 'register' && (
              <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
                <p className="text-[12px] text-white/30 truncate">
                  {status?.available
                    ? `${formatInr(selectedPlanPricing.amount)} ${selectedPlanPricing.label}`
                    : 'Check availability to continue'}
                </p>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!status?.available}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Continue
                  <FiArrowRight size={14} />
                </button>
              </div>
            )}
          </section>

          {option === 'register' && (
            <section className="min-h-0 flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 overflow-hidden">
              <div className="mb-3 shrink-0">
                <h2 className="text-[13px] font-medium text-white">Registrant details</h2>
                <p className="text-[11px] text-white/35 mt-0.5">Required for AWS domain registration</p>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {[
                    { key: 'firstName', label: 'First name' },
                    { key: 'lastName', label: 'Last name' },
                    { key: 'email', label: 'Email', type: 'email' },
                    { key: 'phone', label: 'Phone', placeholder: '+91...' },
                    { key: 'address', label: 'Address', span: true },
                    { key: 'city', label: 'City' },
                    { key: 'state', label: 'State' },
                    { key: 'country', label: 'Country' },
                    { key: 'zip', label: 'Postal' },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className={`block ${field.span ? 'col-span-2' : ''}`}
                    >
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                        {field.label}
                      </span>
                      <input
                        type={field.type || 'text'}
                        value={contact[field.key]}
                        placeholder={field.placeholder || ''}
                        onChange={(e) =>
                          setContact((prev) => ({
                            ...prev,
                            [field.key]:
                              field.key === 'country'
                                ? e.target.value.toUpperCase()
                                : e.target.value,
                          }))
                        }
                        className={FIELD}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
                <p className="text-[12px] text-white/30 truncate">
                  {status?.available
                    ? `${formatInr(selectedPlanPricing.amount)} / year`
                    : 'Select an available domain'}
                </p>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!status?.available}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Continue
                  <FiArrowRight size={14} />
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default DomainStep;
