import React, { useEffect, useState } from "react";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";

import { operatingRoomService } from "../services/operatingRoomService";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const initialTypeForm = {
    code: "",
    name: "",
    default_duration_minutes: 60,
    default_tariff: 0,
    is_active: true,
};

const initialRoomForm = {
    code: "",
    name: "",
    hospital_room_id: "",
    status: "available",
    is_active: true,
};

export default function OperatingRoomMasterPage() {
    const [types, setTypes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [typeForm, setTypeForm] = useState(initialTypeForm);
    const [roomForm, setRoomForm] = useState(initialRoomForm);
    const [loading, setLoading] = useState(true);
    const [savingType, setSavingType] = useState(false);
    const [savingRoom, setSavingRoom] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const [typeRes, roomRes] = await Promise.all([
                operatingRoomService.getOperationTypes(),
                operatingRoomService.getRooms(),
            ]);

            setTypes(typeRes?.data ?? []);
            setRooms(roomRes?.data ?? []);
        } catch (err) {
            setError(
                err?.data?.message ??
                    err?.message ??
                    "Gagal memuat master kamar operasi.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const addType = async (event) => {
        event.preventDefault();

        try {
            setSavingType(true);
            setError("");
            setSuccess("");

            await operatingRoomService.createOperationType({
                ...typeForm,
                default_duration_minutes: Number(
                    typeForm.default_duration_minutes,
                ),
                default_tariff: Number(typeForm.default_tariff || 0),
            });

            setTypeForm(initialTypeForm);
            setSuccess("Jenis operasi berhasil ditambahkan.");
            await load();
        } catch (err) {
            setError(
                err?.data?.message ??
                    err?.message ??
                    "Jenis operasi gagal disimpan.",
            );
        } finally {
            setSavingType(false);
        }
    };

    const addRoom = async (event) => {
        event.preventDefault();

        try {
            setSavingRoom(true);
            setError("");
            setSuccess("");

            await operatingRoomService.createRoom({
                ...roomForm,
                hospital_room_id: roomForm.hospital_room_id
                    ? Number(roomForm.hospital_room_id)
                    : null,
            });

            setRoomForm(initialRoomForm);
            setSuccess("Kamar operasi berhasil ditambahkan.");
            await load();
        } catch (err) {
            setError(
                err?.data?.message ??
                    err?.message ??
                    "Kamar operasi gagal disimpan.",
            );
        } finally {
            setSavingRoom(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <Link
                    to="/clinical/operating-room"
                    className="mb-[18px] inline-flex h-[38px] items-center gap-[7px] rounded-[9px] border border-[#dddddd] bg-white px-[13px] text-[11px] font-medium text-[#666666] transition hover:border-[#1688f8] hover:text-[#1688f8]"
                >
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        className="text-[10px]"
                    />
                    Kembali ke Kamar Operasi
                </Link>

                <div>
                    <h1 className="text-[24px] font-semibold text-[#343434]">
                        Master Kamar Operasi
                    </h1>

                    <p className="mt-[5px] text-[12px] text-[#999999]">
                        Kelola jenis operasi dan kamar operasi MEDIVA.
                    </p>
                </div>

                {error && (
                    <div className="mt-[18px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-[18px] rounded-[10px] border border-[#CDE8E5] bg-[#CDE8E5]/25 px-[14px] py-[11px] text-[12px] text-[#5c9292]">
                        {success}
                    </div>
                )}

                <div className="mt-[22px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                        <SectionTitle
                            title="Jenis Operasi"
                            subtitle="Master tindakan operasi dan tarif default."
                        />

                        <form
                            onSubmit={addType}
                            className="mt-[18px] space-y-[14px]"
                        >
                            <Field label="Kode Jenis Operasi" required>
                                <input
                                    value={typeForm.code}
                                    onChange={(e) =>
                                        setTypeForm((prev) => ({
                                            ...prev,
                                            code: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="Contoh: OP-001"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Nama Jenis Operasi" required>
                                <input
                                    value={typeForm.name}
                                    onChange={(e) =>
                                        setTypeForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="Nama jenis operasi"
                                    className={inputClass}
                                />
                            </Field>

                            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                                <Field label="Durasi Default">
                                    <div className="flex h-[42px] overflow-hidden rounded-[9px] border border-[#dddddd] bg-white focus-within:border-[#1688f8]">
                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                typeForm.default_duration_minutes
                                            }
                                            onChange={(e) =>
                                                setTypeForm((prev) => ({
                                                    ...prev,
                                                    default_duration_minutes:
                                                        e.target.value,
                                                }))
                                            }
                                            className="min-w-0 flex-1 bg-transparent px-[12px] text-[13px] text-[#444444] outline-none"
                                        />
                                        <span className="flex items-center border-l border-[#eeeeee] bg-[#fafafa] px-[10px] text-[10px] text-[#999999]">
                                            menit
                                        </span>
                                    </div>
                                </Field>

                                <Field label="Tarif Default">
                                    <input
                                        type="number"
                                        min="0"
                                        value={typeForm.default_tariff}
                                        onChange={(e) =>
                                            setTypeForm((prev) => ({
                                                ...prev,
                                                default_tariff: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                </Field>
                            </div>

                            <button
                                type="submit"
                                disabled={savingType}
                                className={primaryButtonClass}
                            >
                                {savingType
                                    ? "Menyimpan..."
                                    : "+ Tambah Jenis Operasi"}
                            </button>
                        </form>

                        <MasterList
                            loading={loading}
                            empty="Belum ada jenis operasi."
                            rows={types.map((item) => ({
                                id: item.id,
                                title: item.name,
                                code: item.code,
                                meta: `${item.default_duration_minutes ?? "-"} menit`,
                            }))}
                        />
                    </section>

                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                        <SectionTitle
                            title="Kamar Operasi"
                            subtitle="Kelola kamar operasi dan status ketersediaannya."
                        />

                        <form
                            onSubmit={addRoom}
                            className="mt-[18px] space-y-[14px]"
                        >
                            <Field label="Kode Kamar" required>
                                <input
                                    value={roomForm.code}
                                    onChange={(e) =>
                                        setRoomForm((prev) => ({
                                            ...prev,
                                            code: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="Contoh: OK-01"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Nama Kamar Operasi" required>
                                <input
                                    value={roomForm.name}
                                    onChange={(e) =>
                                        setRoomForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="Nama kamar operasi"
                                    className={inputClass}
                                />
                            </Field>

                            <Field
                                label="ID Ruangan RS"
                                hint="Opsional. Nanti kita sambungkan ke dropdown Master Ruangan RS."
                            >
                                <input
                                    type="number"
                                    min="1"
                                    value={roomForm.hospital_room_id}
                                    onChange={(e) =>
                                        setRoomForm((prev) => ({
                                            ...prev,
                                            hospital_room_id: e.target.value,
                                        }))
                                    }
                                    placeholder="Kosongkan jika belum terhubung"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Status Kamar">
                                <select
                                    value={roomForm.status}
                                    onChange={(e) =>
                                        setRoomForm((prev) => ({
                                            ...prev,
                                            status: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="available">Tersedia</option>
                                    <option value="maintenance">
                                        Maintenance
                                    </option>
                                    <option value="inactive">
                                        Tidak Aktif
                                    </option>
                                </select>
                            </Field>

                            <button
                                type="submit"
                                disabled={savingRoom}
                                className={primaryButtonClass}
                            >
                                {savingRoom
                                    ? "Menyimpan..."
                                    : "+ Tambah Kamar Operasi"}
                            </button>
                        </form>

                        <MasterList
                            loading={loading}
                            empty="Belum ada kamar operasi."
                            rows={rooms.map((item) => ({
                                id: item.id,
                                title: item.name,
                                code: item.code,
                                meta: roomStatusLabel(item.status),
                            }))}
                        />
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}

const inputClass = `
    h-[42px]
    w-full
    rounded-[9px]
    border
    border-[#dddddd]
    bg-white
    px-[12px]
    text-[13px]
    text-[#444444]
    outline-none
    transition
    placeholder:text-[#bbbbbb]
    focus:border-[#1688f8]
`;

const primaryButtonClass = `
    inline-flex
    h-[42px]
    w-full
    items-center
    justify-center
    rounded-[9px]
    bg-[#1688f8]
    px-[17px]
    text-[12px]
    font-medium
    text-white
    transition
    hover:bg-[#0f7be8]
    disabled:cursor-not-allowed
    disabled:opacity-50
`;

function Field({ label, hint, required = false, children }) {
    return (
        <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                {label}
                {required && <span className="ml-[3px] text-red-400">*</span>}
            </label>
            {children}
            {hint && (
                <p className="mt-[5px] text-[10px] text-[#aaaaaa]">{hint}</p>
            )}
        </div>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <div>
            <h2 className="text-[15px] font-semibold text-[#343434]">
                {title}
            </h2>
            <p className="mt-[2px] text-[11px] text-[#999999]">{subtitle}</p>
        </div>
    );
}

function MasterList({ loading, rows, empty }) {
    return (
        <div className="mt-[20px] border-t border-[#eeeeee] pt-[16px]">
            <p className="mb-[10px] text-[11px] font-medium text-[#888888]">
                Data Tersimpan
            </p>

            {loading ? (
                <p className="py-[14px] text-[11px] text-[#aaaaaa]">
                    Memuat data...
                </p>
            ) : rows.length === 0 ? (
                <p className="rounded-[9px] bg-[#fafafa] px-[12px] py-[14px] text-[11px] text-[#aaaaaa]">
                    {empty}
                </p>
            ) : (
                <div className="space-y-[8px]">
                    {rows.map((row) => (
                        <div
                            key={row.id}
                            className="flex items-center justify-between gap-[12px] rounded-[10px] border border-[#eeeeee] px-[13px] py-[11px]"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-[#444444]">
                                    {row.title}
                                </p>
                                <p className="mt-[2px] text-[10px] text-[#999999]">
                                    {row.code || "-"}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#eaf4ff] px-[9px] py-[4px] text-[9px] font-medium text-[#1688f8]">
                                {row.meta || "-"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function roomStatusLabel(status) {
    const labels = {
        available: "Tersedia",
        maintenance: "Maintenance",
        inactive: "Tidak Aktif",
    };

    return labels[status] ?? status ?? "-";
}
