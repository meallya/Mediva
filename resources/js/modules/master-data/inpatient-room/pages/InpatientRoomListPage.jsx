import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBed,
    faCheck,
    faChevronDown,
    faPen,
    faToggleOff,
    faToggleOn,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import inpatientRoomService from "../services/inpatientRoomService";
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

const wardTypeLabels = {
    inpatient: "Rawat Inap",
    icu: "ICU",
    hcu: "HCU",
    nicu: "NICU",
    picu: "PICU",
    isolation: "Isolasi",
    perinatology: "Perinatologi",
    maternity: "Kebidanan",
};

const roomClassLabels = {
    vvip: "VVIP",
    vip: "VIP",
    class_1: "Kelas 1",
    class_2: "Kelas 2",
    class_3: "Kelas 3",
    non_class: "Non Kelas / Khusus",
};

const emptyForm = {
    room_id: "",
    ward_type: "inpatient",
    room_class: "non_class",
    bed_capacity: "1",
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
                    {selectOptions.length === 0 ? (
                        <div className="px-[14px] py-[10px] text-[12px] text-[#999999]">
                            Tidak ada pilihan tersedia.
                        </div>
                    ) : (
                        selectOptions.map((option) => {
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
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default function InpatientRoomListPage() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(normalizeMeta());
    const [options, setOptions] = useState({
        rooms: [],
        ward_types: [],
        room_classes: [],
    });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [wardType, setWardType] = useState("all");
    const [roomClass, setRoomClass] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const flash = (message) => {
        setSuccess(message);
        window.setTimeout(() => setSuccess(""), 2500);
    };

    const loadOptions = async () => {
        try {
            const response = await inpatientRoomService.getOptions();
            setOptions(
                response?.data ?? {
                    rooms: [],
                    ward_types: [],
                    room_classes: [],
                },
            );
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat pilihan kamar rawat inap."));
        }
    };

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await inpatientRoomService.getAll({
                page,
                search: search.trim(),
                status,
                ward_type: wardType,
                room_class: roomClass,
                per_page: 20,
            });

            setRows(Array.isArray(response?.data) ? response.data : []);
            setMeta(normalizeMeta(response));
        } catch (err) {
            setError(getErrorMessage(err, "Gagal memuat kamar rawat inap."));
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
    }, [search, status, wardType, roomClass]);

    const availableRoomOptions = (options.rooms ?? [])
        .filter((room) => {
            if (!room.inpatient_room_id) {
                return true;
            }

            return editing && Number(room.inpatient_room_id) === Number(editing.id);
        })
        .map((room) => ({
            value: String(room.id),
            label: `${room.name} — ${room.code}${room.unit?.name ? ` — ${room.unit.name}` : ""}`,
        }));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            room_id: String(row.room_id ?? ""),
            ward_type: row.ward_type ?? "inpatient",
            room_class: row.room_class ?? "non_class",
            bed_capacity: String(row.bed_capacity ?? 1),
            notes: row.notes ?? "",
            is_active: Boolean(row.is_active),
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
                room_id: Number(form.room_id),
                ward_type: form.ward_type,
                room_class: form.room_class,
                bed_capacity: Number(form.bed_capacity || 1),
                notes: form.notes.trim() || null,
                is_active: Boolean(form.is_active),
            };

            if (editing) {
                await inpatientRoomService.update(editing.id, payload);
                flash("Kamar rawat inap berhasil diperbarui.");
            } else {
                await inpatientRoomService.create(payload);
                flash("Kamar rawat inap berhasil ditambahkan.");
            }

            setModalOpen(false);
            await Promise.all([
                load(meta.current_page),
                loadOptions(),
            ]);
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menyimpan kamar rawat inap."));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (row) => {
        try {
            setSaving(true);
            setError("");
            await inpatientRoomService.toggleStatus(row.id);
            await load(meta.current_page);
            flash("Status kamar rawat inap berhasil diubah.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal mengubah status kamar rawat inap."));
        } finally {
            setSaving(false);
        }
    };

    const removeInpatientRoom = async () => {
        if (!deleteTarget) return;

        try {
            setSaving(true);
            setError("");
            await inpatientRoomService.destroy(deleteTarget.id);
            setDeleteTarget(null);
            await Promise.all([
                load(meta.current_page),
                loadOptions(),
            ]);
            flash("Kamar rawat inap berhasil dihapus.");
        } catch (err) {
            setError(getErrorMessage(err, "Gagal menghapus kamar rawat inap."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <MasterDataHeader
                    title="Kamar Rawat Inap"
                    subtitle="Profil rawat inap yang terhubung ke Ruangan RS bertipe Rawat Inap. Bed individual akan dikelola pada Bed Management."
                    buttonLabel="Tambah Kamar Rawat Inap"
                    onCreate={openCreate}
                    icon={faBed}
                />

                <MasterDataAlert error={error} success={success} />

                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[16px]">
                    <div className="grid grid-cols-1 gap-[12px] xl:grid-cols-[1fr_190px_190px_180px]">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder="Cari kamar, kode ruangan, lantai, atau unit..."
                        />

                        <select
                            value={wardType}
                            onChange={(event) => setWardType(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Jenis Perawatan</option>
                            {(options.ward_types ?? []).map((type) => (
                                <option key={type} value={type}>
                                    {wardTypeLabels[type] ?? type}
                                </option>
                            ))}
                        </select>

                        <select
                            value={roomClass}
                            onChange={(event) => setRoomClass(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">Semua Kelas</option>
                            {(options.room_classes ?? []).map((type) => (
                                <option key={type} value={type}>
                                    {roomClassLabels[type] ?? type}
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
                        <table className="w-full min-w-[1050px]">
                            <thead className="bg-[#fafbfc]">
                                <tr className="border-b border-[#eeeeee]">
                                    <Th>Kode</Th>
                                    <Th>Kamar / Ruangan</Th>
                                    <Th>Unit</Th>
                                    <Th>Jenis Perawatan</Th>
                                    <Th>Kelas</Th>
                                    <Th>Kapasitas Bed</Th>
                                    <Th>Lantai</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading || rows.length === 0 ? (
                                    <TableEmpty
                                        loading={loading}
                                        colSpan={9}
                                        emptyText="Belum ada kamar rawat inap."
                                    />
                                ) : (
                                    rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfdff]"
                                        >
                                            <Td>{row.room?.code ?? "-"}</Td>
                                            <Td>
                                                <p className="font-medium text-[#343434]">
                                                    {row.room?.name ?? "-"}
                                                </p>
                                            </Td>
                                            <Td>{row.room?.unit?.name ?? "Belum ditentukan"}</Td>
                                            <Td>{wardTypeLabels[row.ward_type] ?? row.ward_type}</Td>
                                            <Td>{roomClassLabels[row.room_class] ?? row.room_class}</Td>
                                            <Td>{row.bed_capacity ?? 1}</Td>
                                            <Td>{row.room?.floor ?? "-"}</Td>
                                            <Td>
                                                <StatusBadge active={row.is_active} />
                                            </Td>
                                            <Td>
                                                <div className="flex gap-[6px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(row)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#dddddd] text-[#666666] hover:bg-[#f8f8f8]"
                                                        title="Edit kamar rawat inap"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => toggleStatus(row)}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#C2E1F4] text-[#047AF7] hover:bg-[#f4f9ff] disabled:opacity-50"
                                                        title="Ubah status"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={row.is_active ? faToggleOn : faToggleOff}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => {
                                                            setError("");
                                                            setDeleteTarget(row);
                                                        }}
                                                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[#f3c7c7] text-[#d9534f] hover:bg-[#fff7f7] disabled:opacity-50"
                                                        title="Hapus kamar rawat inap"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
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
                    title={editing ? "Edit Kamar Rawat Inap" : "Tambah Kamar Rawat Inap"}
                    subtitle="Kamar rawat inap harus berasal dari Ruangan RS dengan jenis Rawat Inap."
                    onClose={() => setModalOpen(false)}
                >
                    <form onSubmit={save} className="p-[20px]" data-enter-scope>
                        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                            <div className="md:col-span-2">
                                <Field
                                    label="Ruangan RS"
                                    required
                                    helper="Jika pilihan kosong, buat atau ubah Ruangan RS menjadi jenis Rawat Inap terlebih dahulu."
                                >
                                    <ModalSelect
                                        value={form.room_id}
                                        onChange={(nextValue) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                room_id: String(nextValue),
                                            }))
                                        }
                                        options={availableRoomOptions}
                                        placeholder="Pilih ruangan RS"
                                    />
                                </Field>
                            </div>

                            <Field label="Jenis Perawatan" required>
                                <ModalSelect
                                    value={form.ward_type}
                                    onChange={(nextValue) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            ward_type: String(nextValue),
                                        }))
                                    }
                                    options={(options.ward_types ?? Object.keys(wardTypeLabels)).map((type) => ({
                                        value: type,
                                        label: wardTypeLabels[type] ?? type,
                                    }))}
                                    placeholder="Pilih jenis perawatan"
                                />
                            </Field>

                            <Field label="Kelas Kamar" required>
                                <ModalSelect
                                    value={form.room_class}
                                    onChange={(nextValue) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            room_class: String(nextValue),
                                        }))
                                    }
                                    options={(options.room_classes ?? Object.keys(roomClassLabels)).map((type) => ({
                                        value: type,
                                        label: roomClassLabels[type] ?? type,
                                    }))}
                                    placeholder="Pilih kelas kamar"
                                />
                            </Field>

                            <Field
                                label="Kapasitas Bed"
                                required
                                helper="Jumlah maksimal bed untuk kamar ini. Bed individual dibuat nanti di Bed Management."
                            >
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="9999"
                                    value={form.bed_capacity}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            bed_capacity: event.target.value,
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
                                        placeholder="Catatan kamar rawat inap..."
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
                            Kamar rawat inap aktif
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
                                disabled={saving || !form.room_id}
                                className="h-[40px] rounded-[9px] bg-[#047AF7] px-[16px] text-[13px] font-medium text-white disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {deleteTarget && (
                <Modal
                    title="Hapus Kamar Rawat Inap"
                    subtitle="Menghapus profil kamar tidak menghapus Ruangan RS yang terhubung."
                    onClose={() => !saving && setDeleteTarget(null)}
                >
                    <div className="p-[20px]">
                        <p className="text-[13px] leading-[1.7] text-[#555555]">
                            Hapus profil kamar <span className="font-semibold text-[#333333]">{deleteTarget.room?.name ?? "-"}</span>?
                        </p>

                        <p className="mt-[8px] text-[12px] leading-[1.6] text-[#999999]">
                            Ruangan RS tetap tersimpan. Jika kamar sudah dipakai oleh data lain, MEDIVA akan menolak penghapusan.
                        </p>

                        <div className="mt-[22px] flex justify-end gap-[9px]">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setDeleteTarget(null)}
                                className="h-[40px] rounded-[9px] border border-[#dddddd] px-[15px] text-[13px] text-[#555555] disabled:opacity-50"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={removeInpatientRoom}
                                className="h-[40px] rounded-[9px] bg-[#d9534f] px-[16px] text-[13px] font-medium text-white disabled:opacity-50"
                            >
                                {saving ? "Menghapus..." : "Hapus Kamar"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

        </DashboardLayout>
    );
}
