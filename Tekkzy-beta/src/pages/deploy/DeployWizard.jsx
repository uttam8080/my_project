import React from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

const STEPS = [
  { match: '/domain', label: 'Domain' },
  { match: '/payment', label: 'Payment' },
  { match: '/progress', label: 'Deploy' },
  { match: '/success', label: 'Live' },
];

const DeployWizard = () => {
  const { siteId } = useParams();
  const location = useLocation();

  const activeIndex = Math.max(
    0,
    STEPS.findIndex((step) => location.pathname.includes(step.match)),
  );

  return (
    <div className="h-dvh bg-[#070708] text-white flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 lg:px-10 z-50 bg-[#070708]">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard/sites" className="flex items-center gap-2 shrink-0">
            <img src="/logos/t1.png" alt="Tekkzy" className="h-5 w-auto object-contain" />
            <span className="text-[14px] font-semibold tracking-tight text-white/90 hidden sm:inline">
              Tekkzy
            </span>
          </Link>
          <span className="text-white/20 hidden sm:inline">/</span>
          <span className="text-[12px] text-white/45 truncate">Deploy · {siteId}</span>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Deploy steps">
          {STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isDone = index < activeIndex;
            return (
              <React.Fragment key={step.label}>
                {index > 0 && (
                  <span className={`w-5 h-px mx-0.5 ${isDone ? 'bg-white/25' : 'bg-white/10'}`} />
                )}
                <span
                  className={`text-[12px] tracking-wide ${
                    isActive ? 'text-white' : isDone ? 'text-white/50' : 'text-white/30'
                  }`}
                >
                  {step.label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>

        <Link
          to="/dashboard/sites"
          className="p-2 text-white/40 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors"
          aria-label="Close deploy"
        >
          <FiX className="w-5 h-5" />
        </Link>
      </header>

      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
        <div className="h-full min-h-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DeployWizard;
