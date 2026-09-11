import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faMagnifyingGlass,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import useAuth from "../../auth/hooks/useAuth";
import registrationService from "../services/registrationService";

export default function RegistrationListPage() {
    const navigate = useNavigate();

    const { hasPermission } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const canCreate = hasPermission(
        "registration.create"
    );

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [registrations, setRegistrations] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [lastPage, setLastPage] =
        useState(1);

    const [total, setTotal] =
        useState(0);

    /*
    |--------------------------------------------------------------------------
    | LOAD REGISTRATIONS
    |--------------------------------------------------------------------------
    */

    const loadRegistrations = async (
        page = 1,
        keyword = "",
        selectedStatus = ""
    ) => {
        try {
            setLoading(true);
            setError("");

            const response =
                await registrationService.getRegistrations({
                    page,
                    search: keyword,
                    status: selectedStatus,
                });

            setRegistrations(
                response?.data ?? []
            );

            setCurrentPage(
                response?.current_page ?? 1
            );

            setLastPage(
                response?.last_page ?? 1
            );

            setTotal(
                response?.total ?? 0
            );
        } catch (error) {
            console.error(
                "Gagal mengambil pendaftaran:",
                error
            );

            setError(
                error.message ||
                    "Gagal mengambil data pendaftaran."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadRegistrations(
            1,
            "",
            ""
        );
    }, []);

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const handleSearch = (
        event
    ) => {
        event.preventDefault();

        loadRegistrations(
            1,
            search.trim(),
            status
        );
    };

    /*
    |--------------------------------------------------------------------------
    | RESET SEARCH
    |--------------------------------------------------------------------------
    */

    const handleResetSearch = () => {
        setSearch("");

        loadRegistrations(
            1,
            "",
            status
        );
    };

    /*
    |--------------------------------------------------------------------------
    | STATUS FILTER
    |--------------------------------------------------------------------------
    */

    const handleStatusChange = (
        event
    ) => {
        const value =
            event.target.value;

        setStatus(value);

        loadRegistrations(
            1,
            search.trim(),
            value
        );
    };

    /*
    |--------------------------------------------------------------------------
    | FORMAT DATE TIME
    |--------------------------------------------------------------------------
    */

    const formatDateTime = (
        value
    ) => {
        if (!value) {
            return "-";
        }

        const date = new Date(
            value
        );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "-";
        }

        return date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | VISIT TYPE
    |--------------------------------------------------------------------------
    */

    const getVisitLabel = (
        type
    ) => {
        if (
            type === "outpatient"
        ) {
            return "Rawat Jalan";
        }

        if (
            type === "emergency"
        ) {
            return "IGD";
        }

        return "-";
    };

    return (
        <DashboardLayout>
            <div
                className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
            >
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-[20px]
                    "
                >
                    <div>
                        <h1
                            className="
                                text-[24px]
                                font-semibold
                                tracking-[-0.3px]
                                text-[#343434]
                            "
                        >
                            Pendaftaran
                        </h1>

                        <p
                            className="
                                mt-[5px]
                                text-[12px]
                                leading-[1.5]
                                text-[#8f8f8f]
                            "
                        >
                            Data kunjungan dan status pelayanan pasien
                        </p>
                    </div>

                    {/* =================================================
                        CREATE
                        HANYA ROLE PENDAFTARAN
                    ================================================== */}

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/registrations/create"
                                )
                            }
                            className="
                                flex
                                h-[42px]
                                items-center
                                gap-[8px]
                                rounded-[10px]
                                bg-[#1688f8]
                                px-[16px]
                                text-[12px]
                                font-medium
                                text-white
                                transition
                                hover:bg-[#0878e8]
                            "
                        >
                            <FontAwesomeIcon
                                icon={faPlus}
                                className="
                                    text-[12px]
                                "
                            />

                            Daftar Pasien
                        </button>
                    )}
                </div>

                {/* =====================================================
                    CARD
                ====================================================== */}

                <div
                    className="
                        mt-[25px]
                        overflow-hidden
                        rounded-[15px]
                        border
                        border-[#e8e8e8]
                        bg-white
                    "
                >
                    {/* =================================================
                        TOOLBAR
                    ================================================== */}

                    <div
                        className="
                            flex
                            min-h-[88px]
                            flex-wrap
                            items-center
                            justify-between
                            gap-[15px]
                            border-b
                            border-[#eeeeee]
                            px-[24px]
                            py-[15px]
                        "
                    >
                        <div
                            className="
                                flex
                                flex-wrap
                                items-center
                                gap-[10px]
                            "
                        >
                            {/* =========================================
                                SEARCH
                            ========================================== */}

                            <form
                                onSubmit={
                                    handleSearch
                                }
                                className="
                                    flex
                                    items-center
                                    gap-[10px]
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-[48px]
                                        w-[360px]
                                        items-center
                                        gap-[10px]
                                        rounded-[11px]
                                        bg-[#f7f8fa]
                                        px-[16px]
                                    "
                                >
                                    <FontAwesomeIcon
                                        icon={
                                            faMagnifyingGlass
                                        }
                                        className="
                                            shrink-0
                                            text-[14px]
                                            text-[#aaaaaa]
                                        "
                                    />

                                    <input
                                        type="text"
                                        value={
                                            search
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Cari No. Registrasi, RM, NIK, atau nama..."
                                        className="
                                            min-w-0
                                            flex-1
                                            bg-transparent
                                            text-[13px]
                                            text-[#555555]
                                            outline-none
                                            placeholder:text-[#aaaaaa]
                                        "
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="
                                        h-[48px]
                                        rounded-[11px]
                                        bg-[#1688f8]
                                        px-[20px]
                                        text-[13px]
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-[#0878e8]
                                    "
                                >
                                    Cari
                                </button>

                                {search && (
                                    <button
                                        type="button"
                                        onClick={
                                            handleResetSearch
                                        }
                                        className="
                                            h-[48px]
                                            rounded-[11px]
                                            border
                                            border-[#e5e5e5]
                                            bg-white
                                            px-[18px]
                                            text-[12px]
                                            font-medium
                                            text-[#777777]
                                            transition
                                            hover:bg-[#f7f8fa]
                                        "
                                    >
                                        Reset
                                    </button>
                                )}
                            </form>

                            {/* =========================================
                                STATUS FILTER
                            ========================================== */}

                            <select
                                value={
                                    status
                                }
                                onChange={
                                    handleStatusChange
                                }
                                className="
                                    h-[48px]
                                    rounded-[11px]
                                    border
                                    border-[#e5e5e5]
                                    bg-white
                                    px-[14px]
                                    text-[12px]
                                    text-[#666666]
                                    outline-none
                                    transition
                                    focus:border-[#1688f8]
                                "
                            >
                                <option value="">
                                    Semua Status
                                </option>

                                <option value="waiting">
                                    Menunggu
                                </option>

                                <option value="in_service">
                                    Dilayani
                                </option>

                                <option value="completed">
                                    Selesai
                                </option>

                                <option value="cancelled">
                                    Dibatalkan
                                </option>
                            </select>
                        </div>

                        {/* =============================================
                            TOTAL
                        ============================================== */}

                        <p
                            className="
                                whitespace-nowrap
                                text-[12px]
                                text-[#999999]
                            "
                        >
                            Total{" "}
                            <span
                                className="
                                    font-medium
                                    text-[#666666]
                                "
                            >
                                {total}
                            </span>{" "}
                            kunjungan
                        </p>
                    </div>

                    {/* =================================================
                        ERROR
                    ================================================== */}

                    {error && (
                        <div
                            className="
                                mx-[24px]
                                mt-[18px]
                                rounded-[10px]
                                border
                                border-red-100
                                bg-red-50
                                px-[15px]
                                py-[11px]
                                text-[12px]
                                text-red-500
                            "
                        >
                            {error}
                        </div>
                    )}

                    {/* =================================================
                        TABLE
                    ================================================== */}

                    <div
                        className="
                            w-full
                            overflow-x-auto
                        "
                    >
                        <table
                            className="
                                min-w-[1100px]
                                w-full
                                table-fixed
                                border-collapse
                            "
                        >
                            {/* =========================================
                                COLUMN SIZE
                            ========================================== */}

                            <colgroup>
                                <col className="w-[15%]" />
                                <col className="w-[20%]" />
                                <col className="w-[14%]" />
                                <col className="w-[12%]" />
                                <col className="w-[16%]" />
                                <col className="w-[13%]" />
                                <col className="w-[10%]" />
                            </colgroup>

                            {/* =========================================
                                TABLE HEADER
                            ========================================== */}

                            <thead>
                                <tr
                                    className="
                                        h-[56px]
                                        border-b
                                        border-[#eeeeee]
                                        bg-[#fafbfc]
                                    "
                                >
                                    <TableHeader>
                                        No. Registrasi
                                    </TableHeader>

                                    <TableHeader>
                                        Pasien
                                    </TableHeader>

                                    <TableHeader>
                                        Unit
                                    </TableHeader>

                                    <TableHeader
                                        center
                                    >
                                        Jenis
                                    </TableHeader>

                                    <TableHeader
                                        center
                                    >
                                        Waktu
                                    </TableHeader>

                                    <TableHeader
                                        center
                                    >
                                        Status
                                    </TableHeader>

                                    <TableHeader
                                        center
                                    >
                                        Aksi
                                    </TableHeader>
                                </tr>
                            </thead>

                            {/* =========================================
                                TABLE BODY
                            ========================================== */}

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="
                                                h-[110px]
                                                text-center
                                                text-[13px]
                                                text-[#999999]
                                            "
                                        >
                                            Memuat data pendaftaran...
                                        </td>
                                    </tr>
                                ) : registrations.length ===
                                  0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="
                                                h-[120px]
                                                text-center
                                                text-[13px]
                                                text-[#999999]
                                            "
                                        >
                                            Belum ada pendaftaran pasien.
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.map(
                                        (
                                            registration
                                        ) => (
                                            <tr
                                                key={
                                                    registration.id
                                                }
                                                className="
                                                    h-[84px]
                                                    border-b
                                                    border-[#f0f0f0]
                                                    transition
                                                    last:border-b-0
                                                    hover:bg-[#fafcff]
                                                "
                                            >
                                                {/* =====================
                                                    NO REGISTRATION
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[24px]
                                                        align-middle
                                                    "
                                                >
                                                    <span
                                                        className="
                                                            whitespace-nowrap
                                                            text-[12px]
                                                            font-semibold
                                                            text-[#1688f8]
                                                        "
                                                    >
                                                        {registration.registration_number ||
                                                            "-"}
                                                    </span>
                                                </td>

                                                {/* =====================
                                                    PATIENT
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[24px]
                                                        align-middle
                                                    "
                                                >
                                                    <div className="min-w-0">
                                                        <p
                                                            className="
                                                                truncate
                                                                text-[13px]
                                                                font-semibold
                                                                text-[#444444]
                                                            "
                                                        >
                                                            {registration
                                                                .patient
                                                                ?.name ||
                                                                "-"}
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-[4px]
                                                                text-[11px]
                                                                text-[#999999]
                                                            "
                                                        >
                                                            {registration
                                                                .patient
                                                                ?.medical_record_number ||
                                                                "-"}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* =====================
                                                    UNIT
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[24px]
                                                        align-middle
                                                        text-[12px]
                                                        text-[#666666]
                                                    "
                                                >
                                                    {registration
                                                        .unit
                                                        ?.name ||
                                                        "-"}
                                                </td>

                                                {/* =====================
                                                    VISIT TYPE
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[16px]
                                                        text-center
                                                        align-middle
                                                    "
                                                >
                                                    <span
                                                        className="
                                                            whitespace-nowrap
                                                            text-[12px]
                                                            text-[#666666]
                                                        "
                                                    >
                                                        {getVisitLabel(
                                                            registration.visit_type
                                                        )}
                                                    </span>
                                                </td>

                                                {/* =====================
                                                    TIME
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[16px]
                                                        text-center
                                                        align-middle
                                                    "
                                                >
                                                    <span
                                                        className="
                                                            whitespace-nowrap
                                                            text-[12px]
                                                            tabular-nums
                                                            text-[#666666]
                                                        "
                                                    >
                                                        {formatDateTime(
                                                            registration.registered_at
                                                        )}
                                                    </span>
                                                </td>

                                                {/* =====================
                                                    STATUS
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[16px]
                                                        text-center
                                                        align-middle
                                                    "
                                                >
                                                    <StatusBadge
                                                        status={
                                                            registration.status
                                                        }
                                                    />
                                                </td>

                                                {/* =====================
                                                    DETAIL
                                                ====================== */}

                                                <td
                                                    className="
                                                        px-[16px]
                                                        text-center
                                                        align-middle
                                                    "
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            console.log(
                                                                "Registration ID:",
                                                                registration.id
                                                            );

                                                            navigate(
                                                                `/registrations/${registration.id}`
                                                            );
                                                        }}
                                                        className="
                                                            inline-flex
                                                            h-[34px]
                                                            items-center
                                                            justify-center
                                                            gap-[7px]
                                                            rounded-[8px]
                                                            px-[11px]
                                                            text-[11px]
                                                            font-medium
                                                            text-[#1688f8]
                                                            transition
                                                            hover:bg-[#eaf4ff]
                                                        "
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                faEye
                                                            }
                                                            className="
                                                                text-[11px]
                                                            "
                                                        />

                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* =================================================
                        PAGINATION
                    ================================================== */}

                    <div
                        className="
                            flex
                            min-h-[80px]
                            items-center
                            justify-between
                            border-t
                            border-[#eeeeee]
                            px-[24px]
                        "
                    >
                        <p
                            className="
                                text-[12px]
                                text-[#999999]
                            "
                        >
                            Halaman{" "}
                            <span
                                className="
                                    font-medium
                                    text-[#666666]
                                "
                            >
                                {currentPage}
                            </span>{" "}
                            dari{" "}
                            <span
                                className="
                                    font-medium
                                    text-[#666666]
                                "
                            >
                                {lastPage}
                            </span>
                        </p>

                        <div
                            className="
                                flex
                                items-center
                                gap-[10px]
                            "
                        >
                            <button
                                type="button"
                                disabled={
                                    currentPage <=
                                    1
                                }
                                onClick={() =>
                                    loadRegistrations(
                                        currentPage -
                                            1,
                                        search.trim(),
                                        status
                                    )
                                }
                                className="
                                    h-[42px]
                                    rounded-[10px]
                                    border
                                    border-[#eeeeee]
                                    bg-white
                                    px-[15px]
                                    text-[12px]
                                    font-medium
                                    text-[#666666]
                                    transition
                                    hover:bg-[#f7f8fa]
                                    disabled:cursor-not-allowed
                                    disabled:text-[#cccccc]
                                    disabled:hover:bg-white
                                "
                            >
                                Sebelumnya
                            </button>

                            <button
                                type="button"
                                disabled={
                                    currentPage >=
                                    lastPage
                                }
                                onClick={() =>
                                    loadRegistrations(
                                        currentPage +
                                            1,
                                        search.trim(),
                                        status
                                    )
                                }
                                className="
                                    h-[42px]
                                    rounded-[10px]
                                    border
                                    border-[#eeeeee]
                                    bg-white
                                    px-[15px]
                                    text-[12px]
                                    font-medium
                                    text-[#666666]
                                    transition
                                    hover:bg-[#f7f8fa]
                                    disabled:cursor-not-allowed
                                    disabled:text-[#cccccc]
                                    disabled:hover:bg-white
                                "
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| TABLE HEADER
|--------------------------------------------------------------------------
*/

function TableHeader({
    children,
    center = false,
}) {
    return (
        <th
            className={`
                px-[24px]
                align-middle
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.25px]
                text-[#8f8f8f]

                ${
                    center
                        ? "text-center"
                        : "text-left"
                }
            `}
        >
            {children}
        </th>
    );
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}) {
    const config = {
        waiting: {
            label:
                "Menunggu",

            className:
                "bg-amber-50 text-amber-600",
        },

        in_service: {
            label:
                "Dilayani",

            className:
                "bg-blue-50 text-blue-600",
        },

        completed: {
            label:
                "Selesai",

            className:
                "bg-green-50 text-green-600",
        },

        cancelled: {
            label:
                "Dibatalkan",

            className:
                "bg-red-50 text-red-500",
        },
    };

    const item =
        config[status] ?? {
            label: "-",

            className:
                "bg-gray-100 text-gray-500",
        };

    return (
        <span
            className={`
                inline-flex
                whitespace-nowrap
                rounded-[7px]
                px-[9px]
                py-[5px]
                text-[10px]
                font-medium
                ${item.className}
            `}
        >
            {item.label}
        </span>
    );
}