import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";

import SurgeryStatusBadge from "../components/SurgeryStatusBadge";
import { operatingRoomService } from "../services/operatingRoomService";
import { dateTime, priorityLabel } from "../utils/operatingRoom";

export default function SurgeryListPage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({});
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        priority: "",
        page: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async (params = filters) => {
        try {
            setLoading(true);
            setError("");

            const response = await operatingRoomService.getSurgeries(params);

            setRows(response?.data ?? []);
            setMeta(response ?? {});
        } catch (err) {
            setError(
                err?.data?.message ??
                    err?.message ??
                    "Gagal memuat daftar operasi.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filters.status, filters.priority, filters.page]);

    const submitSearch = (event) => {
        event.preventDefault();

        const next = {
            ...filters,
            page: 1,
        };

        setFilters(next);
        load(next);
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <Link
                    to="/clinical/operating-room"
                    className="mb-[18px] inline-flex h-[38px] items-center gap-[7px] rounded-[9px] border border-[#dddddd] bg-white px-[13px] text-[11px] font-medium text-[#666666] transition hover:border-[#1688f8] hover:text-[#1688f8]"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
                    Kembali ke Kamar Operasi
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-[14px]">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#343434]">
                            Daftar Operasi
                        </h1>
                        <p className="mt-[5px] text-[12px] text-[#999999]">
                            Kelola permintaan, jadwal, proses, dan pemulihan operasi.
                        </p>
                    </div>

                    <Link
                        to="/clinical/operating-room/surgeries/new"
                        className="inline-flex h-[42px] items-center rounded-[9px] bg-[#1688f8] px-[16px] text-[12px] font-medium text-white transition hover:bg-[#0f7be8]"
                    >
                        + Permintaan Operasi
                    </Link>
                </div>

                {error && (
                    <div className="mt-[18px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={submitSearch}
                    className="mt-[22px] grid grid-cols-1 gap-[10px] rounded-[14px] border border-[#ececec] bg-white p-[16px] md:grid-cols-4"
                >
                    <div className="md:col-span-2">
                        <input
                            value={filters.search}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }))
                            }
                            placeholder="Cari nomor operasi, pasien, atau diagnosis..."
                            className={inputClass}
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                status: e.target.value,
                                page: 1,
                            }))
                        }
                        className={inputClass}
                    >
                        <option value="">Semua Status</option>
                        <option value="requested">Permintaan</option>
                        <option value="scheduled">Terjadwal</option>
                        <option value="preop">Pra Operasi</option>
                        <option value="ready">Siap Operasi</option>
                        <option value="in_progress">Sedang Operasi</option>
                        <option value="recovery">Pemulihan</option>
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                priority: e.target.value,
                                page: 1,
                            }))
                        }
                        className={inputClass}
                    >
                        <option value="">Semua Prioritas</option>
                        <option value="elective">Elektif</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergensi</option>
                    </select>

                    <button type="submit" className="hidden">
                        Cari
                    </button>
                </form>

                <div className="mt-[18px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    {loading ? (
                        <div className="p-[24px] text-[12px] text-[#999999]">
                            Memuat data operasi...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="bg-[#fafafa] text-[11px] font-medium text-[#777777]">
                                    <tr>
                                        <th className="px-[18px] py-[13px]">Nomor</th>
                                        <th className="px-[18px] py-[13px]">Pasien</th>
                                        <th className="px-[18px] py-[13px]">Tindakan</th>
                                        <th className="px-[18px] py-[13px]">Prioritas</th>
                                        <th className="px-[18px] py-[13px]">Jadwal</th>
                                        <th className="px-[18px] py-[13px]">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-[18px] py-[38px] text-center text-[12px] text-[#aaaaaa]"
                                            >
                                                Belum ada data operasi.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-t border-[#eeeeee] transition hover:bg-[#fafcff]"
                                            >
                                                <td className="px-[18px] py-[14px]">
                                                    <Link
                                                        to={`/clinical/operating-room/surgeries/${row.id}`}
                                                        className="text-[12px] font-semibold text-[#1688f8]"
                                                    >
                                                        {row.surgery_number || "-"}
                                                    </Link>
                                                </td>
                                                <td className="px-[18px] py-[14px] text-[12px] font-medium text-[#444444]">
                                                    {row.patient?.name || "-"}
                                                </td>
                                                <td className="max-w-[320px] px-[18px] py-[14px] text-[12px] text-[#666666]">
                                                    <p className="truncate">
                                                        {row.planned_procedure ||
                                                            row.operation_type?.name ||
                                                            "-"}
                                                    </p>
                                                </td>
                                                <td className="px-[18px] py-[14px] text-[12px] text-[#666666]">
                                                    {priorityLabel[row.priority] ||
                                                        row.priority ||
                                                        "-"}
                                                </td>
                                                <td className="px-[18px] py-[14px] text-[12px] text-[#666666]">
                                                    {dateTime(row.scheduled_start_at)}
                                                </td>
                                                <td className="px-[18px] py-[14px]">
                                                    <SurgeryStatusBadge
                                                        status={row.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[16px] py-[13px]">
                        <button
                            type="button"
                            disabled={(meta.current_page || 1) <= 1}
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    page: Math.max(1, prev.page - 1),
                                }))
                            }
                            className={paginationButtonClass}
                        >
                            Sebelumnya
                        </button>

                        <span className="text-[11px] text-[#777777]">
                            Halaman {meta.current_page || 1} dari {meta.last_page || 1}
                        </span>

                        <button
                            type="button"
                            disabled={
                                (meta.current_page || 1) >=
                                (meta.last_page || 1)
                            }
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    page: prev.page + 1,
                                }))
                            }
                            className={paginationButtonClass}
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

const inputClass = `
    h-[42px]
    w-full
    rounded-[9px]
    border
    border-[#dddddd]
    bg-white
    px-[12px]
    text-[12px]
    text-[#444444]
    outline-none
    transition
    placeholder:text-[#bbbbbb]
    focus:border-[#1688f8]
`;

const paginationButtonClass = `
    h-[38px]
    rounded-[8px]
    border
    border-[#dddddd]
    bg-white
    px-[13px]
    text-[11px]
    font-medium
    text-[#666666]
    transition
    hover:bg-[#f7f9fb]
    disabled:cursor-not-allowed
    disabled:text-[#cccccc]
    disabled:hover:bg-white
`;
