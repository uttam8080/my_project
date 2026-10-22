import { post } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import { apiEndpoint, apiRegion } from "../config/appEnv";

/** Max image upload size — keep files small for faster builder previews. */
export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMAGE_UPLOAD_LABEL = "2 MB";

const API_BASE = apiEndpoint;
const API_REGION = apiRegion;

async function parseJsonBody(restResponse) {
  try {
    return await restResponse.body.json();
  } catch {
    return null;
  }
}

function friendlyUploadError(err) {
  const message = String(err?.message || err || "");
  if (/cors|network error|failed to fetch|load failed|err_failed/i.test(message)) {
    return `Upload blocked by the network. Please use an image under ${MAX_IMAGE_UPLOAD_LABEL}, refresh, and try again.`;
  }
  if (/invalidsignature|signature|unauthorized|not authorized|401|403|signed in|credentials/i.test(message)) {
    return "Upload auth failed. Refresh the page and sign in again.";
  }
  return message || "Upload failed. Please try again.";
}

export function assertImageFileSize(file, maxBytes = MAX_IMAGE_UPLOAD_BYTES) {
  if (!file) {
    throw new Error("No file selected for upload");
  }
  if (file.size > maxBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Image is ${sizeMb} MB. Please use a smaller image under ${MAX_IMAGE_UPLOAD_LABEL}.`,
    );
  }
}

/**
 * /admin/upload-file is IAM-auth. On localhost, Amplify can't call it (CORS),
 * so we SigV4-sign for the real API host, then tunnel via Vite middleware.
 */
async function postUploadActionIamDev(path, body) {
  const session = await fetchAuthSession();
  const credentials = session.credentials;
  if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
    throw new Error("You must be signed in to upload images.");
  }

  const url = new URL(`${API_BASE}${path}`);
  const bodyStr = JSON.stringify(body);

  const request = new HttpRequest({
    method: "POST",
    protocol: url.protocol,
    hostname: url.hostname,
    path: url.pathname,
    headers: {
      "content-type": "application/json",
      host: url.hostname,
    },
    body: bodyStr,
  });

  const signer = new SignatureV4({
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
    region: API_REGION,
    service: "execute-api",
    sha256: Sha256,
  });

  const signed = await signer.sign(request);
  const headers = {};
  Object.entries(signed.headers || {}).forEach(([key, value]) => {
    if (!value) return;
    // Let the Node fetch set Host from the target URL.
    if (key.toLowerCase() === "host") return;
    headers[key] = value;
  });

  const response = await fetch(`/__tekkzy_api${path}`, {
    method: "POST",
    headers,
    body: bodyStr,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.Message ||
        data?.error ||
        `Upload API failed (${response.status})`,
    );
  }

  return data;
}

async function postUploadAction(path, body) {
  if (import.meta.env.DEV) {
    return postUploadActionIamDev(path, body);
  }

  const restResponse = await post({
    apiName: "main",
    path,
    options: {
      body,
      authMode: "iam",
    },
  }).response;

  const data = await parseJsonBody(restResponse);
  const status = restResponse.statusCode ?? restResponse.status;
  if (typeof status === "number" && (status < 200 || status >= 300)) {
    throw new Error(
      data?.error || data?.message || `Upload API failed (${status})`,
    );
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function multipartUploadToS3(file, options = {}) {
  const {
    path = "/admin/upload-file",
    bucket = "institution-utils",
    region = "us-east-1",
    folder = "tekkzy",
    chunkSize = 5 * 1024 * 1024,
    maxBytes = MAX_IMAGE_UPLOAD_BYTES,
  } = options;

  if (!file) {
    throw new Error("No file selected for upload");
  }

  assertImageFileSize(file, maxBytes);

  const safeName = file.name.replace(/\s+/g, "_");
  const fileName = `${Date.now()}_${safeName}`;

  let initData;
  try {
    initData = await postUploadAction(path, {
      action: "INITIATE",
      bucket,
      region,
      folder,
      fileName,
      fileType: file.type,
    });
  } catch (err) {
    throw new Error(friendlyUploadError(err));
  }

  const uploadId = initData?.uploadId;
  if (!uploadId) {
    throw new Error("Failed to start multipart upload");
  }

  const parts = [];
  let partNumber = 1;

  for (let start = 0; start < file.size; start += chunkSize) {
    const chunk = file.slice(start, start + chunkSize);

    let urlData;
    try {
      urlData = await postUploadAction(path, {
        action: "GET_PRESIGNED_URL",
        bucket,
        region,
        folder,
        fileName,
        partNumber,
        uploadId,
      });
    } catch (err) {
      throw new Error(friendlyUploadError(err));
    }

    const presignedUrl = urlData?.presignedUrl;
    if (!presignedUrl) {
      throw new Error("Failed to get pre-signed URL");
    }

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      body: chunk,
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload part ${partNumber}`);
    }

    const etag = uploadRes.headers.get("ETag");
    parts.push({
      ETag: etag,
      PartNumber: partNumber,
    });

    partNumber += 1;
  }

  let completeData;
  try {
    completeData = await postUploadAction(path, {
      action: "COMPLETE",
      bucket,
      region,
      folder,
      fileName,
      uploadId,
      parts,
    });
  } catch (err) {
    throw new Error(friendlyUploadError(err));
  }

  const fileUrl = completeData?.fileUrl;
  if (!fileUrl) {
    throw new Error("Upload completed but no file URL returned");
  }

  return fileUrl;
}
