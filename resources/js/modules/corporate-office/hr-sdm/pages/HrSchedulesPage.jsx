import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPen,
    faCalendarDays,
    faTrash,
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
    schedule_date: "",
    schedule_type: "regular",
    shift_id: "",
    unit_id: "",
    notes: "",
};

export default function HrSchedulesPage() {
    const navigate = useNavigate();

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
        const nikMatch = emp.nik?.toLowerCase().includes(keyword);

        return nameMatch || numberMatch || nikMatch;
    });

    const flash = (message) => {
        setSuccess(message);
        window.setTimeout(() => setSuccess(""), 2500);
    };

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await hrService.schedules({
                page,
                search: search.trim(),
                schedule_type: status === "all" ? null : status,
                per_page: 20,
            });

            const data = response?.data?.data || response?.data || [];
            setRows(Array.isArray(data) ? data : []);
            setMeta(normalizeMeta(response?.data ?? response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data jadwal."));
        } finally {
            setLoading(false);
        }
    };

    // Load employee list on mount
    useEffect(() => {
        const fetchEmployees = async (searchTerm = "") => {
            try {
                const response = await employeeService.getAll({
                    search: searchTerm,
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

    const openEdit = (schedule) => {
        setEditing(schedule);
        setForm({
            employee_id: schedule.employee_id ?? "",
            schedule_date: schedule.schedule_date ?? "",
            schedule_type: schedule.schedule_type ?? "regular",
            shift_id: schedule.shift_id ?? "",
            unit_id: schedule.unit_id ?? "",
            notes: schedule.notes ?? "",
        });

        const matchedEmp = employeesList.find(
            (e) => String(e.id) === String(schedule.employee_id),
        );
        if (matchedEmp) {
            setEmployeeSearch(
                matchedEmp.employee_number
                    ? `${matchedEmp.employee_number} - ${matchedEmp.name}`
                    : matchedEmp.name,
            );
        } else {
            setEmployeeSearch(schedule.employee?.name ?? "");
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
                schedule_date: form.schedule_date,
                schedule_type: form.schedule_type,
                shift_id: form.shift_id || null,
                unit_id: form.unit_id || null,
                notes: form.notes.trim() || null,
            };

            if (editing) {
                await hrService.updateSchedule(editing.id, payload);
                flash("Jadwal & Shift berhasil diperbarui.");
            } else {
                await hrService.createSchedule(payload);
                flash("Jadwal & Shift berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan jadwal."));
        } finally {
            setSaving(false);
        }
    };

    // ✅ TAMBAHAN: Delete schedule
    const deleteSchedule = async (schedule) => {
        if (
            !window.confirm(`Hapus jadwal pegawai ${schedule.employee?.name}?`)
        ) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            await hrService.deleteSchedule(schedule.id);
            await load(meta.current_page);
            flash("Jadwal & Shift berhasil dihapus.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menghapus jadwal."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Jadwal & Shift"
                    subtitle="Penugasan jam kerja dan shift pegawai MEDIVA."
                    buttonLabel="Tambah Jadwal"
                    onCreate={openCreate}
                    icon={faCalendarDays}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_200px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari nama pegawai, tanggal, atau tipe jadwal..."
                        />

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="regular">Regular</option>
                            <option value="shift">Shift</option>
                            <option value="oncall">On-Call</option>
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
                                    <Th>Tanggal Jadwal</Th>
                                    <Th>Tipe Jadwal</Th>
                                    <Th>Shift ID</Th>
                                    <Th>Catatan</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        colSpan="7"
                                        loading={loading}
                                        emptyText="Jadwal tidak ditemukan."
                                    />
                                ) : (
                                    rows.map((schedule) => (
                                        <tr
                                            key={schedule.id}
                                            className="border-t border-[#f1f1f1]"
                                        >
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {schedule.employee?.name ||
                                                        "-"}
                                                </p>
                                            </Td>
                                            <Td>
                                                {schedule.employee
                                                    ?.employee_number ?? "-"}
                                            </Td>
                                            <Td>
                                                {schedule.schedule_date ?? "-"}
                                            </Td>
                                            <Td>
                                                <span className="inline-block rounded-[6px] bg-[#E8F4F8] px-[8px] py-[4px] text-[11px] font-medium text-[#047AF7]">
                                                    {schedule.schedule_type}
                                                </span>
                                            </Td>
                                            <Td>{schedule.shift_id ?? "-"}</Td>
                                            <Td>{schedule.notes ?? "-"}</Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(schedule)
                                                        }
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit jadwal"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faPen}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() =>
                                                            deleteSchedule(
                                                                schedule,
                                                            )
                                                        }
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#ffd4d4] text-[#d9534f] hover:bg-[#fff5f5] disabled:opacity-50"
                                                        title="Hapus jadwal"
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
                    title={editing ? "Edit Jadwal" : "Tambah Jadwal & Shift"}
                    subtitle="Penugasan jam kerja dan shift pegawai MEDIVA"
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

                            <Field label="Tanggal Jadwal *" required>
                                <input
                                    required
                                    type="date"
                                    value={form.schedule_date}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            schedule_date: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Tipe Jadwal" required>
                                <select
                                    required
                                    value={form.schedule_type}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            schedule_type: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="regular">Regular</option>
                                    <option value="shift">Shift</option>
                                    <option value="oncall">On-Call</option>
                                </select>
                            </Field>

                            <Field label="ID Shift (Opsional)">
                                <input
                                    type="number"
                                    value={form.shift_id}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            shift_id: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="Contoh: 1, 2, atau 3"
                                />
                            </Field>

                            <div className="md:col-span-2">
                                <Field label="Catatan Jadwal (Opsional)">
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
                                        placeholder="Tulis instruksi atau catatan penugasan di sini..."
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
                                {saving ? "Menyimpan..." : "Simpan Jadwal"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}
