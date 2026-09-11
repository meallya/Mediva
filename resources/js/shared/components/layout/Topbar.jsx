import React, { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faBars,
    faBell,
    faCalendarDays,
    faCheck,
    faChevronDown,
    faGear,
    faMagnifyingGlass,
    faRightFromBracket,
    faSpinner,
    faUser,
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "../../../modules/auth/hooks/useAuth";

export default function Topbar() {
    const navigate = useNavigate();

    const profileRef = useRef(null);

    const { user, roles = [], activeRole, switchRole, logout } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [currentDate, setCurrentDate] = useState(new Date());

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [switchingRole, setSwitchingRole] = useState(null);

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | DATE / TIME
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | CLICK OUTSIDE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | ESC CLOSE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | DATE FORMAT
    |--------------------------------------------------------------------------
    */

    const dayName = currentDate.toLocaleDateString("id-ID", {
        weekday: "long",
    });

    const formattedDate = currentDate.toLocaleDateString("id-ID", {
        day: "2-digit",

        month: "long",

        year: "numeric",
    });

    const formattedTime = currentDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",

        minute: "2-digit",
    });

    /*
    |--------------------------------------------------------------------------
    | INITIAL
    |--------------------------------------------------------------------------
    */

    const getInitial = (name) => {
        if (!name) {
            return "M";
        }

        return name
            .split(" ")
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("");
    };

    /*
    |--------------------------------------------------------------------------
    | SWITCH ROLE
    |--------------------------------------------------------------------------
    */

    const handleSwitchRole = async (assignmentId) => {
        if (!assignmentId) {
            return;
        }

        if (assignmentId === activeRole?.assignment_id) {
            return;
        }

        try {
            setSwitchingRole(assignmentId);

            setIsProfileOpen(false);

            await switchRole(assignmentId);
        } catch (error) {
            console.error("Gagal mengganti role:", error);
        } finally {
            setSwitchingRole(null);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);

            setIsProfileOpen(false);

            await logout();

            navigate("/login", {
                replace: true,
            });
        } catch (error) {
            console.error("Logout gagal:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <header
                className="
                    fixed
                    left-[255px]
                    right-0
                    top-0
                    z-40
                    flex
                    h-[88px]
                    items-center
                    justify-between
                    border-b
                    border-[#eeeeee]
                    bg-white
                    px-[30px]
                "
            >
                {/* =========================================================
                    LEFT
                ========================================================== */}

                <div
                    className="
                        flex
                        items-center
                        gap-[14px]
                    "
                >
                    {/* MENU */}

                    <button
                        type="button"
                        className="
                            flex
                            h-[42px]
                            w-[42px]
                            items-center
                            justify-center
                            rounded-[9px]
                            text-[#626262]
                            transition
                            hover:bg-[#f7f9fb]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faBars}
                            className="text-[17px]"
                        />
                    </button>

                    {/* SEARCH */}

                    <div
                        className="
                            flex
                            h-[44px]
                            w-[255px]
                            items-center
                            gap-[10px]
                            rounded-[10px]
                            bg-[#f6f8fa]
                            px-[14px]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            className="
                                text-[13px]
                                text-[#999999]
                            "
                        />

                        <input
                            type="text"
                            placeholder="Cari..."
                            className="
                                w-full
                                bg-transparent
                                text-[13px]
                                text-[#444444]
                                outline-none
                                placeholder:text-[#aaaaaa]
                            "
                        />
                    </div>
                </div>

                {/* =========================================================
                    RIGHT
                ========================================================== */}

                <div
                    className="
                        flex
                        items-center
                        gap-[12px]
                    "
                >
                    {/* DATE */}

                    <div
                        className="
                            hidden
                            items-center
                            gap-[10px]
                            rounded-[11px]
                            bg-[#f8fafc]
                            px-[13px]
                            py-[8px]
                            lg:flex
                        "
                    >
                        <div
                            className="
                                flex
                                h-[36px]
                                w-[36px]
                                items-center
                                justify-center
                                rounded-[9px]
                                bg-[#eaf4ff]
                                text-[#1688f8]
                            "
                        >
                            <FontAwesomeIcon
                                icon={faCalendarDays}
                                className="text-[14px]"
                            />
                        </div>

                        <div>
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-[5px]
                                "
                            >
                                <p
                                    className="
                                        text-[11px]
                                        font-semibold
                                        capitalize
                                        text-[#444444]
                                    "
                                >
                                    {dayName}
                                </p>

                                <span
                                    className="
                                        text-[9px]
                                        text-[#cccccc]
                                    "
                                >
                                    •
                                </span>

                                <p
                                    className="
                                        text-[10px]
                                        text-[#888888]
                                    "
                                >
                                    {formattedTime}
                                </p>
                            </div>

                            <p
                                className="
                                    mt-[2px]
                                    text-[9px]
                                    text-[#aaaaaa]
                                "
                            >
                                {formattedDate}
                            </p>
                        </div>
                    </div>

                    {/* NOTIFICATION */}

                    <button
                        type="button"
                        className="
                            relative
                            flex
                            h-[42px]
                            w-[42px]
                            items-center
                            justify-center
                            rounded-[10px]
                            text-[#777777]
                            transition
                            hover:bg-[#f7f9fb]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faBell}
                            className="text-[16px]"
                        />

                        <span
                            className="
                                absolute
                                right-[8px]
                                top-[7px]
                                h-[7px]
                                w-[7px]
                                rounded-full
                                border
                                border-white
                                bg-red-500
                            "
                        />
                    </button>

                    {/* DIVIDER */}

                    <div
                        className="
                            h-[32px]
                            w-px
                            bg-[#eeeeee]
                        "
                    />

                    {/* =====================================================
                        ACCOUNT
                    ====================================================== */}

                    <div ref={profileRef} className="relative">
                        <button
                            type="button"
                            onClick={() =>
                                setIsProfileOpen((previous) => !previous)
                            }
                            className="
                                flex
                                items-center
                                gap-[10px]
                                rounded-[10px]
                                px-[8px]
                                py-[5px]
                                transition
                                hover:bg-[#f6f9fc]
                            "
                        >
                            {/* AVATAR */}

                            <div
                                className="
                                    flex
                                    h-[38px]
                                    w-[38px]
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#1688f8]
                                    text-[11px]
                                    font-semibold
                                    text-white
                                "
                            >
                                {getInitial(user?.name)}
                            </div>

                            {/* INFO */}

                            <div
                                className="
                                    hidden
                                    text-left
                                    xl:block
                                "
                            >
                                <p
                                    className="
                                        max-w-[150px]
                                        truncate
                                        text-[11px]
                                        font-semibold
                                        text-[#333333]
                                    "
                                >
                                    {user?.name || "MEDIVA User"}
                                </p>

                                <p
                                    className="
                                        mt-[1px]
                                        max-w-[150px]
                                        truncate
                                        text-[9px]
                                        text-[#aaaaaa]
                                    "
                                >
                                    {activeRole?.name || "No active role"}
                                </p>
                            </div>

                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`
                                    hidden
                                    text-[10px]
                                    text-[#999999]
                                    transition-transform
                                    duration-200
                                    xl:block

                                    ${isProfileOpen ? "rotate-180" : ""}
                                `}
                            />
                        </button>

                        {/* =================================================
                            DROPDOWN
                        ================================================== */}

                        {isProfileOpen && (
                            <div
                                className="
                                    absolute
                                    right-0
                                    top-[54px]
                                    z-[100]
                                    w-[280px]
                                    overflow-hidden
                                    rounded-[12px]
                                    border
                                    border-[#eeeeee]
                                    bg-white
                                    shadow-[0_10px_30px_rgba(0,0,0,0.12)]
                                "
                            >
                                {/* =========================================
                                    USER
                                ========================================== */}

                                <div
                                    className="
                                        border-b
                                        border-[#eeeeee]
                                        px-[16px]
                                        py-[14px]
                                    "
                                >
                                    <p
                                        className="
                                            truncate
                                            text-[11px]
                                            font-semibold
                                            text-[#333333]
                                        "
                                    >
                                        {user?.name || "MEDIVA User"}
                                    </p>

                                    <p
                                        className="
                                            mt-[3px]
                                            truncate
                                            text-[9px]
                                            text-[#aaaaaa]
                                        "
                                    >
                                        {user?.email || user?.username || "-"}
                                    </p>
                                </div>

                                {/* =========================================
                                    ACTIVE ROLE
                                ========================================== */}

                                {activeRole && (
                                    <div
                                        className="
                                            border-b
                                            border-[#eeeeee]
                                            px-[14px]
                                            py-[12px]
                                        "
                                    >
                                        <p
                                            className="
                                                mb-[8px]
                                                text-[9px]
                                                font-semibold
                                                uppercase
                                                tracking-[0.4px]
                                                text-[#aaaaaa]
                                            "
                                        >
                                            Role Aktif
                                        </p>

                                        <div
                                            className="
                                                flex
                                                items-center
                                                gap-[9px]
                                                rounded-[8px]
                                                bg-[#eef7ff]
                                                px-[10px]
                                                py-[9px]
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-[25px]
                                                    w-[25px]
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-[#1688f8]/10
                                                    text-[#1688f8]
                                                "
                                            >
                                                <FontAwesomeIcon
                                                    icon={faCheck}
                                                    className="text-[9px]"
                                                />
                                            </div>

                                            <div
                                                className="
                                                    min-w-0
                                                    flex-1
                                                "
                                            >
                                                <p
                                                    className="
                                                        truncate
                                                        text-[10px]
                                                        font-semibold
                                                        text-[#1688f8]
                                                    "
                                                >
                                                    {activeRole.name}
                                                </p>

                                                <p
                                                    className="
                                                        mt-[2px]
                                                        truncate
                                                        text-[9px]
                                                        text-[#888888]
                                                    "
                                                >
                                                    {activeRole?.unit?.name ||
                                                        "Tidak ada unit"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* =========================================
                                    SWITCH ROLE
                                ========================================== */}

                                {roles.length > 1 && (
                                    <div
                                        className="
                                            border-b
                                            border-[#eeeeee]
                                            px-[7px]
                                            py-[8px]
                                        "
                                    >
                                        <p
                                            className="
                                                px-[8px]
                                                pb-[6px]
                                                text-[9px]
                                                font-semibold
                                                uppercase
                                                tracking-[0.4px]
                                                text-[#aaaaaa]
                                            "
                                        >
                                            Ganti Role
                                        </p>

                                        {roles
                                            .filter(
                                                (role) =>
                                                    role.assignment_id !==
                                                    activeRole?.assignment_id,
                                            )
                                            .map((role) => (
                                                <button
                                                    key={role.assignment_id}
                                                    type="button"
                                                    disabled={
                                                        switchingRole ===
                                                        role.assignment_id
                                                    }
                                                    onClick={() =>
                                                        handleSwitchRole(
                                                            role.assignment_id,
                                                        )
                                                    }
                                                    className="
                                                            flex
                                                            w-full
                                                            items-center
                                                            justify-between
                                                            gap-[10px]
                                                            rounded-[8px]
                                                            px-[10px]
                                                            py-[9px]
                                                            text-left
                                                            transition

                                                            hover:bg-[#f7f9fb]

                                                            disabled:cursor-not-allowed
                                                            disabled:opacity-60
                                                        "
                                                >
                                                    <div
                                                        className="
                                                                min-w-0
                                                                flex-1
                                                            "
                                                    >
                                                        <p
                                                            className="
                                                                    truncate
                                                                    text-[10px]
                                                                    font-semibold
                                                                    text-[#444444]
                                                                "
                                                        >
                                                            {role.name}
                                                        </p>

                                                        <p
                                                            className="
                                                                    mt-[2px]
                                                                    truncate
                                                                    text-[9px]
                                                                    text-[#aaaaaa]
                                                                "
                                                        >
                                                            {role?.unit?.name ||
                                                                "Tidak ada unit"}
                                                        </p>
                                                    </div>

                                                    {switchingRole ===
                                                        role.assignment_id && (
                                                        <FontAwesomeIcon
                                                            icon={faSpinner}
                                                            spin
                                                            className="
                                                                    text-[11px]
                                                                    text-[#1688f8]
                                                                "
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                )}

                                {/* =========================================
                                    MENU
                                ========================================== */}

                                <div className="p-[7px]">
                                    <button
                                        type="button"
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-[10px]
                                            rounded-[8px]
                                            px-[10px]
                                            py-[9px]
                                            text-left
                                            text-[10px]
                                            text-[#555555]
                                            transition
                                            hover:bg-[#f7f9fb]
                                        "
                                    >
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="w-[15px]"
                                        />
                                        My Profile
                                    </button>

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-[10px]
                                            rounded-[8px]
                                            px-[10px]
                                            py-[9px]
                                            text-left
                                            text-[10px]
                                            text-[#555555]
                                            transition
                                            hover:bg-[#f7f9fb]
                                        "
                                    >
                                        <FontAwesomeIcon
                                            icon={faGear}
                                            className="w-[15px]"
                                        />
                                        Settings
                                    </button>

                                    <div
                                        className="
                                            my-[5px]
                                            h-px
                                            bg-[#eeeeee]
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-[10px]
                                            rounded-[8px]
                                            px-[10px]
                                            py-[9px]
                                            text-left
                                            text-[10px]
                                            text-red-500
                                            transition
                                            hover:bg-red-50
                                            disabled:cursor-not-allowed
                                            disabled:opacity-50
                                        "
                                    >
                                        <FontAwesomeIcon
                                            icon={
                                                isLoggingOut
                                                    ? faSpinner
                                                    : faRightFromBracket
                                            }
                                            spin={isLoggingOut}
                                            className="w-[15px]"
                                        />

                                        {isLoggingOut
                                            ? "Logging out..."
                                            : "Logout"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* =============================================================
                SWITCH ROLE LOADING
            ============================================================== */}

            {switchingRole !== null && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[9999]
                        flex
                        items-center
                        justify-center
                        bg-black/20
                        backdrop-blur-[1px]
                    "
                >
                    <div
                        className="
                            flex
                            min-w-[230px]
                            flex-col
                            items-center
                            rounded-[14px]
                            border
                            border-[#eeeeee]
                            bg-white
                            px-[26px]
                            py-[23px]
                            shadow-[0_14px_40px_rgba(0,0,0,0.14)]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="
                                text-[24px]
                                text-[#1688f8]
                            "
                        />

                        <p
                            className="
                                mt-[12px]
                                text-[11px]
                                font-semibold
                                text-[#444444]
                            "
                        >
                            Mengganti role...
                        </p>

                        <p
                            className="
                                mt-[3px]
                                text-[9px]
                                text-[#aaaaaa]
                            "
                        >
                            Mohon tunggu sebentar.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
