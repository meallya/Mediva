import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faCheck,
    faCircleExclamation,
    faCircleInfo,
    faTriangleExclamation,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

const ToastContext = createContext(null);

function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const [requestCount, setRequestCount] = useState(0);

    const [showLoadingBar, setShowLoadingBar] = useState(false);

    const loadingTimer = useRef(null);

    /*
    |--------------------------------------------------------------------------
    | REMOVE
    |--------------------------------------------------------------------------
    */

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    const showToast = useCallback(
        ({ type = "success", title, message, duration = 3200 }) => {
            if (!message) {
                return;
            }

            const id = createId();

            setToasts((current) => [
                ...current,
                {
                    id,
                    type,
                    title,
                    message,
                },
            ]);

            window.setTimeout(() => {
                removeToast(id);
            }, duration);

            return id;
        },
        [removeToast],
    );

    /*
    |--------------------------------------------------------------------------
    | API EVENTS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleSuccess = (event) => {
            showToast({
                type: "success",

                title: "Berhasil",

                message: event.detail?.message,
            });
        };

        const handleError = (event) => {
            showToast({
                type: "error",

                title: "Terjadi Kesalahan",

                message: event.detail?.message,
                duration: 5000,
            });
        };

        const handleRequestStart = () => {
            setRequestCount((count) => count + 1);
        };

        const handleRequestEnd = () => {
            setRequestCount((count) => Math.max(0, count - 1));
        };

        window.addEventListener("mediva:api-success", handleSuccess);

        window.addEventListener("mediva:api-error", handleError);

        window.addEventListener("mediva:request-start", handleRequestStart);

        window.addEventListener("mediva:request-end", handleRequestEnd);

        return () => {
            window.removeEventListener("mediva:api-success", handleSuccess);

            window.removeEventListener("mediva:api-error", handleError);

            window.removeEventListener(
                "mediva:request-start",
                handleRequestStart,
            );

            window.removeEventListener("mediva:request-end", handleRequestEnd);
        };
    }, [showToast]);

    /*
    |--------------------------------------------------------------------------
    | DELAY LOADING BAR
    |--------------------------------------------------------------------------
    |
    */

    useEffect(() => {
        if (requestCount > 0) {
            loadingTimer.current = window.setTimeout(() => {
                setShowLoadingBar(true);
            }, 350);

            return () => {
                if (loadingTimer.current) {
                    clearTimeout(loadingTimer.current);
                }
            };
        }

        if (loadingTimer.current) {
            clearTimeout(loadingTimer.current);
        }

        setShowLoadingBar(false);
    }, [requestCount]);

    /*
    |--------------------------------------------------------------------------
    | SHORTCUT METHODS
    |--------------------------------------------------------------------------
    */

    const success = useCallback(
        (message, title = "Berhasil") => {
            return showToast({
                type: "success",
                title,
                message,
            });
        },
        [showToast],
    );

    const error = useCallback(
        (message, title = "Terjadi Kesalahan") => {
            return showToast({
                type: "error",
                title,
                message,
                duration: 5000,
            });
        },
        [showToast],
    );

    const warning = useCallback(
        (message, title = "Perhatian") => {
            return showToast({
                type: "warning",
                title,
                message,
                duration: 4500,
            });
        },
        [showToast],
    );

    const info = useCallback(
        (message, title = "Informasi") => {
            return showToast({
                type: "info",
                title,
                message,
            });
        },
        [showToast],
    );

    const value = {
        showToast,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* =============================================================
                GLOBAL REQUEST INDICATOR
            ============================================================== */}

            {showLoadingBar && (
                <div
                    className="
                        mediva-request-progress
                        fixed
                        left-0
                        right-0
                        top-0
                        z-[10000]
                        h-[3px]
                        overflow-hidden
                        bg-[#C2E1F4]
                    "
                >
                    <div
                        className="
                            mediva-request-progress__bar
                            h-full
                            w-[40%]
                            rounded-full
                            bg-[#047AF7]
                        "
                    />
                </div>
            )}

            {/* =============================================================
                TOAST
            ============================================================== */}

            <div
                className="
        fixed
        bottom-[24px]
        right-[24px]
        z-[9999]
        w-[calc(100%-32px)]
        max-w-[440px]
    "
            >
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }) {
    const config = {
        success: {
            icon: faCheck,

            iconClass: "bg-[#CDE8E5] text-[#4d8585]",

            borderClass: "border-[#CDE8E5]",
        },

        error: {
            icon: faCircleExclamation,

            iconClass: "bg-red-50 text-red-500",

            borderClass: "border-red-100",
        },

        warning: {
            icon: faTriangleExclamation,

            iconClass: "bg-amber-50 text-amber-600",

            borderClass: "border-amber-100",
        },

        info: {
            icon: faCircleInfo,

            iconClass: "bg-[#C2E1F4]/50 text-[#047AF7]",

            borderClass: "border-[#C2E1F4]",
        },
    };

    const item = config[toast.type] ?? config.info;

    return (
        <div
            role={toast.type === "error" ? "alert" : "status"}
            className={`
                mediva-toast
                pointer-events-auto
                flex
                items-start
                gap-[13px]
                rounded-[13px]
                border
                bg-white
                px-[16px]
                py-[15px]
                shadow-[0_14px_40px_rgba(33,33,33,0.14)]

                ${item.borderClass}
            `}
        >
            <div
                className={`
                    flex
                    h-[36px]
                    w-[36px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[10px]

                    ${item.iconClass}
                `}
            >
                <FontAwesomeIcon icon={item.icon} className="text-[14px]" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[#212121]">
                    {toast.title}
                </p>

                <p className="mt-[3px] text-[13px] leading-[1.55] text-[#626262]">
                    {toast.message}
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                aria-label="Tutup notifikasi"
                className="
                    flex
                    h-[30px]
                    w-[30px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[8px]
                    text-[#999999]
                    transition
                    hover:bg-[#f4f5f6]
                    hover:text-[#212121]
                "
            >
                <FontAwesomeIcon icon={faXmark} className="text-[12px]" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast harus digunakan di dalam ToastProvider.");
    }

    return context;
}
