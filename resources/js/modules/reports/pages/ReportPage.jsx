import React, { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowTrendUp,
    faCalendarDay,
    faCalendarDays,
    faChartColumn,
    faCoins,
    faDownload,
    faFileInvoiceDollar,
    faFilter,
    faPills,
    faPrint,
    faSpinner,
    faTriangleExclamation,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import reportService from "../services/reportService";

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function currentMonth() {
    const date = new Date();

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1,
    ).padStart(2, "0")}`;
}

function startOfCurrentMonth() {
    const date = new Date();

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1,
    ).padStart(2, "0")}-01`;
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function ReportPage() {
    const [mode, setMode] = useState("monthly");

    const [date, setDate] = useState(localDate());
    const [month, setMonth] = useState(currentMonth());

    const [startDate, setStartDate] = useState(
        startOfCurrentMonth(),
    );

    const [endDate, setEndDate] = useState(localDate());

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

    const loadReport = async () => {
        try {
            setLoading(true);
            setError("");

            let response;

            if (mode === "daily") {
                response = await reportService.getDaily(date);
            } else if (mode === "monthly") {
                response = await reportService.getMonthly(month);
            } else {
                response = await reportService.getOverview({
                    start_date: startDate,
                    end_date: endDate,
                });
            }

            setReport(response?.data ?? response ?? null);
        } catch (error) {
            console.error("Load report:", error);

            setError(
                error?.data?.message ??
                    error?.message ??
                    "Gagal memuat laporan.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, [mode]);

    /*
    |--------------------------------------------------------------------------
    | EXPORT RANGE
    |--------------------------------------------------------------------------
    */

    const exportRange = useMemo(() => {
        if (mode === "daily") {
            return {
                start_date: date,
                end_date: date,
            };
        }

        if (mode === "monthly") {
            const [year, monthNumber] = month
                .split("-")
                .map(Number);

            const lastDay = new Date(
                year,
                monthNumber,
                0,
            ).getDate();

            return {
                start_date: `${month}-01`,
                end_date: `${month}-${String(lastDay).padStart(2, "0")}`,
            };
        }

        return {
            start_date: startDate,
            end_date: endDate,
        };
    }, [mode, date, month, startDate, endDate]);

    const metrics = report?.management_metrics ?? {};
    const visits = report?.visit_statistics ?? {};
    const revenue = report?.revenue ?? {};
    const pharmacy = report?.pharmacy_statistics ?? {};

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px] print:bg-white print:p-0">
                {/* HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-[16px] print:hidden">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#212121]">
                            Laporan MEDIVA
                        </h1>

                        <p className="mt-[5px] text-[12px] text-[#626262]">
                            Statistik kunjungan, pendapatan, farmasi, dan metrik manajemen.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-[8px]">
                        <button
                            type="button"
                            onClick={() =>
                                reportService.exportCsv(exportRange)
                            }
                            className="inline-flex h-[40px] items-center gap-[7px] rounded-[9px] border border-[#C2E1F4] bg-white px-[14px] text-[13px] font-medium text-[#047AF7]"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            Export CSV
                        </button>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white"
                        >
                            <FontAwesomeIcon icon={faPrint} />
                            Cetak / PDF
                        </button>
                    </div>
                </div>

                {/* PRINT HEADER */}

                <div className="hidden print:block">
                    <h1 className="text-[22px] font-semibold text-[#212121]">
                        MEDIVA — Laporan Manajemen
                    </h1>

                    <p className="mt-[4px] text-[12px] text-[#626262]">
                        Periode {report?.period?.start_date ?? "-"} s/d {report?.period?.end_date ?? "-"}
                    </p>
                </div>

                {/* MODE */}

                <section className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[18px] print:hidden">
                    <div className="flex items-center gap-[9px]">
                        <FontAwesomeIcon
                            icon={faFilter}
                            className="text-[13px] text-[#047AF7]"
                        />

                        <h2 className="text-[15px] font-semibold text-[#212121]">
                            Filter Laporan
                        </h2>
                    </div>

                    <div className="mt-[14px] flex flex-wrap gap-[8px]">
                        <ModeButton
                            active={mode === "daily"}
                            icon={faCalendarDay}
                            label="Harian"
                            onClick={() => setMode("daily")}
                        />

                        <ModeButton
                            active={mode === "monthly"}
                            icon={faCalendarDays}
                            label="Bulanan"
                            onClick={() => setMode("monthly")}
                        />

                        <ModeButton
                            active={mode === "custom"}
                            icon={faFilter}
                            label="Rentang Tanggal"
                            onClick={() => setMode("custom")}
                        />
                    </div>

                    <div className="mt-[14px] flex flex-wrap items-end gap-[10px]">
                        {mode === "daily" && (
                            <Field label="Tanggal">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(event) =>
                                        setDate(event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        )}

                        {mode === "monthly" && (
                            <Field label="Bulan">
                                <input
                                    type="month"
                                    value={month}
                                    onChange={(event) =>
                                        setMonth(event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        )}

                        {mode === "custom" && (
                            <>
                                <Field label="Tanggal Awal">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(event) =>
                                            setStartDate(event.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Tanggal Akhir">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(event) =>
                                            setEndDate(event.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </Field>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={loadReport}
                            disabled={loading}
                            className="inline-flex h-[42px] items-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white disabled:opacity-50"
                        >
                            <FontAwesomeIcon
                                icon={loading ? faSpinner : faFilter}
                                spin={loading}
                            />

                            Terapkan
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                {loading && !report ? (
                    <div className="flex min-h-[380px] items-center justify-center">
                        <div className="text-center">
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="text-[24px] text-[#047AF7]"
                            />

                            <p className="mt-[9px] text-[12px] text-[#B4B4B4]">
                                Memuat laporan...
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* PERIOD */}

                        <div className="mt-[18px] text-[12px] text-[#626262]">
                            Periode: <span className="font-semibold text-[#212121]">{report?.period?.start_date ?? "-"}</span> s/d <span className="font-semibold text-[#212121]">{report?.period?.end_date ?? "-"}</span>
                        </div>

                        {/* MANAGEMENT METRICS */}

                        <section className="mt-[14px]">
                            <SectionTitle
                                title="Management Metrics"
                                subtitle="Ringkasan indikator utama operasional rumah sakit."
                            />

                            <div className="mt-[12px] grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-4">
                                <MetricCard
                                    icon={faUserGroup}
                                    label="Total Kunjungan"
                                    value={formatStock(metrics.total_visits)}
                                />

                                <MetricCard
                                    icon={faChartColumn}
                                    label="Completion Rate"
                                    value={`${Number(metrics.completion_rate ?? 0).toLocaleString("id-ID")} %`}
                                />

                                <MetricCard
                                    icon={faCoins}
                                    label="Pendapatan"
                                    value={formatMoney(metrics.total_revenue)}
                                />

                                <MetricCard
                                    icon={faFileInvoiceDollar}
                                    label="Sisa Piutang"
                                    value={formatMoney(metrics.outstanding)}
                                />

                                <MetricCard
                                    icon={faUserGroup}
                                    label="Pasien Unik"
                                    value={formatStock(metrics.unique_patients)}
                                />

                                <MetricCard
                                    icon={faPills}
                                    label="Resep Diserahkan"
                                    value={formatStock(metrics.dispensed_prescriptions)}
                                />

                                <MetricCard
                                    icon={faTriangleExclamation}
                                    label="Stok Minimum"
                                    value={formatStock(metrics.low_stock_count)}
                                />

                                <MetricCard
                                    icon={faArrowTrendUp}
                                    label="Rata-rata Pendapatan / Visit"
                                    value={formatMoney(metrics.average_revenue_per_visit)}
                                />
                            </div>
                        </section>

                        {/* CHARTS */}

                        <div className="mt-[20px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                            <Card
                                title="Tren Kunjungan"
                                subtitle="Jumlah kunjungan berdasarkan tanggal."
                            >
                                <SimpleLineChart
                                    rows={visits.daily ?? []}
                                    valueKey="total"
                                    formatter={formatStock}
                                />
                            </Card>

                            <Card
                                title="Tren Pendapatan"
                                subtitle="Pembayaran posted berdasarkan tanggal bayar."
                            >
                                <SimpleLineChart
                                    rows={revenue.daily ?? []}
                                    valueKey="total"
                                    formatter={formatMoney}
                                />
                            </Card>
                        </div>

                        {/* VISIT STATISTICS */}

                        <div className="mt-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                            <Card
                                title="Visit Statistics — Per Unit"
                                subtitle="Distribusi kunjungan pasien per unit / poli."
                            >
                                <SimpleBarChart
                                    rows={visits.by_unit ?? []}
                                    formatter={formatStock}
                                />
                            </Card>

                            <Card
                                title="Visit Statistics — Jenis Kunjungan"
                                subtitle="Distribusi berdasarkan jenis kunjungan."
                            >
                                <SimpleBarChart
                                    rows={(visits.by_visit_type ?? []).map(
                                        (row) => ({
                                            ...row,
                                            label: visitTypeLabel(row.label),
                                        }),
                                    )}
                                    formatter={formatStock}
                                />
                            </Card>
                        </div>

                        {/* REVENUE */}

                        <div className="mt-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                            <Card
                                title="Revenue — Metode Pembayaran"
                                subtitle="Pendapatan aktual dari pembayaran berstatus posted."
                            >
                                <SimpleBarChart
                                    rows={revenue.by_payment_method ?? []}
                                    formatter={formatMoney}
                                />
                            </Card>

                            <Card
                                title="Billing — Kategori Layanan"
                                subtitle="Nilai tagihan berdasarkan kategori invoice item."
                            >
                                <SimpleBarChart
                                    rows={(revenue.by_category ?? []).map(
                                        (row) => ({
                                            ...row,
                                            label: categoryLabel(row.label),
                                        }),
                                    )}
                                    formatter={formatMoney}
                                />
                            </Card>
                        </div>

                        {/* PHARMACY */}

                        <div className="mt-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                            <Card
                                title="Pharmacy Statistics"
                                subtitle="Ringkasan resep dan aktivitas persediaan."
                            >
                                <div className="grid grid-cols-2 gap-[10px] lg:grid-cols-3">
                                    <MiniStat label="Submitted" value={pharmacy.submitted} />
                                    <MiniStat label="Processing" value={pharmacy.processing} />
                                    <MiniStat label="Ready" value={pharmacy.ready} />
                                    <MiniStat label="Dispensed" value={pharmacy.dispensed_in_period} />
                                    <MiniStat label="Cancelled" value={pharmacy.cancelled} />
                                    <MiniStat label="Stock Opname" value={pharmacy.stock_opname_count} />
                                    <MiniStat label="Stock Masuk" value={pharmacy.stock_received} />
                                    <MiniStat label="Stock Keluar" value={pharmacy.stock_dispensed} />
                                    <MiniStat label="Hampir Expired" value={pharmacy.near_expiry_batches} />
                                </div>
                            </Card>

                            <Card
                                title="Obat Terbanyak Diserahkan"
                                subtitle="Berdasarkan stock movement dispense pada periode laporan."
                            >
                                <SimpleBarChart
                                    rows={pharmacy.top_dispensed_medicines ?? []}
                                    formatter={formatStock}
                                />
                            </Card>
                        </div>

                        {/* LOW STOCK */}

                        <Card
                            className="mt-[18px]"
                            title="Stock Minimum"
                            subtitle="Obat yang stock tersedia sudah menyentuh atau di bawah minimum."
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <Th>Kode</Th>
                                            <Th>Obat</Th>
                                            <Th>Stock</Th>
                                            <Th>Minimum</Th>
                                            <Th>Satuan</Th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(pharmacy.low_stock_items ?? []).length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-[26px] text-center text-[12px] text-[#B4B4B4]"
                                                >
                                                    Tidak ada obat di bawah minimum.
                                                </td>
                                            </tr>
                                        ) : (
                                            pharmacy.low_stock_items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-[#f1f1f1]"
                                                >
                                                    <Td>{item.code}</Td>
                                                    <Td>{item.name}</Td>
                                                    <Td>{formatStock(item.stock)}</Td>
                                                    <Td>{formatStock(item.minimum_stock)}</Td>
                                                    <Td>{item.unit ?? "-"}</Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| UI
|--------------------------------------------------------------------------
*/

const inputClass =
    "h-[42px] rounded-[9px] border border-[#e5e5e5] bg-white px-[12px] text-[13px] text-[#212121] outline-none focus:border-[#7EBDEC]";

function ModeButton({ active, icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-[38px] items-center gap-[7px] rounded-[9px] px-[13px] text-[12px] font-medium transition ${
                active
                    ? "bg-[#047AF7] text-white"
                    : "border border-[#e5e5e5] bg-white text-[#626262] hover:bg-[#fafbfc]"
            }`}
        >
            <FontAwesomeIcon icon={icon} />
            {label}
        </button>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#626262]">
                {label}
            </label>
            {children}
        </div>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <div>
            <h2 className="text-[18px] font-semibold text-[#212121]">
                {title}
            </h2>
            <p className="mt-[3px] text-[12px] text-[#626262]">
                {subtitle}
            </p>
        </div>
    );
}

function MetricCard({ icon, label, value }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[17px]">
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[9px] bg-[#eaf4ff] text-[#047AF7]">
                <FontAwesomeIcon icon={icon} className="text-[13px]" />
            </div>

            <p className="mt-[14px] text-[20px] font-semibold text-[#212121]">
                {value}
            </p>

            <p className="mt-[3px] text-[11px] text-[#626262]">
                {label}
            </p>
        </div>
    );
}

function Card({ title, subtitle, children, className = "" }) {
    return (
        <section
            className={`${className} overflow-hidden rounded-[14px] border border-[#ececec] bg-white`}
        >
            <div className="border-b border-[#eeeeee] px-[18px] py-[15px]">
                <h2 className="text-[15px] font-semibold text-[#212121]">
                    {title}
                </h2>

                {subtitle && (
                    <p className="mt-[3px] text-[11px] text-[#626262]">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="p-[18px]">{children}</div>
        </section>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="rounded-[10px] bg-[#fafbfc] px-[12px] py-[11px]">
            <p className="text-[17px] font-semibold text-[#212121]">
                {formatStock(value)}
            </p>
            <p className="mt-[2px] text-[10px] text-[#626262]">
                {label}
            </p>
        </div>
    );
}

function SimpleBarChart({ rows = [], formatter }) {
    const max = Math.max(
        1,
        ...rows.map((row) => Number(row.total ?? 0)),
    );

    if (rows.length === 0) {
        return (
            <p className="py-[30px] text-center text-[12px] text-[#B4B4B4]">
                Belum ada data pada periode ini.
            </p>
        );
    }

    return (
        <div className="space-y-[10px]">
            {rows.slice(0, 12).map((row) => {
                const value = Number(row.total ?? 0);
                const width = Math.max(2, (value / max) * 100);

                return (
                    <div key={`${row.label}-${value}`}>
                        <div className="mb-[4px] flex items-center justify-between gap-[12px]">
                            <p className="min-w-0 truncate text-[12px] text-[#626262]">
                                {row.label ?? "-"}
                            </p>
                            <p className="shrink-0 text-[12px] font-semibold text-[#212121]">
                                {formatter(value)}
                            </p>
                        </div>

                        <div className="h-[8px] overflow-hidden rounded-full bg-[#f1f1f1]">
                            <div
                                className="h-full rounded-full bg-[#7EBDEC]"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SimpleLineChart({ rows = [], valueKey, formatter }) {
    const values = rows.map((row) => Number(row[valueKey] ?? 0));
    const max = Math.max(1, ...values);
    const width = 600;
    const height = 180;
    const padding = 16;

    if (rows.length === 0) {
        return (
            <p className="py-[30px] text-center text-[12px] text-[#B4B4B4]">
                Belum ada data pada periode ini.
            </p>
        );
    }

    const points = values
        .map((value, index) => {
            const x =
                rows.length === 1
                    ? width / 2
                    : padding +
                      (index / (rows.length - 1)) *
                          (width - padding * 2);

            const y =
                height -
                padding -
                (value / max) * (height - padding * 2);

            return `${x},${y}`;
        })
        .join(" ");

    const total = values.reduce((sum, value) => sum + value, 0);

    return (
        <div>
            <div className="mb-[10px] flex items-end justify-between gap-[12px]">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3px] text-[#B4B4B4]">
                        Total Periode
                    </p>
                    <p className="mt-[2px] text-[18px] font-semibold text-[#212121]">
                        {formatter(total)}
                    </p>
                </div>

                <p className="text-[10px] text-[#B4B4B4]">
                    {rows[0]?.date ?? "-"} — {rows.at(-1)?.date ?? "-"}
                </p>
            </div>

            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-[180px] min-w-[520px] w-full"
                    role="img"
                    aria-label="Grafik laporan"
                >
                    <line
                        x1={padding}
                        y1={height - padding}
                        x2={width - padding}
                        y2={height - padding}
                        stroke="#eeeeee"
                        strokeWidth="1"
                    />

                    <polyline
                        points={points}
                        fill="none"
                        stroke="#047AF7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {values.map((value, index) => {
                        const [x, y] = points
                            .split(" ")[index]
                            .split(",")
                            .map(Number);

                        return (
                            <circle
                                key={`${rows[index]?.date}-${index}`}
                                cx={x}
                                cy={y}
                                r="3.5"
                                fill="#047AF7"
                            >
                                <title>
                                    {rows[index]?.date}: {formatter(value)}
                                </title>
                            </circle>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

function Th({ children }) {
    return (
        <th className="whitespace-nowrap bg-[#fafbfc] px-[12px] py-[10px] text-left text-[11px] font-semibold text-[#626262]">
            {children}
        </th>
    );
}

function Td({ children }) {
    return (
        <td className="whitespace-nowrap px-[12px] py-[11px] text-[12px] text-[#626262]">
            {children}
        </td>
    );
}

/*
|--------------------------------------------------------------------------
| FORMATTERS
|--------------------------------------------------------------------------
*/

function formatStock(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return "0";
    }

    return Math.round(number).toLocaleString("id-ID");
}

function formatMoney(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return "Rp 0,00";
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
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

function categoryLabel(value) {
    const labels = {
        registration: "Pendaftaran",
        doctor_service: "Jasa Dokter",
        procedure: "Tindakan",
        medicine: "Obat",
        other_service: "Biaya Lain",
        laboratory: "Laboratorium",
        radiology: "Radiologi",
    };

    return labels[value] ?? value ?? "-";
}
