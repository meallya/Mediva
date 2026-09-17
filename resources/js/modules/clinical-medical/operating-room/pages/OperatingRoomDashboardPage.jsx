import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";

import { operatingRoomService } from "../services/operatingRoomService";

import SurgeryStatusBadge from "../components/SurgeryStatusBadge";

import { dateTime } from "../utils/operatingRoom";

/*
|--------------------------------------------------------------------------
| OPERATING ROOM DASHBOARD
|--------------------------------------------------------------------------
*/

export default function OperatingRoomDashboardPage() {
    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD DASHBOARD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);

                setError("");

                const response = await operatingRoomService.getDashboard();

                /*
                |--------------------------------------------------------------------------
                | API MEDIVA
                |--------------------------------------------------------------------------
                |
                | api.js sudah mengembalikan JSON langsung.
                |
                | Backend:
                |
                | {
                |     data: {
                |         today_total: 0,
                |         waiting: 0,
                |         in_progress: 0,
                |         recovery: 0,
                |         completed_today: 0,
                |         rooms_available: 0,
                |         today_schedule: []
                |     }
                | }
                |
                */

                setData(response?.data ?? response ?? {});
            } catch (err) {
                console.error("Operating Room Dashboard Error:", err);

                setError(
                    err?.data?.message ??
                        err?.response?.data?.message ??
                        err?.message ??
                        "Gagal memuat dashboard kamar operasi.",
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                    <div className="rounded-[14px] border border-[#eeeeee] bg-white p-[20px] text-[13px] text-[#888888]">
                        Memuat dashboard kamar operasi...
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    if (error) {
        return (
            <DashboardLayout>
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                    <div className="rounded-[14px] border border-red-100 bg-red-50 p-[20px] text-[13px] text-red-600">
                        {error}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const dashboard = data ?? {};

    const cards = [
        {
            label: "Operasi Hari Ini",
            value: dashboard.today_total ?? 0,
        },
        {
            label: "Menunggu",
            value: dashboard.waiting ?? 0,
        },
        {
            label: "Sedang Operasi",
            value: dashboard.in_progress ?? 0,
        },
        {
            label: "Pemulihan",
            value: dashboard.recovery ?? 0,
        },
        {
            label: "Selesai Hari Ini",
            value: dashboard.completed_today ?? 0,
        },
        {
            label: "Kamar Tersedia",
            value: dashboard.rooms_available ?? 0,
        },
    ];

    const todaySchedule = Array.isArray(dashboard.today_schedule)
        ? dashboard.today_schedule
        : [];

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY TIME
    |--------------------------------------------------------------------------
    |
    | requested / scheduled / preop / ready
    | → waktu jadwal
    |
    | in_progress
    | → waktu mulai aktual
    |
    | recovery / completed
    | → waktu selesai aktual
    |
    */

    const getActivityTime = (item) => {
        if (item.status === "recovery" || item.status === "completed") {
            return item.ended_at ?? item.started_at ?? item.scheduled_start_at;
        }

        if (item.status === "in_progress") {
            return item.started_at ?? item.scheduled_start_at;
        }

        return item.scheduled_start_at;
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                {/* =========================================================
                    HEADER
                ========================================================== */}

                <div className="flex flex-wrap items-center justify-between gap-[15px]">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#343434]">
                            Kamar Operasi
                        </h1>

                        <p className="mt-[5px] text-[12px] text-[#999999]">
                            Kelola jadwal, tindakan, keselamatan operasi, dan
                            pemulihan pasien.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-[9px]">
                        {/* MASTER */}

                        <Link
                            to="/clinical/operating-room/master"
                            className="
                                rounded-[9px]
                                border
                                border-[#dddddd]
                                bg-white
                                px-[14px]
                                py-[9px]
                                text-[12px]
                                font-medium
                                text-[#555555]
                                transition
                                hover:bg-[#f7f9fb]
                            "
                        >
                            Master Kamar Operasi
                        </Link>

                        {/* PERMINTAAN OPERASI */}

                        <Link
                            to="/clinical/operating-room/surgeries/new"
                            className="
                                rounded-[9px]
                                bg-[#1688f8]
                                px-[14px]
                                py-[9px]
                                text-[12px]
                                font-medium
                                text-white
                                transition
                                hover:bg-[#0878e5]
                            "
                        >
                            + Permintaan Operasi
                        </Link>
                    </div>
                </div>

                {/* =========================================================
                    STATISTICS
                ========================================================== */}

                <div className="mt-[24px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-[14px] border border-[#ececec] bg-white p-[18px]"
                        >
                            <p className="text-[11px] font-medium text-[#999999]">
                                {card.label}
                            </p>

                            <p className="mt-[8px] text-[26px] font-semibold text-[#343434]">
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* =========================================================
                    TODAY ACTIVITY
                ========================================================== */}

                <section className="mt-[20px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    {/* HEADER TABLE */}

                    <div className="flex items-center justify-between border-b border-[#eeeeee] px-[20px] py-[17px]">
                        <div>
                            <h2 className="text-[15px] font-semibold text-[#343434]">
                                Aktivitas Operasi Hari Ini
                            </h2>

                            <p className="mt-[3px] text-[11px] text-[#999999]">
                                Operasi yang dijadwalkan, dimulai, selesai, atau
                                sedang dalam pemulihan hari ini.
                            </p>
                        </div>

                        <Link
                            to="/clinical/operating-room/surgeries"
                            className="text-[12px] font-medium text-[#1688f8] transition hover:opacity-70"
                        >
                            Lihat Semua
                        </Link>
                    </div>

                    {/* TABLE */}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left">
                            {/* TABLE HEADER */}

                            <thead className="bg-[#fafafa] text-[11px] text-[#777777]">
                                <tr>
                                    <th className="px-[18px] py-[13px] font-semibold text-[#666666]">
                                        Nomor
                                    </th>

                                    <th className="px-[18px] py-[13px] font-semibold text-[#666666]">
                                        Pasien
                                    </th>

                                    <th className="px-[18px] py-[13px] font-semibold text-[#666666]">
                                        Jenis Operasi
                                    </th>

                                    <th className="px-[18px] py-[13px] font-semibold text-[#666666]">
                                        Kamar
                                    </th>

                                    <th className="px-[18px] py-[13px] font-semibold text-[#666666]">
                                        Waktu
                                    </th>

                                    <th className="px-[18px] py-[13px] font-semibold text-[#666666]">
                                        Status
                                    </th>

                                    <th className="px-[18px] py-[13px] text-center font-semibold text-[#666666]">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            {/* TABLE BODY */}

                            <tbody>
                                {todaySchedule.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-[18px] py-[35px] text-center text-[12px] text-[#aaaaaa]"
                                        >
                                            Belum ada aktivitas operasi hari
                                            ini.
                                        </td>
                                    </tr>
                                ) : (
                                    todaySchedule.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-t border-[#eeeeee] transition hover:bg-[#fcfcfc]"
                                        >
                                            {/* NOMOR OPERASI */}

                                            <td className="px-[18px] py-[14px] text-[12px] font-medium">
                                                <Link
                                                    to={`/clinical/operating-room/surgeries/${item.id}`}
                                                    className="text-[#1688f8] transition hover:underline"
                                                >
                                                    {item.surgery_number ?? "-"}
                                                </Link>
                                            </td>

                                            {/* PASIEN */}

                                            <td className="px-[18px] py-[14px] text-[12px] text-[#555555]">
                                                {item.patient?.name ?? "-"}
                                            </td>

                                            {/* JENIS OPERASI */}

                                            <td className="px-[18px] py-[14px] text-[12px] text-[#555555]">
                                                {item.operation_type?.name ??
                                                    "-"}
                                            </td>

                                            {/* KAMAR */}

                                            <td className="px-[18px] py-[14px] text-[12px] text-[#555555]">
                                                {item.operating_room?.name ??
                                                    "-"}
                                            </td>

                                            {/* WAKTU */}

                                            <td className="px-[18px] py-[14px] text-[12px] text-[#555555]">
                                                {dateTime(
                                                    getActivityTime(item),
                                                )}
                                            </td>

                                            {/* STATUS */}

                                            <td className="px-[18px] py-[14px]">
                                                <SurgeryStatusBadge
                                                    status={item.status}
                                                />
                                            </td>

                                            {/* AKSI */}

                                            <td className="px-[18px] py-[14px] text-center">
                                                <Link
                                                    to={`/clinical/operating-room/surgeries/${item.id}`}
                                                    className="
                                                            inline-flex
                                                            h-[34px]
                                                            items-center
                                                            justify-center
                                                            gap-[6px]
                                                            whitespace-nowrap
                                                            rounded-[8px]
                                                            border
                                                            border-[#CFE5FF]
                                                            bg-[#F7FBFF]
                                                            px-[11px]
                                                            text-[11px]
                                                            font-medium
                                                            text-[#1688F8]
                                                            transition
                                                            hover:border-[#1688F8]
                                                            hover:bg-[#EDF6FF]
                                                        "
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEye}
                                                        className="text-[10px]"
                                                    />
                                                    Lihat Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
