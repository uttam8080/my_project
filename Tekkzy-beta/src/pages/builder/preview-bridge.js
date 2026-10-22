/**
 * Tekkzy builder ↔ template preview bridge.
 * Loaded by template index.html (products.tekkzy.com/<slug>/).
 *
 * Messages from parent:
 *   UPDATE_INSTITUTION_DATA { data }  — live CMS payload (React hook or DOM fallback)
 *   SELECT_SECTION | HIGHLIGHT_SECTION | SCROLL_SECTION
 *   SELECT_FIELD
 *   CLEAR_SELECTION
 *   NAVIGATE
 *
 * Messages to parent (optional reverse sync):
 *   TEKKZY_PREVIEW_CLICK { sectionId, fieldId }
 *   UPDATE_SUCCESS
 *   TEKKZY_BRIDGE_READY
 *   TEKKZY_HL_BOUNDS
 */
(function tekkzyPreviewBridge() {
  if (typeof window === 'undefined' || window.__TEKKZY_PREVIEW_BRIDGE__) return;
  window.__TEKKZY_PREVIEW_BRIDGE__ = true;

  var STYLE_ID = 'tekkzy-preview-bridge-style';
  var SECTION_ATTR = 'data-tekkzy-section-hl';
  var FIELD_ATTR = 'data-tekkzy-field-hl';
  var LABEL_ID = 'tekkzy-preview-bridge-label';

  var state = {
    sectionKeys: [],
    matchTexts: [],
    fieldId: null,
    fieldValue: null,
    fieldKey: null,
    sectionEl: null,
    fieldEl: null,
  };

  // Last CMS payload from the builder — used to diff live edits into the DOM
  // when a template does not natively listen for UPDATE_INSTITUTION_DATA.
  var lastCmsData = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '[' + SECTION_ATTR + ']{',
      'outline:2px solid #3d9cf0!important;',
      'outline-offset:3px!important;',
      'box-shadow:0 0 0 6px rgba(61,156,240,.22), inset 0 0 0 9999px rgba(61,156,240,.04)!important;',
      'position:relative;',
      'z-index:30;',
      'transition:outline .18s ease, box-shadow .18s ease;',
      '}',
      '[' + FIELD_ATTR + ']{',
      'outline:2px dashed #f59e0b!important;',
      'outline-offset:2px!important;',
      'box-shadow:0 0 0 4px rgba(245,158,11,.2)!important;',
      'position:relative;',
      'z-index:35;',
      'transition:outline .15s ease, box-shadow .15s ease;',
      '}',
      '#' + LABEL_ID + '{',
      'position:fixed;top:12px;left:12px;z-index:99999;pointer-events:none;',
      'font:500 11px/1.2 system-ui,sans-serif;color:#fff;',
      'background:rgba(12,18,32,.92);border:1px solid rgba(61,156,240,.45);',
      'border-radius:8px;padding:6px 10px;backdrop-filter:blur(6px);',
      'box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:min(280px,80vw);',
      '}',
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function uniq(list) {
    var out = [];
    var seen = Object.create(null);
    (list || []).forEach(function (item) {
      var key = String(item || '').trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });
    return out;
  }

  function clearSectionHighlight() {
    document.querySelectorAll('[' + SECTION_ATTR + ']').forEach(function (el) {
      el.removeAttribute(SECTION_ATTR);
    });
    state.sectionEl = null;
    clearBounds('section');
  }

  function clearFieldHighlight() {
    document.querySelectorAll('[' + FIELD_ATTR + ']').forEach(function (el) {
      el.removeAttribute(FIELD_ATTR);
    });
    state.fieldEl = null;
    clearBounds('field');
  }

  function clearAll() {
    clearSectionHighlight();
    clearFieldHighlight();
    state.sectionKeys = [];
    state.matchTexts = [];
    state.fieldId = null;
    state.fieldValue = null;
    state.fieldKey = null;
    clearBounds('clear');
    var label = document.getElementById(LABEL_ID);
    if (label) label.remove();
  }

  function showLabel(text) {
    if (!text) return;
    ensureStyles();
    var label = document.getElementById(LABEL_ID);
    if (!label) {
      label = document.createElement('div');
      label.id = LABEL_ID;
      document.body.appendChild(label);
    }
    label.textContent = text;
    clearTimeout(window.__tkzBridgeLabelTimer);
    window.__tkzBridgeLabelTimer = setTimeout(function () {
      if (label && label.parentNode) label.remove();
    }, 2800);
  }

  function climbToBlock(el) {
    if (!el || el === document.body || el === document.documentElement) return el;

    // Already a keyed section root — never climb away to a page wrapper.
    if (
      el.id ||
      (el.getAttribute &&
        (el.getAttribute('data-section-id') ||
          el.getAttribute('data-section') ||
          el.getAttribute('data-tekkzy-section')))
    ) {
      return el;
    }

    var node = el;
    for (var i = 0; i < 8 && node && node !== document.body; i++) {
      var tag = (node.tagName || '').toLowerCase();
      if (
        tag === 'section' ||
        tag === 'footer' ||
        tag === 'header' ||
        tag === 'article' ||
        (node.getAttribute &&
          (node.getAttribute('data-section-id') ||
            node.getAttribute('data-section') ||
            node.getAttribute('data-tekkzy-section') ||
            node.id))
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return el;
  }

  function queryByKey(key) {
    if (!key) return null;
    // Bare route keys match too many nodes via fuzzy id*= (about → aboutHero).
    var routeOnly = /^(about|aboutPage|contact|contactPage)$/i.test(key);
    var escaped = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var selectors = [
      '[data-section-id="' + escaped + '"]',
      '[data-section="' + escaped + '"]',
      '[data-tekkzy-section="' + escaped + '"]',
      '[data-id="' + escaped + '"]',
      '#' + (window.CSS && CSS.escape ? CSS.escape(key) : key.replace(/([^a-zA-Z0-9_-])/g, '\\$1')),
      '[id="' + escaped + '"]',
    ];
    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = document.querySelector(selectors[i]);
        if (!el) continue;
        var block = climbToBlock(el);
        // Skip empty wrappers left behind when section content failed to render.
        if (block && isVisible(block) && block.getBoundingClientRect().height >= 36) {
          return block;
        }
        if (block && (block.querySelector('img, h1, h2, h3, p, a') || (block.textContent || '').trim().length > 8)) {
          return block;
        }
      } catch (e) {
        // invalid selector
      }
    }
    if (routeOnly) return null;
    try {
      var fuzzy = document.querySelector('[id*="' + escaped + '"]');
      if (fuzzy) {
        var fuzzyBlock = climbToBlock(fuzzy);
        if (fuzzyBlock && isVisible(fuzzyBlock) && fuzzyBlock.getBoundingClientRect().height >= 36) {
          return fuzzyBlock;
        }
      }
    } catch (e2) {
      // ignore
    }
    return null;
  }

  function findSectionByText(texts) {
    var needles = uniq(
      (texts || [])
        .map(normalizeText)
        .filter(function (t) {
          return t && t.length >= 4;
        }),
    );
    if (!needles.length) return null;

    var blocks = document.querySelectorAll(
      'section, footer, header, article, [role="region"], [data-section-id], [data-section]',
    );
    if (!blocks.length) {
      blocks = document.querySelectorAll('main > div, #root > div > div > div');
    }

    var best = null;
    var bestScore = 0;

    for (var i = 0; i < blocks.length; i++) {
      var el = blocks[i];
      if (!isVisible(el)) continue;
      var rect = el.getBoundingClientRect();
      if (rect.height < 48 || rect.width < 80) continue;

      var text = normalizeText(el.textContent || '');
      if (!text || text.length < 8) continue;

      var score = 0;
      for (var j = 0; j < needles.length; j++) {
        var n = needles[j];
        if (text.indexOf(n) !== -1) {
          score += 24 + Math.min(48, n.length);
        }
      }
      if (score <= 0) continue;

      // Prefer compact section blocks over giant page wrappers.
      if (rect.height > 2200) score *= 0.45;
      else if (rect.height > 1400) score *= 0.7;

      // Prefer real <section>/<footer> tags.
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'section' || tag === 'footer' || tag === 'header') score += 8;

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    return bestScore >= 12 ? best : null;
  }

  /**
   * Top-level content blocks in schema order — used to resolve sections that
   * render without ids (investor, education CTAs, …) by their index in the
   * page's section list.
   */
  function pageBlocks() {
    var scope = document.querySelector('main') || document.getElementById('root') || document.body;
    var nodes = scope.querySelectorAll('section');
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // Only top-level sections (skip sections nested in other sections).
      if (el.parentElement && el.parentElement.closest && el.parentElement.closest('section')) {
        continue;
      }
      var r = el.getBoundingClientRect();
      if (r.height < 40 || r.width < 80) continue;
      list.push(el);
    }
    return list;
  }

  function findSection(keys, matchTexts, orderIndex) {
    var list = uniq(keys);

    // 1) Exact id / data-section matches first (highest confidence).
    for (var i = 0; i < list.length; i++) {
      var found = queryByKey(list[i]);
      if (found) return found;
    }

    // 2) Only derive short tokens from full keys that look like schema ids
    //    (home-faq → faq). Never scan unrelated short tokens from a mixed list.
    for (var k = 0; k < list.length; k++) {
      var raw = String(list[k] || '');
      if (!raw.includes('-') && !raw.includes('_') && !raw.includes('/')) continue;
      var parts = raw.split(/[-_/]/).filter(function (part) {
        // Ignore generic prefixes that match nothing useful / cause false hits
        // (about-know-about-us → querying "about" used to highlight aboutHero)
        return (
          part &&
          !/^(home|page|section|main|about|contact)$/i.test(part) &&
          part.length >= 3
        );
      });
      // Prefer the last segment (home-faq → faq, home-customer-voices → voices)
      for (var p = parts.length - 1; p >= 0; p--) {
        var foundPart = queryByKey(parts[p]);
        if (foundPart) return foundPart;
        // camelCase last two segments: customer-voices → customerVoices
        if (p > 0) {
          var camel =
            parts[p - 1] +
            parts[p].charAt(0).toUpperCase() +
            parts[p].slice(1);
          var foundCamel = queryByKey(camel);
          if (foundCamel) return foundCamel;
        }
      }
    }

    var byText = findSectionByText(matchTexts);
    if (byText) return byText;

    // Only use About/Contact ordinal fallbacks on the matching route — otherwise
    // contactKeys on the home page would highlight the home hero (section[0]).
    var pathNow = String(window.location.pathname || '').toLowerCase();
    var onAbout = /\/about(?:\/|$)/.test(pathNow);
    var onContact = /\/contact(?:\/|$)/.test(pathNow);

    // Resort Contact is one #contactForm that also hosts map + social cards.
    // Prefer those sub-regions when the sidebar asks for map/social.
    if (onContact) {
      for (var ci = 0; ci < list.length; ci++) {
        var cKey = String(list[ci] || '');
        if (/contact-map|visitOffices|mapEmbed|embedUrl/i.test(cKey)) {
          var mapFrame =
            document.querySelector('#contactForm iframe[src*="maps"], #contactForm iframe, iframe[src*="maps"], iframe[title*="Map" i]') ||
            null;
          if (mapFrame) {
            var mapBlock =
              mapFrame.closest('.rounded-lg, [class*="rounded"]') ||
              mapFrame.parentElement ||
              mapFrame;
            if (mapBlock) return climbToBlock(mapBlock);
          }
        }
        if (/contact-social|social-media|socialMedia|social-links/i.test(cKey)) {
          var socialRoot = document.getElementById('contactForm') || document.body;
          var socialLink =
            socialRoot.querySelector(
              'a[href*="instagram"], a[href*="linkedin"], a[href*="facebook"], a[href*="twitter"], a[href*="youtube"]',
            ) || null;
          if (socialLink) {
            var socialGrid =
              socialLink.closest('.grid') ||
              socialLink.parentElement ||
              socialLink;
            if (socialGrid) return climbToBlock(socialGrid);
          }
        }
        if (/contact-form|contactForm|^contact$/i.test(cKey)) {
          var formEl = document.getElementById('contactForm');
          if (formEl) return climbToBlock(formEl);
        }
      }
    }

    // Resort About/Contact pages — map schema/DOM keys to the matching <section>.
    var aboutKeyToIndex = {
      'about-hero': 0,
      aboutHero: 0,
      'about-know-about-us': 1,
      knowAboutUs: 1,
      'about-story': 1,
      'about-we-provide': 2,
      weProvide: 2,
      'about-drives': 2,
      'about-visionaries': 3,
      visionaries: 3,
    };
    var contactKeyToIndex = {
      'contact-form': 0,
      contactForm: 0,
      contact: 0,
      'contact-social-media': 0,
      'contact-map': 0,
      visitOffices: 0,
    };
    for (var ai = 0; ai < list.length; ai++) {
      if (onAbout && Object.prototype.hasOwnProperty.call(aboutKeyToIndex, list[ai])) {
        var aboutSections = document.querySelectorAll('main section, #root section, section');
        var aboutBucket = aboutKeyToIndex[list[ai]];
        if (aboutSections[aboutBucket]) return climbToBlock(aboutSections[aboutBucket]);
      }
      if (onContact && Object.prototype.hasOwnProperty.call(contactKeyToIndex, list[ai])) {
        var contactSections = document.querySelectorAll('main section, #root section, section');
        var contactBucket = contactKeyToIndex[list[ai]];
        if (contactSections[contactBucket]) return climbToBlock(contactSections[contactBucket]);
      }
    }

    // Landmark fallbacks — only when the key list clearly asks for them
    var wantsFooter = list.some(function (key) {
      return /footer/i.test(key);
    });
    if (wantsFooter) {
      var footerEl =
        queryByKey('footer') ||
        document.querySelector('footer, #footer, [id="footer"], [data-section="footer"]');
      if (footerEl) return climbToBlock(footerEl);
      // Do NOT fall through to hero/orderIndex — that scrolled footer picks to Home Hero.
      return null;
    }
    if (list.some(function (key) { return /^(nav|header|navigation)$/i.test(key) || /navigation/i.test(key); })) {
      return document.querySelector('header, nav, #navbar, #navigation') || null;
    }
    if (list.some(function (key) { return /(^|[-_])hero$/i.test(key) || /^hero$/i.test(key); })) {
      return queryByKey('hero') || document.querySelector('section') || null;
    }

    // Last resort — pick the Nth top-level block by schema order.
    if (typeof orderIndex === 'number' && orderIndex >= 0) {
      var blocks = pageBlocks();
      if (blocks.length && orderIndex < blocks.length) return blocks[orderIndex];
    }
    return null;
  }

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  }

  function findFieldInSection(sectionEl, opts) {
    opts = opts || {};
    var fieldId = opts.fieldId;
    var fieldKey = opts.fieldKey;
    var value = opts.value;

    if (!sectionEl) return null;

    if (fieldId) {
      var byAttr =
        sectionEl.querySelector('[data-field-id="' + fieldId.replace(/"/g, '\\"') + '"]') ||
        sectionEl.querySelector('[data-tekkzy-field="' + fieldId.replace(/"/g, '\\"') + '"]') ||
        document.querySelector('[data-field-id="' + fieldId.replace(/"/g, '\\"') + '"]');
      if (byAttr) return byAttr;
    }

    var key = String(fieldKey || '').toLowerCase();
    var needle = normalizeText(value);
    if (!needle && !key) return null;

    // Image fields
    if (
      key.includes('image') ||
      key.includes('logo') ||
      key.includes('photo') ||
      key.includes('src') ||
      key.includes('thumbnail') ||
      /\.(png|jpe?g|webp|gif|svg)/i.test(String(value || ''))
    ) {
      var imgs = sectionEl.querySelectorAll('img');
      var raw = String(value || '').trim();
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].getAttribute('src') || '';
        if (!raw) continue;
        if (src === raw || src.endsWith(raw) || raw.endsWith(src) || src.indexOf(raw) !== -1) {
          return imgs[i];
        }
      }
    }

    if (!needle || needle.length < 1) return null;

    // Include div — many marketing templates render hero lines / stats in divs
    // (e.g. cloth002 headingLines), not only h1/span.
    var candidates = sectionEl.querySelectorAll(
      'h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,figcaption,blockquote,td,th,div',
    );
    var best = null;
    var bestScore = 0;
    var bestLen = Infinity;

    for (var j = 0; j < candidates.length; j++) {
      var el = candidates[j];
      if (!isVisible(el)) continue;
      var rawText = el.textContent || '';
      var text = normalizeText(rawText);
      if (!text || text.length > 4000) continue;

      // Skip huge layout shells: only leaf-ish nodes for short field values
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'div') {
        if (el.children && el.children.length > 6) continue;
        // Prefer near-leaf text (child element text shouldn't dwarf the leaf).
        if (text.length > Math.max(80, needle.length * 6) && text !== needle) continue;
      }

      var score = 0;
      if (text === needle) score = 120;
      else if (text.indexOf(needle) !== -1) score = 70 + Math.min(20, needle.length / 10);
      else if (needle.indexOf(text) !== -1 && text.length >= 8) score = 50;

      // Prefer heading-like nodes for title/headline fields
      if (score > 0 && /title|headline|heading|name|label/i.test(key)) {
        if (/^h[1-6]$/.test(tag)) score += 15;
        // Hero stacked lines are often bold divs, not h1
        if (tag === 'div' && text === needle) score += 12;
      }
      if (score > 0 && /button|cta|action/i.test(key)) {
        var tag2 = tag;
        if (tag2 === 'a' || tag2 === 'button') score += 15;
      }

      // Prefer the tightest matching node (exact word div over whole section)
      if (
        score > bestScore ||
        (score === bestScore && score > 0 && text.length < bestLen)
      ) {
        bestScore = score;
        best = el;
        bestLen = text.length;
      }
    }

    return bestScore >= 50 ? best : null;
  }

  function reportBounds(kind, el) {
    try {
      if (!window.parent || window.parent === window || !el || !el.getBoundingClientRect) return;
      var rect = el.getBoundingClientRect();
      window.parent.postMessage(
        {
          type: 'TEKKZY_HL_BOUNDS',
          kind: kind || 'section',
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right,
          },
        },
        '*',
      );
    } catch (e) {
      // ignore
    }
  }

  function clearBounds(kind) {
    try {
      if (!window.parent || window.parent === window) return;
      window.parent.postMessage({ type: 'TEKKZY_HL_BOUNDS', kind: kind || 'clear', rect: null }, '*');
    } catch (e) {
      // ignore
    }
  }

  function scrollToEl(el, block) {
    if (!el) return;

    // Prefer scrolling the nearest scrollable ancestor (templates often overflow
    // on a main/shell node rather than the window).
    try {
      var node = el;
      var scroller = null;
      while (node && node !== document.body && node !== document.documentElement) {
        var style = window.getComputedStyle(node);
        var oy = style && style.overflowY;
        if (
          (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
          node.scrollHeight > node.clientHeight + 4
        ) {
          scroller = node;
          break;
        }
        node = node.parentElement;
      }

      if (scroller) {
        var elRect = el.getBoundingClientRect();
        var scRect = scroller.getBoundingClientRect();
        var top =
          elRect.top - scRect.top + scroller.scrollTop - Math.max(24, scroller.clientHeight * 0.12);
        scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else if (el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: block || 'start', inline: 'nearest' });
      }

      // Absolute fallback against the window if the element is still off-screen.
      setTimeout(function () {
        try {
          var r = el.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight || 0;
          if (r.top < 40 || r.bottom > vh - 24) {
            var y = window.pageYOffset + r.top - Math.max(48, vh * 0.12);
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          }
        } catch (e3) {
          // ignore
        }
        reportBounds(el.getAttribute && el.getAttribute(FIELD_ATTR) ? 'field' : 'section', el);
      }, 360);
      return;
    } catch (e) {
      try {
        if (el.scrollIntoView) el.scrollIntoView(true);
      } catch (e2) {
        // ignore
      }
    }
    setTimeout(function () {
      reportBounds(el.getAttribute && el.getAttribute(FIELD_ATTR) ? 'field' : 'section', el);
    }, 320);
  }

  function applySection(keys, label, shouldScroll, matchTexts, orderIndex) {
    ensureStyles();
    var list = uniq(keys);
    var texts = uniq(matchTexts || []);
    state.sectionKeys = list;
    state.matchTexts = texts;
    clearFieldHighlight();
    clearSectionHighlight();

    var el = findSection(list, texts, orderIndex);
    if (!el) {
      // Retry — SPA route / lazy mount
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        el = findSection(list, texts, orderIndex);
        if (el || attempts >= 20) {
          clearInterval(timer);
          if (!el) return;
          el.setAttribute(SECTION_ATTR, '1');
          if (list[0]) el.setAttribute('data-tekkzy-section', list[0]);
          state.sectionEl = el;
          if (shouldScroll !== false) scrollToEl(el, 'center');
          else reportBounds('section', el);
          if (label) showLabel('Editing · ' + label);
        }
      }, 200);
      return;
    }

    el.setAttribute(SECTION_ATTR, '1');
    if (list[0]) el.setAttribute('data-tekkzy-section', list[0]);
    if (keys && keys[0]) el.setAttribute('data-section-id', keys[0]);
    state.sectionEl = el;
    if (shouldScroll !== false) scrollToEl(el, 'center');
    else reportBounds('section', el);
    if (label) showLabel('Editing · ' + label);
  }

  function applyField(payload) {
    ensureStyles();
    payload = payload || {};
    state.fieldId = payload.fieldId || null;
    state.fieldKey = payload.fieldKey || null;
    state.fieldValue = payload.value != null ? payload.value : null;

    function tryApply(attempt) {
      var sectionEl = state.sectionEl;
      if (!sectionEl && state.sectionKeys.length) {
        sectionEl = findSection(state.sectionKeys, state.matchTexts || []);
        if (sectionEl) {
          sectionEl.setAttribute(SECTION_ATTR, '1');
          state.sectionEl = sectionEl;
          reportBounds('section', sectionEl);
        }
      }
      if (!sectionEl) sectionEl = document.body;

      clearFieldHighlight();
      var fieldEl = findFieldInSection(sectionEl, {
        fieldId: state.fieldId,
        fieldKey: state.fieldKey,
        value: state.fieldValue,
      });
      // Retry while CMS re-render catches up (short hero words in motion.divs)
      if (!fieldEl) {
        if ((attempt || 0) < 12) {
          setTimeout(function () {
            tryApply((attempt || 0) + 1);
          }, 80);
        }
        return;
      }

      fieldEl.setAttribute(FIELD_ATTR, '1');
      state.fieldEl = fieldEl;
      scrollToEl(fieldEl, 'center');
      reportBounds('field', fieldEl);
    }

    tryApply(0);
  }

  function detectBasename() {
    var parts = String(window.location.pathname || '/')
      .split('/')
      .filter(Boolean);
    if (!parts.length) return '';

    // Local Vite proxy: /__proxy_template/<slug>/[page]
    // Must keep BOTH segments — using only "__proxy_template" breaks navigation
    // and blanks the preview iframe.
    if (
      parts[0] === '__proxy_template' ||
      parts[0] === '_proxy_template'
    ) {
      if (parts[1]) return '/' + parts[0] + '/' + parts[1];
      return '/' + parts[0];
    }

    var PAGE_SEGMENTS =
      /^(about|contact|services|doctors|cases|publications|privacy|legal|studio|projects)(-|$)/i;
    var first = parts[0].toLowerCase();
    // /salon002/about → basename /salon002
    // /salon002 → basename /salon002 (home)
    if (parts.length >= 1 && !PAGE_SEGMENTS.test(first)) {
      return '/' + parts[0];
    }
    return '';
  }

  function basenameParts() {
    var base = detectBasename().replace(/^\//, '');
    if (!base) return [];
    return base.split('/').filter(Boolean);
  }

  function navigateToPage(pageSlug, sectionKey) {
    var page = String(pageSlug || '/').trim() || '/';
    if (!page.startsWith('/')) page = '/' + page;
    page = page.replace(/\/+$/, '') || '/';

    var pathNow = String(window.location.pathname || '/');
    var onProxy =
      pathNow.indexOf('/__proxy_template/') === 0 ||
      pathNow.indexOf('/_proxy_template/') === 0;
    var onProductsPath = /\/(salon00\d|resort\d*|cafe\d*|enterprise\d*)\/?$/i.test(
      pathNow.replace(/\/+$/, '') + '/',
    );

    // Hash / single-page templates (salon002): never hard-navigate to /contact etc.
    // That drops out of the proxy folder and loads the Vite SPA (blank + 404 assets).
    var isHashSite =
      !!document.querySelector(
        'a[href^="#home"], a[href^="#services"], a[href^="#contact"], a[href^="#gallery"]',
      ) &&
      !window.next &&
      !window.__NEXT_DATA__ &&
      !document.querySelector('a[href$="/about"], a[href$="/contact"]');

    if (isHashSite) {
      if (page !== '/') {
        var hash = page.replace(/^\//, '');
        try {
          if (hash) {
            var target =
              document.getElementById(hash) ||
              document.querySelector('[id="' + hash + '"]') ||
              document.querySelector('a[href="#' + hash + '"]');
            if (target && target.scrollIntoView) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.location.hash = hash;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      if (sectionKey) {
        setTimeout(function () {
          applySection([sectionKey], sectionKey, true, state.matchTexts || []);
        }, 200);
      }
      return;
    }

    var basename = detectBasename();
    var nextPath =
      page === '/'
        ? basename || '/'
        : (basename || '') + page;

    if (!nextPath.startsWith('/')) nextPath = '/' + nextPath;
    // Never navigate to a bare proxy root without a template slug.
    if (
      nextPath === '/__proxy_template' ||
      nextPath === '/_proxy_template' ||
      nextPath === '/__proxy_template/' ||
      nextPath === '/_proxy_template/'
    ) {
      return;
    }

    var current = String(window.location.pathname || '/').replace(/\/+$/, '') || '/';
    var target = nextPath.replace(/\/+$/, '') || '/';

    if (current !== target) {
      try {
        // Next.js App Router / static multipage exports do not remount pages
        // from raw pushState — hard-navigate so the correct HTML is loaded.
        var isNextMultipage = !!(
          window.next ||
          window.__NEXT_DATA__ ||
          (typeof self !== 'undefined' && self.__next_f)
        );
        if (isNextMultipage) {
          window.location.assign(nextPath);
          return;
        }

        // Prefer clicking an in-app nav link so React Router (resort, etc.)
        // handles the route change — raw pushState often does not remount lazy pages.
        var hrefCandidates = [nextPath, page];
        if (basename && page !== '/') hrefCandidates.push(basename + page);
        if (basename && page === '/') hrefCandidates.push(basename + '/');
        var clicked = false;
        for (var hi = 0; hi < hrefCandidates.length && !clicked; hi++) {
          var href = hrefCandidates[hi];
          if (!href) continue;
          var link =
            document.querySelector('a[href="' + href + '"]') ||
            document.querySelector('a[href="' + href + '/"]');
          if (link) {
            link.click();
            clicked = true;
          }
        }
        if (!clicked) {
          // Only hard-navigate for multipage product hosts; never leave the
          // template folder for proxy previews (handled above).
          if (!onProxy && onProductsPath) {
            window.location.assign(nextPath);
          }
          return;
        }
      } catch (e) {
        try {
          if (!onProxy) window.location.assign(nextPath);
        } catch (e2) {
          // ignore
        }
      }
    }

    if (sectionKey) {
      setTimeout(function () {
        applySection([sectionKey], sectionKey, true, state.matchTexts || []);
      }, 600);
    }
  }

  function collectKeys(data) {
    data = data || {};
    return uniq(
      []
        .concat(data.sectionId || [])
        .concat(data.section || [])
        .concat(data.id || [])
        .concat(data.scrollId || [])
        .concat(Array.isArray(data.aliases) ? data.aliases : [])
        .concat(Array.isArray(data.scrollAliases) ? data.scrollAliases : []),
    );
  }

  function inferPageFromHref(href) {
    var raw = String(href || '').trim();
    if (!raw || raw === '#' || raw.indexOf('javascript:') === 0) return null;
    // In-page anchors (#faq) are section clicks, not page navigation.
    if (raw.charAt(0) === '#') return null;

    raw = raw.split('?')[0].split('#')[0];
    try {
      if (/^https?:/i.test(raw)) raw = new URL(raw).pathname;
    } catch (e) {
      // ignore
    }
    var cleaned = raw.replace(/\/+$/, '') || '/';
    var parts = cleaned.split('/').filter(Boolean);
    var baseParts = basenameParts();
    var last = (parts[parts.length - 1] || '').toLowerCase();

    // Path equals basename (or is empty) → home
    if (!parts.length) return '/';
    if (
      baseParts.length &&
      parts.length === baseParts.length &&
      parts.every(function (p, i) {
        return String(p).toLowerCase() === String(baseParts[i]).toLowerCase();
      })
    ) {
      return '/';
    }

    // Drop basename prefix before deciding page slug
    var pageParts = parts.slice();
    if (baseParts.length && pageParts.length >= baseParts.length) {
      var matchesBase = baseParts.every(function (p, i) {
        return String(pageParts[i] || '').toLowerCase() === String(p).toLowerCase();
      });
      if (matchesBase) {
        pageParts = pageParts.slice(baseParts.length);
      }
    }

    last = (pageParts[pageParts.length - 1] || '').toLowerCase();
    if (!last) return '/';
    if (last === 'about' || last.indexOf('about') === 0) return '/about';
    if (last === 'contact' || last.indexOf('contact') === 0) return '/contact';
    if (last === 'services') return '/services';
    if (last === 'doctors') return '/doctors';
    if (last === 'cases') return '/cases';
    if (last === 'publications') return '/publications';
    if (last === 'studio') return '/studio';
    if (last === 'projects') return '/projects';
    // Relative "about" / "./contact" without leading slash
    if (/^(about|contact|services|doctors|studio|projects)(-|$)/i.test(last)) {
      return '/' + last.replace(/[^a-z].*$/i, '').toLowerCase();
    }
    // Any other single path segment is treated as a page slug (designer templates).
    if (/^[a-z][a-z0-9-]*$/i.test(last)) return '/' + last.toLowerCase();
    return null;
  }

  function isNavChrome(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.getAttribute) {
        var role = (node.getAttribute('role') || '').toLowerCase();
        var tag = (node.tagName || '').toLowerCase();
        if (tag === 'nav' || role === 'navigation') return true;
        if (
          tag === 'header' &&
          node.querySelector &&
          node.querySelector('nav, a[href*="about"], a[href*="contact"]')
        ) {
          return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  function guessSectionFromClick(target) {
    // Footer / nav landmarks first — clicks here must not resolve to hero via
    // a giant #root wrapper score.
    var walk = target;
    while (walk && walk !== document.body) {
      if (walk.getAttribute) {
        var tag = (walk.tagName || '').toLowerCase();
        var nid = walk.id || '';
        if (tag === 'footer' || nid === 'footer' || /footer/i.test(nid)) {
          return { sectionId: 'footer', fieldId: closestFieldId(target) };
        }
        if (tag === 'nav' || nid === 'navbar' || nid === 'navigation') {
          return { sectionId: nid || 'navbar', fieldId: closestFieldId(target) };
        }
      }
      walk = walk.parentElement;
    }

    var sectionId = closestSectionId(target);
    if (sectionId && !/^(root|app)$/i.test(sectionId)) {
      return { sectionId: sectionId, fieldId: closestFieldId(target) };
    }

    // Fall back: score visible section roots by click proximity + text.
    var roots = document.querySelectorAll(
      '[data-tekkzy-section], [data-section-id], section[id], footer, header, #footer, #navbar, #hero, #stay, #gallery, #pricing, #booking, #customerVoices, #faq',
    );
    var best = null;
    var bestScore = -1;
    var clickY = 0;
    try {
      var rect = target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      clickY = rect ? rect.top + rect.height / 2 : 0;
    } catch (e) {
      clickY = 0;
    }

    var vh = window.innerHeight || 800;
    for (var i = 0; i < roots.length; i++) {
      var el = roots[i];
      if (!isVisible(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.height < 40) continue;
      // Skip page-sized wrappers that would steal every click.
      if (r.height > vh * 0.85) continue;
      if (clickY < r.top - 8 || clickY > r.bottom + 8) continue;
      var id =
        el.getAttribute('data-tekkzy-section') ||
        el.getAttribute('data-section-id') ||
        el.id;
      if (!id || /^(root|app)$/i.test(id)) continue;
      var score = 10000 - r.height;
      if (score > bestScore) {
        bestScore = score;
        best = {
          sectionId: id,
          fieldId: closestFieldId(target),
          matchText: normalizeText((el.innerText || '').slice(0, 80)),
        };
      }
    }
    if (best) return best;

    var blocks = pageBlocks();
    for (var b = 0; b < blocks.length; b++) {
      var blockRect = blocks[b].getBoundingClientRect();
      if (clickY >= blockRect.top - 4 && clickY <= blockRect.bottom + 4) {
        return {
          sectionId: blocks[b].id || null,
          fieldId: closestFieldId(target),
          matchText: normalizeText((blocks[b].innerText || '').slice(0, 80)),
          orderIndex: b,
        };
      }
    }
    return null;
  }

function collectCmsLeaves(value, path, out) {
    if (value == null) return;
    if (typeof value === 'string') {
      var text = value;
      if (text.length >= 1 && text.length <= 800) {
        out.push({ path: path.slice(), value: text, kind: 'text' });
      }
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return;
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        path.push(i);
        collectCmsLeaves(value[i], path, out);
        path.pop();
      }
      return;
    }
    if (typeof value === 'object') {
      // Image-like objects
      if (typeof value.src === 'string' && value.src) {
        out.push({ path: path.concat(['src']), value: value.src, kind: 'src' });
      }
      var keys = Object.keys(value);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (
          key === 'settings' ||
          key === 'template' ||
          key === 'schemaVersion' ||
          key === 'enabled'
        ) {
          continue;
        }
        path.push(key);
        collectCmsLeaves(value[key], path, out);
        path.pop();
      }
    }
  }

  function replaceExactText(from, to) {
    if (!from || from === to) return false;
    // Prefer the currently highlighted field node.
    if (state.fieldEl) {
      var current = (state.fieldEl.textContent || '').replace(/\s+/g, ' ').trim();
      var fromNorm = String(from).replace(/\s+/g, ' ').trim();
      if (current === fromNorm || (state.fieldEl.textContent || '').indexOf(from) !== -1) {
        if (state.fieldEl.childNodes && state.fieldEl.childNodes.length === 1 && state.fieldEl.childNodes[0].nodeType === 3) {
          state.fieldEl.childNodes[0].nodeValue = to;
        } else {
          state.fieldEl.textContent = to;
        }
        state.fieldValue = to;
        return true;
      }
    }

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    var matched = false;
    while ((node = walker.nextNode())) {
      var raw = node.nodeValue;
      if (!raw || raw.indexOf(from) === -1) continue;
      var trimmed = raw.replace(/\s+/g, ' ').trim();
      if (trimmed === String(from).replace(/\s+/g, ' ').trim() || raw.trim() === String(from).trim()) {
        node.nodeValue = raw.replace(from, to);
        matched = true;
        break;
      }
    }
    return matched;
  }

  function replaceImageSrc(from, to) {
    if (!from || !to || from === to) return false;
    var changed = false;
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var srcAttr = img.getAttribute('src') || '';
      var abs = img.currentSrc || img.src || '';
      if (srcAttr === from || abs === from || abs.indexOf(from) !== -1 || srcAttr.indexOf(from) !== -1) {
        img.setAttribute('src', to);
        try {
          img.src = to;
        } catch (e) {
          // ignore
        }
        changed = true;
      }
    }
    // CSS background images
    var nodes = document.querySelectorAll('[style*="background"]');
    for (var j = 0; j < nodes.length; j++) {
      var el = nodes[j];
      var style = el.getAttribute('style') || '';
      if (style.indexOf(from) !== -1) {
        el.setAttribute('style', style.split(from).join(to));
        changed = true;
      }
    }
    return changed;
  }

  // Last theme colors applied via stylesheet recolor (salon / hard-coded templates).
  var lastThemeColors = null;

  var DEFAULT_THEME_COLORS = {
    primary: '#4A121B',
    primaryHover: '#611B26',
    primaryDark: '#2A080B',
    primaryScript: '#63202B',
    accent: '#C4A882',
    accentLight: '#D4A574',
    bgLight: '#FAF5EE',
    bgWarm: '#F4EDE3',
    cardBg: '#FAF5EE',
    textDark: '#1A1210',
    textMuted: '#5C524E',
    gold: '#C9A96E',
    goldDark: '#B8944F',
    footerBg: '#1A0A0E',
    leaf: '#6E2430',
    border: '#7A2430',
  };

  function resolveThemeColors(payload) {
    var colors =
      (payload &&
        payload.theme &&
        payload.theme.colors &&
        typeof payload.theme.colors === 'object' &&
        payload.theme.colors) ||
      {};
    return {
      primary: colors.primary || DEFAULT_THEME_COLORS.primary,
      primaryHover:
        colors.primaryHover || colors.primary || DEFAULT_THEME_COLORS.primaryHover,
      primaryDark: colors.primaryDark || DEFAULT_THEME_COLORS.primaryDark,
      primaryScript:
        colors.primaryScript || colors.primary || DEFAULT_THEME_COLORS.primaryScript,
      accent: colors.accent || DEFAULT_THEME_COLORS.accent,
      accentLight:
        colors.accentLight || colors.accent || DEFAULT_THEME_COLORS.accentLight,
      bgLight: colors.bgLight || DEFAULT_THEME_COLORS.bgLight,
      bgWarm: colors.bgWarm || DEFAULT_THEME_COLORS.bgWarm,
      cardBg: colors.cardBg || colors.bgLight || DEFAULT_THEME_COLORS.cardBg,
      textDark: colors.textDark || DEFAULT_THEME_COLORS.textDark,
      textMuted: colors.textMuted || DEFAULT_THEME_COLORS.textMuted,
      gold: colors.gold || colors.accent || DEFAULT_THEME_COLORS.gold,
      goldDark:
        colors.goldDark || colors.accentLight || DEFAULT_THEME_COLORS.goldDark,
      footerBg:
        colors.footerBg || colors.primaryDark || DEFAULT_THEME_COLORS.footerBg,
      leaf: colors.leaf || colors.primaryScript || DEFAULT_THEME_COLORS.leaf,
      border: colors.border || colors.primaryScript || DEFAULT_THEME_COLORS.border,
    };
  }

  function replaceColorInStyles(fromColor, toColor) {
    if (!fromColor || !toColor) return;
    var from = String(fromColor).trim();
    var to = String(toColor).trim();
    if (!from || !to) return;
    if (from.toLowerCase() === to.toLowerCase()) return;

    var bare = from.replace(/^#/, '');
    if (!/^[0-9a-fA-F]{3,8}$/.test(bare)) return;
    // Match #hex including optional 1–2 opacity digits (#4a121b1a → #next1a).
    var re = new RegExp('#' + bare + '([0-9a-fA-F]{0,2})(?![0-9a-fA-F])', 'gi');

    function swap(value) {
      return String(value || '').replace(re, function (_m, opacity) {
        return to + (opacity || '');
      });
    }

    function containsColor(value) {
      re.lastIndex = 0;
      return re.test(String(value || ''));
    }

    function walkRules(rules) {
      if (!rules) return;
      Array.prototype.forEach.call(rules, function (rule) {
        try {
          if (rule.style) {
            for (var i = 0; i < rule.style.length; i++) {
              var prop = rule.style.item(i);
              var val = rule.style.getPropertyValue(prop);
              if (val && containsColor(val)) {
                var pri = rule.style.getPropertyPriority(prop);
                rule.style.setProperty(prop, swap(val), pri);
              }
            }
          }
          // Nested @media / @supports / @layer
          if (rule.cssRules && rule.cssRules.length) {
            walkRules(rule.cssRules);
          }
        } catch (err2) {
          // ignore
        }
      });
    }

    try {
      Array.prototype.forEach.call(document.styleSheets || [], function (sheet) {
        var rules;
        try {
          rules = sheet.cssRules || sheet.rules;
        } catch (err) {
          // Cross-origin stylesheets (e.g. fonts.googleapis) are not readable.
          return;
        }
        walkRules(rules);
      });
    } catch (e) {
      // ignore
    }

    try {
      Array.prototype.forEach.call(
        document.querySelectorAll('[style]') || [],
        function (el) {
          var style = el.getAttribute('style');
          if (style && containsColor(style)) {
            el.setAttribute('style', swap(style));
          }
        },
      );
    } catch (e2) {
      // ignore
    }

    // SVG presentation attributes
    try {
      Array.prototype.forEach.call(
        document.querySelectorAll('[fill],[stroke],[color]') || [],
        function (el) {
          ;['fill', 'stroke', 'color'].forEach(function (attr) {
            var val = el.getAttribute(attr);
            if (val && containsColor(val)) {
              el.setAttribute(attr, swap(val));
            }
          });
        },
      );
    } catch (e3) {
      // ignore
    }
  }

  var pendingThemePayload = null;
  var themeRetryTimers = [];

  function setSalonCssVariables(next) {
    try {
      var root = document.documentElement;
      if (!root || !root.style || !root.style.setProperty) return;
      root.style.setProperty('--salon-primary', next.primary);
      root.style.setProperty('--salon-primary-hover', next.primaryHover);
      root.style.setProperty('--salon-primary-dark', next.primaryDark);
      root.style.setProperty('--salon-primary-script', next.primaryScript);
      root.style.setProperty('--salon-accent', next.accent);
      root.style.setProperty('--salon-accent-light', next.accentLight);
      root.style.setProperty('--salon-bg-light', next.bgLight);
      root.style.setProperty('--salon-bg-warm', next.bgWarm);
      root.style.setProperty('--salon-card-bg', next.cardBg);
      root.style.setProperty('--salon-text-dark', next.textDark);
      root.style.setProperty('--salon-text-muted', next.textMuted);
      root.style.setProperty('--salon-gold', next.gold);
      root.style.setProperty('--salon-gold-dark', next.goldDark);
      root.style.setProperty('--salon-footer-bg', next.footerBg);
      root.style.setProperty('--salon-leaf', next.leaf);
      root.style.setProperty('--salon-border', next.border);
      // Generic hooks used by other templates
      root.style.setProperty('--color-primary', next.primary);
      root.style.setProperty('--color-accent', next.accent);
      root.style.setProperty('--primary', next.primary);
      root.style.setProperty('--accent', next.accent);
    } catch (e) {
      // ignore
    }
  }

  function applyThemeColorsFromCms(payload, options) {
    if (!payload || typeof payload !== 'object') return;
    // Only when theme/colors exists to avoid thrashing non-themed templates.
    if (!payload.theme || !payload.theme.colors) return;

    pendingThemePayload = payload;
    var next = resolveThemeColors(payload);
    var prev = lastThemeColors;
    var keys = Object.keys(next);
    var i;

    // Always re-seed default template palette → next. Covers first paint before
    // stylesheets load (when we re-run with retries) and hard-coded CSS colors.
    for (i = 0; i < keys.length; i++) {
      replaceColorInStyles(DEFAULT_THEME_COLORS[keys[i]], next[keys[i]]);
    }
    // Incremental transition when the user picks a new color after a prior apply.
    if (prev) {
      for (i = 0; i < keys.length; i++) {
        replaceColorInStyles(prev[keys[i]], next[keys[i]]);
      }
    }

    setSalonCssVariables(next);
    lastThemeColors = next;

    try {
      if (typeof window.applySalonTheme === 'function') {
        window.applySalonTheme(payload);
      }
    } catch (e2) {
      // ignore
    }

    // Stylesheets (or React style props) may load after the first CMS message —
    // re-apply a few times without changing last→next logic (defaults reseeds).
    if (!options || !options.skipSchedule) {
      while (themeRetryTimers.length) {
        clearTimeout(themeRetryTimers.pop());
      }
      ;[120, 400, 900, 1800].forEach(function (ms) {
        themeRetryTimers.push(
          setTimeout(function () {
            if (pendingThemePayload) {
              applyThemeColorsFromCms(pendingThemePayload, { skipSchedule: true });
            }
          }, ms),
        );
      });
    }
  }

  function applyCmsDataFallback(nextData) {
    if (!nextData || typeof nextData !== 'object') return false;
    var nextLeaves = [];
    collectCmsLeaves(nextData, [], nextLeaves);

    if (!lastCmsData) {
      lastCmsData = nextData;
      return false;
    }

    var prevLeaves = [];
    collectCmsLeaves(lastCmsData, [], prevLeaves);
    var prevMap = Object.create(null);
    for (var i = 0; i < prevLeaves.length; i++) {
      prevMap[prevLeaves[i].path.join('.')] = prevLeaves[i];
    }

    var changed = 0;
    for (var n = 0; n < nextLeaves.length; n++) {
      var leaf = nextLeaves[n];
      var key = leaf.path.join('.');
      var prev = prevMap[key];
      if (!prev || prev.value === leaf.value) continue;
      if (leaf.kind === 'src') {
        if (replaceImageSrc(prev.value, leaf.value)) changed += 1;
      } else if (replaceExactText(prev.value, leaf.value)) {
        changed += 1;
      }
    }

    lastCmsData = nextData;
    return changed > 0;
  }

  function handleInstitutionDataUpdate(data, source) {
    var payload = data && data.data;
    if (!payload || typeof payload !== 'object') return;

    var applied = false;
    try {
      if (typeof window.__TEKKZY_APPLY_CMS_DATA__ === 'function') {
        applied = !!window.__TEKKZY_APPLY_CMS_DATA__(payload);
      }
    } catch (e) {
      applied = false;
    }

    // Always keep a DOM fallback for templates (or first paint) without a React hook.
    if (!applied) {
      applyCmsDataFallback(payload);
    } else {
      lastCmsData = payload;
    }

    // Theme/colors: rewrite hardcoded palette in CSS + CSS variables (salon, etc.)
    try {
      applyThemeColorsFromCms(payload);
    } catch (themeErr) {
      // ignore
    }

    try {
      window.__TEKKZY_CMS_DATA__ = payload;
      window.dispatchEvent(
        new CustomEvent('tekkzy:cms-data', {
          detail: payload,
        }),
      );
    } catch (e2) {
      // ignore
    }

    try {
      var target = source || (window.parent && window.parent !== window ? window.parent : null);
      if (target && target.postMessage) {
        target.postMessage({ type: 'UPDATE_SUCCESS' }, '*');
      }
    } catch (e3) {
      // ignore
    }
  }

  function onMessage(event) {
    var data = event && event.data;
    if (!data || typeof data !== 'object') return;
    var type = data.type;
    if (!type) return;

    if (type === 'UPDATE_INSTITUTION_DATA') {
      handleInstitutionDataUpdate(data, event.source);
      return;
    }

    if (type === 'CLEAR_SELECTION') {
      clearAll();
      return;
    }

    if (type === 'NAVIGATE') {
      navigateToPage(data.path || data.page || '/', data.sectionId || data.section || null);
      return;
    }

    if (
      type === 'SELECT_SECTION' ||
      type === 'HIGHLIGHT_SECTION'
    ) {
      var page = data.page || data.pageSlug || null;
      var targetPage = '/';
      if (page != null && String(page).trim() !== '') {
        targetPage = String(page).trim();
        if (targetPage.charAt(0) !== '/') targetPage = '/' + targetPage;
        targetPage = targetPage.replace(/\/+$/, '') || '/';
      }
      var currentPage = inferPageFromHref(window.location.pathname) || '/';
      var needsNav = targetPage !== currentPage;
      // Always navigate when the editor asks for a different page — including
      // Contact/About → Home. Skipping "/" left the iframe stuck off-home.
      if (needsNav) {
        navigateToPage(targetPage, null);
      }
      var keys = collectKeys(data);
      if (!keys.length && typeof data.section === 'string') keys = [data.section];
      var matchTexts = Array.isArray(data.matchTexts) ? data.matchTexts : [];
      if (data.label) matchTexts = matchTexts.concat([data.label]);
      if (!keys.length && !matchTexts.length) return;
      // Hard/soft page changes need time for the new route to mount.
      var delay = needsNav ? 700 : 0;
      setTimeout(function () {
        applySection(
          keys,
          data.label || data.section || (keys[0] || null),
          data.scroll !== false && type !== 'HIGHLIGHT_SECTION',
          matchTexts,
          typeof data.orderIndex === 'number' ? data.orderIndex : null,
        );
      }, delay);
      return;
    }

    // SCROLL_SECTION is handled by template-native listeners (resort React Router
    // map). Do not also run bridge apply here — that raced and cancelled scrolls.
    if (type === 'SCROLL_SECTION') {
      return;
    }

    if (type === 'SELECT_FIELD') {
      if (
        data.sectionId ||
        data.section ||
        (data.aliases && data.aliases.length) ||
        (data.matchTexts && data.matchTexts.length)
      ) {
        applySection(
          collectKeys(data),
          data.label || null,
          false,
          Array.isArray(data.matchTexts) ? data.matchTexts : [],
        );
      }
      applyField(data);
    }
  }

  function closestSectionId(node) {
    var el = node;
    while (el && el !== document.body) {
      if (el.getAttribute) {
        var id =
          el.getAttribute('data-tekkzy-section') ||
          el.getAttribute('data-section-id') ||
          el.getAttribute('data-section') ||
          el.id;
        if (id) return id;
      }
      el = el.parentElement;
    }
    return null;
  }

  function closestFieldId(node) {
    var el = node;
    while (el && el !== document.body) {
      if (el.getAttribute) {
        var id = el.getAttribute('data-field-id') || el.getAttribute('data-tekkzy-field');
        if (id) return id;
      }
      el = el.parentElement;
    }
    return null;
  }

  function onClick(event) {
    try {
      if (!window.parent || window.parent === window) return;

      var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (link) {
        var href = link.getAttribute('href') || '';
        var page = inferPageFromHref(href);
        // Programmatic link.click() from navigateToPage is untrusted — let it
        // through so React Router can change pages. Only intercept user clicks.
        if (!event.isTrusted) {
          return;
        }
        // Any recognized page link (Home/About/Contact/…) — navigate only.
        // Do NOT also emit TEKKZY_PREVIEW_CLICK or the navbar/hero wins.
        if (page) {
          // Builder owns preview routing — block the SPA link so it can't
          // race with data sync and snap back to Home.
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch (e) {
            // ignore
          }
          window.parent.postMessage(
            {
              type: 'TEKKZY_PREVIEW_NAV',
              page: page,
              href: href,
            },
            '*',
          );
          return;
        }

        // External / mailto / tel links — keep the builder preview in place and
        // treat the click as a section select (LinkedIn, map-adjacent cards, …).
        if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('//')) {
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch (eExt) {
            // ignore
          }
        }
      }

      // Clicks in the nav chrome without a page href shouldn't select Hero.
      if (isNavChrome(event.target)) return;

      var guessed = guessSectionFromClick(event.target);
      if (
        !guessed ||
        (!guessed.sectionId &&
          !guessed.fieldId &&
          !guessed.matchText &&
          typeof guessed.orderIndex !== 'number')
      ) {
        return;
      }

      window.parent.postMessage(
        {
          type: 'TEKKZY_PREVIEW_CLICK',
          sectionId: guessed.sectionId || null,
          fieldId: guessed.fieldId || null,
          matchText: guessed.matchText || null,
          orderIndex: typeof guessed.orderIndex === 'number' ? guessed.orderIndex : null,
          page: inferPageFromHref(window.location.pathname) || '/',
        },
        '*',
      );
    } catch (e) {
      // ignore
    }
  }

  window.addEventListener('message', onMessage);
  document.addEventListener('click', onClick, true);

  var syncBounds = function () {
    if (state.fieldEl) reportBounds('field', state.fieldEl);
    else if (state.sectionEl) reportBounds('section', state.sectionEl);
  };
  window.addEventListener('scroll', syncBounds, true);
  window.addEventListener('resize', syncBounds);

  // Ready ping so the builder can re-send selection after bridge loads.
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'TEKKZY_BRIDGE_READY' }, '*');
    }
  } catch (e) {
    // ignore
  }
})();
