/**
 * Helpers for the shared Tekkzy site schema:
 * { site, navigation, pages[{ sections[] }], footer }
 */

export function isCommonSchema(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return Array.isArray(data.pages);
}

/**
 * Guarantee site.contact + contactMail exist so every template shows editable
 * Site contact fields in the builder sidebar (not only in the preview).
 */
export function ensureSiteContactShape(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      site: {
        contact: { email: '', phone: '', address: '' },
        contactMail: '',
      },
    };
  }

  const next = { ...data };
  const site = {
    ...(next.site && typeof next.site === 'object' && !Array.isArray(next.site)
      ? next.site
      : {}),
  };
  const contact = {
    ...(site.contact && typeof site.contact === 'object' && !Array.isArray(site.contact)
      ? site.contact
      : {}),
  };

  const asString = (value) =>
    value == null || value === false ? '' : String(value);

  contact.email = asString(contact.email);
  contact.phone = asString(contact.phone);
  contact.address = asString(contact.address);

  const inbox = asString(site.contactMail) || contact.email || asString(next.contactMail);
  site.contact = contact;
  site.contactMail = inbox;
  next.site = site;
  return ensureFooterEditorShape(next);
}

const defaultSalonExploreLinks = () => [
  { id: 'ft-explore-home', label: 'Home', href: '#home', url: '#home' },
  { id: 'ft-explore-about', label: 'About Us', href: '#about', url: '#about' },
  { id: 'ft-explore-services', label: 'Services', href: '#services', url: '#services' },
  { id: 'ft-explore-gallery', label: 'Gallery', href: '#gallery', url: '#gallery' },
  { id: 'ft-explore-experts', label: 'Our Experts', href: '#experts', url: '#experts' },
  {
    id: 'ft-explore-testimonials',
    label: 'Testimonials',
    href: '#testimonials',
    url: '#testimonials',
  },
  { id: 'ft-explore-blog', label: 'Blog', href: '#blog', url: '#blog' },
  { id: 'ft-explore-contact', label: 'Contact Us', href: '#contact', url: '#contact' },
];

const defaultSalonServiceLinks = () => [
  { id: 'ft-svc-hair', label: 'Hair Care', href: '#services', url: '#services' },
  { id: 'ft-svc-skin', label: 'Skin Care', href: '#services', url: '#services' },
  { id: 'ft-svc-makeup', label: 'Makeup Studio', href: '#services', url: '#services' },
  { id: 'ft-svc-nails', label: 'Nail Bar', href: '#services', url: '#services' },
  { id: 'ft-svc-bridal', label: 'Bridal Services', href: '#services', url: '#services' },
  { id: 'ft-svc-spa', label: 'Spa & Relaxation', href: '#services', url: '#services' },
  { id: 'ft-svc-packages', label: 'Packages & Offers', href: '#services', url: '#services' },
];

const defaultSalonQuickLinks = () => [
  { id: 'ft-quick-book', label: 'Book Appointment', href: '#contact', url: '#contact' },
  { id: 'ft-quick-gifts', label: 'Gift Cards', href: '#contact', url: '#contact' },
  { id: 'ft-quick-member', label: 'Membership', href: '#contact', url: '#contact' },
  { id: 'ft-quick-faq', label: 'FAQs', href: '#faq', url: '#faq' },
  { id: 'ft-quick-cancel', label: 'Cancellation Policy', href: '#faq', url: '#faq' },
  { id: 'ft-quick-privacy', label: 'Privacy Policy', href: '#', url: '#' },
  { id: 'ft-quick-terms', label: 'Terms & Conditions', href: '#', url: '#' },
];

const defaultCommonFooterColumns = () => [
  {
    id: 'ft-col-explore',
    title: 'Explore',
    links: defaultSalonExploreLinks(),
  },
  {
    id: 'ft-col-services',
    title: 'Our Services',
    links: defaultSalonServiceLinks(),
  },
  {
    id: 'ft-col-quick',
    title: 'Quick Links',
    links: defaultSalonQuickLinks(),
  },
];

/** Wedding / thank-you invitation footers (not multi-column link footers). */
export function isThankYouFooter(footer) {
  if (!footer || typeof footer !== 'object' || Array.isArray(footer)) return false;
  return !!(footer.thankYouHeading || footer.thankYouBody);
}

export function isWeddingTemplate(data) {
  if (!data || typeof data !== 'object') return false;
  return /wedding/i.test(
    String(data.template?.id || data.template?.name || data.institutionId || ''),
  );
}

/**
 * Guarantee footer link fields exist so the sidebar always has editable controls.
 * Salon002 (flat hero/services) uses exploreLinks / serviceLinks / quickLinks.
 * Common-schema templates use footer.columns[].links.
 * Wedding/thank-you footers only edit thank-you copy — never inject salon columns.
 */
export function ensureFooterEditorShape(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  if (!data.footer || typeof data.footer !== 'object' || Array.isArray(data.footer)) {
    return data;
  }

  const footer = { ...data.footer };
  let changed = false;

  // Invitation-style footers must not get business link columns (Explore / Services / Quick).
  if (isThankYouFooter(footer) || isWeddingTemplate(data)) {
    if (!changed) return data;
    return { ...data, footer };
  }

  const isFlatSalon =
    !!(data.hero || data.services || data.gallery || data.testimonials || data.faq) ||
    /salon002|tekkzy-salon|women/i.test(
      String(data.template?.id || data.template?.name || data.institutionId || ''),
    );

  const hasSalonLinkModel =
    footerArrayHasItems(footer.exploreLinks) ||
    footerArrayHasItems(footer.serviceLinks) ||
    footerArrayHasItems(footer.quickLinks);

  if (isFlatSalon || hasSalonLinkModel || footer.exploreTitle || footer.servicesTitle) {
    if (!footerArrayHasItems(footer.exploreLinks)) {
      footer.exploreLinks = defaultSalonExploreLinks();
      changed = true;
    }
    if (!footerArrayHasItems(footer.serviceLinks)) {
      footer.serviceLinks = defaultSalonServiceLinks();
      changed = true;
    }
    if (!footerArrayHasItems(footer.quickLinks)) {
      footer.quickLinks = defaultSalonQuickLinks();
      changed = true;
    }
    if (!footer.exploreTitle) {
      footer.exploreTitle = 'Explore';
      changed = true;
    }
    if (!footer.servicesTitle) {
      footer.servicesTitle = 'Our Services';
      changed = true;
    }
    if (!footer.quickLinksTitle) {
      footer.quickLinksTitle = 'Quick Links';
      changed = true;
    }
    if (!footer.contactTitle) {
      footer.contactTitle = 'Get In Touch';
      changed = true;
    }
    if (!footer.socialTitle) {
      footer.socialTitle = 'Follow Us';
      changed = true;
    }
  } else if (Array.isArray(data.pages) || Array.isArray(footer.columns)) {
    // Common-schema footer — empty columns[] were invisible in the editor.
    if (!footerArrayHasItems(footer.columns)) {
      footer.columns = defaultCommonFooterColumns();
      changed = true;
    } else {
      // Ensure each column has a links array (even empty → still editable after FieldRenderer fix)
      footer.columns = footer.columns.map((col, i) => {
        if (!col || typeof col !== 'object') return col;
        if (Array.isArray(col.links)) return col;
        changed = true;
        return { ...col, links: [] };
      });
    }
  }

  if (!Array.isArray(footer.socialLinks)) {
    footer.socialLinks = [];
    changed = true;
  }
  if (!Array.isArray(footer.legalLinks)) {
    footer.legalLinks = [];
    changed = true;
  }

  // Normalize dual href/url on known link arrays for smoother editing
  ['exploreLinks', 'serviceLinks', 'quickLinks', 'socialLinks', 'legalLinks'].forEach((key) => {
    if (!Array.isArray(footer[key])) return;
    footer[key] = footer[key].map((item, idx) => {
      if (!item || typeof item !== 'object') return item;
      const href = item.href || item.url || '#';
      const url = item.url || item.href || '#';
      if (item.href === href && item.url === url) return item;
      changed = true;
      return { ...item, href, url };
    });
  });

  if (!changed) return data;
  return { ...data, footer };
}

const footerGalleryHasImages = (gallery) =>
  Array.isArray(gallery?.images) && gallery.images.length > 0;

const footerArrayHasItems = (value) => Array.isArray(value) && value.length > 0;

/** Prefer non-empty saved array, else fall back to template (legacy saves omit new keys). */
const mergeFooterArray = (savedValue, templateValue) => {
  if (footerArrayHasItems(savedValue)) return savedValue;
  if (footerArrayHasItems(templateValue)) return templateValue;
  if (Array.isArray(savedValue)) return savedValue;
  if (Array.isArray(templateValue)) return templateValue;
  return savedValue ?? templateValue ?? [];
};

/**
 * Merge saved footer over template footer, but keep template gallery images
 * when the saved footer never had an editable gallery (legacy sites).
 * Also backfill link columns (explore/service/quick/social) missing on older saves.
 */
export function mergeFooterData(saved, template) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    return template && typeof template === 'object' ? template : saved || null;
  }
  if (!template || typeof template !== 'object' || Array.isArray(template)) {
    return saved;
  }

  return {
    ...template,
    ...saved,
    logo: saved.logo || template.logo,
    contact: {
      ...(template.contact && typeof template.contact === 'object' ? template.contact : {}),
      ...(saved.contact && typeof saved.contact === 'object' ? saved.contact : {}),
    },
    newsletter: {
      ...(template.newsletter && typeof template.newsletter === 'object'
        ? template.newsletter
        : {}),
      ...(saved.newsletter && typeof saved.newsletter === 'object' ? saved.newsletter : {}),
    },
    gallery: footerGalleryHasImages(saved.gallery)
      ? saved.gallery
      : footerGalleryHasImages(template.gallery)
        ? template.gallery
        : saved.gallery || template.gallery || null,
    // Link columns — always editable once present in the template data.json
    exploreLinks: mergeFooterArray(saved.exploreLinks, template.exploreLinks),
    serviceLinks: mergeFooterArray(saved.serviceLinks, template.serviceLinks),
    quickLinks: mergeFooterArray(saved.quickLinks, template.quickLinks),
    socialLinks: mergeFooterArray(saved.socialLinks, template.socialLinks),
    // Also accept common-schema style columns if present
    columns: mergeFooterArray(saved.columns, template.columns),
    links: mergeFooterArray(saved.links, template.links),
    // Titles / brand — fill blanks from template
    exploreTitle: saved.exploreTitle || template.exploreTitle,
    servicesTitle: saved.servicesTitle || template.servicesTitle,
    quickLinksTitle: saved.quickLinksTitle || template.quickLinksTitle,
    contactTitle: saved.contactTitle || template.contactTitle,
    socialTitle: saved.socialTitle || template.socialTitle,
    logoMain: saved.logoMain || template.logoMain,
    logoSub: saved.logoSub || template.logoSub,
    logoText: saved.logoText || template.logoText,
    description: saved.description || template.description,
    copyright: saved.copyright || template.copyright,
  };
}

/** True when footer is missing any of the salon-style editable link columns. */
export function footerMissingEditableLinks(footer) {
  if (!footer || typeof footer !== 'object' || Array.isArray(footer)) return true;
  // Wedding / thank-you footers intentionally have no link columns — not "missing".
  if (isThankYouFooter(footer)) return false;
  return !(
    footerArrayHasItems(footer.exploreLinks) ||
    footerArrayHasItems(footer.serviceLinks) ||
    footerArrayHasItems(footer.quickLinks) ||
    footerArrayHasItems(footer.columns) ||
    footerArrayHasItems(footer.links)
  );
}

/** Keys the wedding template actually reads (builder should only surface these). */
const WEDDING_EDITOR_FOOTER_KEYS = [
  'thankYouHeading',
  'thankYouBody',
  'tagline',
  'copyright',
];
const WEDDING_EDITOR_NAV_KEYS = ['items'];
const WEDDING_EDITOR_SITE_KEYS = ['name', 'description', 'loadingText'];
const WEDDING_EDITOR_HERO_KEYS = [
  'tagline',
  'inviteText',
  'andText',
  'scrollLabel',
  'saveTheDateLabel',
  'couple',
  'portrait',
  'weddingDateISO',
  'weddingDateFormatted',
  'venueShortName',
  'venueCity',
];

const pickKeys = (obj, keys) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  });
  return out;
};

/**
 * Drop unused / template-only keys so FieldRenderer doesn't show dead controls.
 * Writes still go to full paths; this only trims what the sidebar renders.
 */
export function filterEditorSectionPresentation(data, section, node) {
  if (!node || typeof node !== 'object' || Array.isArray(node) || !section) {
    return node;
  }

  const path0 = section.path?.[0];
  const wedding = isWeddingTemplate(data);

  if (path0 === 'footer' && (isThankYouFooter(node) || wedding)) {
    return pickKeys(node, WEDDING_EDITOR_FOOTER_KEYS);
  }

  if (!wedding) return node;

  if (path0 === 'navigation') {
    return pickKeys(node, WEDDING_EDITOR_NAV_KEYS);
  }

  if (path0 === 'site' && section.editorMode !== 'site-contact' && section.id !== 'site-contact') {
    return pickKeys(node, WEDDING_EDITOR_SITE_KEYS);
  }

  // Page section `content` for hero — hide audio / mandalaDecoration (not wired in live DOM).
  if (
    Array.isArray(section.path) &&
    section.path.includes('sections') &&
    (section.id === 'home-hero' || String(section.type || '').toLowerCase() === 'hero')
  ) {
    const hasHeroShape =
      node.couple != null || node.inviteText != null || node.weddingDateISO != null;
    if (hasHeroShape) return pickKeys(node, WEDDING_EDITOR_HERO_KEYS);
  }

  return node;
}

/** Always-visible sidebar entry for site email / phone / address / form inbox. */
export function getSiteContactEditorSection() {
  return {
    id: 'site-contact',
    label: 'Site contact',
    shortLabel: 'Site contact',
    group: 'Global',
    groupOrder: 0,
    path: ['site'],
    scrollId: null,
    scrollAliases: [],
    routeKey: null,
    kind: 'site',
    editorMode: 'site-contact',
  };
}

/** True when data has real page/content sections (not only Site contact/settings). */
export function hasContentEditorSections(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

  if (Array.isArray(data.pages)) {
    return data.pages.some(
      (page) => Array.isArray(page?.sections) && page.sections.length > 0,
    );
  }

  // Legacy flat schemas: any top-level content key besides site/meta.
  const ignore = new Set([
    'site',
    'schemaVersion',
    'template',
    'institutionId',
    'InstitutionId',
    'theme',
    'colors',
    'api',
    'contactMail',
    's3',
    'locale',
  ]);
  return Object.keys(data).some((key) => !ignore.has(key));
}

function humanize(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getAtPath(obj, path = []) {
  let current = obj;
  for (const key of path) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

/** "Section 3 - Meet Our Team" → "Meet Our Team" */
export function cleanSectionLabel(label, fallbackIndex = 0) {
  const raw = String(label || '').trim();
  const stripped = raw.replace(/^section\s*\d+\s*[-–—:.]?\s*/i, '').trim();
  if (stripped) return stripped;
  return raw || `Section ${fallbackIndex + 1}`;
}

function kebabToCamel(value) {
  return String(value || '').replace(/-([a-z])/gi, (_, c) => c.toUpperCase());
}

/**
 * Template SCROLL_SECTION maps only a few route keys (aboutPage, contactPage, …).
 * Unknown keys fall through to "/" — so subsection ids like "mission" must NOT be
 * sent as the navigation key. We return a DOM element id + a separate routeKey.
 */

export function normalizePageSlug(pageSlug = '/') {
  const raw = String(pageSlug || '/').trim() || '/';
  if (raw === '/') return '/';
  return raw.startsWith('/')
    ? raw.replace(/\/+$/, '') || '/'
    : `/${raw.replace(/\/+$/, '')}`;
}

export function resolveRouteKey(pageSlug = '/') {
  const normalized = normalizePageSlug(pageSlug);
  if (normalized === '/') return null;
  // Any non-home page can soft-navigate by its slug key (about, studio, projects, …).
  return normalized.replace(/^\//, '') || null;
}

/** Keys that exist in typical template SCROLL_SECTION route maps. */
export const SAFE_TEMPLATE_SCROLL_KEYS = new Set([
  'navbar',
  'hero',
  'excellence',
  'expertise',
  'lasikSection',
  'specialists',
  'stats',
  'testimonials',
  'technology',
  'aboutPage',
  'services',
  'contactPage',
  'doctors',
  'projects',
  'studio',
]);

/**
 * Infer page slug from section id / aliases / group label when pageSlug is missing or wrong.
 * Prevents posting "mission" as a home scroll key (which routes to "/").
 */
export function inferPageSlug(section = {}) {
  const fromProp = normalizePageSlug(section.pageSlug || section.page || '/');
  if (fromProp !== '/') return fromProp;

  if (section.routeKey === 'aboutPage') return '/about';
  if (section.routeKey === 'contactPage') return '/contact';
  if (section.routeKey === 'services') return '/services';
  if (section.routeKey === 'doctors') return '/doctors';
  if (section.routeKey === 'projects') return '/projects';
  if (section.routeKey === 'studio') return '/studio';

  // Sidebar page tab label — most reliable signal when selecting About/Contact.
  const group = String(section.group || '').toLowerCase();
  if (/\babout\b/.test(group)) return '/about';
  if (/\bcontact\b/.test(group)) return '/contact';
  if (/\bservices?\b/.test(group)) return '/services';
  if (/\bdoctors?\b/.test(group)) return '/doctors';
  if (/\bstudio\b/.test(group)) return '/studio';
  if (/\bprojects?\b/.test(group)) return '/projects';
  if (/\bhome\b/.test(group) || group === 'content') return '/';

  const id = String(section.id || section.scrollId || section.section || '').toLowerCase();
  const aliases = Array.isArray(section.scrollAliases)
    ? section.scrollAliases
    : Array.isArray(section.aliases)
      ? section.aliases
      : [];
  const blob = [id, ...aliases].join(' ').toLowerCase();

  if (/^home-/.test(id)) return '/';
  if (
    /^about-/.test(id) ||
    id === 'mission' ||
    id === 'leadership' ||
    id === 'aboutpage' ||
    /\b(mission|leadership|about-hero|about-stats|aboutpage)\b/.test(blob)
  ) {
    return '/about';
  }
  if (/^contact-/.test(id) || id === 'contact' || id === 'contactpage' || /\bcontact\b/.test(blob)) {
    return '/contact';
  }
  if (/^services-/.test(id) || /\bservices\b/.test(blob)) return '/services';
  if (/^doctors-/.test(id) || /\bdoctors\b/.test(blob)) return '/doctors';
  if (/^studio-/.test(id) || /\bstudio\b/.test(blob)) return '/studio';
  if (/^projects?-/.test(id) || /\bprojects?\b/.test(blob)) return '/projects';

  // Generic "pagename-section" ids (studio-hero, projects-cta, …) → /pagename
  const prefixed = id.match(/^([a-z][a-z0-9]*)-(.+)$/);
  if (
    prefixed &&
    !['home', 'page', 'section', 'main', 'nav', 'footer', 'site'].includes(prefixed[1])
  ) {
    return `/${prefixed[1]}`;
  }

  return '/';
}

/**
 * Templates scroll with getElementById(section) using short keys like
 * "hero" / "specialists" / "mission" — not always schema ids like "home-hero".
 */
const PAGE_ROUTE_SCROLL_KEYS = new Set([
  'studio',
  'services',
  'projects',
  'about',
  'contact',
  'doctors',
]);

export function deriveScrollTargets({ id, type, pageSlug, label, shortLabel } = {}) {
  const targets = [];
  const push = (value) => {
    const v = String(value || '').trim();
    if (v && !targets.includes(v)) targets.push(v);
  };

  const rawId = String(id || '').trim();
  const labelBlob = `${shortLabel || ''} ${label || ''}`.trim();
  const stripped = rawId.replace(
    /^(home|about|services|service|contact|page|studio|projects|project)-/i,
    '',
  );
  let slug = normalizePageSlug(pageSlug || '/');

  // Recover About/Contact even when page.slug was missing in saved site data.
  if (slug === '/') {
    slug = inferPageSlug({ id: rawId, pageSlug: slug });
  }

  // Non-home pages: always keep the real schema/DOM id first.
  if (slug !== '/' && rawId) {
    push(rawId);
  }

  // About page DOM ids (eye-clinic + enterprise/furniture + resort)
  if (slug === '/about') {
    // Prefer the real schema/DOM id first (about-story, about-drives, …)
    if (rawId) push(rawId);
    const aboutBlob = `${rawId} ${labelBlob}`;
    if (/hero/i.test(aboutBlob)) {
      push('about-hero');
      push('aboutHero');
    }
    if (/know|story/i.test(aboutBlob)) {
      push('about-know-about-us');
      push('knowAboutUs');
      push('about-story');
    }
    if (/provide|drive/i.test(aboutBlob)) {
      push('about-we-provide');
      push('weProvide');
      push('about-drives');
    }
    if (/visionar|team/i.test(aboutBlob)) {
      push('about-visionaries');
      push('visionaries');
      push('about-drives');
      push('leadership');
      push('specialists');
    }
    if (/mission|value/i.test(aboutBlob)) push('mission');
    if (/leader/i.test(aboutBlob)) push('leadership');
    if (/stat/i.test(aboutBlob)) push('about-stats');
    if (/cta/i.test(aboutBlob)) {
      push('aboutPage');
      push('about');
    }
  }

  // Contact page: resort renders form + map + socials inside #contactForm
  if (slug === '/contact') {
    if (rawId) push(rawId);
    const contactBlob = `${rawId} ${labelBlob}`;
    if (/social/i.test(contactBlob)) {
      push('contact-social-media');
      push('contactForm');
    }
    if (/map|visit|office/i.test(contactBlob)) {
      push('contact-map');
      push('visitOffices');
      push('contactForm');
    }
    if (/form|cta/i.test(contactBlob) || /contact-form/i.test(rawId)) {
      push('contact-form');
      push('contactForm');
    }
    push('contactForm');
    if (/cta/i.test(rawId)) push('contactPage');
    else push('contact');
    push('contactPage');
  }

  // High-confidence hardcoded ids used across Tekkzy templates (home + shared)
  if (/lasik/i.test(rawId)) push('lasikSection');
  if (/specialist|team/i.test(rawId)) {
    push('specialists');
    push('team');
  }
  if (/testimonial/i.test(rawId)) push('testimonials');
  if (/technolog/i.test(rawId)) push('technology');
  if (/stat/i.test(rawId) && slug === '/') push('stats');
  if (/faq/i.test(rawId) && slug === '/') push('faq');
  if ((/hero/i.test(rawId) || /hero/i.test(type)) && slug === '/') push('hero');
  if (/events?|wedding|booking/i.test(rawId) && slug === '/') {
    push('booking');
    push('home-events-weddings');
  }
  if (/customer.?voice|testimonial/i.test(rawId) && slug === '/') {
    push('customerVoices');
  }  if (/nav|header/i.test(rawId)) {
    push('navbar');
    push('navigation');
    push('header');
  }
  if (/footer/i.test(rawId)) push('footer');
  if (/excellence/i.test(rawId)) push('excellence');
  if (/expertise/i.test(rawId)) push('expertise');
  // Never push mission/leadership as home keys — templates map unknown → "/"
  if (/product/i.test(rawId)) push('products');
  if (/categor/i.test(rawId)) push('categories');
  if (/feature/i.test(rawId) && !/lasik/i.test(rawId) && slug === '/') push('features');
  if (/offer/i.test(rawId)) push('offer');
  if (/variety/i.test(rawId)) push('variety');
  if (/visit/i.test(rawId) && slug === '/') push('visitUs');
  if (/monarch/i.test(rawId)) push('monarchStyle');
  // home-services must not claim the /services route key
  if (/service/i.test(rawId) && slug === '/') {
    if (rawId) push(rawId);
  }

  // Simple stripped token (hero, specialists) — best match for home sections.
  // Never use bare page route keys (studio/services/…) as home aliases — those
  // collide with Studio/Services page navigation and sidebar matching.
  if (stripped && !stripped.includes('-') && slug === '/') {
    if (!['mission', 'leadership', 'contact'].includes(stripped)) {
      if (PAGE_ROUTE_SCROLL_KEYS.has(stripped.toLowerCase())) {
        if (rawId) push(rawId);
      } else {
        push(stripped);
      }
    }
  }

  const camel = kebabToCamel(stripped);
  if (camel && camel !== stripped && slug === '/') {
    if (!PAGE_ROUTE_SCROLL_KEYS.has(String(stripped).toLowerCase())) {
      push(camel);
    }
  }

  if (slug === '/') {
    push(type);
    push(kebabToCamel(type));
  }

  if (slug === '/about') push('aboutPage');
  else if (slug === '/services') push('services');
  else if (slug === '/contact') push('contactPage');
  else if (slug === '/doctors') push('doctors');
  else if (slug === '/studio') push('studio');
  else if (slug === '/projects') push('projects');
  else if (slug !== '/') push(slug.replace(/^\//, ''));

  return targets;
}

/** Prefer DOM/hash ids templates actually scroll to (not bare route keys). */
const ABOUT_ELEMENT_KEYS = new Set([
  'about-hero',
  'about-story',
  'about-drives',
  'about-know-about-us',
  'about-we-provide',
  'about-visionaries',
  'aboutHero',
  'knowAboutUs',
  'weProvide',
  'visionaries',
  'mission',
  'leadership',
  'about-stats',
]);
const CONTACT_ELEMENT_KEYS = new Set([
  'contact-form',
  'contactForm',
  'contact-info',
  'contact-visit',
  'contact-cta',
  'contact-social-media',
  'contact-map',
  'visitOffices',
  'contact',
]);

/** Pick scroll targets for a sidebar entry: element id + SPA route key. */
export function resolveScrollMessage(section = {}) {
  const pageSlug = inferPageSlug(section);
  const aliases =
    Array.isArray(section.scrollAliases) && section.scrollAliases.length > 0
      ? section.scrollAliases
      : deriveScrollTargets({
          ...section,
          pageSlug,
          label: section.label,
          shortLabel: section.shortLabel,
        });

  const routeKey = section.routeKey || resolveRouteKey(pageSlug);
  const elementKeys =
    pageSlug === '/about'
      ? ABOUT_ELEMENT_KEYS
      : pageSlug === '/contact'
        ? CONTACT_ELEMENT_KEYS
        : null;

  // Prefer a real subsection DOM id over route-only keys like "about".
  const fromAliases =
    (elementKeys && aliases.find((a) => elementKeys.has(a))) ||
    aliases.find((a) => a && a !== routeKey && a !== 'aboutPage' && a !== 'contactPage') ||
    aliases[0];

  const primary =
    (elementKeys && elementKeys.has(section.scrollId) && section.scrollId) ||
    (elementKeys && elementKeys.has(section.id) && section.id) ||
    fromAliases ||
    section.scrollId ||
    section.id ||
    routeKey ||
    null;

  if (!primary && !routeKey) return null;

  return {
    section: primary || routeKey,
    routeKey: routeKey || null,
    page: pageSlug,
    group: section.group || null,
    aliases: aliases.length > 0 ? aliases : [primary || routeKey],
  };
}

/**
 * Build ordered editor tabs from the common schema.
 * Each entry has a stable id, display label, group, and path into editedData.
 * Disabled sections stay listed so they can be re-enabled.
 */
export function getCommonEditorSections(data) {
  if (!isCommonSchema(data)) return [];

  const sections = [];
  // Always first — contact inbox / phone / address for every common-schema site.
  sections.push(getSiteContactEditorSection());

  if (data.site && typeof data.site === 'object') {
    sections.push({
      id: 'site',
      label: 'Site settings',
      shortLabel: 'Site settings',
      group: 'Global',
      groupOrder: 0,
      path: ['site'],
      scrollId: null,
      scrollAliases: [],
      routeKey: null,
      kind: 'site',
    });
  }

  if (data.navigation && typeof data.navigation === 'object') {
    sections.push({
      id: 'navigation',
      label: data.navigation.editorLabel || 'Navigation',
      shortLabel: 'Navigation',
      group: 'Global',
      groupOrder: 0,
      path: ['navigation'],
      scrollId: data.navigation.id || 'navigation',
      scrollAliases: ['navigation', 'navbar', 'nav', 'header'],
      routeKey: null,
    });
  }

  const wedding = isWeddingTemplate(data);

  (data.pages || []).forEach((page, pageIndex) => {
    if (!page || page.enabled === false) return;

    const pageLabel =
      page.editorLabel || page.title || humanize(page.slug) || `Page ${pageIndex + 1}`;
    const pageSlug = normalizePageSlug(
      page.slug ||
        inferPageSlug({ id: page.sections?.[0]?.id, pageSlug: page.slug }) ||
        '/',
    );
    const routeKey = resolveRouteKey(pageSlug);

    (page.sections || []).forEach((section, sectionIndex) => {
      if (!section) return;

      // Wedding live template has no dedicated map section (venue embed is enough).
      const secId = String(section.id || '').toLowerCase();
      const secType = String(section.type || '').toLowerCase();
      if (wedding && (secId === 'home-map' || secType === 'map')) {
        return;
      }

      const rawLabel =
        section.editorLabel ||
        humanize(section.type) ||
        `Section ${sectionIndex + 1}`;
      const shortLabel = cleanSectionLabel(rawLabel, sectionIndex);
      const scrollAliases = deriveScrollTargets({
        id: section.id,
        type: section.type,
        pageSlug,
        label: rawLabel,
        shortLabel,
      });
      // Prefer schema/DOM subsection ids on non-home pages (about-story, …).
      const scrollId =
        (pageSlug !== '/' && section.id) ||
        scrollAliases.find((a) => a && a !== routeKey) ||
        scrollAliases[0] ||
        section.id ||
        section.type ||
        null;

      sections.push({
        id: section.id || `page-${pageIndex}-section-${sectionIndex}`,
        label: rawLabel,
        shortLabel,
        index: sectionIndex + 1,
        group: pageLabel,
        groupOrder: pageIndex + 1,
        path: ['pages', pageIndex, 'sections', sectionIndex],
        scrollId,
        scrollAliases,
        routeKey,
        pageSlug,
        sectionEnabled: section.enabled !== false,
        type: section.type || null,
      });
    });
  });

  if (data.footer && typeof data.footer === 'object') {
    sections.push({
      id: 'footer',
      label: 'Footer',
      shortLabel: 'Footer',
      group: 'Footer',
      groupOrder: 999,
      path: ['footer'],
      scrollId: 'footer',
      scrollAliases: ['footer'],
      routeKey: null,
    });
  }

  return sections;
}

/**
 * Resolve the object the sidebar should edit for a section entry.
 * Prefers `content` for page sections so technical settings stay out of the way.
 */
export function resolveEditorSectionData(data, section) {
  if (!section?.path) return null;

  const node = getAtPath(data, section.path);
  if (!node || typeof node !== 'object') return null;

  // Page sections: edit content (+ keep enabled if present)
  if (
    Array.isArray(section.path) &&
    section.path.includes('sections') &&
    node.content &&
    typeof node.content === 'object'
  ) {
    const content = filterEditorSectionPresentation(data, section, node.content);
    return {
      data: content,
      path: [...section.path, 'content'],
      enabledPath: typeof node.enabled === 'boolean' ? [...section.path, 'enabled'] : null,
    };
  }

  return {
    data: filterEditorSectionPresentation(data, section, node),
    path: section.path,
    enabledPath: null,
  };
}

/** Pull distinctive strings from a section so the preview bridge can find DOM nodes without ids. */
export function collectSectionMatchTexts(data, section) {
  const texts = [];
  const push = (value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (trimmed.length < 4) return;
    texts.push(trimmed.slice(0, 140));
  };

  if (!section) return texts;
  push(section.shortLabel);
  push(section.label);
  push(section.id);
  push(section.scrollId);

  const resolved = resolveEditorSectionData(data, section);
  const content = resolved?.data;
  if (!content || typeof content !== 'object') {
    return [...new Set(texts)].slice(0, 10);
  }

  const preferKeys = [
    'title',
    'eyebrow',
    'subtitle',
    'headline',
    'tagline',
    'description',
    'label',
    'name',
    'signature',
    'quote',
  ];

  preferKeys.forEach((key) => {
    const value = content[key];
    if (typeof value === 'string') push(value);
    else if (value && typeof value === 'object') {
      push(value.line1);
      push(value.line2);
      push(value.text);
    }
  });

  if (Array.isArray(content.body)) {
    content.body.slice(0, 2).forEach((item) => {
      if (typeof item === 'string') push(item);
      else if (item && typeof item === 'object') push(item.text);
    });
  }

  if (Array.isArray(content.header)) {
    // no-op
  } else if (content.header && typeof content.header === 'object') {
    push(content.header.title);
    push(content.header.label);
    push(content.header.description);
  }

  if (content.featured && typeof content.featured === 'object') {
    push(content.featured.title);
    push(content.featured.eyebrow);
    push(content.featured.description);
  }

  return [...new Set(texts)].slice(0, 10);
}

export { getAtPath, humanize };
