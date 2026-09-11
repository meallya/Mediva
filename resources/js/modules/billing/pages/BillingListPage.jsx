import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCashRegister,
    faFileInvoiceDollar,
    faMagnifyingGlass,
    faPlus,
    faRotate,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import useAuth from "../../auth/hooks/useAuth";
import billingService from "../services/billingService";
import {
    formatCurrency,
    formatDateTime,
    invoiceStatusClass,
    invoiceStatusLabel,
} from "../utils/billingUtils";

export default function BillingListPage() {
    const navigate = useNavigate();
    const { permissions = [] } = useAuth();

    const [invoices, setInvoices] = useState([]);
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

    const [showGenerate, setShowGenerate] = useState(false);
    const [candidateSearch, setCandidateSearch] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [generatingId, setGeneratingId] = useState(null);

    const canCreate = permissions.includes("billing.create");

    const loadInvoices = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await billingService.getInvoices({
                page,
                search: search.trim(),
                status,
                date,
                per_page: 15,
            });

            setInvoices(Array.isArray(response?.data) ? response.data : []);
            setMeta({
                current_page: response?.current_page ?? 1,
                last_page: response?.last_page ?? 1,
                total: response?.total ?? 0,
            });
        } catch (err) {
            setError(err?.message ?? "Gagal memuat billing.");
        } finally {
            setLoading(false);
        }
    };

    const loadCandidates = async () => {
        try {
            setCandidateLoading(true);

            const response = await billingService.getCandidates({
                search: candidateSearch.trim(),
            });

            setCandidates(
                Array.isArray(response?.data) ? response.data : [],
            );
        } catch (err) {
            setError(err?.message ?? "Gagal memuat kunjungan selesai.");
        } finally {
            setCandidateLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadInvoices(1);
        }, 250);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, date]);

    useEffect(() => {
        if (!showGenerate) {
            return;
        }

        const timer = setTimeout(() => {
            loadCandidates();
        }, 250);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showGenerate, candidateSearch]);

    const handleGenerate = async (visitId) => {
        try {
            setGeneratingId(visitId);
            setError("");

            const response = await billingService.generateBilling(visitId);
            const invoice = response?.data;

            if (!invoice?.id) {
                throw new Error("Invoice berhasil dibuat tetapi ID tidak ditemukan.");
            }

            setShowGenerate(false);
            navigate(`/billing/${invoice.id}`);
        } catch (err) {
            setError(err?.message ?? "Gagal membuat billing.");
        } finally {
            setGeneratingId(null);
        }
    };

    const stats = useMemo(() => {
        return {
            unpaid: invoices.filter((item) => item.status === "unpaid").length,
            partial: invoices.filter((item) => item.status === "partial").length,
            paid: invoices.filter((item) => item.status === "paid").length,
        };
    }, [invoices]);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#212121]">
                            Billing & Kasir
                        </h1>
                        <p className="mt-[5px] text-[12px] text-[#626262]">
                            Kelola invoice, pembayaran, dan status tagihan pasien.
                        </p>
                    </div>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() => setShowGenerate(true)}
                            className="inline-flex h-[40px] items-center gap-[8px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white transition hover:bg-[#006fe6]"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Buat Tagihan
                        </button>
                    )}
                </div>

                <div className="mt-[20px] grid grid-cols-1 gap-[12px] md:grid-cols-3">
                    <StatCard label="Belum Bayar di Halaman" value={stats.unpaid} />
                    <StatCard label="Sebagian di Halaman" value={stats.partial} />
                    <StatCard label="Lunas di Halaman" value={stats.paid} />
                </div>

                {error && (
                    <div className="mt-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_190px_180px_auto]">
                        <div className="flex h-[42px] items-center gap-[9px] rounded-[9px] border border-[#dddddd] px-[12px]">
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="text-[13px] text-[#aaaaaa]"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari invoice, pasien, RM, kunjungan..."
                                className="w-full bg-transparent text-[13px] text-[#444444] outline-none"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-[42px] rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#555555] outline-none focus:border-[#7EBDEC]"
                        >
                            <option value="all">Semua Status</option>
                            <option value="unpaid">Belum Bayar</option>
                            <option value="partial">Sebagian</option>
                            <option value="paid">Lunas</option>
                            <option value="cancelled">Dibatalkan</option>
                        </select>

                        <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="h-[42px] rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#555555] outline-none focus:border-[#7EBDEC]"
                        />

                        <button
                            type="button"
                            onClick={() => loadInvoices(meta.current_page)}
                            className="inline-flex h-[42px] items-center justify-center gap-[7px] rounded-[9px] border border-[#dddddd] bg-white px-[14px] text-[12px] font-medium text-[#555555] hover:bg-[#f8f8f8]"
                        >
                            <FontAwesomeIcon icon={faRotate} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="mt-[15px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Invoice</Th>
                                    <Th>Pasien</Th>
                                    <Th>Kunjungan</Th>
                                    <Th>Unit</Th>
                                    <Th>Total</Th>
                                    <Th>Terbayar</Th>
                                    <Th>Sisa</Th>
                                    <Th>Status</Th>
                                    <Th>Tanggal</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-[16px] py-[40px] text-center text-[13px] text-[#999999]">
                                            Memuat billing...
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-[16px] py-[40px] text-center text-[13px] text-[#999999]">
                                            Belum ada data billing.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]">
                                            <Td>
                                                <p className="font-semibold text-[#343434]">
                                                    {invoice.invoice_number}
                                                </p>
                                            </Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {invoice.patient?.name ?? "-"}
                                                </p>
                                                <p className="mt-[2px] text-[11px] text-[#999999]">
                                                    RM {invoice.patient?.medical_record_number ?? "-"}
                                                </p>
                                            </Td>
                                            <Td>{invoice.visit?.visit_number ?? "-"}</Td>
                                            <Td>{invoice.visit?.unit?.name ?? "-"}</Td>
                                            <Td>{formatCurrency(invoice.grand_total)}</Td>
                                            <Td>{formatCurrency(invoice.paid_amount)}</Td>
                                            <Td>{formatCurrency(invoice.balance_due)}</Td>
                                            <Td>
                                                <span className={`inline-flex rounded-full border px-[9px] py-[4px] text-[11px] font-medium ${invoiceStatusClass(invoice.status)}`}>
                                                    {invoiceStatusLabel(invoice.status)}
                                                </span>
                                            </Td>
                                            <Td>{formatDateTime(invoice.generated_at)}</Td>
                                            <Td>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/billing/${invoice.id}`)}
                                                    className="rounded-[8px] border border-[#C2E1F4] bg-white px-[11px] py-[7px] text-[11px] font-medium text-[#047AF7] hover:bg-[#f4f9ff]"
                                                >
                                                    Detail
                                                </button>
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[16px] py-[14px]">
                        <p className="text-[12px] text-[#888888]">
                            Total {meta.total} invoice
                        </p>
                        <div className="flex items-center gap-[8px]">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1 || loading}
                                onClick={() => loadInvoices(meta.current_page - 1)}
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
                                onClick={() => loadInvoices(meta.current_page + 1)}
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:opacity-40"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showGenerate && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-[20px] backdrop-blur-[1px]">
                    <div className="w-full max-w-[760px] overflow-hidden rounded-[15px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                        <div className="flex items-center justify-between border-b border-[#eeeeee] px-[22px] py-[17px]">
                            <div>
                                <h2 className="text-[16px] font-semibold text-[#212121]">
                                    Buat Tagihan dari Kunjungan
                                </h2>
                                <p className="mt-[3px] text-[12px] text-[#8f8f8f]">
                                    Hanya kunjungan selesai yang belum memiliki invoice.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGenerate(false)}
                                className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#999999] hover:bg-[#f5f5f5]"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="p-[20px]">
                            <div className="flex h-[42px] items-center gap-[9px] rounded-[9px] border border-[#dddddd] px-[12px]">
                                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#aaaaaa]" />
                                <input
                                    value={candidateSearch}
                                    onChange={(event) => setCandidateSearch(event.target.value)}
                                    placeholder="Cari pasien, RM, atau nomor kunjungan..."
                                    className="w-full bg-transparent text-[13px] outline-none"
                                />
                            </div>

                            <div className="mt-[14px] max-h-[420px] overflow-y-auto rounded-[12px] border border-[#eeeeee]">
                                {candidateLoading ? (
                                    <div className="p-[30px] text-center text-[13px] text-[#999999]">
                                        Memuat kunjungan...
                                    </div>
                                ) : candidates.length === 0 ? (
                                    <div className="p-[30px] text-center text-[13px] text-[#999999]">
                                        Tidak ada kunjungan yang siap dibuatkan billing.
                                    </div>
                                ) : (
                                    candidates.map((visit) => (
                                        <div key={visit.id} className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[#eeeeee] px-[15px] py-[13px] last:border-b-0">
                                            <div>
                                                <p className="text-[13px] font-semibold text-[#343434]">
                                                    {visit.patient?.name ?? "-"}
                                                </p>
                                                <p className="mt-[3px] text-[11px] text-[#888888]">
                                                    {visit.visit_number} • RM {visit.patient?.medical_record_number ?? "-"} • {visit.unit?.name ?? "-"}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={generatingId === visit.id}
                                                onClick={() => handleGenerate(visit.id)}
                                                className="inline-flex h-[36px] items-center gap-[7px] rounded-[8px] bg-[#047AF7] px-[12px] text-[11px] font-medium text-white disabled:opacity-50"
                                            >
                                                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                                                {generatingId === visit.id ? "Membuat..." : "Generate"}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[16px]">
            <div className="flex items-center gap-[10px]">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#047AF7]/10 text-[#047AF7]">
                    <FontAwesomeIcon icon={faCashRegister} />
                </div>
                <div>
                    <p className="text-[12px] text-[#888888]">{label}</p>
                    <p className="mt-[2px] text-[20px] font-semibold text-[#212121]">
                        {value}
                    </p>
                </div>
            </div>
        </div>
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
