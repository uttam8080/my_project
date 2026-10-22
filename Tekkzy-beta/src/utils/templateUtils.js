const TEMPLATE_ID_CATEGORY = {
  CLINIC: "Doctor Service",
  ENTERPRISE: "Enterprise",
  HOTEL: "Hotel Management",
  RESTAURANT: "Cafe Management",
  EDUCATION: "Education",
  RESORT: "Resort",
  SALON: "Salon Management",
};

const TEMPLATE_TYPE_CATEGORY = {
  eye: "Doctor Service",
  resort: "Resort",
  hotel: "Hotel Management",
  kid: "Education",
  school: "Education",
  college: "Education",
  cafe: "Cafe Management",
  furniture: "Enterprise",
  fashion: "Enterprise",
  Salon: "Salon Management",
};

const CATEGORY_GRADIENT = {
  "Doctor Service": "from-blue-400 to-cyan-500",
  Enterprise: "from-gray-600 to-gray-800",
  "Hotel Management": "from-emerald-500 to-green-700",
  "Cafe Management": "from-amber-600 to-orange-700",
  Education: "from-blue-600 to-indigo-700",
  Resort: "from-teal-500 to-cyan-600",
  "Salon Management": "from-amber-600 to-orange-700",
};

export const TEMPLATE_METADATA_KEYS = [
  "templateNo",
  "templateName",
  "templateId",
  "domainUrl",
  "templateLink",
  "thumbnail",
  "description",
  "title",
  "createdAt",
  "updatedAt",
  "icon",
  "templateType",
  "templatetype",
  "templateData",
  "schemaVersion",
  "template",
  // System / not section content — never list as sidebar sections
  "institutionId",
  "InstitutionId",
  "s3",
  "locale",
];

function resolveCategory(templateId, templateType) {
  const idKey = String(templateId || "").toUpperCase();
  if (TEMPLATE_ID_CATEGORY[idKey]) {
    return TEMPLATE_ID_CATEGORY[idKey];
  }

  const typeKey = String(templateType || "").trim();
  if (TEMPLATE_TYPE_CATEGORY[typeKey]) {
    return TEMPLATE_TYPE_CATEGORY[typeKey];
  }

  if (typeKey) {
    return typeKey.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return "General";
}

function resolveGradient(category, seedGradient) {
  return seedGradient || CATEGORY_GRADIENT[category] || "from-gray-600 to-gray-800";
}

function ensureString(value, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

export function normalizeThumbnailUrl(url) {
  const value = ensureString(url).replace(/^["']|["']$/g, "").trim();
  if (!value || value === "undefined" || value === "null") {
    return "";
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return "";
}

export function isDisplayableThumbnail(url) {
  return Boolean(normalizeThumbnailUrl(url));
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function prepareThumbnailPayload(thumbnail) {
  const value = ensureString(thumbnail);
  if (!value) {
    return {};
  }

  if (/^https?:\/\//i.test(value)) {
    return { thumbnail: value };
  }

  if (typeof window !== "undefined" && value.startsWith("/")) {
    try {
      const assetUrl = `${window.location.origin}${value}`;
      const response = await fetch(assetUrl);

      if (!response.ok) {
        console.warn(`Thumbnail asset not found: ${assetUrl}`);
        return {};
      }

      const blob = await response.blob();
      return { thumbnailBase64: await blobToBase64(blob) };
    } catch (error) {
      console.warn("Failed to prepare thumbnail upload:", error);
      return {};
    }
  }

  return {};
}

export function normalizeThumbnailBase64(value) {
  const raw = ensureString(value);
  if (!raw) {
    return "";
  }

  return raw.includes(",") ? raw.split(",").pop() : raw;
}

export function parseTemplateDataJson(input) {
  let parsed = input;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error("data.json is not valid JSON.");
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("data.json must be a JSON object containing template sections.");
  }

  if (
    parsed.templateData &&
    typeof parsed.templateData === "object" &&
    !Array.isArray(parsed.templateData)
  ) {
    return parsed.templateData;
  }

  return parsed;
}

export function countTemplateDataSections(templateData) {
  if (!templateData || typeof templateData !== "object") {
    return 0;
  }

  const ignore = new Set(TEMPLATE_METADATA_KEYS);
  return Object.keys(templateData).filter((key) => !ignore.has(key)).length;
}

export function formatTemplateApiError(data, fallback = "Request failed") {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const message = ensureString(data.error || data.message);
  const hint = ensureString(data.hint || data.details);

  if (message && hint && !message.includes(hint)) {
    return `${message} ${hint}`;
  }

  return message || hint || fallback;
}

export async function enrichTemplateUploadPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const {
    thumbnail,
    thumbnailBase64,
    domainUrl,
    templateLink,
    templateData,
    ...rest
  } = payload;

  const normalizedUrl = normalizeTemplateUrl(domainUrl || templateLink);
  const result = {
    ...rest,
    templateData,
  };

  if (normalizedUrl) {
    result.domainUrl = normalizedUrl;
    result.templateLink = normalizedUrl;
  }

  if (thumbnailBase64) {
    result.thumbnailBase64 = normalizeThumbnailBase64(thumbnailBase64);
  } else if (thumbnail) {
    Object.assign(result, await prepareThumbnailPayload(thumbnail));
  }

  return result;
}

export async function enrichTemplateUpdatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const { thumbnail, thumbnailBase64, ...rest } = payload;

  if (thumbnailBase64) {
    return {
      ...rest,
      thumbnailBase64,
    };
  }

  const thumbnailPayload = await prepareThumbnailPayload(thumbnail);

  return {
    ...rest,
    ...thumbnailPayload,
  };
}

function getHeroEntry(templateData) {
  const hero = templateData?.hero;
  if (Array.isArray(hero)) {
    return hero[0] || null;
  }

  return hero || null;
}

function formatHeroTitle(title) {
  if (!title) {
    return "";
  }

  if (typeof title === "string") {
    return title.trim();
  }

  if (typeof title === "object") {
    const line1 = ensureString(title.line1 || title.line_1);
    const line2 = ensureString(title.line2 || title.line_2);
    const combined = [line1, line2].filter(Boolean).join(" ").trim();
    if (combined) {
      return combined;
    }

    return ensureString(title.main || title.text || title.label);
  }

  return "";
}

function resolveTitleFromHero(hero) {
  if (!hero || typeof hero !== "object") {
    return "";
  }

  return (
    formatHeroTitle(hero.title) ||
    ensureString(hero.heading) ||
    (Array.isArray(hero.titleLines) ? hero.titleLines.join(" ").trim() : "") ||
    (Array.isArray(hero.headingLines) ? hero.headingLines.join(" ").trim() : "") ||
    ensureString(hero.label) ||
    ensureString(hero.tagline)
  );
}

function isGenericTemplateLabel(value, templateNo = "") {
  const normalized = ensureString(value);
  if (!normalized) {
    return true;
  }

  const no = ensureString(templateNo);
  const genericPatterns = [
    /^template\s*\d*$/i,
    /^theme\s*\d*$/i,
  ];

  if (no) {
    genericPatterns.push(new RegExp(`^template\\s*${no}$`, "i"));
    genericPatterns.push(new RegExp(`^theme\\s*${no}$`, "i"));
  }

  return genericPatterns.some((pattern) => pattern.test(normalized));
}

function resolveBrandName(templateData) {
  return (
    ensureString(templateData?.navbar?.brand?.name) ||
    ensureString(templateData?.navbar?.brandName) ||
    ensureString(templateData?.navbar?.brand?.text) ||
    ensureString(templateData?.footer?.brand?.name) ||
    ensureString(templateData?.navbar?.logo?.title)
  );
}

function buildCatalogFallbackName(category, templateType, templateNo) {
  const typeLabel = ensureString(templateType).replace(/[-_]+/g, " ");
  const formattedType = typeLabel
    ? typeLabel.replace(/\b\w/g, (char) => char.toUpperCase())
    : "";
  const parts = [];

  if (category && category !== "General") {
    parts.push(category);
  }

  if (formattedType) {
    parts.push(formattedType);
  }

  if (templateNo) {
    parts.push(`#${templateNo}`);
  }

  return parts.join(" · ");
}

function extractCatalogFields(item) {
  const nested = item?.templateData && typeof item.templateData === "object"
    ? item.templateData
    : {};

  return {
    templateName: ensureString(item.templateName || nested.templateName),
    title: ensureString(item.title || nested.title),
    description: ensureString(item.description || nested.description),
    category: ensureString(item.category || nested.category),
    thumbnail: item.thumbnail || nested.thumbnail || "",
    domainUrl: item.domainUrl || nested.domainUrl || "",
    templateLink: item.templateLink || nested.templateLink || "",
  };
}

function resolveDisplayName(item, templateData, category, templateType) {
  const templateNo = String(item.templateNo ?? "").trim();
  const catalog = extractCatalogFields(item);

  if (catalog.templateName && !isGenericTemplateLabel(catalog.templateName, templateNo)) {
    return catalog.templateName;
  }

  if (catalog.title && !isGenericTemplateLabel(catalog.title, templateNo)) {
    return catalog.title;
  }

  const brandName = resolveBrandName(templateData);
  if (brandName) {
    return brandName;
  }

  const heroTitle = resolveTitleFromHero(getHeroEntry(templateData));
  if (heroTitle) {
    return heroTitle;
  }

  const fallbackName = buildCatalogFallbackName(category, templateType, templateNo);
  if (fallbackName) {
    return fallbackName;
  }

  return templateNo ? `Theme ${templateNo}` : "Theme";
}

function getTemplatePreviewHostKey(item) {
  const catalog = extractCatalogFields(item);
  const rawUrl =
    item.domainUrl ||
    item.templateLink ||
    item.url ||
    catalog.domainUrl ||
    catalog.templateLink ||
    "";
  const normalized = normalizeTemplateUrl(rawUrl);
  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "";
    // Path-hosted templates (products.tekkzy.com/enterprise1) need the slug.
    if (host === "products.tekkzy.com" && path && path !== "/") {
      return `url:${host}${path.toLowerCase()}`;
    }
    return `url:${host}`;
  } catch {
    return "";
  }
}

/**
 * Multiple identity keys so API duplicates merge even when one row uses a
 * UUID templateId and another uses CLINIC / domainUrl / templateType.
 */
function getTemplateIdentityKeys(item) {
  const keys = new Set();
  const templateNo = String(item.templateNo ?? "").trim();
  const templateType = String(item.templateType || item.templatetype || "")
    .trim()
    .toLowerCase();
  const templateId = String(item.templateId || "").trim();
  const catalog = extractCatalogFields(item);
  const name = String(
    item.templateName || catalog.templateName || item.title || catalog.title || "",
  )
    .trim()
    .toLowerCase();

  // Always key by primary id so each upload (tmpl-*) stays visible.
  if (templateId) {
    keys.add(`id:${templateId.toUpperCase()}:${templateNo || "1"}`);
  }

  const isUuidUpload = templateId.startsWith("tmpl-");
  const hostKey = getTemplatePreviewHostKey(item);

  // Host/name dedupe only for seeded catalog rows — not UUID uploads,
  // otherwise a new upload with the same preview domain disappears.
  if (!isUuidUpload) {
    if (hostKey) keys.add(hostKey);

    if (templateType && templateNo) {
      keys.add(`type:${templateType}:${templateNo}`);
    }

    if (name && hostKey) {
      keys.add(`namehost:${name}:${hostKey}`);
    }
  }

  if (keys.size === 0) {
    keys.add(`fallback:${templateId || "unknown"}-${templateNo || "0"}`);
  }

  return [...keys];
}

function scoreTemplateCatalogRichness(item) {
  let score = 0;
  const catalog = extractCatalogFields(item);
  const thumbnail = catalog.thumbnail || item.thumbnail;

  if (item.templateName) score += 10;
  if (item.domainUrl || item.templateLink || catalog.domainUrl || catalog.templateLink) score += 10;
  if (item.title) score += 5;
  if (item.templateData && typeof item.templateData === "object") score += 3;
  if (isDisplayableThumbnail(thumbnail)) score += 20;
  if (!String(item.templateId || "").startsWith("tmpl-")) score += 5;

  return score;
}

function pickDisplayableThumbnailFromItems(...items) {
  for (const item of items) {
    if (!item) {
      continue;
    }

    const catalog = extractCatalogFields(item);
    const normalized = normalizeThumbnailUrl(catalog.thumbnail || item.thumbnail);
    if (isDisplayableThumbnail(normalized)) {
      return normalized;
    }
  }

  return "";
}

function mergeTemplateRecords(existing, incoming) {
  const existingScore = scoreTemplateCatalogRichness(existing);
  const incomingScore = scoreTemplateCatalogRichness(incoming);
  const winner = incomingScore > existingScore ? { ...incoming } : { ...existing };
  const loser = incomingScore > existingScore ? existing : incoming;

  const mergedThumbnail = pickDisplayableThumbnailFromItems(winner, loser);
  if (mergedThumbnail) {
    winner.thumbnail = mergedThumbnail;
  }

  if (!winner.templateName && loser.templateName) {
    winner.templateName = loser.templateName;
  }

  if (!winner.domainUrl && loser.domainUrl) {
    winner.domainUrl = loser.domainUrl;
  }

  if (!winner.templateLink && loser.templateLink) {
    winner.templateLink = loser.templateLink;
  }

  if (!winner.description && loser.description) {
    winner.description = loser.description;
  }

  // Prefer stable non-UUID ids when merging UUID + CLINIC-style duplicates.
  const winnerId = String(winner.templateId || "");
  const loserId = String(loser.templateId || "");
  if (winnerId.startsWith("tmpl-") && loserId && !loserId.startsWith("tmpl-")) {
    winner.templateId = loser.templateId;
  }

  if (!winner.templateType && (loser.templateType || loser.templatetype)) {
    winner.templateType = loser.templateType || loser.templatetype;
  }

  return winner;
}

function dedupeTemplateItems(items = []) {
  if (!Array.isArray(items) || items.length <= 1) {
    return Array.isArray(items) ? [...items] : [];
  }

  const parent = items.map((_, index) => index);
  const find = (index) => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    let cursor = index;
    while (parent[cursor] !== root) {
      const next = parent[cursor];
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  };
  const unite = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };

  const keyToIndex = new Map();
  items.forEach((item, index) => {
    getTemplateIdentityKeys(item).forEach((key) => {
      if (keyToIndex.has(key)) {
        unite(index, keyToIndex.get(key));
      } else {
        keyToIndex.set(key, index);
      }
    });
  });

  const groups = new Map();
  items.forEach((item, index) => {
    const root = find(index);
    const existing = groups.get(root);
    if (!existing) {
      groups.set(root, item);
      return;
    }
    groups.set(root, mergeTemplateRecords(existing, item));
  });

  return Array.from(groups.values());
}

function finalizeNormalizedTemplate(item, normalized, displayName) {
  const catalog = extractCatalogFields(item);
  const resolvedThumbnail = resolveTemplateThumbnail({ ...normalized, _raw: item });
  const previewUrl =
    normalized.url ||
    resolveUrl(item) ||
    normalizeTemplateUrl(catalog.templateLink || catalog.domainUrl);
  const domainUrl = normalizeTemplateUrl(catalog.domainUrl || normalized.domainUrl);
  const templateLink = normalizeTemplateUrl(catalog.templateLink || normalized.templateLink);

  return {
    ...normalized,
    templateName: displayName,
    title: displayName,
    url: previewUrl,
    domainUrl: domainUrl || templateLink || previewUrl,
    templateLink: templateLink || domainUrl || previewUrl,
    description: catalog.description || normalized.description || "",
    thumbnail: resolvedThumbnail,
    gradient: resolveGradient(normalized.category),
  };
}

function extractTemplateDataFromItem(item) {
  if (item?.templateData && typeof item.templateData === "object") {
    return item.templateData;
  }

  const data = {};
  Object.entries(item || {}).forEach(([key, value]) => {
    if (!TEMPLATE_METADATA_KEYS.includes(key)) {
      data[key] = value;
    }
  });
  return data;
}

function resolveSubtitle(item, templateData) {
  const catalog = extractCatalogFields(item);
  const heroTitle = resolveTitleFromHero(getHeroEntry(templateData));

  if (catalog.title && catalog.title !== catalog.templateName) {
    return catalog.title;
  }

  if (heroTitle && heroTitle !== catalog.templateName) {
    return heroTitle;
  }

  return "";
}

export function normalizeTemplateUrl(url) {
  if (url === undefined || url === null) {
    return "";
  }

  const trimmed = String(url).trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return "";
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  // Same-origin relative paths (e.g. /__proxy_template/salon002) stay relative.
  if (withoutTrailingSlash.startsWith("/")) {
    return withoutTrailingSlash;
  }

  return `https://${withoutTrailingSlash}`;
}

/**
 * Builder live-edit only works on template hosts, not on customer live/custom
 * domains. Editable hosts are:
 * - template*.tekkzy.com / template*.awsaiapp.com (subdomain per template)
 * - products.tekkzy.com/<slug> (path-based template hosting)
 * - localhost (dev)
 */
export function isEditableTemplateHost(url) {
  const normalized = normalizeTemplateUrl(url);
  if (!normalized) return false;

  // Dev same-origin product proxy
  if (
    normalized.includes("/__proxy_template/") ||
    normalized.startsWith("/__proxy_template/")
  ) {
    return true;
  }

  try {
    const parsed = normalized.startsWith("/")
      ? new URL(normalized, "http://localhost")
      : new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (
      host.startsWith("template") &&
      (host.endsWith(".tekkzy.com") || host.endsWith(".awsaiapp.com"))
    ) {
      return true;
    }

    if (host === "products.tekkzy.com") {
      // Only slug URLs point at a template build (the bare host is the catalog).
      return parsed.pathname.replace(/\/+$/, "").length > 1;
    }

    // Local/dev template previews
    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/** Known subdomain fallbacks when catalog lookup fails. */
const TEMPLATE_HOST_FALLBACKS = {
  resort: "templaters",
  rs: "templaters",
  hotel: "templatehm",
  hm: "templatehm",
  clinic: "templateds",
  eye: "templateds",
  ds: "templateds",
  cafe: "templatecf",
  restaurant: "templatecf",
  education: "templateed1",
  school: "templateed1",
  college: "templateed2",
  kid: "templateed3",
  salon: "templatesalon2",
};

/**
 * Map legacy template*.tekkzy.com hosts → products.tekkzy.com/<slug>.
 * Builder highlight/scroll bridge is injected on the products host.
 */
const TEMPLATE_SUBDOMAIN_TO_PRODUCTS_SLUG = {
  templaters: "resort1",
  templaters2: "resort2",
  templatecf: "cafe1",
  templatecf1: "cafe1",
  templateds: "eye-clinic1",
  templateed1: "education1",
  templateed2: "education2",
  templateed3: "education3",
  templatesalon2: "salon001",
  templatesalon: "salon001",
  // legacy upload path kept for older sites still pointed at salon1
  templatesalon1: "salon1",
  // No hotel build exists on products — templatehm currently serves the same
  // enterprise app, so point it at the bridge-enabled enterprise build.
  templatehm: "enterprise1",
  templateep: "enterprise1",
  templateep1: "enterprise2",
  templateep2: "enterprise3",
  templatefurniture: "enterprise1",
  templateenterprise: "enterprise1",
  templatedesigner: "designer1",
  templatelawyer: "lawyer1",
  templateinvestor: "investor1",
  // Numbered product hosts / occasional aliases
  templatesalon002: "salon002",
  templatecloth: "cloth001",
  templatecloth1: "cloth001",
  templatecloth2: "cloth002",
  templatewedding: "wedding001",
  templaterestaurant: "restaurant001",
  templateclinic: "clinic001",
  templateresort: "resort001",
  templateresort001: "resort001",
};

/**
 * OPTIONAL local same-origin proxy for products templates (preview-bridge hacking).
 *
 * OFF by default — remapping every products URL to /__proxy_template/<slug>/
 * breaks multipage / root-absolute `/assets/*` templates (blank preview +
 * Failed to fetch data.json). Opt in with VITE_USE_TEMPLATE_PROXY=1 in .env.
 */
export function preferDevLocalTemplateProxy(url) {
  try {
    if (!import.meta.env?.DEV) return url;
    const flag = String(import.meta.env.VITE_USE_TEMPLATE_PROXY || "")
      .trim()
      .toLowerCase();
    if (flag !== "1" && flag !== "true" && flag !== "yes") {
      return url;
    }
  } catch {
    return url;
  }
  const raw = String(url || "").trim();
  if (!raw) return "";

  // Prefer absolute same-origin URLs so iframe/postMessage URL parsing never fails.
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";

  const toProxy = (slug) => {
    if (!slug) return "";
    const path = `/__proxy_template/${slug}/`;
    return origin ? `${origin}${path}` : path;
  };

  if (raw.startsWith("/__proxy_template/") || raw.includes("/__proxy_template/")) {
    const pathOnly = raw.startsWith("http")
      ? (() => {
          try {
            return new URL(raw).pathname;
          } catch {
            return raw;
          }
        })()
      : raw.split("?")[0];
    const withSlash = pathOnly.endsWith("/") ? pathOnly : `${pathOnly}/`;
    return origin && withSlash.startsWith("/")
      ? `${origin}${withSlash}`
      : withSlash;
  }

  const normalized = normalizeTemplateUrl(raw);
  if (!normalized) return "";

  try {
    const parsed = normalized.startsWith("/")
      ? new URL(normalized, origin || "http://localhost")
      : new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    let slug = "";

    if (host === "products.tekkzy.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      slug = parts[0] || "";
    } else if (host === "localhost" || host === "127.0.0.1") {
      // Already local — keep if it's already the proxy, else leave alone.
      if (parsed.pathname.includes("/__proxy_template/")) {
        return `${parsed.origin}${parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`}`;
      }
      return normalized.endsWith("/") || normalized.startsWith("/")
        ? normalized.endsWith("/")
          ? normalized
          : `${normalized}/`
        : normalized;
    } else {
      const subdomain = host.split(".")[0];
      slug = TEMPLATE_SUBDOMAIN_TO_PRODUCTS_SLUG[subdomain] || "";
    }

    if (!slug) return normalized;
    return toProxy(slug);
  } catch {
    return normalized;
  }
}

/** Prefer products.tekkzy.com/<slug> so the preview-bridge script is available. */
export function preferProductsTemplateUrl(url) {
  const normalized = normalizeTemplateUrl(url);
  if (!normalized) return "";

  // Relative/proxy paths never parse as absolute URLs.
  if (normalized.startsWith("/")) {
    return preferDevLocalTemplateProxy(normalized) || normalized;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host === "products.tekkzy.com") {
      const productsUrl = normalized.endsWith("/") ? normalized : `${normalized}/`;
      return preferDevLocalTemplateProxy(productsUrl) || productsUrl;
    }

    const subdomain = host.split(".")[0];
    const slug = TEMPLATE_SUBDOMAIN_TO_PRODUCTS_SLUG[subdomain];
    if (slug && (host.endsWith(".tekkzy.com") || host.endsWith(".awsaiapp.com"))) {
      const productsUrl = `https://products.tekkzy.com/${slug}/`;
      return preferDevLocalTemplateProxy(productsUrl) || productsUrl;
    }
  } catch {
    return preferDevLocalTemplateProxy(normalized) || normalized;
  }

  return preferDevLocalTemplateProxy(normalized) || normalized;
}

export function resolveEditableTemplatePreviewUrl(siteRecord, fallbackTemplateUrl, templateList = []) {
  const pick = (url) => {
    const preferred = preferProductsTemplateUrl(url);
    return preferred && isEditableTemplateHost(preferred) ? preferred : "";
  };

  const fromFallback = pick(fallbackTemplateUrl);
  if (fromFallback) return fromFallback;

  const matched = resolveSiteTemplate(templateList || [], siteRecord || {});
  const fromCatalog = pick(
    matched?.templateLink || matched?.url || matched?.domainUrl || "",
  );
  if (fromCatalog) return fromCatalog;

  const siteCandidates = [
    siteRecord?.templateUrl,
    siteRecord?.previewUrl,
    siteRecord?.url,
    siteRecord?.domainUrl,
  ];
  for (const candidate of siteCandidates) {
    const normalized = pick(candidate);
    if (normalized) return normalized;
  }

  const typeKey = String(
    siteRecord?.templateType ||
      siteRecord?.templatetype ||
      matched?.templateType ||
      siteRecord?.templateId ||
      siteRecord?.template ||
      "",
  )
    .trim()
    .toLowerCase();

  if (TEMPLATE_HOST_FALLBACKS[typeKey]) {
    const host = TEMPLATE_HOST_FALLBACKS[typeKey];
    const remapped = preferProductsTemplateUrl(`https://${host}.tekkzy.com`);
    if (remapped) return remapped;
    return `https://${host}.tekkzy.com`;
  }

  if (typeKey.includes("resort")) {
    return "https://products.tekkzy.com/resort1/";
  }

  const rawHost = String(siteRecord?.template || siteRecord?.templateId || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (rawHost && !rawHost.startsWith("tmpl-") && !rawHost.includes("site_")) {
    if (rawHost.includes(".")) {
      const remapped = pick(rawHost);
      if (remapped) return remapped;
    } else if (rawHost.startsWith("template")) {
      const remapped = preferProductsTemplateUrl(`https://${rawHost}.tekkzy.com`);
      if (remapped) return remapped;
      return `https://${rawHost}.tekkzy.com`;
    } else {
      // Direct products slug (resort1, designer1, …)
      const slug = rawHost.replace(/^\//, "");
      if (slug) return `https://products.tekkzy.com/${slug}/`;
    }
  }

  // Last resort: show the site's own template URL (even if live edit is
  // limited there) rather than defaulting every unknown site to the same
  // hard-coded template, which made all previews look identical.
  const anyKnownUrl = [
    preferProductsTemplateUrl(fallbackTemplateUrl),
    preferProductsTemplateUrl(
      matched?.templateLink || matched?.url || matched?.domainUrl || "",
    ),
    ...siteCandidates.map((candidate) => preferProductsTemplateUrl(candidate)),
  ].find(Boolean);

  return anyKnownUrl || "";
}

function resolveUrl(item) {
  const catalog = extractCatalogFields(item);
  const candidates = [
    catalog.templateLink,
    item.templateLink,
    catalog.domainUrl,
    item.domainUrl,
    item.url,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeTemplateUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

export function resolveTemplateInstitutionId(template) {
  const templateId = String(template?.templateId || "").trim();

  if (templateId && !templateId.startsWith("tmpl-")) {
    return templateId;
  }

  return "";
}

export function resolveTemplatePreviewSource(template) {
  if (!template) {
    return { baseUrl: "", institutionId: "", previewUrl: "" };
  }

  const baseUrl = resolveUrl(template._raw || template) ||
    normalizeTemplateUrl(template.templateLink || template.domainUrl || template.url);
  const institutionId = resolveTemplateInstitutionId(template);
  const previewUrl = buildTemplatePreviewUrl(baseUrl, institutionId);

  return { baseUrl, institutionId, previewUrl };
}

export function buildTemplatePreviewUrl(baseUrl, institutionId) {
  const normalized = normalizeTemplateUrl(baseUrl);
  if (!normalized) {
    return "";
  }

  if (!institutionId) {
    return normalized;
  }

  const separator = normalized.includes("?") ? "&" : "?";
  return `${normalized}${separator}institutionid=${encodeURIComponent(institutionId)}`;
}

function resolveThumbnail(item, templateData) {
  const catalog = extractCatalogFields(item);
  const hero = getHeroEntry(templateData);
  const candidates = [
    catalog.thumbnail,
    item.thumbnail,
    hero?.backgroundImage,
    hero?.heroImage,
    hero?.image,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeThumbnailUrl(candidate);
    if (isDisplayableThumbnail(normalized)) {
      return normalized;
    }
  }

  return "";
}

export function resolveTemplateThumbnail(template) {
  if (!template) {
    return "";
  }

  const source = template._raw || template;
  const catalog = extractCatalogFields(source);
  const templateData = extractTemplateContent(template);
  const hero = getHeroEntry(templateData);
  const candidates = [
    template.thumbnail,
    catalog.thumbnail,
    source.thumbnail,
    hero?.backgroundImage,
    hero?.heroImage,
    hero?.image,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeThumbnailUrl(candidate);
    if (isDisplayableThumbnail(normalized)) {
      return normalized;
    }
  }

  return "";
}

export function normalizeTemplateItem(item, index = 0) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const catalog = extractCatalogFields(item);
  const templateId = item.templateId;
  const templateNo = String(item.templateNo ?? "");
  const templateType = item.templateType || item.templatetype || "";
  const templateData = extractTemplateDataFromItem(item);
  // Prefer the category saved on upload over id/type heuristics.
  const category =
    ensureString(item.category || catalog.category) ||
    resolveCategory(templateId, templateType);
  const displayName = resolveDisplayName(item, templateData, category, templateType);
  const subtitle = resolveSubtitle(item, templateData);
  const url = resolveUrl(item);
  const domainUrl = normalizeTemplateUrl(catalog.domainUrl || item.domainUrl);
  const templateLink = normalizeTemplateUrl(catalog.templateLink || item.templateLink);

  const normalized = {
    id: `${templateId}-${templateNo}` || `template-${index}`,
    templateId,
    templateNo,
    templateType,
    templateName: displayName,
    title: displayName,
    subtitle,
    category,
    url,
    domainUrl,
    templateLink,
    description: catalog.description,
    thumbnail: resolveThumbnail(item, templateData),
    icon: item.icon || null,
    gradient: resolveGradient(category),
    templateData,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    _raw: item,
  };

  return finalizeNormalizedTemplate(item, normalized, displayName);
}

export function normalizeTemplatesList(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return dedupeTemplateItems(items)
    .map((item, index) => normalizeTemplateItem(item, index))
    .filter(Boolean);
}

export function findTemplate(templatesList, templateId, templateNo) {
  if (!Array.isArray(templatesList) || !templateId) {
    return null;
  }

  const normalizedId = String(templateId).trim();
  const normalizedNo = templateNo !== undefined && templateNo !== null
    ? String(templateNo).trim()
    : "";

  return (
    templatesList.find((template) => {
      const matchesId = String(template.templateId).trim() === normalizedId;
      if (!normalizedNo) {
        return matchesId;
      }
      return matchesId && String(template.templateNo).trim() === normalizedNo;
    }) || null
  );
}

export function resolveSiteTemplate(templatesList, siteRecord) {
  if (!Array.isArray(templatesList) || !siteRecord) {
    return null;
  }

  const templateId = String(siteRecord.templateId || siteRecord.template || "").trim();
  const templateNo = String(siteRecord.templateNo ?? "").trim();
  const templateType = String(
    siteRecord.templateType || siteRecord.templatetype || "",
  ).trim();
  const templateUrl = normalizeTemplateUrl(
    siteRecord.templateUrl || siteRecord.url || siteRecord.domainUrl || "",
  );

  const exactMatch = findTemplate(templatesList, templateId, templateNo);
  if (exactMatch) {
    return exactMatch;
  }

  if (templateId) {
    const idMatch = findTemplate(templatesList, templateId);
    if (idMatch) {
      return idMatch;
    }
  }

  if (templateType && templateNo) {
    const typeMatch = templatesList.find(
      (template) =>
        String(template.templateType || "").trim().toLowerCase() === templateType.toLowerCase() &&
        String(template.templateNo).trim() === templateNo,
    );
    if (typeMatch) {
      return typeMatch;
    }
  }

  if (templateUrl) {
    const urlMatch = templatesList.find((template) => {
      const candidates = [
        template.templateLink,
        template.domainUrl,
        template.url,
      ];
      return candidates.some(
        (candidate) => normalizeTemplateUrl(candidate) === templateUrl,
      );
    });
    if (urlMatch) {
      return urlMatch;
    }
  }

  return null;
}

export function extractTemplateContent(template) {
  if (!template) {
    return {};
  }

  if (template.templateData && typeof template.templateData === "object") {
    return template.templateData;
  }

  const raw = template._raw || template;
  const content = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (!TEMPLATE_METADATA_KEYS.includes(key)) {
      content[key] = value;
    }
  });

  return content;
}

export function getTemplateEditFormValues(template) {
  if (!template) {
    return {
      templateName: "",
      description: "",
      templateLink: "",
      category: "",
      thumbnail: "",
      icon: "",
    };
  }

  const source = template._raw || template;
  const catalog = extractCatalogFields(source);
  const templateData = extractTemplateContent(template);
  const templateType =
    template.templateType ||
    source.templateType ||
    source.templatetype ||
    "";
  const category =
    template.category ||
    catalog.category ||
    source.category ||
    resolveCategory(source.templateId, templateType);

  const templateName =
    template.templateName ||
    template.title ||
    catalog.templateName ||
    catalog.title ||
    source.templateName ||
    source.title ||
    resolveDisplayName(source, templateData, category, templateType) ||
    "";

  const description =
    template.description ||
    catalog.description ||
    source.description ||
    template.subtitle ||
    "";

  const templateLink =
    template.templateLink ||
    template.domainUrl ||
    template.url ||
    catalog.templateLink ||
    catalog.domainUrl ||
    source.templateLink ||
    source.domainUrl ||
    source.url ||
    resolveUrl(source) ||
    "";

  const thumbnail = normalizeThumbnailUrl(
    template.thumbnail ||
    catalog.thumbnail ||
    source.thumbnail ||
    "",
  );

  const iconValue = template.icon || source.icon || "";
  const icon =
    typeof iconValue === "string"
      ? iconValue
      : typeof iconValue === "object" && iconValue !== null
        ? ensureString(iconValue.url || iconValue.src || iconValue.href)
        : "";

  return {
    templateName: ensureString(templateName),
    description: ensureString(description),
    templateLink: ensureString(templateLink),
    category: ensureString(category),
    thumbnail,
    icon: ensureString(icon),
  };
}

export function parseGetSiteResponse(res) {
  if (!res || typeof res !== "object") {
    return { site: null, siteData: null };
  }

  const payload =
    res.data && typeof res.data === "object" && !Array.isArray(res.data)
      ? res.data
      : res;

  const site =
    payload.site ||
    res.site ||
    payload.item ||
    null;

  const siteData =
    payload.data ??
    payload.content ??
    payload.siteData ??
    null;

  return { site, siteData };
}

/**
 * Friendly site label for dashboard / builder — never exposes raw site IDs.
 */
export function resolveSiteDisplayName(site, templatesList = [], editedData = null) {
  const idSuffix = String(site?.siteId || "")
    .replace(/^site_/i, "")
    .trim();

  const stripId = (value) => {
    let name = ensureString(value);
    if (!name) return "";
    if (idSuffix) {
      name = name
        .replace(new RegExp(`(?:\\s*[_-]?${idSuffix})$`, "i"), "")
        .trim();
      if (name.toLowerCase() === idSuffix.toLowerCase()) return "";
    }
    if (/^site[_-]/i.test(name)) return "";
    if (isGenericTemplateLabel(name, site?.templateNo)) return "";
    return name;
  };

  const fromSite = stripId(site?.name);
  if (fromSite) return fromSite;

  const data =
    editedData && typeof editedData === "object" && !Array.isArray(editedData)
      ? editedData
      : null;

  const fromContent =
    resolveBrandName(data) || resolveTitleFromHero(getHeroEntry(data));
  if (fromContent) return fromContent;

  const tmpl = resolveSiteTemplate(
    Array.isArray(templatesList) ? templatesList : [],
    site || {},
  );
  if (tmpl) {
    const fromTemplate = stripId(tmpl.templateName || tmpl.title);
    if (fromTemplate) return fromTemplate;
  }

  const typeLabel = ensureString(
    site?.templateType || site?.templatetype || tmpl?.templateType || "",
  )
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  if (typeLabel && !isGenericTemplateLabel(typeLabel, site?.templateNo)) {
    return typeLabel;
  }

  if (tmpl?.category) return ensureString(tmpl.category);

  return "My site";
}

export function getTemplateSectionIgnoreKeys() {
  return [...TEMPLATE_METADATA_KEYS];
}

export const TEMPLATE_CATEGORY_OPTIONS = Object.keys(CATEGORY_GRADIENT);
