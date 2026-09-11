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

import patientService from "../services/patientService";

export default function PatientListPage() {
    const navigate = useNavigate();

    const { hasPermission } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const canCreatePatient = hasPermission("patient.create");

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [patients, setPatients] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const [lastPage, setLastPage] = useState(1);

    const [total, setTotal] = useState(0);

    /*
    |--------------------------------------------------------------------------
    | LOAD PATIENTS
    |--------------------------------------------------------------------------
    */

    const loadPatients = async (page = 1, keyword = "") => {
        try {
            setLoading(true);

            setError("");

            const response = await patientService.getPatients({
                page,
                search: keyword,
            });

            setPatients(response?.data ?? []);

            setCurrentPage(response?.current_page ?? 1);

            setLastPage(response?.last_page ?? 1);

            setTotal(response?.total ?? 0);
        } catch (error) {
            console.error("Gagal mengambil pasien:", error);

            setError(error.message || "Gagal mengambil data pasien.");
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
        loadPatients();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const handleSearch = (event) => {
        event.preventDefault();

        loadPatients(1, search.trim());
    };

    /*
    |--------------------------------------------------------------------------
    | RESET SEARCH
    |--------------------------------------------------------------------------
    */

    const handleResetSearch = () => {
        setSearch("");

        loadPatients(1, "");
    };

    /*
    |--------------------------------------------------------------------------
    | GENDER
    |--------------------------------------------------------------------------
    */

    const getGenderLabel = (gender) => {
        if (gender === "male") {
            return "Laki-laki";
        }

        if (gender === "female") {
            return "Perempuan";
        }

        return "-";
    };

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
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
                            Data Pasien
                        </h1>

                        <p
                            className="
                                mt-[5px]
                                text-[12px]
                                leading-[1.5]
                                text-[#8f8f8f]
                            "
                        >
                            Informasi dan data pasien MEDIVA
                        </p>
                    </div>

                    {/* =================================================
                        CREATE PATIENT
                    ================================================== */}

                    {canCreatePatient && (
                        <button
                            type="button"
                            onClick={() => navigate("/patients/create")}
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
                            Tambah Pasien
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
                        "
                    >
                        <form
                            onSubmit={handleSearch}
                            className="
                                flex
                                items-center
                                gap-[10px]
                            "
                        >
                            {/* SEARCH INPUT */}

                            <div
                                className="
                                    flex
                                    h-[48px]
                                    w-[375px]
                                    items-center
                                    gap-[10px]
                                    rounded-[11px]
                                    bg-[#f7f8fa]
                                    px-[16px]
                                "
                            >
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className="
                                        shrink-0
                                        text-[14px]
                                        text-[#aaaaaa]
                                    "
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari No. RM, NIK, atau nama..."
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

                            {/* SEARCH BUTTON */}

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

                            {/* RESET */}

                            {search && (
                                <button
                                    type="button"
                                    onClick={handleResetSearch}
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

                        {/* TOTAL */}

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
                            pasien
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
                                min-w-[1050px]
                                w-full
                                table-fixed
                                border-collapse
                            "
                        >
                            {/* =========================================
                                COLUMN WIDTH
                            ========================================== */}

                            <colgroup>
                                <col className="w-[12%]" />

                                <col className="w-[20%]" />

                                <col className="w-[18%]" />

                                <col className="w-[12%]" />

                                <col className="w-[15%]" />

                                <col className="w-[14%]" />

                                <col className="w-[9%]" />
                            </colgroup>

                            {/* =========================================
                                HEADER
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
                                    <TableHeader>No. RM</TableHeader>

                                    <TableHeader>Nama Pasien</TableHeader>

                                    <TableHeader>NIK</TableHeader>

                                    <TableHeader center>Gender</TableHeader>

                                    <TableHeader center>
                                        Tanggal Lahir
                                    </TableHeader>

                                    <TableHeader>Telepon</TableHeader>

                                    <TableHeader center>Aksi</TableHeader>
                                </tr>
                            </thead>

                            {/* =========================================
                                BODY
                            ========================================== */}

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="
                                                h-[110px]
                                                px-[24px]
                                                text-center
                                                text-[13px]
                                                text-[#999999]
                                            "
                                        >
                                            Memuat data pasien...
                                        </td>
                                    </tr>
                                ) : patients.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="
                                                h-[120px]
                                                px-[24px]
                                                text-center
                                                text-[13px]
                                                text-[#999999]
                                            "
                                        >
                                            Belum ada data pasien.
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((patient) => (
                                        <tr
                                            key={patient.id}
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
                                                    NO RM
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
                                                            text-[13px]
                                                            font-semibold
                                                            text-[#1688f8]
                                                        "
                                                >
                                                    {patient.medical_record_number ||
                                                        "-"}
                                                </span>
                                            </td>

                                            {/* =====================
                                                    NAME
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
                                                        {patient.name || "-"}
                                                    </p>

                                                    <p
                                                        className="
                                                                mt-[4px]
                                                                text-[11px]
                                                                text-[#999999]
                                                            "
                                                    >
                                                        Gol. Darah{" "}
                                                        <span
                                                            className="
                                                                    font-medium
                                                                    text-[#888888]
                                                                "
                                                        >
                                                            {patient.blood_type ||
                                                                "-"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </td>

                                            {/* =====================
                                                    NIK
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
                                                            tabular-nums
                                                            text-[#666666]
                                                        "
                                                >
                                                    {patient.nik || "-"}
                                                </span>
                                            </td>

                                            {/* =====================
                                                    GENDER
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
                                                    {getGenderLabel(
                                                        patient.gender,
                                                    )}
                                                </span>
                                            </td>

                                            {/* =====================
                                                    DATE
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
                                                    {formatDate(
                                                        patient.date_of_birth,
                                                    )}
                                                </span>
                                            </td>

                                            {/* =====================
                                                    PHONE
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
                                                            tabular-nums
                                                            text-[#666666]
                                                        "
                                                >
                                                    {patient.phone || "-"}
                                                </span>
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
                                                    onClick={() =>
                                                        navigate(
                                                            `/patients/${patient.id}`,
                                                        )
                                                    }
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
                                                        icon={faEye}
                                                        className="
                                                                text-[11px]
                                                            "
                                                    />
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    loadPatients(currentPage - 1, search.trim())
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
                                disabled={currentPage >= lastPage}
                                onClick={() =>
                                    loadPatients(currentPage + 1, search.trim())
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

function TableHeader({ children, center = false }) {
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

                ${center ? "text-center" : "text-left"}
            `}
        >
            {children}
        </th>
    );
}
