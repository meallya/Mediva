import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import useAuth from "../hooks/useAuth";

export default function LoginPage() {
    const navigate = useNavigate();

    const { login } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | FORM
    |--------------------------------------------------------------------------
    */

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD REMEMBERED USERNAME
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const rememberedUsername = localStorage.getItem(
            "mediva_remembered_username",
        );

        if (rememberedUsername) {
            setFormData((prev) => ({
                ...prev,

                username: rememberedUsername,

                remember: true,
            }));
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | HANDLE CHANGE
    |--------------------------------------------------------------------------
    */

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => ({
            ...prev,

            [name]: type === "checkbox" ? checked : value,
        }));

        if (error) {
            setError("");
        }
    };

    /*
    |--------------------------------------------------------------------------
    | HANDLE SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!formData.username.trim() || !formData.password) {
            setError("Username dan password wajib diisi.");

            return;
        }

        try {
            setLoading(true);

            await login({
                username: formData.username,

                password: formData.password,

                remember: formData.remember,
            });

            /*
                |--------------------------------------------------------------------------
                | REMEMBER USERNAME
                |--------------------------------------------------------------------------
                |
                | Hanya username yang disimpan.
                | Password TIDAK pernah disimpan.
                |
                */

            if (formData.remember) {
                localStorage.setItem(
                    "mediva_remembered_username",
                    formData.username,
                );
            } else {
                localStorage.removeItem("mediva_remembered_username");
            }

            navigate("/dashboard", {
                replace: true,
            });
        } catch (error) {
            if (error.status === 422) {
                setError("Username dan password wajib diisi.");
            } else if (error.status === 401) {
                setError("Username atau password salah.");
            } else if (error.status === 403) {
                setError(error.message || "Akun tidak dapat mengakses MEDIVA.");
            } else if (error.status === 429) {
                setError("Terlalu banyak percobaan login.");
            } else {
                setError(error.message || "Terjadi kesalahan.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* =============================================================
                MEDIVA ANIMATION
            ============================================================== */}

            <style>
                {`
                    /*
                    |--------------------------------------------------------------------------
                    | FLOAT BLUE
                    |--------------------------------------------------------------------------
                    */

                    @keyframes medivaFloatBlue {
                        0%,
                        100% {
                            transform:
                                translate3d(
                                    0,
                                    0,
                                    0
                                )
                                scale(1);
                        }

                        35% {
                            transform:
                                translate3d(
                                    35px,
                                    -25px,
                                    0
                                )
                                scale(1.05);
                        }

                        70% {
                            transform:
                                translate3d(
                                    -25px,
                                    35px,
                                    0
                                )
                                scale(0.97);
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | FLOAT MINT
                    |--------------------------------------------------------------------------
                    */

                    @keyframes medivaFloatMint {
                        0%,
                        100% {
                            transform:
                                translate3d(
                                    0,
                                    0,
                                    0
                                )
                                scale(1);
                        }

                        35% {
                            transform:
                                translate3d(
                                    -35px,
                                    -20px,
                                    0
                                )
                                scale(1.06);
                        }

                        70% {
                            transform:
                                translate3d(
                                    20px,
                                    40px,
                                    0
                                )
                                scale(0.98);
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | HEARTBEAT BLUE
                    |--------------------------------------------------------------------------
                    |
                    | LUB - DUB
                    |
                    */

                    @keyframes medivaHeartbeatBlue {
                        0% {
                            opacity: 0.18;
                            transform: scale(1);
                        }

                        8% {
                            opacity: 0.32;
                            transform: scale(1.08);
                        }

                        14% {
                            opacity: 0.21;
                            transform: scale(1.015);
                        }

                        20% {
                            opacity: 0.28;
                            transform: scale(1.05);
                        }

                        28% {
                            opacity: 0.18;
                            transform: scale(1);
                        }

                        100% {
                            opacity: 0.18;
                            transform: scale(1);
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | HEARTBEAT MINT
                    |--------------------------------------------------------------------------
                    */

                    @keyframes medivaHeartbeatMint {
                        0% {
                            opacity: 0.32;
                            transform: scale(1);
                        }

                        8% {
                            opacity: 0.52;
                            transform: scale(1.07);
                        }

                        14% {
                            opacity: 0.36;
                            transform: scale(1.015);
                        }

                        20% {
                            opacity: 0.46;
                            transform: scale(1.045);
                        }

                        28% {
                            opacity: 0.32;
                            transform: scale(1);
                        }

                        100% {
                            opacity: 0.32;
                            transform: scale(1);
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | HEARTBEAT CENTER
                    |--------------------------------------------------------------------------
                    */

                    @keyframes medivaHeartbeatCenter {
                        0% {
                            opacity: 0.55;
                            transform: scale(1);
                        }

                        8% {
                            opacity: 0.88;
                            transform: scale(1.07);
                        }

                        14% {
                            opacity: 0.63;
                            transform: scale(1.015);
                        }

                        20% {
                            opacity: 0.78;
                            transform: scale(1.045);
                        }

                        28% {
                            opacity: 0.55;
                            transform: scale(1);
                        }

                        100% {
                            opacity: 0.55;
                            transform: scale(1);
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | CLASSES
                    |--------------------------------------------------------------------------
                    */

                    .mediva-float-blue {
                        animation:
                            medivaFloatBlue
                            18s
                            ease-in-out
                            infinite;
                    }

                    .mediva-float-mint {
                        animation:
                            medivaFloatMint
                            21s
                            ease-in-out
                            infinite;
                    }

                    .mediva-heart-blue {
                        animation:
                            medivaHeartbeatBlue
                            2.45s
                            ease-in-out
                            infinite;
                    }

                    .mediva-heart-mint {
                        animation:
                            medivaHeartbeatMint
                            2.45s
                            ease-in-out
                            infinite;
                    }

                    .mediva-heart-center {
                        animation:
                            medivaHeartbeatCenter
                            2.45s
                            ease-in-out
                            infinite;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | REDUCED MOTION
                    |--------------------------------------------------------------------------
                    */

                    @media (
                        prefers-reduced-motion:
                        reduce
                    ) {
                        .mediva-float-blue,
                        .mediva-float-mint,
                        .mediva-heart-blue,
                        .mediva-heart-mint,
                        .mediva-heart-center {
                            animation: none;
                        }
                    }
                `}
            </style>

            {/* =============================================================
                PAGE
            ============================================================== */}

            <div
                className="
                    relative
                    flex
                    min-h-[100dvh]
                    items-center
                    justify-center
                    overflow-hidden
                    bg-white
                    px-[16px]
                "
            >
                {/* =========================================================
                    BASE
                ========================================================== */}

                <div
                    className="
                        pointer-events-none
                        absolute
                        inset-0
                        bg-gradient-to-br
                        from-[#FFFFFF]
                        via-[#F8FBFE]
                        to-[#F3F9FB]
                    "
                />

                {/* =========================================================
                    MEDIVA AMBIENT
                ========================================================== */}

                <div
                    className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-1/2
                        h-[760px]
                        w-[760px]
                        -translate-x-1/2
                        -translate-y-1/2
                    "
                >
                    {/* PALE BLUE */}

                    <div
                        className="
                            mediva-float-blue
                            absolute
                            left-[215px]
                            top-[10px]
                            h-[350px]
                            w-[350px]
                            rounded-full
                            bg-[#C2E1F4]/60
                            blur-[105px]
                        "
                    />

                    {/* SOFT BLUE */}

                    <div
                        className="
                            mediva-float-blue
                            absolute
                            left-[55px]
                            top-[155px]
                            h-[360px]
                            w-[360px]
                            rounded-full
                            bg-[#7EBDEC]/35
                            blur-[105px]
                        "
                    />

                    {/* PRIMARY BLUE HEART */}

                    <div
                        className="
                            mediva-heart-blue
                            absolute
                            bottom-[70px]
                            left-[105px]
                            h-[330px]
                            w-[330px]
                            rounded-full
                            bg-[#047AF7]
                            blur-[105px]
                        "
                    />

                    {/* MINT HEART */}

                    <div
                        className="
                            mediva-heart-mint
                            absolute
                            right-[65px]
                            top-[190px]
                            h-[370px]
                            w-[370px]
                            rounded-full
                            bg-[#CDE8E5]
                            blur-[110px]
                        "
                    />

                    {/* TEAL */}

                    <div
                        className="
                            mediva-float-mint
                            absolute
                            bottom-[50px]
                            right-[110px]
                            h-[290px]
                            w-[290px]
                            rounded-full
                            bg-[#7AB2B2]/23
                            blur-[105px]
                        "
                    />

                    {/* CENTER HEART */}

                    <div
                        className="
                            mediva-heart-center
                            absolute
                            left-[180px]
                            top-[160px]
                            h-[410px]
                            w-[410px]
                            rounded-full
                            bg-white
                            blur-[95px]
                        "
                    />
                </div>

                {/* =========================================================
                    SCREEN OVERLAY
                ========================================================== */}

                <div
                    className="
                        pointer-events-none
                        absolute
                        inset-0
                        bg-white/[0.04]
                        backdrop-blur-[1px]
                    "
                />

                {/* =========================================================
                    LOGIN CARD
                ========================================================== */}

                <div
                    className="
                        relative
                        z-10
                        w-full
                        max-w-[375px]
                        rounded-[18px]
                        border
                        border-white/[0.92]
                        bg-white/[0.82]
                        px-[34px]
                        py-[38px]
                        shadow-[0_22px_70px_rgba(4,122,247,0.14)]
                        backdrop-blur-[24px]
                    "
                >
                    {/* =====================================================
                        LOGO
                    ====================================================== */}

                    <div
                        className="
                            mb-[35px]
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <img
                            src="/images/mediva.png"
                            alt="Mediva"
                            className="
                                h-auto
                                w-[211px]
                                object-contain
                            "
                        />
                    </div>

                    {/* =====================================================
                        FORM
                    ====================================================== */}

                    <form onSubmit={handleSubmit} className="space-y-[22px]">
                        {/* =================================================
                            USERNAME
                        ================================================== */}

                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Username"
                            autoComplete="username"
                            disabled={loading}
                            className="
                                h-[57px]
                                w-full
                                rounded-[12px]
                                border
                                border-white
                                bg-white/[0.86]
                                px-[24px]
                                text-[13px]
                                text-[#212121]
                                outline-none
                                shadow-[0_7px_20px_rgba(33,33,33,0.10)]
                                backdrop-blur-[12px]
                                transition-all
                                duration-200

                                placeholder:text-[#B4B4B4]

                                focus:border-[#047AF7]/35
                                focus:bg-white
                                focus:ring-2
                                focus:ring-[#047AF7]/15

                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        />

                        {/* =================================================
                            PASSWORD
                        ================================================== */}

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                autoComplete="current-password"
                                disabled={loading}
                                className="
                                    h-[57px]
                                    w-full
                                    rounded-[12px]
                                    border
                                    border-white
                                    bg-white/[0.86]
                                    px-[24px]
                                    pr-[54px]
                                    text-[13px]
                                    text-[#212121]
                                    outline-none
                                    shadow-[0_7px_20px_rgba(33,33,33,0.10)]
                                    backdrop-blur-[12px]
                                    transition-all
                                    duration-200

                                    placeholder:text-[#B4B4B4]

                                    focus:border-[#047AF7]/35
                                    focus:bg-white
                                    focus:ring-2
                                    focus:ring-[#047AF7]/15

                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            />

                            {/* SHOW PASSWORD */}

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                    showPassword
                                        ? "Sembunyikan password"
                                        : "Tampilkan password"
                                }
                                title={
                                    showPassword
                                        ? "Sembunyikan password"
                                        : "Tampilkan password"
                                }
                                className="
                                    absolute
                                    right-[18px]
                                    top-1/2
                                    flex
                                    h-[30px]
                                    w-[30px]
                                    -translate-y-1/2
                                    items-center
                                    justify-center
                                    rounded-[7px]
                                    text-[13px]
                                    text-[#B4B4B4]
                                    transition-all
                                    duration-200

                                    hover:bg-[#C2E1F4]/25
                                    hover:text-[#047AF7]

                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                />
                            </button>
                        </div>

                        {/* =================================================
                            REMEMBER
                        ================================================== */}

                        <div
                            className="
                                mt-[-5px]
                                flex
                                items-center
                                gap-[7px]
                            "
                        >
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={formData.remember}
                                onChange={handleChange}
                                disabled={loading}
                                className="
                                    h-[12px]
                                    w-[12px]
                                    cursor-pointer
                                    accent-[#047AF7]

                                    disabled:cursor-not-allowed
                                "
                            />

                            <label
                                htmlFor="remember"
                                className="
                                    cursor-pointer
                                    select-none
                                    text-[11px]
                                    text-[#047AF7]
                                "
                            >
                                Remember me
                            </label>
                        </div>

                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {error && (
                            <div
                                className="
                                    rounded-[9px]
                                    border
                                    border-red-100
                                    bg-red-50/[0.92]
                                    px-[12px]
                                    py-[10px]
                                    text-[11px]
                                    text-red-500
                                "
                            >
                                {error}
                            </div>
                        )}

                        {/* =================================================
                            LOGIN BUTTON
                        ================================================== */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                h-[43px]
                                w-full
                                rounded-[10px]
                                bg-[#047AF7]
                                text-[13px]
                                font-medium
                                text-white
                                shadow-[0_9px_24px_rgba(4,122,247,0.25)]
                                transition-all
                                duration-200

                                hover:bg-[#006FE8]
                                hover:shadow-[0_11px_28px_rgba(4,122,247,0.32)]

                                active:scale-[0.99]

                                disabled:cursor-not-allowed
                                disabled:opacity-60
                                disabled:active:scale-100
                            "
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
