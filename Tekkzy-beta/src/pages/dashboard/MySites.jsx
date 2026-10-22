import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteGrid from "../../components/dashboard/SiteGrid";
import { useSites } from "../../hooks/useSites";
import { FiSearch, FiPlay, FiPlus } from "react-icons/fi";
import {
  buildContinueDeployState,
  getContinueDeployPath,
  needsContinueDeploy,
} from "../../utils/siteDeployUtils";

const MySites = () => {
  const navigate = useNavigate();
  const { sites, isLoading, error, deleteSite } = useSites();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sites;

    return sites.filter((site) =>
      [site.name, site.domain, site.requestedDomain, site.templateId, site.templateType]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [sites, searchQuery]);

  const incompleteSites = useMemo(
    () => sites.filter((site) => needsContinueDeploy(site)),
    [sites],
  );

  const liveCount = useMemo(
    () => sites.filter((site) => site.status === "LIVE").length,
    [sites],
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <header className="mb-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white">
              My Sites
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {isLoading
                ? "Loading…"
                : sites.length === 0
                  ? "Create and publish websites from templates."
                  : `${sites.length} site${sites.length === 1 ? "" : "s"}${
                      liveCount > 0 ? ` · ${liveCount} live` : ""
                    }`}
            </p>
          </div>

          <Link
            to="/product"
            className="h-10 px-4 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto"
          >
            <FiPlus size={16} />
            New site
          </Link>
        </div>

        <div className="relative mt-5">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-white/30" />
          </div>
          <input
            type="search"
            className="block w-full h-11 bg-[#0f0f0f] border border-white/[0.08] rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-colors"
            placeholder="Search by name or domain…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {incompleteSites.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-amber-100">
              {incompleteSites.length === 1
                ? "1 site still needs deployment finished"
                : `${incompleteSites.length} sites still need deployment finished`}
            </p>
            {incompleteSites.length === 1 && (
              <button
                type="button"
                onClick={() =>
                  navigate(getContinueDeployPath(incompleteSites[0].siteId), {
                    state: buildContinueDeployState(incompleteSites[0]),
                  })
                }
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors shrink-0"
              >
                <FiPlay size={14} />
                Continue setup
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          <p className="font-medium text-red-200">Could not load sites</p>
          <p className="text-sm mt-0.5 text-red-300/80">{error}</p>
        </div>
      )}

      {searchQuery && filteredSites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/[0.08] bg-[#0f0f0f]">
          <p className="text-white font-medium mb-1">No matching sites</p>
          <p className="text-white/40 text-sm mb-4">
            Nothing matched “{searchQuery.trim()}”
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="h-9 px-4 rounded-lg border border-white/15 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <SiteGrid
          sites={filteredSites}
          isLoading={isLoading}
          onDelete={deleteSite}
          deleteTarget={deleteTarget}
          onRequestDelete={setDeleteTarget}
          onCancelDelete={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default MySites;
