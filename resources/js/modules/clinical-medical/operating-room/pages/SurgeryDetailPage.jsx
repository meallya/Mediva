import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import SafetyChecklistPanel from "../components/SafetyChecklistPanel";
import SurgeryStatusBadge from "../components/SurgeryStatusBadge";
import UsageForm from "../components/UsageForm";
import { operatingRoomService } from "../services/operatingRoomService";
import { dateTime, priorityLabel } from "../utils/operatingRoom";

const terminalStatuses = ["completed", "cancelled"];
const usageStatuses = ["preop", "ready", "in_progress", "recovery"];

export default function SurgeryDetailPage() {
    const { id } = useParams();

    const [surgery, setSurgery] = useState(null);
    const [options, setOptions] = useState({ rooms: [], team_roles: [] });
    const [tab, setTab] = useState("ringkasan");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await operatingRoomService.getSurgery(id);
            setSurgery(response?.data ?? null);
        } catch (err) {
            setError(errorMessage(err, "Gagal memuat detail operasi."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();

        operatingRoomService
            .getOptions()
            .then((response) => setOptions(response?.data ?? {}))
            .catch(() => null);
    }, [id]);

    const checklist = surgery?.safety_checklist || {};

    const actions = useMemo(() => {
        if (!surgery) return [];

        return [
            surgery.status === "ready"
                ? ["Mulai Operasi", () => operatingRoomService.startSurgery(id)]
                : null,
            surgery.status === "in_progress"
                ? ["Selesai Operasi", () => operatingRoomService.finishSurgery(id)]
                : null,
            surgery.status === "recovery"
                ? ["Tutup Episode Operasi", () => operatingRoomService.completeSurgery(id)]
                : null,
        ].filter(Boolean);
    }, [surgery, id]);

    const canCancel = surgery && ["requested", "scheduled", "preop", "ready"].includes(surgery.status);

    const runAction = async (fn, message = "Perubahan berhasil disimpan.") => {
        try {
            setActionLoading(true);
            setError("");
            setSuccess("");
            await fn();
            await load();
            setSuccess(message);
        } catch (err) {
            setError(errorMessage(err, "Aksi gagal diproses."));
        } finally {
            setActionLoading(false);
        }
    };

    const cancelSurgery = async () => {
        const reason = window.prompt("Masukkan alasan pembatalan operasi:");
        if (!reason?.trim()) return;

        await runAction(
            () => operatingRoomService.cancelSurgery(id, { reason: reason.trim() }),
            "Operasi berhasil dibatalkan.",
        );
    };

    if (loading && !surgery) {
        return (
            <DashboardLayout>
                <PageShell>
                    <Notice>Memuat detail operasi...</Notice>
                </PageShell>
            </DashboardLayout>
        );
    }

    if (!surgery) {
        return (
            <DashboardLayout>
                <PageShell>
                    <ErrorNotice>{error || "Data operasi tidak ditemukan."}</ErrorNotice>
                </PageShell>
            </DashboardLayout>
        );
    }

    const tabs = [
        ["ringkasan", "Ringkasan"],
        ["jadwal", "Jadwal"],
        ["tim", "Tim Operasi"],
        ["klinis", "Data Klinis"],
        ["checklist", "Checklist"],
        ["pemakaian", "Pemakaian"],
        ["pemulihan", "Pemulihan"],
        ["riwayat", "Riwayat"],
    ];

    const isTerminal = terminalStatuses.includes(surgery.status);
    const preOperationLocked = ["in_progress", "recovery", "completed", "cancelled"].includes(surgery.status);
    const signOutDisabled = !["in_progress", "recovery"].includes(surgery.status);

    return (
        <DashboardLayout>
            <PageShell>
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                    <div>
                        <Link
                            to="/clinical/operating-room/surgeries"
                            className="inline-flex h-[38px] items-center gap-[7px] rounded-[9px] border border-[#dddddd] bg-white px-[13px] text-[11px] font-medium text-[#666666] transition hover:border-[#1688f8] hover:text-[#1688f8]"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
                            Kembali ke Daftar Operasi
                        </Link>

                        <p className="mt-[12px] text-[11px] font-semibold text-[#1688f8]">
                            {surgery.surgery_number || "-"}
                        </p>

                        <h1 className="mt-[3px] text-[24px] font-semibold text-[#343434]">
                            {surgery.patient?.name || "Pasien"}
                        </h1>

                        <div className="mt-[9px] flex flex-wrap items-center gap-[7px]">
                            <SurgeryStatusBadge status={surgery.status} />
                            <span className="rounded-full bg-[#f3f4f6] px-[9px] py-[4px] text-[10px] font-medium text-[#666666]">
                                {priorityLabel[surgery.priority] || surgery.priority || "-"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-[8px]">
                        {actions.map(([label, fn]) => (
                            <button
                                key={label}
                                type="button"
                                disabled={actionLoading}
                                onClick={() => runAction(fn, `${label} berhasil diproses.`)}
                                className="inline-flex h-[40px] items-center rounded-[9px] bg-[#1688f8] px-[15px] text-[11px] font-medium text-white transition hover:bg-[#0f7be8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {actionLoading ? "Memproses..." : label}
                            </button>
                        ))}

                        {canCancel && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={cancelSurgery}
                                className="inline-flex h-[40px] items-center rounded-[9px] border border-red-200 bg-white px-[15px] text-[11px] font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            >
                                Batalkan
                            </button>
                        )}
                    </div>
                </div>

                {error && <ErrorNotice className="mt-[16px]">{error}</ErrorNotice>}
                {success && <SuccessNotice className="mt-[16px]">{success}</SuccessNotice>}

                <div className="mt-[22px] flex gap-[6px] overflow-x-auto border-b border-[#e8e8e8] pb-[10px]">
                    {tabs.map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTab(value)}
                            className={`whitespace-nowrap rounded-[8px] px-[13px] py-[8px] text-[11px] font-medium transition ${
                                tab === value
                                    ? "bg-[#eaf4ff] text-[#1688f8]"
                                    : "text-[#777777] hover:bg-white hover:text-[#1688f8]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === "ringkasan" && <SummaryTab surgery={surgery} />}

                {tab === "jadwal" && (
                    <ScheduleForm
                        surgery={surgery}
                        rooms={options.rooms || []}
                        disabled={isTerminal || ["in_progress", "recovery"].includes(surgery.status)}
                        onSaved={async () => {
                            await load();
                            setSuccess("Jadwal operasi berhasil diperbarui.");
                        }}
                        onError={setError}
                    />
                )}

                {tab === "tim" && (
                    <TeamForm
                        surgery={surgery}
                        roles={options.team_roles || []}
                        disabled={isTerminal || surgery.status === "recovery"}
                        onSaved={async () => {
                            await load();
                            setSuccess("Tim operasi berhasil diperbarui.");
                        }}
                        onError={setError}
                    />
                )}

                {tab === "klinis" && (
                    <ClinicalForm
                        surgery={surgery}
                        disabled={isTerminal}
                        onSaved={async () => {
                            await load();
                            setSuccess("Data klinis operasi berhasil diperbarui.");
                        }}
                        onError={setError}
                    />
                )}

                {tab === "checklist" && (
                    <div className="mt-[18px] grid grid-cols-1 gap-[16px] xl:grid-cols-2">
                        <ChecklistBlock title="Pra Operasi">
                            <SafetyChecklistPanel
                                phase="preoperative"
                                initialItems={checklist.preoperative_checklist}
                                disabled={preOperationLocked}
                                onSave={(items) => saveChecklist(id, "preoperative", items, load, setError, setSuccess)}
                            />
                        </ChecklistBlock>

                        <ChecklistBlock title="Sign In">
                            <SafetyChecklistPanel
                                phase="sign-in"
                                initialItems={checklist.sign_in}
                                disabled={preOperationLocked}
                                onSave={(items) => saveChecklist(id, "sign-in", items, load, setError, setSuccess)}
                            />
                        </ChecklistBlock>

                        <ChecklistBlock title="Time Out">
                            <SafetyChecklistPanel
                                phase="time-out"
                                initialItems={checklist.time_out}
                                disabled={preOperationLocked}
                                onSave={(items) => saveChecklist(id, "time-out", items, load, setError, setSuccess)}
                            />
                        </ChecklistBlock>

                        <ChecklistBlock title="Sign Out">
                            <SafetyChecklistPanel
                                phase="sign-out"
                                initialItems={checklist.sign_out}
                                disabled={signOutDisabled || isTerminal}
                                onSave={(items) => saveChecklist(id, "sign-out", items, load, setError, setSuccess)}
                            />
                        </ChecklistBlock>
                    </div>
                )}

                {tab === "pemakaian" && (
                    <div className="mt-[18px] space-y-[16px]">
                        {usageStatuses.includes(surgery.status) ? (
                            <UsageForm
                                onSubmit={async (payload) => {
                                    try {
                                        setError("");
                                        await operatingRoomService.addUsage(id, payload);
                                        await load();
                                        setSuccess("Pemakaian berhasil dicatat.");
                                    } catch (err) {
                                        const message = errorMessage(err, "Pemakaian gagal dicatat.");
                                        setError(message);
                                        throw err;
                                    }
                                }}
                            />
                        ) : (
                            <Notice>
                                Pemakaian dapat dicatat pada tahap pra operasi, siap operasi, operasi berlangsung, atau pemulihan.
                            </Notice>
                        )}

                        <UsageHistory usages={surgery.usages || []} />
                    </div>
                )}

                {tab === "pemulihan" && (
                    <div className="mt-[18px]">
                        {surgery.status === "recovery" ? (
                            <RecoveryForm
                                surgery={surgery}
                                reload={load}
                                onError={setError}
                                onSuccess={setSuccess}
                            />
                        ) : surgery.recovery ? (
                            <RecoverySummary recovery={surgery.recovery} />
                        ) : (
                            <Notice>Data pemulihan tersedia setelah operasi selesai.</Notice>
                        )}
                    </div>
                )}

                {tab === "riwayat" && <HistoryTab histories={surgery.histories || []} />}
            </PageShell>
        </DashboardLayout>
    );
}

function SummaryTab({ surgery }) {
    return (
        <div className="mt-[18px] grid grid-cols-1 gap-[14px] lg:grid-cols-2">
            <Info title="Diagnosis Pra Operasi" value={surgery.preoperative_diagnosis} />
            <Info title="Rencana Tindakan" value={surgery.planned_procedure} />
            <Info title="Jenis Operasi" value={surgery.operation_type?.name} />
            <Info title="Kamar Operasi" value={surgery.operating_room?.name} />
            <Info title="Jadwal Mulai" value={dateTime(surgery.scheduled_start_at)} />
            <Info title="Jadwal Selesai" value={dateTime(surgery.scheduled_end_at)} />
            <Info title="Dokter Operator" value={doctorName(surgery.operator_doctor)} />
            <Info title="Dokter Anestesi" value={doctorName(surgery.anesthesiologist_doctor)} />
            <Info title="Status Puasa" value={formatValue(surgery.fasting_status)} />
            <Info title="Persetujuan Tindakan" value={surgery.consent_obtained ? "Sudah" : "Belum"} />
            <Info title="Diagnosis Pasca Operasi" value={surgery.postoperative_diagnosis} />
            <Info title="Tindakan Operasi" value={surgery.performed_procedure} />
            <Info title="Komplikasi" value={surgery.complications || "Tidak tercatat"} />
            <Info
                title="Perdarahan"
                value={surgery.blood_loss_ml != null ? `${surgery.blood_loss_ml} ml` : "-"}
            />
            <Info title="Pemeriksaan Penunjang" value={surgery.supporting_examinations} wide />
            <Info title="Persiapan Pasien" value={surgery.patient_preparation} wide />
            <Info title="Catatan Operasi" value={surgery.operation_notes} wide />
            <Info title="Instruksi Pasca Operasi" value={surgery.postoperative_instructions} wide />
            {surgery.cancel_reason && <Info title="Alasan Pembatalan" value={surgery.cancel_reason} wide />}
        </div>
    );
}

function ScheduleForm({ surgery, rooms, disabled, onSaved, onError }) {
    const [form, setForm] = useState({
        operating_room_id: surgery.operating_room_id || "",
        scheduled_start_at: toLocalInput(surgery.scheduled_start_at),
        scheduled_end_at: toLocalInput(surgery.scheduled_end_at),
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({
            operating_room_id: surgery.operating_room_id || "",
            scheduled_start_at: toLocalInput(surgery.scheduled_start_at),
            scheduled_end_at: toLocalInput(surgery.scheduled_end_at),
        });
    }, [surgery.id, surgery.operating_room_id, surgery.scheduled_start_at, surgery.scheduled_end_at]);

    const submit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            onError("");
            await operatingRoomService.scheduleSurgery(surgery.id, {
                operating_room_id: Number(form.operating_room_id),
                scheduled_start_at: form.scheduled_start_at,
                scheduled_end_at: form.scheduled_end_at,
            });
            await onSaved();
        } catch (err) {
            onError(errorMessage(err, "Jadwal operasi gagal disimpan."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="mt-[18px] grid grid-cols-1 gap-[14px] rounded-[14px] border border-[#ececec] bg-white p-[18px] md:grid-cols-2">
            <Field label="Kamar Operasi">
                <select
                    value={form.operating_room_id}
                    required
                    disabled={disabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, operating_room_id: e.target.value }))}
                    className={inputClass}
                >
                    <option value="">Pilih kamar operasi</option>
                    {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                            {room.code} - {room.name}
                        </option>
                    ))}
                </select>
            </Field>

            <div />

            <Field label="Tanggal & Jam Mulai">
                <input
                    type="datetime-local"
                    required
                    disabled={disabled}
                    value={form.scheduled_start_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, scheduled_start_at: e.target.value }))}
                    className={inputClass}
                />
            </Field>

            <Field label="Tanggal & Jam Selesai">
                <input
                    type="datetime-local"
                    required
                    disabled={disabled}
                    value={form.scheduled_end_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, scheduled_end_at: e.target.value }))}
                    className={inputClass}
                />
            </Field>

            {!disabled && (
                <button type="submit" disabled={saving} className={primaryButtonClass + " md:col-span-2"}>
                    {saving ? "Menyimpan..." : "Simpan Jadwal Operasi"}
                </button>
            )}
        </form>
    );
}

function TeamForm({ surgery, roles, disabled, onSaved, onError }) {
    const seedMembers = useMemo(() => {
        if (surgery.team_members?.length) return surgery.team_members;

        return [
            { role: "operator", doctor_id: surgery.operator_doctor_id || "", employee_id: "", display_name: "", notes: "" },
            { role: "anesthesiologist", doctor_id: surgery.anesthesiologist_doctor_id || "", employee_id: "", display_name: "", notes: "" },
            { role: "assistant", doctor_id: "", employee_id: "", display_name: "", notes: "" },
            { role: "instrument_nurse", doctor_id: "", employee_id: "", display_name: "", notes: "" },
            { role: "circulating_nurse", doctor_id: "", employee_id: "", display_name: "", notes: "" },
        ];
    }, [surgery]);

    const [members, setMembers] = useState(seedMembers);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMembers(seedMembers);
    }, [seedMembers]);

    const roleOptions = roles.length
        ? roles
        : [
              ["operator", "Dokter Operator"],
              ["anesthesiologist", "Dokter Anestesi"],
              ["assistant", "Asisten"],
              ["instrument_nurse", "Perawat Instrumen"],
              ["circulating_nurse", "Perawat Sirkuler"],
              ["other", "Lainnya"],
          ].map(([value, label]) => ({ value, label }));

    const update = (index, key, value) => {
        setMembers((prev) =>
            prev.map((member, memberIndex) =>
                memberIndex === index ? { ...member, [key]: value } : member,
            ),
        );
    };

    const submit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            onError("");

            const payload = members
                .filter((member) => member.doctor_id || member.employee_id || member.display_name)
                .map((member) => ({
                    role: member.role,
                    doctor_id: member.doctor_id ? Number(member.doctor_id) : null,
                    employee_id: member.employee_id ? Number(member.employee_id) : null,
                    display_name: member.display_name || null,
                    notes: member.notes || null,
                }));

            await operatingRoomService.saveTeam(surgery.id, { members: payload });
            await onSaved();
        } catch (err) {
            onError(errorMessage(err, "Tim operasi gagal disimpan."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="mt-[18px] space-y-[10px]">
            {members.map((member, index) => (
                <div key={`${member.role}-${index}`} className="grid grid-cols-1 gap-[10px] rounded-[12px] border border-[#ececec] bg-white p-[14px] md:grid-cols-5">
                    <select
                        disabled={disabled}
                        value={member.role}
                        onChange={(e) => update(index, "role", e.target.value)}
                        className={inputClass}
                    >
                        {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        placeholder="ID Dokter"
                        value={member.doctor_id || ""}
                        onChange={(e) => update(index, "doctor_id", e.target.value)}
                        className={inputClass}
                    />
                    <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        placeholder="ID Pegawai"
                        value={member.employee_id || ""}
                        onChange={(e) => update(index, "employee_id", e.target.value)}
                        className={inputClass}
                    />
                    <input
                        disabled={disabled}
                        placeholder="Nama tampilan"
                        value={member.display_name || ""}
                        onChange={(e) => update(index, "display_name", e.target.value)}
                        className={inputClass}
                    />
                    <input
                        disabled={disabled}
                        placeholder="Catatan"
                        value={member.notes || ""}
                        onChange={(e) => update(index, "notes", e.target.value)}
                        className={inputClass}
                    />
                </div>
            ))}

            {!disabled && (
                <div className="flex flex-wrap gap-[8px]">
                    <button
                        type="button"
                        onClick={() => setMembers((prev) => [...prev, { role: "other", doctor_id: "", employee_id: "", display_name: "", notes: "" }])}
                        className={secondaryButtonClass}
                    >
                        + Tambah Anggota
                    </button>
                    <button type="submit" disabled={saving} className={primaryButtonClass}>
                        {saving ? "Menyimpan..." : "Simpan Tim Operasi"}
                    </button>
                </div>
            )}
        </form>
    );
}

function ClinicalForm({ surgery, disabled, onSaved, onError }) {
    const [form, setForm] = useState(clinicalSeed(surgery));
    const [saving, setSaving] = useState(false);

    useEffect(() => setForm(clinicalSeed(surgery)), [surgery]);

    const change = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            onError("");
            await operatingRoomService.updateSurgery(surgery.id, {
                ...form,
                blood_loss_ml: form.blood_loss_ml === "" ? null : Number(form.blood_loss_ml),
            });
            await onSaved();
        } catch (err) {
            onError(errorMessage(err, "Data klinis gagal disimpan."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="mt-[18px] grid grid-cols-1 gap-[14px] rounded-[14px] border border-[#ececec] bg-white p-[18px] md:grid-cols-2">
            <TextField label="Diagnosis Pra Operasi" name="preoperative_diagnosis" form={form} change={change} disabled={disabled} />
            <TextField label="Rencana Tindakan" name="planned_procedure" form={form} change={change} disabled={disabled} />
            <TextField label="Pemeriksaan Penunjang" name="supporting_examinations" form={form} change={change} disabled={disabled} />
            <TextField label="Persiapan Pasien" name="patient_preparation" form={form} change={change} disabled={disabled} />

            <Field label="Status Puasa">
                <select name="fasting_status" value={form.fasting_status} onChange={change} disabled={disabled} className={inputClass}>
                    <option value="not_required">Tidak Diperlukan</option>
                    <option value="not_started">Belum Mulai</option>
                    <option value="in_progress">Sedang Puasa</option>
                    <option value="adequate">Adekuat</option>
                    <option value="not_adequate">Belum Adekuat</option>
                </select>
            </Field>

            <label className="flex items-center gap-[9px] rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]">
                <input name="consent_obtained" type="checkbox" disabled={disabled} checked={form.consent_obtained} onChange={change} className="h-[16px] w-[16px] accent-[#1688f8]" />
                <span className="text-[12px] text-[#555555]">Persetujuan tindakan sudah diperoleh</span>
            </label>

            <TextField label="Diagnosis Pasca Operasi" name="postoperative_diagnosis" form={form} change={change} disabled={disabled} />
            <TextField label="Tindakan Operasi" name="performed_procedure" form={form} change={change} disabled={disabled} />
            <TextField label="Catatan Operasi" name="operation_notes" form={form} change={change} disabled={disabled} rows={5} />
            <TextField label="Komplikasi" name="complications" form={form} change={change} disabled={disabled} rows={5} />

            <Field label="Perdarahan (ml)">
                <input name="blood_loss_ml" type="number" min="0" disabled={disabled} value={form.blood_loss_ml} onChange={change} className={inputClass} />
            </Field>

            <Field label="Status Pasien Pasca Operasi">
                <select name="postoperative_patient_status" value={form.postoperative_patient_status} onChange={change} disabled={disabled} className={inputClass}>
                    <option value="">Belum ditentukan</option>
                    <option value="stable">Stabil</option>
                    <option value="observation">Observasi</option>
                    <option value="ward">Rawat Inap</option>
                    <option value="icu">ICU</option>
                    <option value="hcu">HCU</option>
                    <option value="referred">Dirujuk</option>
                    <option value="deceased">Meninggal</option>
                </select>
            </Field>

            <div className="md:col-span-2">
                <TextField label="Instruksi Pasca Operasi" name="postoperative_instructions" form={form} change={change} disabled={disabled} rows={5} />
            </div>

            {!disabled && (
                <button type="submit" disabled={saving} className={primaryButtonClass + " md:col-span-2"}>
                    {saving ? "Menyimpan..." : "Simpan Data Klinis"}
                </button>
            )}
        </form>
    );
}

function UsageHistory({ usages }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[18px]">
            <h2 className="text-[15px] font-semibold text-[#343434]">Riwayat Pemakaian</h2>
            <div className="mt-[12px] space-y-[8px]">
                {usages.length ? (
                    usages.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-[12px] rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]">
                            <div>
                                <p className="text-[12px] font-medium text-[#444444]">{item.item_name}</p>
                                <p className="mt-[2px] text-[10px] text-[#999999]">{formatValue(item.usage_type)} · {item.billable ? "Billable" : "Non-billable"}</p>
                            </div>
                            <p className="text-[11px] font-semibold text-[#555555]">{item.quantity} {item.unit}</p>
                        </div>
                    ))
                ) : (
                    <p className="py-[14px] text-[11px] text-[#aaaaaa]">Belum ada pemakaian obat, bahan medis, atau alat.</p>
                )}
            </div>
        </div>
    );
}

function RecoveryForm({ surgery, reload, onError, onSuccess }) {
    const current = surgery.recovery || {};
    const [form, setForm] = useState(recoverySeed(current));
    const [saving, setSaving] = useState(false);

    useEffect(() => setForm(recoverySeed(surgery.recovery || {})), [surgery.recovery]);

    const submit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            onError("");
            await operatingRoomService.saveRecovery(surgery.id, {
                ...form,
                pain_score: form.pain_score === "" ? null : Number(form.pain_score),
                aldrete_score: form.aldrete_score === "" ? null : Number(form.aldrete_score),
                vital_signs: {
                    blood_pressure: form.blood_pressure || null,
                    pulse: form.pulse === "" ? null : Number(form.pulse),
                    respiratory_rate: form.respiratory_rate === "" ? null : Number(form.respiratory_rate),
                    temperature: form.temperature === "" ? null : Number(form.temperature),
                    spo2: form.spo2 === "" ? null : Number(form.spo2),
                },
            });
            await reload();
            onSuccess("Data pemulihan berhasil disimpan.");
        } catch (err) {
            onError(errorMessage(err, "Data pemulihan gagal disimpan."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 gap-[14px] rounded-[14px] border border-[#ececec] bg-white p-[18px] md:grid-cols-2">
            <Field label="Kesadaran">
                <input value={form.consciousness} onChange={(e) => setForm((prev) => ({ ...prev, consciousness: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Tekanan Darah"><input value={form.blood_pressure} placeholder="120/80" onChange={(e) => setForm((prev) => ({ ...prev, blood_pressure: e.target.value }))} className={inputClass} /></Field>
            <Field label="Nadi / menit"><input type="number" min="0" value={form.pulse} onChange={(e) => setForm((prev) => ({ ...prev, pulse: e.target.value }))} className={inputClass} /></Field>
            <Field label="Respirasi / menit"><input type="number" min="0" value={form.respiratory_rate} onChange={(e) => setForm((prev) => ({ ...prev, respiratory_rate: e.target.value }))} className={inputClass} /></Field>
            <Field label="Suhu (°C)"><input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((prev) => ({ ...prev, temperature: e.target.value }))} className={inputClass} /></Field>
            <Field label="SpO₂ (%)"><input type="number" min="0" max="100" value={form.spo2} onChange={(e) => setForm((prev) => ({ ...prev, spo2: e.target.value }))} className={inputClass} /></Field>
            <Field label="Skor Nyeri (0-10)"><input type="number" min="0" max="10" value={form.pain_score} onChange={(e) => setForm((prev) => ({ ...prev, pain_score: e.target.value }))} className={inputClass} /></Field>
            <Field label="Aldrete Score"><input type="number" min="0" max="10" value={form.aldrete_score} onChange={(e) => setForm((prev) => ({ ...prev, aldrete_score: e.target.value }))} className={inputClass} /></Field>
            <Field label="Status Pemulihan">
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className={inputClass}>
                    <option value="waiting">Menunggu</option>
                    <option value="observing">Observasi</option>
                    <option value="ready_transfer">Siap Transfer</option>
                    <option value="transferred">Sudah Transfer</option>
                    <option value="escalated">Eskalasi</option>
                </select>
            </Field>
            <label className="flex items-center gap-[9px] rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]">
                <input type="checkbox" checked={form.nausea_vomiting} onChange={(e) => setForm((prev) => ({ ...prev, nausea_vomiting: e.target.checked }))} className="h-[16px] w-[16px] accent-[#1688f8]" />
                <span className="text-[12px] text-[#555555]">Mual / Muntah</span>
            </label>
            <div className="md:col-span-2">
                <Field label="Catatan Pemulihan">
                    <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows="4" className={textareaClass} />
                </Field>
            </div>
            <button type="submit" disabled={saving} className={primaryButtonClass + " md:col-span-2"}>
                {saving ? "Menyimpan..." : "Simpan Pemulihan"}
            </button>
        </form>
    );
}

function RecoverySummary({ recovery }) {
    return (
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            <Info title="Status Pemulihan" value={formatValue(recovery.status)} />
            <Info title="Kesadaran" value={recovery.consciousness} />
            <Info title="Skor Nyeri" value={recovery.pain_score} />
            <Info title="Aldrete Score" value={recovery.aldrete_score} />
            <Info title="Mulai Pemulihan" value={dateTime(recovery.recovery_started_at)} />
            <Info title="Selesai Pemulihan" value={dateTime(recovery.recovery_ended_at)} />
            <Info title="Catatan" value={recovery.notes} wide />
        </div>
    );
}

function HistoryTab({ histories }) {
    return (
        <div className="mt-[18px] space-y-[8px]">
            {histories.length ? (
                histories.map((item) => (
                    <div key={item.id} className="rounded-[12px] border border-[#ececec] bg-white px-[14px] py-[12px]">
                        <p className="text-[12px] font-semibold text-[#444444]">{formatValue(item.event)}</p>
                        <p className="mt-[3px] text-[10px] text-[#999999]">
                            {dateTime(item.created_at)} · {item.active_role || "role tidak tercatat"}
                        </p>
                    </div>
                ))
            ) : (
                <Notice>Belum ada riwayat operasi.</Notice>
            )}
        </div>
    );
}

async function saveChecklist(id, phase, items, load, setError, setSuccess) {
    try {
        setError("");
        await operatingRoomService.saveChecklist(id, phase, { items });
        await load();
        setSuccess("Checklist operasi berhasil disimpan.");
    } catch (err) {
        setError(errorMessage(err, "Checklist gagal disimpan."));
        throw err;
    }
}

function clinicalSeed(surgery) {
    return {
        preoperative_diagnosis: surgery.preoperative_diagnosis || "",
        planned_procedure: surgery.planned_procedure || "",
        fasting_status: surgery.fasting_status || "not_started",
        supporting_examinations: surgery.supporting_examinations || "",
        patient_preparation: surgery.patient_preparation || "",
        consent_obtained: Boolean(surgery.consent_obtained),
        postoperative_diagnosis: surgery.postoperative_diagnosis || "",
        performed_procedure: surgery.performed_procedure || "",
        operation_notes: surgery.operation_notes || "",
        complications: surgery.complications || "",
        blood_loss_ml: surgery.blood_loss_ml ?? "",
        postoperative_instructions: surgery.postoperative_instructions || "",
        postoperative_patient_status: surgery.postoperative_patient_status || "",
    };
}

function recoverySeed(current) {
    const vitals = current.vital_signs || {};
    return {
        consciousness: current.consciousness || "",
        blood_pressure: vitals.blood_pressure || "",
        pulse: vitals.pulse ?? "",
        respiratory_rate: vitals.respiratory_rate ?? "",
        temperature: vitals.temperature ?? "",
        spo2: vitals.spo2 ?? "",
        pain_score: current.pain_score ?? "",
        nausea_vomiting: Boolean(current.nausea_vomiting),
        aldrete_score: current.aldrete_score ?? "",
        status: current.status || "observing",
        notes: current.notes || "",
    };
}

function TextField({ label, name, form, change, disabled, rows = 4 }) {
    return (
        <Field label={label}>
            <textarea
                name={name}
                value={form[name]}
                onChange={change}
                disabled={disabled}
                rows={rows}
                className={textareaClass}
            />
        </Field>
    );
}

function Info({ title, value, wide = false }) {
    return (
        <div className={`rounded-[14px] border border-[#ececec] bg-white p-[18px] ${wide ? "lg:col-span-2" : ""}`}>
            <p className="text-[11px] font-medium text-[#999999]">{title}</p>
            <p className="mt-[5px] whitespace-pre-wrap text-[13px] font-medium leading-[1.6] text-[#444444]">
                {value === 0 ? 0 : value || "-"}
            </p>
        </div>
    );
}

function ChecklistBlock({ title, children }) {
    return (
        <div>
            <h2 className="mb-[8px] text-[13px] font-semibold text-[#444444]">{title}</h2>
            {children}
        </div>
    );
}

function PageShell({ children }) {
    return <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">{children}</div>;
}

function Notice({ children }) {
    return <div className="rounded-[14px] border border-[#ececec] bg-white p-[18px] text-[12px] text-[#888888]">{children}</div>;
}

function ErrorNotice({ children, className = "" }) {
    return <div className={`${className} rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600`}>{children}</div>;
}

function SuccessNotice({ children, className = "" }) {
    return <div className={`${className} rounded-[10px] border border-emerald-100 bg-emerald-50 px-[14px] py-[11px] text-[12px] text-emerald-600`}>{children}</div>;
}

function Field({ label, children }) {
    return (
        <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#555555]">{label}</label>
            {children}
        </div>
    );
}

function doctorName(doctor) {
    return doctor?.employee?.name ?? doctor?.name ?? "-";
}

function toLocalInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatValue(value) {
    if (!value) return "-";
    return String(value)
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function errorMessage(err, fallback) {
    const validation = err?.data?.errors;
    if (validation && typeof validation === "object") {
        const first = Object.values(validation).flat()?.[0];
        if (first) return first;
    }

    return err?.data?.message ?? err?.message ?? fallback;
}

const inputClass = `
    h-[42px] w-full rounded-[9px] border border-[#dddddd] bg-white px-[12px]
    text-[13px] text-[#444444] outline-none transition focus:border-[#1688f8]
    disabled:cursor-not-allowed disabled:bg-[#f7f7f7]
`;

const textareaClass = `
    w-full resize-y rounded-[9px] border border-[#dddddd] bg-white px-[12px] py-[10px]
    text-[13px] leading-[1.6] text-[#444444] outline-none transition focus:border-[#1688f8]
    disabled:cursor-not-allowed disabled:bg-[#f7f7f7]
`;

const primaryButtonClass = `
    inline-flex h-[42px] items-center justify-center rounded-[9px] bg-[#1688f8]
    px-[17px] text-[12px] font-medium text-white transition hover:bg-[#0f7be8]
    disabled:cursor-not-allowed disabled:opacity-50
`;

const secondaryButtonClass = `
    inline-flex h-[42px] items-center justify-center rounded-[9px] border border-[#dddddd]
    bg-white px-[17px] text-[12px] font-medium text-[#666666] transition hover:bg-[#f7f9fb]
`;
