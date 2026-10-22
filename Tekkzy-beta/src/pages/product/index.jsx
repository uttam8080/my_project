import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FiEdit3, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";
import LivePreviewModal from "./components/LivePreviewModal";
import AddTemplateModal from "./components/AddTemplateModal";
import EditTemplateModal from "./components/EditTemplateModal";
import FloatingNotice from "../../components/common/FloatingNotice";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../context/ApiContext";
import {
  getTemplateEditFormValues,
  isDisplayableThumbnail,
  normalizeTemplateUrl,
  resolveTemplatePreviewSource,
  resolveTemplateThumbnail,
} from "../../utils/templateUtils";

const Product = () => {
  const { isAuthenticated, refreshUser } = useAuth();
  const {
    userData,
    templatesList,
    isTemplatesLoading,
    isTemplatesLoadingMore,
    templatesHasMore,
    templateCategories,
    listTemplates,
    loadMoreTemplates,
    registerTemplate,
    updateTemplate,
    deleteTemplate,
  } = useApi();

  const [activeCategory, setActiveCategory] = useState("All");
  const [isAdminLocal, setIsAdminLocal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: "",
    title: "",
    institutionid: "",
  });
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingModalMessage, setLoadingModalMessage] = useState("");
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [brokenThumbnails, setBrokenThumbnails] = useState({});
  const [notice, setNotice] = useState(null);

  const noticeTimerRef = useRef(null);
  const pendingPreview = useRef(null);
  const loadMoreRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    setIsAdminLocal(localStorage.getItem("isAdmin") === "true");
  }, []);

  useEffect(() => {
    refreshUser?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  const showNotice = (message, type = "success") => {
    setNotice({ message, type });
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 4500);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setBrokenThumbnails({});
  }, [templatesList]);

  const isAdmin = userData?.userType === "admin" || isAdminLocal;

  useEffect(() => {
    if (!isTemplatesLoading && showLoadingModal && pendingPreview.current) {
      setShowLoadingModal(false);
      const pendingTemplate = pendingPreview.current;
      pendingPreview.current = null;
      openPreview(pendingTemplate, true);
    }
  }, [isTemplatesLoading, showLoadingModal]);

  const openPreview = (template, bypassLoadingCheck = false) => {
    if (!template) return;

    const displayTitle = template.templateName || template.title || "Theme";

    if (isTemplatesLoading && !bypassLoadingCheck) {
      pendingPreview.current = template;
      setLoadingModalMessage("Loading preview... Please wait.");
      setShowLoadingModal(true);
      return;
    }

    const { previewUrl } = resolveTemplatePreviewSource(template);

    if (!previewUrl) {
      showNotice(
        "This template does not have a preview URL yet. Edit it and add a domain URL.",
        "error",
      );
      return;
    }

    setPreviewModal({
      isOpen: true,
      url: previewUrl,
      title: displayTitle,
      templateId: template.templateId,
      templateNo: template.templateNo,
      institutionData: template,
    });
  };

  const openTemplateLink = (template) => {
    const { baseUrl } = resolveTemplatePreviewSource(template);
    const externalUrl = normalizeTemplateUrl(baseUrl || template?.url);
    if (!externalUrl) {
      showNotice("This template does not have a live URL configured yet.", "error");
      return;
    }
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  };

  const handleEditTemplate = (template) => {
    const values = getTemplateEditFormValues(template);

    setEditingTemplate({
      ...template,
      templateName: values.templateName || template.templateName || template.title,
      title: values.templateName || template.title,
      description: values.description || template.description,
      url: values.templateLink || template.url,
      domainUrl: values.templateLink || template.domainUrl || template.url,
      templateLink: values.templateLink || template.templateLink,
      thumbnail: values.thumbnail || template.thumbnail,
      icon: values.icon || template.icon,
    });
  };

  const handleUpdateTemplate = async (templateData) => {
    await updateTemplate(templateData);
  };

  const handleAddTemplate = async (templateData) => {
    return registerTemplate(templateData);
  };

  const handleRequestDelete = (template) => {
    setDeleteError("");
    window.setTimeout(() => setDeleteTarget(template), 0);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteTemplate({
        templateId: deleteTarget.templateId,
        templateNo: deleteTarget.templateNo,
      });
      setDeleteTarget(null);
      showNotice("Template deleted");
    } catch (error) {
      setDeleteError(error?.message || "Failed to delete template. Please try again.");
      throw error;
    }
  };

  const displayTemplates = useMemo(() => templatesList, [templatesList]);

  const categories = useMemo(() => {
    const fromApi = Array.isArray(templateCategories) ? templateCategories : [];
    const fromItems = displayTemplates
      .map((template) => template?.category)
      .filter((category) => typeof category === "string" && category.trim());
    const uniqueCategories = Array.from(new Set([...fromApi, ...fromItems]));
    return ["All", ...uniqueCategories];
  }, [displayTemplates, templateCategories]);

  // Debounce search so we don't hit the API on every keystroke.
  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  // Category / search → server-side paginated fetch (10 per page).
  useEffect(() => {
    listTemplates({
      force: true,
      limit: 10,
      category: activeCategory === "All" ? "" : activeCategory,
      search: debouncedSearch,
      includeCategories: true,
    }).catch((err) => {
      console.error("Failed to load templates", err);
      showNotice(err?.message || "Failed to load templates", "error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional filter deps only
  }, [activeCategory, debouncedSearch]);

  // Infinite scroll — load next 10 when sentinel enters view.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          templatesHasMore &&
          !isTemplatesLoading &&
          !isTemplatesLoadingMore
        ) {
          loadMoreTemplates().catch((err) => {
            console.error("Failed to load more templates", err);
          });
        }
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    templatesHasMore,
    isTemplatesLoading,
    isTemplatesLoadingMore,
    loadMoreTemplates,
    displayTemplates.length,
  ]);

  const hasActiveSearch = searchTerm.trim().length > 0;
  const hasActiveFilters = activeCategory !== "All" || hasActiveSearch;
  const showEmptyState = !isTemplatesLoading && displayTemplates.length === 0;
  const deleteTitle =
    deleteTarget?.templateName || deleteTarget?.title || "this template";

  return (
    <div className="min-h-screen bg-transparent text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="product-hero-text min-w-0">
              <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white">
                Themes
              </h1>
              <p className="text-sm text-white/40 mt-1.5">
                {isTemplatesLoading
                  ? "Loading themes…"
                  : templatesHasMore
                    ? `${displayTemplates.length}+ templates loaded`
                    : `${displayTemplates.length} template${
                        displayTemplates.length === 1 ? "" : "s"
                      } available`}
              </p>
            </div>

            {isAuthenticated && isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddTemplateModal(true)}
                className="product-hero-text h-10 px-4 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                <FiPlus size={16} />
                Add template
              </button>
            )}
          </div>

          <div className="product-hero-text mt-6 flex flex-col gap-4">
            <div className="relative">
              <FaSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                size={13}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 bg-[#0f0f0f] border border-white/[0.08] rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-colors"
                placeholder="Search by name, category, or description…"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => {
                const selected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                      selected
                        ? "bg-white text-black"
                        : "bg-white/[0.04] text-white/55 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {isTemplatesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/[0.06] bg-[#101010] overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-[#161616]" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-white/[0.06] w-3/5" />
                  <div className="h-3 bg-white/[0.04] w-2/5" />
                </div>
              </div>
            ))
          ) : showEmptyState ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-white/15 bg-white/[0.015]">
              <FaSearch className="text-white/25 mb-4" size={24} />
              <h2 className="text-lg font-semibold text-white mb-1.5">No themes found</h2>
              <p className="text-sm text-white/40 max-w-md">
                {hasActiveSearch
                  ? `Nothing matched “${searchTerm.trim()}”. Try another search or clear filters.`
                  : activeCategory !== "All"
                    ? `No themes in ${activeCategory} yet.`
                    : "No themes are available right now."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("All");
                  }}
                  className="mt-5 h-9 px-4 border border-white/15 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            displayTemplates.map((template) => {
              const displayTitle =
                template.templateName ||
                template.title ||
                template.category ||
                `Theme ${template.templateNo || ""}`.trim();
              const displaySubtitle = template.subtitle || template.description || "";
              const thumbnailSrc = resolveTemplateThumbnail(template);
              const thumbnailKey = `${template.id}:${thumbnailSrc}`;
              const showThumbnail =
                Boolean(thumbnailSrc) &&
                isDisplayableThumbnail(thumbnailSrc) &&
                !brokenThumbnails[thumbnailKey];

              return (
                <article
                  key={template.id}
                  className="group flex flex-col border border-white/[0.08] bg-[#101010] overflow-hidden transition-colors duration-200 hover:border-white/25"
                >
                  <div className="relative aspect-[16/10] bg-[#161616] overflow-hidden">
                    {showThumbnail ? (
                      <img
                        key={thumbnailKey}
                        src={thumbnailSrc}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenThumbnails((prev) => ({
                            ...prev,
                            [thumbnailKey]: true,
                          }))
                        }
                      />
                    ) : (
                      <div
                        className={`h-full w-full bg-gradient-to-br ${
                          template.gradient || "from-[#1c1c1c] to-[#111]"
                        } flex items-center justify-center p-3`}
                      >
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-widest text-center">
                          {displayTitle}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />

                    {template.category && (
                      <span className="absolute top-2 left-2 inline-flex items-center bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white/80">
                        {template.category}
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/45">
                      <button
                        type="button"
                        onClick={() => openPreview(template)}
                        className="h-8 px-3 bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => openTemplateLink(template)}
                        className="h-8 w-8 bg-white/10 text-white hover:bg-white/20 transition-colors inline-flex items-center justify-center"
                        aria-label={`Open ${displayTitle}`}
                      >
                        <FiExternalLink size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="px-3 py-2.5 flex flex-col gap-2 flex-1">
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-medium text-white leading-snug line-clamp-1">
                        {displayTitle}
                      </h3>
                      {displaySubtitle ? (
                        <p className="text-[11px] text-white/40 line-clamp-1 mt-0.5">
                          {displaySubtitle}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openPreview(template)}
                        className="text-[11px] font-medium text-white/45 hover:text-white transition-colors"
                      >
                        Live preview
                      </button>

                      {isAuthenticated && isAdmin ? (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleEditTemplate(template)}
                            className="h-7 w-7 text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors inline-flex items-center justify-center"
                            aria-label={`Edit ${displayTitle}`}
                            title="Edit"
                          >
                            <FiEdit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRequestDelete(template);
                            }}
                            className="h-7 w-7 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center"
                            aria-label={`Delete ${displayTitle}`}
                            title="Delete"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/25 truncate max-w-[40%]">
                          {template.category || ""}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isTemplatesLoadingMore ? (
            <div className="flex items-center gap-2 text-sm text-white/40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              Loading more themes…
            </div>
          ) : templatesHasMore ? (
            <button
              type="button"
              onClick={() =>
                loadMoreTemplates().catch((err) =>
                  console.error("Failed to load more templates", err),
                )
              }
              className="h-9 px-4 rounded-lg border border-white/15 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Load more
            </button>
          ) : displayTemplates.length > 0 && !isTemplatesLoading ? (
            <p className="text-xs text-white/25">You&apos;ve reached the end</p>
          ) : null}
        </div>
      </div>

      <LivePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        url={previewModal.url}
        title={previewModal.title}
        institutionData={previewModal.institutionData}
        isAuthenticated={isAuthenticated}
        templateId={previewModal.templateId}
        templateNo={previewModal.templateNo}
      />

      <FloatingNotice notice={notice} onClose={() => setNotice(null)} />

      <AddTemplateModal
        isOpen={showAddTemplateModal}
        onClose={() => setShowAddTemplateModal(false)}
        onSubmit={handleAddTemplate}
        onSuccess={() => showNotice("Template uploaded successfully")}
        existingCategories={categories.filter((category) => category !== "All")}
      />

      <EditTemplateModal
        key={editingTemplate?.id || "edit-template"}
        isOpen={Boolean(editingTemplate)}
        onClose={() => setEditingTemplate(null)}
        onSubmit={handleUpdateTemplate}
        onSuccess={() => showNotice("Template updated successfully")}
        template={editingTemplate}
        existingCategories={categories.filter((category) => category !== "All")}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete template?"
        description={
          <>
            This permanently removes{" "}
            <span className="text-white font-medium">“{deleteTitle}”</span> from
            the catalog. Existing sites that already use it are not deleted.
          </>
        }
        entityLabel={deleteTitle}
        entityMeta={
          deleteTarget
            ? `${deleteTarget.category || "Theme"} · #${deleteTarget.templateNo}`
            : ""
        }
        confirmLabel="Delete template"
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError("");
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {showLoadingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="animate-spin h-8 w-8 text-white/70"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            </div>
            <div className="text-white/70 text-sm mb-4 text-center w-full">
              {loadingModalMessage}
            </div>
            <button
              type="button"
              className="mt-2 h-9 px-5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors text-sm"
              onClick={() => setShowLoadingModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
