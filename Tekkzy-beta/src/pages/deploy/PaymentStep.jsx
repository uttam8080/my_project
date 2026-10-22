import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiAlertTriangle, FiLoader, FiCheck } from 'react-icons/fi';
import { useDeployment } from '../../context/useDeployment';
import { useApi } from '../../context/ApiContext';

const formatInr = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const PaymentStep = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { startPayment } = useDeployment();
  const { userData, getUserLocationPricing, getDomainPricing } = useApi();

  const domainData =
    location.state || {
      domain: 'mysite',
      displayDomain: 'mysite.tekkzy.com',
      type: 'subdomain',
      contact: null,
    };

  const isRegistrationFlow = domainData.type === 'register';
  const isSubdomainFlow = domainData.type === 'subdomain';

  const [selectedPaymentMethod] = useState('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [pricingProfile, setPricingProfile] = useState({ countryCode: '' });
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState(
    domainData.type === 'register' ? 'yearly' : domainData.billingCycle || 'monthly',
  );
  const [domainPricing, setDomainPricing] = useState({
    subdomain: { monthly: 99, yearly: 999, currency: 'INR' },
    customDomain: { monthly: 99, yearly: 999, currency: 'INR' },
  });

  const selectedPlan = isRegistrationFlow
    ? 'domain-registration'
    : billingCycle === 'yearly'
      ? 'hosting-yearly'
      : 'hosting-monthly';

  const finalDomainForDisplay =
    domainData.displayDomain ||
    (domainData.type === 'subdomain'
      ? `${domainData.domain}.tekkzy.com`
      : domainData.domain);

  const activeDomainPrices = isSubdomainFlow
    ? domainPricing.subdomain
    : domainPricing.customDomain;

  const registrationAmount = Number(
    domainData?.price?.amount ??
      (typeof domainData?.price === 'number' ? domainData.price : 0) ??
      0,
  );
  const selectedAmount = isRegistrationFlow
    ? registrationAmount ||
      (billingCycle === 'yearly' ? activeDomainPrices.yearly : activeDomainPrices.monthly)
    : billingCycle === 'yearly'
      ? activeDomainPrices.yearly
      : activeDomainPrices.monthly;

  const priceSuffix = isRegistrationFlow
    ? 'per year'
    : billingCycle === 'yearly'
      ? 'per year'
      : 'per month';

  const planTitle = isSubdomainFlow
    ? 'Subdomain hosting'
    : isRegistrationFlow
      ? 'Domain registration'
      : 'Custom domain hosting';

  const features = useMemo(() => {
    if (isRegistrationFlow) {
      const aws = domainData?.price?.awsPriceUsd;
      const markup = domainData?.price?.markupUsd ?? 5;
      return [
        aws != null
          ? `AWS registration $${aws} + Tekkzy $${markup}`
          : `AWS registration + Tekkzy $${markup} fee`,
        '1-year domain registration',
        'DNS management included',
        'Free SSL after deploy',
      ];
    }

    return [
      isSubdomainFlow ? 'Hosted on *.tekkzy.com' : 'Connect your custom domain',
      'Global CDN & free SSL',
      'Automatic HTTPS renewals',
      'Dashboard & site editor access',
    ];
  }, [isSubdomainFlow, isRegistrationFlow, domainData?.price]);

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      setIsPricingLoading(true);
      try {
        const [locationData, domainPriceData] = await Promise.all([
          getUserLocationPricing().catch(() => null),
          getDomainPricing().catch(() => null),
        ]);

        if (domainPriceData) {
          setDomainPricing({
            subdomain: {
              monthly: Number(domainPriceData?.subdomain?.monthly ?? 99),
              yearly: Number(domainPriceData?.subdomain?.yearly ?? 999),
              currency: domainPriceData?.subdomain?.currency || 'INR',
            },
            customDomain: {
              monthly: Number(domainPriceData?.customDomain?.monthly ?? 99),
              yearly: Number(domainPriceData?.customDomain?.yearly ?? 999),
              currency: domainPriceData?.customDomain?.currency || 'INR',
            },
          });
        } else if (domainData?.price) {
          const key = isSubdomainFlow ? 'subdomain' : 'customDomain';
          setDomainPricing((prev) => ({
            ...prev,
            [key]: {
              monthly: Number(domainData.price.monthly ?? prev[key].monthly),
              yearly: Number(domainData.price.yearly ?? prev[key].yearly),
              currency: domainData.price.currency || 'INR',
            },
          }));
        }

        if (!cancelled) {
          setPricingProfile({
            countryCode: locationData?.countryCode || '',
          });
        }
      } finally {
        if (!cancelled) setIsPricingLoading(false);
      }
    };

    loadPricing();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentError('');

    try {
      await startPayment({
        siteId,
        planId: selectedPlan,
        paymentType: isRegistrationFlow ? 'domain-registration' : 'hosting',
        amount: selectedAmount,
        currency: 'INR',
        paymentMethod: selectedPaymentMethod,
        countryCode: pricingProfile.countryCode,
        customer: {
          name: userData?.name,
          email: userData?.email,
          phone: userData?.phone,
        },
        metadata: {
          domain: domainData.domain,
          displayDomain: finalDomainForDisplay,
          domainType: domainData.domainType || (isSubdomainFlow ? 'subdomain' : 'custom'),
          type: domainData.type,
          billingCycle,
          contact: domainData.contact || null,
          registrationYears: isRegistrationFlow
            ? Number(domainData.registrationYears || 1)
            : null,
          planTitle,
          amountInr: selectedAmount,
          selectedCurrency: 'INR',
          selectedPaymentMethod,
          detectedCountryCode: pricingProfile.countryCode || null,
        },
      });

      navigate(`/deploy/${siteId}/progress`, {
        state: {
          ...domainData,
          billingCycle,
          selectedPlan,
          paymentType: isRegistrationFlow ? 'domain-registration' : 'hosting',
        },
      });
    } catch (err) {
      setPaymentError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full min-h-0 w-full flex flex-col">
      <div className="flex items-end justify-between gap-4 mb-5 shrink-0">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/75 transition-colors mb-2"
          >
            <FiArrowLeft size={13} />
            Back
          </button>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-1.5">
            Step 2 of 2
          </p>
          <h1 className="text-[1.65rem] lg:text-[1.85rem] font-semibold tracking-tight text-white leading-tight">
            Confirm and pay
          </h1>
        </div>
        <div className="inline-flex p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] shrink-0">
          {isRegistrationFlow ? (
            <span className="px-3 py-1.5 text-[12px] text-white/55">1 year registration</span>
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

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 lg:gap-6">
        <section className="min-h-0 flex flex-col rounded-xl border border-white/[0.1] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-white/35 mb-0.5">Domain</p>
              <p className="text-[16px] font-medium text-white tracking-tight truncate">
                {finalDomainForDisplay}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-white/35 mb-0.5">
                {isRegistrationFlow ? 'Registration' : `Billed ${billingCycle}`}
              </p>
              <p className="text-[16px] font-semibold tabular-nums text-white">
                {isPricingLoading && !isRegistrationFlow ? '—' : formatInr(selectedAmount)}
              </p>
              {isRegistrationFlow && domainData?.price?.awsPriceUsd != null && (
                <p className="text-[10px] text-white/35 mt-0.5">
                  AWS ${domainData.price.awsPriceUsd} + ${domainData.price.markupUsd ?? 5}
                </p>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] text-white font-medium">{planTitle}</p>
              <p className="text-[12px] text-white/35 mt-0.5">{priceSuffix}</p>
            </div>
          </div>

          <ul className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 flex-1 content-start">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[13px] text-white/50">
                <FiCheck className="text-white/30 shrink-0" size={13} />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-auto px-5 py-3.5 bg-white/[0.03] border-t border-white/[0.07] flex items-center justify-between">
            <span className="text-[13px] text-white/45">Due today</span>
            <span className="text-[20px] font-semibold tracking-tight tabular-nums text-white">
              {isPricingLoading ? '…' : formatInr(selectedAmount)}
              <span className="text-[11px] font-normal text-white/35 ml-2">{priceSuffix}</span>
            </span>
          </div>
        </section>

        <aside className="min-h-0 flex flex-col rounded-xl border border-white/[0.1] bg-white/[0.025] p-5">
          <h2 className="text-[15px] font-medium text-white mb-1">Payment</h2>
          <p className="text-[13px] text-white/40 mb-5 leading-relaxed">
            Razorpay checkout opens next. Cards, UPI, and netbanking supported.
          </p>

          <div className="mb-5 rounded-lg border border-white/[0.08] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-white font-medium">Razorpay</p>
              <p className="text-[11px] text-white/35 mt-0.5">INR · India</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </div>

          <div className="mt-auto">
            <button
              type="button"
              onClick={handlePayment}
              disabled={isProcessing || isPricingLoading}
              className="w-full h-11 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <FiLoader className="animate-spin" />
                  Opening checkout…
                </>
              ) : (
                <>Pay {formatInr(selectedAmount)}</>
              )}
            </button>

            <p className="mt-3 text-[11px] text-white/30 flex items-center justify-center gap-1.5">
              <FiLock size={11} />
              Encrypted payment · cancel anytime from billing
            </p>

            {paymentError && (
              <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 flex items-start gap-2.5">
                <FiAlertTriangle className="text-red-300 shrink-0 mt-0.5" size={14} />
                <p className="text-[12px] text-red-200/90 leading-relaxed">{paymentError}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PaymentStep;
