import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPen,
    faTrash,
    faCheckCircle,
    faTimesCircle,
    faClock,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import employeeService from "../../../master-data/employee/services/employeeService";
import { hrService } from "../services/hrService";

import {
    Field,
    MasterDataAlert,
    MasterDataHeader,
    Modal,
    Pagination,
    SearchBox,
    TableEmpty,
    Td,
    Th,
} from "../../../master-data/shared/MasterDataUI";
import {
    getErrorMessage,
    inputClass,
    normalizeMeta,
} from "../../../master-data/shared/masterDataUtils";

const emptyForm = {
    employee_id: "",
    request_type: "leave",
    leave_type_id: "1",
    start_date: "",
    end_date: "",
    reason: "",
    attachment_path: "",
};

const requestTypes = [
    { value: "leave", label: "Cuti" },
    { value: "sick", label: "Sakit" },
    { value: "permission", label: "Izin" },
];

const leaveTypes = [
    { id: "1", name: "Cuti Tahunan", max_days: 12 },
    { id: "2", name: "Cuti Bersama", max_days: null },
    { id: "3", name: "Cuti Haji", max_days: 40 },
    { id: "4", name: "Cuti Pernikahan", max_days: 3 },
];

const statusOptions = [
    { value: "pending", label: "Menunggu", icon: faClock, color: "amber" },
    {
        value: "approved_supervisor",
        label: "Disetujui Supervisor",
        icon: faCheckCircle,
        color: "blue",
    },
    {
        value: "approved_hr",
        label: "Disetujui HR",
        icon: faCheckCircle,
        color: "emerald",
    },
    { value: "rejected", label: "Ditolak", icon: faTimesCircle, color: "red" },
];

export default function HrAbsencePage() {
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [employeesList, setEmployeesList] = useState([]);
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

    const filteredEmployees = employeesList.filter((emp) => {
        const keyword = employeeSearch.toLowerCase().trim();
        if (!keyword) return true;

        const nameMatch = emp.name?.toLowerCase().includes(keyword);
        const numberMatch = emp.employee_number
            ?.toLowerCase()
            .includes(keyword);

        return nameMatch || numberMatch;
    });

    const flash = (message) => {
        setSuccess(message);
        window.setTimeout(() => setSuccess(""), 2500);
    };

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await hrService.absences({
                page,
                search: search.trim(),
                status: status === "all" ? null : status,
                per_page: 20,
            });

            const data = response?.data?.data || response?.data || [];
            setRows(Array.isArray(data) ? data : []);
            setMeta(normalizeMeta(response?.data ?? response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data cuti & izin."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await employeeService.getAll({
                    per_page: 100,
                });
                setEmployeesList(response?.data ?? []);
            } catch (error) {
                console.error("Gagal memuat list pegawai", error);
            }
        };

        fetchEmployees();
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => load(1), 250);
        return () => window.clearTimeout(timer);
    }, [search, status]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setEmployeeSearch("");
        setError("");
        setModalOpen(true);
    };

    const openEdit = (absence) => {
        setEditing(absence);
        setForm({
            employee_id: absence.employee_id ?? "",
            request_type: absence.request_type ?? "leave",
            leave_type_id: absence.leave_type_id ?? "1",
            start_date: absence.start_date ?? "",
            end_date: absence.end_date ?? "",
            reason: absence.reason ?? "",
            attachment_path: absence.attachment_path ?? "",
        });

        const matchedEmp = employeesList.find(
            (e) => String(e.id) === String(absence.employee_id),
        );
        if (matchedEmp) {
            setEmployeeSearch(
                matchedEmp.employee_number
                    ? `${matchedEmp.employee_number} - ${matchedEmp.name}`
                    : matchedEmp.name,
            );
        } else {
            setEmployeeSearch(absence.employee?.name ?? "");
        }

        setError("");
        setModalOpen(true);
    };

    const calculateTotalDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return parseInt(days);
    };

    const save = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const totalDays = calculateTotalDays(
                form.start_date,
                form.end_date,
            );

            const payload = {
                employee_id: form.employee_id,
                request_type: form.request_type,
                leave_type_id: form.leave_type_id,
                start_date: form.start_date,
                end_date: form.end_date,
                total_days: totalDays,
                reason: form.reason.trim(),
                attachment_path: form.attachment_path || null,
            };

            if (editing) {
                await hrService.updateAbsence(editing.id, payload);
                flash("Cuti & Izin berhasil diperbarui.");
            } else {
                await hrService.createAbsence(payload);
                flash("Cuti & Izin berhasil diajukan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan cuti & izin."));
        } finally {
            setSaving(false);
        }
    };

    const approveRequest = async (absence, level) => {
        try {
            setSaving(true);
            setError("");
            await hrService.approveAbsence(absence.id, { level });
            flash(
                `Cuti & Izin disetujui oleh ${level === "supervisor" ? "Supervisor" : "HR"}.`,
            );
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyetujui cuti & izin."));
        } finally {
            setSaving(false);
        }
    };

    const rejectRequest = async (absence) => {
        if (!window.confirm("Tolak permintaan cuti & izin ini?")) return;

        try {
            setSaving(true);
            setError("");
            await hrService.rejectAbsence(absence.id);
            flash("Cuti & Izin ditolak.");
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menolak cuti & izin."));
        } finally {
            setSaving(false);
        }
    };

    const deleteRequest = async (absence) => {
        if (!window.confirm("Hapus permintaan cuti & izin ini?")) return;

        try {
            setSaving(true);
            setError("");
            await hrService.deleteAbsence(absence.id);
            flash("Cuti & Izin berhasil dihapus.");
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menghapus cuti & izin."));
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (statusValue) => {
        const statusObj = statusOptions.find((s) => s.value === statusValue);
        if (!statusObj) return statusValue;

        const colorClass =
            statusObj.color === "amber"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : statusObj.color === "blue"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : statusObj.color === "emerald"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700";

        return (
            <span
                className={`inline-flex items-center gap-[4px] rounded-full border px-[8px] py-[4px] text-[11px] font-medium ${colorClass}`}
            >
                <FontAwesomeIcon icon={statusObj.icon} />
                {statusObj.label}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Cuti & Izin"
                    subtitle="Pengelolaan permintaan cuti, sakit, dan izin pegawai MEDIVA"
                    buttonLabel="Ajukan Cuti & Izin"
                    onCreate={openCreate}
                    icon={faClock}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_200px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari nama pegawai atau NIP..."
                        />

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Status</option>
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-[16px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead className="bg-[#fafbfc]">
                                <tr>
                                    <Th>Pegawai</Th>
                                    <Th>Tipe</Th>
                                    <Th>Tanggal</Th>
                                    <Th>Hari</Th>
                                    <Th>Status</Th>
                                    <Th>Alasan</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        colSpan="7"
                                        loading={loading}
                                        emptyText="Cuti & Izin tidak ditemukan."
                                    />
                                ) : (
                                    rows.map((absence) => (
                                        <tr
                                            key={absence.id}
                                            className="border-t border-[#f1f1f1]"
                                        >
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {absence.employee?.name ||
                                                        "-"}
                                                </p>
                                                <p className="text-[11px] text-[#888888]">
                                                    {absence.employee
                                                        ?.employee_number ||
                                                        "-"}
                                                </p>
                                            </Td>
                                            <Td>
                                                {requestTypes.find(
                                                    (t) =>
                                                        t.value ===
                                                        absence.request_type,
                                                )?.label || "-"}
                                            </Td>
                                            <Td className="text-[12px]">
                                                {new Date(
                                                    absence.start_date,
                                                ).toLocaleDateString(
                                                    "id-ID",
                                                )}{" "}
                                                s/d{" "}
                                                {new Date(
                                                    absence.end_date,
                                                ).toLocaleDateString("id-ID")}
                                            </Td>
                                            <Td>
                                                {Math.round(absence.total_days)}{" "}
                                                hari
                                            </Td>
                                            <Td>
                                                {getStatusBadge(absence.status)}
                                            </Td>
                                            <Td className="text-[12px]">
                                                {absence.reason
                                                    ? absence.reason.substring(
                                                          0,
                                                          30,
                                                      ) + "..."
                                                    : "-"}
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    {(absence.status ===
                                                        "pending" ||
                                                        absence.status ===
                                                            "approved_supervisor") && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    saving
                                                                }
                                                                onClick={() =>
                                                                    approveRequest(
                                                                        absence,
                                                                        "supervisor",
                                                                    )
                                                                }
                                                                className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#d4f4dd] bg-[#f0fdf4] text-[#16a34a] hover:bg-[#f0fdf4] disabled:opacity-50"
                                                                title="Setujui"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faCheckCircle
                                                                    }
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    saving
                                                                }
                                                                onClick={() =>
                                                                    rejectRequest(
                                                                        absence,
                                                                    )
                                                                }
                                                                className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#fecdd3] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fef2f2] disabled:opacity-50"
                                                                title="Tolak"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faTimesCircle
                                                                    }
                                                                />
                                                            </button>
                                                        </>
                                                    )}

                                                    {absence.status ===
                                                        "pending" && (
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                openEdit(
                                                                    absence,
                                                                )
                                                            }
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                            title="Edit"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                        </button>
                                                    )}

                                                    {(absence.status ===
                                                        "pending" ||
                                                        absence.status ===
                                                            "rejected") && (
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                deleteRequest(
                                                                    absence,
                                                                )
                                                            }
                                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#ffd4d4] text-[#d9534f] hover:bg-[#fff5f5] disabled:opacity-50"
                                                            title="Hapus"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                            />
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

                    <Pagination
                        meta={meta}
                        loading={loading}
                        onPageChange={load}
                    />
                </div>
            </div>

            {modalOpen && (
                <Modal
                    title={editing ? "Edit Cuti & Izin" : "Ajukan Cuti & Izin"}
                    subtitle="Pengajuan cuti, sakit, atau izin pegawai MEDIVA"
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={save} className="p-[20px]" data-enter-scope>
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Pegawai *" required>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={employeeSearch}
                                        onChange={(event) => {
                                            const val = event.target.value;
                                            setEmployeeSearch(val);
                                            setEmployeeDropdownOpen(true);
                                            if (!val.trim()) {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    employee_id: "",
                                                }));
                                            }
                                        }}
                                        onFocus={() =>
                                            setEmployeeDropdownOpen(true)
                                        }
                                        className={inputClass}
                                        placeholder="Cari nama atau NIP..."
                                    />

                                    {employeeDropdownOpen && (
                                        <div className="absolute z-50 mt-[4px] max-h-[240px] w-full overflow-y-auto rounded-[9px] border border-[#dddddd] bg-white shadow-lg">
                                            {filteredEmployees.length === 0 ? (
                                                <div className="px-[12px] py-[10px] text-[13px] text-[#888888]">
                                                    Pegawai tidak ditemukan.
                                                </div>
                                            ) : (
                                                filteredEmployees.map((emp) => (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                employee_id:
                                                                    emp.id,
                                                            }));

                                                            setEmployeeSearch(
                                                                emp.employee_number
                                                                    ? `${emp.employee_number} - ${emp.name}`
                                                                    : emp.name,
                                                            );

                                                            setEmployeeDropdownOpen(
                                                                false,
                                                            );
                                                        }}
                                                        className="block w-full border-b border-[#f1f1f1] px-[12px] py-[10px] text-left hover:bg-[#f7faff]"
                                                    >
                                                        <div className="text-[13px] font-medium text-[#343434]">
                                                            {emp.name}
                                                        </div>
                                                        {emp.employee_number && (
                                                            <div className="mt-[2px] text-[11px] text-[#888888]">
                                                                NIP:{" "}
                                                                {
                                                                    emp.employee_number
                                                                }
                                                            </div>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Field>

                            <Field label="Tipe Pengajuan *" required>
                                <select
                                    required
                                    value={form.request_type}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            request_type: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    {requestTypes.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {form.request_type === "leave" && (
                                <Field label="Jenis Cuti *" required>
                                    <select
                                        required
                                        value={form.leave_type_id}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                leave_type_id:
                                                    event.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    >
                                        {leaveTypes.map((lt) => (
                                            <option key={lt.id} value={lt.id}>
                                                {lt.name}
                                                {lt.max_days &&
                                                    ` (${lt.max_days} hari)`}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            )}

                            <Field label="Mulai Dari *" required>
                                <input
                                    required
                                    type="date"
                                    value={form.start_date}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            start_date: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Sampai Tanggal *" required>
                                <input
                                    required
                                    type="date"
                                    value={form.end_date}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            end_date: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            {form.start_date && form.end_date && (
                                <Field label="Total Hari">
                                    <input
                                        type="text"
                                        disabled
                                        value={`${Math.round(calculateTotalDays(form.start_date, form.end_date))} hari`}
                                        className={`${inputClass} bg-[#f5f5f5]`}
                                    />
                                </Field>
                            )}

                            <div className="md:col-span-2">
                                <Field label="Alasan *" required>
                                    <textarea
                                        required
                                        rows="3"
                                        value={form.reason}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                reason: event.target.value,
                                            }))
                                        }
                                        className={`${inputClass} h-auto py-[8px]`}
                                        placeholder="Jelaskan alasan pengajuan..."
                                    />
                                </Field>
                            </div>
                        </div>

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
                                {saving ? "Menyimpan..." : "Ajukan"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}
