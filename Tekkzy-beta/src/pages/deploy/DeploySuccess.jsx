import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiExternalLink, FiLayout, FiArrowRight } from 'react-icons/fi';
import confetti from 'canvas-confetti';

const DeploySuccess = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const domainData =
    location.state || {
      domain: 'mysite',
      displayDomain: 'mysite.tekkzy.com',
      type: 'subdomain',
    };

  const finalDomainForDisplay =
    domainData.displayDomain ||
    (domainData.type === 'subdomain'
      ? `${domainData.domain}.tekkzy.com`
      : domainData.domain);

  const siteUrl = finalDomainForDisplay.startsWith('http')
    ? finalDomainForDisplay
    : `https://${finalDomainForDisplay}`;

  useEffect(() => {
    const end = Date.now() + 1800;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 48,
        origin: { x: 0, y: 0.7 },
        colors: ['#7dd3fc', '#e2e8f0', '#34d399'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 48,
        origin: { x: 1, y: 0.7 },
        colors: ['#7dd3fc', '#e2e8f0', '#34d399'],
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="h-full min-h-0 w-full flex flex-col items-center justify-center relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#070708_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto text-center px-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/50 mb-4">
          Live
        </p>

        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-3 text-[1.75rem] sm:text-[2.25rem] font-semibold tracking-tight text-white hover:text-sky-200 transition-colors leading-none break-all"
        >
          {finalDomainForDisplay}
          <FiExternalLink
            size={22}
            className="shrink-0 text-white/30 group-hover:text-sky-300 transition-colors"
          />
        </a>

        <p className="mt-4 text-[14px] text-white/45 leading-relaxed max-w-sm mx-auto">
          Publishing was successful. Your website may take up to 15 minutes to
          become live on every network. Please be patient.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
          >
            Open site
            <FiArrowRight size={14} />
          </a>
          <button
            type="button"
            onClick={() => navigate(`/builder/${siteId}`)}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-white/15 text-white/80 text-[13px] font-medium hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <FiLayout size={14} />
            Edit design
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/sites')}
          className="mt-6 text-[12px] text-white/35 hover:text-white/60 transition-colors"
        >
          Back to My Sites
        </button>
      </div>
    </div>
  );
};

export default DeploySuccess;
