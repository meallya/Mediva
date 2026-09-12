import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDoorOpen,
    faPen,
    faToggleOff,
    faToggleOn,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import roomService from "../services/roomService";
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
    textareaClass,
} from "../../shared/masterDataUtils";

const roomTypeLabels = {
    outpatient: "Rawat Jalan",
    inpatient: "Rawat Inap",
    emergency: "IGD",
    operating: "Ruang Operasi",
    laboratory: "Laboratorium",
    radiology: "Radiologi",
    pharmacy: "Farmasi",
    office: "Office",
    warehouse: "Gudang",
    other: "Lainnya",
};

const emptyForm = {
    unit_id: "",
    code: "",
    name: "",
    room_type: "other",
    floor: "",
    capacity: "1",
    notes: "",
    is_active: true,
};

export default function RoomListPage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(normalizeMeta());
    const [options, setOptions] = useState({
        units: [],
        room_types: [],
    });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [roomType, setRoomType] = useState("all");
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

    const loadOptions = async () => {
        try {
            const response = await roomService.getOptions();
            setOptions(response?.data ?? { units: [], room_types: [] });
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat pilihan ruangan."));
        }
    };

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await roomService.getAll({
                page,
                search: search.trim(),
                status,
                room_type: roomType,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta(normalizeMeta(response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat data ruangan."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => load(1), 250);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, roomType]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setModalOpen(true);
    };

    const openEdit = (room) => {
        setEditing(room);
        setForm({
            unit_id: room.unit_id ? String(room.unit_id) : "",
            code: room.code ?? "",
            name: room.name ?? "",
            room_type: room.room_type ?? "other",
            floor: room.floor ?? "",
            capacity: String(room.capacity ?? 1),
            notes: room.notes ?? "",
            is_active: Boolean(room.is_active),
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
                unit_id: form.unit_id ? Number(form.unit_id) : null,
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
                room_type: form.room_type,
                floor: form.floor.trim() || null,
                capacity: Number(form.capacity || 1),
                notes: form.notes.trim() || null,
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await roomService.update(editing.id, payload);
                flash("Ruangan berhasil diperbarui.");
            } else {
                await roomService.create(payload);
                flash("Ruangan berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan data ruangan."));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (room) => {
        try {
            setSaving(true);
            setError("");
            await roomService.toggleStatus(room.id);
            await load(meta.current_page);
            flash("Status ruangan berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status ruangan."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Master Ruangan"
                    subtitle="Master ruangan lintas klinis, operasional, dan office untuk kebutuhan MEDIVA berikutnya."
                    buttonLabel="Tambah Ruangan"
                    onCreate={openCreate}
                    icon={faDoorOpen}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[1fr_220px_190px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari kode, nama ruangan, lantai, atau unit..."
                        />

                        <select
                            value={roomType}
                            onChange={(event) => setRoomType(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Jenis Ruang</option>
                            {(options.room_types ?? []).map((type) => (
                                <option key={type} value={type}>
                                    {roomTypeLabels[type] ?? type}
                                </option>
                            ))}
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

                <div className="mt-[16px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Kode</Th>
                                    <Th>Nama Ruangan</Th>
                                    <Th>Unit</Th>
                                    <Th>Jenis</Th>
                                    <Th>Lantai</Th>
                                    <Th>Kapasitas</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={8}
                                        emptyText="Belum ada data ruangan."
                                    />
                                ) : (
                                    rows.map((room) => (
                                        <tr
                                            key={room.id}
                                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                        >
                                            <Td>{room.code}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {room.name}
                                                </p>
                                            </Td>
                                            <Td>{room.unit?.name ?? "Umum"}</Td>
                                            <Td>
                                                {roomTypeLabels[room.room_type]
                                                    ?? room.room_type}
                                            </Td>
                                            <Td>{room.floor ?? "-"}</Td>
                                            <Td>{room.capacity ?? 1}</Td>
                                            <Td>
                                                <StatusBadge active={room.is_active} />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(room)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit ruangan"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => toggleStatus(room)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        title="Ubah status"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                room.is_active
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
                    title={editing ? "Edit Ruangan" : "Tambah Ruangan"}
                    subtitle="Master ruangan MEDIVA"
                    onClose={() => setModalOpen(false)}
                >
                    <form
                        onSubmit={save}
                        className="p-[20px]"
                        data-enter-scope
                    >
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <Field label="Kode Ruangan" required>
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
                                    placeholder="RANAP-201"
                                />
                            </Field>

                            <Field label="Nama Ruangan" required>
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
                                    placeholder="Ruang Rawat 201"
                                />
                            </Field>

                            <Field label="Unit">
                                <select
                                    value={form.unit_id}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            unit_id: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="">Umum / Belum ditentukan</option>
                                    {(options.units ?? []).map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name} — {unit.code}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Jenis Ruangan" required>
                                <select
                                    value={form.room_type}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            room_type: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    {(options.room_types ?? Object.keys(roomTypeLabels)).map(
                                        (type) => (
                                            <option key={type} value={type}>
                                                {roomTypeLabels[type] ?? type}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>

                            <Field label="Lantai">
                                <input
                                    value={form.floor}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            floor: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder="Lantai 2"
                                />
                            </Field>

                            <Field label="Kapasitas" required>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="9999"
                                    value={form.capacity}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            capacity: event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </Field>

                            <div className="md:col-span-2">
                                <Field label="Catatan">
                                    <textarea
                                        value={form.notes}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                notes: event.target.value,
                                            }))
                                        }
                                        className={textareaClass}
                                        placeholder="Catatan ruangan..."
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
                            Ruangan aktif
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
