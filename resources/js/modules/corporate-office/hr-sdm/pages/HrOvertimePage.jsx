import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import { hrService } from "../services/hrService";

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const statusConfig = {
    pending_supervisor: {
        label: "Menunggu Atasan",
        className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    pending_hr: {
        label: "Menunggu HR",
        className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    approved: {
        label: "Disetujui",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    rejected: {
        label: "Ditolak",
        className: "border-red-200 bg-red-50 text-red-700",
    },
    cancelled: {
        label: "Dibatalkan",
        className: "border-gray-200 bg-gray-50 text-gray-600",
    },
};

function statusInfo(status) {
    return (
        statusConfig[status] ?? {
            label: status ?? "-",
            className: "border-gray-200 bg-gray-50 text-gray-600",
        }
    );
}

/*
|--------------------------------------------------------------------------
| FORMATTERS
|--------------------------------------------------------------------------
*/

function formatDate(value) {
    if (!value) return "-";

    const raw = String(value);
    const date = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(value) {
    if (!value) return null;

    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatTime(value) {
    return value ? String(value).slice(0, 5) : "--:--";
}

function formatDuration(minutes) {
    const total = Number(minutes ?? 0);

    if (!total) return "-";

    const hours = Math.floor(total / 60);
    const rest = total % 60;

    if (hours && rest) return `${hours} jam ${rest} menit`;
    if (hours) return `${hours} jam`;

    return `${rest} menit`;
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function HrOvertimePage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await hrService.overtimes({ page });

                if (!active) return;

                setRows(Array.isArray(response?.data) ? response.data : []);
                setMeta({
                    current_page: response?.current_page ?? 1,
                    last_page: response?.last_page ?? 1,
                    total: response?.total ?? 0,
                });
            } catch (err) {
                if (active) {
                    setError(
                        err?.data?.message ??
                            err?.message ??
                            "Gagal memuat data lembur.",
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [page]);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <h1 className="text-[24px] font-semibold text-[#343434]">
                    Lembur
                </h1>

                <p className="mt-[5px] text-[12px] text-[#999999]">
                    Daftar pengajuan lembur pegawai beserta status persetujuan
                    atasan dan HR.
                </p>

                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-[20px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Pegawai</Th>
                                    <Th>Tanggal</Th>
                                    <Th>Waktu</Th>
                                    <Th>Durasi</Th>
                                    <Th>Alasan</Th>
                                    <Th>Status</Th>
                                    <Th>Persetujuan</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <EmptyRow text="Memuat data lembur..." />
                                ) : rows.length === 0 ? (
                                    <EmptyRow text="Belum ada pengajuan lembur." />
                                ) : (
                                    rows.map((row) => {
                                        const status = statusInfo(row.status);
                                        const supervisorAt = formatDateTime(
                                            row.supervisor_approved_at,
                                        );
                                        const hrAt = formatDateTime(
                                            row.hr_approved_at,
                                        );

                                        return (
                                            <tr
                                                key={row.id}
                                                className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                            >
                                                <Td>
                                                    <p className="font-medium text-[#343434]">
                                                        {row.employee?.name ??
                                                            "-"}
                                                    </p>
                                                    <p className="mt-[2px] text-[10px] text-[#999999]">
                                                        {row.employee
                                                            ?.employee_number ??
                                                            "-"}
                                                    </p>
                                                </Td>

                                                <Td>
                                                    {formatDate(
                                                        row.overtime_date,
                                                    )}
                                                </Td>

                                                <Td>
                                                    <span className="tabular-nums">
                                                        {formatTime(
                                                            row.start_time,
                                                        )}{" "}
                                                        –{" "}
                                                        {formatTime(
                                                            row.end_time,
                                                        )}
                                                    </span>
                                                </Td>

                                                <Td>
                                                    {formatDuration(
                                                        row.duration_minutes,
                                                    )}
                                                </Td>

                                                <Td>
                                                    <p className="max-w-[260px] truncate">
                                                        {row.reason || "-"}
                                                    </p>
                                                </Td>

                                                <Td>
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-full border px-[9px] py-[4px] text-[11px] font-medium ${status.className}`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </Td>

                                                <Td>
                                                    <ApprovalLine
                                                        label="Atasan"
                                                        value={supervisorAt}
                                                    />
                                                    <ApprovalLine
                                                        label="HR"
                                                        value={hrAt}
                                                    />
                                                </Td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[16px] py-[14px]">
                        <p className="text-[12px] text-[#888888]">
                            Total {meta.total} pengajuan
                        </p>

                        <div className="flex items-center gap-[8px]">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1 || loading}
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>

                            <span className="text-[12px] text-[#666666]">
                                {meta.current_page} / {meta.last_page}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    meta.current_page >= meta.last_page ||
                                    loading
                                }
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:opacity-40"
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

/*
|--------------------------------------------------------------------------
| SMALL COMPONENTS
|--------------------------------------------------------------------------
*/

function Th({ children }) {
    return (
        <th className="px-[14px] py-[12px] text-left text-[11px] font-semibold uppercase tracking-[0.3px] text-[#777777]">
            {children}
        </th>
    );
}

function Td({ children }) {
    return (
        <td className="px-[14px] py-[13px] align-top text-[12px] text-[#555555]">
            {children}
        </td>
    );
}

function EmptyRow({ text }) {
    return (
        <tr>
            <td
                colSpan={7}
                className="px-[16px] py-[40px] text-center text-[13px] text-[#999999]"
            >
                {text}
            </td>
        </tr>
    );
}

function ApprovalLine({ label, value }) {
    return (
        <p className="text-[11px] leading-[1.6]">
            <span className="text-[#999999]">{label}: </span>
            <span className={value ? "text-[#444444]" : "text-[#bbbbbb]"}>
                {value ?? "Belum"}
            </span>
        </p>
    );
}
