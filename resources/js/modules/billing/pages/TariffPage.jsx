import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faMoneyBillWave,
    faPen,
    faPlus,
    faToggleOff,
    faToggleOn,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import useAuth from "../../auth/hooks/useAuth";
import billingService from "../services/billingService";
import { formatCurrency } from "../utils/billingUtils";

const emptyForm = {
    code: "",
    name: "",
    category: "registration",
    amount: "",
    unit_id: "",
    doctor_id: "",
    reference_code: "",
    is_active: true,
};

const categoryLabels = {
    registration: "Pendaftaran",
    doctor_service: "Jasa Dokter",
    procedure: "Tindakan",
    other_service: "Biaya Lain",
};

export default function TariffPage() {
    const { permissions = [] } = useAuth();
    const canManage = permissions.includes("tariff.manage");

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [options, setOptions] = useState({ units: [], doctors: [], categories: [] });
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const selectedCategory = form.category;

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await billingService.getTariffs({
                page,
                search: search.trim(),
                category,
                status,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta({
                current_page: response?.current_page ?? 1,
                last_page: response?.last_page ?? 1,
                total: response?.total ?? 0,
            });
        } catch (err) {
            setError(err?.message ?? "Gagal memuat tarif.");
        } finally {
            setLoading(false);
        }
    };

    const loadOptions = async () => {
        try {
            const response = await billingService.getTariffOptions();
            setOptions(response?.data ?? { units: [], doctors: [], categories: [] });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => load(1), 250);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, category, status]);

    const flash = (message) => {
        setSuccess(message);
        window.setTimeout(() => setSuccess(""), 2500);
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (tariff) => {
        setEditing(tariff);
        setForm({
            code: tariff.code ?? "",
            name: tariff.name ?? "",
            category: tariff.category ?? "registration",
            amount: String(Number(tariff.amount ?? 0)),
            unit_id: tariff.unit_id ? String(tariff.unit_id) : "",
            doctor_id: tariff.doctor_id ? String(tariff.doctor_id) : "",
            reference_code: tariff.reference_code ?? "",
            is_active: Boolean(tariff.is_active),
        });
        setShowModal(true);
    };

    const save = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                category: form.category,
                amount: Number(form.amount),
                unit_id: form.unit_id ? Number(form.unit_id) : null,
                doctor_id:
                    form.category === "doctor_service" && form.doctor_id
                        ? Number(form.doctor_id)
                        : null,
                reference_code:
                    form.category === "procedure"
                        ? form.reference_code.trim() || null
                        : null,
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await billingService.updateTariff(editing.id, payload);
                flash("Tarif berhasil diubah.");
            } else {
                await billingService.createTariff(payload);
                flash("Tarif berhasil dibuat.");
            }

            setShowModal(false);
            await load(meta.current_page);
        } catch (err) {
            setError(err?.message ?? "Gagal menyimpan tarif.");
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (tariff) => {
        try {
            setSaving(true);
            setError("");
            await billingService.toggleTariffStatus(tariff.id);
            await load(meta.current_page);
            flash("Status tarif berhasil diubah.");
        } catch (err) {
            setError(err?.message ?? "Gagal mengubah status tarif.");
        } finally {
            setSaving(false);
        }
    };

    const scopeText = useMemo(() => {
        if (selectedCategory === "doctor_service") {
            return "Dokter dapat dikosongkan untuk tarif umum. Unit juga opsional.";
        }

        if (selectedCategory === "procedure") {
            return "Reference Code diisi kode ICD-9-CM tindakan agar biaya masuk otomatis.";
        }

        return "Unit dapat dikosongkan untuk tarif yang berlaku umum.";
    }, [selectedCategory]);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#212121]">
                            Master Tarif
                        </h1>
                        <p className="mt-[5px] text-[12px] text-[#626262]">
                            Tarif pendaftaran, jasa dokter, tindakan, dan layanan lainnya.
                        </p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-[40px] items-center gap-[8px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white hover:bg-[#006fe6]"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Tambah Tarif
                        </button>
                    )}
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

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_220px_180px]">
                        <div className="flex h-[42px] items-center gap-[9px] rounded-[9px] border border-[#dddddd] px-[12px]">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#aaaaaa]" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari kode, nama, atau kode referensi..."
                                className="w-full bg-transparent text-[13px] outline-none"
                            />
                        </div>

                        <select
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Kategori</option>
                            <option value="registration">Pendaftaran</option>
                            <option value="doctor_service">Jasa Dokter</option>
                            <option value="procedure">Tindakan</option>
                            <option value="other_service">Biaya Lain</option>
                        </select>

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

                <div className="mt-[15px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Kode</Th>
                                    <Th>Nama Tarif</Th>
                                    <Th>Kategori</Th>
                                    <Th>Unit</Th>
                                    <Th>Dokter</Th>
                                    <Th>Reference Code</Th>
                                    <Th>Tarif</Th>
                                    <Th>Status</Th>
                                    {canManage && <Th>Aksi</Th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={canManage ? 9 : 8} className="px-[16px] py-[35px] text-center text-[13px] text-[#999999]">
                                            Memuat tarif...
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 9 : 8} className="px-[16px] py-[35px] text-center text-[13px] text-[#999999]">
                                            Belum ada data tarif.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((tariff) => (
                                        <tr key={tariff.id} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]">
                                            <Td>{tariff.code}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">{tariff.name}</p>
                                            </Td>
                                            <Td>{categoryLabels[tariff.category] ?? tariff.category}</Td>
                                            <Td>{tariff.unit?.name ?? "Umum"}</Td>
                                            <Td>{tariff.doctor?.employee?.name ?? "Umum"}</Td>
                                            <Td>{tariff.reference_code ?? "-"}</Td>
                                            <Td>{formatCurrency(tariff.amount)}</Td>
                                            <Td>
                                                <span className={`inline-flex rounded-full border px-[8px] py-[4px] text-[10px] font-medium ${tariff.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                                                    {tariff.is_active ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </Td>
                                            {canManage && (
                                                <Td>
                                                    <div className="flex gap-[6px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(tariff)}
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        >
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() => toggleStatus(tariff)}
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        >
                                                            <FontAwesomeIcon icon={tariff.is_active ? faToggleOn : faToggleOff} />
                                                        </button>
                                                    </div>
                                                </Td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#eeeeee] px-[16px] py-[14px]">
                        <p className="text-[12px] text-[#888888]">Total {meta.total} tarif</p>
                        <div className="flex items-center gap-[8px]">
                            <button
                                type="button"
                                disabled={meta.current_page <= 1 || loading}
                                onClick={() => load(meta.current_page - 1)}
                                className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-[12px] text-[#666666]">{meta.current_page} / {meta.last_page}</span>
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

            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-[20px] backdrop-blur-[1px]">
                    <div className="w-full max-w-[720px] overflow-hidden rounded-[15px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                        <div className="flex items-center justify-between border-b border-[#eeeeee] px-[22px] py-[17px]">
                            <div>
                                <h2 className="text-[16px] font-semibold text-[#212121]">
                                    {editing ? "Edit Tarif" : "Tambah Tarif"}
                                </h2>
                                <p className="mt-[3px] text-[11px] text-[#999999]">Master tarif MEDIVA</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#999999] hover:bg-[#f5f5f5]"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <form onSubmit={save} className="p-[20px]" data-enter-scope>
                            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                                <Field label="Kode Tarif">
                                    <input
                                        required
                                        value={form.code}
                                        onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                                        className={inputClass}
                                        placeholder="REG-UMUM"
                                    />
                                </Field>

                                <Field label="Nama Tarif">
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                        className={inputClass}
                                        placeholder="Biaya Pendaftaran"
                                    />
                                </Field>

                                <Field label="Kategori">
                                    <select
                                        value={form.category}
                                        onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value, doctor_id: "", reference_code: "" }))}
                                        className={inputClass}
                                    >
                                        <option value="registration">Pendaftaran</option>
                                        <option value="doctor_service">Jasa Dokter</option>
                                        <option value="procedure">Tindakan</option>
                                        <option value="other_service">Biaya Lain</option>
                                    </select>
                                </Field>

                                <Field label="Tarif">
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                                        className={inputClass}
                                        placeholder="50000"
                                    />
                                </Field>

                                <Field label="Unit / Poli">
                                    <select
                                        value={form.unit_id}
                                        onChange={(event) => setForm((prev) => ({ ...prev, unit_id: event.target.value }))}
                                        className={inputClass}
                                    >
                                        <option value="">Umum / Semua Unit</option>
                                        {(options.units ?? []).map((unit) => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                </Field>

                                {form.category === "doctor_service" && (
                                    <Field label="Dokter">
                                        <select
                                            value={form.doctor_id}
                                            onChange={(event) => setForm((prev) => ({ ...prev, doctor_id: event.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">Umum / Semua Dokter</option>
                                            {(options.doctors ?? []).map((doctor) => (
                                                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                                            ))}
                                        </select>
                                    </Field>
                                )}

                                {form.category === "procedure" && (
                                    <Field label="Kode ICD-9-CM">
                                        <input
                                            value={form.reference_code}
                                            onChange={(event) => setForm((prev) => ({ ...prev, reference_code: event.target.value }))}
                                            className={inputClass}
                                            placeholder="Contoh: 89.52"
                                        />
                                    </Field>
                                )}
                            </div>

                            <p className="mt-[12px] text-[11px] text-[#999999]">{scopeText}</p>

                            <label className="mt-[14px] flex items-center gap-[8px] text-[12px] text-[#555555]">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                />
                                Tarif aktif
                            </label>

                            <div className="mt-[20px] flex justify-end gap-[8px] border-t border-[#eeeeee] pt-[16px]">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="h-[38px] rounded-[8px] border border-[#dddddd] px-[14px] text-[12px] font-medium text-[#555555]"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    data-enter-primary
                                    className="h-[38px] rounded-[8px] bg-[#047AF7] px-[14px] text-[12px] font-medium text-white disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : "Simpan Tarif"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

const inputClass = "h-[42px] w-full rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#444444] outline-none focus:border-[#7EBDEC]";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-[6px] block text-[12px] font-medium text-[#555555]">{label}</span>
            {children}
        </label>
    );
}

function Th({ children }) {
    return <th className="px-[14px] py-[12px] text-left text-[11px] font-semibold uppercase tracking-[0.3px] text-[#777777]">{children}</th>;
}

function Td({ children }) {
    return <td className="px-[14px] py-[13px] text-[12px] text-[#555555]">{children}</td>;
}
