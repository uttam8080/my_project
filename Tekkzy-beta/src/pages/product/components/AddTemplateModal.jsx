import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { FiUploadCloud } from "react-icons/fi";
import {
  countTemplateDataSections,
  isDisplayableThumbnail,
  normalizeTemplateUrl,
  parseTemplateDataJson,
} from "../../../utils/templateUtils";
import CategorySelect, { mergeCategoryValue, CATEGORY_OTHER_VALUE } from "./CategorySelect";

const INPUT_CLASS =
  "w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50";

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
// Utility function to read a file as a Base64 string
const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const EMPTY_FORM = {
  templateName: "",
  description: "",
  domainUrl: "",
  thumbnailUrl: "",
  thumbnailPreview: "",
};

const AddTemplateModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  existingCategories = [],
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [categorySelect, setCategorySelect] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [templateData, setTemplateData] = useState(null);
  const [dataJsonFileName, setDataJsonFileName] = useState("");
  const [dataJsonSectionCount, setDataJsonSectionCount] = useState(0);
  const [thumbnailBase64, setThumbnailBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setCategorySelect("");
    setCustomCategory("");
    setTemplateData(null);
    setDataJsonFileName("");
    setDataJsonSectionCount(0);
    setThumbnailBase64("");
    setError("");
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleDataJsonFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");

    try {
      const text = await readFileAsText(file);
      const parsed = parseTemplateDataJson(text);
      const sectionCount = countTemplateDataSections(parsed);

      if (sectionCount === 0) {
        throw new Error(
          "data.json has no editable sections. Include keys like hero, navbar, footer, etc.",
        );
      }

      setTemplateData(parsed);
      setDataJsonFileName(file.name);
      setDataJsonSectionCount(sectionCount);
    } catch (err) {
      setTemplateData(null);
      setDataJsonFileName("");
      setDataJsonSectionCount(0);
      setError(err.message || "Failed to read data.json.");
    } finally {
      event.target.value = "";
    }
  };

  const handleThumbnailFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setForm((current) => ({
      ...current,
      thumbnailPreview: URL.createObjectURL(file),
      thumbnailUrl: "",
    }));

    try {
      setThumbnailBase64(await readFileAsBase64(file));
    } catch (err) {
      console.error(err);
      setError("Failed to read thumbnail image.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.templateName.trim()) {
      setError("Template Name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    const normalizedUrl = normalizeTemplateUrl(form.domainUrl);
    if (!normalizedUrl) {
      setError("Domain URL or template link is required.");
      return;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("Please enter a valid domain URL.");
      return;
    }

    if (!templateData || countTemplateDataSections(templateData) === 0) {
      setError(
        "templateData is required. Upload the data.json file exported from your template project.",
      );
      return;
    }

    if (categorySelect === CATEGORY_OTHER_VALUE && !customCategory.trim()) {
      setError("Please enter a custom category or choose a different option.");
      return;
    }

    const resolvedCategory = mergeCategoryValue(categorySelect, customCategory);
    const payload = {
      templateName: form.templateName.trim(),
      description: form.description.trim(),
      domainUrl: normalizedUrl,
      templateLink: normalizedUrl,
      templateData,
    };

    if (resolvedCategory) {
      payload.category = resolvedCategory;
    }

    if (thumbnailBase64) {
      payload.thumbnailBase64 = thumbnailBase64;
    } else if (form.thumbnailUrl.trim()) {
      payload.thumbnail = form.thumbnailUrl.trim();
    }

    setLoading(true);

    try {
      await onSubmit(payload);
      onSuccess?.();
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload template. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={loading ? undefined : onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-xl max-h-[min(88vh,620px)] flex flex-col bg-gray-950/95 border border-blue-500/25 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-busy={loading}
      >
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800/80 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FiUploadCloud size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white tracking-wide">Add Template</h2>
              <p className="text-[11px] text-gray-500 truncate">Upload metadata and data.json</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0"
            aria-label="Close modal"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 z-30 bg-gray-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <span className="w-9 h-9 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-sm font-medium text-blue-200">Uploading template...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 relative z-10">
          <div className={`flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 ${loading ? "pointer-events-none opacity-60" : ""}`}>
              {error && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Template Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.templateName}
                    onChange={(e) => setForm((current) => ({ ...current, templateName: e.target.value }))}
                    placeholder="Hotel Management Theme"
                    className={INPUT_CLASS}
                  />
                </div>
                <CategorySelect
                  selectedCategory={categorySelect}
                  customCategory={customCategory}
                  onSelectedCategoryChange={setCategorySelect}
                  onCustomCategoryChange={setCustomCategory}
                  existingCategories={existingCategories}
                  optional
                  compact
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-300">
                  Domain URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.domainUrl}
                  onChange={(e) => setForm((current) => ({ ...current, domainUrl: e.target.value }))}
                  placeholder="https://templatehm.awsaiapp.com"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-300">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  placeholder="Short catalog description"
                  rows={2}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/50 border border-blue-500/15 rounded-lg">
                <span className="text-xs font-semibold text-gray-300 shrink-0">
                  data.json <span className="text-red-400">*</span>
                </span>
                <label className="inline-flex px-3 py-1.5 text-xs bg-blue-600/90 hover:bg-blue-500 text-white rounded-md cursor-pointer transition-colors">
                  Choose file
                  <input type="file" accept=".json,application/json" onChange={handleDataJsonFile} hidden />
                </label>
                {dataJsonFileName ? (
                  <span className="text-[11px] text-blue-300 truncate">
                    {dataJsonFileName} · {dataJsonSectionCount} section{dataJsonSectionCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400/90">Required</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Thumbnail (optional)</label>
                <div className="flex gap-3 items-start">
                  {form.thumbnailPreview ? (
                    <img
                      src={form.thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-20 h-14 object-cover rounded-md border border-gray-800 shrink-0"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <label className="inline-flex px-3 py-1.5 text-xs bg-blue-600/90 hover:bg-blue-500 text-white rounded-md cursor-pointer transition-colors">
                      Upload image
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleThumbnailFile} hidden />
                    </label>
                    <input
                      type="text"
                      value={form.thumbnailUrl}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setForm((current) => ({
                          ...current,
                          thumbnailUrl: nextValue,
                          thumbnailPreview: isDisplayableThumbnail(nextValue) ? nextValue : current.thumbnailPreview,
                        }));
                        setThumbnailBase64("");
                      }}
                      placeholder="Or paste HTTPS thumbnail URL"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-gray-800/80 bg-gray-950/95">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-900/80 border border-gray-700 hover:bg-gray-800 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-sm shadow-lg shadow-blue-500/35 ring-1 ring-blue-400/30 flex items-center justify-center gap-2 transition-all"
              >
                {loading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Uploading..." : "Upload Template"}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddTemplateModal;
