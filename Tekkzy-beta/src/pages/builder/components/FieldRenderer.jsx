import React from 'react';
import InputField from '../../../pages/product/components/InputField';
import ImageField from '../../../pages/product/components/ImageField';

const HIDDEN_FIELD_KEYS = new Set([
    'id',
    '_id',
    'uuid',
    'key',
    'index',
    'createdAt',
    'updatedAt',
    '__typename',
    'schemaVersion',
    'template',
    'editorLabel',
    'type',
    'variant',
    'locale',
    'noIndex',
    'target',
    'style',
    'reverse',
    'autoPlay',
    'intervalMs',
    'sectionHeight',
    'titleStyles',
    'descriptionStyles',
    'dividerColor',
    'seo',
    // Schema chrome — section visibility uses the dedicated toggle, not this field
    'enabled',
    'settings',
    'sourceType',
    'mode',
    // CSS/layout internals — not meaningful in the CMS sidebar
    'aspectRatio',
    'fit',
    'focalPoint',
    'objectFit',
    'objectPosition',
    // Internal endpoints — edit contact via Site contact section instead
    'api',
    'contactEndpoint',
    // Template motion config — editing these can crash the live preview
    'animation',
    'stagger',
]);

const shouldHideKey = (key, path = []) => {
    if (!key && key !== 0) return true;
    const k = String(key);
    if (HIDDEN_FIELD_KEYS.has(k)) return true;
    if (k.startsWith('_') || k.startsWith('__')) return true;
    // Only hide duration under animation settings (not content like "project duration")
    if (k === 'duration' && path.map(String).includes('animation')) return true;
    // Video poster is rarely editable content; nested image already covers section photos
    if (k === 'poster' && path.map(String).some((p) => p === 'video' || p === 'videos')) {
        return true;
    }
    return false;
};

/** Template media blobs: { src, alt, fit, focalPoint } — edit as one upload, not nested fields. */
const IMAGE_ASSET_KEYS = new Set([
    'src',
    'url',
    'href',
    'alt',
    'fit',
    'focalPoint',
    'width',
    'height',
    'type',
    // Some templates hang poster on image assets; still treat as a single upload
    'poster',
]);

/** Keys allowed alongside a nested `{ image: asset }` wrapper without breaking collapse. */
const IMAGE_WRAPPER_META_KEYS = new Set([
    'id',
    '_id',
    'uuid',
    'type',
    'order',
    'enabled',
    'index',
    'caption',
    'hoverCaption',
    'label',
    'title',
    'alt',
    'name',
    'description',
    'aspectRatio',
]);

const imageSrcKey = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (typeof value.src === 'string' || 'src' in value) return 'src';
    if (typeof value.url === 'string' || 'url' in value) return 'url';
    if (typeof value.href === 'string' || 'href' in value) return 'href';
    return null;
};

const isImageAssetObject = (value) => {
    const srcKey = imageSrcKey(value);
    if (!srcKey) return false;
    return Object.keys(value).every((k) => IMAGE_ASSET_KEYS.has(k));
};

const isImageLikeKey = (key) => {
    const k = String(key || '').toLowerCase();
    if (!k) return false;
    if (
        k === 'image' ||
        k === 'img' ||
        k === 'photo' ||
        k === 'avatar' ||
        k === 'thumbnail' ||
        k === 'poster' ||
        k === 'portrait' ||
        k === 'backgroundimage' ||
        k === 'bgimage' ||
        k === 'backgroundmedia' ||
        k === 'imageurl' ||
        k === 'src' ||
        k === 'favicon' ||
        k === 'media'
    ) {
        return true;
    }
    return (
        k.endsWith('image') ||
        k.endsWith('img') ||
        k.includes('imageurl') ||
        k.includes('thumbnail') ||
        k.includes('avatar') ||
        k.includes('portrait')
    );
};

/**
 * Collapse CMS nesting:
 *   { id, image: { src, alt, fit } }  → one uploader
 *   { type: 'image', image: asset, video: null } → one uploader
 * Returns { asset, relativePath[] } where relativePath leads from the container to the asset.
 */
const unwrapImageContainer = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (isImageAssetObject(value)) {
        return { asset: value, relativePath: [] };
    }

    // Media bag used by several templates
    const mediaKeys = Object.keys(value);
    const isMediaBag =
        ('image' in value || 'video' in value) &&
        mediaKeys.every((k) =>
            ['id', 'type', 'image', 'video', 'poster', 'alt', 'caption'].includes(k),
        );
    if (isMediaBag) {
        if (isImageAssetObject(value.image)) {
            return { asset: value.image, relativePath: ['image'] };
        }
        if (typeof value.image === 'string') {
            return { asset: value.image, relativePath: ['image'], isString: true };
        }
        // Prefer image; fall back to poster on media bags
        if (typeof value.poster === 'string' || isImageAssetObject(value.poster)) {
            return {
                asset: value.poster,
                relativePath: ['poster'],
                isString: typeof value.poster === 'string',
            };
        }
    }

    // Common wrapper: { id, image: asset } (+ optional caption meta keys)
    if (value.image && (isImageAssetObject(value.image) || typeof value.image === 'string')) {
        const others = mediaKeys.filter((k) => k !== 'image');
        if (others.every((k) => IMAGE_WRAPPER_META_KEYS.has(k) || value[k] == null)) {
            return {
                asset: value.image,
                relativePath: ['image'],
                isString: typeof value.image === 'string',
            };
        }
    }

    // Same for media / photo / poster nests
    for (const nestKey of ['media', 'photo', 'poster', 'backgroundMedia', 'backgroundImage']) {
        const nested = value[nestKey];
        if (!nested) continue;
        if (isImageAssetObject(nested) || typeof nested === 'string') {
            const others = mediaKeys.filter((k) => k !== nestKey);
            if (others.every((k) => IMAGE_WRAPPER_META_KEYS.has(k) || value[k] == null)) {
                return {
                    asset: nested,
                    relativePath: [nestKey],
                    isString: typeof nested === 'string',
                };
            }
        }
        const deeper = unwrapImageContainer(nested);
        if (deeper) {
            const others = mediaKeys.filter((k) => k !== nestKey);
            if (others.every((k) => IMAGE_WRAPPER_META_KEYS.has(k) || value[k] == null)) {
                return {
                    asset: deeper.asset,
                    relativePath: [nestKey, ...deeper.relativePath],
                    isString: deeper.isString,
                };
            }
        }
    }

    return null;
};

/** Extra text fields to keep when an image container also stores caption meta. */
const IMAGE_WRAPPER_EDITABLE_TEXT_KEYS = new Set([
    'caption',
    'hoverCaption',
    'label',
    'title',
    'alt',
    'name',
    'description',
]);

const makeImageAsset = (url, previous = null) => {
    const base =
        previous && typeof previous === 'object' && !Array.isArray(previous)
            ? { ...previous }
            : {};
    return {
        ...base,
        src: url || '',
        alt: typeof base.alt === 'string' ? base.alt : '',
        fit: typeof base.fit === 'string' ? base.fit : 'cover',
        focalPoint:
            base.focalPoint && typeof base.focalPoint === 'object'
                ? base.focalPoint
                : { x: 50, y: 50 },
    };
};

const makeMediaObject = (url, previous = null) => {
    const prev =
        previous && typeof previous === 'object' && !Array.isArray(previous)
            ? previous
            : {};
    return {
        type: 'image',
        image: makeImageAsset(url, prev.image),
        video: Object.prototype.hasOwnProperty.call(prev, 'video') ? prev.video : null,
    };
};

const readImageSrc = (value) => {
    if (typeof value === 'string') return value;
    if (isImageAssetObject(value)) return value[imageSrcKey(value)] || '';
    const unwrapped = unwrapImageContainer(value);
    if (unwrapped) {
        if (unwrapped.isString || typeof unwrapped.asset === 'string') {
            return unwrapped.asset || '';
        }
        if (isImageAssetObject(unwrapped.asset)) {
            return unwrapped.asset[imageSrcKey(unwrapped.asset)] || '';
        }
    }
    if (value && typeof value === 'object' && typeof value.src === 'string') return value.src;
    if (value && typeof value === 'object' && value.image) {
        return readImageSrc(value.image);
    }
    return '';
};

const isLikelyImageUrl = (raw) => {
    if (typeof raw !== 'string') return false;

    const value = raw.trim();
    if (!value) return false;

    if (/^data:image\//i.test(value)) return true;

    const imageExt = /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)(?:$|[?#])/i;
    if (imageExt.test(value)) return true;

    try {
        const parsed = new URL(value);
        const host = parsed.hostname.toLowerCase();

        const knownImageHosts = [
            'images.unsplash.com',
            'source.unsplash.com',
            'images.pexels.com',
            'res.cloudinary.com',
            'i.imgur.com',
            'cdn.pixabay.com',
        ];

        if (knownImageHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
            return true;
        }

        if (host.includes('amazonaws.com') || host.includes('cloudfront.net')) {
            return true;
        }

        if (imageExt.test(parsed.pathname)) return true;

        const imageHintParams = ['format', 'fm', 'fit', 'crop', 'w', 'h', 'q', 'auto'];
        const hasImageHints = imageHintParams.some((param) => parsed.searchParams.has(param));
        if (hasImageHints && parsed.protocol.startsWith('http')) return true;
    } catch {
        // ignore
    }

    return false;
};

const detectFieldType = (key, value) => {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';

    if (typeof value === 'string') {
        const v = value.trim();
        const keyLower = String(key || '').toLowerCase();

        if (
            keyLower.includes('image') ||
            keyLower.includes('logo') ||
            keyLower.includes('photo') ||
            keyLower.includes('background') ||
            keyLower.includes('src') ||
            keyLower.includes('avatar') ||
            keyLower.includes('thumbnail') ||
            keyLower === 'favicon' ||
            keyLower === 'poster'
        ) {
            return 'image';
        }

        // Icon keys are images only when the value looks like a URL / data URI
        if (keyLower.includes('icon') && (isLikelyImageUrl(v) || v === '')) {
            return 'image';
        }

        if (isLikelyImageUrl(v)) return 'image';

        // Link targets often look like short hex (e.g. #abc) — keep them as text.
        if (
            keyLower === 'href' ||
            keyLower === 'url' ||
            keyLower === 'link' ||
            keyLower.endsWith('url') ||
            keyLower.endsWith('href') ||
            keyLower.endsWith('path')
        ) {
            return 'text';
        }

        const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
        if (hex.test(v)) return 'color';

        if (
            keyLower.includes('description') ||
            keyLower.includes('content') ||
            keyLower.includes('bio') ||
            keyLower.includes('about') ||
            keyLower.includes('summary') ||
            keyLower.includes('paragraph') ||
            keyLower.includes('quote') ||
            keyLower === 'text' ||
            keyLower === 'body'
        ) {
            return 'textarea';
        }

        if (v.length > 90 || v.includes('\n')) return 'textarea';

        return 'text';
    }

    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';

    return 'text';
};

const fieldSortPriority = (key) => {
    const k = String(key || '').toLowerCase();
    const ranked = [
        ['title', 0],
        ['headline', 1],
        ['name', 2],
        ['subtitle', 3],
        ['tagline', 4],
        ['description', 5],
        ['text', 6],
        ['content', 7],
        ['body', 8],
        ['buttontext', 9],
        ['cta', 10],
        ['buttonpath', 11],
        ['buttonlink', 12],
        ['href', 13],
        ['url', 14],
        ['link', 15],
        ['phone', 16],
        ['email', 17],
        ['address', 18],
    ];

    for (const [token, rank] of ranked) {
        if (k === token || k.includes(token)) return rank;
    }

    if (
        k.includes('image') ||
        k.includes('icon') ||
        k.includes('logo') ||
        k.includes('photo') ||
        k.includes('background') ||
        k.includes('avatar') ||
        k.includes('thumbnail')
    ) {
        return 80;
    }

    if (k.includes('color') || k.includes('gradient')) return 70;

    return 40;
};

const sortFieldEntries = (entries) =>
    [...entries].sort(([a], [b]) => {
        const diff = fieldSortPriority(a) - fieldSortPriority(b);
        if (diff !== 0) return diff;
        return String(a).localeCompare(String(b));
    });

const humanizeLabel = (key) => {
    const map = {
        buttonText: 'Button text',
        buttonPath: 'Button link',
        backgroundImage: 'Background image',
        bgImage: 'Background image',
        imageUrl: 'Image',
        img: 'Image',
        href: 'Link',
        url: 'Link',
        phone: 'Phone',
        email: 'Email',
        subtitle: 'Subtitle',
        description: 'Description',
        title: 'Title',
        line1: 'Line 1',
        line2: 'Line 2',
        eyebrow: 'Eyebrow',
        scrollText: 'Scroll text',
        socialLinks: 'Social links',
        copyright: 'Copyright',
        bottomLinks: 'Bottom links',
        primaryHover: 'Primary hover',
        bgLight: 'Light background',
        bgCard: 'Card background',
        textDark: 'Dark text',
        textMuted: 'Muted text',
        fontHeading: 'Heading font',
        fontBody: 'Body font',
        src: 'Image',
        alt: 'Alt text',
        label: 'Label',
        exploreLinks: 'Explore links',
        serviceLinks: 'Service links',
        quickLinks: 'Quick links',
        exploreTitle: 'Explore title',
        servicesTitle: 'Services title',
        quickLinksTitle: 'Quick links title',
        contactTitle: 'Contact title',
        socialTitle: 'Social title',
        logoMain: 'Logo title',
        logoSub: 'Logo script',
        quote: 'Quote',
        degrees: 'Degrees',
        role: 'Role',
        value: 'Value',
        features: 'Features',
        actions: 'Buttons',
        items: 'Items',
        media: 'Image',
        image: 'Image',
        poster: 'Image',
        posterImage: 'Image',
        backgroundMedia: 'Image',
        backgroundImage: 'Image',
        portrait: 'Portrait photo',
        video: 'Video',
        body: 'Body',
        text: 'Text',
        children: 'Sub links',
        sticky: 'Sticky header',
        primaryColor: 'Primary color',
        hoverColor: 'Hover color',
        mobileAction: 'Mobile button',
        branding: 'Branding',
        columns: 'Columns',
        links: 'Links',
        platform: 'Platform',
        lines: 'Lines',
        fields: 'Form fields',
        placeholder: 'Placeholder',
        required: 'Required',
        options: 'Options',
        name: 'Name',
        company: 'Company',
        author: 'Author',
        icon: 'Icon',
        mode: 'Mode',
        logo: 'Logo',
        address: 'Address',
        colors: 'Colors',
        typography: 'Typography',
        theme: 'Theme',
        contact: 'Contact',
        contactMail: 'Form inbox',
    };

    if (map[key]) return map[key];

    return String(key || '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
};

const isEditableLinkArrayKey = (key) => {
    const k = String(key || '').toLowerCase();
    if (!k) return false;
    return (
        k === 'columns' ||
        k === 'items' ||
        k === 'links' ||
        k === 'sociallinks' ||
        k === 'legallinks' ||
        k === 'bottomlinks' ||
        k.endsWith('links') ||
        k.includes('link')
    );
};

const defaultItemForArrayKey = (key) => {
    const k = String(key || '').toLowerCase();
    if (k === 'columns') {
        return {
            id: `column-${Date.now()}`,
            title: 'New column',
            links: [{ id: `link-${Date.now()}`, label: 'New link', url: '#', href: '#' }],
        };
    }
    if (k === 'sociallinks') {
        return {
            id: `social-${Date.now()}`,
            platform: 'instagram',
            label: 'Instagram',
            url: '#',
            href: '#',
            target: '_blank',
        };
    }
    if (isEditableLinkArrayKey(k)) {
        return {
            id: `link-${Date.now()}`,
            label: 'New link',
            url: '#',
            href: '#',
        };
    }
    return {};
};

const FieldRenderer = ({
    obj,
    path = [],
    handleFieldChange,
    addArrayItem,
    removeArrayItem,
    variant = 'light',
    flat = false,
    assetBaseUrl = '',
    onFieldFocus,
}) => {
    if (obj === null || obj === undefined) return null;

    const emitFieldFocus = (focusPath, value) => {
        if (typeof onFieldFocus !== 'function') return;
        const fieldPath = focusPath || path;
        onFieldFocus({
            path: fieldPath,
            fieldId: Array.isArray(fieldPath) ? fieldPath.join('.') : String(fieldPath || ''),
            // String array leaves use numeric path ends ("0","1") — keep parent key for matching
            fieldKey: (() => {
                if (!Array.isArray(fieldPath) || !fieldPath.length) return fieldPath;
                const last = fieldPath[fieldPath.length - 1];
                if (typeof last === 'number' || /^\d+$/.test(String(last))) {
                    const parent = fieldPath[fieldPath.length - 2];
                    return parent != null ? String(parent) : String(last);
                }
                return String(last);
            })(),
            value,
        });
    };

    const nestClass = flat
        ? 'border-b border-white/[0.06] py-3'
        : variant === 'dark'
          ? 'mb-4 rounded-lg p-3 border border-white/[0.08] bg-white/[0.02]'
          : 'mb-4 rounded-lg p-3 border border-[#333] bg-[#111]';

    const arrayItemClass = flat
        ? 'border-b border-white/[0.06] py-3'
        : variant === 'dark'
          ? 'rounded-lg p-3 border border-white/[0.08] bg-white/[0.02]'
          : 'rounded-lg p-3 border border-[#333] bg-[#1a1a1a]';

    const leafClass = flat
        ? 'py-3 border-b border-white/[0.06]'
        : 'mb-3';

    if (Array.isArray(obj)) {
        const arrayKey = path[path.length - 1];
        const keepEmpty = isEditableLinkArrayKey(arrayKey);

        // Empty lists for generic content stay hidden; link columns stay so users can add items.
        if (obj.length === 0 && !keepEmpty) return null;

        const handleAdd = () => {
            if (typeof addArrayItem === 'function') {
                // If empty, seed a useful default first then add via parent path logic.
                if (obj.length === 0) {
                    handleFieldChange(path, [defaultItemForArrayKey(arrayKey)]);
                    return;
                }
                addArrayItem(path);
                return;
            }
            handleFieldChange(path, [...obj, defaultItemForArrayKey(arrayKey)]);
        };

        return (
            <div className={flat ? 'divide-y divide-white/[0.06]' : 'space-y-3'}>
                {obj.map((item, i) => {
                    let itemLabel = `Item ${i + 1}`;
                    if (item && typeof item === 'object') {
                        if (item.editorLabel) itemLabel = item.editorLabel;
                        else if (typeof item.title === 'string' && item.title) itemLabel = item.title;
                        else if (item.title && typeof item.title === 'object') {
                            const joined = [item.title.line1, item.title.line2]
                                .filter(Boolean)
                                .join(' ');
                            if (joined) itemLabel = joined;
                        }                         else if (item.name) itemLabel = item.name;
                        else if (item.label) itemLabel = item.label;
                        else if (typeof item.text === 'string' && item.text) {
                            itemLabel =
                                item.text.length > 48
                                    ? `${item.text.slice(0, 48).trim()}…`
                                    : item.text;
                        }
                        else if (item.author?.name) itemLabel = item.author.name;
                    }

                    return (
                    <div
                        key={item?.id || i}
                        className={arrayItemClass}
                    >
                        <div className={`flex justify-between ${flat ? 'mb-2' : 'mb-2'}`}>
                            <span
                                className={`text-xs ${
                                    variant === 'dark' ? 'text-white/40' : 'text-gray-400'
                                }`}
                            >
                                {itemLabel}
                            </span>
                            {typeof removeArrayItem === 'function' && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(path, i)}
                                    className="text-red-400 text-xs hover:text-red-300 transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <FieldRenderer
                            obj={item}
                            path={[...path, i]}
                            handleFieldChange={handleFieldChange}
                            addArrayItem={addArrayItem}
                            removeArrayItem={removeArrayItem}
                            variant={variant}
                            flat={flat}
                            assetBaseUrl={assetBaseUrl}
                            onFieldFocus={onFieldFocus}
                        />
                    </div>
                    );
                })}
                {(keepEmpty || typeof addArrayItem === 'function') && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className={`text-xs font-medium px-2 py-1.5 rounded border transition-colors ${
                            variant === 'dark'
                                ? 'text-sky-300 border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20'
                                : 'text-sky-600 border-sky-300 bg-sky-50 hover:bg-sky-100'
                        }`}
                    >
                        + Add {humanizeLabel(arrayKey) || 'item'}
                    </button>
                )}
            </div>
        );
    }

    if (typeof obj === 'object') {
        // { src, alt, fit, focalPoint } or CMS wrapper { id, image: asset } → one uploader
        const rootUnwrap = unwrapImageContainer(obj);
        if (rootUnwrap && rootUnwrap.relativePath.length === 0 && isImageAssetObject(obj)) {
            const srcKey = imageSrcKey(obj);
            const srcPath = [...path, srcKey];
            const labelKey = path[path.length - 1];
            const label = isImageLikeKey(labelKey) ? 'Image' : humanizeLabel(labelKey);
            return (
                <div className={leafClass}>
                    <ImageField
                        label={label}
                        value={obj[srcKey] || ''}
                        onChange={(v) => handleFieldChange(srcPath, v)}
                        variant={variant}
                        assetBaseUrl={assetBaseUrl}
                        onFocusField={(v) => emitFieldFocus(srcPath, v)}
                    />
                </div>
            );
        }

        // Pure wrapper object at this node (e.g. timeline item image: { id, image: asset })
        if (
            rootUnwrap &&
            Object.keys(obj).every(
                (k) =>
                    shouldHideKey(k, path) ||
                    k === rootUnwrap.relativePath[0] ||
                    IMAGE_WRAPPER_META_KEYS.has(k),
            ) &&
            // Only collapse pure image wrappers — keep containers that have real text meta
            !Object.keys(obj).some(
                (k) =>
                    IMAGE_WRAPPER_EDITABLE_TEXT_KEYS.has(k) &&
                    obj[k] != null &&
                    obj[k] !== '',
            )
        ) {
            const assetPath = [...path, ...rootUnwrap.relativePath];
            const labelKey = path[path.length - 1];
            const label = isImageLikeKey(labelKey) ? 'Image' : humanizeLabel(labelKey);
            const assetValue = rootUnwrap.asset;
            if (rootUnwrap.isString || typeof assetValue === 'string') {
                return (
                    <div className={leafClass}>
                        <ImageField
                            label={label}
                            value={assetValue || ''}
                            onChange={(v) => handleFieldChange(assetPath, v)}
                            variant={variant}
                            assetBaseUrl={assetBaseUrl}
                            onFocusField={(v) => emitFieldFocus(assetPath, v)}
                        />
                    </div>
                );
            }
            if (isImageAssetObject(assetValue)) {
                const srcKey = imageSrcKey(assetValue);
                const srcPath = [...assetPath, srcKey];
                return (
                    <div className={leafClass}>
                        <ImageField
                            label={label}
                            value={assetValue[srcKey] || ''}
                            onChange={(v) => handleFieldChange(srcPath, v)}
                            variant={variant}
                            assetBaseUrl={assetBaseUrl}
                            onFocusField={(v) => emitFieldFocus(srcPath, v)}
                        />
                    </div>
                );
            }
        }

        const commitImageAt = (fieldPath, previousValue, url) => {
            const key = fieldPath[fieldPath.length - 1];
            const parentKey = fieldPath.length > 1 ? fieldPath[fieldPath.length - 2] : null;

            if (String(key).toLowerCase() === 'media') {
                handleFieldChange(fieldPath, makeMediaObject(url, previousValue));
                return;
            }

            // Writing into a wrapper object that only holds nested image
            const unwrappedPrev = unwrapImageContainer(previousValue);
            if (
                unwrappedPrev &&
                unwrappedPrev.relativePath.length > 0 &&
                (isImageLikeKey(key) || key === unwrappedPrev.relativePath[0])
            ) {
                const assetPath = [...fieldPath, ...unwrappedPrev.relativePath];
                if (unwrappedPrev.isString || typeof unwrappedPrev.asset === 'string') {
                    handleFieldChange(assetPath, url);
                    return;
                }
                if (isImageAssetObject(unwrappedPrev.asset)) {
                    handleFieldChange(
                        assetPath,
                        makeImageAsset(url, unwrappedPrev.asset),
                    );
                    return;
                }
            }

            if (isImageAssetObject(previousValue) || previousValue == null || previousValue === '') {
                if (
                    isImageLikeKey(key) &&
                    String(key).toLowerCase() !== 'src' &&
                    String(key).toLowerCase() !== 'favicon'
                ) {
                    handleFieldChange(fieldPath, makeImageAsset(url, previousValue));
                    // Logo text-mode → image-mode so the preview actually uses the upload
                    if (
                        parentKey === 'logo' ||
                        String(parentKey).toLowerCase() === 'logo'
                    ) {
                        handleFieldChange([...fieldPath.slice(0, -1), 'mode'], 'image');
                    }
                    return;
                }
            }

            if (isImageAssetObject(previousValue)) {
                const srcKey = imageSrcKey(previousValue);
                handleFieldChange([...fieldPath, srcKey], url);
                return;
            }

            handleFieldChange(fieldPath, url);
        };

        const renderImageUploader = (key, value, fieldPath, labelOverride = null) => (
            <div key={fieldPath.join('.')} className={leafClass}>
                <ImageField
                    label={labelOverride || (isImageLikeKey(key) ? 'Image' : humanizeLabel(key))}
                    value={readImageSrc(value)}
                    onChange={(url) => commitImageAt(fieldPath, value, url)}
                    variant={variant}
                    assetBaseUrl={assetBaseUrl}
                    onFocusField={(v) => emitFieldFocus(fieldPath, v)}
                />
            </div>
        );

        /** Render image-like key as a single uploader (+ optional caption fields). */
        const renderCollapsedImageField = (key, value, fieldPath) => {
            if (value == null || value === '') {
                return renderImageUploader(key, value, fieldPath);
            }
            if (typeof value === 'string' || isImageAssetObject(value)) {
                return renderImageUploader(key, value, fieldPath);
            }
            const unwrapped = unwrapImageContainer(value);
            if (unwrapped) {
                const assetPath = [...fieldPath, ...unwrapped.relativePath];
                const uploader = renderImageUploader(
                    key,
                    unwrapped.asset,
                    assetPath,
                );
                const textEntries = Object.entries(value).filter(
                    ([k, v]) =>
                        IMAGE_WRAPPER_EDITABLE_TEXT_KEYS.has(k) &&
                        v != null &&
                        v !== '' &&
                        !shouldHideKey(k, fieldPath),
                );
                if (textEntries.length === 0) return uploader;
                return (
                    <div key={fieldPath.join('.')} className={nestClass}>
                        {uploader}
                        {textEntries.map(([textKey, textVal]) => (
                            <FieldRenderer
                                key={[...fieldPath, textKey].join('.')}
                                obj={textVal}
                                path={[...fieldPath, textKey]}
                                handleFieldChange={handleFieldChange}
                                addArrayItem={addArrayItem}
                                removeArrayItem={removeArrayItem}
                                variant={variant}
                                flat={flat}
                                assetBaseUrl={assetBaseUrl}
                                onFieldFocus={onFieldFocus}
                            />
                        ))}
                    </div>
                );
            }
            return null;
        };

        return sortFieldEntries(
            Object.entries(obj).filter(([key, value]) => {
                if (shouldHideKey(key, path)) return false;
                // Nested poster next to a real image / media bag — hide duplicate uploader
                if (
                    String(key).toLowerCase() === 'poster' &&
                    (obj.image != null || obj.media != null || obj.photo != null)
                ) {
                    return false;
                }
                // Keep empty link arrays that templates actually use (exploreLinks, etc.).
                // Empty columns / legalLinks are noise for invitation-style footers.
                if (Array.isArray(value) && value.length === 0) {
                    const k = String(key || '').toLowerCase();
                    if (k === 'columns' || k === 'legallinks' || k === 'bottomlinks') {
                        return false;
                    }
                    return isEditableLinkArrayKey(key);
                }
                // Keep null/empty image slots so every image is uploadable
                if (value === null || value === undefined || value === '') {
                    // Don't show empty poster / alt alone under non-media objects
                    const k = String(key || '').toLowerCase();
                    if (k === 'poster' || k === 'alt') return false;
                    return isImageLikeKey(key);
                }
                return true;
            }),
        ).map(([key, value]) => {
                const newPath = [...path, key];

                // media / image / portrait bags → single uploader (no Image > Image nesting)
                if (isImageLikeKey(key)) {
                    const collapsed = renderCollapsedImageField(key, value, newPath);
                    if (collapsed) return collapsed;
                }

                if (value == null || value === '') {
                    return null;
                }

                // Nested objects get a labeled group.
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Array items that are pure image wrappers still collapse via root unwrap above
                    return (
                        <div
                            key={newPath.join('.')}
                            className={nestClass}
                        >
                            <div
                                className={`text-xs font-medium ${flat ? 'mb-2 text-white/45' : 'mb-3'} ${
                                    !flat && (variant === 'dark' ? 'text-white/55' : 'text-blue-400')
                                }`}
                            >
                                {humanizeLabel(key)}
                            </div>
                            <FieldRenderer
                                obj={value}
                                path={newPath}
                                handleFieldChange={handleFieldChange}
                                addArrayItem={addArrayItem}
                                removeArrayItem={removeArrayItem}
                                variant={variant}
                                flat={flat}
                                assetBaseUrl={assetBaseUrl}
                                onFieldFocus={onFieldFocus}
                            />
                        </div>
                    );
                }

                // Arrays (including link lists) — show section title + items.
                if (Array.isArray(value)) {
                    return (
                        <div
                            key={newPath.join('.')}
                            className={nestClass}
                        >
                            <div
                                className={`text-xs font-medium ${flat ? 'mb-2 text-white/45' : 'mb-3'} ${
                                    !flat && (variant === 'dark' ? 'text-white/55' : 'text-blue-400')
                                }`}
                            >
                                {humanizeLabel(key)}
                            </div>
                            <FieldRenderer
                                obj={value}
                                path={newPath}
                                handleFieldChange={handleFieldChange}
                                addArrayItem={addArrayItem}
                                removeArrayItem={removeArrayItem}
                                variant={variant}
                                flat={flat}
                                assetBaseUrl={assetBaseUrl}
                                onFieldFocus={onFieldFocus}
                            />
                        </div>
                    );
                }

                return (
                    <FieldRenderer
                        key={newPath.join('.')}
                        obj={value}
                        path={newPath}
                        handleFieldChange={handleFieldChange}
                        addArrayItem={addArrayItem}
                        removeArrayItem={removeArrayItem}
                        variant={variant}
                        flat={flat}
                        assetBaseUrl={assetBaseUrl}
                        onFieldFocus={onFieldFocus}
                    />
                );
            });
    }

    const fieldKey = path[path.length - 1];
    if (shouldHideKey(fieldKey, path)) return null;

    const type = detectFieldType(fieldKey, obj);
    const label = humanizeLabel(fieldKey);

    if (type === 'image') {
        return (
            <div className={leafClass}>
                <ImageField
                    label={label}
                    value={obj}
                    onChange={(v) => handleFieldChange(path, v)}
                    variant={variant}
                    assetBaseUrl={assetBaseUrl}
                    onFocusField={(v) => emitFieldFocus(path, v)}
                />
            </div>
        );
    }

    return (
        <div className={leafClass}>
            <InputField
                label={label}
                value={obj}
                type={type}
                onChange={(v) => handleFieldChange(path, v)}
                variant={variant}
                onFocusField={(v) => emitFieldFocus(path, v)}
            />
        </div>
    );
};

export default FieldRenderer;
