import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import queueService from "../../patient/services/queueService";

function getLocalDate() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function normalizePagination(response) {
    if (response?.data?.current_page !== undefined) {
        return response.data;
    }

    return response;
}

function normalizeOptions(response) {
    if (response?.data?.units !== undefined) {
        return response.data;
    }

    return response;
}

function statusLabel(status) {
    const labels = {
        waiting: "Menunggu",
        called: "Dipanggil",
        in_service: "Dilayani",
        completed: "Selesai",
        skipped: "Dilewati",
    };

    return labels[status] ?? status;
}

function statusClass(status) {
    const classes = {
        waiting: "bg-amber-50 text-amber-700",

        called: "bg-blue-50 text-blue-700",

        in_service: "bg-violet-50 text-violet-700",

        completed: "bg-emerald-50 text-emerald-700",

        skipped: "bg-gray-100 text-gray-600",
    };

    return classes[status] ?? "bg-gray-100 text-gray-600";
}

export default function QueueListPage() {
    const [queues, setQueues] = useState([]);

    const [units, setUnits] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("");

    const [unitId, setUnitId] = useState("");

    const [date, setDate] = useState(getLocalDate());

    const [page, setPage] = useState(1);

    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const loadOptions = async () => {
        try {
            const response = await queueService.getOptions();

            const data = normalizeOptions(response);

            setUnits(data?.units ?? []);
        } catch (error) {
            console.error("Gagal memuat opsi antrean:", error);
        }
    };

    const loadQueues = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await queueService.getQueues({
                search,
                status,
                unit_id: unitId,
                service_type: "clinic",
                date,
                page,
            });

            const data = normalizePagination(response);

            setQueues(data?.data ?? []);

            setMeta({
                current_page: data?.current_page ?? 1,

                last_page: data?.last_page ?? 1,

                total: data?.total ?? 0,
            });
        } catch (error) {
            console.error("Gagal memuat antrean:", error);

            setError(error?.message ?? "Gagal memuat data antrean.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadQueues();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, status, unitId, date, page]);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <div className="mb-[24px]">
                    <h1 className="text-[24px] font-semibold text-[#343434]">
                        Antrean Pasien
                    </h1>

                    <p className="mt-[5px] text-[12px] text-[#999999]">
                        Pantau antrean pelayanan pasien MEDIVA
                    </p>
                </div>

                {/* FILTER */}

                <div className="mb-[18px] rounded-[14px] border border-[#ececec] bg-white p-[18px]">
                    <div className="grid grid-cols-1 gap-[12px] md:grid-cols-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);

                                setPage(1);
                            }}
                            placeholder="Cari pasien / RM / antrean..."
                            className="h-[42px] rounded-[10px] border border-[#dddddd] px-[13px] text-[13px] outline-none"
                        />

                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);

                                setPage(1);
                            }}
                            className="h-[42px] rounded-[10px] border border-[#dddddd] px-[13px] text-[13px] outline-none"
                        >
                            <option value="">Semua Status</option>

                            <option value="waiting">Menunggu</option>

                            <option value="called">Dipanggil</option>

                            <option value="in_service">Dilayani</option>

                            <option value="completed">Selesai</option>

                            <option value="skipped">Dilewati</option>
                        </select>

                        <select
                            value={unitId}
                            onChange={(event) => {
                                setUnitId(event.target.value);

                                setPage(1);
                            }}
                            className="h-[42px] rounded-[10px] border border-[#dddddd] px-[13px] text-[13px] outline-none"
                        >
                            <option value="">Semua Unit / Poli</option>

                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value);

                                setPage(1);
                            }}
                            className="h-[42px] rounded-[10px] border border-[#dddddd] px-[13px] text-[13px] outline-none"
                        />
                    </div>
                </div>

                {/* TABLE */}

                <div className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="flex items-center justify-between border-b border-[#eeeeee] px-[20px] py-[16px]">
                        <div>
                            <h2 className="text-[15px] font-semibold text-[#343434]">
                                Daftar Antrean
                            </h2>

                            <p className="mt-[2px] text-[11px] text-[#999999]">
                                {meta.total} antrean ditemukan
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="m-[20px] rounded-[10px] bg-red-50 px-[14px] py-[12px] text-[12px] text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="border-b border-[#eeeeee] bg-[#fafafa] text-left">
                                    <th className="px-[20px] py-[12px] text-[11px] font-semibold text-[#777777]">
                                        ANTREAN
                                    </th>

                                    <th className="px-[20px] py-[12px] text-[11px] font-semibold text-[#777777]">
                                        PASIEN
                                    </th>

                                    <th className="px-[20px] py-[12px] text-[11px] font-semibold text-[#777777]">
                                        UNIT / POLI
                                    </th>

                                    <th className="px-[20px] py-[12px] text-[11px] font-semibold text-[#777777]">
                                        KUNJUNGAN
                                    </th>

                                    <th className="px-[20px] py-[12px] text-[11px] font-semibold text-[#777777]">
                                        STATUS
                                    </th>

                                    <th className="px-[20px] py-[12px] text-right text-[11px] font-semibold text-[#777777]">
                                        AKSI
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-[20px] py-[40px] text-center text-[12px] text-[#999999]"
                                        >
                                            Memuat antrean...
                                        </td>
                                    </tr>
                                ) : queues.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-[20px] py-[40px] text-center text-[12px] text-[#999999]"
                                        >
                                            Belum ada antrean.
                                        </td>
                                    </tr>
                                ) : (
                                    queues.map((queue) => (
                                        <tr
                                            key={queue.id}
                                            className="border-b border-[#f1f1f1] last:border-b-0"
                                        >
                                            <td className="px-[20px] py-[15px]">
                                                <div className="text-[18px] font-semibold text-[#343434]">
                                                    {queue.queue_number}
                                                </div>

                                                <div className="mt-[2px] text-[11px] text-[#999999]">
                                                    Prioritas {queue.priority}
                                                </div>
                                            </td>

                                            <td className="px-[20px] py-[15px]">
                                                <div className="text-[13px] font-medium text-[#444444]">
                                                    {queue.visit?.patient
                                                        ?.name ?? "-"}
                                                </div>

                                                <div className="mt-[2px] text-[11px] text-[#999999]">
                                                    RM{" "}
                                                    {queue.visit?.patient
                                                        ?.medical_record_number ??
                                                        "-"}
                                                </div>
                                            </td>

                                            <td className="px-[20px] py-[15px] text-[12px] text-[#666666]">
                                                {queue.unit?.name ?? "-"}
                                            </td>

                                            <td className="px-[20px] py-[15px]">
                                                <div className="text-[12px] text-[#555555]">
                                                    {queue.visit
                                                        ?.visit_number ?? "-"}
                                                </div>

                                                <div className="mt-[2px] text-[11px] text-[#999999]">
                                                    {queue.visit?.registration
                                                        ?.registration_number ??
                                                        "-"}
                                                </div>
                                            </td>

                                            <td className="px-[20px] py-[15px]">
                                                <span
                                                    className={`inline-flex rounded-full px-[10px] py-[5px] text-[11px] font-medium ${statusClass(
                                                        queue.status,
                                                    )}`}
                                                >
                                                    {statusLabel(queue.status)}
                                                </span>
                                            </td>

                                            <td className="px-[20px] py-[15px] text-right">
                                                <Link
                                                    to={`/queues/${queue.id}`}
                                                    className="inline-flex h-[34px] items-center rounded-[8px] border border-[#dddddd] px-[12px] text-[12px] font-medium text-[#555555] hover:bg-[#f7f7f7]"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[20px] py-[14px]">
                        <span className="text-[11px] text-[#999999]">
                            Halaman {meta.current_page} dari {meta.last_page}
                        </span>

                        <div className="flex gap-[8px]">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1}
                                onClick={() =>
                                    setPage((value) => Math.max(1, value - 1))
                                }
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[11px] disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>

                            <button
                                type="button"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => setPage((value) => value + 1)}
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[11px] disabled:opacity-40"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
