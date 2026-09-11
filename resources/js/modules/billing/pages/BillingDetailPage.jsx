import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faBan,
    faCreditCard,
    faFileInvoice,
    faFloppyDisk,
    faMoneyBillTransfer,
    faPen,
    faPlus,
    faPrint,
    faRotate,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import useAuth from "../../auth/hooks/useAuth";
import billingService from "../services/billingService";
import {
    categoryLabel,
    escapeHtml,
    formatCurrency,
    formatDateTime,
    formatQuantity,
    invoiceStatusClass,
    invoiceStatusLabel,
    openPrintWindow,
} from "../utils/billingUtils";

const emptyItem = {
    code: "",
    description: "",
    quantity: "1",
    unit_price: "",
};

const emptyPayment = {
    payment_method_id: "",
    amount: "",
    reference_number: "",
    notes: "",
};

export default function BillingDetailPage() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const { permissions = [] } = useAuth();

    const [invoice, setInvoice] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemForm, setItemForm] = useState(emptyItem);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState(emptyPayment);

    const canCreate = permissions.includes("billing.create");
    const canUpdate = permissions.includes("billing.update");
    const canCancel = permissions.includes("billing.cancel");
    const canPayment = permissions.includes("billing.payment");
    const canReceipt = permissions.includes("billing.receipt");

    const hasPostedPayments = useMemo(
        () =>
            (invoice?.payments ?? []).some(
                (payment) => payment.status === "posted",
            ),
        [invoice],
    );

    const loadInvoice = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await billingService.getInvoice(invoiceId);
            setInvoice(response?.data ?? null);
        } catch (err) {
            setError(err?.message ?? "Gagal memuat detail billing.");
        } finally {
            setLoading(false);
        }
    };

    const loadPaymentMethods = async () => {
        if (!canPayment) {
            return;
        }

        try {
            const response = await billingService.getPaymentMethods();
            setPaymentMethods(
                Array.isArray(response?.data) ? response.data : [],
            );
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadInvoice();
        loadPaymentMethods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const flashSuccess = (message) => {
        setSuccess(message);
        window.setTimeout(() => setSuccess(""), 3000);
    };

    const handleSync = async () => {
        if (!invoice?.visit_id) {
            return;
        }

        try {
            setBusy(true);
            setError("");

            const response = await billingService.generateBilling(
                invoice.visit_id,
            );

            setInvoice(response?.data ?? invoice);
            flashSuccess("Tagihan berhasil disinkronkan.");
        } catch (err) {
            setError(err?.message ?? "Gagal menyinkronkan tagihan.");
        } finally {
            setBusy(false);
        }
    };

    const openAddItem = () => {
        setEditingItem(null);
        setItemForm(emptyItem);
        setShowItemModal(true);
    };

    const openEditItem = (item) => {
        setEditingItem(item);
        setItemForm({
            code: item.code ?? "",
            description: item.description ?? "",
            quantity: String(Number(item.quantity ?? 1)),
            unit_price: String(Number(item.unit_price ?? 0)),
        });
        setShowItemModal(true);
    };

    const saveItem = async (event) => {
        event.preventDefault();

        try {
            setBusy(true);
            setError("");

            const payload = {
                code: itemForm.code.trim() || null,
                description: itemForm.description.trim(),
                quantity: Number(itemForm.quantity),
                unit_price: Number(itemForm.unit_price),
            };

            if (editingItem) {
                await billingService.updateItem(
                    invoice.id,
                    editingItem.id,
                    payload,
                );
            } else {
                await billingService.addItem(invoice.id, payload);
            }

            setShowItemModal(false);
            await loadInvoice();
            flashSuccess(
                editingItem
                    ? "Biaya lain berhasil diubah."
                    : "Biaya lain berhasil ditambahkan.",
            );
        } catch (err) {
            setError(err?.message ?? "Gagal menyimpan item billing.");
        } finally {
            setBusy(false);
        }
    };

    const deleteItem = async (item) => {
        if (!window.confirm(`Hapus biaya "${item.description}"?`)) {
            return;
        }

        try {
            setBusy(true);
            setError("");
            await billingService.deleteItem(invoice.id, item.id);
            await loadInvoice();
            flashSuccess("Item billing berhasil dihapus.");
        } catch (err) {
            setError(err?.message ?? "Gagal menghapus item billing.");
        } finally {
            setBusy(false);
        }
    };

    const openPayment = () => {
        setPaymentForm({
            ...emptyPayment,
            amount: String(Number(invoice?.balance_due ?? 0)),
            payment_method_id: paymentMethods[0]?.id
                ? String(paymentMethods[0].id)
                : "",
        });
        setShowPaymentModal(true);
    };

    const savePayment = async (event) => {
        event.preventDefault();

        try {
            setBusy(true);
            setError("");

            await billingService.createPayment(invoice.id, {
                payment_method_id: Number(paymentForm.payment_method_id),
                amount: Number(paymentForm.amount),
                reference_number:
                    paymentForm.reference_number.trim() || null,
                notes: paymentForm.notes.trim() || null,
            });

            setShowPaymentModal(false);
            await loadInvoice();
            flashSuccess("Pembayaran berhasil dicatat.");
        } catch (err) {
            setError(err?.message ?? "Gagal mencatat pembayaran.");
        } finally {
            setBusy(false);
        }
    };

    const voidPayment = async (payment) => {
        const reason = window.prompt(
            `Alasan void pembayaran ${payment.payment_number}:`,
        );

        if (!reason?.trim()) {
            return;
        }

        try {
            setBusy(true);
            setError("");

            await billingService.voidPayment(invoice.id, payment.id, {
                reason: reason.trim(),
            });

            await loadInvoice();
            flashSuccess("Pembayaran berhasil di-void.");
        } catch (err) {
            setError(err?.message ?? "Gagal void pembayaran.");
        } finally {
            setBusy(false);
        }
    };

    const cancelInvoice = async () => {
        const reason = window.prompt("Alasan pembatalan invoice:");

        if (!reason?.trim()) {
            return;
        }

        try {
            setBusy(true);
            setError("");

            const response = await billingService.cancelInvoice(invoice.id, {
                reason: reason.trim(),
            });

            setInvoice(response?.data ?? invoice);
            flashSuccess("Invoice berhasil dibatalkan.");
        } catch (err) {
            setError(err?.message ?? "Gagal membatalkan invoice.");
        } finally {
            setBusy(false);
        }
    };

    const printInvoice = () => {
        const itemRows = (invoice?.items ?? [])
            .map(
                (item) => `
                    <tr>
                        <td>${escapeHtml(categoryLabel(item.category))}</td>
                        <td>${escapeHtml(item.code ?? "-")}</td>
                        <td>${escapeHtml(item.description)}</td>
                        <td class="right">${escapeHtml(formatQuantity(item.quantity))}</td>
                        <td class="right">${escapeHtml(formatCurrency(item.unit_price))}</td>
                        <td class="right">${escapeHtml(formatCurrency(item.total))}</td>
                    </tr>
                `,
            )
            .join("");

        openPrintWindow(
            invoice.invoice_number,
            `
                <h1>MEDIVA — Invoice</h1>
                <p class="muted">${escapeHtml(invoice.invoice_number)}</p>
                <div class="box">
                    <div class="row"><span>Pasien</span><strong>${escapeHtml(invoice.patient?.name ?? "-")}</strong></div>
                    <div class="row"><span>No. RM</span><strong>${escapeHtml(invoice.patient?.medical_record_number ?? "-")}</strong></div>
                    <div class="row"><span>Kunjungan</span><strong>${escapeHtml(invoice.visit?.visit_number ?? "-")}</strong></div>
                    <div class="row"><span>Unit</span><strong>${escapeHtml(invoice.visit?.unit?.name ?? "-")}</strong></div>
                    <div class="row"><span>Status</span><strong>${escapeHtml(invoiceStatusLabel(invoice.status))}</strong></div>
                </div>
                <h2>Rincian Tagihan</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Kategori</th><th>Kode</th><th>Deskripsi</th>
                            <th class="right">Qty</th><th class="right">Harga</th><th class="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>
                <div class="box">
                    <div class="row"><span>Subtotal</span><strong>${escapeHtml(formatCurrency(invoice.subtotal))}</strong></div>
                    <div class="row"><span>Total Tagihan</span><strong>${escapeHtml(formatCurrency(invoice.grand_total))}</strong></div>
                    <div class="row"><span>Terbayar</span><strong>${escapeHtml(formatCurrency(invoice.paid_amount))}</strong></div>
                    <div class="row total"><span>Sisa</span><strong>${escapeHtml(formatCurrency(invoice.balance_due))}</strong></div>
                </div>
            `,
        );
    };

    const printReceipt = (payment) => {
        openPrintWindow(
            payment.payment_number,
            `
                <h1>MEDIVA — Receipt</h1>
                <p class="muted">${escapeHtml(payment.payment_number)}</p>
                <div class="box">
                    <div class="row"><span>Invoice</span><strong>${escapeHtml(invoice.invoice_number)}</strong></div>
                    <div class="row"><span>Pasien</span><strong>${escapeHtml(invoice.patient?.name ?? "-")}</strong></div>
                    <div class="row"><span>No. RM</span><strong>${escapeHtml(invoice.patient?.medical_record_number ?? "-")}</strong></div>
                    <div class="row"><span>Metode</span><strong>${escapeHtml(payment.payment_method?.name ?? "-")}</strong></div>
                    <div class="row"><span>Referensi</span><strong>${escapeHtml(payment.reference_number ?? "-")}</strong></div>
                    <div class="row"><span>Waktu</span><strong>${escapeHtml(formatDateTime(payment.paid_at))}</strong></div>
                </div>
                <div class="box">
                    <div class="row total"><span>Jumlah Dibayar</span><strong>${escapeHtml(formatCurrency(payment.amount))}</strong></div>
                </div>
            `,
        );
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px] text-[13px] text-[#888888]">
                    Memuat detail billing...
                </div>
            </DashboardLayout>
        );
    }

    if (!invoice) {
        return (
            <DashboardLayout>
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                    <div className="rounded-[12px] border border-red-200 bg-red-50 p-[14px] text-[13px] text-red-700">
                        {error || "Invoice tidak ditemukan."}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate("/billing")}
                            className="mb-[10px] inline-flex items-center gap-[7px] text-[12px] font-medium text-[#047AF7]"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Kembali ke Billing
                        </button>
                        <h1 className="text-[24px] font-semibold text-[#212121]">
                            Detail Invoice
                        </h1>
                        <p className="mt-[5px] text-[12px] text-[#626262]">
                            {invoice.invoice_number}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-[8px]">
                        {canReceipt && (
                            <button
                                type="button"
                                onClick={printInvoice}
                                className="inline-flex h-[40px] items-center gap-[7px] rounded-[9px] border border-[#dddddd] bg-white px-[13px] text-[12px] font-medium text-[#555555] hover:bg-[#f8f8f8]"
                            >
                                <FontAwesomeIcon icon={faPrint} />
                                Cetak Invoice
                            </button>
                        )}

                        {canCreate &&
                            invoice.status !== "cancelled" &&
                            !hasPostedPayments && (
                                <button
                                    type="button"
                                    onClick={handleSync}
                                    disabled={busy}
                                    className="inline-flex h-[40px] items-center gap-[7px] rounded-[9px] border border-[#C2E1F4] bg-white px-[13px] text-[12px] font-medium text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                >
                                    <FontAwesomeIcon icon={faRotate} />
                                    Sinkronkan Tagihan
                                </button>
                            )}
                    </div>
                </div>

                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-[16px] rounded-[10px] border border-emerald-200 bg-emerald-50 px-[14px] py-[12px] text-[13px] text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="mt-[20px] grid grid-cols-1 gap-[15px] xl:grid-cols-3">
                    <InfoCard title="Pasien">
                        <InfoRow label="Nama" value={invoice.patient?.name} />
                        <InfoRow
                            label="No. RM"
                            value={invoice.patient?.medical_record_number}
                        />
                    </InfoCard>

                    <InfoCard title="Kunjungan">
                        <InfoRow
                            label="Nomor"
                            value={invoice.visit?.visit_number}
                        />
                        <InfoRow
                            label="Unit"
                            value={invoice.visit?.unit?.name}
                        />
                        <InfoRow
                            label="Dokter"
                            value={invoice.visit?.doctor?.employee?.name}
                        />
                    </InfoCard>

                    <InfoCard title="Status Billing">
                        <div className="mb-[10px]">
                            <span className={`inline-flex rounded-full border px-[10px] py-[5px] text-[12px] font-medium ${invoiceStatusClass(invoice.status)}`}>
                                {invoiceStatusLabel(invoice.status)}
                            </span>
                        </div>
                        <InfoRow
                            label="Dibuat"
                            value={formatDateTime(invoice.generated_at)}
                        />
                    </InfoCard>
                </div>

                <section className="mt-[18px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-[10px] border-b border-[#eeeeee] px-[18px] py-[15px]">
                        <div>
                            <h2 className="text-[16px] font-semibold text-[#212121]">
                                Rincian Tagihan
                            </h2>
                            <p className="mt-[3px] text-[12px] text-[#8f8f8f]">
                                Pendaftaran, jasa dokter, tindakan, obat, dan biaya lain.
                            </p>
                        </div>

                        {canUpdate &&
                            invoice.status !== "cancelled" &&
                            !hasPostedPayments && (
                                <button
                                    type="button"
                                    onClick={openAddItem}
                                    className="inline-flex h-[36px] items-center gap-[7px] rounded-[8px] bg-[#047AF7] px-[12px] text-[11px] font-medium text-white"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    Biaya Lain
                                </button>
                            )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Kategori</Th>
                                    <Th>Kode</Th>
                                    <Th>Deskripsi</Th>
                                    <Th>Qty</Th>
                                    <Th>Harga</Th>
                                    <Th>Total</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {(invoice.items ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-[16px] py-[30px] text-center text-[13px] text-[#999999]">
                                            Belum ada item tagihan. Isi tarif lalu sinkronkan kembali.
                                        </td>
                                    </tr>
                                ) : (
                                    invoice.items.map((item) => (
                                        <tr key={item.id} className="border-b border-[#f0f0f0] last:border-b-0">
                                            <Td>{categoryLabel(item.category)}</Td>
                                            <Td>{item.code ?? "-"}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {item.description}
                                                </p>
                                                {item.is_manual && (
                                                    <p className="mt-[2px] text-[10px] text-[#999999]">
                                                        Manual
                                                    </p>
                                                )}
                                            </Td>
                                            <Td>{formatQuantity(item.quantity)}</Td>
                                            <Td>{formatCurrency(item.unit_price)}</Td>
                                            <Td>{formatCurrency(item.total)}</Td>
                                            <Td>
                                                {item.is_manual &&
                                                canUpdate &&
                                                !hasPostedPayments &&
                                                invoice.status !== "cancelled" ? (
                                                    <div className="flex gap-[6px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditItem(item)}
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        >
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteItem(item)}
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-red-200 text-red-600 hover:bg-red-50"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-[#aaaaaa]">Auto</span>
                                                )}
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ml-auto w-full max-w-[430px] border-t border-[#eeeeee] p-[18px]">
                        <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                        <SummaryRow label="Total Tagihan" value={formatCurrency(invoice.grand_total)} strong />
                        <SummaryRow label="Terbayar" value={formatCurrency(invoice.paid_amount)} />
                        <SummaryRow label="Sisa Tagihan" value={formatCurrency(invoice.balance_due)} strong />
                    </div>
                </section>

                <section className="mt-[18px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-[10px] border-b border-[#eeeeee] px-[18px] py-[15px]">
                        <div>
                            <h2 className="text-[16px] font-semibold text-[#212121]">
                                Pembayaran
                            </h2>
                            <p className="mt-[3px] text-[12px] text-[#8f8f8f]">
                                Pembayaran manual. Belum menggunakan payment gateway.
                            </p>
                        </div>

                        {canPayment &&
                            invoice.status !== "paid" &&
                            invoice.status !== "cancelled" &&
                            Number(invoice.balance_due) > 0 && (
                                <button
                                    type="button"
                                    onClick={openPayment}
                                    className="inline-flex h-[36px] items-center gap-[7px] rounded-[8px] bg-[#047AF7] px-[12px] text-[11px] font-medium text-white"
                                >
                                    <FontAwesomeIcon icon={faMoneyBillTransfer} />
                                    Catat Pembayaran
                                </button>
                            )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>No. Pembayaran</Th>
                                    <Th>Metode</Th>
                                    <Th>Jumlah</Th>
                                    <Th>Referensi</Th>
                                    <Th>Waktu</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {(invoice.payments ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-[16px] py-[30px] text-center text-[13px] text-[#999999]">
                                            Belum ada pembayaran.
                                        </td>
                                    </tr>
                                ) : (
                                    invoice.payments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-[#f0f0f0] last:border-b-0">
                                            <Td>{payment.payment_number}</Td>
                                            <Td>{payment.payment_method?.name ?? "-"}</Td>
                                            <Td>{formatCurrency(payment.amount)}</Td>
                                            <Td>{payment.reference_number ?? "-"}</Td>
                                            <Td>{formatDateTime(payment.paid_at)}</Td>
                                            <Td>
                                                <span className={`inline-flex rounded-full border px-[8px] py-[4px] text-[10px] font-medium ${payment.status === "posted" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                                    {payment.status === "posted" ? "Posted" : "Void"}
                                                </span>
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    {canReceipt && payment.status === "posted" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => printReceipt(payment)}
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff]"
                                                        >
                                                            <FontAwesomeIcon icon={faPrint} />
                                                        </button>
                                                    )}
                                                    {canPayment && payment.status === "posted" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => voidPayment(payment)}
                                                            disabled={busy}
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                        >
                                                            <FontAwesomeIcon icon={faBan} />
                                                        </button>
                                                    )}
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {invoice.status === "cancelled" && (
                    <div className="mt-[18px] rounded-[12px] border border-red-200 bg-red-50 p-[14px] text-[13px] text-red-700">
                        <strong>Invoice dibatalkan.</strong>
                        <p className="mt-[4px]">
                            {invoice.cancellation_reason ?? "Tidak ada alasan."}
                        </p>
                    </div>
                )}

                {canCancel &&
                    invoice.status !== "cancelled" &&
                    !hasPostedPayments && (
                        <div className="mt-[18px] flex justify-end">
                            <button
                                type="button"
                                onClick={cancelInvoice}
                                disabled={busy}
                                className="inline-flex h-[38px] items-center gap-[7px] rounded-[8px] border border-red-200 bg-white px-[13px] text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faBan} />
                                Batalkan Invoice
                            </button>
                        </div>
                    )}
            </div>

            {showItemModal && (
                <Modal
                    title={editingItem ? "Edit Biaya Lain" : "Tambah Biaya Lain"}
                    onClose={() => setShowItemModal(false)}
                >
                    <form onSubmit={saveItem} data-enter-scope>
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Kode">
                                <input
                                    value={itemForm.code}
                                    onChange={(event) => setItemForm((prev) => ({ ...prev, code: event.target.value }))}
                                    className={inputClass}
                                    placeholder="OPSIONAL"
                                />
                            </Field>
                            <Field label="Deskripsi">
                                <input
                                    required
                                    value={itemForm.description}
                                    onChange={(event) => setItemForm((prev) => ({ ...prev, description: event.target.value }))}
                                    className={inputClass}
                                    placeholder="Contoh: Administrasi surat"
                                />
                            </Field>
                            <Field label="Jumlah">
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={itemForm.quantity}
                                    onChange={(event) => setItemForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Harga Satuan">
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={itemForm.unit_price}
                                    onChange={(event) => setItemForm((prev) => ({ ...prev, unit_price: event.target.value }))}
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <ModalActions busy={busy} onCancel={() => setShowItemModal(false)} />
                    </form>
                </Modal>
            )}

            {showPaymentModal && (
                <Modal
                    title="Catat Pembayaran"
                    onClose={() => setShowPaymentModal(false)}
                >
                    <form onSubmit={savePayment} data-enter-scope>
                        <div className="space-y-[14px]">
                            <Field label="Metode Pembayaran">
                                <select
                                    required
                                    value={paymentForm.payment_method_id}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, payment_method_id: event.target.value }))}
                                    className={inputClass}
                                >
                                    <option value="">Pilih metode...</option>
                                    {paymentMethods.map((method) => (
                                        <option key={method.id} value={method.id}>
                                            {method.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Jumlah Bayar">
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    max={Number(invoice.balance_due)}
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                                    className={inputClass}
                                />
                                <p className="mt-[5px] text-[11px] text-[#999999]">
                                    Sisa tagihan: {formatCurrency(invoice.balance_due)}
                                </p>
                            </Field>
                            <Field label="Nomor Referensi">
                                <input
                                    value={paymentForm.reference_number}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, reference_number: event.target.value }))}
                                    className={inputClass}
                                    placeholder="Opsional untuk transfer/debit/QRIS"
                                />
                            </Field>
                            <Field label="Catatan">
                                <textarea
                                    rows={3}
                                    value={paymentForm.notes}
                                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    className={`${inputClass} h-auto py-[10px]`}
                                    placeholder="Catatan pembayaran..."
                                />
                            </Field>
                        </div>

                        <ModalActions busy={busy} onCancel={() => setShowPaymentModal(false)} />
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}

const inputClass = "h-[42px] w-full rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#444444] outline-none focus:border-[#7EBDEC]";

function InfoCard({ title, children }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[17px]">
            <h2 className="text-[14px] font-semibold text-[#343434]">{title}</h2>
            <div className="mt-[12px] space-y-[8px]">{children}</div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-[18px] text-[12px]">
            <span className="text-[#888888]">{label}</span>
            <span className="text-right font-medium text-[#444444]">
                {value || "-"}
            </span>
        </div>
    );
}

function SummaryRow({ label, value, strong = false }) {
    return (
        <div className={`flex items-center justify-between gap-[20px] py-[5px] text-[13px] ${strong ? "font-semibold text-[#212121]" : "text-[#666666]"}`}>
            <span>{label}</span>
            <span>{value}</span>
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

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                {label}
            </span>
            {children}
        </label>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-[20px] backdrop-blur-[1px]">
            <div className="w-full max-w-[600px] overflow-hidden rounded-[15px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                <div className="flex items-center justify-between border-b border-[#eeeeee] px-[20px] py-[16px]">
                    <h2 className="text-[16px] font-semibold text-[#212121]">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#999999] hover:bg-[#f5f5f5]"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
                <div className="p-[20px]">{children}</div>
            </div>
        </div>
    );
}

function ModalActions({ busy, onCancel }) {
    return (
        <div className="mt-[20px] flex justify-end gap-[8px] border-t border-[#eeeeee] pt-[16px]">
            <button
                type="button"
                onClick={onCancel}
                className="h-[38px] rounded-[8px] border border-[#dddddd] px-[14px] text-[12px] font-medium text-[#555555]"
            >
                Batal
            </button>
            <button
                type="submit"
                disabled={busy}
                data-enter-primary
                className="inline-flex h-[38px] items-center gap-[7px] rounded-[8px] bg-[#047AF7] px-[14px] text-[12px] font-medium text-white disabled:opacity-50"
            >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {busy ? "Menyimpan..." : "Simpan"}
            </button>
        </div>
    );
}
