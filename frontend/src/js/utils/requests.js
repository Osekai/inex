import {IsJsonString} from "./json";

async function DoRequest(method, url, data = null, headers = {}) {
    if (url == null) {
        url = method;
        method = "GET";
    }
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        for (var header in headers) {
            xhr.setRequestHeader(header, headers[header]);
        }
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(resolve(JSON.parse(xhr.responseText, function (k, v) {
                    // Check if the value is an object
                    if (typeof v === "object" && v !== null) {
                        return v;  // Return the object as is
                    }

                    // Check if the value is a boolean (true or false)
                    if (v === true || v === false) {
                        return v;
                    }

                    // Check if the value is a non-numeric string
                    if (isNaN(v)) {
                        return v;  // Return the string as is
                    }

                    // Otherwise, parse the value as an integer
                    return parseInt(v, 10);
                })));
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: xhr.status,
                statusText: xhr.statusText
            });
        };
        if (data) {
            var formData = new FormData();
            for (var key in data) {
                formData.append(key, data[key]);
            }
            xhr.send(formData);
        } else {
            xhr.send()
        }
    });
}

export {DoRequest};