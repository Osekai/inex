import {IsJsonString} from "./json.js";
import {PushToast} from "../ui/toasts.js";
import {LoaderOverlay} from "../ui/loader-overlay.js";
import {Overlay} from "../ui/overlay.js";
import {Div, Text} from "./dom.js";
import {deleteFromDB, getFromDB, openDB, putInDB} from "./indexeddb";


async function DoRequestWithLoader(method, url, data, loadingText) {
    let overlay = new LoaderOverlay(loadingText);
    try {
        var resp = await DoRequest(method, url, data);
        overlay.remove();
        return resp;
    } catch (error) {
        console.log(error);
        overlay.remove();
        throw error;
    }
}

async function DoRequestWithFile(method, url, data = {}, headers = {}, onUploadProgress = null) {
    const form = new FormData();

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value = data[key];

            if (value instanceof File || value instanceof Blob) {
                form.append(key, value);
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    form.append(`${key}[${index}]`, item);
                });
            } else {
                form.append(key, value);
            }
        }
    }

    return await DoRequest(method, url, form, headers, onUploadProgress);
}

async function DoRequest(method, url, data = null, headers = {}, onUploadProgress = null) {
    if (document.getElementById("request-loader")) {
        document.getElementById("request-loader").classList.remove("hidden");
    }

    if (url == null) {
        url = method;
        method = "GET";
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        for (const header in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, header)) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }

        console.log(`Starting ${method} request to ${url}`);

        if (onUploadProgress && xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const fraction = event.loaded / event.total;
                    console.log(`Progress for ${url}: ${Math.round(fraction * 100)}%`);
                    onUploadProgress(fraction, event);
                }
            };
        }

        xhr.onload = () => {
            if (document.getElementById("request-loader")) {
                document.getElementById("request-loader").classList.add("hidden");
            }

            console.log(`Completed ${method} request to ${url} with status ${xhr.status}`);

            if ([400, 401, 403, 404, 503].includes(xhr.status)) {
                const statusTextMap = {
                    400: "Bad Request",
                    401: "Unauthorized",
                    403: "Forbidden",
                    404: "Not Found",
                    503: "Service Unavailable",
                };

                const message = `${statusTextMap[xhr.status]} at ${url}`;
                PushToast({ theme: "error", content: message });

                reject({
                    status: xhr.status,
                    statusText: statusTextMap[xhr.status],
                    message,
                });
                return;
            }



            if (xhr.responseText !== null) {
                try {
                    if (IsJsonString(xhr.responseText)) {
                        const data = JSON.parse(xhr.responseText, (k, v) => {
                            if (typeof v === "object" || typeof v === "boolean" || v === null) return v;

                            // ignore strings that are hex color codes
                            if (typeof v === "string" && /^([a-f0-9]{6})$/i.test(v)) {
                                return v;
                            }

                            // convert numeric strings (that aren't hex) to numbers
                            if (!isNaN(v) && typeof v === "string") {
                                return parseFloat(v);
                            }

                            return v;
                        });



                        if (typeof data.success !== "undefined") {
                            if (data.message === "no_permission") {
                                PushToast({ theme: "error", content: "Your account is not currently allowed to do this action." });
                                reject("Your account is not currently allowed to do this action.");
                                return;
                            }
                            if (data.message === "rate_limited") {
                                PushToast({ theme: "error", content: "Slow down! You are being rate limited." });
                                reject("Slow down! You are being rate limited.");
                                return;
                            }
                            if(data.success == -1) {
                                (async () => {
                                    PushToast({
                                        theme: "error",
                                        content: "Unknown backend error, please contact support",
                                        buttons: {
                                            "More Info": () => {
                                                const overlayOuter = Div("div");
                                                const overlay = new Overlay(overlayOuter);

                                                overlayOuter.appendChild(new Text("h1", "errno"));
                                                overlayOuter.appendChild(new Text("pre", data.content.errno));

                                                overlayOuter.appendChild(new Text("h1", "errstr"));
                                                overlayOuter.appendChild(new Text("pre", data.content.errstr.replace("\\n", "\n")));

                                                overlayOuter.appendChild(new Text("h1", "errfile"));
                                                overlayOuter.appendChild(new Text("pre", data.content.errfile));

                                                overlayOuter.appendChild(new Text("h1", "errline"));
                                                overlayOuter.appendChild(new Text("pre", data.content.errline));

                                                const close = Div("button", "button");
                                                close.innerText = "close";

                                                overlayOuter.appendChild(close);
                                                close.addEventListener("click", () => {
                                                    overlay.remove();
                                                });
                                            }
                                        }
                                    });
                                })();
                                reject("System error");
                                return;
                            }
                            if(data.success == -2) {
                                PushToast({
                                    theme: "error",
                                    content: data.message
                                })
                            }
                        }

                        resolve(data);
                    } else {
                        resolve(xhr.responseText);
                    }
                } catch {
                    resolve(xhr.responseText);
                }
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            }
        };

        xhr.onerror = () => {
            reject({
                status: xhr.status,
                statusText: xhr.statusText,
            });
        };

        if (data) {
            if (data instanceof FormData) {
                xhr.send(data); // Browser sets Content-Type automatically for FormData
            } else {
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify(data, getCircularReplacer()));
            }
        } else {
            xhr.send();
        }
    });
}


function getCircularReplacer() {
    const seen = new WeakSet();
    return function(key, value) {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return; // skip circular reference
            }
            seen.add(value);
        }
        return value;
    };
}

let requestInProgress = {};


async function DoRequestCache(method, url, data = null, cacheTime = 5) {
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
    const now = Date.now();

    const db = await openDB();
    const cachedEntry = await getFromDB(db, cacheKey);

    if (cachedEntry) {
        if (now - cachedEntry.timestamp < cacheTime * 1000) {
            return cachedEntry.response;
        } else {
            await deleteFromDB(db, cacheKey); // remove expired cache
        }
    }


    if (requestInProgress[cacheKey]) {
        return requestInProgress[cacheKey];
    }

    const requestPromise = DoRequest(method, url, data).then(async response => {
        if(response.success !== -2) {
            await putInDB(db, cacheKey, {
                timestamp: now,
                response
            });
        }
        delete requestInProgress[cacheKey];
        return response;
    }).catch(error => {
        delete requestInProgress[cacheKey];
        throw error;
    });

    requestInProgress[cacheKey] = requestPromise;
    return requestPromise;
}



export {DoRequest, DoRequestWithLoader, DoRequestCache, DoRequestWithFile};