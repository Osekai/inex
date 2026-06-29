// ─── config ───────────────────────────────────────────────────────────────────

import {D2} from "./d2";
import {Overlay} from "../ui/overlay";
import {deleteFromDB, getFromDB, openDB, putInDB} from "./indexeddb";
import {PushToast} from "../ui/toasts";

const DEFAULT_RETRY_COUNT = 0;
const DEFAULT_CACHE_TTL = 5; // seconds

// ─── in-flight deduplication ──────────────────────────────────────────────────

const inFlight = new Map();

// ─── error types ──────────────────────────────────────────────────────────────

export class RequestError extends Error {
    constructor(message, { status, body } = {}) {
        super(message);
        this.name = "RequestError";
        this.status = status ?? null;
        this.body = body ?? null;
    }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function cacheKey(method, url, data) {
    return `${method}:${url}:${data != null ? JSON.stringify(data) : ""}`;
}

function getLoaderEl() {
    return document.getElementById("request-loader");
}

function showLoader() {
    getLoaderEl()?.classList.remove("hidden");
}

function hideLoader() {
    getLoaderEl()?.classList.add("hidden");
}

function toFormData(data) {
    const form = new FormData();
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof File || value instanceof Blob) {
            form.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((item, i) => form.append(`${key}[${i}]`, item));
        } else {
            form.append(key, value);
        }
    }
    return form;
}

function appendCompress(url, method, body) {
    // always add compress to the url for get requests
    if (method === "GET") {
        return [url + (url.includes("?") ? "&" : "?") + "compress", body];
    }
    // for other methods, add to body
    if (body instanceof FormData) {
        body.append("compress", "yes");
    } else if (body && typeof body === "object") {
        body = { ...body, compress: "yes" };
    }
    return [url, body];
}

/**
 * handles the standardised { success, message, content } envelope
 * throws or toasts for known error states, returns data otherwise
 */
function handleEnvelope(data, url) {
    if (typeof data?.success === "undefined") return data;

    if (data.message === "no_permission") {
        PushToast({ theme: "error", content: "Your account is not currently allowed to do this action." });
        throw new RequestError("no_permission");
    }

    if (data.message === "rate_limited") {
        PushToast({ theme: "error", content: "Slow down! You are being rate limited." });
        throw new RequestError("rate_limited");
    }

    if (data.success === -1) {
        PushToast({
            theme: "error",
            content: "Unknown backend error, please contact support",
            buttons: {
                "More Info": () => showBackendError(data.content),
            },
        });
        throw new RequestError("backend_error", { body: data.content });
    }

    if (data.success === -2) {
        PushToast({ theme: "error", content: data.message });
        // not thrown — callers can still inspect data.success if needed
    }

    return data;
}

function showBackendError(content) {
    const outer = D2.Div();
    const overlay = new Overlay(outer);

    D2._currentParent = outer;
    for (const field of ["errno", "errstr", "errfile", "errline"]) {
        D2.Text("h1", field);
        D2.Text("pre", String(content[field] ?? "").replace("\\n", "\n"));
    }
    const close = D2.Button("close");
    D2._currentParent = null;

    close.addEventListener("click", () => overlay.remove());
}

const HTTP_ERROR_LABELS = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    503: "Service Unavailable",
};


// ─── response unpacker ────────────────────────────────────────────────────────

function castValue(value, type) {
    if (value === null) return null;
    switch (type) {
        case "integer": return parseInt(value, 10);
        case "double": return parseFloat(value);
        default: return value; // string, etc
    }
}

function unpack(val) {
    if (val === null || typeof val !== "object") return val;
    if (Array.isArray(val)) return val.map(unpack);
    if (val._t) {
        return val.d.map(row =>
            Object.fromEntries(val.k.map((k, i) => [k, castValue(unpack(row[i]), val.types?.[i])]))
        );
    }
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, unpack(v)]));
}

// ─── sleep ────────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// ─── core request ─────────────────────────────────────────────────────────────

/**
 * @param {string} method
 * @param {string} url
 * @param {object|FormData|null} body
 * @param {object} options
 * @param {Record<string,string>} [options.headers]
 * @param {AbortSignal}           [options.signal]
 * @param {number}                [options.retries]   number of retry attempts on network failure
 * @param {(fraction: number, event: ProgressEvent) => void} [options.onProgress]
 */
async function doRequest(method, url, body = null, {
    headers = {},
    signal,
    retries = DEFAULT_RETRY_COUNT,
    onProgress,
} = {}) {
    showLoader();

    [url, body] = appendCompress(url, method, body);

    const isFormData = body instanceof FormData;
    const requestHeaders = new Headers(headers);

    if (body && !isFormData) {
        requestHeaders.set("Content-Type", "application/json");
    }

    const requestBody = body
        ? (isFormData ? body : JSON.stringify(body, getCircularReplacer()))
        : undefined;

    // upload progress requires xhr — wrap in a promise when needed
    const makeFetcher = () => onProgress
        ? xhrFetch(method, url, requestBody, requestHeaders, signal, onProgress)
        : fetch(url, { method, headers: requestHeaders, body: requestBody, signal });

    let attempt = 0;
    let lastError;

    while (attempt <= retries) {
        try {
            const response = await makeFetcher();
            hideLoader();

            if (HTTP_ERROR_LABELS[response.status]) {
                throw new RequestError(HTTP_ERROR_LABELS[response.status], { status: response.status });
            }

            const text = await response.text();

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch {
                return text; // non-json response
            }

            if (parsed.content) parsed.content = unpack(parsed.content);

            return handleEnvelope(parsed, url);
        } catch (err) {
            hideLoader();
            if (err instanceof RequestError) throw err; // don't retry known errors
            lastError = err;
            attempt++;
            if (attempt <= retries) {
                await sleep(200 * attempt); // simple backoff
            }
        }
    }

    throw lastError ?? new RequestError("Network error");
}

// ─── xhr shim for upload progress ─────────────────────────────────────────────

function xhrFetch(method, url, body, headers, signal, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        headers.forEach((value, key) => xhr.setRequestHeader(key, value));

        if (signal) {
            signal.addEventListener("abort", () => xhr.abort());
        }

        if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress(e.loaded / e.total, e);
            };
        }

        xhr.onload = () => {
            resolve({
                status: xhr.status,
                text: () => Promise.resolve(xhr.responseText),
            });
        };

        xhr.onerror = () => reject(new RequestError("XHR network error"));
        xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));

        xhr.send(body ?? null);
    });
}

// ─── public api ───────────────────────────────────────────────────────────────

/**
 * basic request
 */
export async function DoRequest(method, url, data = null, options = {}) {
    return doRequest(method, url, data, options);
}

/**
 * shows a full-screen loader overlay while the request runs
 */
export async function DoRequestWithLoader(method, url, data, loadingText, options = {}) {
    const overlay = new LoaderOverlay(loadingText);
    try {
        const resp = await doRequest(method, url, data, options);
        overlay.remove();
        return resp;
    } catch (err) {
        overlay.remove();
        throw err;
    }
}

function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return;
            seen.add(value);
        }
        return value;
    };
}

/**
 * multipart/form-data upload, with optional progress callback
 */
export async function DoRequestWithFile(method, url, data = {}, options = {}) {
    return doRequest(method, url, toFormData(data), options);
}

/**
 * cached get — deduplicates in-flight requests for the same url+data, persists via indexeddb
 */
export async function DoRequestCache(method, url, data = null, ttl = DEFAULT_CACHE_TTL, options = {}) {
    const key = cacheKey(method, url, data);
    const now = Date.now();

    const db = await openDB();
    const cached = await getFromDB(db, key);

    if (cached) {
        if (now - cached.timestamp < ttl * 1000) return cached.response;
        await deleteFromDB(db, key);
    }

    if (inFlight.has(key)) return inFlight.get(key);

    const promise = doRequest(method, url, data, options).then(async (response) => {
        if (response?.success !== -2) {
            await putInDB(db, key, { timestamp: now, response });
        }
        inFlight.delete(key);
        return response;
    }).catch((err) => {
        inFlight.delete(key);
        throw err;
    });

    inFlight.set(key, promise);
    return promise;
}

/**
 * manually bust a cache entry
 */
export function BustCache(method, url, data = null) {
    // fire and forget is fine here
    openDB().then(db => deleteFromDB(db, cacheKey(method, url, data)));
}