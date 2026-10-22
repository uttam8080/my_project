import React, { useState, useEffect } from "react";
import {
  multipartUploadToS3,
  assertImageFileSize,
  MAX_IMAGE_UPLOAD_LABEL,
} from "../../../utils/multipartUpload";

/**
 * Template data often stores site-relative image paths (e.g. /assets/hero.jpg)
 * that only resolve on the template's own host. Resolve them against the
 * template preview URL for display; the stored value stays untouched.
 */
const resolvePreviewSrc = (src, assetBaseUrl) => {
  const raw = String(src || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (!assetBaseUrl) return raw;

  try {
    const baseUrl = new URL(assetBaseUrl);
    const prefix = baseUrl.pathname.replace(/\/$/, "");

    // Root-absolute paths that omit the template slug (e.g. /images/x.png
    // under /eye-clinic1/) resolve against the origin incorrectly without this.
    if (
      raw.startsWith("/") &&
      prefix &&
      prefix !== "/" &&
      !raw.startsWith(`${prefix}/`) &&
      raw !== prefix
    ) {
      return new URL(`${prefix}${raw}`, baseUrl.origin).href;
    }

    if (raw.startsWith("/")) {
      return new URL(raw, baseUrl.origin).href;
    }

    const base = assetBaseUrl.endsWith("/") ? assetBaseUrl : `${assetBaseUrl}/`;
    return new URL(raw, base).href;
  } catch {
    return raw;
  }
};

const ImageField = ({ label, value, onChange, variant = "light", assetBaseUrl = "", onFocusField }) => {
  const dark = variant === "dark";
  const [preview, setPreview] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [broken, setBroken] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextValue = value || "";
    setPreview(nextValue);
    setUrlValue(nextValue);
    setBroken(false);
    setError("");
  }, [value]);

  const emitFocus = () => {
    if (typeof onFocusField === "function") onFocusField(value);
  };

  const uploadToS3 = async (file) => {
    try {
      setLoading(true);
      setError("");
      const fileUrl = await multipartUploadToS3(file, {
        folder: "images",
      });

      setPreview(fileUrl);
      setUrlValue(fileUrl);
      setBroken(false);
      onChange(fileUrl);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Upload failed. Please try again.");
      setBroken(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      assertImageFileSize(file);
    } catch (err) {
      setError(err?.message || `Please use an image under ${MAX_IMAGE_UPLOAD_LABEL}.`);
      setBroken(false);
      e.target.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setBroken(false);
    setError("");
    await uploadToS3(file);
    // Allow re-uploading the same file name
    e.target.value = "";
  };

  const handleUrlChange = (e) => {
    const nextUrl = e.target.value;
    setUrlValue(nextUrl);
    setPreview(nextUrl);
    setBroken(false);
    setError("");
    onChange(nextUrl);
  };

  return (
    <div
      className={
        dark
          ? ""
          : "mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition"
      }
      onMouseDown={emitFocus}
      onFocusCapture={emitFocus}
    >
      <div
        className={`text-[11px] font-medium tracking-wide mb-1.5 ${
          dark ? "text-white/40" : "text-xs font-semibold text-gray-500 mb-2"
        }`}
      >
        {label}
      </div>

      {preview && !broken && (
        <div className="mb-3">
          <img
            src={resolvePreviewSrc(preview, assetBaseUrl)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className={`rounded-lg object-cover max-h-36 w-full ${
              dark ? "border border-white/10 bg-white/[0.03]" : "border border-gray-200"
            }`}
          />
        </div>
      )}

      {broken && preview && (
        <div
          className={`mb-3 rounded-lg px-3 py-6 text-center text-xs ${
            dark
              ? "border border-white/10 bg-white/[0.03] text-white/35"
              : "border border-gray-200 bg-gray-50 text-gray-500"
          }`}
        >
          Image unavailable — paste a new URL or upload
        </div>
      )}

      {!preview && (
        <div
          className={`mb-3 rounded-lg px-3 py-8 text-center text-xs border border-dashed ${
            dark
              ? "border-white/15 bg-white/[0.02] text-white/35"
              : "border-gray-300 bg-gray-50 text-gray-500"
          }`}
        >
          No image yet — upload or paste a URL
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex items-center justify-center h-9 px-3.5 text-[12px] font-medium rounded-lg cursor-pointer transition-colors ${
            dark
              ? "bg-white/[0.08] text-white/80 hover:bg-white/[0.12]"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } ${loading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {loading ? "Uploading…" : "Upload image"}
          <input type="file" accept="image/*" onChange={handleFile} hidden disabled={loading} />
        </label>
        <span className={`text-[11px] ${dark ? "text-white/35" : "text-gray-500"}`}>
          Max {MAX_IMAGE_UPLOAD_LABEL}
        </span>
      </div>

      <div className="mt-2.5">
        <input
          type="text"
          value={urlValue}
          onChange={handleUrlChange}
          placeholder="Paste image URL"
          className={
            dark
              ? "w-full text-[14px] text-white bg-[#141414] border border-white/[0.12] rounded-lg px-3.5 py-3 placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30"
              : "w-full text-gray-800 bg-gray-50 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          }
        />
      </div>

      {error && (
        <div className={`text-xs mt-2 ${dark ? "text-red-300/90" : "text-red-500"}`}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageField;
