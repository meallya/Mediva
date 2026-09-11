const API_BASE_URL = "/api";

/*
|--------------------------------------------------------------------------
| STATE INTERNAL
|--------------------------------------------------------------------------
|
| - GET yang sama dan sedang berjalan tidak dikirim dua kali.
| - CSRF cookie tidak diminta ulang pada setiap mutation.
|
*/

const inFlightGets = new Map();

let csrfPromise = null;

/*
|--------------------------------------------------------------------------
| COOKIE
|--------------------------------------------------------------------------
*/

function getCookie(name) {
    const cookies = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${name}=`));

    if (!cookies) {
        return null;
    }

    const value = cookies.substring(name.length + 1);

    return decodeURIComponent(value);
}

/*
|--------------------------------------------------------------------------
| EVENT
|--------------------------------------------------------------------------
*/

function dispatchMedivaEvent(name, detail = {}) {
    window.dispatchEvent(
        new CustomEvent(name, {
            detail,
        }),
    );
}

/*
|--------------------------------------------------------------------------
| QUERY STRING
|--------------------------------------------------------------------------
*/

function buildUrl(endpoint, params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => {
                searchParams.append(key, item);
            });

            return;
        }

        searchParams.set(key, value);
    });

    const query = searchParams.toString();

    if (!query) {
        return `${API_BASE_URL}${endpoint}`;
    }

    const separator = endpoint.includes("?") ? "&" : "?";

    return `${API_BASE_URL}${endpoint}${separator}${query}`;
}

/*
|--------------------------------------------------------------------------
| CSRF
|--------------------------------------------------------------------------
*/

async function ensureCsrfToken(force = false) {
    /*
    |--------------------------------------------------------------------------
    | COOKIE SUDAH ADA
    |--------------------------------------------------------------------------
    */

    if (!force && getCookie("XSRF-TOKEN")) {
        return;
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST SEDANG BERJALAN
    |--------------------------------------------------------------------------
    */

    if (!force && csrfPromise) {
        return csrfPromise;
    }

    csrfPromise = fetch("/sanctum/csrf-cookie", {
        method: "GET",

        credentials: "include",

        headers: {
            Accept: "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Gagal mengambil CSRF token.");
            }
        })
        .finally(() => {
            csrfPromise = null;
        });

    return csrfPromise;
}

/*
|--------------------------------------------------------------------------
| PARSE RESPONSE
|--------------------------------------------------------------------------
*/

async function parseResponse(response) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    try {
        return await response.text();
    } catch {
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| EXECUTE
|--------------------------------------------------------------------------
*/

async function executeRequest(endpoint, options = {}, allowCsrfRetry = true) {
    const method = (options.method ?? "GET").toUpperCase();

    const requiresCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    const {
        params,
        timeout = 15000,
        silent = false,
        headers: optionHeaders = {},
        ...fetchOptions
    } = options;

    /*
    |--------------------------------------------------------------------------
    | CSRF
    |--------------------------------------------------------------------------
    */

    if (requiresCsrf) {
        await ensureCsrfToken();
    }

    /*
    |--------------------------------------------------------------------------
    | URL
    |--------------------------------------------------------------------------
    */

    const url = buildUrl(endpoint, params);

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    const headers = {
        Accept: "application/json",

        ...optionHeaders,
    };

    if (fetchOptions.body) {
        headers["Content-Type"] = "application/json";
    }

    const xsrfToken = getCookie("XSRF-TOKEN");

    if (requiresCsrf && xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    /*
    |--------------------------------------------------------------------------
    | TIMEOUT
    |--------------------------------------------------------------------------
    */

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    const startedAt = performance.now();

    dispatchMedivaEvent("mediva:request-start", {
        method,
        endpoint,
    });

    try {
        /*
        |--------------------------------------------------------------------------
        | REQUEST
        |--------------------------------------------------------------------------
        */

        const response = await fetch(url, {
            ...fetchOptions,

            method,

            credentials: "include",

            headers,

            signal: controller.signal,
        });

        /*
        |--------------------------------------------------------------------------
        | CSRF EXPIRED
        |--------------------------------------------------------------------------
        */

        if (response.status === 419 && requiresCsrf && allowCsrfRetry) {
            await ensureCsrfToken(true);

            return executeRequest(endpoint, options, false);
        }

        const data = await parseResponse(response);

        /*
        |--------------------------------------------------------------------------
        | ERROR
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {
            const error = new Error(
                data?.message ?? "Terjadi kesalahan saat menghubungi server.",
            );

            error.status = response.status;

            error.data = data;

            /*
            |--------------------------------------------------------------------------
            | GLOBAL ERROR TOAST
            |--------------------------------------------------------------------------
            |
            | 401 GET /auth/me sengaja tidak ditampilkan.
            |
            */

            if (!silent && requiresCsrf && response.status !== 401) {
                dispatchMedivaEvent("mediva:api-error", {
                    message: error.message,

                    status: response.status,
                });
            }

            throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | GLOBAL SUCCESS TOAST
        |--------------------------------------------------------------------------
        */

        if (!silent && requiresCsrf && data?.message) {
            dispatchMedivaEvent("mediva:api-success", {
                message: data.message,
            });
        }

        return data;
    } catch (error) {
        if (error?.name === "AbortError") {
            const timeoutError = new Error(
                "Server membutuhkan waktu terlalu lama untuk merespons.",
            );

            timeoutError.status = 408;

            if (!silent) {
                dispatchMedivaEvent("mediva:api-error", {
                    message: timeoutError.message,
                });
            }

            throw timeoutError;
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);

        const duration = Math.round(performance.now() - startedAt);

        dispatchMedivaEvent("mediva:request-end", {
            method,
            endpoint,
            duration,
        });

        /*
        |--------------------------------------------------------------------------
        | DEBUG REQUEST LAMBAT
        |--------------------------------------------------------------------------
        */

        if (duration > 3000) {
            console.warn(
                `[MEDIVA] Slow API: ${method} ${endpoint} (${duration}ms)`,
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| REQUEST
|--------------------------------------------------------------------------
*/

function request(endpoint, options = {}) {
    const method = (options.method ?? "GET").toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | DEDUPE GET
    |--------------------------------------------------------------------------
    |
    | Berguna juga untuk React StrictMode yang kadang memanggil GET dua kali
    | saat development.
    |
    */

    if (method === "GET") {
        const key = JSON.stringify({
            endpoint,

            params: options.params ?? {},
        });

        if (inFlightGets.has(key)) {
            return inFlightGets.get(key);
        }

        const promise = executeRequest(endpoint, options).finally(() => {
            inFlightGets.delete(key);
        });

        inFlightGets.set(key, promise);

        return promise;
    }

    return executeRequest(endpoint, options);
}

/*
|--------------------------------------------------------------------------
| API METHODS
|--------------------------------------------------------------------------
*/

const api = {
    get(endpoint, options = {}) {
        return request(endpoint, {
            ...options,

            method: "GET",
        });
    },

    post(endpoint, body = {}, options = {}) {
        return request(endpoint, {
            ...options,

            method: "POST",

            body: JSON.stringify(body),
        });
    },

    put(endpoint, body = {}, options = {}) {
        return request(endpoint, {
            ...options,

            method: "PUT",

            body: JSON.stringify(body),
        });
    },

    patch(endpoint, body = {}, options = {}) {
        return request(endpoint, {
            ...options,

            method: "PATCH",

            body: JSON.stringify(body),
        });
    },

    delete(endpoint, options = {}) {
        return request(endpoint, {
            ...options,

            method: "DELETE",
        });
    },
};

export default api;
