import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    FiArrowLeft,
    FiMonitor,
    FiSmartphone,
    FiCheck,
    FiShuffle,
    FiAlertTriangle,
    FiX,
    FiSliders,
    FiRotateCcw,
    FiRotateCw,
} from 'react-icons/fi';
import { useApi } from '../../context/ApiContext';
import { useAuth } from '../../context/AuthContext';
import { resolveScrollMessage, collectSectionMatchTexts, ensureSiteContactShape, hasContentEditorSections, mergeFooterData, footerMissingEditableLinks, ensureFooterEditorShape } from '../../utils/commonSchemaEditor';
import { extractTemplateContent, parseGetSiteResponse, resolveSiteDisplayName, resolveSiteTemplate, resolveEditableTemplatePreviewUrl, preferProductsTemplateUrl } from '../../utils/templateUtils';
import { buildEditorSections } from './components/EditorSidebar';

import PreviewFrame from './components/PreviewFrame';
import EditorSidebar from './components/EditorSidebar';
import FloatingNotice from '../../components/common/FloatingNotice';

const HISTORY_LIMIT = 40;
const HISTORY_DEBOUNCE_MS = 450;

const BuilderPage = () => {
    const { siteId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        updateSiteData,
        deploySite,
        switchSiteTemplate,
        getSite,
        templatesList,
        listUserSites,
        listTemplates,
    } = useApi();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [site, setSite] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [isLoadingSite, setIsLoadingSite] = useState(true);
    const [hasLoadedSite, setHasLoadedSite] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [deviceView, setDeviceView] = useState("desktop");
    const [iframeKey, setIframeKey] = useState(0);

    // Master editing state
    const [editedData, setEditedData] = useState({});
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [switchingTemplate, setSwitchingTemplate] = useState(false);
    const [notice, setNotice] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [sections, setSections] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [scrollRequest, setScrollRequest] = useState(null);
    const [fieldSelection, setFieldSelection] = useState(null);
    const [sidebarFocusRequest, setSidebarFocusRequest] = useState(null);
    const noticeTimerRef = useRef(null);
    const pendingTemplateDataRef = useRef(location.state?.initialTemplateData || null);
    const siteLoadAttemptRef = useRef(0);
    const getSiteRef = useRef(getSite);
    const listUserSitesRef = useRef(listUserSites);
    const templatesListRef = useRef(templatesList);
    const historyRef = useRef({ past: [], present: null, future: [] });
    const historyTimerRef = useRef(null);
    const applyingHistoryRef = useRef(false);
    const editedDataRef = useRef({});
    const sidebarSelectLockRef = useRef(0);

    getSiteRef.current = getSite;
    listUserSitesRef.current = listUserSites;
    templatesListRef.current = templatesList;
    editedDataRef.current = editedData;

    const resolvePreviewUrl = useCallback((siteRecord, fallbackTemplateUrl, templateList = templatesListRef.current) => {
        // Prefer products.tekkzy.com/<slug> so the highlight bridge is present.
        const resolved = resolveEditableTemplatePreviewUrl(
            siteRecord,
            fallbackTemplateUrl,
            templateList || [],
        );
        return preferProductsTemplateUrl(resolved) || resolved;
    }, []);

    const displaySiteName = resolveSiteDisplayName(site, templatesList, editedData);

    const showNotice = useCallback((type, message, timeout = 2800) => {
        if (noticeTimerRef.current) {
            clearTimeout(noticeTimerRef.current);
        }

        setNotice({ type, message });

        noticeTimerRef.current = setTimeout(() => {
            setNotice(null);
            noticeTimerRef.current = null;
        }, timeout);
    }, []);

    useEffect(() => {
        return () => {
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
            }
            clearTimeout(historyTimerRef.current);
        };
    }, []);

    useEffect(() => {
        pendingTemplateDataRef.current = location.state?.initialTemplateData || null;
    }, [location.state]);

    useEffect(() => {
        if (!templatesList?.length) {
            listTemplates({ force: true, limit: 50, includeCategories: false }).catch(() => {});
        }
    }, [templatesList, listTemplates]);

    useEffect(() => {
        setHasLoadedSite(false);
                setIsLoadingSite(true);
        setSite(null);
        setEditedData({});
        setActiveSection(null);
        setSections([]);
        setLoadError(null);
        setIsSidebarOpen(true);
        historyRef.current = { past: [], present: null, future: [] };
        setCanUndo(false);
        setCanRedo(false);
    }, [siteId]);

    const getSections = useCallback((data) => {
        if (!data || typeof data !== "object") return [];
        return buildEditorSections(ensureSiteContactShape(data));
    }, []);

    const cloneData = useCallback((value) => {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch {
            return { ...(value || {}) };
        }
    }, []);

    const syncHistoryFlags = useCallback(() => {
        const hist = historyRef.current;
        setCanUndo(hist.past.length > 0);
        setCanRedo(hist.future.length > 0);
    }, []);

    const resetHistory = useCallback((data) => {
        clearTimeout(historyTimerRef.current);
        historyRef.current = {
            past: [],
            present: cloneData(data),
            future: [],
        };
        syncHistoryFlags();
    }, [cloneData, syncHistoryFlags]);

    const commitHistorySnapshot = useCallback((nextData) => {
        if (applyingHistoryRef.current) return;

        const hist = historyRef.current;
        const snapshot = cloneData(nextData);
        const current = hist.present;

        try {
            if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
                return;
            }
        } catch {
            // continue
        }

        if (current) {
            hist.past.push(current);
            if (hist.past.length > HISTORY_LIMIT) {
                hist.past.shift();
            }
        }
        hist.present = snapshot;
        hist.future = [];
        syncHistoryFlags();
    }, [cloneData, syncHistoryFlags]);

    const scheduleHistoryCommit = useCallback((nextData) => {
        clearTimeout(historyTimerRef.current);
        historyTimerRef.current = setTimeout(() => {
            commitHistorySnapshot(nextData);
        }, HISTORY_DEBOUNCE_MS);
    }, [commitHistorySnapshot]);

    const applyHistoryData = useCallback((data) => {
        applyingHistoryRef.current = true;
        clearTimeout(historyTimerRef.current);
        const next = cloneData(data);
        setEditedData(next);
        queueMicrotask(() => {
            applyingHistoryRef.current = false;
        });
    }, [cloneData]);

    const flushPendingHistory = useCallback(() => {
        clearTimeout(historyTimerRef.current);
        commitHistorySnapshot(editedDataRef.current);
    }, [commitHistorySnapshot]);

    const handleUndo = useCallback(() => {
        flushPendingHistory();
        const hist = historyRef.current;
        if (!hist.past.length) {
            syncHistoryFlags();
            return;
        }

        const previous = hist.past.pop();
        if (hist.present) {
            hist.future.unshift(hist.present);
        }
        hist.present = previous;
        applyHistoryData(previous);
        syncHistoryFlags();
    }, [flushPendingHistory, applyHistoryData, syncHistoryFlags]);

    const handleRedo = useCallback(() => {
        flushPendingHistory();
        const hist = historyRef.current;
        if (!hist.future.length) {
            syncHistoryFlags();
            return;
        }

        const next = hist.future.shift();
        if (hist.present) {
            hist.past.push(hist.present);
            if (hist.past.length > HISTORY_LIMIT) {
                hist.past.shift();
            }
        }
        hist.present = next;
        applyHistoryData(next);
        syncHistoryFlags();
    }, [flushPendingHistory, applyHistoryData, syncHistoryFlags]);

    const resolveInitialEditedData = useCallback((siteRecord, siteData, templateList) => {
        const savedData = siteData && typeof siteData === "object" ? siteData : {};
        // Site contact alone does NOT count — otherwise incomplete saves never
        // hydrate from the template and the sidebar only shows Site contact/settings.
        if (hasContentEditorSections(savedData)) {
            // Sites already edited still need new template footer fields
            // (link columns, gallery, etc.) merged in when missing.
            const baseTemplate = resolveSiteTemplate(templateList, siteRecord);
            if (baseTemplate) {
                const fromTemplate = extractTemplateContent(baseTemplate);
                if (fromTemplate?.footer) {
                    return ensureSiteContactShape({
                        ...savedData,
                        footer: mergeFooterData(savedData.footer, fromTemplate.footer),
                    });
                }
            }
            return ensureSiteContactShape(savedData);
        }

        const pendingTemplateData = pendingTemplateDataRef.current;
        if (pendingTemplateData && hasContentEditorSections(pendingTemplateData)) {
            return ensureSiteContactShape({
                ...pendingTemplateData,
                ...savedData,
                site: {
                    ...(pendingTemplateData.site || {}),
                    ...(savedData.site || {}),
                    contact: {
                        ...(pendingTemplateData.site?.contact || {}),
                        ...(savedData.site?.contact || {}),
                    },
                },
            });
        }

        const baseTemplate = resolveSiteTemplate(templateList, siteRecord);
        if (baseTemplate) {
            const fromTemplate = extractTemplateContent(baseTemplate);
            if (hasContentEditorSections(fromTemplate)) {
                return ensureSiteContactShape({
                    ...fromTemplate,
                    ...savedData,
                    site: {
                        ...(fromTemplate.site || {}),
                        ...(savedData.site || {}),
                        contact: {
                            ...(fromTemplate.site?.contact || {}),
                            ...(savedData.site?.contact || {}),
                        },
                    },
                    pages: fromTemplate.pages || savedData.pages,
                    navigation: savedData.navigation || fromTemplate.navigation,
                    footer: mergeFooterData(savedData.footer, fromTemplate.footer),
                });
            }
        }

        return ensureSiteContactShape(savedData);
    }, []);

    const getBuilderBootstrap = useCallback(() => {
        const navState = location.state || {};
        return {
            initialTemplateData:
                pendingTemplateDataRef.current || navState.initialTemplateData || null,
            previewUrl: navState.previewUrl || "",
            templateId: navState.templateId,
            templateNo: navState.templateNo,
            templateName: navState.templateName,
        };
    }, [location.state]);

    const applyBuilderBootstrap = useCallback((bootstrap) => {
        if (
            !bootstrap?.initialTemplateData ||
            !hasContentEditorSections(bootstrap.initialTemplateData)
        ) {
            return false;
        }

        const stubSite = {
            siteId,
            templateId: bootstrap.templateId,
            templateNo: bootstrap.templateNo,
            name: bootstrap.templateName,
            status: "DRAFT",
            templateUrl: bootstrap.previewUrl,
        };

        setSite(stubSite);
        setPreviewUrl(
            bootstrap.previewUrl || resolvePreviewUrl(stubSite, bootstrap.previewUrl),
        );
        const bootData = cloneData(bootstrap.initialTemplateData);
        setEditedData(bootData);
        resetHistory(bootData);
        setLoadError(null);
        return true;
    }, [siteId, getSections, cloneData, resolvePreviewUrl, resetHistory]);

    useEffect(() => {
        if (hasLoadedSite) return;

        // Show the builder immediately when preview navigation already carried template data.
        applyBuilderBootstrap(getBuilderBootstrap());

        const loadAttempt = ++siteLoadAttemptRef.current;

        const loadSite = async () => {
            try {
                setLoadError(null);
                const res = await getSiteRef.current(siteId);
                if (loadAttempt !== siteLoadAttemptRef.current) return;

                const { site: siteRecord, siteData } = parseGetSiteResponse(res);
                const templateList = templatesListRef.current;

                if (siteRecord) {
                    setSite(siteRecord);

                    setPreviewUrl((prev) => {
                        const next = resolvePreviewUrl(
                            siteRecord,
                            prev || getBuilderBootstrap().previewUrl,
                        );
                        return next || prev;
                    });

                    const initialData = resolveInitialEditedData(
                        siteRecord,
                        siteData,
                        templateList,
                    );
                    const nextData = cloneData(initialData);
                    setEditedData(nextData);
                    resetHistory(nextData);
                } else if (applyBuilderBootstrap(getBuilderBootstrap())) {
                    // get-site returned no site record, but preview navigation carried template data
                } else {
                    const result = await listUserSitesRef.current(true);
                    const sites = result?.sites || [];
                    const listedSite = sites.find((item) => String(item.siteId) === String(siteId));

                    if (listedSite) {
                        setSite(listedSite);
                        setPreviewUrl(resolvePreviewUrl(listedSite));
                        const initialData = resolveInitialEditedData(listedSite, {}, templateList);
                        if (!hasContentEditorSections(initialData)) {
                            applyBuilderBootstrap(getBuilderBootstrap());
                        } else {
                            const nextData = cloneData(initialData);
                            setEditedData(nextData);
                            resetHistory(nextData);
                        }
                        setLoadError(null);
                    } else {
                    console.error("Site not found or invalid response", res);
                        if (loadAttempt === siteLoadAttemptRef.current) {
                            if (!applyBuilderBootstrap(getBuilderBootstrap())) {
                                setSite(null);
                                setLoadError("This site could not be found. It may have been deleted or never created.");
                            }
                        }
                    }
                }
            } catch (err) {
                 console.error("Error loading site", err);
                 if (loadAttempt !== siteLoadAttemptRef.current) return;

                 if (applyBuilderBootstrap(getBuilderBootstrap())) {
                    return;
                 }

                 try {
                    const result = await listUserSitesRef.current(true);
                    const sites = result?.sites || [];
                    const listedSite = sites.find((item) => String(item.siteId) === String(siteId));

                    if (listedSite) {
                        setSite(listedSite);
                        setPreviewUrl(resolvePreviewUrl(listedSite));
                        const initialData = resolveInitialEditedData(
                            listedSite,
                            {},
                            templatesListRef.current,
                        );
                        if (!hasContentEditorSections(initialData)) {
                            applyBuilderBootstrap(getBuilderBootstrap());
                        } else {
                            const nextData = cloneData(initialData);
                            setEditedData(nextData);
                            resetHistory(nextData);
                        }
                        setLoadError(null);
                        return;
                    }
                 } catch (recoverErr) {
                    console.warn("Could not recover site from list-user-sites", recoverErr);
                 }

                 setSite(null);
                 setLoadError(
                    err.message?.includes("signed in")
                        ? "Please sign in to open the builder."
                        : err.message || "Unable to load this site. Sign in and try again from your dashboard.",
                 );
            } finally {
                 if (loadAttempt === siteLoadAttemptRef.current) {
                    setIsLoadingSite(false);
                    setHasLoadedSite(true);
                 }
            }
        };

        if (siteId) {
            loadSite();
        }
    }, [
        siteId,
        hasLoadedSite,
        applyBuilderBootstrap,
        getBuilderBootstrap,
        resolvePreviewUrl,
        resolveInitialEditedData,
        cloneData,
        getSections,
        resetHistory,
    ]);

    useEffect(() => {
        if (!site || !templatesList?.length || hasContentEditorSections(editedData)) {
            return;
        }

        const hydratedData = resolveInitialEditedData(site, editedData, templatesList);
        if (hasContentEditorSections(hydratedData)) {
            const nextData = cloneData(hydratedData);
            setEditedData(nextData);
            resetHistory(nextData);
        }
    }, [site, templatesList, editedData, resolveInitialEditedData, cloneData, resetHistory]);

    // When saved site data is site-only, pull full schema from the live template data.json
    // (same source PreviewFrame uses) so the sidebar lists Hero / About / etc.
    const needsSectionHydration = !hasContentEditorSections(editedData);
    useEffect(() => {
        if (!previewUrl || !needsSectionHydration) return undefined;

        let cancelled = false;
        const controller = new AbortController();

        const hydrateFromTemplate = async () => {
            try {
                const base = String(previewUrl).split('?')[0].replace(/\/$/, '');
                const response = await fetch(`${base}/data.json`, {
                    signal: controller.signal,
                    cache: 'no-store',
                    mode: 'cors',
                    credentials: 'omit',
                });
                if (!response.ok) return;
                const json = await response.json();
                if (cancelled || !json || typeof json !== 'object') return;
                if (!hasContentEditorSections(json)) return;

                const current = editedDataRef.current || {};
                // Don't overwrite if content arrived while we were fetching.
                if (hasContentEditorSections(current)) return;

                const merged = ensureSiteContactShape({
                    ...json,
                    ...current,
                    site: {
                        ...(json.site || {}),
                        ...(current.site || {}),
                        contact: {
                            ...(json.site?.contact || {}),
                            ...(current.site?.contact || {}),
                        },
                        contactMail:
                            current.site?.contactMail ||
                            json.site?.contactMail ||
                            json.site?.contact?.email ||
                            '',
                    },
                    pages: json.pages || current.pages,
                    navigation: current.navigation || json.navigation,
                    footer: mergeFooterData(current.footer, json.footer),
                });
                if (cancelled || !hasContentEditorSections(merged)) return;
                setEditedData(merged);
                resetHistory(merged);
            } catch (err) {
                if (!cancelled && err?.name !== 'AbortError') {
                    console.warn('[BuilderPage] Could not hydrate sections from template data.json', err);
                }
            }
        };

        hydrateFromTemplate();
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [previewUrl, siteId, needsSectionHydration, resetHistory]);

    // Always seed missing footer link fields into editedData so the sidebar
    // can render Explore / Service / Quick link controls (ensureFooterEditorShape).
    useEffect(() => {
        if (!editedData || typeof editedData !== 'object') return;
        if (!editedData.footer || typeof editedData.footer !== 'object') return;
        if (!footerMissingEditableLinks(editedData.footer)) return;

        const shaped = ensureFooterEditorShape(editedData);
        if (footerMissingEditableLinks(shaped?.footer)) return;
        if (JSON.stringify(shaped.footer) === JSON.stringify(editedData.footer)) return;

        setEditedData(shaped);
    }, [editedData]);
    useEffect(() => {
        if (!previewUrl) return undefined;
        const footer = editedData?.footer;
        if (!footer || typeof footer !== 'object') return undefined;
        const hasGallery =
            Array.isArray(footer.gallery?.images) && footer.gallery.images.length > 0;
        const needsLinks = footerMissingEditableLinks(footer);
        if (hasGallery && !needsLinks) {
            return undefined;
        }

        let cancelled = false;
        const controller = new AbortController();

        const backfillFooter = async () => {
            try {
                const base = String(previewUrl).split('?')[0].replace(/\/$/, '');
                const response = await fetch(`${base}/data.json`, {
                    signal: controller.signal,
                    cache: 'no-store',
                    mode: 'cors',
                    credentials: 'omit',
                });
                if (!response.ok) return;
                const json = await response.json();
                if (cancelled || !json?.footer) return;

                const current = editedDataRef.current || {};
                const curFooter = current.footer;
                const curHasGallery =
                    Array.isArray(curFooter?.gallery?.images) &&
                    curFooter.gallery.images.length > 0;
                const curNeedsLinks = footerMissingEditableLinks(curFooter);
                const tplHasGallery =
                    Array.isArray(json.footer.gallery?.images) &&
                    json.footer.gallery.images.length > 0;
                const tplHasLinks = !footerMissingEditableLinks(json.footer);

                if (curHasGallery && !curNeedsLinks) return;
                if (!tplHasGallery && !tplHasLinks) return;

                const next = ensureSiteContactShape({
                    ...current,
                    footer: mergeFooterData(current.footer, json.footer),
                });
                if (cancelled) return;
                // Avoid loops when merge produces equivalent data
                const nextLinks = !footerMissingEditableLinks(next.footer);
                const nextGallery =
                    Array.isArray(next.footer?.gallery?.images) &&
                    next.footer.gallery.images.length > 0;
                if (
                    (!curNeedsLinks || !nextLinks) &&
                    (curHasGallery || !nextGallery)
                ) {
                    // Only skip if we didn't gain anything useful
                    if (
                        JSON.stringify(next.footer) === JSON.stringify(curFooter)
                    ) {
                        return;
                    }
                }
                setEditedData(next);
                resetHistory(next);
            } catch (err) {
                if (!cancelled && err?.name !== 'AbortError') {
                    console.warn('[BuilderPage] Could not backfill footer fields', err);
                }
            }
        };

        backfillFooter();
        return () => {
            cancelled = true;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        previewUrl,
        siteId,
        editedData?.footer?.gallery?.images?.length,
        editedData?.footer?.exploreLinks?.length,
        editedData?.footer?.serviceLinks?.length,
        editedData?.footer?.quickLinks?.length,
        resetHistory,
    ]);

    // Once templates load, point the canvas at the editable template host (not the live domain).
    useEffect(() => {
        if (!site) return;
        const bootstrapUrl = location.state?.previewUrl || '';
        const nextUrl = resolvePreviewUrl(site, bootstrapUrl, templatesList);
        if (nextUrl && nextUrl !== previewUrl) {
            setPreviewUrl(nextUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [site, templatesList, resolvePreviewUrl]);

    useEffect(() => {
        if (sections.length > 0) {
            setIsSidebarOpen(true);
        }
    }, [sections.length]);

        // 2. Sections Parsing — do NOT depend on activeSection (rebuilding the
    // list on every click re-triggered stale focusRequest → Site settings).
    // Never setEditedData() here — seeding site.contact via setState raced with
    // site load and wiped pages[] (blank sidebar + blank preview).
    useEffect(() => {
        if (!editedData) return;
        const parsedSections = getSections(editedData);
        setSections(parsedSections);

        setActiveSection((current) => {
            if (current) return current;
            if (parsedSections.length === 0) return current;
            // Prefer first page section over Site settings as the default.
            const firstContent =
                parsedSections.find(
                    (section) =>
                        section &&
                        section.id !== 'site' &&
                        section.id !== 'site-contact' &&
                        section.kind !== 'site',
                ) || parsedSections[0];
            return firstContent.id || firstContent;
        });
    }, [editedData, getSections]);


// 3. Editor Logic (Array mutation, deep object set, saving)
    const setDeepValue = (obj, path, value) => {
        let newObj;
        try { newObj = JSON.parse(JSON.stringify(obj || {})); }
        catch (e) { newObj = { ...(obj || {}) }; }

        if (!Array.isArray(path) || path.length === 0) return newObj;

        let current = newObj;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            const nextKey = path[i + 1];
            const existing = current[key];
            // null/undefined parents (e.g. image: null) must become objects so src can be set
            if (
                existing === undefined ||
                existing === null ||
                (typeof existing !== 'object')
            ) {
                current[key] = typeof nextKey === 'number' ? [] : {};
            }
            current = current[key];
        }
        current[path[path.length - 1]] = value;
        return newObj;
    };

    const handleFieldChange = (path, value) => {
        setEditedData((prev) => {
            const next = setDeepValue(prev, path, value);
            scheduleHistoryCommit(next);
            return next;
        });
    };

    const addArrayItem = (path) => {
        setEditedData((prev) => {
             let newData;
             try { newData = JSON.parse(JSON.stringify(prev)); } catch (e) { newData = { ...prev }; }
             let current = newData;
             for (let i = 0; i < path.length; i++) {
                 if (!current) return prev;
                 current = current[path[i]];
             }
             if (!Array.isArray(current)) return prev;

             let newItem = {};
             if (current.length > 0) {
                 try { newItem = JSON.parse(JSON.stringify(current[0])); } catch (e) { newItem = { ...current[0] }; }
                 const resetValues = (obj) => {
                     Object.keys(obj).forEach((key) => {
                         const value = obj[key];
                         if (typeof value === "string") obj[key] = "";
                         else if (typeof value === "number") obj[key] = 0;
                         else if (typeof value === "boolean") obj[key] = false;
                         else if (Array.isArray(value)) obj[key] = [];
                         else if (typeof value === "object" && value !== null) resetValues(obj[key]);
                     });
                 };
                 resetValues(newItem);
                 if (newItem && typeof newItem === "object" && !newItem.id) {
                     newItem.id = `item-${Date.now()}`;
                 }
             } else {
                 const lastKey = String(path[path.length - 1] || "").toLowerCase();
                 if (lastKey === "columns") {
                     newItem = {
                         id: `column-${Date.now()}`,
                         title: "New column",
                         links: [
                             {
                                 id: `link-${Date.now()}`,
                                 label: "New link",
                                 url: "#",
                                 href: "#",
                             },
                         ],
                     };
                 } else if (
                     lastKey.includes("link") ||
                     lastKey === "items" ||
                     lastKey.endsWith("links")
                 ) {
                     newItem = {
                         id: `link-${Date.now()}`,
                         label: "New link",
                         url: "#",
                         href: "#",
                     };
                 }
             }
             current.push(newItem);
             commitHistorySnapshot(newData);
             return newData;
        });
    };

    const removeArrayItem = (path, index) => {
        setEditedData((prev) => {
            let newData;
            try { newData = JSON.parse(JSON.stringify(prev)); } catch (e) { newData = { ...prev }; }
            let current = newData;
            for (let i = 0; i < path.length; i++) {
                 if (!current) return prev;
                 current = current[path[i]];
            }
            if (!Array.isArray(current)) return prev;
            current.splice(index, 1);
            commitHistorySnapshot(newData);
            return newData;
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Optional: attach S3 meta
            if (previewUrl) {
                const baseUrl = previewUrl.split("?")[0];
                editedData.s3 = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
            }

            // Call the correct API directly
            const templateSubdomain = site?.template || editedData.template || 'templatehm';
            await updateSiteData(siteId, templateSubdomain, editedData);
            listUserSites(true).catch(() => {});
            showNotice('success', 'Draft saved successfully.');

        } catch (err) {
            console.error("Save Error", err);
            showNotice('error', 'Failed to save draft. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);

            let payload;
            try {
                payload = JSON.parse(JSON.stringify(editedData || {}));
            } catch {
                payload = { ...(editedData || {}) };
            }

            if (previewUrl) {
                const baseUrl = previewUrl.split("?")[0];
                payload.s3 = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
            }

            if (site?.status !== 'LIVE') {
                const templateSubdomain = site?.template || payload.template || 'templatehm';
                await updateSiteData(siteId, templateSubdomain, payload);
                listUserSites(true).catch(() => {});
                showNotice('success', 'Draft saved. Continue deployment setup.');
                navigate(`/deploy/${siteId}`);
                return;
            }

            // Refresh the live site's template files (deploy-site keeps LIVE
            // status and invalidates the CDN), then push the edited content.
            await deploySite(siteId);
            await updateSiteData(siteId, 'data.json', payload);
            listUserSites(true).catch(() => {});
            showNotice(
                'success',
                'Update successful. Your website may take up to 15 minutes to show the latest changes. Please be patient.',
                12000,
            );
        } catch (err) {
            console.error('Publish Error', err);
            showNotice('error', 'Failed to update live site. Please try again.');
        } finally {
            setPublishing(false);
        }
    };

    const availableTemplates = templatesList.filter((template) => {
        if (!site) return true;
        const sameId = String(template.templateId) === String(site.templateId);
        const sameNo = String(template.templateNo) === String(site.templateNo);
        return !(sameId && sameNo);
    });

    const openSwitchModal = () => {
        setSelectedTemplate(null);
        setIsSwitchModalOpen(true);
    };

    const closeSwitchModal = () => {
        if (switchingTemplate) return;
        setIsSwitchModalOpen(false);
    };

    const confirmTemplateSwitch = async () => {
        if (!selectedTemplate) return;

        try {
            setSwitchingTemplate(true);
            await switchSiteTemplate(
                siteId,
                selectedTemplate.templateId,
                String(selectedTemplate.templateNo),
                selectedTemplate.url
            );

            const refreshed = await getSite(siteId);
            const { site: siteRecord, siteData } = parseGetSiteResponse(refreshed);
            if (siteRecord) {
                setSite(siteRecord);

                setPreviewUrl(resolvePreviewUrl(siteRecord, selectedTemplate.url));

                const initialData = resolveInitialEditedData(
                    siteRecord,
                    siteData,
                    templatesList,
                );
                const nextData = cloneData(initialData);
                setEditedData(nextData);
                resetHistory(nextData);

                setIframeKey((prev) => prev + 1);
            }

            showNotice('success', 'Template switched and builder updated with new template data.');
        } catch (err) {
            console.error('Switch template error:', err);
            showNotice('error', err?.message || 'Failed to switch template. Please try again.');
        } finally {
            setSwitchingTemplate(false);
            setIsSwitchModalOpen(false);
        }
    };

    const refreshPreview = () => {
        setIframeKey((prev) => prev + 1);
    };

    useEffect(() => {
        const onKeyDown = (event) => {
            const key = String(event.key || '').toLowerCase();
            const mod = event.metaKey || event.ctrlKey;
            if (!mod) return;

            const target = event.target;
            const tag = target?.tagName?.toLowerCase();
            const isEditingField =
                tag === 'input' ||
                tag === 'textarea' ||
                target?.isContentEditable;

            // Allow undo/redo even while typing in sidebar fields.
            if (key === 'z' && !event.shiftKey) {
                if (!canUndo) return;
                event.preventDefault();
                handleUndo();
                return;
            }

            if (key === 'y' || (key === 'z' && event.shiftKey)) {
                if (!canRedo) return;
                event.preventDefault();
                handleRedo();
                return;
            }

            // Avoid stealing other shortcuts while focused in inputs.
            if (isEditingField) return;
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [canUndo, canRedo, handleUndo, handleRedo]);

    // Ask PreviewFrame to scroll the iframe to the selected section.
    // Uses short template keys (hero, specialists…) — not schema ids (home-hero).
    const goToSection = useCallback((target) => {
        if (!target) return;
        // Keep sidebar selection stable while preview sync settles.
        sidebarSelectLockRef.current = Date.now() + 1200;
        setFieldSelection(null);

        // Legacy: goToSection('hero') or goToSection({ section, page, aliases })
        if (typeof target === 'string') {
            setScrollRequest({
                section: target,
                sectionId: target,
                page: '/',
                nonce: Date.now(),
            });
            return;
        }

        // Full editor section object from the sidebar
        if (target.path || target.scrollAliases || target.shortLabel || target.group) {
            const message = resolveScrollMessage(target);
            if (!message?.section && !message?.routeKey) return;
            const page = message.page || target.pageSlug || '/';
            const matchTexts = collectSectionMatchTexts(editedDataRef.current, target);
            setScrollRequest({
                ...message,
                page,
                pageSlug: page,
                group: target.group || message.group || null,
                routeKey: message.routeKey || target.routeKey || null,
                sectionId: target.id || message.section || null,
                scrollId: target.scrollId || message.section || null,
                scrollAliases: target.scrollAliases || message.aliases || [],
                label: target.shortLabel || target.label || message.section || null,
                matchTexts,
                // Schema position within the page — lets the bridge resolve
                // sections that render without DOM ids by order.
                orderIndex:
                    Array.isArray(target.path) &&
                    target.path[0] === 'pages' &&
                    Number.isInteger(target.path[3])
                        ? target.path[3]
                        : null,
                nonce: Date.now(),
            });
            return;
        }

        if (target.section) {
            setScrollRequest({
                section: target.section,
                sectionId: target.sectionId || target.id || target.section,
                page: target.page || target.pageSlug || '/',
                pageSlug: target.pageSlug || target.page || '/',
                routeKey: target.routeKey || null,
                group: target.group || null,
                aliases: target.aliases || target.scrollAliases || [],
                label: target.label || target.shortLabel || target.section || null,
                nonce: Date.now(),
            });
        }
    }, []);

    const handleFieldFocus = useCallback((payload) => {
        if (!payload) {
            setFieldSelection(null);
            return;
        }
        setFieldSelection({
            ...payload,
            nonce: Date.now(),
        });
    }, []);

    const findSectionByPreviewId = useCallback(
        (sectionId, matchText, page) => {
            if (!sectionId && !matchText && !page) return null;
            const id = String(sectionId || '').trim();
            const needle = String(matchText || '')
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .trim();
            const pageSlug = page ? (page.startsWith('/') ? page : `/${page}`) : null;
            const routeKeys = new Set([
                'studio',
                'services',
                'projects',
                'about',
                'contact',
                'doctors',
            ]);

            const scored = sections
                .map((section) => {
                    // Site settings is sidebar-only — never pick it from preview clicks.
                    if (section.id === 'site' || section.kind === 'site') {
                        return { section, score: 0 };
                    }

                    let score = 0;
                    // Don't treat missing pageSlug as home — site/nav/footer stay neutral.
                    const sectionPage =
                        section.pageSlug != null ? section.pageSlug : null;

                    // Exact id always wins for that section.
                    if (id && section.id === id) score += 200;
                    if (id && section.scrollId === id) {
                        // Route keys like "studio" must not beat studio-hero via home-studio.
                        score += routeKeys.has(id) ? 40 : 120;
                    }

                    if (id && (section.scrollAliases || []).includes(id)) {
                        // Generic aliases like "hero" are weak unless page matches.
                        const generic = !String(id).includes('-') && id.length < 24;
                        score += generic ? 35 : 80;
                    }

                    if (id) {
                        const suffixMatch =
                            section.id.endsWith(`-${id}`) ||
                            section.id.split('-').pop() === id;
                        if (suffixMatch) {
                            // home-hero vs studio-hero both end with "hero" — require page.
                            score += pageSlug && sectionPage === pageSlug ? 70 : 15;
                        }
                        // Prefer `{page}-hero` when the click id is a bare route key.
                        if (
                            routeKeys.has(id) &&
                            section.id === `${id}-hero` &&
                            (!pageSlug || sectionPage === pageSlug || sectionPage === `/${id}`)
                        ) {
                            score += 100;
                        }
                        const short = String(section.id || '')
                            .split(/[-_/]/)
                            .filter((p) => p && !/^(home|page|section|main)$/i.test(p));
                        const camel =
                            short.length > 1
                                ? short[0] +
                                  short
                                      .slice(1)
                                      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                                      .join('')
                                : short[0];
                        if (camel && camel === id) score += 40;
                    }

                    if (pageSlug && sectionPage) {
                        if (sectionPage === pageSlug) score += 60;
                        else score -= 80; // never prefer another page's section
                    }

                    if (needle) {
                        const label = String(section.shortLabel || section.label || '').toLowerCase();
                        if (label && needle.includes(label)) score += 25;
                        if (label && label.includes(needle.slice(0, 24))) score += 15;
                    }
                    return { section, score };
                })
                .filter((row) => row.score > 0)
                .sort((a, b) => b.score - a.score);

            return scored[0]?.section || null;
        },
        [sections],
    );

    const handlePreviewClick = useCallback(
        ({ sectionId, fieldId, matchText, page, orderIndex }) => {
            // Ignore reverse-clicks briefly after a sidebar selection so a weak
            // "hero" DOM id can't overwrite Studio Hero with Home Hero.
            if (Date.now() < sidebarSelectLockRef.current) return;

            let match = findSectionByPreviewId(sectionId, matchText, page);
            // Id-less templates: map the clicked block to the schema section
            // at the same position on that page.
            if (!match && Number.isInteger(orderIndex)) {
                const pageSlug = page
                    ? page.startsWith('/')
                        ? page
                        : `/${page}`
                    : '/';
                match =
                    sections.find(
                        (section) =>
                            Array.isArray(section.path) &&
                            section.path[0] === 'pages' &&
                            section.pageSlug === pageSlug &&
                            section.path[3] === orderIndex,
                    ) || null;
            }
            if (match) {
                setActiveSection(match.id);
                setSidebarFocusRequest({ sectionId: match.id, nonce: Date.now() });
                goToSection(match);
            } else if (page && page !== '/') {
                const firstOnPage = sections.find((section) => section.pageSlug === page);
                if (firstOnPage) {
                    setActiveSection(firstOnPage.id);
                    setSidebarFocusRequest({ sectionId: firstOnPage.id, nonce: Date.now() });
                    goToSection(firstOnPage);
                }
            }

            if (fieldId) {
                setFieldSelection({
                    fieldId,
                    fieldKey: String(fieldId).split('.').pop(),
                    value: null,
                    nonce: Date.now(),
                });
            }
        },
        [findSectionByPreviewId, goToSection, sections],
    );

    const handlePreviewNav = useCallback(
        ({ page }) => {
            if (!page) return;
            const normalized = page === '/' ? '/' : page.startsWith('/') ? page : `/${page}`;
            const pageToken = normalized.replace(/^\//, '');

            // Prefer the first real content section on that page (usually the page hero).
            const onPage = sections.filter(
                (section) =>
                    section.pageSlug === normalized &&
                    section.id !== 'site' &&
                    section.kind !== 'site',
            );
            const firstOnPage =
                onPage.find((section) =>
                    /hero|header|banner/i.test(
                        String(section.id || '') +
                            String(section.scrollId || '') +
                            String(section.label || ''),
                    ),
                ) ||
                onPage[0] ||
                (pageToken
                    ? sections.find(
                          (section) =>
                              section.id !== 'site' &&
                              section.kind !== 'site' &&
                              String(section.group || '')
                                  .toLowerCase()
                                  .includes(pageToken),
                      )
                    : null);

            if (firstOnPage) {
                setActiveSection(firstOnPage.id);
                setSidebarFocusRequest({ sectionId: firstOnPage.id, nonce: Date.now() });
                goToSection(firstOnPage);
            }
        },
        [sections, goToSection],
    );

    if (isAuthLoading || (isLoadingSite && !site)) {
        return (
             <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-sans">
                 <div className="w-12 h-12 border-4 border-[#333] border-t-blue-500 rounded-full animate-spin mb-6"></div>
                 <h2 className="text-xl font-medium mb-2">Loading Builder Workspace...</h2>
             </div>
        );
    }

    if (!isAuthenticated || !site) {
        return (
             <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-sans px-6 text-center">
                 <FiAlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
                 <h2 className="text-xl font-medium mb-2">
                    {!isAuthenticated ? "Sign in required" : "Site unavailable"}
                 </h2>
                 <p className="text-gray-400 text-sm max-w-md mb-6">
                    {loadError || (!isAuthenticated
                        ? "You need a valid Tekkzy account session to edit sites."
                        : "This builder link is invalid or the site no longer exists.")}
                 </p>
                 <div className="flex items-center gap-3">
                    {!isAuthenticated ? (
                        <Link to="/signin" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">
                            Sign In
                        </Link>
                    ) : (
                        <Link to="/dashboard/sites" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">
                            Go to My Sites
                        </Link>
                    )}
                    <Link to="/product" className="px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] rounded-lg text-sm">
                        Browse Templates
                    </Link>
                 </div>
             </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#121212] text-white overflow-hidden font-sans">
            <FloatingNotice
                notice={notice}
                onClose={() => setNotice(null)}
            />

            {/* Top Navbar */}
            <header className="h-14 bg-[#0a0a0a] border-b border-[#222] flex items-center justify-between px-4 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard/sites" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <FiArrowLeft /> <span className="hidden sm:inline">Sites</span>
                    </Link>
                    <div className="h-4 w-px bg-[#333] hidden sm:block"></div>
                    <span className="text-sm font-medium hidden sm:inline-block truncate max-w-[240px]">
                         {displaySiteName}
                    </span>
                    <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${
                        site.status === "LIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }`}>
                         {site.status === "LIVE" ? "Live" : "Draft"}
                    </span>
                </div>

                {/* Viewport Toggles and Refresh */}
                <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#222]">
                    <button
                        type="button"
                        onClick={handleUndo}
                        disabled={!canUndo}
                        title="Revert (Ctrl+Z)"
                        aria-label="Revert last change"
                        className={`p-1.5 rounded transition-colors ${
                            canUndo
                                ? 'text-gray-300 hover:text-white hover:bg-[#222]'
                                : 'text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        <FiRotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleRedo}
                        disabled={!canRedo}
                        title="Forward (Ctrl+Y)"
                        aria-label="Redo last change"
                        className={`p-1.5 rounded transition-colors ${
                            canRedo
                                ? 'text-gray-300 hover:text-white hover:bg-[#222]'
                                : 'text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        <FiRotateCw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-[#333] mx-1"></div>
                    <button
                        onClick={() => setDeviceView("desktop")}
                        className={`p-1.5 rounded transition-colors ${deviceView === 'desktop' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                    >
                        <FiMonitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeviceView("mobile")}
                        className={`p-1.5 rounded transition-colors ${deviceView === 'mobile' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                    >
                        <FiSmartphone className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-[#333] mx-1"></div>
                    <button
                         onClick={refreshPreview}
                         className="p-1 px-2 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                         Refresh
                    </button>
                    <div className="w-px h-4 bg-[#333] mx-1 md:hidden"></div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                        aria-label="Open editor sidebar"
                    >
                        <FiSliders className="w-4 h-4" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    {site?.status === 'LIVE' && site?.cloudfrontId && (
                        <button
                            onClick={openSwitchModal}
                            className="flex items-center gap-2 h-8 px-3 sm:px-4 bg-[#1a1a1a] border border-[#333] rounded hover:bg-[#222] transition-colors text-sm text-gray-300"
                        >
                            <FiShuffle />
                            <span className="hidden sm:inline">Switch Template</span>
                        </button>
                    )}
                    {site?.status !== 'LIVE' && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="hidden sm:flex items-center gap-2 h-8 px-4 bg-[#1a1a1a] border border-[#333] rounded hover:bg-[#222] transition-colors text-sm text-gray-300"
                        >
                            {saving ? <div className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" /> : <FiCheck />}
                            {saving ? "Saving..." : "Save Draft"}
                        </button>
                    )}
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="flex items-center gap-2 h-8 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {publishing ? 'Updating...' : site?.status === 'LIVE' ? 'Update Live' : 'Publish'}
                    </button>
                </div>
            </header>

            {isSwitchModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl flex flex-col">
                        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <FiAlertTriangle className="text-amber-400" />
                                <h3 className="text-lg font-semibold">Switch Template</h3>
                            </div>
                            <button
                                onClick={closeSwitchModal}
                                className="p-1.5 rounded hover:bg-[#1b1b1b] text-gray-400 hover:text-white"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="px-6 py-4 border-b border-[#222] bg-amber-500/10">
                            <p className="text-sm text-amber-200">
                                Warning: Switching template will reset currently deployed theme files for this site.
                                This action updates your live domain to the selected template.
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableTemplates.map((template) => {
                                    const isSelected =
                                        selectedTemplate &&
                                        String(selectedTemplate.templateId) === String(template.templateId) &&
                                        String(selectedTemplate.templateNo) === String(template.templateNo);

                                    return (
                                        <button
                                            key={`${template.templateId}-${template.templateNo}`}
                                            onClick={() => setSelectedTemplate(template)}
                                            className={`text-left border rounded-xl overflow-hidden transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-[#2a2a2a] bg-[#141414] hover:border-[#3a3a3a]'
                                            }`}
                                        >
                                            {template.thumbnail ? (
                                                <img
                                                    src={template.thumbnail}
                                                    alt={template.title}
                                                    className="w-full h-28 object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-28 bg-[#1a1a1a]" />
                                            )}
                                            <div className="p-3">
                                                <p className="text-sm font-medium text-white line-clamp-1">{template.title}</p>
                                                <p className="text-xs text-gray-400 mt-1">{template.category}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[#222] flex items-center justify-end gap-3">
                            <button
                                onClick={closeSwitchModal}
                                disabled={switchingTemplate}
                                className="px-4 py-2 text-sm border border-[#333] rounded-lg text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmTemplateSwitch}
                                disabled={!selectedTemplate || switchingTemplate}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {switchingTemplate ? 'Switching...' : 'Switch Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Workspace Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar — Shopify-style section navigator */}
                <EditorSidebar
                     isOpen={isSidebarOpen}
                     onClose={() => setIsSidebarOpen(false)}
                     sections={sections}
                     activeSection={activeSection}
                     setActiveSection={setActiveSection}
                     editedData={editedData}
                     handleFieldChange={handleFieldChange}
                     addArrayItem={addArrayItem}
                     removeArrayItem={removeArrayItem}
                     goToSection={goToSection}
                     onFieldFocus={handleFieldFocus}
                     focusRequest={sidebarFocusRequest}
                     onClearFocusRequest={() => setSidebarFocusRequest(null)}
                     assetBaseUrl={previewUrl}
                />

                {/* Right canvas — live preview (independent scroll) */}
                <main className="flex-1 min-w-0 bg-[#121212] relative overflow-hidden flex items-center justify-center p-0 md:p-4 lg:p-8">
                    {previewUrl ? (
                         <PreviewFrame
                            url={previewUrl}
                            editedData={editedData}
                            iframeKey={iframeKey}
                            deviceView={deviceView}
                            scrollRequest={scrollRequest}
                            fieldSelection={fieldSelection}
                            onPreviewClick={handlePreviewClick}
                            onPreviewNav={handlePreviewNav}
                         />
                    ) : (
                         <div className="text-gray-500">Preparing Preview Canvas...</div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BuilderPage;
