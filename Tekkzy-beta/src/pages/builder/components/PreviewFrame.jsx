import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** iPhone 12 Pro logical CSS viewport */
const IPHONE_12_PRO = { width: 390, height: 844 };

/**
 * Live preview iframe that pushes editor data into the template via postMessage.
 * Templates listen for UPDATE_INSTITUTION_DATA and reply with UPDATE_SUCCESS.
 *
 * Resort (and similar) templates fetch /data.json after load and can overwrite
 * parent data — we merge against defaults and keep a sync heartbeat.
 */

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasPayload = (data) =>
  Boolean(data && typeof data === 'object' && Object.keys(data).length > 0);

/** Deep-merge plain objects; arrays are handled by callers when needed. */
const deepMergeObjects = (base, overlay) => {
  if (!isPlainObject(overlay)) return overlay;
  const output = { ...(isPlainObject(base) ? base : {}) };
  Object.keys(overlay).forEach((key) => {
    const value = overlay[key];
    if (isPlainObject(value)) {
      output[key] = deepMergeObjects(output[key], value);
      return;
    }
    // Never let empty/null wipe an existing media URL, text, or media object.
    if (value === '' || value === null || value === undefined) {
      const existing = output[key];
      if (typeof existing === 'string' && existing.trim()) return;
      if (isPlainObject(existing) && Object.keys(existing).length > 0) return;
    }
    output[key] = value;
  });
  return output;
};

/** Merge page sections by id so partial editor payloads don't wipe media. */
const mergeSections = (baseSections, overlaySections) => {
  // Missing/empty overlay means "no section edits" — keep template defaults.
  // (Default params would turn undefined into [] and wipe every section.)
  if (!Array.isArray(overlaySections) || overlaySections.length === 0) {
    return Array.isArray(baseSections) ? baseSections : [];
  }
  if (!Array.isArray(baseSections) || baseSections.length === 0) return overlaySections;

  return overlaySections.map((overlay, index) => {
    if (!isPlainObject(overlay)) return overlay;
    const base =
      (overlay.id && baseSections.find((s) => s && s.id === overlay.id)) ||
      baseSections[index] ||
      null;
    if (!isPlainObject(base)) return overlay;
    return deepMergeObjects(base, overlay);
  });
};

const mergePages = (basePages, overlayPages) => {
  // Legacy flat site data has no pages[] — keep the template's own pages so
  // the preview never renders an empty shell (nothing to highlight/click).
  if (!Array.isArray(overlayPages) || overlayPages.length === 0) {
    return Array.isArray(basePages) ? basePages : [];
  }
  if (!Array.isArray(basePages) || basePages.length === 0) return overlayPages;

  return overlayPages.map((overlay, index) => {
    if (!isPlainObject(overlay)) return overlay;
    const base =
      (overlay.slug != null &&
        basePages.find((p) => p && String(p.slug) === String(overlay.slug))) ||
      basePages[index] ||
      null;
    if (!isPlainObject(base)) return overlay;
    return {
      ...deepMergeObjects(base, { ...overlay, sections: undefined }),
      sections: mergeSections(base.sections, overlay.sections),
    };
  });
};

/**
 * Merge template defaults with editor data. Replacing `pages` wholesale drops
 * media when the saved site payload is partial — merge section-by-section instead.
 */
const mergeSiteData = (base, overlay) => {
  if (!hasPayload(overlay)) return base;
  if (!hasPayload(base)) return overlay;

  const merged = deepMergeObjects(base, { ...overlay, pages: undefined, navigation: undefined });

  if (overlay.navigation || base.navigation) {
    merged.navigation = deepMergeObjects(base.navigation, overlay.navigation);
  }
  if (overlay.footer || base.footer) {
    merged.footer = deepMergeObjects(base.footer, overlay.footer);
  }
  if (Array.isArray(overlay.pages) || Array.isArray(base.pages)) {
    merged.pages = mergePages(base.pages, overlay.pages);
  }
  return merged;
};

/**
 * Legacy flat site data (hero/stay/gallery/… as top-level keys) never touches
 * the common-schema pages[] the template renders from — typed edits were
 * invisible in the preview and field highlight had no text to match. Overlay
 * flat section objects onto the matching pages[] section content.
 */
const overlayLegacyFlatData = (payload, flat) => {
  if (
    !isPlainObject(flat) ||
    Array.isArray(flat.pages) ||
    !isPlainObject(payload) ||
    !Array.isArray(payload.pages)
  ) {
    return payload;
  }

  const camel = (s) => String(s).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const flatKeyFor = (id = '') => {
    const raw = String(id || '');
    const stripped = raw.replace(/^(home|about|contact)-/, '');
    const candidates = [raw, camel(raw), stripped, camel(stripped)];
    if (raw === 'home-events-weddings') candidates.push('booking');
    if (raw === 'home-customer-voices') candidates.push('customerVoices');
    if (raw === 'navigation') candidates.push('navbar');
    return candidates.find((key) => isPlainObject(flat[key]));
  };

  const next = { ...payload };
  if (isPlainObject(flat.navbar)) {
    next.navigation = deepMergeObjects(next.navigation, flat.navbar);
  }

  // Flat about.knowAboutUs / about.weProvide / about.visionaries → pages[/about]
  if (isPlainObject(flat.about)) {
    next.pages = next.pages.map((page) => {
      if (!isPlainObject(page) || String(page.slug) !== '/about' || !Array.isArray(page.sections)) {
        return page;
      }
      const about = flat.about;
      return {
        ...page,
        sections: page.sections.map((section) => {
          if (!isPlainObject(section)) return section;
          const id = String(section.id || '');
          let overlay = null;
          if (id === 'about-hero' || section.type === 'hero') {
            overlay = {
              title: about.title,
              subtitle: about.subtitle,
              description: about.description,
              breadcrumb: about.breadcrumb,
              media: about.media,
            };
          } else if (id === 'about-know-about-us' || section.type === 'content') {
            const src = about.knowAboutUs;
            if (!isPlainObject(src)) return section;
            overlay = {
              ...src,
              body: Array.isArray(src.body)
                ? src.body
                : Array.isArray(src.paragraphs)
                  ? src.paragraphs.map((text, i) =>
                      typeof text === 'string'
                        ? { id: `about-paragraph-${i + 1}`, type: 'paragraph', text }
                        : text,
                    )
                  : undefined,
            };
          } else if (id === 'about-we-provide' || section.type === 'feature-grid') {
            const src = about.weProvide;
            if (!isPlainObject(src)) return section;
            overlay = {
              ...src,
              items: Array.isArray(src.items) ? src.items : src.services,
            };
          } else if (id === 'about-visionaries' || section.type === 'team') {
            const src = about.visionaries;
            if (!isPlainObject(src)) return section;
            overlay = {
              ...src,
              items: Array.isArray(src.items)
                ? src.items
                : Array.isArray(src.team)
                  ? src.team.map((m, i) => ({
                      id: m.id || `team-${i}`,
                      name: m.name,
                      role: m.role,
                      image:
                        typeof m.image === 'string'
                          ? { src: m.image, alt: m.name || '', fit: 'cover', focalPoint: { x: 50, y: 50 } }
                          : m.image,
                      links: m.links || [],
                    }))
                  : undefined,
            };
          }
          if (!overlay) return section;
          return { ...section, content: deepMergeObjects(section.content, overlay) };
        }),
      };
    });
  }

  next.pages = next.pages.map((page) => {
    if (!isPlainObject(page) || !Array.isArray(page.sections)) return page;
    return {
      ...page,
      sections: page.sections.map((section) => {
        if (!isPlainObject(section)) return section;
        const key = flatKeyFor(section.id);
        if (!key) return section;
        return { ...section, content: deepMergeObjects(section.content, flat[key]) };
      }),
    };
  });
  return next;
};

/**
 * Resort (and similar) templates also read flat about.knowAboutUs / weProvide /
 * visionaries. Mirror pages[/about] sections into that shape so builder edits
 * to common-schema sections still update the live preview.
 */
const syncAboutFlatFromPages = (payload) => {
  if (!isPlainObject(payload) || !Array.isArray(payload.pages)) return payload;
  const aboutPage = payload.pages.find((p) => p && String(p.slug) === '/about');
  if (!aboutPage || !Array.isArray(aboutPage.sections)) return payload;

  const byId = (id) => aboutPage.sections.find((s) => s && s.id === id);
  const hero = byId('about-hero')?.content || {};
  const know = byId('about-know-about-us')?.content || {};
  const provide = byId('about-we-provide')?.content || {};
  const vision = byId('about-visionaries')?.content || {};

  const about = {
    ...(isPlainObject(payload.about) ? payload.about : {}),
    title: hero.title ?? payload.about?.title ?? null,
    subtitle: hero.subtitle ?? payload.about?.subtitle ?? null,
    description: hero.description ?? payload.about?.description ?? null,
    breadcrumb: hero.breadcrumb || payload.about?.breadcrumb || null,
    media: hero.media || payload.about?.media || null,
    knowAboutUs: {
      ...(isPlainObject(payload.about?.knowAboutUs) ? payload.about.knowAboutUs : {}),
      title: know.title,
      paragraphs: Array.isArray(know.body)
        ? know.body.map((b) => (typeof b === 'string' ? b : b?.text || '')).filter(Boolean)
        : Array.isArray(know.paragraphs)
          ? know.paragraphs
          : payload.about?.knowAboutUs?.paragraphs || [],
      tags: Array.isArray(know.tags) ? know.tags : payload.about?.knowAboutUs?.tags || [],
      media: know.media || payload.about?.knowAboutUs?.media || null,
    },
    weProvide: {
      ...(isPlainObject(payload.about?.weProvide) ? payload.about.weProvide : {}),
      title: provide.title,
      description: provide.description,
      backgroundImage: provide.backgroundImage || null,
      services: Array.isArray(provide.items)
        ? provide.items.map((it) => ({
            id: it.id,
            title: it.title,
            description: it.description,
            icon: it.icon,
            image: it.image || null,
            link: it.link || null,
          }))
        : payload.about?.weProvide?.services || [],
    },
    visionaries: {
      ...(isPlainObject(payload.about?.visionaries) ? payload.about.visionaries : {}),
      title: vision.title,
      description: vision.description,
      team: Array.isArray(vision.items)
        ? vision.items.map((it) => ({
            id: it.id,
            name: it.name,
            role: it.role,
            image: typeof it.image === 'string' ? it.image : it.image?.src || null,
          }))
        : payload.about?.visionaries?.team || [],
    },
  };

  return { ...payload, about };
};

/**
 * Resort Contact reads map/social from pages[/contact] sections (and sometimes
 * a flat `contact` object). Keep both shapes aligned for live preview edits.
 */
const syncContactFlatFromPages = (payload) => {
  if (!isPlainObject(payload) || !Array.isArray(payload.pages)) return payload;
  const contactPage = payload.pages.find((p) => p && String(p.slug) === '/contact');
  if (!contactPage || !Array.isArray(contactPage.sections)) return payload;

  const byId = (id) => contactPage.sections.find((s) => s && s.id === id);
  const form = byId('contact-form')?.content || {};
  const social = byId('contact-social-media')?.content || {};
  const map = byId('contact-map')?.content || {};

  const contact = {
    ...(isPlainObject(payload.contact) ? payload.contact : {}),
    title: form.title || payload.contact?.title,
    subtitle: form.subtitle || payload.contact?.subtitle,
    officeTitle: form.officeTitle || payload.contact?.officeTitle,
    officeSubtitle: form.officeSubtitle || payload.contact?.officeSubtitle,
    connectTitle: form.connectTitle || social.title || payload.contact?.connectTitle,
    form: {
      ...(isPlainObject(payload.contact?.form) ? payload.contact.form : {}),
      ...form,
    },
    items: Array.isArray(social.items) ? social.items : payload.contact?.items || [],
    socialMedia: Array.isArray(social.items)
      ? social.items
      : payload.contact?.socialMedia || [],
    embedUrl: map.embedUrl || payload.contact?.embedUrl || '',
    mapEmbedUrl: map.embedUrl || payload.contact?.mapEmbedUrl || '',
  };

  return { ...payload, contact };
};

/**
 * Ensure root-absolute asset paths are loadable in the iframe.
 *
 * Prefer absolute https URLs (origin + slug + path). Templates like salon that
 * run `resolveAssetPath("/x.jpg") → "/salon1/x.jpg"` will leave https URLs
 * alone — path-only `/salon1/x.jpg` would double-prefix and 404 as HTML.
 */
const rewriteAssetPaths = (value, pathPrefix, origin = '') => {
  if (!pathPrefix || pathPrefix === '/') return value;

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw || /^(https?:|data:|blob:)/i.test(raw) || raw.startsWith('//')) {
      return value;
    }
    // Root-absolute assets (optionally already slug-prefixed)
    if (
      raw.startsWith('/') &&
      !raw.startsWith('//') &&
      /(\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)|\/images\/|\/assets\/)/i.test(raw)
    ) {
      const prefixed =
        raw.startsWith(`${pathPrefix}/`) || raw === pathPrefix
          ? raw
          : `${pathPrefix}${raw}`;
      if (origin) {
        try {
          return new URL(prefixed, origin).href;
        } catch {
          return prefixed;
        }
      }
      return prefixed;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteAssetPaths(item, pathPrefix, origin));
  }

  if (isPlainObject(value)) {
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = rewriteAssetPaths(value[key], pathPrefix, origin);
    });
    return out;
  }

  return value;
};

const getPathPrefix = (previewUrl) => {
  try {
    const pathname = new URL(previewUrl).pathname.replace(/\/$/, '');
    return pathname && pathname !== '/' ? pathname : '';
  } catch {
    return '';
  }
};

const getPreviewOrigin = (previewUrl) => {
  try {
    return new URL(previewUrl).origin;
  } catch {
    return '';
  }
};

/** Preview should show every section while editing; `enabled` still saves for publish. */
const forceSectionsVisible = (data) => {
  if (!hasPayload(data) || !Array.isArray(data.pages)) return data;
  return {
    ...data,
    pages: data.pages.map((page) => {
      if (!isPlainObject(page) || !Array.isArray(page.sections)) return page;
      return {
        ...page,
        sections: page.sections.map((section) =>
          isPlainObject(section) ? { ...section, enabled: true } : section,
        ),
      };
    }),
  };
};

/** Templates read settings.animation.duration — missing objects crash the iframe render. */
const DEFAULT_SECTION_ANIMATION = { duration: 0.8, stagger: 0.15 };

const ensureAnimationSettings = (node) => {
  if (!isPlainObject(node)) return node;
  const settings = isPlainObject(node.settings) ? { ...node.settings } : {};
  const animation = isPlainObject(settings.animation) ? { ...settings.animation } : {};
  if (typeof animation.duration !== 'number' || Number.isNaN(animation.duration)) {
    animation.duration = DEFAULT_SECTION_ANIMATION.duration;
  }
  if (typeof animation.stagger !== 'number' || Number.isNaN(animation.stagger)) {
    animation.stagger = DEFAULT_SECTION_ANIMATION.stagger;
  }
  return { ...node, settings: { ...settings, animation } };
};

/**
 * Keep preview payloads safe for live templates:
 * - guarantee animation settings on sections / footer / navigation
 * - drop editor-only stub sections (type "custom") that templates can't render
 */
const sanitizePreviewPayload = (data) => {
  if (!hasPayload(data)) return data;

  const next = { ...data };

  if (Array.isArray(next.pages)) {
    next.pages = next.pages.map((page) => {
      if (!isPlainObject(page) || !Array.isArray(page.sections)) return page;
      return {
        ...page,
        sections: page.sections
          .filter((section) => {
            if (!isPlainObject(section)) return false;
            // Stub sections from "+ Add section" — omit until they have a real template type.
            if (section.type === 'custom') return false;
            return true;
          })
          .map(ensureAnimationSettings),
      };
    });
  }

  if (isPlainObject(next.footer)) {
    next.footer = ensureAnimationSettings(next.footer);
  }
  if (isPlainObject(next.navigation)) {
    next.navigation = ensureAnimationSettings(next.navigation);
  }

  // Nested content blocks sometimes carry their own settings.animation
  const walkContentSettings = (value) => {
    if (Array.isArray(value)) return value.map(walkContentSettings);
    if (!isPlainObject(value)) return value;
    let out = value;
    if (isPlainObject(value.settings) || value.animation) {
      out = ensureAnimationSettings(value);
    }
    const cloned = { ...out };
    Object.keys(cloned).forEach((key) => {
      if (key === 'settings') return;
      cloned[key] = walkContentSettings(cloned[key]);
    });
    return cloned;
  };

  if (Array.isArray(next.pages)) {
    next.pages = next.pages.map((page) => {
      if (!isPlainObject(page) || !Array.isArray(page.sections)) return page;
      return {
        ...page,
        sections: page.sections.map((section) => {
          if (!isPlainObject(section)) return section;
          return {
            ...section,
            content: section.content != null ? walkContentSettings(section.content) : section.content,
          };
        }),
      };
    });
  }

  return next;
};

const ROUTE_ONLY_KEYS = new Set([
  'aboutPage',
  'contactPage',
  'services',
  'doctors',
  'about',
  'contact',
  'studio',
  'projects',
]);

const HOME_SCROLL_KEYS = new Set([
  'navbar',
  'hero',
  'stay',
  'gallery',
  'pricing',
  'booking',
  'events',
  'customerVoices',
  'customervoices',
  'excellence',
  'expertise',
  'lasikSection',
  'specialists',
  'stats',
  'testimonials',
  'technology',
  'products',
  'variety',
  'monarchStyle',
  'offer',
  'faq',
  'visitUs',
  'footer',
  'services',
  'amenities',
  'rooms',
  'suites',
  'dining',
  'guests',
  'story',
  // Schema ids used by common-schema editor tabs
  'home-hero',
  'home-stay',
  'home-gallery',
  'home-pricing',
  'home-amenities',
  'home-rooms',
  'home-suites',
  'home-dining',
  'home-guest-experiences',
  'home-follow-story',
  'home-events-weddings',
  'home-customer-voices',
  'home-faq',
  'navigation',
]);

/** Map editor/schema section ids → keys the resort (and similar) SCROLL_SECTION maps understand. */
const toTemplateNativeScrollKey = (rawId = '', page = '/') => {
  const id = String(rawId || '').trim();
  const p = normalizePageSlug(page);
  if (!id) {
    if (p === '/about') return 'about';
    if (p === '/contact') return 'contact';
    return null;
  }

  const mapped = {
    'home-hero': 'hero',
    'home-stay': 'stay',
    'home-gallery': 'gallery',
    'home-pricing': 'pricing',
    'home-amenities': 'amenities',
    'home-rooms': 'rooms',
    'home-suites': 'suites',
    'home-dining': 'dining',
    'home-guest-experiences': 'guests',
    'home-follow-story': 'story',
    'home-events-weddings': 'booking',
    'home-customer-voices': 'customerVoices',
    'home-faq': 'faq',
    navigation: 'navbar',
    navbar: 'navbar',
    footer: 'footer',
    booking: 'booking',
    customerVoices: 'customerVoices',
    amenities: 'amenities',
    rooms: 'rooms',
    suites: 'suites',
    dining: 'dining',
    guests: 'guests',
    story: 'story',
    // Resort About DOM ids (do NOT collapse these to the route key "about")
    'about-hero': 'aboutHero',
    aboutHero: 'aboutHero',
    'about-know-about-us': 'knowAboutUs',
    knowAboutUs: 'knowAboutUs',
    'about-story': 'knowAboutUs',
    'about-we-provide': 'weProvide',
    weProvide: 'weProvide',
    'about-drives': 'weProvide',
    'about-visionaries': 'visionaries',
    visionaries: 'visionaries',
    'about-hospitality': 'hospitality',
    hospitality: 'hospitality',
    // Contact
    'contact-form': 'contactForm',
    contactForm: 'contactForm',
    'contact-message': 'contact',
    'contact-header': 'contact',
    'contact-hero': 'contact',
    'contact-business-hours': 'contact',
    'contact-social-media': 'contactForm',
    'contact-map': 'contactForm',
    visitOffices: 'contactForm',
    contactSocial: 'contactForm',
  };
  if (mapped[id]) return mapped[id];

  // Bare route keys only — never map about-* / contact-* subsections to routes
  if (id === 'about' || id === 'aboutPage') return 'about';
  if (id === 'contact' || id === 'contactPage') return 'contact';

  if (/^home-/i.test(id)) {
    const rest = id.replace(/^home-/i, '');
    if (rest === 'events-weddings') return 'booking';
    if (rest === 'customer-voices') return 'customerVoices';
    if (rest === 'guest-experiences') return 'guests';
    if (rest === 'follow-story') return 'story';
    if (!rest.includes('-')) return rest;
    return rest.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  if (HOME_SCROLL_KEYS.has(id) && !id.includes('-')) return id;
  return null;
};

const ABOUT_SCROLL_KEYS = new Set([
  'about',
  'aboutPage',
  'about-hero',
  'aboutHero',
  'about-story',
  'about-drives',
  'about-know-about-us',
  'knowAboutUs',
  'about-we-provide',
  'weProvide',
  'about-visionaries',
  'visionaries',
  'mission',
  'leadership',
  'about-stats',
]);

const CONTACT_SCROLL_KEYS = new Set([
  'contact',
  'contactPage',
  'contact-form',
  'contactForm',
  'contact-info',
  'contact-visit',
  'contact-cta',
  'contact-social-media',
  'contact-map',
  'visitOffices',
  'privacy',
]);

const SAFE_SCROLL_KEYS = new Set([
  ...HOME_SCROLL_KEYS,
  ...ABOUT_SCROLL_KEYS,
  ...CONTACT_SCROLL_KEYS,
  'services',
  'doctors',
]);

const canPostScrollKey = (key, page = '/') => {
  if (!key) return false;
  const p = normalizePageSlug(page);
  if (p === '/about') {
    return ABOUT_SCROLL_KEYS.has(key) || /^about-/i.test(key) || /^(hero|team|content|feature-grid)$/i.test(key);
  }
  if (p === '/contact') {
    return CONTACT_SCROLL_KEYS.has(key) || /^contact-/i.test(key);
  }
  if (p === '/services') return key === 'services' || /^services-/i.test(key);
  if (p === '/doctors') return key === 'doctors' || /^doctors-/i.test(key);
  return HOME_SCROLL_KEYS.has(key) || SAFE_SCROLL_KEYS.has(key);
};

/** Prefer subsection DOM ids (about-story) over route-only keys (about). */
const pickScrollKey = (req = {}, page = '/') => {
  const candidates = [
    req.section,
    ...(Array.isArray(req.aliases) ? req.aliases : []),
    req.routeKey,
    routeKeyForPage(page),
  ].filter(Boolean);

  const elementFirst = candidates.filter((key) => !ROUTE_ONLY_KEYS.has(key));
  for (const key of [...elementFirst, ...candidates]) {
    if (canPostScrollKey(key, page)) return key;
  }
  return null;
};

/** Hash ids that exist as real DOM nodes — never bare route keys. */
const pickHashId = (req = {}, page = '/') => {
  const p = normalizePageSlug(page);
  if (p === '/') return '';

  const candidates = [
    req.sectionId,
    req.scrollId,
    req.section,
    ...(Array.isArray(req.aliases) ? req.aliases : []),
    ...(Array.isArray(req.scrollAliases) ? req.scrollAliases : []),
  ].filter(Boolean);

  // Prefer real subsection ids (about-know-about-us, contact-map, …)
  const concrete = candidates.find(
    (key) =>
      key &&
      !ROUTE_ONLY_KEYS.has(key) &&
      (String(key).includes('-') || ABOUT_SCROLL_KEYS.has(key) || CONTACT_SCROLL_KEYS.has(key)),
  );
  return concrete || '';
};

/** DOM id to highlight — does not navigate, so any element id is safe. */
const pickHighlightKey = (req = {}, page = '/') => {
  const hashId = page !== '/' ? pickHashId(req, page) : '';
  if (hashId) return hashId;

  const candidates = [
    req.section,
    ...(Array.isArray(req.aliases) ? req.aliases : []),
  ].filter(Boolean);

  const elementFirst = candidates.find((key) => !ROUTE_ONLY_KEYS.has(key));
  return elementFirst || pickScrollKey(req, page) || candidates[0] || null;
};

const normalizePageSlug = (pageSlug = '/') => {
  const raw = String(pageSlug || '/').trim() || '/';
  if (raw === '/') return '/';
  return raw.startsWith('/') ? raw.replace(/\/+$/, '') || '/' : `/${raw.replace(/\/+$/, '')}`;
};

/** Infer /about|/contact|/studio|/projects when section id / group implies it. */
const inferPageFromScrollRequest = (req = {}) => {
  let page = normalizePageSlug(req.page || req.pageSlug || '/');
  if (page !== '/') return page;

  const routeKey = String(req.routeKey || '');
  if (routeKey === 'aboutPage' || routeKey === 'about') return '/about';
  if (routeKey === 'contactPage' || routeKey === 'contact') return '/contact';
  if (routeKey === 'services') return '/services';
  if (routeKey === 'doctors') return '/doctors';
  if (routeKey === 'studio') return '/studio';
  if (routeKey === 'projects') return '/projects';
  if (routeKey && !['home', 'navbar', 'footer', 'hero'].includes(routeKey)) {
    return `/${routeKey}`;
  }

  const group = String(req.group || '').toLowerCase();
  if (/\babout\b/.test(group)) return '/about';
  if (/\bcontact\b/.test(group)) return '/contact';
  if (/\bservices?\b/.test(group)) return '/services';
  if (/\bdoctors?\b/.test(group)) return '/doctors';
  if (/\bstudio\b/.test(group)) return '/studio';
  if (/\bprojects?\b/.test(group)) return '/projects';

  const section = String(req.section || req.sectionId || req.scrollId || '').toLowerCase();
  const aliases = [
    ...(Array.isArray(req.aliases) ? req.aliases : []),
    ...(Array.isArray(req.scrollAliases) ? req.scrollAliases : []),
  ].map((a) => String(a).toLowerCase());
  const blob = [section, ...aliases].join(' ');

  if (/^home-/.test(section)) return '/';
  if (
    /^about-/.test(section) ||
    section === 'mission' ||
    section === 'leadership' ||
    section === 'aboutpage' ||
    section === 'about' ||
    /\b(mission|leadership|about-hero|about-story|about-drives|about-stats|aboutpage|know-about|visionaries)\b/.test(
      blob,
    )
  ) {
    return '/about';
  }
  if (
    /^contact-/.test(section) ||
    section === 'contact' ||
    section === 'contactpage' ||
    /\bcontact\b/.test(blob)
  ) {
    return '/contact';
  }
  if (/^services-/.test(section) || routeKey === 'services') return '/services';
  if (/^doctors-/.test(section) || routeKey === 'doctors') return '/doctors';
  if (/^studio-/.test(section) || /\bstudio\b/.test(blob)) return '/studio';
  if (/^projects?-/.test(section) || /\bprojects?\b/.test(blob)) return '/projects';

  const prefixed = section.match(/^([a-z][a-z0-9]*)-(.+)$/);
  if (
    prefixed &&
    !['home', 'page', 'section', 'main', 'nav', 'footer', 'site'].includes(prefixed[1])
  ) {
    return `/${prefixed[1]}`;
  }

  return '/';
};

const routeKeyForPage = (page) => {
  const p = normalizePageSlug(page);
  if (p === '/') return null;
  return p.replace(/^\//, '') || null;
};

/** Ensure directory URLs end with / so relative fetches like ./data.json resolve. */
const ensureTrailingSlashUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  if (/#/.test(raw) || /\.[a-z0-9]+(\?|$)/i.test(raw.split('/').pop() || '')) {
    return raw;
  }
  const [pathPart, query = ''] = raw.split('?');
  if (!pathPart.endsWith('/')) {
    return `${pathPart}/${query ? `?${query}` : ''}`;
  }
  return raw;
};

/** Build a preview URL for a template page, e.g. …/enterprise1/about#about-story */
const buildPreviewPageUrl = (previewUrl, pageSlug = '/', hashId = '') => {
  const base = String(previewUrl || '')
    .split('#')[0]
    .split('?')[0]
    .replace(/\/$/, '');
  const page = normalizePageSlug(pageSlug);
  const pagePart = page === '/' ? '' : page;
  let next = `${base}${pagePart}`;
  // Subsection DOM ids only — never bare route keys as hashes.
  if (
    hashId &&
    !ROUTE_ONLY_KEYS.has(hashId) &&
    (ABOUT_SCROLL_KEYS.has(hashId) ||
      CONTACT_SCROLL_KEYS.has(hashId) ||
      hashId.includes('-'))
  ) {
    next += `#${hashId}`;
  }
  return next;
};

const PreviewFrame = ({
  url,
  editedData,
  iframeKey,
  deviceView,
  onIframeLoaded,
  scrollRequest,
  fieldSelection = null,
  onPreviewClick,
  onPreviewNav,
}) => {
    const iframeRef = useRef(null);
    const debounceRef = useRef(null);
  const editedDataRef = useRef(editedData);
  const defaultsRef = useRef(null);
  const scrollTimersRef = useRef([]);
  const scrollRequestRef = useRef(scrollRequest);
  const fieldSelectionRef = useRef(fieldSelection);
    const [iframeLoaded, setIframeLoaded] = useState(false);
  // Base template URL only — page changes use soft NAVIGATE (no iframe remount).
  const [frameSrc, setFrameSrc] = useState(() => ensureTrailingSlashUrl(url));
  const previewPageRef = useRef('/');
  const phoneStageRef = useRef(null);
  const [phoneScale, setPhoneScale] = useState(1);
  const [focusLabel, setFocusLabel] = useState('');
  const focusLabelTimerRef = useRef(null);
  const [hlOverlays, setHlOverlays] = useState({ section: null, field: null });

  editedDataRef.current = editedData;
  scrollRequestRef.current = scrollRequest;
  fieldSelectionRef.current = fieldSelection;

  useEffect(() => {
    setFrameSrc(ensureTrailingSlashUrl(url));
    previewPageRef.current = '/';
  }, [url, iframeKey]);

  // Fit the iPhone 12 Pro frame inside the preview pane without clipping.
  useLayoutEffect(() => {
    if (deviceView !== 'mobile') return undefined;
    const stage = phoneStageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return undefined;

    const updateScale = () => {
      const pad = 32;
      const availW = Math.max(0, stage.clientWidth - pad);
      const availH = Math.max(0, stage.clientHeight - pad);
      const next = Math.min(
        1,
        availW / IPHONE_12_PRO.width,
        availH / IPHONE_12_PRO.height,
      );
      setPhoneScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [deviceView]);

  const buildPayload = (data) => {
    if (!hasPayload(data)) return null;
    let payload = defaultsRef.current
      ? mergeSiteData(defaultsRef.current, data)
      : data;
    // Legacy flat sites: push their edits into the pages[] the template renders.
    if (!Array.isArray(data?.pages)) {
      payload = overlayLegacyFlatData(payload, data);
    }
    // Keep flat about.* / contact.* in sync for resort templates that still read them.
    payload = syncAboutFlatFromPages(payload);
    payload = syncContactFlatFromPages(payload);
    payload = forceSectionsVisible(payload);
    payload = sanitizePreviewPayload(payload);
    const prefix = getPathPrefix(url);
    const origin = getPreviewOrigin(url);
    if (prefix) {
      payload = rewriteAssetPaths(payload, prefix, origin);
    }
    return payload;
  };

  const postMessageToPreview = (message) => {
        const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow || !message) return;
    try {
      iframeWindow.postMessage(message, '*');
    } catch {
      // ignore
    }
  };

  const postSectionSelection = (req, { scroll = true } = {}) => {
    if (!req) return;
    const page = inferPageFromScrollRequest(req);
    const highlightKey = pickHighlightKey(req, page);
    const scrollKey = page === '/' ? pickScrollKey(req, page) : null;

    const primaryId = String(
      req.sectionId || req.scrollId || req.id || req.section || highlightKey || '',
    ).trim();

    const shortFromPrimary = (() => {
      if (!primaryId) return null;
      const parts = primaryId
        .split(/[-_/]/)
        .filter(
          (part) =>
            part && !/^(home|page|section|main|about|contact)$/i.test(part),
        );
      if (!parts.length) return null;
      if (parts.length === 1) return parts[0];
      // about-know-about-us → knowAboutUs ; home-customer-voices → customerVoices
      return (
        parts[0] +
        parts
          .slice(1)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('')
      );
    })();

    const nativeScrollKey =
      toTemplateNativeScrollKey(primaryId, page) ||
      toTemplateNativeScrollKey(scrollKey, page) ||
      toTemplateNativeScrollKey(shortFromPrimary, page) ||
      toTemplateNativeScrollKey(highlightKey, page);

    const aliases = [];

    // Prefer real DOM ids first (hero, knowAboutUs) so the bridge finds nodes immediately.
    // Route-only keys like "about"/"contact" go last — they fuzzy-match the page hero.
    const routeOnly = new Set(['about', 'aboutPage', 'contact', 'contactPage']);
    const pushAlias = (value) => {
      const key = String(value || '').trim();
      if (!key || aliases.includes(key)) return;
      aliases.push(key);
    };
    const pushRouteLast = (value) => {
      const key = String(value || '').trim();
      if (!key || aliases.includes(key)) return;
      if (routeOnly.has(key)) return; // deferred
      aliases.push(key);
    };

    pushRouteLast(nativeScrollKey);
    pushRouteLast(scrollKey);
    pushRouteLast(shortFromPrimary);
    pushRouteLast(highlightKey);
    pushRouteLast(primaryId);
    pushRouteLast(req.section);
    pushRouteLast(req.sectionId);
    pushRouteLast(req.scrollId);
    (Array.isArray(req.aliases) ? req.aliases : []).forEach(pushRouteLast);
    (Array.isArray(req.scrollAliases) ? req.scrollAliases : []).forEach(pushRouteLast);
    // Route keys last so findSection never lands on aboutHero for Know About Us.
    [nativeScrollKey, scrollKey, highlightKey, primaryId, req.section, ...(req.aliases || []), ...(req.scrollAliases || [])]
      .filter((k) => routeOnly.has(String(k || '').trim()))
      .forEach(pushAlias);

    const label = req.label || req.shortLabel || req.section || primaryId || null;

    const preferredSection =
      (nativeScrollKey && !routeOnly.has(nativeScrollKey) ? nativeScrollKey : null) ||
      scrollKey ||
      shortFromPrimary ||
      highlightKey ||
      primaryId ||
      aliases[0] ||
      null;

    // Bridge handles highlight + scroll (and RR-friendly navigation).
    // If we're leaving Contact/About for Home, tell the bridge explicitly —
    // SELECT_SECTION alone used to skip navigate when page === '/'.
    if (
      page === '/' &&
      previewPageRef.current &&
      previewPageRef.current !== '/'
    ) {
      postMessageToPreview({
        type: 'NAVIGATE',
        path: '/',
        page: '/',
      });
    }

    postMessageToPreview({
      type: 'SELECT_SECTION',
      section: preferredSection,
      sectionId: primaryId || preferredSection,
      aliases,
      label,
      page,
      pageSlug: page,
      scroll,
      matchTexts: Array.isArray(req.matchTexts) ? req.matchTexts : [],
      orderIndex: Number.isInteger(req.orderIndex) ? req.orderIndex : null,
    });

    // Resort/cafe native SCROLL_SECTION maps unknown keys → "/' (Home).
    // Only emit for real home-section ids; About/Contact use SELECT_SECTION.
    // Delay when returning from another page so native handlers run on Home.
    const HOME_NATIVE_SCROLL = new Set([
      'hero',
      'stay',
      'gallery',
      'pricing',
      'booking',
      'customerVoices',
      'faq',
      'navbar',
      'footer',
      // Luxury Hotel & Resort (resort2)
      'amenities',
      'rooms',
      'suites',
      'dining',
      'guests',
      'story',
    ]);
    if (
      scroll &&
      nativeScrollKey &&
      HOME_NATIVE_SCROLL.has(nativeScrollKey) &&
      page === '/' &&
      /resort|cafe/i.test(String(url || ''))
    ) {
      const leavingOtherPage =
        previewPageRef.current && previewPageRef.current !== '/';
      const sendNativeScroll = () =>
        postMessageToPreview({
          type: 'SCROLL_SECTION',
          section: nativeScrollKey,
          sectionId: nativeScrollKey,
          page,
          pageSlug: page,
        });
      if (leavingOtherPage) {
        setTimeout(sendNativeScroll, 750);
      } else {
        sendNativeScroll();
      }
    }

    if (page) previewPageRef.current = page;
  };

  const postFieldSelection = (field, sectionReq) => {
    if (!field) {
      postMessageToPreview({ type: 'CLEAR_SELECTION' });
      if (sectionReq) postSectionSelection(sectionReq, { scroll: false });
      return;
    }

    const page = sectionReq ? inferPageFromScrollRequest(sectionReq) : '/';
    const highlightKey = sectionReq ? pickHighlightKey(sectionReq, page) : null;
    const aliases = sectionReq
      ? [
          highlightKey,
          sectionReq.section,
          sectionReq.sectionId,
          ...(Array.isArray(sectionReq.aliases) ? sectionReq.aliases : []),
          ...(Array.isArray(sectionReq.scrollAliases) ? sectionReq.scrollAliases : []),
        ].filter(Boolean)
      : [];

    postMessageToPreview({
      type: 'SELECT_FIELD',
      fieldId: field.fieldId || null,
      fieldKey: field.fieldKey || null,
      value: typeof field.value === 'string' || typeof field.value === 'number'
        ? field.value
        : field.value == null
          ? null
          : String(field.value),
      section: highlightKey || sectionReq?.section || null,
      sectionId: sectionReq?.sectionId || highlightKey || sectionReq?.section || null,
      aliases,
      label: sectionReq?.label || null,
      matchTexts: Array.isArray(sectionReq?.matchTexts) ? sectionReq.matchTexts : [],
    });
  };

  const postToIframe = (data) => {
    // Send the current CMS/editor data to the preview iframe.

    const iframeWindow = iframeRef.current?.contentWindow;
    const payload = buildPayload(data);
    if (!iframeWindow || !payload) return false;

    let origin = '*';
    try {
      if (iframeRef.current?.src) {
        origin = new URL(iframeRef.current.src).origin;
      }
    } catch {
      origin = '*';
    }

    try {
      // Send to resolved origin and to "*" so first-paint / stubborn embeds still update.
      iframeWindow.postMessage({ type: 'UPDATE_INSTITUTION_DATA', data: payload }, origin);
      if (origin !== '*') {
        iframeWindow.postMessage({ type: 'UPDATE_INSTITUTION_DATA', data: payload }, '*');
      }
      // Templates often reset the router to "/" when data is applied — put the
      // user back on the page they're editing.
      reassertPreviewRoute();
      return true;
    } catch (err) {
      console.warn('Preview postMessage failed', err);
    }
    return false;
  };

  const reassertPreviewRoute = () => {
    const req = scrollRequestRef.current;
    if (!req) return;
    const page = inferPageFromScrollRequest(req);
    if (!page || page === '/') return;
    // Route only — do not pass sectionId or navigateToPage will pulse applySection twice.
    postMessageToPreview({
      type: 'NAVIGATE',
      path: page,
      page,
    });
    previewPageRef.current = page;
  };

  // Prefetch template defaults so partial editor payloads don't wipe sections.
  // Cross-origin hosts (products.tekkzy.com from beta.tekkzy.com) need CORS on
  // the products bucket; if blocked, editor/site data is still posted to the iframe.
    useEffect(() => {
    defaultsRef.current = null;
    if (!url) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    const loadDefaults = async () => {
      try {
        const base = String(url).split('?')[0].replace(/\/$/, '');
        const response = await fetch(`${base}/data.json`, {
          signal: controller.signal,
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit',
        });
        if (!response.ok) return;
        const json = await response.json();
        if (!cancelled && json && typeof json === 'object') {
          defaultsRef.current = json;
          postToIframe(editedDataRef.current);
        }
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          console.warn(
            '[PreviewFrame] Could not load template data.json (CORS or network). Using editor data only.',
          );
        }
      }
    };

    loadDefaults();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, iframeKey]);

    useEffect(() => {
    // Only show the loading mask for real iframe reloads (template/url change),
    // not for soft in-preview page navigation.
    setIframeLoaded(false);
  }, [url, iframeKey]);

  // If the iframe finished loading from cache before React bound onLoad, recover.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    const markLoaded = () => setIframeLoaded(true);
    try {
      if (iframe.contentDocument?.readyState === 'complete') {
        markLoaded();
      }
    } catch {
      // cross-origin
    }

    iframe.addEventListener('load', markLoaded);
    return () => iframe.removeEventListener('load', markLoaded);
  }, [url, iframeKey, frameSrc]);

  // Push edits to the template as they happen — one message per change.
    useEffect(() => {
    const data = editedDataRef.current;
    if (!hasPayload(data)) return undefined;

        clearTimeout(debounceRef.current);
    postToIframe(data);

        return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedData]);

  // Bounded startup sync — keep this short so it doesn't fight section selection.
    useEffect(() => {
    const delays = [400, 1200, 3000];
    const timers = delays.map((ms) =>
      setTimeout(() => postToIframe(editedDataRef.current), ms)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, iframeKey]);

  // The spinner overlay is cosmetic — if the cross-origin load event was
  // missed, clear it after a grace period instead of covering the preview.
  useEffect(() => {
    if (iframeLoaded) return undefined;
    const timer = setTimeout(() => setIframeLoaded(true), 6000);
    return () => clearTimeout(timer);
  }, [iframeLoaded, url, iframeKey]);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
    postToIframe(editedDataRef.current);

    const req = scrollRequestRef.current;
    if (req) {
      scrollTimersRef.current.push(
        setTimeout(() => postSectionSelection(req, { scroll: true }), 350),
      );
    }

        if (onIframeLoaded) onIframeLoaded();
    };

  /**
   * Soft-navigate + highlight the selected section.
   * Never remount the iframe — that was the main flicker source.
   */
  useEffect(() => {
    if (!scrollRequest?.section && !scrollRequest?.routeKey && !scrollRequest?.group) {
      return undefined;
    }

    scrollTimersRef.current.forEach(clearTimeout);
    scrollTimersRef.current = [];

    const page = inferPageFromScrollRequest(scrollRequest);
    const focusLabelText =
      scrollRequest.label ||
      scrollRequest.section ||
      (page !== '/' ? page.replace(/^\//, '') : 'section');

    setFocusLabel(focusLabelText);
    setHlOverlays({ section: null, field: null });
    if (focusLabelTimerRef.current) clearTimeout(focusLabelTimerRef.current);
    focusLabelTimerRef.current = setTimeout(() => setFocusLabel(''), 2800);

    const pulse = () => postSectionSelection(scrollRequest, { scroll: true });
    pulse();
    // One settle retry for SPA route change — not a multi-second pulse train.
    const retryMs = page !== '/' && previewPageRef.current !== page ? 420 : 180;
    scrollTimersRef.current = [setTimeout(pulse, retryMs)];

    return () => scrollTimersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRequest, url]);

  // Field-level highlight inside the active section
  useEffect(() => {
    if (fieldSelection == null) {
      return undefined;
    }
    if (!fieldSelection.fieldId && !fieldSelection.fieldKey) return undefined;

    const timers = [60, 320].map((ms) =>
      setTimeout(() => postFieldSelection(fieldSelection, scrollRequestRef.current), ms),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldSelection]);

  // Bridge ready + reverse click sync from preview → sidebar
  useEffect(() => {
    const onMessage = (event) => {
      const data = event?.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'TEKKZY_BRIDGE_READY') {
        const req = scrollRequestRef.current;
        const field = fieldSelectionRef.current;
        if (req) postSectionSelection(req, { scroll: true });
        if (field) postFieldSelection(field, req);
        return;
      }

      if (data.type === 'TEKKZY_HL_BOUNDS') {
        const kind = data.kind || 'section';
        if (kind === 'clear') {
          setHlOverlays({ section: null, field: null });
          return;
        }
        if (!data.rect) {
          setHlOverlays((prev) => ({
            ...prev,
            [kind === 'field' ? 'field' : 'section']: null,
          }));
          return;
        }
        setHlOverlays((prev) => ({
          ...prev,
          [kind === 'field' ? 'field' : 'section']: data.rect,
        }));
        return;
      }

      if (data.type === 'TEKKZY_PREVIEW_CLICK' && typeof onPreviewClick === 'function') {
        onPreviewClick({
          sectionId: data.sectionId || null,
          fieldId: data.fieldId || null,
          matchText: data.matchText || null,
          orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : null,
          page: data.page || null,
        });
        return;
      }

      if (data.type === 'TEKKZY_PREVIEW_NAV' && typeof onPreviewNav === 'function') {
        onPreviewNav({
          page: data.page || null,
          href: data.href || null,
        });
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPreviewClick, onPreviewNav]);

  const isMobile = deviceView === 'mobile';

  const renderSelectionOverlays = () => {
    const section = hlOverlays.section;
    const field = hlOverlays.field;
    if (!section && !field) return null;
    return (
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
        {section && (
          <div
            className="absolute rounded-sm"
            style={{
              top: section.top,
              left: section.left,
              width: Math.max(0, section.width),
              height: Math.max(0, section.height),
              outline: '2px solid #3d9cf0',
              outlineOffset: '0px',
              boxShadow: '0 0 0 6px rgba(61,156,240,0.25), inset 0 0 0 9999px rgba(61,156,240,0.06)',
            }}
          />
        )}
        {field && (
          <div
            className="absolute rounded-sm"
            style={{
              top: field.top,
              left: field.left,
              width: Math.max(0, field.width),
              height: Math.max(0, field.height),
              outline: '2px dashed #f59e0b',
              boxShadow: '0 0 0 4px rgba(245,158,11,0.22)',
            }}
          />
        )}
      </div>
    );
  };

  const focusBadge = focusLabel ? (
    <div className="pointer-events-none absolute left-3 top-3 z-30 animate-[fadeIn_0.25s_ease-out]">
      <div className="inline-flex items-center gap-2 rounded-lg border border-[#3d9cf0]/40 bg-[#0c1220]/92 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3d9cf0]" />
        <span className="text-[11px] font-medium text-white/90">
          Editing · {focusLabel}
        </span>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={isMobile ? phoneStageRef : undefined}
      className={`w-full h-full flex items-center justify-center overflow-hidden ${
        isMobile
          ? 'bg-[radial-gradient(ellipse_at_center,_#2a2a2e_0%,_#141414_70%)] p-4 md:p-6'
          : 'bg-[#141414] p-3 md:p-4'
      }`}
    >
      {isMobile ? (
        <div
          className="relative shrink-0"
          style={{
            width: IPHONE_12_PRO.width * phoneScale,
            height: IPHONE_12_PRO.height * phoneScale,
          }}
        >
          <div
            className="relative select-none"
            style={{
              width: IPHONE_12_PRO.width,
              height: IPHONE_12_PRO.height,
              transform: `scale(${phoneScale})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Mute / volume */}
            <div
              className="absolute -left-[3px] top-[120px] h-[28px] w-[3px] rounded-l-sm"
              style={{ background: 'linear-gradient(90deg, #1a1a1c, #3a3a3e)' }}
              aria-hidden
            />
            <div
              className="absolute -left-[3px] top-[168px] h-[54px] w-[3px] rounded-l-sm"
              style={{ background: 'linear-gradient(90deg, #1a1a1c, #3a3a3e)' }}
              aria-hidden
            />
            <div
              className="absolute -left-[3px] top-[232px] h-[54px] w-[3px] rounded-l-sm"
              style={{ background: 'linear-gradient(90deg, #1a1a1c, #3a3a3e)' }}
              aria-hidden
            />
            {/* Power */}
            <div
              className="absolute -right-[3px] top-[190px] h-[90px] w-[3px] rounded-r-sm"
              style={{ background: 'linear-gradient(270deg, #1a1a1c, #3a3a3e)' }}
              aria-hidden
            />

            {/* Graphite chassis — iPhone 12 Pro (390×844) */}
            <div
              className="relative h-full w-full overflow-hidden"
              style={{
                borderRadius: 47,
                padding: 12,
                background:
                  'linear-gradient(145deg, #4a4a4e 0%, #2c2c30 18%, #1c1c1e 50%, #323236 82%, #55555a 100%)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.08), 0 25px 50px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="relative h-full w-full overflow-hidden bg-black"
                style={{ borderRadius: 38 }}
              >
                {/* Classic notch */}
                <div
                  className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2"
                  style={{
                    width: 164,
                    height: 30,
                    borderRadius: '0 0 20px 20px',
                    background: '#000',
                  }}
                  aria-hidden
                >
                  <div
                    className="absolute left-1/2 top-[9px] h-[8px] w-[48px] -translate-x-1/2 rounded-full"
                    style={{
                      background: '#0a0a0a',
                      boxShadow: 'inset 0 0 0 1px #1a1a1a',
                    }}
                  />
                  <div
                    className="absolute right-[38px] top-[8px] h-[10px] w-[10px] rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 35%, #1a2838 0%, #0a1520 55%, #000 100%)',
                      boxShadow: '0 0 0 1.5px #111',
                    }}
                  />
                </div>

                <iframe
                    id="builder-preview-iframe"
                  key={`${iframeKey}-${url}`}
                    ref={iframeRef}
                  src={frameSrc || url}
                    onLoad={handleIframeLoad}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                  title="Live Preview"
                />

                {renderSelectionOverlays()}
                {focusBadge}

                {/* Home indicator */}
                <div
                  className="pointer-events-none absolute bottom-2 left-1/2 z-30 -translate-x-1/2 rounded-full"
                  style={{
                    width: 134,
                    height: 5,
                    background: 'rgba(255,255,255,0.35)',
                  }}
                  aria-hidden
                />

                {!iframeLoaded && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a] text-sm text-white/60">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                    Loading preview…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-2xl transition-all duration-300 ease-in-out">
          <iframe
            id="builder-preview-iframe"
            key={`${iframeKey}-${url}`}
            ref={iframeRef}
            src={frameSrc || url}
            onLoad={handleIframeLoad}
            className="h-full w-full border-0"
            title="Live Preview"
          />
          {renderSelectionOverlays()}
          {focusBadge}
          {!iframeLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#141414] text-sm text-white/60">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              Loading preview…
            </div>
          )}
        </div>
      )}
        </div>
    );
};

export default PreviewFrame;
