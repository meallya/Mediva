import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import useAuth from "../../auth/hooks/useAuth";

import queueService from "../../queue/services/queueService";

export default function DoctorQueuePage() {
    const { activeRole } = useAuth();

    const [waiting, setWaiting] = useState([]);

    const [inService, setInService] = useState([]);

    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState("waiting");

    const unitId = activeRole?.unit?.id;

    const loadQueues = async () => {
        try {
            setLoading(true);

            const [waitingResponse, calledResponse, serviceResponse] =
                await Promise.all([
                    queueService.getQueues({
                        status: "waiting",

                        unit_id: unitId,

                        service_type: "clinic",
                    }),

                    queueService.getQueues({
                        status: "called",

                        unit_id: unitId,

                        service_type: "clinic",
                    }),

                    queueService.getQueues({
                        status: "in_service",

                        unit_id: unitId,

                        service_type: "clinic",
                    }),
                ]);

            setWaiting([
                ...(waitingResponse?.data ?? []),

                ...(calledResponse?.data ?? []),
            ]);

            setInService(serviceResponse?.data ?? []);
        } catch (error) {
            console.error("Doctor queue:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (unitId) {
            loadQueues();
        }
    }, [unitId]);

    const queues = tab === "waiting" ? waiting : inService;

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <h1 className="text-[24px] font-semibold text-[#343434]">
                    Pemeriksaan Dokter
                </h1>

                <p className="mt-[5px] text-[12px] text-[#999999]">
                    Daftar pasien yang menunggu dan sedang dilayani di{" "}
                    {activeRole?.unit?.name ?? "-"}
                </p>

                {/* SUMMARY */}

                <div className="mt-[22px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setTab("waiting")}
                        className={`
                            rounded-[14px]
                            border
                            p-[18px]
                            text-left

                            ${
                                tab === "waiting"
                                    ? "border-[#1688f8] bg-[#eef7ff]"
                                    : "border-[#ececec] bg-white"
                            }
                        `}
                    >
                        <p className="text-[24px] font-semibold text-[#343434]">
                            {waiting.length}
                        </p>

                        <p className="mt-[3px] text-[11px] text-[#888888]">
                            Pasien Menunggu
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab("in_service")}
                        className={`
                            rounded-[14px]
                            border
                            p-[18px]
                            text-left

                            ${
                                tab === "in_service"
                                    ? "border-[#1688f8] bg-[#eef7ff]"
                                    : "border-[#ececec] bg-white"
                            }
                        `}
                    >
                        <p className="text-[24px] font-semibold text-[#343434]">
                            {inService.length}
                        </p>

                        <p className="mt-[3px] text-[11px] text-[#888888]">
                            Sedang Dilayani
                        </p>
                    </button>
                </div>

                {/* TABLE */}

                <div className="mt-[18px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="border-b border-[#eeeeee] px-[20px] py-[15px]">
                        <h2 className="text-[14px] font-semibold text-[#444444]">
                            {tab === "waiting"
                                ? "Daftar Pasien Waiting"
                                : "Daftar Pasien In Service"}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-[#fafafa] text-left">
                                    <th className="px-[20px] py-[11px] text-[10px] font-semibold text-[#888888]">
                                        ANTREAN
                                    </th>

                                    <th className="px-[20px] py-[11px] text-[10px] font-semibold text-[#888888]">
                                        PASIEN
                                    </th>

                                    <th className="px-[20px] py-[11px] text-[10px] font-semibold text-[#888888]">
                                        NO RM
                                    </th>

                                    <th className="px-[20px] py-[11px] text-[10px] font-semibold text-[#888888]">
                                        STATUS
                                    </th>

                                    <th className="px-[20px] py-[11px] text-right text-[10px] font-semibold text-[#888888]">
                                        AKSI
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="p-[30px] text-center text-[11px] text-[#999999]"
                                        >
                                            Memuat antrean...
                                        </td>
                                    </tr>
                                ) : queues.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="p-[30px] text-center text-[11px] text-[#999999]"
                                        >
                                            Tidak ada pasien.
                                        </td>
                                    </tr>
                                ) : (
                                    queues.map((queue) => (
                                        <tr
                                            key={queue.id}
                                            className="border-t border-[#eeeeee]"
                                        >
                                            <td className="px-[20px] py-[14px] text-[16px] font-semibold text-[#343434]">
                                                {queue.queue_number}
                                            </td>

                                            <td className="px-[20px] py-[14px] text-[12px] font-medium text-[#444444]">
                                                {queue?.visit?.patient?.name ??
                                                    "-"}
                                            </td>

                                            <td className="px-[20px] py-[14px] text-[11px] text-[#777777]">
                                                {queue?.visit?.patient
                                                    ?.medical_record_number ??
                                                    "-"}
                                            </td>

                                            <td className="px-[20px] py-[14px] text-[11px] text-[#777777]">
                                                {queue.status}
                                            </td>

                                            <td className="px-[20px] py-[14px] text-right">
                                                <Link
                                                    to={`/queues/${queue.id}`}
                                                    className="rounded-[8px] bg-[#1688f8] px-[12px] py-[7px] text-[11px] font-medium text-white"
                                                >
                                                    Buka
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
