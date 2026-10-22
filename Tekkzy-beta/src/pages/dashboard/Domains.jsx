import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiExternalLink,
  FiGlobe,
  FiEdit3,
  FiPlay,
  FiSearch,
  FiLayout,
} from 'react-icons/fi';
import { useSites } from '../../hooks/useSites';
import {
  buildContinueDeployState,
  getContinueDeployPath,
  listOwnedDomains,
} from '../../utils/siteDeployUtils';

const Domains = () => {
  const navigate = useNavigate();
  const { sites, isLoading, error } = useSites();
  const [searchQuery, setSearchQuery] = useState('');

  const domains = useMemo(() => listOwnedDomains(sites), [sites]);

  const filteredDomains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return domains;

    return domains.filter((item) =>
      [item.displayDomain, item.attachedSiteName, item.attachedSiteId, item.domainType]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [domains, searchQuery]);

  const liveCount = domains.filter((d) => d.isLive).length;
  const pendingCount = domains.filter((d) => d.setupIncomplete).length;

  const handleContinue = (item) => {
    navigate(getContinueDeployPath(item.attachedSiteId), {
      state: buildContinueDeployState({
        siteId: item.attachedSiteId,
        name: item.attachedSiteName,
        requestedDomain: item.displayDomain,
        domain: item.displayDomain,
        domainType: item.domainType,
        deployType: item.deployType,
        hostedZoneId: item.hostedZoneId,
        billingCycle: item.billingCycle,
        paymentStatus: item.paymentStatus || 'paid',
        domainStatus: item.domainStatus || 'awaiting_deploy',
        status: item.status,
      }),
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col pt-4 max-w-7xl mx-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
            Domains
          </h1>
          <p className="text-gray-400">
            Domains you have purchased, and which site each one is serving.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full bg-[#121212] border border-[#333] rounded-lg py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!isLoading && domains.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-[#222] bg-[#121212] px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Owned</p>
            <p className="text-2xl font-semibold text-white mt-1 tabular-nums">
              {domains.length}
            </p>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#121212] px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Live</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1 tabular-nums">
              {liveCount}
            </p>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#121212] px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Setup incomplete</p>
            <p className="text-2xl font-semibold text-amber-300 mt-1 tabular-nums">
              {pendingCount}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          <p className="font-medium text-red-300">Could not load domains</p>
          <p className="text-sm mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-[#222] bg-[#121212] animate-pulse"
            />
          ))}
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121212] border border-[#222] rounded-xl">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <FiGlobe className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-white font-medium text-lg mb-2">
            {searchQuery ? 'No domains match your search' : 'No purchased domains yet'}
          </p>
          <p className="text-gray-400 text-sm max-w-md">
            {searchQuery
              ? `Nothing found for “${searchQuery}”.`
              : 'When you buy a subdomain or custom domain during deploy, it will show up here with the site it is attached to.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Clear search
            </button>
          ) : (
            <Link
              to="/dashboard/sites"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <FiLayout size={14} />
              Go to My Sites
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDomains.map((item) => (
            <div
              key={item.displayDomain}
              className="rounded-xl border border-[#222] bg-[#121212] hover:border-[#333] transition-colors px-4 py-4 sm:px-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                    <FiGlobe className="text-gray-400" size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-base font-medium text-white truncate">
                        {item.displayDomain}
                      </h2>
                      {item.isLive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Live
                        </span>
                      ) : item.setupIncomplete ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Setup incomplete
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Paid
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] capitalize">
                        {item.domainType === 'subdomain' ? 'Subdomain' : 'Custom'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Deployed on{' '}
                      <span className="text-gray-200 font-medium">
                        {item.attachedSiteName}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
                  {item.isLive && (
                    <a
                      href={`https://${item.displayDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#333] text-sm text-gray-300 hover:text-white hover:border-[#444] transition-colors"
                    >
                      <FiExternalLink size={14} />
                      Visit
                    </a>
                  )}

                  <Link
                    to={`/builder/${item.attachedSiteId}`}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#333] text-sm text-gray-300 hover:text-white hover:border-[#444] transition-colors"
                  >
                    <FiEdit3 size={14} />
                    Edit site
                  </Link>

                  {item.setupIncomplete && (
                    <button
                      type="button"
                      onClick={() => handleContinue(item)}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <FiPlay size={14} />
                      Continue deploy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Domains;
