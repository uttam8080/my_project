import React, { createContext, useContext, useMemo, useRef, useState } from "react";

import { get, post, put } from "aws-amplify/api";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from "aws-amplify/auth";
import { useAuth } from "./AuthContext";
import { normalizeTemplatesList, enrichTemplateUpdatePayload, enrichTemplateUploadPayload, formatTemplateApiError } from "../utils/templateUtils";

const ApiContext = createContext(null);

const apiName = "main";
const adminSubscriptionApiBase = (
  import.meta.env.VITE_ADMIN_SUBSCRIPTION_API_BASE ||
  "https://ikticbkaxh.execute-api.us-east-2.amazonaws.com/dev"
).replace(/\/$/, "");
let templatesInFlightPromise = null;
let templatesCache = null;
let userSitesInFlightPromise = null;
let userSitesCache = null;

/* ---------- Helper ---------- */

async function parseJsonBody(restResponse) {
  try {
    return await restResponse.body.json();
  } catch {
    return null;
  }
}

function isRestResponseOk(restResponse) {
  if (!restResponse) {
    return false;
  }

  const statusCode = restResponse.statusCode ?? restResponse.status;
  if (typeof statusCode === "number") {
    return statusCode >= 200 && statusCode < 300;
  }

  return Boolean(restResponse.ok);
}

function getRestResponseStatus(restResponse) {
  const statusCode = restResponse?.statusCode ?? restResponse?.status;
  return typeof statusCode === "number" ? statusCode : "unknown";
}

async function getUserPoolAuthOptions() {
  const session = await fetchAuthSession();

  if (!session.tokens?.idToken) {
    throw new Error("You must be signed in to perform this action.");
  }

  return { authMode: "userPool" };
}

function normalizeProfileData(data) {
  if (!data) return null;
  const profile = data.item || data;
  const email = profile.email || profile.emailId;
  const isAdmin = email?.toLowerCase() === "admin@happyprancer.com";

  return {
    ...profile,
    email,
    imgUrl: profile.imgUrl || profile.image,
    image: profile.image || profile.imgUrl,
    userType: isAdmin ? "admin" : profile.userType,
  };
}

function isLikelyEmail(value) {
  return typeof value === "string" && value.includes("@");
}

function extractUserSites(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.sites)) return data.sites;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function parseFetchJsonBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/* ---------- Provider ---------- */

export const ApiProvider = ({ children }) => {
  const [templatesList, setTemplatesList] = useState([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [isTemplatesLoadingMore, setIsTemplatesLoadingMore] = useState(false);
  const [templatesHasMore, setTemplatesHasMore] = useState(false);
  const [templatesNextCursor, setTemplatesNextCursor] = useState(null);
  const [templateCategories, setTemplateCategories] = useState([]);
  const templatesQueryRef = useRef({ category: "", search: "", limit: 10 });
  const [userSites, setUserSites] = useState([]);
  const [isUserSitesLoading, setIsUserSitesLoading] = useState(false);
  const [userSitesError, setUserSitesError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const profileCreateInFlightRef = useRef(new Set());

  /* ---------- API Functions ---------- */

  const getProfile = async (email) => {
    setLoading(true);

    try {
      const options = {};

      if (email) {
        options.queryParams = { email };
      }

      const restResponse = await get({
        apiName,
        path: "/get-profile",
        options,
      }).response;

      const data = await parseJsonBody(restResponse);
      const profile = normalizeProfileData(data);

      setUserData(profile);

      return profile;
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (email, name, imgUrl) => {
    const body = { email };
    if (name) {
      body.name = name;
    }
    if (imgUrl) {
      body.imgUrl = imgUrl;
    }

    const restResponse = await post({
      apiName,
      path: "/create-profile",
      options: {
        body,
      },
    }).response;

    const data = await parseJsonBody(restResponse);
    const profile = normalizeProfileData(data);

    setUserData(profile);

    return profile;
  };

  const updateProfile = async ({ name, imgUrl, domainRegistrationProgress, deploymentProgress }) => {
    const body = {};
    if (typeof name !== "undefined") {
      body.name = name;
    }
    if (typeof imgUrl !== "undefined") {
      body.imgUrl = imgUrl;
    }
    if (typeof domainRegistrationProgress !== "undefined") {
      body.domainRegistrationProgress = domainRegistrationProgress;
    }
    if (typeof deploymentProgress !== "undefined") {
      body.deploymentProgress = deploymentProgress;
    }

    const restResponse = await put({
      apiName,
      path: "/update-profile",
      options: {
        body,
      },
    }).response;

    const data = await parseJsonBody(restResponse);
    const profile = normalizeProfileData(data);

    /* update local state */

    setUserData(profile);

    return profile;
  };

  const listTemplates = async (options = {}) => {
    // Back-compat: listTemplates(true) / listTemplates(false)
    const opts =
      typeof options === "boolean"
        ? { force: options, limit: 10, includeCategories: true }
        : options && typeof options === "object"
          ? options
          : {};

    const force = Boolean(opts.force);
    const append = Boolean(opts.append);
    const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 50);
    const category =
      opts.category && String(opts.category).toLowerCase() !== "all"
        ? String(opts.category).trim()
        : "";
    const search = String(opts.search || "").trim();
    const cursor = opts.cursor || null;
    const includeCategories =
      opts.includeCategories === undefined ? !append : Boolean(opts.includeCategories);

    templatesQueryRef.current = { category, search, limit };

    if (!force && !append && !cursor && templatesCache && !category && !search) {
      setTemplatesList(templatesCache);
      setIsTemplatesLoading(false);
      return { items: templatesCache, hasMore: templatesHasMore, nextCursor: templatesNextCursor };
    }

    if (!force && !append && templatesInFlightPromise) {
      setIsTemplatesLoading(true);
      const cachedData = await templatesInFlightPromise;
      return cachedData;
    }

    if (append) {
      setIsTemplatesLoadingMore(true);
    } else {
      setIsTemplatesLoading(true);
    }

    try {
      const queryParams = {
        limit: String(limit),
      };
      if (category) queryParams.category = category;
      if (search) queryParams.search = search;
      if (cursor) queryParams.cursor = cursor;
      if (includeCategories) queryParams.includeCategories = "1";

      const fetchPage = async () => {
        const restResponse = await get({
          apiName,
          path: "/list-templates",
          options: { queryParams },
        }).response;

        const data = await parseJsonBody(restResponse);
        // Treat missing/empty as a valid empty page (API used to return 404).
        if (!data || data.error) {
          return {
            items: [],
            count: 0,
            hasMore: false,
            nextCursor: null,
            categories: Array.isArray(data?.categories) ? data.categories : undefined,
          };
        }
        return data;
      };

      if (!append) {
        templatesInFlightPromise = fetchPage();
      }

      const data = append ? await fetchPage() : await templatesInFlightPromise;
      const pageItems = normalizeTemplatesList(data?.items || []);
      const nextCursor = data?.nextCursor || null;
      const hasMore = Boolean(data?.hasMore && nextCursor);

      if (append) {
        setTemplatesList((prev) => {
          const merged = normalizeTemplatesList([...(prev || []), ...pageItems]);
          if (!category && !search) {
            templatesCache = merged;
          }
          return merged;
        });
      } else {
        if (!category && !search) {
          templatesCache = pageItems;
        } else {
          // Don't poison the unfiltered cache with a filtered page.
          templatesCache = null;
        }
        setTemplatesList(pageItems);
      }

      setTemplatesHasMore(hasMore);
      setTemplatesNextCursor(nextCursor);

      if (Array.isArray(data?.categories)) {
        setTemplateCategories(data.categories);
      }

      return {
        ...data,
        items: pageItems,
        hasMore,
        nextCursor,
      };
    } catch (err) {
      console.error("listTemplates failed", err);
      if (!append) {
        setTemplatesList([]);
        setTemplatesHasMore(false);
        setTemplatesNextCursor(null);
      }
      throw err;
    } finally {
      if (!append) templatesInFlightPromise = null;
      setIsTemplatesLoading(false);
      setIsTemplatesLoadingMore(false);
    }
  };

  const loadMoreTemplates = async () => {
    if (isTemplatesLoadingMore || isTemplatesLoading || !templatesHasMore || !templatesNextCursor) {
      return null;
    }
    const { category, search, limit } = templatesQueryRef.current;
    return listTemplates({
      append: true,
      cursor: templatesNextCursor,
      category,
      search,
      limit,
      includeCategories: false,
    });
  };

  const updateTemplate = async (templateData) => {
    setLoading(true);
    try {
      const body = await enrichTemplateUpdatePayload(templateData);

      const restResponse = await put({
        apiName,
        path: "/tekkzy/update-template",
        options: {
          body,
          authMode: "iam",
        },
      }).response;

      const data = await parseJsonBody(restResponse);

      if (!isRestResponseOk(restResponse) || data?.error) {
        throw new Error(
          formatTemplateApiError(
            data,
            `Failed to update template (${getRestResponseStatus(restResponse)})`,
          ),
        );
      }

      templatesCache = null;
      await listTemplates({ force: true, limit: 10, includeCategories: true });

      return data;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async ({ templateId, templateNo }) => {
    const normalizedId = String(templateId || "").trim();
    const normalizedNo =
      templateNo !== undefined && templateNo !== null
        ? String(templateNo).trim()
        : "";

    if (!normalizedId || !normalizedNo) {
      throw new Error("templateId and templateNo are required");
    }

    setLoading(true);
    try {
      const restResponse = await post({
        apiName,
        path: "/tekkzy/delete-template",
        options: {
          body: {
            templateId: normalizedId,
            templateNo: normalizedNo,
          },
          authMode: "iam",
        },
      }).response;

      const data = await parseJsonBody(restResponse);

      if (!isRestResponseOk(restResponse) || data?.error || data?.success === false) {
        throw new Error(
          formatTemplateApiError(
            data,
            `Failed to delete template (${getRestResponseStatus(restResponse)})`,
          ),
        );
      }

      templatesCache = null;
      await listTemplates({ force: true, limit: 10, includeCategories: true });

      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerTemplate = async (templateData) => {
    setLoading(true);

    try {
      const body = await enrichTemplateUploadPayload(templateData);

      const restResponse = await post({
        apiName,
        path: "/tekkzy/upload-template",
        options: {
          body,
          authMode: "iam",
        },
      }).response;

      const data = await parseJsonBody(restResponse);

      if (!isRestResponseOk(restResponse) || data?.error) {
        throw new Error(
          formatTemplateApiError(
            data,
            `Failed to upload template (${getRestResponseStatus(restResponse)})`,
          ),
        );
      }

      templatesCache = null;
      // Optimistically show the uploaded template immediately.
      const uploaded = data?.template || data?.item || null;
      if (uploaded) {
        setTemplatesList((prev) =>
          normalizeTemplatesList([uploaded, ...(prev || [])]),
        );
      }

      await listTemplates({
        force: true,
        limit: templatesQueryRef.current.limit || 10,
        category: templatesQueryRef.current.category,
        includeCategories: true,
      });

      return data;
    } finally {
      setLoading(false);
    }
  };

  const deploySite = async (siteId) => {
    setLoading(true);
    try {
      const restResponse = await post({
        apiName,
        path: "/deploy-site",
        options: {
          body: { siteId },
        },
      }).response;

      const responseData = await parseJsonBody(restResponse);

      if (!isRestResponseOk(restResponse) || responseData?.success === false) {
        throw new Error(
          responseData?.message ||
            responseData?.error ||
            `Failed to deploy site (${getRestResponseStatus(restResponse)})`,
        );
      }

      return responseData;
    } finally {
      setLoading(false);
    }
  };

  const invalidateUserSitesCache = () => {
    userSitesCache = null;
    userSitesInFlightPromise = null;
  };

  const listUserSites = async (force = false) => {
    if (!isAuthenticated) {
      setUserSites([]);
      setUserSitesError(null);
      setIsUserSitesLoading(false);
      return { sites: [] };
    }

    if (!force && userSitesCache) {
      setUserSites(userSitesCache);
      setUserSitesError(null);
      setIsUserSitesLoading(false);
      return { sites: userSitesCache };
    }

    if (!force && userSitesInFlightPromise) {
      setIsUserSitesLoading(true);
      const cachedData = await userSitesInFlightPromise;
      const sites = extractUserSites(cachedData);
      setUserSites(sites);
      setUserSitesError(null);
      setIsUserSitesLoading(false);
      return { ...cachedData, sites };
    }

    setIsUserSitesLoading(true);
    setUserSitesError(null);

    try {
      userSitesInFlightPromise = (async () => {
        const restResponse = await get({
          apiName,
          path: "/list-user-sites",
          options: await getUserPoolAuthOptions(),
        }).response;

        return await parseJsonBody(restResponse);
      })();

      const data = await userSitesInFlightPromise;
      const sites = extractUserSites(data);
      userSitesCache = sites;
      setUserSites(sites);

      return { ...data, sites };
    } catch (err) {
      setUserSites([]);
      setUserSitesError(err?.message || "Failed to load sites. Please try again.");
      throw err;
    } finally {
      userSitesInFlightPromise = null;
      setIsUserSitesLoading(false);
    }
  };

  const createSite = async (templateId, templateNo, templateUrl) => {
    setLoading(true);
    try {
      const restResponse = await post({
        apiName,
        path: "/create-site",
        options: {
          body: { templateId, templateNo, templateUrl },
          ...(await getUserPoolAuthOptions()),
        },
      }).response;
      const data = await parseJsonBody(restResponse);

      if (!isRestResponseOk(restResponse) || data?.error) {
        throw new Error(data?.error || data?.message || "Failed to create site");
      }
      invalidateUserSitesCache();

      if (isAuthenticated) {
        listUserSites(true).catch(() => { });
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const deleteSite = async (siteId) => {
    const normalizedId = String(siteId || "").trim();
    if (!normalizedId) {
      throw new Error("siteId is required");
    }

    const restResponse = await post({
      apiName,
      path: "/delete-site",
      options: {
        body: { siteId: normalizedId },
        ...(await getUserPoolAuthOptions()),
      },
    }).response;

    const data = await parseJsonBody(restResponse);

    if (!isRestResponseOk(restResponse) || data?.error || data?.success === false) {
      throw new Error(data?.error || data?.message || "Failed to delete site");
    }

    invalidateUserSitesCache();
    setUserSites((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (site) => String(site?.siteId) !== normalizedId,
      ),
    );

    if (isAuthenticated) {
      listUserSites(true).catch(() => { });
    }

    return data;
  };

  const attachDomain = async ({ siteId, domain, sourceSiteId }) => {
    const restResponse = await post({
      apiName,
      path: "/attach-domain",
      options: {
        body: { siteId, domain, sourceSiteId },
      },
    }).response;

    const data = await parseJsonBody(restResponse);

    if (!isRestResponseOk(restResponse) || data?.error || data?.success === false) {
      throw new Error(data?.error || data?.message || "Failed to attach domain");
    }

    invalidateUserSitesCache();
    if (isAuthenticated) {
      listUserSites(true).catch(() => { });
    }

    return data;
  };

  const getSite = async (siteId) => {
    setLoading(true);
    try {
      const restResponse = await get({
        apiName,
        path: "/get-site",
        options: {
          queryParams: { siteId },
          ...(await getUserPoolAuthOptions()),
        },
      }).response;

      const data = await parseJsonBody(restResponse);

      if (!isRestResponseOk(restResponse)) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to load site (${getRestResponseStatus(restResponse)})`,
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const checkDomainAvailability = async (domain) => {
    const restResponse = await get({
      apiName,
      path: "/check-domain-availability",
      options: {
        queryParams: { domain },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const checkSubdomainAvailability = async (subdomain, domain) => {
    const restResponse = await get({
      apiName,
      path: "/check-subdomain-availability",
      options: {
        queryParams: { subdomain, domain },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const checkDomainValidation = async (certificateArn, hostedZoneId) => {
    const restResponse = await get({
      apiName,
      path: "/check-domain-validation",
      options: {
        queryParams: { certificateArn, hostedZoneId },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const createCloudfront = async (siteId, fullDomain, certificateArn) => {
    const domain = fullDomain;
    const restResponse = await post({
      apiName,
      path: "/create-cloudfront-distribution",
      options: {
        body: { siteId, domain, certificateArn },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const createDomainDNSRecord = async (siteId, fullDomain, hostedZoneId) => {
    const domain = fullDomain;
    const restResponse = await post({
      apiName,
      path: "/create-domain-dns-record",
      options: {
        body: { siteId, domain, hostedZoneId },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const registerDomain = async (domain, contact) => {
    const restResponse = await post({
      apiName,
      path: "/register-domain",
      options: {
        body: { domain, ...contact },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const checkDomainStatus = async (operationId, domain) => {
    const restResponse = await post({
      apiName,
      path: "/check-domain-status",
      options: {
        body: { operationId, domain },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const startDomainSetup = async (siteId, domain, hostedZoneId) => {
    const restResponse = await post({
      apiName,
      path: "/start-domain-setup",
      options: {
        body: { siteId, domain, hostedZoneId },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const updateSiteData = async (siteId, template, data) => {
    const restResponse = await put({
      apiName,
      path: "/update-site-data",
      options: {
        body: { siteId, template, data },
        ...(await getUserPoolAuthOptions()),
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const switchSiteTemplate = async (siteId, templateId, templateNo, templateUrl) => {
    const restResponse = await put({
      apiName,
      path: "/switch-site-template",
      options: {
        body: { siteId, templateId, templateNo, templateUrl },
        ...(await getUserPoolAuthOptions()),
      },
    }).response;

    const data = await parseJsonBody(restResponse);
    invalidateUserSitesCache();

    if (isAuthenticated) {
      listUserSites(true).catch(() => { });
    }

    return data;
  };

  const createRazorpayOrder = async ({
    siteId,
    planId,
    amount,
    currency = "INR",
    paymentType,
    metadata,
  }) => {
    const restResponse = await post({
      apiName,
      path: "/create-razorpay-order",
      options: {
        body: {
          siteId,
          planId,
          amount,
          currency,
          paymentType,
          metadata,
        },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const verifyRazorpayPayment = async ({
    razorpay_order_id,
    razorpay_subscription_id,
    razorpay_payment_id,
    razorpay_signature,
    siteId,
    planId,
    paymentType,
    amount,
    currency,
    customer,
    metadata,
  }) => {
    const restResponse = await post({
      apiName,
      path: "/verify-razorpay-payment",
      options: {
        body: {
          razorpay_order_id,
          razorpay_subscription_id,
          razorpay_payment_id,
          razorpay_signature,
          siteId,
          planId,
          paymentType,
          amount,
          currency,
          customer,
          metadata,
        },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const createPaymentSession = async ({
    siteId,
    planId,
    paymentType,
    countryCode,
    metadata,
  }) => {
    const restResponse = await post({
      apiName,
      path: "/create-payment-session",
      options: {
        body: {
          siteId,
          planId,
          paymentType,
          countryCode,
          metadata,
        },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const finalizePaymentSession = async ({
    provider,
    siteId,
    planId,
    paymentType,
    countryCode,
    customer,
    metadata,
    razorpay_order_id,
    razorpay_subscription_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  }) => {
    const restResponse = await post({
      apiName,
      path: "/finalize-payment-session",
      options: {
        body: {
          provider,
          siteId,
          planId,
          paymentType,
          countryCode,
          customer,
          metadata,
          razorpay_order_id,
          razorpay_subscription_id,
          razorpay_payment_id,
          razorpay_signature,
          orderId,
        },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const createPaypalOrder = async ({
    siteId,
    planId,
    paymentType,
    countryCode,
    metadata,
  }) => {
    const restResponse = await post({
      apiName,
      path: "/create-paypal-order",
      options: {
        body: {
          siteId,
          planId,
          paymentType,
          countryCode,
          metadata,
        },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const capturePaypalPayment = async ({
    orderId,
    siteId,
    planId,
    paymentType,
    countryCode,
    customer,
    metadata,
  }) => {
    const restResponse = await post({
      apiName,
      path: "/capture-paypal-payment",
      options: {
        body: {
          orderId,
          siteId,
          planId,
          paymentType,
          countryCode,
          customer,
          metadata,
        },
      },
    }).response;

    return await parseJsonBody(restResponse);
  };

  const getUserLocationPricing = async () => {
    const restResponse = await get({
      apiName,
      path: "/user/check-user-location",
    }).response;

    return await parseJsonBody(restResponse);
  };

  const getDomainPricing = async () => {
    const restResponse = await get({
      apiName,
      path: "/tekkzy/domain/pricing",
    }).response;

    const data = await parseJsonBody(restResponse);

    if (!isRestResponseOk(restResponse) || data?.success === false) {
      throw new Error(data?.message || data?.error || "Failed to load domain pricing");
    }

    return data;
  };

  const resolveCognitoIdentityId = async () => {
    try {
      const session = await fetchAuthSession();
      return (
        session?.identityId ||
        session?.credentials?.identityId ||
        userData?.cognitoId ||
        null
      );
    } catch {
      return userData?.cognitoId || null;
    }
  };

  const postAdminSubscriptionAction = async (path, payload) => {
    const response = await fetch(`${adminSubscriptionApiBase}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseFetchJsonBody(response);

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  const pauseSubscription = async ({ institutionId = "tekkzy", cognitoId, subscriptionId, paymentId }) => {
    const resolvedCognitoId = cognitoId || (await resolveCognitoIdentityId());

    if (!resolvedCognitoId) {
      throw new Error("Unable to resolve cognitoId for pause subscription.");
    }

    return await postAdminSubscriptionAction("admin/pause-subscription", {
      institutionId,
      cognitoId: resolvedCognitoId,
      subscriptionId,
      paymentId,
    });
  };

  const cancelSubscription = async ({ institutionId = "tekkzy", cognitoId, subscriptionId, paymentId }) => {
    const resolvedCognitoId = cognitoId || (await resolveCognitoIdentityId());

    if (!resolvedCognitoId) {
      throw new Error("Unable to resolve cognitoId for cancel subscription.");
    }

    return await postAdminSubscriptionAction("admin/cancel-subscription", {
      institutionId,
      cognitoId: resolvedCognitoId,
      subscriptionId,
      paymentId,
    });
  };

  const getPaymentDetails = async () => {
    const restResponse = await get({
      apiName,
      path: "/tekkzy/get-payment-details",
    }).response;

    return await parseJsonBody(restResponse);
  };

  React.useEffect(() => {
    listTemplates({ limit: 10, includeCategories: true }).catch((err) => {
      console.error("Initial templates load failed", err);
    });
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setUserSites([]);
      setUserSitesError(null);
      setIsUserSitesLoading(false);
      invalidateUserSitesCache();
      return;
    }

    listUserSites().catch(() => { });
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (isAuthenticated) {
      let isCancelled = false;

      const syncProfile = async () => {
        let tokenPayload;
        try {
          const session = await fetchAuthSession();
          tokenPayload = session?.tokens?.idToken?.payload;
        } catch {
          tokenPayload = undefined;
        }

        let attrs;
        try {
          attrs = await fetchUserAttributes();
        } catch {
          attrs = undefined;
        }

        const usernameEmail = isLikelyEmail(user?.username)
          ? user?.username
          : undefined;

        // For social login, user.username is often a Cognito subject UUID/hash.
        // Prefer ID token payload and user attributes for canonical email/name.
        const resolvedEmail =
          tokenPayload?.email ||
          attrs?.email ||
          user?.signInDetails?.loginId ||
          usernameEmail;
        const resolvedName =
          tokenPayload?.name ||
          attrs?.name ||
          tokenPayload?.given_name ||
          attrs?.given_name;
        const resolvedImgUrl = tokenPayload?.picture || attrs?.picture;

        if (!resolvedEmail) {
          if (!isCancelled) {
            getProfile();
          }
          return;
        }

        if (isCancelled) return;

        getProfile(resolvedEmail).catch(async (e) => {
          if (e.response?.statusCode === 404) {
            if (profileCreateInFlightRef.current.has(resolvedEmail)) {
              return;
            }

            profileCreateInFlightRef.current.add(resolvedEmail);

            try {
              await createProfile(resolvedEmail, resolvedName, resolvedImgUrl);
            } finally {
              profileCreateInFlightRef.current.delete(resolvedEmail);
            }
          }
        });
      };

      syncProfile();

      return () => {
        isCancelled = true;
      };
    } else {
      setUserData(null);
      profileCreateInFlightRef.current.clear();
    }
  }, [isAuthenticated, user]);

  /* ---------- Context Value ---------- */

  const value = useMemo(
    () => ({
      userData,
      setUserData,

      templatesList,
      setTemplatesList,
      isTemplatesLoading,
      isTemplatesLoadingMore,
      templatesHasMore,
      templatesNextCursor,
      templateCategories,

      userSites,
      isUserSitesLoading,
      userSitesError,

      loading,

      getProfile,
      createProfile,
      updateProfile,
      listTemplates,
      loadMoreTemplates,
      updateTemplate,
      deleteTemplate,
      registerTemplate,
      listUserSites,
      invalidateUserSitesCache,

      deploySite,
      createSite,
      deleteSite,
      attachDomain,
      checkDomainAvailability,
      checkSubdomainAvailability,
      startDomainSetup,
      checkDomainValidation,
      createCloudfront,
      createDomainDNSRecord,
      registerDomain,
      checkDomainStatus,
      updateSiteData,
      switchSiteTemplate,
      getSite,
      createPaymentSession,
      finalizePaymentSession,
      createRazorpayOrder,
      verifyRazorpayPayment,
      createPaypalOrder,
      capturePaypalPayment,
      getUserLocationPricing,
      getDomainPricing,
      getPaymentDetails,
      pauseSubscription,
      cancelSubscription,
    }),
    [
      userData,
      templatesList,
      isTemplatesLoading,
      isTemplatesLoadingMore,
      templatesHasMore,
      templatesNextCursor,
      templateCategories,
      userSites,
      isUserSitesLoading,
      userSitesError,
      loading,
      isAuthenticated,
    ],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

/* ---------- Hook ---------- */

export const useApi = () => {
  const ctx = useContext(ApiContext);

  if (!ctx) throw new Error("useApi must be used inside <ApiProvider>");

  return ctx;
};

export default ApiContext;
