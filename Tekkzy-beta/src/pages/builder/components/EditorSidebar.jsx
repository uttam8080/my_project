import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiSettings, FiX } from 'react-icons/fi';
import FieldRenderer from './FieldRenderer';
import {
    getCommonEditorSections,
    getSiteContactEditorSection,
    ensureSiteContactShape,
    isCommonSchema,
    resolveEditorSectionData,
    humanize,
    getAtPath,
} from '../../../utils/commonSchemaEditor';
import { getTemplateSectionIgnoreKeys } from '../../../utils/templateUtils';
import InputField from '../../product/components/InputField';

// Legacy flat schemas (hero/navbar/about...) — keep previous ordering.
const SECTION_ORDER = [
    'navbar',
    'nav',
    'header',
    'brand',
    'hero',
    'banner',
    'about',
    'stay',
    'services',
    'features',
    'rooms',
    'menu',
    'gallery',
    'pricing',
    'plans',
    'booking',
    'events',
    'testimonial',
    'customervoice',
    'voices',
    'review',
    'faq',
    'team',
    'blog',
    'contact',
];

const sectionRank = (name) => {
    const key = String(name).toLowerCase().replace(/[^a-z]/g, '');
    if (key.includes('footer')) return 1000;
    const index = SECTION_ORDER.findIndex((token) => key.includes(token));
    return index === -1 ? 500 : index;
};

const buildLegacySections = (data) => {
    if (!data || typeof data !== 'object') return [getSiteContactEditorSection()];
    const ignore = new Set(getTemplateSectionIgnoreKeys());
    // Extra builder-only / non-content roots
    ;[
        'institutionId',
        'InstitutionId',
        's3',
        'locale',
        'colors',
    ].forEach((k) => ignore.add(k));

    const sections = [getSiteContactEditorSection()];
    Object.keys(data)
        .filter((key) => !ignore.has(key) && key !== 'site')
        .sort((a, b) => {
            const diff = sectionRank(a) - sectionRank(b);
            if (diff !== 0) return diff;
            return String(a).localeCompare(String(b));
        })
        .forEach((key) => {
            // Only objects/arrays are editable sections (skip bare strings / numbers).
            const value = data[key];
            if (value == null) return;
            if (typeof value !== 'object') return;
            // Theme is optional palette data. Do not list it in the sidebar —
            // content schemas (and many site saves) still carry a leftover
            // `theme` object that shouldn't look like a page section.
            // Color recolor still runs in the preview when theme.colors exist.
            if (key === 'theme') return;
            const isGlobal = key === 'theme' || key === 'navigation' || key === 'footer';
            sections.push({
                id: key,
                label: humanize(key),
                shortLabel: humanize(key),
                group: isGlobal ? 'Global' : 'Content',
                groupOrder: isGlobal ? 0 : 1,
                path: [key],
                // Theme has no on-page section — editor-only controls.
                scrollId: key === 'theme' ? null : key,
                scrollAliases: key === 'theme' ? [] : [key],
                kind: key === 'theme' ? 'global' : key === 'site' ? 'site' : 'section',
            });
        });
    // Full site object (name, social, …) if present — Site contact is separate above.
    if (data.site && typeof data.site === 'object') {
        sections.splice(1, 0, {
            id: 'site',
            label: 'Site settings',
            shortLabel: 'Site settings',
            group: 'Global',
            groupOrder: 0,
            path: ['site'],
            scrollId: null,
            scrollAliases: [],
            kind: 'site',
        });
    }
    return sections;
};

export function buildEditorSections(data) {
    const shaped = ensureSiteContactShape(data);
    if (isCommonSchema(shaped)) {
        return getCommonEditorSections(shaped).map((section) => ({
            ...section,
            kind:
                section.kind ||
                (section.id === 'site' || section.id === 'site-contact'
                    ? 'site'
                    : section.path?.[0] === 'pages'
                      ? 'page-section'
                      : 'global'),
        }));
    }
    return buildLegacySections(shaped);
}

const EditorSidebar = ({
    isOpen = true,
    onClose,
    sections: sectionsProp,
    activeSection,
    setActiveSection,
    editedData,
    handleFieldChange,
    addArrayItem,
    removeArrayItem,
    goToSection,
    onFieldFocus,
    focusRequest = null,
    onClearFocusRequest = null,
    assetBaseUrl = '',
}) => {
    const editorSections = useMemo(() => {
        if (Array.isArray(sectionsProp) && sectionsProp.length > 0) {
            if (typeof sectionsProp[0] === 'string') {
                return sectionsProp.map((key) => ({
                    id: key,
                    label: humanize(key),
                    shortLabel: humanize(key),
                    group: 'Content',
                    groupOrder: 1,
                    path: [key],
                    scrollId: key,
                    scrollAliases: [key],
                    kind: key === 'site' ? 'site' : 'section',
                }));
            }
            return sectionsProp;
        }
        return buildEditorSections(editedData);
    }, [sectionsProp, editedData]);

    const [panelView, setPanelView] = useState('list'); // 'list' | 'edit'
    const lastFocusNonceRef = useRef(null);

    // Preview → sidebar: force drill-in when parent asks to focus a section.
    // Only apply once per nonce — do NOT re-run when editorSections identity
    // changes (that used to snap Studio/Services back to Site settings).
    useEffect(() => {
        if (!focusRequest?.sectionId || !focusRequest?.nonce) return;
        if (lastFocusNonceRef.current === focusRequest.nonce) return;
        lastFocusNonceRef.current = focusRequest.nonce;

        const match = editorSections.find(
            (section) => section.id === focusRequest.sectionId,
        );
        if (!match) return;
        setActiveSection(match.id);
        setPanelView('edit');
    }, [focusRequest, editorSections, setActiveSection]);

    const active = useMemo(
        () =>
            editorSections.find((section) => section.id === activeSection) ||
            null,
        [editorSections, activeSection],
    );

    const resolved = useMemo(() => {
        if (!active || !editedData) return null;
        const shaped = ensureSiteContactShape(editedData);
        if (active.id === 'site-contact' || active.editorMode === 'site-contact') {
            return {
                data: {
                    email: shaped.site?.contact?.email || '',
                    phone: shaped.site?.contact?.phone || '',
                    address: shaped.site?.contact?.address || '',
                    contactMail: shaped.site?.contactMail || '',
                },
                path: ['site'],
                enabledPath: null,
                mode: 'site-contact',
            };
        }
        if (isCommonSchema(shaped)) {
            return resolveEditorSectionData(shaped, active);
        }
        const node = getAtPath(shaped, active.path);
        if (!node) return null;
        return { data: node, path: active.path, enabledPath: null };
    }, [active, editedData]);

    // Keep edit view when the active section still exists after data updates.
    useEffect(() => {
        if (panelView === 'edit' && activeSection && !active) {
            setPanelView('list');
        }
    }, [panelView, activeSection, active]);

    const siteSection = useMemo(
        () =>
            editorSections.find((s) => s.id === 'site-contact') ||
            editorSections.find((s) => s.id === 'site' || s.kind === 'site') ||
            null,
        [editorSections],
    );

    const listSections = useMemo(() => {
        // Flat vertical list — Site settings stays in the list (and via gear).
        return editorSections;
    }, [editorSections]);

    const openSection = (section) => {
        if (!section) return;
        setActiveSection(section.id);
        setPanelView('edit');
        // Clear stale preview focus so it can't snap back to Site settings.
        if (typeof onClearFocusRequest === 'function') {
            onClearFocusRequest();
        }
        // Meta / global styling is not a page section — scrolling the preview
        // for "theme" under a multi-segment path used to hard-navigate the iframe
        // to a broken URL and blank the canvas.
        const id = String(section.id || '').toLowerCase();
        const isMetaOnly =
            section.kind === 'site' ||
            section.editorMode === 'site-contact' ||
            id === 'site' ||
            id === 'site-contact' ||
            id === 'theme' ||
            id === 'schemaversion' ||
            id === 'institutionid' ||
            id === 'template' ||
            section.scrollId === null;
        if (!isMetaOnly && typeof goToSection === 'function') {
            goToSection(section);
        }
    };

    const goBackToList = () => {
        setPanelView('list');
        if (typeof onFieldFocus === 'function') {
            onFieldFocus(null);
        }
    };

    const openSiteSettings = () => {
        if (siteSection) openSection(siteSection);
    };

    const sectionNode =
        active && editedData ? getAtPath(editedData, active.path) : null;
    const hasEnabledToggle =
        sectionNode &&
        typeof sectionNode === 'object' &&
        typeof sectionNode.enabled === 'boolean';

    const rowIcon = (section) => {
        if (
            section.id === 'site' ||
            section.id === 'site-contact' ||
            section.kind === 'site'
        ) {
            return <FiSettings size={14} className="text-white/35 shrink-0" />;
        }
        return (
            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" aria-hidden />
        );
    };

    return (
        <>
            <button
                type="button"
                aria-label="Close editor sidebar"
                className={`fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 md:z-auto w-[min(340px,100vw)] md:w-[340px] bg-[#0a0a0a] border-r border-[#1f1f1f] shrink-0 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                {/* Sidebar chrome */}
                <div className="flex items-center justify-between gap-2 px-3 h-12 border-b border-[#1f1f1f] shrink-0">
                    {panelView === 'edit' ? (
                        <button
                            type="button"
                            onClick={goBackToList}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-sky-300 bg-sky-500/15 border border-sky-400/30 hover:text-sky-200 hover:bg-sky-500/25 transition-colors min-w-0"
                        >
                            <FiArrowLeft size={15} className="shrink-0" />
                            <span className="truncate">Back</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[13px] font-medium text-white/90 truncate">
                                Customize
                            </span>
            </div>
                    )}

                    <div className="flex items-center gap-0.5 shrink-0">
                        {panelView === 'list' && siteSection && (
                            <button
                                type="button"
                                onClick={openSiteSettings}
                                className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                                aria-label="Site settings"
                                title="Site settings"
                            >
                                <FiSettings size={15} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="md:hidden p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                            aria-label="Close editor sidebar"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* List view */}
                {panelView === 'list' && (
                    <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                        {listSections.length === 0 ? (
                            <p className="text-center text-sm text-white/35 py-10 px-4">
                                No editable content found for this template.
                            </p>
                        ) : (
                            <ul className="py-1">
                                {listSections.map((section) => {
                                    const selected = active?.id === section.id;
                                    const hidden = section.sectionEnabled === false;
                                    const groupHint =
                                        section.group &&
                                        section.group !== 'Global' &&
                                        section.group !== 'Footer' &&
                                        section.kind === 'page-section'
                                            ? section.group
                                            : null;

                                    return (
                                        <li key={section.id}>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => openSection(section)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        openSection(section);
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-white/[0.04] cursor-pointer ${
                                                    selected
                                                        ? 'bg-white/[0.07]'
                                                        : 'hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                {rowIcon(section)}
                                                <span className="min-w-0 flex-1">
                                                    <span
                                                        className={`block text-[13px] truncate ${
                                                            hidden
                                                                ? 'text-white/35'
                                                                : 'text-white/85'
                                                        }`}
                                                    >
                                                        {section.shortLabel || section.label}
                                                        {hidden ? ' · Hidden' : ''}
                                                    </span>
                                                    {groupHint && (
                                                        <span className="block text-[10px] text-white/30 truncate mt-0.5">
                                                            {groupHint}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}

                {/* Field editing view */}
                {panelView === 'edit' && (
                    <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                        {active && resolved?.data ? (
                            <div>
                                <div className="px-4 py-3 border-b border-white/[0.06]">
                                    <p className="text-[13px] font-medium text-white">
                                        {active.shortLabel || active.label}
                                    </p>
                                    {active.group && active.group !== 'Global' && (
                                        <p className="text-[11px] text-white/35 mt-0.5">
                                            {active.group}
                                        </p>
                                    )}
            </div>

                                {hasEnabledToggle && (
                                    <label className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
                                        <span className="min-w-0">
                                            <span className="block text-[12px] text-white/70">
                                                Show this section
                                            </span>
                                            <span className="block text-[10px] text-white/30 mt-0.5 leading-snug">
                                                Live site only — preview stays visible while editing.
                                            </span>
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={!!sectionNode.enabled}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    [...active.path, 'enabled'],
                                                    e.target.checked,
                                                )
                                            }
                                            className="w-4 h-4 shrink-0"
                                        />
                                    </label>
                                )}

                                <div className="px-4 py-1">
                                    {resolved.mode === 'site-contact' ? (
                                        <div className="divide-y divide-white/[0.06]">
                                            <div className="py-3">
                                                <InputField
                                                    label="Public email"
                                                    value={resolved.data.email}
                                                    onChange={(v) =>
                                                        handleFieldChange(
                                                            ['site', 'contact', 'email'],
                                                            v,
                                                        )
                                                    }
                                                    variant="dark"
                                                    onFocusField={(v) =>
                                                        typeof onFieldFocus === 'function' &&
                                                        onFieldFocus({
                                                            path: ['site', 'contact', 'email'],
                                                            fieldId: 'site.contact.email',
                                                            fieldKey: 'email',
                                                            value: v,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="py-3">
                                                <InputField
                                                    label="Phone"
                                                    value={resolved.data.phone}
                                                    onChange={(v) =>
                                                        handleFieldChange(
                                                            ['site', 'contact', 'phone'],
                                                            v,
                                                        )
                                                    }
                                                    variant="dark"
                                                    onFocusField={(v) =>
                                                        typeof onFieldFocus === 'function' &&
                                                        onFieldFocus({
                                                            path: ['site', 'contact', 'phone'],
                                                            fieldId: 'site.contact.phone',
                                                            fieldKey: 'phone',
                                                            value: v,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="py-3">
                                                <InputField
                                                    label="Address"
                                                    value={resolved.data.address}
                                                    type="textarea"
                                                    onChange={(v) =>
                                                        handleFieldChange(
                                                            ['site', 'contact', 'address'],
                                                            v,
                                                        )
                                                    }
                                                    variant="dark"
                                                    onFocusField={(v) =>
                                                        typeof onFieldFocus === 'function' &&
                                                        onFieldFocus({
                                                            path: ['site', 'contact', 'address'],
                                                            fieldId: 'site.contact.address',
                                                            fieldKey: 'address',
                                                            value: v,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="py-3">
                                                <InputField
                                                    label="Form inbox (receives contact form emails)"
                                                    value={resolved.data.contactMail}
                                                    onChange={(v) =>
                                                        handleFieldChange(['site', 'contactMail'], v)
                                                    }
                                                    variant="dark"
                                                    onFocusField={(v) =>
                                                        typeof onFieldFocus === 'function' &&
                                                        onFieldFocus({
                                                            path: ['site', 'contactMail'],
                                                            fieldId: 'site.contactMail',
                                                            fieldKey: 'contactMail',
                                                            value: v,
                                                        })
                                                    }
                                                />
                                                <p className="text-[10px] text-white/30 mt-2 leading-snug">
                                                    Shown on the site and used when visitors submit
                                                    the contact form. Available for every template.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                         <FieldRenderer
                                            obj={resolved.data}
                                            path={resolved.path}
                            handleFieldChange={handleFieldChange}
                            addArrayItem={addArrayItem}
                            removeArrayItem={removeArrayItem}
                                            variant="dark"
                                            flat
                                            assetBaseUrl={assetBaseUrl}
                                            onFieldFocus={onFieldFocus}
                         />
                                    )}
                                </div>
                    </div>
                ) : (
                            <p className="text-center text-sm text-white/35 py-10 px-4">
                                Nothing to edit in this section.
                    </p>
                )}
            </div>
                )}
        </aside>
        </>
    );
};

export default EditorSidebar;
