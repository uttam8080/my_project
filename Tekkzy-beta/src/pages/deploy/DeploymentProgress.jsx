import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FiCheck,
  FiAlertTriangle,
  FiCopy,
  FiUploadCloud,
  FiShield,
  FiSearch,
  FiCloud,
  FiGlobe,
  FiKey,
  FiRefreshCw,
} from 'react-icons/fi';
import { useDeployment } from '../../context/useDeployment';
import { useApi } from '../../context/ApiContext';
import { buildContinueDeployState } from '../../utils/siteDeployUtils';

const hasUsableDomainState = (state) =>
  Boolean(state?.domain || state?.displayDomain);

const STEP_ICONS = {
  publish: FiUploadCloud,
  register: FiKey,
  ssl: FiShield,
  validate: FiSearch,
  cdn: FiCloud,
  dns: FiGlobe,
};

const STEPS_BY_TYPE = {
  register: [
    { num: 1, key: 'publish', title: 'Publish', detail: 'Uploading site files' },
    { num: 2, key: 'register', title: 'Register', detail: 'Registering your domain' },
    { num: 3, key: 'ssl', title: 'SSL', detail: 'Provisioning HTTPS' },
    { num: 4, key: 'validate', title: 'Validate', detail: 'Verifying ownership' },
    { num: 5, key: 'cdn', title: 'CDN', detail: 'Connecting edge network' },
    { num: 6, key: 'dns', title: 'DNS', detail: 'Pointing your domain' },
  ],
  connect: [
    { num: 1, key: 'publish', title: 'Publish', detail: 'Uploading site files' },
    { num: 2, key: 'ssl', title: 'SSL', detail: 'Provisioning HTTPS' },
    { num: 3, key: 'validate', title: 'Validate', detail: 'Verifying ownership' },
    { num: 4, key: 'cdn', title: 'CDN', detail: 'Connecting edge network' },
    { num: 5, key: 'dns', title: 'DNS', detail: 'Applying DNS records' },
  ],
  subdomain: [
    { num: 1, key: 'publish', title: 'Publish', detail: 'Uploading site files' },
    { num: 2, key: 'ssl', title: 'SSL', detail: 'Provisioning HTTPS' },
    { num: 3, key: 'validate', title: 'Validate', detail: 'Verifying DNS' },
    { num: 4, key: 'cdn', title: 'CDN', detail: 'Connecting edge network' },
    { num: 5, key: 'dns', title: 'DNS', detail: 'Pointing subdomain' },
  ],
  reuse: [
    { num: 1, key: 'publish', title: 'Publish', detail: 'Attaching your domain' },
  ],
};

const DeploymentProgress = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { runDeploymentSequence } = useDeployment();
  const { getSite } = useApi();

  const [currentStep, setCurrentStep] = useState(1);
  const [progressStatus, setProgressStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('Starting…');
  const [dnsInstructions, setDnsInstructions] = useState([]);
  const [copiedField, setCopiedField] = useState('');
  const [manualDnsModal, setManualDnsModal] = useState({ open: false, instruction: null });
  const [domainData, setDomainData] = useState(
    hasUsableDomainState(location.state) ? location.state : null,
  );

  const manualDnsResolverRef = useRef(null);
  const hasStartedRef = useRef(false);
  const domainDataRef = useRef(domainData);
  domainDataRef.current = domainData;

  const finalDomainForDisplay =
    domainData?.displayDomain ||
    (domainData?.type === 'subdomain'
      ? `${domainData.domain}.tekkzy.com`
      : domainData?.domain) ||
    '…';

  const progressType = domainData?.reusedInfrastructure
    ? 'reuse'
    : domainData?.type;
  const steps = STEPS_BY_TYPE[progressType] || STEPS_BY_TYPE.subdomain;

  const activeStepMeta = useMemo(
    () => steps.find((s) => s.num === currentStep) || steps[0],
    [steps, currentStep],
  );

  const progressPct =
    progressStatus === 'success'
      ? 100
      : progressStatus === 'error'
        ? Math.round(((currentStep - 1) / steps.length) * 100)
        : Math.round(((currentStep - 0.35) / steps.length) * 100);

  const copyToClipboard = async (text, key) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(String(text));
      setCopiedField(key);
      setTimeout(() => {
        setCopiedField((prev) => (prev === key ? '' : prev));
      }, 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const requestManualDnsConfirmation = (instruction) =>
    new Promise((resolve) => {
      manualDnsResolverRef.current = resolve;
      setManualDnsModal({ open: true, instruction });
    });

  const handleManualDnsConfirmed = () => {
    const resolver = manualDnsResolverRef.current;
    manualDnsResolverRef.current = null;
    setManualDnsModal({ open: false, instruction: null });
    if (resolver) resolver(true);
  };

  useEffect(() => {
    let cancelled = false;

    const resolveDomainData = async () => {
      if (hasUsableDomainState(domainDataRef.current)) return domainDataRef.current;

      setCurrentMessage('Loading saved details…');
      try {
        const site = await getSite(siteId);
        if (cancelled) return null;
        const siteRecord = site?.data?.site || site?.site || site;
        const restored = buildContinueDeployState(siteRecord);
        if (!hasUsableDomainState(restored)) {
          throw new Error('Missing domain details. Start deploy from the domain step again.');
        }
        setDomainData(restored);
        return restored;
      } catch (err) {
        if (cancelled) return null;
        setProgressStatus('error');
        setErrorMsg(err?.message || 'Could not load site details.');
        setCurrentMessage(err?.message || 'Could not load site details.');
        return null;
      }
    };

    const start = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      setCurrentMessage('Preparing publish…');

      const resolved = await resolveDomainData();
      if (!resolved || cancelled) {
        hasStartedRef.current = false;
        return;
      }

      setCurrentMessage('Uploading site files…');

      const result = await runDeploymentSequence(
        siteId,
        {
          domain: resolved.domain,
          type: resolved.type,
          contact: resolved.contact,
          registrationYears: resolved.registrationYears,
          hostedZoneId: resolved.hostedZoneId,
          reusedInfrastructure: Boolean(resolved.reusedInfrastructure),
        },
        (progressUpdate) => {
          const { step, status, message, error, dnsInstructions: updateDnsInstructions } =
            progressUpdate || {};
          if (typeof step === 'number') setCurrentStep(step);
          if (status) setProgressStatus(status);
          if (message) setCurrentMessage(message);
          if (error) setErrorMsg(message);
          if (Array.isArray(updateDnsInstructions)) {
            setDnsInstructions(updateDnsInstructions);
          }
        },
        requestManualDnsConfirmation,
      );

      if (cancelled) return;

      if (result.success) {
        setProgressStatus('success');
        setCurrentMessage('Going live…');
        navigate(`/deploy/${siteId}/success`, {
          state: {
            ...resolved,
            dnsInstructions: Array.isArray(result?.dnsInstructions)
              ? result.dnsInstructions
              : dnsInstructions,
          },
        });
      } else {
        setProgressStatus('error');
        setManualDnsModal({ open: false, instruction: null });
      }
    };

    start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, navigate]);

  const ActiveIcon = STEP_ICONS[activeStepMeta?.key] || FiUploadCloud;
  const isLoading = progressStatus === 'loading';
  const isError = progressStatus === 'error';
  const isSuccess = progressStatus === 'success';

  return (
    <div className="h-full min-h-0 w-full flex flex-col items-center justify-center relative">
      {/* Soft atmosphere — not a card grid */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className={`absolute left-1/2 top-[28%] -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-[100px] transition-colors duration-700 ${
            isError
              ? 'bg-red-500/10'
              : isSuccess
                ? 'bg-emerald-500/10'
                : 'bg-sky-500/[0.08]'
          }`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#070708_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-2">
        {/* Domain — brand/product signal */}
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/30 mb-3">
          {isError ? 'Deploy failed' : isSuccess ? 'Live' : 'Deploying'}
        </p>
        <h1 className="text-[1.75rem] sm:text-[2.1rem] font-semibold tracking-tight text-white leading-none mb-2">
          {finalDomainForDisplay}
        </h1>
        <p className="text-[14px] text-white/45 mb-10 max-w-sm leading-relaxed">
          {isError
            ? currentMessage || 'Something went wrong on this step.'
            : isSuccess
              ? 'Your site is ready.'
              : currentMessage || activeStepMeta?.detail}
        </p>

        {/* Focal loader */}
        <div className="relative mb-10">
          {isLoading && (
            <svg
              className="absolute inset-[-14px] h-[calc(100%+28px)] w-[calc(100%+28px)] -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(125,211,252,0.85)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(8, progressPct) * 2.89} 289`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
          )}

          <div
            className={`relative h-[88px] w-[88px] rounded-full flex items-center justify-center border transition-colors duration-500 ${
              isError
                ? 'border-red-400/35 bg-red-500/10 text-red-300'
                : isSuccess
                  ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/[0.04] text-white'
            }`}
          >
            {isError ? (
              <FiAlertTriangle size={30} />
            ) : isSuccess ? (
              <FiCheck size={32} strokeWidth={2.5} />
            ) : (
              <ActiveIcon
                size={30}
                className="animate-[deployIcon_2.4s_ease-in-out_infinite]"
              />
            )}
          </div>
        </div>

        {/* Compact step rail */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[step.key] || FiUploadCloud;
              const done = currentStep > step.num || isSuccess;
              const active = currentStep === step.num && isLoading;
              const failed = currentStep === step.num && isError;

              return (
                <React.Fragment key={step.num}>
                  {index > 0 && (
                    <div
                      className={`flex-1 h-px min-w-[8px] transition-colors duration-500 ${
                        done || (active && currentStep > index)
                          ? 'bg-white/30'
                          : done
                            ? 'bg-white/30'
                            : currentStep > step.num
                              ? 'bg-white/30'
                              : 'bg-white/[0.08]'
                      }`}
                      style={{
                        background:
                          currentStep > step.num || isSuccess
                            ? 'rgba(255,255,255,0.28)'
                            : currentStep === step.num
                              ? 'linear-gradient(90deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))'
                              : undefined,
                      }}
                    />
                  )}
                  <div className="flex flex-col items-center gap-2 shrink-0 w-12 sm:w-14">
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full border flex items-center justify-center transition-all duration-400 ${
                        failed
                          ? 'border-red-400/50 bg-red-500/15 text-red-300'
                          : done
                            ? 'border-white/25 bg-white text-black'
                            : active
                              ? 'border-sky-300/50 bg-sky-400/10 text-sky-200 scale-110'
                              : 'border-white/10 bg-transparent text-white/25'
                      }`}
                    >
                      {done && !failed ? (
                        <FiCheck size={15} strokeWidth={2.5} />
                      ) : failed ? (
                        <FiAlertTriangle size={14} />
                      ) : (
                        <Icon size={15} className={active ? 'animate-pulse' : ''} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] tracking-wide ${
                        active || failed
                          ? 'text-white/80'
                          : done
                            ? 'text-white/45'
                            : 'text-white/25'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Single status line */}
        {!isError && (
          <p className="text-[12px] text-white/35 tracking-wide">
            {isSuccess
              ? 'Opening your live site…'
              : `${activeStepMeta?.detail || 'Working'} · keep this tab open`}
          </p>
        )}

        {isError && (
          <div className="w-full mt-2 text-left rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-4">
            <p className="text-[13px] text-red-200/90 leading-relaxed">
              {errorMsg || 'An unexpected error occurred.'}
            </p>
            {(errorMsg || '').toLowerCase().includes('site not found') && (
              <p className="text-[12px] text-white/35 mt-2 leading-relaxed">
                Usually a missing site record, or a different account than the one that created it.
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
            >
              <FiRefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* DNS only when needed */}
        {dnsInstructions.length > 0 && isLoading && (
          <div className="w-full mt-8 text-left space-y-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/50">
              Action needed
            </p>
            {dnsInstructions.map((instruction, idx) => (
              <div
                key={`${instruction.stage}-${idx}`}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <p className="text-[13px] text-white font-medium">{instruction.title}</p>
                <p className="text-[12px] text-white/40 mt-1 mb-3">{instruction.message}</p>
                <div className="space-y-2">
                  {[
                    { label: 'Type', value: instruction.record.type },
                    { label: 'Name', value: instruction.record.name, key: 'name' },
                    { label: 'Value', value: instruction.record.value, key: 'value' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-start justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">
                          {row.label}
                        </p>
                        <p className="text-white/80 font-mono break-all">{row.value}</p>
                      </div>
                      {row.key && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(row.value, `${instruction.stage}-${idx}-${row.key}`)
                          }
                          className="shrink-0 p-1.5 rounded text-white/35 hover:text-white"
                        >
                          {copiedField === `${instruction.stage}-${idx}-${row.key}` ? (
                            <FiCheck size={13} />
                          ) : (
                            <FiCopy size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {manualDnsModal.open && manualDnsModal.instruction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e10] border border-white/10 rounded-2xl p-6 shadow-2xl text-left">
            <h3 className="text-lg font-semibold text-white mb-1">Add DNS record</h3>
            <p className="text-sm text-white/50 mb-5">
              {manualDnsModal.instruction.message ||
                'Add this record in your DNS provider, then continue.'}
            </p>
            <div className="space-y-3 text-sm mb-6">
              {[
                ['Type', manualDnsModal.instruction.record.type],
                ['Name', manualDnsModal.instruction.record.name],
                ['Value', manualDnsModal.instruction.record.value],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-white/[0.06] pb-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">{label}</p>
                  <p className="text-white break-all font-mono text-[13px]">{value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleManualDnsConfirmed}
              className="w-full h-11 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
            >
              I’ve added this record
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes deployIcon {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};

export default DeploymentProgress;
