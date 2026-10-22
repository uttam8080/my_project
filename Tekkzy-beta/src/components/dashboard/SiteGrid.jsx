import React, { useState } from 'react';
import SiteCard from './SiteCard';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import DeleteSiteModal from '../common/DeleteSiteModal';
import { resolveSiteDisplayName } from '../../utils/templateUtils';
import { getSiteDisplayDomain } from '../../utils/siteDeployUtils';
import { useApi } from '../../context/ApiContext';

const SiteGrid = ({
  sites,
  isLoading,
  onDelete,
  deleteTarget,
  onRequestDelete,
  onCancelDelete,
}) => {
  const { templatesList } = useApi();
  const [deleteError, setDeleteError] = useState('');

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] overflow-hidden divide-y divide-white/[0.05]">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)_140px] sm:items-center sm:gap-5 sm:px-5 sm:py-4 animate-pulse"
          >
            <div className="h-20 sm:h-[72px] rounded-xl bg-white/[0.04]" />
            <div className="space-y-2.5">
              <div className="h-4 bg-white/[0.06] rounded w-40" />
              <div className="h-3 bg-white/[0.04] rounded w-56" />
            </div>
            <div className="hidden sm:block h-9 bg-white/[0.04] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="w-full py-20 px-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.015]">
        <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4 text-white/40">
          <FiPlus className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1.5">No sites yet</h3>
        <p className="text-white/45 mb-6 text-center max-w-sm text-sm leading-relaxed">
          Pick a template and start building your first website in minutes.
        </p>
        <Link
          to="/product"
          className="h-10 px-5 inline-flex items-center justify-center rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Browse templates
        </Link>
      </div>
    );
  }

  const deleteName = deleteTarget
    ? resolveSiteDisplayName(deleteTarget, templatesList)
    : '';
  const deleteDomain = deleteTarget ? getSiteDisplayDomain(deleteTarget) : '';

  return (
    <>
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f]">
        <div className="hidden sm:grid grid-cols-[112px_minmax(0,1fr)_auto] gap-5 px-5 py-3 border-b border-white/[0.06] text-[11px] uppercase tracking-[0.14em] text-white/30">
          <span>Preview</span>
          <span>Site</span>
          <span className="text-right pr-1">Actions</span>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {sites.map((site) => (
            <SiteCard
              key={site.siteId}
              site={site}
              onRequestDelete={(next) => {
                setDeleteError('');
                onRequestDelete?.(next);
              }}
            />
          ))}
        </div>
      </div>

      <DeleteSiteModal
        isOpen={Boolean(deleteTarget)}
        siteName={deleteName}
        domainLabel={deleteDomain}
        isLive={deleteTarget?.status === 'LIVE'}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError('');
          onCancelDelete?.();
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleteError('');
          try {
            await onDelete(deleteTarget.siteId);
            onCancelDelete?.();
          } catch (error) {
            setDeleteError(
              error?.message || 'Failed to delete site. Please try again.',
            );
            throw error;
          }
        }}
      />
    </>
  );
};

export default SiteGrid;
