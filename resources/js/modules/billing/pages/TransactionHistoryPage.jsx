import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faReceipt,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import billingService from "../services/billingService";
import {
    formatCurrency,
    formatDateTime,
} from "../utils/billingUtils";

export default function TransactionHistoryPage() {
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await billingService.getTransactions({
                page,
                search: search.trim(),
                status,
                date,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta({
                current_page: response?.current_page ?? 1,
                last_page: response?.last_page ?? 1,
                total: response?.total ?? 0,
            });
        } catch (err) {
            setError(err?.message ?? "Gagal memuat transaksi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1), 250);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, date]);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <button
                    type="button"
                    onClick={() => navigate("/billing")}
                    className="mb-[10px] inline-flex items-center gap-[7px] text-[12px] font-medium text-[#047AF7]"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Kembali ke Billing
                </button>

                <div className="flex items-start gap-[12px]">
                    <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-[#047AF7]/10 text-[#047AF7]">
                        <FontAwesomeIcon icon={faReceipt} />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#212121]">
                            Riwayat Transaksi
                        </h1>
                        <p className="mt-[5px] text-[12px] text-[#626262]">
                            Seluruh pembayaran dan void billing MEDIVA.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_180px_180px]">
                        <div className="flex h-[42px] items-center gap-[9px] rounded-[9px] border border-[#dddddd] px-[12px]">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#aaaaaa]" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari pembayaran, invoice, pasien, referensi..."
                                className="w-full bg-transparent text-[13px] outline-none"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-[42px] rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#555555] outline-none"
                        >
                            <option value="all">Semua Status</option>
                            <option value="posted">Posted</option>
                            <option value="void">Void</option>
                        </select>

                        <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="h-[42px] rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#555555] outline-none"
                        />
                    </div>
                </div>

                <div className="mt-[15px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Pembayaran</Th>
                                    <Th>Invoice</Th>
                                    <Th>Pasien</Th>
                                    <Th>Metode</Th>
                                    <Th>Jumlah</Th>
                                    <Th>Referensi</Th>
                                    <Th>Waktu</Th>
                                    <Th>Status</Th>
                                    <Th>Petugas</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-[16px] py-[35px] text-center text-[13px] text-[#999999]">
                                            Memuat transaksi...
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-[16px] py-[35px] text-center text-[13px] text-[#999999]">
                                            Belum ada transaksi.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((payment) => (
                                        <tr key={payment.id} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]">
                                            <Td>{payment.payment_number}</Td>
                                            <Td>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/billing/${payment.invoice_id}`)}
                                                    className="font-medium text-[#047AF7]"
                                                >
                                                    {payment.invoice?.invoice_number ?? "-"}
                                                </button>
                                            </Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {payment.invoice?.patient?.name ?? "-"}
                                                </p>
                                                <p className="mt-[2px] text-[10px] text-[#999999]">
                                                    RM {payment.invoice?.patient?.medical_record_number ?? "-"}
                                                </p>
                                            </Td>
                                            <Td>{payment.payment_method?.name ?? "-"}</Td>
                                            <Td>{formatCurrency(payment.amount)}</Td>
                                            <Td>{payment.reference_number ?? "-"}</Td>
                                            <Td>{formatDateTime(payment.paid_at)}</Td>
                                            <Td>
                                                <span className={`inline-flex rounded-full border px-[8px] py-[4px] text-[10px] font-medium ${payment.status === "posted" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                                    {payment.status === "posted" ? "Posted" : "Void"}
                                                </span>
                                            </Td>
                                            <Td>{payment.creator?.name ?? "-"}</Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[16px] py-[14px]">
                        <p className="text-[12px] text-[#888888]">
                            Total {meta.total} transaksi
                        </p>
                        <div className="flex items-center gap-[8px]">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1 || loading}
                                onClick={() => load(meta.current_page - 1)}
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-[12px] text-[#666666]">
                                {meta.current_page} / {meta.last_page}
                            </span>
                            <button
                                type="button"
                                disabled={meta.current_page >= meta.last_page || loading}
                                onClick={() => load(meta.current_page + 1)}
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

function Th({ children }) {
    return (
        <th className="px-[14px] py-[12px] text-left text-[11px] font-semibold uppercase tracking-[0.3px] text-[#777777]">
            {children}
        </th>
    );
}

function Td({ children }) {
    return (
        <td className="px-[14px] py-[13px] text-[12px] text-[#555555]">
            {children}
        </td>
    );
}
