import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { FiEdit3 } from "react-icons/fi";
import {
  countTemplateDataSections,
  getTemplateEditFormValues,
  isDisplayableThumbnail,
  parseTemplateDataJson,
} from "../../../utils/templateUtils";
import CategorySelect, {
  buildCategoryOptionList,
  mergeCategoryValue,
  splitCategoryValue,
  CATEGORY_OTHER_VALUE,
} from "./CategorySelect";

const INPUT_CLASS =
  "w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50";

const EMPTY_FORM = {
  templateName: "",
  description: "",
  templateLink: "",
  thumbnailUrl: "",
  thumbnailPreview: "",
  icon: "",
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function buildFormState(template) {
  const values = getTemplateEditFormValues(template);

  return {
    templateName: values.templateName,
    description: values.description,
    templateLink: values.templateLink,
    thumbnailUrl: values.thumbnail,
    thumbnailPreview: isDisplayableThumbnail(values.thumbnail) ? values.thumbnail : "",
    icon: values.icon,
  };
}

const EditTemplateModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  template,
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

  useEffect(() => {
    if (!isOpen || !template) {
      return;
    }

    const values = getTemplateEditFormValues(template);
    const options = buildCategoryOptionList(existingCategories, values.category);
    const { selected, custom } = splitCategoryValue(values.category, options);

    setForm(buildFormState(template));
    setCategorySelect(selected);
    setCustomCategory(custom);
    setTemplateData(null);
    setDataJsonFileName("");
    setDataJsonSectionCount(0);
    setThumbnailBase64("");
    setError("");
    setLoading(false);
  }, [isOpen, template?.templateId, template?.templateNo]);

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
          "data.json has no editable sections. Include keys like hero, navbar, footer, pages, etc.",
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

  const clearDataJsonFile = () => {
    setTemplateData(null);
    setDataJsonFileName("");
    setDataJsonSectionCount(0);
  };

  const handleThumbnailFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setForm((current) => ({
      ...current,
      thumbnailPreview: URL.createObjectURL(file),
      thumbnailUrl: "",
    }));

    try {
      const base64 = await readFileAsBase64(file);
      setThumbnailBase64(base64);
    } catch (err) {
      console.error(err);
      setError("Failed to read thumbnail file.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!template?.templateId || template.templateNo === undefined || template.templateNo === null) {
      setError("Template identity is missing.");
      return;
    }

    if (!form.templateName.trim()) {
      setError("Template Name is required.");
      return;
    }

    if (categorySelect === CATEGORY_OTHER_VALUE && !customCategory.trim()) {
      setError("Please enter a custom category or choose a different option.");
      return;
    }

    let formattedUrl = form.templateLink.trim().replace(/^["']|["']$/g, "").trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    formattedUrl = formattedUrl.replace(/\/+$/, "");

    if (formattedUrl) {
      try {
        new URL(formattedUrl);
      } catch {
        setError("Please enter a valid template URL.");
        return;
      }
    }

    const resolvedCategory = mergeCategoryValue(categorySelect, customCategory);
    const payload = {
      templateId: template.templateId,
      templateNo: String(template.templateNo),
      templateName: form.templateName.trim(),
      description: form.description.trim(),
    };

    if (resolvedCategory) {
      payload.category = resolvedCategory;
    }

    if (formattedUrl) {
      payload.templateLink = formattedUrl;
    }

    if (form.icon.trim()) {
      payload.icon = form.icon.trim();
    }

    if (thumbnailBase64) {
      payload.thumbnailBase64 = thumbnailBase64;
    } else if (form.thumbnailUrl.trim()) {
      payload.thumbnail = form.thumbnailUrl.trim();
    }

    // Optional replace — only send when a new data.json was chosen.
    if (templateData && countTemplateDataSections(templateData) > 0) {
      payload.templateData = templateData;
    }

    setLoading(true);

    try {
      await onSubmit(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update template.");
      setLoading(false);
    }
  };

  if (!isOpen || !template) {
    return null;
  }

  const headerLabel = [template.templateName, template.category, template.templateId]
    .map((value) => String(value || "").trim())
    .find(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
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
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800/80 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FiEdit3 size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white tracking-wide">Edit Template</h2>
              <p className="text-[11px] text-gray-500 truncate">
                {headerLabel} · #{template.templateNo} · metadata &amp; data.json
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0 disabled:opacity-50"
            aria-label="Close modal"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 z-30 bg-gray-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <span className="w-9 h-9 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-sm font-medium text-blue-200">Saving changes...</p>
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
                  <label className="text-xs font-semibold text-gray-300">Template Name</label>
                  <input
                    type="text"
                    value={form.templateName}
                    onChange={(e) => setForm((current) => ({ ...current, templateName: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
                <CategorySelect
                  selectedCategory={categorySelect}
                  customCategory={customCategory}
                  onSelectedCategoryChange={setCategorySelect}
                  onCustomCategoryChange={setCustomCategory}
                  existingCategories={existingCategories}
                  extraCategory={template?.category}
                  compact
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-300">Template URL</label>
                <input
                  type="text"
                  value={form.templateLink}
                  onChange={(e) => setForm((current) => ({ ...current, templateLink: e.target.value }))}
                  placeholder="https://templateexample.tekkzy.com"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  rows={2}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-900/50 border border-blue-500/15 rounded-lg">
                <span className="text-xs font-semibold text-gray-300 shrink-0">
                  data.json
                </span>
                <label className="inline-flex px-3 py-1.5 text-xs bg-blue-600/90 hover:bg-blue-500 text-white rounded-md cursor-pointer transition-colors">
                  {dataJsonFileName ? "Replace file" : "Choose file"}
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleDataJsonFile}
                    hidden
                  />
                </label>
                {dataJsonFileName ? (
                  <>
                    <span className="text-[11px] text-blue-300 truncate">
                      {dataJsonFileName} · {dataJsonSectionCount} section
                      {dataJsonSectionCount === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={clearDataJsonFile}
                      className="text-[11px] text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-gray-500">
                    Optional — upload to replace the template’s editable content
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Thumbnail</label>
                <div className="flex gap-3 items-start">
                  {form.thumbnailPreview ? (
                    <img
                      src={form.thumbnailPreview}
                      alt="Template thumbnail preview"
                      className="w-20 h-14 object-cover rounded-md border border-gray-800 shrink-0"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <label className="inline-flex px-3 py-1.5 text-xs bg-blue-600/90 hover:bg-blue-500 text-white rounded-md cursor-pointer transition-colors">
                      Upload image
                      <input type="file" accept="image/*" onChange={handleThumbnailFile} hidden />
                    </label>
                    <input
                      type="text"
                      value={form.thumbnailUrl}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setForm((current) => ({
                          ...current,
                          thumbnailUrl: nextValue,
                          thumbnailPreview: isDisplayableThumbnail(nextValue) ? nextValue : "",
                        }));
                        setThumbnailBase64("");
                      }}
                      placeholder="Or paste thumbnail URL"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-300">Icon URL (optional)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm((current) => ({ ...current, icon: e.target.value }))}
                  placeholder="https://example.com/icon.svg"
                  className={INPUT_CLASS}
                />
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm shadow-lg shadow-blue-500/35 ring-1 ring-blue-400/30 transition-all flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default EditTemplateModal;
