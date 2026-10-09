import React, { Fragment, useEffect, useState } from "react";
import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import { hrService } from "../services/hrService";

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
| Nilai status pada hr_performance_reviews belum terdokumentasi.
| Mapping di bawah bersifat defensif; status tak dikenal tampil apa adanya.
*/

const neutralBadge = "border-gray-200 bg-gray-50 text-gray-600";

const statusConfig = {
    draft: {
        label: "Draft",
        className: neutralBadge,
    },
    pending: {
        label: "Menunggu Penilaian",
        className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    reviewed: {
        label: "Sudah Dinilai",
        className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    final: {
        label: "Final",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
};

function statusInfo(status) {
    if (statusConfig[status]) return statusConfig[status];

    const label = status ? String(status).replace(/_/g, " ") : "-";

    return {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        className: neutralBadge,
    };
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

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";

    const number = Number(value);

    if (Number.isNaN(number)) return String(value);

    return number.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function formatText(value) {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "string") return value;

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function HrPerformancePage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                setLoading(true);
                setError("");
                setExpandedId(null);

                const response = await hrService.performances({ page });

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
                            "Gagal memuat data penilaian kinerja.",
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
                    Performa & Penilaian
                </h1>

                <p className="mt-[5px] text-[12px] text-[#999999]">
                    Daftar penilaian kinerja pegawai per periode beserta
                    indikator, skor, dan catatan atasan.
                </p>

                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-[20px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Pegawai</Th>
                                    <Th>Periode</Th>
                                    <Th>Skor Akhir</Th>
                                    <Th>Status</Th>
                                    <Th>Dinilai</Th>
                                    <Th>Detail</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <EmptyRow text="Memuat data penilaian..." />
                                ) : rows.length === 0 ? (
                                    <EmptyRow text="Belum ada data penilaian kinerja." />
                                ) : (
                                    rows.map((row) => {
                                        const status = statusInfo(row.status);
                                        const reviewedAt = formatDateTime(
                                            row.reviewed_at,
                                        );
                                        const isOpen = expandedId === row.id;

                                        return (
                                            <Fragment key={row.id}>
                                                <tr className="border-b border-[#f0f0f0] hover:bg-[#fcfdff]">
                                                    <Td>
                                                        <p className="font-medium text-[#343434]">
                                                            {row.employee
                                                                ?.name ?? "-"}
                                                        </p>
                                                        <p className="mt-[2px] text-[10px] text-[#999999]">
                                                            {row.employee
                                                                ?.employee_number ??
                                                                "-"}
                                                        </p>
                                                    </Td>

                                                    <Td>
                                                        <p className="font-medium text-[#343434]">
                                                            {row.period_name ||
                                                                "-"}
                                                        </p>
                                                        <p className="mt-[2px] text-[10px] text-[#999999]">
                                                            {formatDate(
                                                                row.period_start,
                                                            )}{" "}
                                                            –{" "}
                                                            {formatDate(
                                                                row.period_end,
                                                            )}
                                                        </p>
                                                    </Td>

                                                    <Td>
                                                        <span className="text-[14px] font-semibold tabular-nums text-[#343434]">
                                                            {formatNumber(
                                                                row.final_score,
                                                            )}
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <span
                                                            className={`inline-flex whitespace-nowrap rounded-full border px-[9px] py-[4px] text-[11px] font-medium ${status.className}`}
                                                        >
                                                            {status.label}
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <span
                                                            className={
                                                                reviewedAt
                                                                    ? "text-[#444444]"
                                                                    : "text-[#bbbbbb]"
                                                            }
                                                        >
                                                            {reviewedAt ??
                                                                "Belum dinilai"}
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <button
                                                            type="button"
                                                            aria-expanded={
                                                                isOpen
                                                            }
                                                            onClick={() =>
                                                                setExpandedId(
                                                                    isOpen
                                                                        ? null
                                                                        : row.id,
                                                                )
                                                            }
                                                            className="rounded-[8px] border border-[#dddddd] px-[10px] py-[6px] text-[11px] text-[#555555] hover:bg-[#fafbfc]"
                                                        >
                                                            {isOpen
                                                                ? "Tutup"
                                                                : "Lihat"}
                                                        </button>
                                                    </Td>
                                                </tr>

                                                {isOpen && (
                                                    <tr className="border-b border-[#f0f0f0] bg-[#fafbfc]">
                                                        <td
                                                            colSpan={6}
                                                            className="px-[14px] py-[16px]"
                                                        >
                                                            <PerformanceDetail
                                                                row={row}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[16px] py-[14px]">
                        <p className="text-[12px] text-[#888888]">
                            Total {meta.total} penilaian
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
| DETAIL (evaluasi, catatan atasan, indikator)
|--------------------------------------------------------------------------
*/

function PerformanceDetail({ row }) {
    // null  = API tidak mengirim relasi items
    // []    = review belum punya indikator
    const items = Array.isArray(row.items) ? row.items : null;

    return (
        <div className="space-y-[16px]">
            <div className="grid gap-[16px] md:grid-cols-2">
                <TextBlock label="Evaluasi" value={row.evaluation} />
                <TextBlock
                    label="Catatan Atasan"
                    value={row.supervisor_notes}
                />
            </div>

            <div>
                <p className="mb-[8px] text-[11px] font-semibold uppercase tracking-[0.3px] text-[#777777]">
                    Indikator Penilaian
                </p>

                {items === null ? (
                    <p className="text-[12px] text-[#999999]">
                        Detail indikator tidak disertakan oleh API.
                    </p>
                ) : items.length === 0 ? (
                    <p className="text-[12px] text-[#999999]">
                        Belum ada indikator penilaian.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-[10px] border border-[#ececec] bg-white">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Indikator</Th>
                                    <Th>Bobot</Th>
                                    <Th>Target</Th>
                                    <Th>Realisasi</Th>
                                    <Th>Skor</Th>
                                    <Th>Catatan</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-[#f0f0f0] last:border-b-0"
                                    >
                                        <Td>
                                            <p className="font-medium text-[#343434]">
                                                {item.indicator || "-"}
                                            </p>
                                        </Td>
                                        <Td>
                                            <span className="tabular-nums">
                                                {formatNumber(item.weight)}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="tabular-nums">
                                                {formatNumber(item.target)}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="tabular-nums">
                                                {formatNumber(item.realization)}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="font-semibold tabular-nums text-[#343434]">
                                                {formatNumber(item.score)}
                                            </span>
                                        </Td>
                                        <Td>{formatText(item.notes)}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
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
                colSpan={6}
                className="px-[16px] py-[40px] text-center text-[13px] text-[#999999]"
            >
                {text}
            </td>
        </tr>
    );
}

function TextBlock({ label, value }) {
    return (
        <div className="rounded-[10px] border border-[#ececec] bg-white p-[14px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3px] text-[#777777]">
                {label}
            </p>
            <p className="mt-[6px] whitespace-pre-wrap text-[12px] leading-[1.6] text-[#555555]">
                {formatText(value)}
            </p>
        </div>
    );
}
