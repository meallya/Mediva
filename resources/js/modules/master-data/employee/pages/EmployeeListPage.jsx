import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPen,
    faToggleOff,
    faToggleOn,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import employeeService from "../services/employeeService";
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
    employee_number: "",
    name: "",
    email: "",
    phone: "",
    is_active: true,
};

export default function EmployeeListPage() {
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

            const response = await employeeService.getAll({
                page,
                search: search.trim(),
                status,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta(normalizeMeta(response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data pegawai."));
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

    const openEdit = (employee) => {
        setEditing(employee);
        setForm({
            employee_number: employee.employee_number ?? "",
            name: employee.name ?? "",
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            is_active: Boolean(employee.is_active),
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
                employee_number: form.employee_number.trim() || null,
                name: form.name.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await employeeService.update(editing.id, payload);
                flash("Data pegawai berhasil diperbarui.");
            } else {
                await employeeService.create(payload);
                flash("Pegawai berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan data pegawai."));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (employee) => {
        try {
            setSaving(true);
            setError("");
            await employeeService.toggleStatus(employee.id);
            await load(meta.current_page);
            flash("Status pegawai berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status pegawai."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Master Pegawai"
                    subtitle="Kelola identitas dasar pegawai rumah sakit. Akun login dan role tetap dikelola terpisah."
                    buttonLabel="Tambah Pegawai"
                    onCreate={openCreate}
                    icon={faUsers}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_200px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari nomor pegawai, nama, email, atau telepon..."
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
                        <table className="w-full min-w-[940px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>No. Pegawai</Th>
                                    <Th>Nama</Th>
                                    <Th>Email</Th>
                                    <Th>Telepon</Th>
                                    <Th>Profil Dokter</Th>
                                    <Th>Akun Login</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={8}
                                        emptyText="Belum ada data pegawai."
                                    />
                                ) : (
                                    rows.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                        >
                                            <Td>{employee.employee_number ?? "-"}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {employee.name}
                                                </p>
                                            </Td>
                                            <Td>{employee.email ?? "-"}</Td>
                                            <Td>{employee.phone ?? "-"}</Td>
                                            <Td>
                                                {employee.doctor ? (
                                                    <span className="text-[#047AF7]">
                                                        {employee.doctor.specialization || "Dokter"}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </Td>
                                            <Td>
                                                {employee.user?.username ?? "-"}
                                            </Td>
                                            <Td>
                                                <StatusBadge active={employee.is_active} />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(employee)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit pegawai"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => toggleStatus(employee)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        title="Ubah status"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                employee.is_active
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
                    title={editing ? "Edit Pegawai" : "Tambah Pegawai"}
                    subtitle="Data identitas dasar pegawai MEDIVA"
                    onClose={() => setModalOpen(false)}
                >
                    <form
                        onSubmit={save}
                        className="p-[20px]"
                        data-enter-scope
                    >
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Nomor Pegawai">
                                <input
                                    value={form.employee_number}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            employee_number: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="EMP-0001"
                                />
                            </Field>

                            <Field label="Nama Pegawai" required>
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
                                    placeholder="Nama lengkap pegawai"
                                />
                            </Field>

                            <Field label="Email">
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            email: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="pegawai@rumahsakit.id"
                                />
                            </Field>

                            <Field label="Telepon">
                                <input
                                    value={form.phone}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            phone: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </Field>
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
                            Pegawai aktif
                        </label>

                        <p className="mt-[8px] text-[11px] leading-[1.5] text-[#999999]">
                            Menonaktifkan master pegawai tidak otomatis menghapus akun,
                            role, atau riwayat aktivitas yang sudah ada.
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
