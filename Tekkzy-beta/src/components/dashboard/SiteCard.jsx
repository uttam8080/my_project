import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiExternalLink,
  FiEdit3,
  FiGlobe,
  FiMoreHorizontal,
  FiTrash2,
  FiLayout,
  FiPlay,
} from 'react-icons/fi';
import { useApi } from '../../context/ApiContext';
import {
  findTemplate,
  isDisplayableThumbnail,
  resolveTemplateThumbnail,
  resolveSiteDisplayName,
} from '../../utils/templateUtils';
import {
  buildContinueDeployState,
  getContinueDeployPath,
  getSiteDisplayDomain,
  needsContinueDeploy,
} from '../../utils/siteDeployUtils';

const SiteCard = ({ site, onRequestDelete }) => {
  const navigate = useNavigate();
  const { templatesList } = useApi();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const templateInfo = findTemplate(
    templatesList,
    site.templateId || site.template,
    site.templateNo,
  );
  const thumbnailSrc = resolveTemplateThumbnail(templateInfo);
  const showThumbnail = isDisplayableThumbnail(thumbnailSrc);

  const displayTitle = resolveSiteDisplayName(site, templatesList);
  const domainLabel = getSiteDisplayDomain(site);
  const templateLabel =
    templateInfo?.category ||
    templateInfo?.templateType ||
    (templateInfo?.title ? String(templateInfo.title).split(/[:\-–|]/)[0].trim() : null) ||
    'Template';

  const isLive = site.status === 'LIVE';
  const canContinue = needsContinueDeploy(site);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const createdLabel = formatDate(site.createdAt);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleContinueDeploy = () => {
    setMenuOpen(false);
    navigate(getContinueDeployPath(site.siteId), {
      state: buildContinueDeployState(site),
    });
  };

  const statusMeta = (() => {
    if (isLive) {
      return {
        label: 'Live',
        className: 'text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    }
    if (canContinue) {
      return {
        label: 'Incomplete',
        className: 'text-amber-200 bg-amber-500/10 ring-1 ring-amber-500/20',
        dot: 'bg-amber-400',
      };
    }
    if (site.status === 'DEPLOYING') {
      return {
        label: 'Deploying',
        className: 'text-sky-300 bg-sky-500/10 ring-1 ring-sky-500/20',
        dot: 'bg-sky-400 animate-pulse',
      };
    }
    return {
      label: 'Draft',
      className: 'text-white/50 bg-white/[0.04] ring-1 ring-white/10',
      dot: 'bg-white/30',
    };
  })();

  const primaryAction = canContinue ? (
    <button
      type="button"
      onClick={handleContinueDeploy}
      className="h-9 px-3.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
    >
      <FiPlay size={14} />
      Continue
    </button>
  ) : (
    <Link
      to={`/builder/${site.siteId}`}
      className="h-9 px-3.5 rounded-lg bg-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.12] transition-colors inline-flex items-center gap-2"
    >
      <FiEdit3 size={14} />
      Edit
    </Link>
  );

  return (
    <article className="group grid grid-cols-1 gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-5 sm:py-4 transition-colors hover:bg-white/[0.025] last:rounded-b-2xl first:rounded-t-2xl">
      <Link
        to={`/builder/${site.siteId}`}
        className="relative h-20 sm:h-[72px] w-full sm:w-[112px] rounded-xl overflow-hidden bg-[#161616] ring-1 ring-white/[0.06] shrink-0"
      >
        {showThumbnail ? (
          <img
            src={thumbnailSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
              templateInfo?.gradient || 'from-[#1c1c1c] to-[#111]'
            }`}
          >
            <FiLayout className="w-5 h-5 text-white/25" />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex flex-col gap-2 sm:gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/builder/${site.siteId}`}
            className="text-[15px] font-semibold text-white hover:text-white/90 truncate max-w-full"
          >
            {displayTitle}
          </Link>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${statusMeta.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/40">
          {isLive && domainLabel ? (
            <a
              href={`https://${domainLabel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-sky-300 transition-colors truncate max-w-full"
            >
              <FiGlobe size={13} className="shrink-0 opacity-70" />
              {domainLabel}
            </a>
          ) : (
            <span className={canContinue ? 'text-amber-300/80' : ''}>
              {canContinue
                ? domainLabel || 'Finish deployment to go live'
                : 'Not published yet'}
            </span>
          )}
          <span className="hidden sm:inline text-white/15">·</span>
          <span className="hidden sm:inline truncate">{templateLabel}</span>
          {createdLabel && (
            <>
              <span className="hidden md:inline text-white/15">·</span>
              <span className="hidden md:inline">Created {createdLabel}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        {primaryAction}

        {isLive && domainLabel && (
          <a
            href={`https://${domainLabel}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-lg bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors inline-flex items-center justify-center"
            aria-label={`Open ${domainLabel}`}
          >
            <FiExternalLink size={15} />
          </a>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`h-9 w-9 rounded-lg inline-flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${
              menuOpen
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            }`}
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <FiMoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-44 rounded-xl border border-white/10 bg-[#171717] shadow-2xl z-50 py-1 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/builder/${site.siteId}`);
                }}
                className="w-full text-left px-3 py-2 text-sm text-white/75 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5"
              >
                <FiEdit3 size={14} />
                Open builder
              </button>
              {!canContinue && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(isLive ? `/builder/${site.siteId}` : `/deploy/${site.siteId}`);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white/75 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5"
                >
                  <FiGlobe size={14} />
                  {isLive ? 'Update live' : 'Publish'}
                </button>
              )}
              {canContinue && (
                <button
                  type="button"
                  onClick={handleContinueDeploy}
                  className="w-full text-left px-3 py-2 text-sm text-amber-200 hover:bg-white/[0.06] flex items-center gap-2.5"
                >
                  <FiPlay size={14} />
                  Continue setup
                </button>
              )}
              <div className="h-px bg-white/[0.08] my-1" />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMenuOpen(false);
                  // Defer so this click cannot hit the newly-mounted modal backdrop.
                  window.setTimeout(() => {
                    onRequestDelete?.(site);
                  }, 0);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.06] flex items-center gap-2.5"
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default SiteCard;
