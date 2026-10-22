import React, { useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../../context/ApiContext";
import LoginPromptModal from "../../../components/common/LoginPromptModal";
import { extractTemplateContent, normalizeTemplateUrl } from "../../../utils/templateUtils";

const LivePreviewModal = ({ isOpen, onClose, url, title, institutionData, isAuthenticated, templateId, templateNo }) => {
  const [deviceView, setDeviceView] = useState("desktop");
  const iframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();
  const { createSite, userSites } = useApi();

  const existingTemplateSite = useMemo(() => {
    const normalize = (value) => String(value ?? "").trim().toLowerCase();
    const selectedTemplateId = normalize(templateId);
    const selectedTemplateNo = normalize(templateNo);

    if (!selectedTemplateId || !Array.isArray(userSites) || userSites.length === 0) {
      return null;
    }

    return (
      userSites.find((site) => {
        const siteTemplateId = normalize(site.templateId);
        const siteTemplateNo = normalize(site.templateNo);
        const siteLegacyTemplate = normalize(site.template);

        const matchesPair =
          siteTemplateId === selectedTemplateId &&
          (!selectedTemplateNo || siteTemplateNo === selectedTemplateNo);
        const matchesLegacyTemplateId = siteLegacyTemplate === selectedTemplateId;
        const matchesLegacyTemplateNo = selectedTemplateNo && siteLegacyTemplate === selectedTemplateNo;

        return matchesPair || matchesLegacyTemplateId || matchesLegacyTemplateNo;
      }) || null
    );
  }, [templateId, templateNo, userSites]);

  const previewUrl = normalizeTemplateUrl(url);

  const refreshPreview = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleStartEditing = async () => {
    if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
    }

    if (!previewUrl) {
      alert("This template does not have a valid preview URL configured.");
      return;
    }

    try {
      setIsCreating(true);

      // Call createSite API
      const response = await createSite(templateId, String(templateNo), previewUrl);
      const siteId = response?.siteId || response?.data?.siteId;

      if (siteId) {
          const initialTemplateData = extractTemplateContent(institutionData);
          onClose();
          navigate(`/builder/${siteId}`, {
            state: {
              initialTemplateData,
              previewUrl,
              templateId,
              templateNo,
              templateName: title,
            },
          });
      } else {
          throw new Error("Invalid response from create-site API");
      }

    } catch (err) {
      console.error("Failed to start editing:", err);
      alert(
        err.message ||
          "Could not create your site. Please sign in again and retry.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenExistingSite = () => {
    if (!existingTemplateSite?.siteId) return;
    const initialTemplateData = extractTemplateContent(institutionData);
    onClose();
    navigate(`/builder/${existingTemplateSite.siteId}`, {
      state: {
        initialTemplateData,
        previewUrl,
        templateId,
        templateNo,
        templateName: title,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90">
      <div className="w-full h-full flex flex-col bg-gray-900">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold">{title}</h3>

          <div className="flex items-center gap-3">
            {existingTemplateSite && isAuthenticated && (
              <span className="hidden lg:inline text-xs text-amber-300/90 mr-1">
                You already created this template.
              </span>
            )}

            {existingTemplateSite && isAuthenticated ? (
              <>
                <button
                  onClick={handleOpenExistingSite}
                  className="px-4 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                >
                  Open Existing Site
                </button>
                <button
                  onClick={handleStartEditing}
                  disabled={isCreating}
                  className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isCreating ? "Preparing..." : "Create Another"}
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEditing}
                disabled={isCreating}
                className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors mr-2 disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isCreating ? "Preparing..." : "Start Editing"}
              </button>
            )}
            <button
              onClick={refreshPreview}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Refresh
            </button>
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setDeviceView("desktop")}
                className={`px-4 py-1 text-sm transition-colors ${
                  deviceView === "desktop" ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                Desktop
              </button>

              <button
                onClick={() => setDeviceView("mobile")}
                className={`px-4 py-1 text-sm transition-colors ${
                  deviceView === "mobile" ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                Mobile
              </button>
            </div>

            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-4">
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* IFRAME ONLY */}
          <div className="flex-1 bg-gray-800 flex items-center justify-center p-4">
            <div
              className={`
                 bg-black shadow-xl transition-all duration-300 ease-in-out relative
                 ${deviceView === "desktop"
                    ? "w-full h-full"
                    : "w-[375px] h-[700px] rounded-[2rem] overflow-hidden border-[8px] border-gray-950"
                 }
              `}
            >
               {/* Mobile Notch Mockup */}
               {deviceView === "mobile" && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-950 rounded-b-2xl z-10"></div>
                )}

              {previewUrl ? (
                <iframe
                  key={`${previewUrl}-${iframeKey}`}
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full bg-white"
                  title="Template Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white text-gray-700 px-6 text-center">
                  <p>This template does not have a valid preview URL configured.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Login Prompt inside Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Create your website"
        description="Sign in to start customizing this template and save your progress."
      />
    </div>
  );
};

export default LivePreviewModal;
