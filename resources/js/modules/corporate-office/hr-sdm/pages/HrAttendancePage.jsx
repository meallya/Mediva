import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faClipboard } from "@fortawesome/free-solid-svg-icons";

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
    StatusBadge,
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
    attendance_date: "",
    status: "present",
    clock_in_at: "", // Diperbaiki dari check_in
    clock_out_at: "", // Diperbaiki dari check_out
    notes: "",
};

const statusOptions = [
    { value: "present", label: "Hadir", color: "emerald" },
    { value: "late", label: "Terlambat", color: "amber" },
    { value: "absent", label: "Alfa", color: "red" },
    { value: "sick", label: "Sakit", color: "blue" },
    { value: "leave", label: "Cuti", color: "purple" },
];

export default function HrAttendancePage() {
    const navigate = useNavigate();

    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [employeesList, setEmployeesList] = useState([]);
    const [meta, setMeta] = useState(normalizeMeta());
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

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

            const response = await hrService.attendances({
                page,
                search: search.trim(),
                status: status === "all" ? null : status,
                date_from: dateFrom || null,
                date_to: dateTo || null,
                per_page: 20,
            });

            const data = response?.data?.data || response?.data || [];
            setRows(Array.isArray(data) ? data : []);
            setMeta(normalizeMeta(response?.data ?? response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data kehadiran."));
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
    }, [search, status, dateFrom, dateTo]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setEmployeeSearch("");
        setError("");
        setModalOpen(true);
    };

    const openEdit = (attendance) => {
        setEditing(attendance);
        setForm({
            employee_id: attendance.employee_id ?? "",
            attendance_date: attendance.attendance_date ?? "",
            status: attendance.status ?? "present",
            // Diperbaiki mapping dari model
            clock_in_at: attendance.clock_in_at ?? "",
            clock_out_at: attendance.clock_out_at ?? "",
            notes: attendance.notes ?? "",
        });

        const matchedEmp = employeesList.find(
            (e) => String(e.id) === String(attendance.employee_id),
        );
        if (matchedEmp) {
            setEmployeeSearch(
                matchedEmp.employee_number
                    ? `${matchedEmp.employee_number} - ${matchedEmp.name}`
                    : matchedEmp.name,
            );
        } else {
            setEmployeeSearch(attendance.employee?.name ?? "");
        }

        setError("");
        setModalOpen(true);
    };

    const save = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const payload = {
                employee_id: form.employee_id,
                attendance_date: form.attendance_date,
                status: form.status,
                // Diperbaiki properti payload sesuai model
                clock_in_at: form.clock_in_at || null,
                clock_out_at: form.clock_out_at || null,
                notes: form.notes.trim() || null,
            };

            if (editing) {
                await hrService.updateAttendance(editing.id, payload);
                flash("Kehadiran berhasil diperbarui.");
            } else {
                await hrService.createAttendance(payload);
                flash("Kehadiran berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan kehadiran."));
        } finally {
            setSaving(false);
        }
    };

    const deleteAttendance = async (attendance) => {
        if (
            !window.confirm(
                `Hapus kehadiran pegawai ${attendance.employee?.name}?`,
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            await hrService.deleteAttendance(attendance.id);
            await load(meta.current_page);
            flash("Kehadiran berhasil dihapus.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menghapus kehadiran."));
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (statusValue) => {
        const statusObj = statusOptions.find((s) => s.value === statusValue);
        if (!statusObj) return statusValue;

        return (
            <span
                className={`inline-flex rounded-full border px-[8px] py-[4px] text-[11px] font-medium ${
                    statusObj.color === "emerald"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : statusObj.color === "amber"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : statusObj.color === "red"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : statusObj.color === "blue"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-purple-200 bg-purple-50 text-purple-700"
                }`}
            >
                {statusObj.label}
            </span>
        );
    };

    // Helper opsional untuk memformat tanggal jika backend mengembalikan full datetime
    const formatTimeOnly = (timeString) => {
        if (!timeString) return "-";
        // Jika format YYYY-MM-DD HH:mm:ss, potong agar tampil HH:mm saja
        if (timeString.includes(" ")) {
            return timeString.split(" ")[1].substring(0, 5);
        }
        return timeString;
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Kehadiran"
                    subtitle="Pencatatan kehadiran pegawai MEDIVA (Manual + HRIS Integration)"
                    buttonLabel="Tambah Kehadiran"
                    onCreate={openCreate}
                    icon={faClipboard}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-4">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari nama pegawai atau NIP..."
                        />

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className={inputClass}
                            placeholder="Dari tanggal"
                        />

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className={inputClass}
                            placeholder="Sampai tanggal"
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
                        <table className="w-full min-w-[940px]">
                            <thead className="bg-[#fafbfc]">
                                <tr>
                                    <Th>Pegawai</Th>
                                    <Th>NIP</Th>
                                    <Th>Tanggal</Th>
                                    <Th>Status</Th>
                                    <Th>Jam Masuk</Th>
                                    <Th>Jam Keluar</Th>
                                    <Th>Catatan</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        colSpan="8"
                                        loading={loading}
                                        emptyText="Kehadiran tidak ditemukan."
                                    />
                                ) : (
                                    rows.map((attendance) => (
                                        <tr
                                            key={attendance.id}
                                            className="border-t border-[#f1f1f1]"
                                        >
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {attendance.employee
                                                        ?.name || "-"}
                                                </p>
                                            </Td>
                                            <Td>
                                                {attendance.employee
                                                    ?.employee_number ?? "-"}
                                            </Td>
                                            <Td>
                                                {attendance.attendance_date ??
                                                    "-"}
                                            </Td>
                                            <Td>
                                                {getStatusBadge(
                                                    attendance.status,
                                                )}
                                            </Td>
                                            <Td>
                                                {/* Diperbaiki untuk merender field model yang tepat */}
                                                {formatTimeOnly(
                                                    attendance.clock_in_at,
                                                )}
                                            </Td>
                                            <Td>
                                                {/* Diperbaiki untuk merender field model yang tepat */}
                                                {formatTimeOnly(
                                                    attendance.clock_out_at,
                                                )}
                                            </Td>
                                            <Td>{attendance.notes ?? "-"}</Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(attendance)
                                                        }
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit kehadiran"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faPen}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() =>
                                                            deleteAttendance(
                                                                attendance,
                                                            )
                                                        }
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#ffd4d4] text-[#d9534f] hover:bg-[#fff5f5] disabled:opacity-50"
                                                        title="Hapus kehadiran"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faTrash}
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
                    title={editing ? "Edit Kehadiran" : "Tambah Kehadiran"}
                    subtitle="Pencatatan kehadiran pegawai MEDIVA"
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={save} className="p-[20px]" data-enter-scope>
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Pilih Pegawai *" required>
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
                                        placeholder="Cari nama atau NIP pegawai..."
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

                            <Field label="Tanggal Kehadiran *" required>
                                <input
                                    required
                                    type="date"
                                    value={form.attendance_date}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            attendance_date: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Status Kehadiran *" required>
                                <select
                                    required
                                    value={form.status}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            status: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    {statusOptions.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Jam Masuk (HH:MM)">
                                <input
                                    type="time"
                                    value={
                                        form.clock_in_at
                                            ? form.clock_in_at.substring(0, 5)
                                            : ""
                                    }
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            clock_in_at: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Jam Keluar (HH:MM)">
                                <input
                                    type="time"
                                    value={
                                        form.clock_out_at
                                            ? form.clock_out_at.substring(0, 5)
                                            : ""
                                    }
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            clock_out_at: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <div className="md:col-span-2">
                                <Field label="Catatan (Opsional)">
                                    <textarea
                                        rows="3"
                                        value={form.notes}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                notes: event.target.value,
                                            }))
                                        }
                                        className={`${inputClass} h-auto py-[8px]`}
                                        placeholder="Catatan untuk kehadiran ini (misal: dinas luar, sidang klinis, dll)"
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
                                {saving ? "Menyimpan..." : "Simpan Kehadiran"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}
