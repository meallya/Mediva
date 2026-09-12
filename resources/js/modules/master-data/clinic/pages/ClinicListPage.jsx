import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHospital,
    faPen,
    faToggleOff,
    faToggleOn,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import clinicService from "../services/clinicService";
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
    queue_prefix: "",
    is_active: true,
};

export default function ClinicListPage() {
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

            const response = await clinicService.getAll({
                page,
                search: search.trim(),
                status,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta(normalizeMeta(response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data poli."));
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

    const openEdit = (clinic) => {
        setEditing(clinic);
        setForm({
            code: clinic.code ?? "",
            name: clinic.name ?? "",
            queue_prefix: clinic.queue_prefix ?? "",
            is_active: Boolean(clinic.is_active),
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
                queue_prefix: form.queue_prefix.trim().toUpperCase() || null,
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await clinicService.update(editing.id, payload);
                flash("Poli berhasil diperbarui.");
            } else {
                await clinicService.create(payload);
                flash("Poli berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan data poli."));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (clinic) => {
        try {
            setSaving(true);
            setError("");
            await clinicService.toggleStatus(clinic.id);
            await load(meta.current_page);
            flash("Status poli berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status poli."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Master Poli"
                    subtitle="Kelola unit pelayanan medis dan prefix antrean tiap poli."
                    buttonLabel="Tambah Poli"
                    onCreate={openCreate}
                    icon={faHospital}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_200px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari nama, kode, atau prefix antrean..."
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
                                    <Th>Nama Poli</Th>
                                    <Th>Prefix Antrean</Th>
                                    <Th>Dokter</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={6}
                                        emptyText="Belum ada data poli."
                                    />
                                ) : (
                                    rows.map((clinic) => (
                                        <tr
                                            key={clinic.id}
                                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                        >
                                            <Td>{clinic.code}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {clinic.name}
                                                </p>
                                            </Td>
                                            <Td>{clinic.queue_prefix ?? "-"}</Td>
                                            <Td>{clinic.doctors_count ?? 0}</Td>
                                            <Td>
                                                <StatusBadge active={clinic.is_active} />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(clinic)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit poli"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => toggleStatus(clinic)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        title="Ubah status"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                clinic.is_active
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
                    title={editing ? "Edit Poli" : "Tambah Poli"}
                    subtitle="Unit pelayanan medis MEDIVA"
                    onClose={() => setModalOpen(false)}
                >
                    <form
                        onSubmit={save}
                        className="p-[20px]"
                        data-enter-scope
                    >
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Kode Poli" required>
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
                                    placeholder="POLI-UMUM"
                                />
                            </Field>

                            <Field label="Prefix Antrean">
                                <input
                                    value={form.queue_prefix}
                                    maxLength={10}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            queue_prefix:
                                                event.target.value.toUpperCase(),
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="A"
                                />
                            </Field>

                            <div className="md:col-span-2">
                                <Field label="Nama Poli" required>
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
                                        placeholder="Poli Umum"
                                    />
                                </Field>
                            </div>
                        </div>

                        <label className="mt-[16px] flex items-center gap-[9px] text-[13px] text-[#555555]">
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
                            Poli aktif
                        </label>

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
