import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faCapsules,
    faEye,
    faMagnifyingGlass,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import pharmacyService from "../services/pharmacyService";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusConfig(status) {
    const configs = {
        submitted: {
            label: "Resep Masuk",
            className: "bg-amber-50 text-amber-600",
        },

        processing: {
            label: "Diproses",
            className: "bg-[#eaf4ff] text-[#1688f8]",
        },

        ready: {
            label: "Siap",
            className: "bg-emerald-50 text-emerald-600",
        },

        dispensed: {
            label: "Diserahkan",
            className: "bg-[#f1f1f1] text-[#666666]",
        },
    };

    return (
        configs[status] ?? {
            label: status ?? "-",
            className: "bg-gray-100 text-gray-500",
        }
    );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function PrescriptionQueuePage() {
    const navigate = useNavigate();

    const [prescriptions, setPrescriptions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("");

    const [date, setDate] = useState(today());

    const [currentPage, setCurrentPage] = useState(1);

    const [lastPage, setLastPage] = useState(1);

    const [total, setTotal] = useState(0);

    /*
    |--------------------------------------------------------------------------
    | LOAD PRESCRIPTIONS
    |--------------------------------------------------------------------------
    */

    const loadPrescriptions = async (
        page = 1,
        keyword = search,
        selectedStatus = status,
        selectedDate = date,
    ) => {
        try {
            setLoading(true);

            setError("");

            const response = await pharmacyService.getPrescriptions({
                page,

                search: keyword.trim(),

                status: selectedStatus,

                date: selectedDate,
            });

            setPrescriptions(response?.data ?? []);

            setCurrentPage(response?.current_page ?? 1);

            setLastPage(response?.last_page ?? 1);

            setTotal(response?.total ?? 0);
        } catch (error) {
            console.error("Gagal mengambil resep farmasi:", error);

            setError(error?.message ?? "Gagal mengambil data resep farmasi.");
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
        loadPrescriptions(1, "", "", date);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const handleSearch = (event) => {
        event.preventDefault();

        loadPrescriptions(1);
    };

    /*
    |--------------------------------------------------------------------------
    | STATUS FILTER
    |--------------------------------------------------------------------------
    */

    const handleStatus = (event) => {
        const value = event.target.value;

        setStatus(value);

        loadPrescriptions(1, search, value, date);
    };

    /*
    |--------------------------------------------------------------------------
    | DATE FILTER
    |--------------------------------------------------------------------------
    */

    const handleDate = (event) => {
        const value = event.target.value;

        setDate(value);

        loadPrescriptions(1, search, status, value);
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <DashboardLayout>
            <div
                className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
            >
                {/* HEADER */}

                <div>
                    <h1
                        className="
                            text-[24px]
                            font-semibold
                            text-[#343434]
                        "
                    >
                        Resep Farmasi
                    </h1>

                    <p
                        className="
                            mt-[5px]
                            text-[12px]
                            text-[#8f8f8f]
                        "
                    >
                        Kelola resep yang dikirim dokter ke instalasi farmasi
                    </p>
                </div>

                {/* MAIN CARD */}

                <section
                    className="
                        mt-[24px]
                        overflow-hidden
                        rounded-[14px]
                        border
                        border-[#ececec]
                        bg-white
                    "
                >
                    {/* FILTER */}

                    <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-[14px]
                            border-b
                            border-[#eeeeee]
                            px-[20px]
                            py-[18px]
                        "
                    >
                        <form
                            onSubmit={handleSearch}
                            className="
                                flex
                                flex-wrap
                                items-center
                                gap-[10px]
                            "
                        >
                            {/* SEARCH */}

                            <div
                                className="
                                    flex
                                    h-[42px]
                                    w-[290px]
                                    items-center
                                    gap-[9px]
                                    rounded-[9px]
                                    border
                                    border-[#e5e5e5]
                                    bg-white
                                    px-[13px]
                                "
                            >
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className="
                                        text-[12px]
                                        text-[#aaaaaa]
                                    "
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari resep, pasien, No. RM..."
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

                            {/* STATUS */}

                            <select
                                value={status}
                                onChange={handleStatus}
                                className="
                                    h-[42px]
                                    rounded-[9px]
                                    border
                                    border-[#e5e5e5]
                                    bg-white
                                    px-[12px]
                                    text-[12px]
                                    text-[#666666]
                                    outline-none
                                "
                            >
                                <option value="">Semua Status</option>

                                <option value="submitted">Resep Masuk</option>

                                <option value="processing">Diproses</option>

                                <option value="ready">Siap</option>

                                <option value="dispensed">Diserahkan</option>
                            </select>

                            {/* DATE */}

                            <input
                                type="date"
                                value={date}
                                onChange={handleDate}
                                className="
                                    h-[42px]
                                    rounded-[9px]
                                    border
                                    border-[#e5e5e5]
                                    bg-white
                                    px-[12px]
                                    text-[12px]
                                    text-[#666666]
                                    outline-none
                                "
                            />

                            {/* SEARCH BUTTON */}

                            <button
                                type="submit"
                                className="
                                    h-[42px]
                                    rounded-[9px]
                                    bg-[#047AF7]
                                    px-[16px]
                                    text-[12px]
                                    font-medium
                                    text-white
                                    transition
                                    hover:opacity-90
                                "
                            >
                                Cari
                            </button>
                        </form>

                        <p
                            className="
                                text-[12px]
                                text-[#999999]
                            "
                        >
                            Total{" "}
                            <span
                                className="
                                    font-semibold
                                    text-[#555555]
                                "
                            >
                                {total}
                            </span>{" "}
                            resep
                        </p>
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div
                            className="
                                mx-[20px]
                                mt-[18px]
                                rounded-[9px]
                                border
                                border-red-100
                                bg-red-50
                                px-[14px]
                                py-[11px]
                                text-[13px]
                                text-red-500
                            "
                        >
                            {error}
                        </div>
                    )}

                    {/* TABLE */}

                    <div className="overflow-x-auto">
                        <table
                            className="
                                w-full
                                min-w-[1000px]
                                border-collapse
                            "
                        >
                            <thead>
                                <tr
                                    className="
                                        h-[50px]
                                        bg-[#fafbfc]
                                    "
                                >
                                    <TableHeader>No. Resep</TableHeader>

                                    <TableHeader>Pasien</TableHeader>

                                    <TableHeader>Dokter</TableHeader>

                                    <TableHeader>Poli / Unit</TableHeader>

                                    <TableHeader center>Item</TableHeader>

                                    <TableHeader center>Waktu</TableHeader>

                                    <TableHeader center>Status</TableHeader>

                                    <TableHeader center>Aksi</TableHeader>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="
                                                h-[130px]
                                                text-center
                                                text-[13px]
                                                text-[#999999]
                                            "
                                        >
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                spin
                                                className="
                                                    mr-[8px]
                                                    text-[#047AF7]
                                                "
                                            />
                                            Memuat resep...
                                        </td>
                                    </tr>
                                ) : prescriptions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="
                                                h-[130px]
                                                text-center
                                                text-[13px]
                                                text-[#999999]
                                            "
                                        >
                                            Belum ada resep pada filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    prescriptions.map((prescription) => {
                                        const statusInfo = statusConfig(
                                            prescription.status,
                                        );

                                        return (
                                            <tr
                                                key={prescription.id}
                                                className="
                                                        h-[74px]
                                                        border-t
                                                        border-[#f0f0f0]
                                                        transition
                                                        hover:bg-[#fafcff]
                                                    "
                                            >
                                                {/* NUMBER */}

                                                <td className="px-[20px]">
                                                    <div
                                                        className="
                                                                flex
                                                                items-center
                                                                gap-[9px]
                                                            "
                                                    >
                                                        <div
                                                            className="
                                                                    flex
                                                                    h-[34px]
                                                                    w-[34px]
                                                                    items-center
                                                                    justify-center
                                                                    rounded-[8px]
                                                                    bg-[#eaf4ff]
                                                                    text-[#047AF7]
                                                                "
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faCapsules
                                                                }
                                                                className="text-[12px]"
                                                            />
                                                        </div>

                                                        <span
                                                            className="
                                                                    text-[12px]
                                                                    font-semibold
                                                                    text-[#047AF7]
                                                                "
                                                        >
                                                            {prescription.prescription_number ??
                                                                "-"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* PATIENT */}

                                                <td className="px-[20px]">
                                                    <p
                                                        className="
                                                                text-[13px]
                                                                font-semibold
                                                                text-[#444444]
                                                            "
                                                    >
                                                        {prescription?.patient
                                                            ?.name ?? "-"}
                                                    </p>

                                                    <p
                                                        className="
                                                                mt-[3px]
                                                                text-[11px]
                                                                text-[#999999]
                                                            "
                                                    >
                                                        {prescription?.patient
                                                            ?.medical_record_number ??
                                                            "-"}
                                                    </p>
                                                </td>

                                                {/* DOCTOR */}

                                                <td
                                                    className="
                                                            px-[20px]
                                                            text-[12px]
                                                            text-[#666666]
                                                        "
                                                >
                                                    {prescription?.doctor
                                                        ?.employee?.name ?? "-"}
                                                </td>

                                                {/* UNIT */}

                                                <td
                                                    className="
                                                            px-[20px]
                                                            text-[12px]
                                                            text-[#666666]
                                                        "
                                                >
                                                    {prescription?.visit?.unit
                                                        ?.name ?? "-"}
                                                </td>

                                                {/* ITEMS */}

                                                <td
                                                    className="
                                                            px-[20px]
                                                            text-center
                                                            text-[12px]
                                                            text-[#666666]
                                                        "
                                                >
                                                    {prescription.items_count ??
                                                        0}
                                                </td>

                                                {/* TIME */}

                                                <td
                                                    className="
                                                            px-[20px]
                                                            text-center
                                                            text-[12px]
                                                            text-[#666666]
                                                        "
                                                >
                                                    {formatTime(
                                                        prescription.submitted_at,
                                                    )}
                                                </td>

                                                {/* STATUS */}

                                                <td className="px-[20px] text-center">
                                                    <span
                                                        className={`
                                                                inline-flex
                                                                rounded-full
                                                                px-[10px]
                                                                py-[5px]
                                                                text-[10px]
                                                                font-medium
                                                                ${statusInfo.className}
                                                            `}
                                                    >
                                                        {statusInfo.label}
                                                    </span>
                                                </td>

                                                {/* ACTION */}

                                                <td className="px-[20px] text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/pharmacy/prescriptions/${prescription.id}`,
                                                            )
                                                        }
                                                        className="
                                                                inline-flex
                                                                h-[34px]
                                                                items-center
                                                                gap-[6px]
                                                                rounded-[8px]
                                                                px-[10px]
                                                                text-[11px]
                                                                font-medium
                                                                text-[#047AF7]
                                                                transition
                                                                hover:bg-[#eaf4ff]
                                                            "
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEye}
                                                        />
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}

                    <div
                        className="
                            flex
                            min-h-[72px]
                            items-center
                            justify-between
                            border-t
                            border-[#eeeeee]
                            px-[20px]
                        "
                    >
                        <p
                            className="
                                text-[12px]
                                text-[#999999]
                            "
                        >
                            Halaman {currentPage} dari {lastPage}
                        </p>

                        <div
                            className="
                                flex
                                gap-[8px]
                            "
                        >
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    loadPrescriptions(currentPage - 1)
                                }
                                className="
                                    h-[38px]
                                    rounded-[8px]
                                    border
                                    border-[#e5e5e5]
                                    bg-white
                                    px-[13px]
                                    text-[12px]
                                    text-[#666666]
                                    transition
                                    hover:bg-[#f7f9fb]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                Sebelumnya
                            </button>

                            <button
                                type="button"
                                disabled={currentPage >= lastPage}
                                onClick={() =>
                                    loadPrescriptions(currentPage + 1)
                                }
                                className="
                                    h-[38px]
                                    rounded-[8px]
                                    border
                                    border-[#e5e5e5]
                                    bg-white
                                    px-[13px]
                                    text-[12px]
                                    text-[#666666]
                                    transition
                                    hover:bg-[#f7f9fb]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </section>
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
                px-[20px]
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.25px]
                text-[#999999]
                ${center ? "text-center" : "text-left"}
            `}
        >
            {children}
        </th>
    );
}
