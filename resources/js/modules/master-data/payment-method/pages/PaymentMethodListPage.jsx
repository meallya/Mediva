import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCreditCard,
    faPen,
    faToggleOff,
    faToggleOn,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import paymentMethodService from "../services/paymentMethodService";
import {
    Field,
    MasterDataAlert,
    MasterDataHeader,
    Modal,
    Pagination,
    SearchBox,
    StatusBadge,
    TableEmpty,
    Td,
    Th,
} from "../../shared/MasterDataUI";
import {
    getErrorMessage,
    inputClass,
    normalizeMeta,
} from "../../shared/masterDataUtils";

const emptyForm = {
    code: "",
    name: "",
    type: "manual",
    is_active: true,
};

export default function PaymentMethodListPage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(normalizeMeta());
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const flash = (message) => {
        setSuccess(message);
        window.setTimeout(() => setSuccess(""), 2500);
    };

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await paymentMethodService.getAll({
                page,
                search: search.trim(),
                status,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta(normalizeMeta(response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat metode bayar."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => load(1), 250);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setModalOpen(true);
    };

    const openEdit = (paymentMethod) => {
        setEditing(paymentMethod);
        setForm({
            code: paymentMethod.code ?? "",
            name: paymentMethod.name ?? "",
            type: paymentMethod.type ?? "manual",
            is_active: Boolean(paymentMethod.is_active),
        });
        setError("");
        setModalOpen(true);
    };

    const save = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const payload = {
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
                type: form.type.trim() || null,
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await paymentMethodService.update(editing.id, payload);
                flash("Metode bayar berhasil diperbarui.");
            } else {
                await paymentMethodService.create(payload);
                flash("Metode bayar berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan metode bayar."));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (paymentMethod) => {
        try {
            setSaving(true);
            setError("");
            await paymentMethodService.toggleStatus(paymentMethod.id);
            await load(meta.current_page);
            flash("Status metode bayar berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status metode bayar."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Master Metode Bayar"
                    subtitle="Kelola metode pembayaran yang dipakai pada kunjungan dan proses billing MEDIVA."
                    buttonLabel="Tambah Metode Bayar"
                    onCreate={openCreate}
                    icon={faCreditCard}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_200px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari kode, nama, atau jenis metode bayar..."
                        />

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>
                </div>

                <div className="mt-[16px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Kode</Th>
                                    <Th>Nama Metode</Th>
                                    <Th>Jenis</Th>
                                    <Th>Dipakai Kunjungan</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={6}
                                        emptyText="Belum ada metode bayar."
                                    />
                                ) : (
                                    rows.map((paymentMethod) => (
                                        <tr
                                            key={paymentMethod.id}
                                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                        >
                                            <Td>{paymentMethod.code}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {paymentMethod.name}
                                                </p>
                                            </Td>
                                            <Td>{paymentMethod.type ?? "-"}</Td>
                                            <Td>{paymentMethod.visits_count ?? 0}</Td>
                                            <Td>
                                                <StatusBadge
                                                    active={paymentMethod.is_active}
                                                />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(paymentMethod)
                                                        }
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit metode bayar"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() =>
                                                            toggleStatus(paymentMethod)
                                                        }
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        title="Ubah status"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                paymentMethod.is_active
                                                                    ? faToggleOn
                                                                    : faToggleOff
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        meta={meta}
                        loading={loading}
                        onPageChange={load}
                    />
                </div>
            </div>

            {modalOpen && (
                <Modal
                    title={
                        editing
                            ? "Edit Metode Bayar"
                            : "Tambah Metode Bayar"
                    }
                    subtitle="Master metode pembayaran MEDIVA"
                    onClose={() => setModalOpen(false)}
                >
                    <form
                        onSubmit={save}
                        className="p-[20px]"
                        data-enter-scope
                    >
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Kode" required>
                                <input
                                    required
                                    value={form.code}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            code: event.target.value.toUpperCase(),
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="CASH"
                                />
                            </Field>

                            <Field label="Nama Metode" required>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            name: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="Tunai"
                                />
                            </Field>

                            <Field
                                label="Jenis"
                                helper="Nilai bebas untuk pengelompokan internal. Default billing saat ini memakai manual."
                            >
                                <input
                                    value={form.type}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            type: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="manual"
                                />
                            </Field>

                            <Field label="Status">
                                <label className="flex h-[42px] items-center gap-[9px] rounded-[9px] border border-[#dddddd] px-[12px] text-[13px] text-[#555555]">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                is_active: event.target.checked,
                                            }))
                                        }
                                    />
                                    Metode bayar aktif
                                </label>
                            </Field>
                        </div>

                        <p className="mt-[14px] text-[11px] leading-[1.5] text-[#999999]">
                            Data tidak dihapus agar kunjungan dan transaksi lama tetap
                            memiliki referensi yang valid. Gunakan status Nonaktif jika
                            metode sudah tidak digunakan.
                        </p>

                        <div className="mt-[22px] flex justify-end gap-[9px]">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="h-[40px] rounded-[9px] border border-[#dddddd] px-[15px] text-[13px] text-[#555555]"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="h-[40px] rounded-[9px] bg-[#047AF7] px-[16px] text-[13px] font-medium text-white disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}
