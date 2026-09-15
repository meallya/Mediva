import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faChevronDown,
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
    inpatient: "Rawat Inap",
    outpatient: "Rawat Jalan / Poli",
    emergency: "IGD",
    operating: "Ruang Operasi",
    laboratory: "Laboratorium",
    radiology: "Radiologi",
    pharmacy: "Farmasi",
    office: "Office / Administrasi",
    warehouse: "Gudang",
    support: "Penunjang / Utilitas",
    public: "Area Publik",
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

function ModalSelect({
    value,
    onChange,
    options: selectOptions,
    placeholder = "Pilih data",
}) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                wrapperRef.current
                && !wrapperRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const selectedOption = selectOptions.find(
        (option) => String(option.value) === String(value),
    );

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                className={`${inputClass} flex items-center justify-between gap-[10px] text-left`}
            >
                <span
                    className={`min-w-0 flex-1 truncate ${
                        selectedOption ? "text-[#444444]" : "text-[#999999]"
                    }`}
                >
                    {selectedOption?.label ?? placeholder}
                </span>

                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`shrink-0 text-[11px] text-[#666666] transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-[220px] overflow-y-auto rounded-[9px] border border-[#d8d8d8] bg-white py-[5px] shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
                    {selectOptions.map((option) => {
                        const active = String(option.value) === String(value);

                        return (
                            <button
                                key={String(option.value)}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-[12px] px-[14px] py-[9px] text-left text-[13px] transition ${
                                    active
                                        ? "bg-[#eef6ff] font-medium text-[#047AF7]"
                                        : "text-[#444444] hover:bg-[#f7f9fb]"
                                }`}
                            >
                                <span className="min-w-0 flex-1 truncate">
                                    {option.label}
                                </span>

                                {active && (
                                    <FontAwesomeIcon
                                        icon={faCheck}
                                        className="shrink-0 text-[11px]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function RoomListPage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(normalizeMeta());
    const [options, setOptions] = useState({ units: [], room_types: [] });

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
            setError(getErrorMessage(err, "Gagal memuat pilihan ruangan RS."));
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
            setError(getErrorMessage(err, "Gagal memuat data ruangan RS."));
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
                flash("Ruangan RS berhasil diperbarui.");
            } else {
                await roomService.create(payload);
                flash("Ruangan RS berhasil ditambahkan.");
            }

            setModalOpen(false);
            await load(meta.current_page);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan data ruangan RS."));
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
            flash("Status ruangan RS berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status ruangan RS."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Master Ruangan RS"
                    subtitle="Seluruh ruangan fisik rumah sakit. Ruangan bertipe Rawat Inap dapat dikonfigurasi lebih lanjut pada menu Kamar Rawat Inap."
                    buttonLabel="Tambah Ruangan RS"
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
                            <option value="all">Semua Jenis Ruangan</option>
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
                        <table className="w-full min-w-[1040px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Kode</Th>
                                    <Th>Nama Ruangan</Th>
                                    <Th>Unit</Th>
                                    <Th>Jenis</Th>
                                    <Th>Lantai</Th>
                                    <Th>Kapasitas Ruang</Th>
                                    <Th>Rawat Inap</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={9}
                                        emptyText="Belum ada data ruangan RS."
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
                                            <Td>{room.unit?.name ?? "Belum ditentukan"}</Td>
                                            <Td>{roomTypeLabels[room.room_type] ?? room.room_type ?? "-"}</Td>
                                            <Td>{room.floor ?? "-"}</Td>
                                            <Td>{room.capacity ?? 1}</Td>
                                            <Td>
                                                {room.inpatient_room ? (
                                                    <span className="inline-flex rounded-full border border-[#C2E1F4] bg-[#f4f9ff] px-[8px] py-[4px] text-[11px] font-medium text-[#047AF7]">
                                                        Terhubung
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-[#999999]">-</span>
                                                )}
                                            </Td>
                                            <Td>
                                                <StatusBadge active={room.is_active} />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(room)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit ruangan RS"
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
                                                            icon={room.is_active ? faToggleOn : faToggleOff}
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
                    title={editing ? "Edit Ruangan RS" : "Tambah Ruangan RS"}
                    subtitle="Data lokasi fisik ruangan di rumah sakit."
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={save} className="p-[20px]" data-enter-scope>
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
                                    placeholder="RI-MAWAR-01"
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
                                    placeholder="Ruang Mawar"
                                />
                            </Field>

                            <Field label="Unit">
                                <ModalSelect
                                    value={form.unit_id}
                                    onChange={(nextValue) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            unit_id: String(nextValue),
                                        }))
                                    }
                                    options={[
                                        { value: "", label: "Belum ditentukan" },
                                        ...(options.units ?? []).map((unit) => ({
                                            value: String(unit.id),
                                            label: `${unit.name} — ${unit.code}`,
                                        })),
                                    ]}
                                    placeholder="Pilih unit"
                                />
                            </Field>

                            <Field
                                label="Jenis Ruangan"
                                required
                                helper="Pilih Rawat Inap jika ruangan ini nantinya memiliki profil kamar/bed."
                            >
                                <ModalSelect
                                    value={form.room_type}
                                    onChange={(nextValue) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            room_type: String(nextValue),
                                        }))
                                    }
                                    options={(options.room_types?.length
                                        ? options.room_types
                                        : Object.keys(roomTypeLabels)
                                    ).map((type) => ({
                                        value: type,
                                        label: roomTypeLabels[type] ?? type,
                                    }))}
                                    placeholder="Pilih jenis ruangan"
                                />
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

                            <Field
                                label="Kapasitas Ruang"
                                required
                                helper="Kapasitas umum ruangan, bukan jumlah bed. Kapasitas bed diatur pada Kamar Rawat Inap."
                            >
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
