import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPen,
    faToggleOff,
    faToggleOn,
    faUserDoctor,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import doctorService from "../services/doctorService";
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
    employee_id: "",
    sip_number: "",
    specialization: "",
    unit_ids: [],
    is_active: true,
};

export default function DoctorListPage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(normalizeMeta());
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [options, setOptions] = useState({
        employees: [],
        units: [],
    });

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

            const response = await doctorService.getAll({
                page,
                search: search.trim(),
                status,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta(normalizeMeta(response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data dokter."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => load(1), 250);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status]);

    const loadOptions = async (doctorId = null) => {
        const response = await doctorService.getOptions(doctorId);

        setOptions({
            employees: Array.isArray(response?.employees)
                ? response.employees
                : [],
            units: Array.isArray(response?.units)
                ? response.units
                : [],
        });
    };

    const openCreate = async () => {
        try {
            setError("");
            await loadOptions();
            setEditing(null);
            setForm(emptyForm);
            setModalOpen(true);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat pilihan dokter."));
        }
    };

    const openEdit = async (doctor) => {
        try {
            setError("");
            await loadOptions(doctor.id);

            setEditing(doctor);
            setForm({
                employee_id: doctor.employee_id
                    ? String(doctor.employee_id)
                    : "",
                sip_number: doctor.sip_number ?? "",
                specialization: doctor.specialization ?? "",
                unit_ids: Array.isArray(doctor.units)
                    ? doctor.units.map((unit) => String(unit.id))
                    : [],
                is_active: Boolean(doctor.is_active),
            });

            setModalOpen(true);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat detail dokter."));
        }
    };

    const toggleUnit = (unitId) => {
        const stringId = String(unitId);

        setForm((prev) => ({
            ...prev,
            unit_ids: prev.unit_ids.includes(stringId)
                ? prev.unit_ids.filter((id) => id !== stringId)
                : [...prev.unit_ids, stringId],
        }));
    };

    const save = async (event) => {
        event.preventDefault();

        if (form.unit_ids.length === 0) {
            setError("Pilih minimal satu poli / unit dokter.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                employee_id: Number(form.employee_id),
                sip_number: form.sip_number.trim() || null,
                specialization: form.specialization.trim() || null,
                unit_ids: form.unit_ids.map(Number),
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await doctorService.update(editing.id, payload);
                flash("Data dokter berhasil diperbarui.");
            } else {
                await doctorService.create(payload);
                flash("Dokter berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan data dokter."));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (doctor) => {
        try {
            setSaving(true);
            setError("");
            await doctorService.toggleStatus(doctor.id);
            await load(meta.current_page);
            flash("Status dokter berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status dokter."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Master Dokter"
                    subtitle="Profil klinis dokter tetap terhubung ke satu master pegawai dan satu atau lebih poli."
                    buttonLabel="Tambah Dokter"
                    onCreate={openCreate}
                    icon={faUserDoctor}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_200px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari nama dokter, nomor pegawai, SIP, atau spesialisasi..."
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
                        <table className="w-full min-w-[980px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Dokter</Th>
                                    <Th>No. Pegawai</Th>
                                    <Th>SIP</Th>
                                    <Th>Spesialisasi</Th>
                                    <Th>Poli / Unit</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={7}
                                        emptyText="Belum ada data dokter."
                                    />
                                ) : (
                                    rows.map((doctor) => (
                                        <tr
                                            key={doctor.id}
                                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                        >
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {doctor.employee?.name ?? "-"}
                                                </p>
                                            </Td>
                                            <Td>
                                                {doctor.employee?.employee_number ?? "-"}
                                            </Td>
                                            <Td>{doctor.sip_number ?? "-"}</Td>
                                            <Td>{doctor.specialization ?? "-"}</Td>
                                            <Td>
                                                <div className="flex max-w-[320px] flex-wrap gap-[5px]">
                                                    {(doctor.units ?? []).length > 0
                                                        ? doctor.units.map((unit) => (
                                                            <span
                                                                key={unit.id}
                                                                className="rounded-full bg-[#eef7ff] px-[8px] py-[4px] text-[11px] text-[#047AF7]"
                                                            >
                                                                {unit.name}
                                                            </span>
                                                        ))
                                                        : "-"}
                                                </div>
                                            </Td>
                                            <Td>
                                                <StatusBadge active={doctor.is_active} />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(doctor)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit dokter"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => toggleStatus(doctor)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        title="Ubah status"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                doctor.is_active
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
                    title={editing ? "Edit Dokter" : "Tambah Dokter"}
                    subtitle="Profil dokter dibuat dari pegawai yang sudah ada"
                    onClose={() => setModalOpen(false)}
                >
                    <form
                        onSubmit={save}
                        className="p-[20px]"
                        data-enter-scope
                    >
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Pegawai" required>
                                <select
                                    required
                                    value={form.employee_id}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            employee_id: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="">Pilih pegawai</option>
                                    {options.employees.map((employee) => (
                                        <option
                                            key={employee.id}
                                            value={employee.id}
                                        >
                                            {employee.employee_number
                                                ? `${employee.employee_number} — `
                                                : ""}
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Nomor SIP">
                                <input
                                    value={form.sip_number}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            sip_number: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="SIP-xxxx"
                                />
                            </Field>

                            <Field label="Spesialisasi">
                                <input
                                    value={form.specialization}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            specialization: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="Dokter Umum"
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
                                    Dokter aktif
                                </label>
                            </Field>
                        </div>

                        <div className="mt-[16px]">
                            <Field
                                label="Poli / Unit"
                                required
                                helper="Dokter dapat bekerja di lebih dari satu poli. Ini berbeda dengan role aktif user."
                            >
                                <div className="grid max-h-[220px] grid-cols-1 gap-[7px] overflow-y-auto rounded-[10px] border border-[#dddddd] p-[10px] md:grid-cols-2">
                                    {options.units.length === 0 ? (
                                        <p className="col-span-full px-[4px] py-[8px] text-[12px] text-[#999999]">
                                            Belum ada poli aktif.
                                        </p>
                                    ) : (
                                        options.units.map((unit) => {
                                            const checked = form.unit_ids.includes(
                                                String(unit.id),
                                            );

                                            return (
                                                <label
                                                    key={unit.id}
                                                    className={`flex cursor-pointer items-center gap-[9px] rounded-[8px] border px-[10px] py-[9px] text-[12px] transition ${
                                                        checked
                                                            ? "border-[#7EBDEC] bg-[#f1f8ff] text-[#047AF7]"
                                                            : "border-[#eeeeee] text-[#555555] hover:bg-[#fafafa]"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleUnit(unit.id)
                                                        }
                                                    />
                                                    <span>
                                                        {unit.name}
                                                        <span className="ml-[5px] text-[10px] text-[#999999]">
                                                            {unit.code}
                                                        </span>
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </Field>
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
                                {saving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}
