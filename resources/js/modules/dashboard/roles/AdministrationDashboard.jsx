import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowRight,
    faCircleCheck,
    faClock,
    faClipboardList,
    faHospital,
    faSpinner,
    faStethoscope,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import registrationService from "../../registration/services/registrationService";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getLocalDate() {
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

function visitTypeLabel(value) {
    const labels = {
        outpatient: "Rawat Jalan",

        emergency: "IGD",

        inpatient: "Rawat Inap",

        medical_checkup: "Medical Check Up",

        day_care: "Day Care",

        home_care: "Home Care",

        telemedicine: "Telemedicine",
    };

    return labels[value] ?? value ?? "-";
}

function statusConfig(status) {
    const configs = {
        waiting: {
            label: "Menunggu",

            className: "bg-amber-50 text-amber-600",
        },

        called: {
            label: "Dipanggil",

            className: "bg-[#eaf4ff] text-[#1688f8]",
        },

        in_service: {
            label: "Dilayani",

            className: "bg-[#eaf4ff] text-[#1688f8]",
        },

        completed: {
            label: "Selesai",

            className: "bg-emerald-50 text-emerald-600",
        },

        cancelled: {
            label: "Dibatalkan",

            className: "bg-red-50 text-red-500",
        },

        skipped: {
            label: "Dilewati",

            className: "bg-gray-100 text-gray-500",
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
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function AdministrationDashboard() {
    const navigate = useNavigate();

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [registrations, setRegistrations] = useState([]);

    const [summary, setSummary] = useState({
        total: 0,

        waiting: 0,

        inService: 0,

        completed: 0,
    });

    /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

    const loadDashboard = async () => {
        try {
            setLoading(true);

            setError("");

            const today = getLocalDate();

            /*
                |--------------------------------------------------------------------------
                | PARALLEL REQUEST
                |--------------------------------------------------------------------------
                |
                | total dari pagination Laravel tetap akurat walaupun data yang
                | dikirim hanya 20 row per halaman.
                |
                */

            const [
                allResponse,
                waitingResponse,
                inServiceResponse,
                completedResponse,
            ] = await Promise.all([
                registrationService.getRegistrations({
                    date: today,

                    page: 1,
                }),

                registrationService.getRegistrations({
                    date: today,

                    status: "waiting",

                    page: 1,
                }),

                registrationService.getRegistrations({
                    date: today,

                    status: "in_service",

                    page: 1,
                }),

                registrationService.getRegistrations({
                    date: today,

                    status: "completed",

                    page: 1,
                }),
            ]);

            /*
                |--------------------------------------------------------------------------
                | RECENT REGISTRATIONS
                |--------------------------------------------------------------------------
                */

            setRegistrations(allResponse?.data ?? []);

            /*
                |--------------------------------------------------------------------------
                | SUMMARY
                |--------------------------------------------------------------------------
                */

            setSummary({
                total: allResponse?.total ?? 0,

                waiting: waitingResponse?.total ?? 0,

                inService: inServiceResponse?.total ?? 0,

                completed: completedResponse?.total ?? 0,
            });
        } catch (error) {
            console.error("Gagal memuat dashboard administrasi:", error);

            setError(error?.message ?? "Gagal memuat dashboard administrasi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | RECENT REGISTRATION
    |--------------------------------------------------------------------------
    */

    const recentRegistrations = useMemo(
        () => registrations.slice(0, 6),
        [registrations],
    );

    /*
    |--------------------------------------------------------------------------
    | QUEUE OVERVIEW
    |--------------------------------------------------------------------------
    */

    const queueOverview = useMemo(() => {
        const result = [];

        registrations.forEach((registration) => {
            const queues = registration?.visit?.queues ?? [];

            queues.forEach((queue) => {
                result.push({
                    ...queue,

                    patient: registration?.patient,

                    unit: registration?.unit,

                    registrationId: registration.id,
                });
            });
        });

        return result.slice(0, 6);
    }, [registrations]);

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <DashboardLayout>
                <div
                    className="
                        flex
                        min-h-[calc(100vh-88px)]
                        items-center
                        justify-center
                        bg-[#fafbfc]
                    "
                >
                    <div
                        className="
                            flex
                            items-center
                            gap-[10px]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="
                                text-[18px]
                                text-[#1688f8]
                            "
                        />

                        <p
                            className="
                                text-[13px]
                                text-[#888888]
                            "
                        >
                            Memuat dashboard administrasi...
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

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
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div>
                    <h1
                        className="
                            text-[24px]
                            font-semibold
                            tracking-[-0.3px]
                            text-[#343434]
                        "
                    >
                        Dashboard Administrasi
                    </h1>

                    <p
                        className="
                            mt-[5px]
                            text-[12px]
                            leading-[1.5]
                            text-[#8f8f8f]
                        "
                    >
                        Ringkasan administrasi dan pelayanan pasien hari ini
                    </p>
                </div>

                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && (
                    <div
                        className="
                            mt-[20px]
                            rounded-[10px]
                            border
                            border-red-100
                            bg-red-50
                            px-[15px]
                            py-[12px]
                            text-[13px]
                            text-red-500
                        "
                    >
                        {error}
                    </div>
                )}

                {/* =====================================================
                    STAT CARDS
                ====================================================== */}

                <div
                    className="
                        mt-[25px]
                        grid
                        grid-cols-1
                        gap-[16px]
                        sm:grid-cols-2
                        xl:grid-cols-4
                    "
                >
                    <StatCard
                        icon={faClipboardList}
                        label="Pendaftaran Hari Ini"
                        value={summary.total}
                        description="Total pasien terdaftar"
                    />

                    <StatCard
                        icon={faClock}
                        label="Menunggu Pelayanan"
                        value={summary.waiting}
                        description="Pasien masih menunggu"
                    />

                    <StatCard
                        icon={faStethoscope}
                        label="Sedang Dilayani"
                        value={summary.inService}
                        description="Pelayanan sedang berjalan"
                    />

                    <StatCard
                        icon={faCircleCheck}
                        label="Selesai Pelayanan"
                        value={summary.completed}
                        description="Pelayanan telah selesai"
                    />
                </div>

                {/* =====================================================
                    STATUS OVERVIEW
                ====================================================== */}

                <div
                    className="
                        mt-[20px]
                        rounded-[15px]
                        border
                        border-[#e8e8e8]
                        bg-white
                        p-[22px]
                    "
                >
                    <div>
                        <h2
                            className="
                                text-[15px]
                                font-semibold
                                text-[#444444]
                            "
                        >
                            Status Pelayanan Hari Ini
                        </h2>

                        <p
                            className="
                                mt-[4px]
                                text-[11px]
                                text-[#999999]
                            "
                        >
                            Monitoring status pendaftaran pasien
                        </p>
                    </div>

                    <div
                        className="
                            mt-[20px]
                            grid
                            grid-cols-1
                            gap-[12px]
                            md:grid-cols-3
                        "
                    >
                        <StatusSummary
                            label="Menunggu"
                            value={summary.waiting}
                            total={summary.total}
                        />

                        <StatusSummary
                            label="Dilayani"
                            value={summary.inService}
                            total={summary.total}
                        />

                        <StatusSummary
                            label="Selesai"
                            value={summary.completed}
                            total={summary.total}
                        />
                    </div>
                </div>

                {/* =====================================================
                    BOTTOM GRID
                ====================================================== */}

                <div
                    className="
                        mt-[20px]
                        grid
                        grid-cols-1
                        gap-[20px]
                        xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.8fr)]
                    "
                >
                    {/* =================================================
                        RECENT REGISTRATION
                    ================================================== */}

                    <div
                        className="
                            overflow-hidden
                            rounded-[15px]
                            border
                            border-[#e8e8e8]
                            bg-white
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                border-b
                                border-[#eeeeee]
                                px-[22px]
                                py-[17px]
                            "
                        >
                            <div>
                                <h2
                                    className="
                                        text-[15px]
                                        font-semibold
                                        text-[#444444]
                                    "
                                >
                                    Pendaftaran Terbaru
                                </h2>

                                <p
                                    className="
                                        mt-[4px]
                                        text-[11px]
                                        text-[#999999]
                                    "
                                >
                                    Pendaftaran pasien hari ini
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/registrations")}
                                className="
                                    flex
                                    items-center
                                    gap-[7px]
                                    text-[11px]
                                    font-medium
                                    text-[#1688f8]
                                    transition
                                    hover:opacity-70
                                "
                            >
                                Lihat Semua
                                <FontAwesomeIcon
                                    icon={faArrowRight}
                                    className="text-[9px]"
                                />
                            </button>
                        </div>

                        {recentRegistrations.length === 0 ? (
                            <div
                                className="
                                    flex
                                    min-h-[250px]
                                    items-center
                                    justify-center
                                    px-[20px]
                                    text-[12px]
                                    text-[#999999]
                                "
                            >
                                Belum ada pendaftaran hari ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table
                                    className="
                                        w-full
                                        min-w-[760px]
                                        border-collapse
                                    "
                                >
                                    <thead>
                                        <tr
                                            className="
                                                h-[48px]
                                                bg-[#fafbfc]
                                            "
                                        >
                                            <TableHeader>Pasien</TableHeader>

                                            <TableHeader>
                                                Poli / Unit
                                            </TableHeader>

                                            <TableHeader>Jenis</TableHeader>

                                            <TableHeader>Waktu</TableHeader>

                                            <TableHeader center>
                                                Status
                                            </TableHeader>

                                            <TableHeader center>
                                                Aksi
                                            </TableHeader>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentRegistrations.map(
                                            (registration) => {
                                                const status = statusConfig(
                                                    registration.status,
                                                );

                                                return (
                                                    <tr
                                                        key={registration.id}
                                                        className="
                                                            h-[68px]
                                                            border-t
                                                            border-[#f1f1f1]
                                                            transition
                                                            hover:bg-[#fafcff]
                                                        "
                                                    >
                                                        <td className="px-[18px]">
                                                            <p
                                                                className="
                                                                    max-w-[190px]
                                                                    truncate
                                                                    text-[12px]
                                                                    font-semibold
                                                                    text-[#444444]
                                                                "
                                                            >
                                                                {registration
                                                                    ?.patient
                                                                    ?.name ||
                                                                    "-"}
                                                            </p>

                                                            <p
                                                                className="
                                                                    mt-[3px]
                                                                    text-[10px]
                                                                    text-[#999999]
                                                                "
                                                            >
                                                                {registration
                                                                    ?.patient
                                                                    ?.medical_record_number ||
                                                                    "-"}
                                                            </p>
                                                        </td>

                                                        <td
                                                            className="
                                                                px-[18px]
                                                                text-[12px]
                                                                text-[#666666]
                                                            "
                                                        >
                                                            {registration?.unit
                                                                ?.name || "-"}
                                                        </td>

                                                        <td
                                                            className="
                                                                px-[18px]
                                                                text-[12px]
                                                                text-[#666666]
                                                            "
                                                        >
                                                            {visitTypeLabel(
                                                                registration.visit_type,
                                                            )}
                                                        </td>

                                                        <td
                                                            className="
                                                                px-[18px]
                                                                text-[12px]
                                                                text-[#666666]
                                                            "
                                                        >
                                                            {formatTime(
                                                                registration.registered_at,
                                                            )}
                                                        </td>

                                                        <td
                                                            className="
                                                                px-[18px]
                                                                text-center
                                                            "
                                                        >
                                                            <span
                                                                className={`
                                                                    inline-flex
                                                                    rounded-full
                                                                    px-[10px]
                                                                    py-[4px]
                                                                    text-[10px]
                                                                    font-medium

                                                                    ${status.className}
                                                                `}
                                                            >
                                                                {status.label}
                                                            </span>
                                                        </td>

                                                        <td
                                                            className="
                                                                px-[18px]
                                                                text-center
                                                            "
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/registrations/${registration.id}`,
                                                                    )
                                                                }
                                                                className="
                                                                    text-[11px]
                                                                    font-medium
                                                                    text-[#1688f8]
                                                                    transition
                                                                    hover:opacity-70
                                                                "
                                                            >
                                                                Detail
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        QUEUE OVERVIEW
                    ================================================== */}

                    <div
                        className="
                            overflow-hidden
                            rounded-[15px]
                            border
                            border-[#e8e8e8]
                            bg-white
                        "
                    >
                        <div
                            className="
                                border-b
                                border-[#eeeeee]
                                px-[20px]
                                py-[17px]
                            "
                        >
                            <h2
                                className="
                                    text-[15px]
                                    font-semibold
                                    text-[#444444]
                                "
                            >
                                Antrean Pelayanan
                            </h2>

                            <p
                                className="
                                    mt-[4px]
                                    text-[11px]
                                    text-[#999999]
                                "
                            >
                                Monitoring antrean pasien hari ini
                            </p>
                        </div>

                        {queueOverview.length === 0 ? (
                            <div
                                className="
                                    flex
                                    min-h-[250px]
                                    items-center
                                    justify-center
                                    px-[20px]
                                    text-center
                                    text-[12px]
                                    text-[#999999]
                                "
                            >
                                Belum ada antrean hari ini.
                            </div>
                        ) : (
                            <div
                                className="
                                    divide-y
                                    divide-[#f1f1f1]
                                "
                            >
                                {queueOverview.map((queue) => {
                                    const status = statusConfig(queue.status);

                                    return (
                                        <button
                                            key={queue.id}
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/registrations/${queue.registrationId}`,
                                                )
                                            }
                                            className="
                                                    flex
                                                    w-full
                                                    items-center
                                                    gap-[13px]
                                                    px-[20px]
                                                    py-[14px]
                                                    text-left
                                                    transition
                                                    hover:bg-[#fafcff]
                                                "
                                        >
                                            <div
                                                className="
                                                        flex
                                                        h-[40px]
                                                        min-w-[55px]
                                                        items-center
                                                        justify-center
                                                        rounded-[9px]
                                                        bg-[#eaf4ff]
                                                        px-[9px]
                                                        text-[11px]
                                                        font-semibold
                                                        text-[#1688f8]
                                                    "
                                            >
                                                {queue.queue_number || "-"}
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
                                                            text-[12px]
                                                            font-semibold
                                                            text-[#444444]
                                                        "
                                                >
                                                    {queue?.patient?.name ||
                                                        "-"}
                                                </p>

                                                <div
                                                    className="
                                                            mt-[3px]
                                                            flex
                                                            items-center
                                                            gap-[5px]
                                                            text-[10px]
                                                            text-[#999999]
                                                        "
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faHospital}
                                                        className="text-[9px]"
                                                    />

                                                    <span
                                                        className="
                                                                truncate
                                                            "
                                                    >
                                                        {queue?.unit?.name ||
                                                            "-"}
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className={`
                                                        shrink-0
                                                        rounded-full
                                                        px-[8px]
                                                        py-[4px]
                                                        text-[9px]
                                                        font-medium

                                                        ${status.className}
                                                    `}
                                            >
                                                {status.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({ icon, label, value, description }) {
    return (
        <div
            className="
                rounded-[14px]
                border
                border-[#e8e8e8]
                bg-white
                p-[19px]
            "
        >
            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-[15px]
                "
            >
                <div>
                    <p
                        className="
                            text-[11px]
                            font-medium
                            text-[#8f8f8f]
                        "
                    >
                        {label}
                    </p>

                    <p
                        className="
                            mt-[8px]
                            text-[25px]
                            font-semibold
                            tracking-[-0.5px]
                            text-[#343434]
                        "
                    >
                        {value}
                    </p>

                    <p
                        className="
                            mt-[5px]
                            text-[10px]
                            text-[#aaaaaa]
                        "
                    >
                        {description}
                    </p>
                </div>

                <div
                    className="
                        flex
                        h-[42px]
                        w-[42px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-[10px]
                        bg-[#eaf4ff]
                        text-[#1688f8]
                    "
                >
                    <FontAwesomeIcon icon={icon} className="text-[15px]" />
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STATUS SUMMARY
|--------------------------------------------------------------------------
*/

function StatusSummary({ label, value, total }) {
    const percentage =
        total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

    return (
        <div
            className="
                rounded-[11px]
                border
                border-[#eeeeee]
                bg-[#fafbfc]
                p-[15px]
            "
        >
            <div
                className="
                    flex
                    items-center
                    justify-between
                    gap-[10px]
                "
            >
                <p
                    className="
                        text-[12px]
                        font-medium
                        text-[#666666]
                    "
                >
                    {label}
                </p>

                <p
                    className="
                        text-[12px]
                        font-semibold
                        text-[#444444]
                    "
                >
                    {value}
                </p>
            </div>

            <div
                className="
                    mt-[11px]
                    h-[6px]
                    overflow-hidden
                    rounded-full
                    bg-[#e9edf1]
                "
            >
                <div
                    className="
                        h-full
                        rounded-full
                        bg-[#1688f8]
                        transition-all
                        duration-300
                    "
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>

            <p
                className="
                    mt-[7px]
                    text-[10px]
                    text-[#aaaaaa]
                "
            >
                {percentage}% dari pendaftaran hari ini
            </p>
        </div>
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
                px-[18px]
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
