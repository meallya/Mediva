import React, { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowLeft,
    faCheck,
    faClipboardList,
    faFloppyDisk,
    faHeartPulse,
    faLock,
    faNotesMedical,
    faSpinner,
    faStethoscope,
    faUserDoctor,
    faUserInjured,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import useAuth from "../../auth/hooks/useAuth";

import examinationService from "../services/examinationService";

import ClinicalCodingSection from "../components/ClinicalCodingSection";

import PrescriptionSection from "../../prescription/components/PrescriptionSection";

/*
|--------------------------------------------------------------------------
| INITIAL FORM
|--------------------------------------------------------------------------
*/

const initialForm = {
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",

    systolic: "",
    diastolic: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    weight: "",
    height: "",

    physical_examination: "",
    doctor_notes: "",
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getVisit(response) {
    if (response?.data?.visit_number) {
        return response.data;
    }

    if (response?.visit_number) {
        return response;
    }

    return null;
}

function getExamination(response) {
    if (response?.data?.id) {
        return response.data;
    }

    if (response?.id) {
        return response;
    }

    return null;
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function genderLabel(value) {
    const labels = {
        male: "Laki-laki",
        female: "Perempuan",
        M: "Laki-laki",
        F: "Perempuan",
        L: "Laki-laki",
        P: "Perempuan",
    };

    return labels[value] ?? value ?? "-";
}

function visitTypeLabel(value) {
    const labels = {
        outpatient: "Rawat Jalan",
        emergency: "IGD / Gawat Darurat",
        inpatient: "Rawat Inap",
        medical_checkup: "Medical Check Up",
        day_care: "Day Care",
        home_care: "Home Care",
        telemedicine: "Telemedicine",
    };

    return labels[value] ?? value ?? "-";
}

function toForm(examination) {
    if (!examination) {
        return {
            ...initialForm,
        };
    }

    return {
        subjective: examination.subjective ?? "",
        objective: examination.objective ?? "",
        assessment: examination.assessment ?? "",
        plan: examination.plan ?? "",

        systolic: examination.systolic ?? "",
        diastolic: examination.diastolic ?? "",
        heart_rate: examination.heart_rate ?? "",
        respiratory_rate: examination.respiratory_rate ?? "",
        temperature: examination.temperature ?? "",
        weight: examination.weight ?? "",
        height: examination.height ?? "",

        physical_examination: examination.physical_examination ?? "",

        doctor_notes: examination.doctor_notes ?? "",
    };
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function ExaminationPage() {
    const { visitId } = useParams();

    const { permissions = [] } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [visit, setVisit] = useState(null);

    const [examination, setExamination] = useState(null);

    const [form, setForm] = useState(initialForm);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [completing, setCompleting] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const canCreate = permissions.includes("examination.create");

    const canUpdate = permissions.includes("examination.update");

    const canComplete = permissions.includes("examination.complete");

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    const isCompleted = examination?.status === "completed";

    /*
    |--------------------------------------------------------------------------
    | LOAD VISIT
    |--------------------------------------------------------------------------
    */

    const loadVisit = async (showPageLoading = true) => {
        try {
            if (showPageLoading) {
                setLoading(true);
            }

            setError("");

            const response = await examinationService.getVisit(visitId);

            const visitData = getVisit(response);

            if (!visitData) {
                throw new Error("Data kunjungan tidak ditemukan.");
            }

            setVisit(visitData);

            const examinationData = visitData.examination ?? null;

            setExamination(examinationData);

            setForm(toForm(examinationData));
        } catch (error) {
            console.error("Gagal mengambil data pemeriksaan:", error);

            setError(error?.message ?? "Gagal mengambil data pemeriksaan.");
        } finally {
            if (showPageLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadVisit(true);
    }, [visitId]);

    /*
    |--------------------------------------------------------------------------
    | INPUT
    |--------------------------------------------------------------------------
    */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,

            [name]: value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | PAYLOAD
    |--------------------------------------------------------------------------
    */

    const buildPayload = () => {
        return {
            subjective: form.subjective || null,

            objective: form.objective || null,

            assessment: form.assessment || null,

            plan: form.plan || null,

            systolic: form.systolic ? Number(form.systolic) : null,

            diastolic: form.diastolic ? Number(form.diastolic) : null,

            heart_rate: form.heart_rate ? Number(form.heart_rate) : null,

            respiratory_rate: form.respiratory_rate
                ? Number(form.respiratory_rate)
                : null,

            temperature: form.temperature ? Number(form.temperature) : null,

            weight: form.weight ? Number(form.weight) : null,

            height: form.height ? Number(form.height) : null,

            physical_examination: form.physical_examination || null,

            doctor_notes: form.doctor_notes || null,
        };
    };

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {
        if (saving || isCompleted) {
            return;
        }

        try {
            setSaving(true);

            setError("");

            setSuccess("");

            const wasExisting = Boolean(examination);

            let response;

            /*
                |--------------------------------------------------------------------------
                | CREATE
                |--------------------------------------------------------------------------
                */

            if (!examination) {
                response = await examinationService.createExamination({
                    visit_id: Number(visitId),

                    ...buildPayload(),
                });
            } else {
                /*
                    |--------------------------------------------------------------------------
                    | UPDATE
                    |--------------------------------------------------------------------------
                    */

                response = await examinationService.updateExamination(
                    examination.id,
                    buildPayload(),
                );
            }

            const saved = getExamination(response);

            if (saved) {
                setExamination(saved);

                setForm(toForm(saved));
            }

            setSuccess(
                wasExisting
                    ? "Pemeriksaan berhasil diperbarui."
                    : "Pemeriksaan berhasil disimpan.",
            );

            /*
                |--------------------------------------------------------------------------
                | REFRESH WITHOUT FULL PAGE LOADING
                |--------------------------------------------------------------------------
                */

            await loadVisit(false);
        } catch (error) {
            console.error("Gagal menyimpan pemeriksaan:", error);

            const validation = error?.data?.errors;

            if (validation) {
                const first = Object.values(validation).flat().at(0);

                setError(first ?? "Validasi pemeriksaan gagal.");
            } else {
                setError(error?.message ?? "Gagal menyimpan pemeriksaan.");
            }
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | COMPLETE
    |--------------------------------------------------------------------------
    */

    const handleComplete = async () => {
        if (!examination) {
            setError("Simpan pemeriksaan terlebih dahulu.");

            return;
        }

        const confirmed = window.confirm(
            "Selesaikan pemeriksaan?\n\nSetelah diselesaikan, data pemeriksaan akan dikunci dan tidak dapat diubah.",
        );

        if (!confirmed) {
            return;
        }

        try {
            setCompleting(true);

            setError("");

            setSuccess("");

            /*
                |--------------------------------------------------------------------------
                | SAVE LAST CHANGES
                |--------------------------------------------------------------------------
                */

            if (canUpdate && !isCompleted) {
                await examinationService.updateExamination(
                    examination.id,
                    buildPayload(),
                );
            }

            /*
                |--------------------------------------------------------------------------
                | COMPLETE
                |--------------------------------------------------------------------------
                */

            await examinationService.completeExamination(examination.id);

            setSuccess("Pemeriksaan pasien berhasil diselesaikan.");

            await loadVisit(false);
        } catch (error) {
            console.error("Gagal menyelesaikan pemeriksaan:", error);

            setError(error?.message ?? "Gagal menyelesaikan pemeriksaan.");
        } finally {
            setCompleting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <DashboardLayout>
                <div
                    className="
                        flex
                        min-h-[calc(100vh-88px)]
                        items-center
                        justify-center
                        bg-[#fafbfc]
                    "
                >
                    <div className="text-center">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="
                                text-[24px]
                                text-[#1688f8]
                            "
                        />

                        <p
                            className="
                                mt-[10px]
                                text-[12px]
                                text-[#999999]
                            "
                        >
                            Memuat pemeriksaan...
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!visit) {
        return (
            <DashboardLayout>
                <div
                    className="
                        min-h-[calc(100vh-88px)]
                        bg-[#fafbfc]
                        p-[30px]
                    "
                >
                    <div
                        className="
                            rounded-[14px]
                            border
                            border-red-100
                            bg-white
                            p-[20px]
                        "
                    >
                        <p
                            className="
                                text-[13px]
                                text-red-600
                            "
                        >
                            {error || "Data kunjungan tidak ditemukan."}
                        </p>

                        <Link
                            to="/queues"
                            className="
                                mt-[15px]
                                inline-flex
                                items-center
                                gap-[7px]
                                text-[12px]
                                font-medium
                                text-[#1688f8]
                            "
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Kembali ke Antrean
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const patient = visit?.patient ?? {};

    const doctor = visit?.doctor ?? null;

    const doctorName = doctor?.employee?.name ?? doctor?.name ?? "-";

    const statusLabel = isCompleted
        ? "Pemeriksaan Selesai"
        : examination
          ? "Draft"
          : "Belum Disimpan";

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <DashboardLayout>
            <div
                data-enter-scope
                className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
            >
                {/* =========================================================
                    HEADER
                ========================================================== */}

                <div
                    className="
                        mb-[22px]
                        flex
                        flex-wrap
                        items-start
                        justify-between
                        gap-[20px]
                    "
                >
                    {/* LEFT */}

                    <div>
                        <Link
                            to="/queues"
                            className="
                                inline-flex
                                items-center
                                gap-[7px]
                                text-[12px]
                                font-medium
                                text-[#1688f8]
                            "
                        >
                            <FontAwesomeIcon
                                icon={faArrowLeft}
                                className="text-[10px]"
                            />
                            Kembali ke Antrean
                        </Link>

                        <h1
                            className="
                                mt-[14px]
                                text-[24px]
                                font-semibold
                                text-[#343434]
                            "
                        >
                            Pemeriksaan Dokter
                        </h1>

                        <p
                            className="
                                mt-[6px]
                                text-[12px]
                                text-[#999999]
                            "
                        >
                            SOAP, tanda vital, dan pemeriksaan fisik pasien
                        </p>
                    </div>

                    {/* RIGHT */}

                    <div
                        className="
                            flex
                            flex-wrap
                            items-start
                            gap-[24px]
                        "
                    >
                        <div>
                            <div
                                className="
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-[12px]
                                "
                            >
                                <h2
                                    className="
                                        text-[24px]
                                        font-semibold
                                        text-[#1f1f1f]
                                    "
                                >
                                    Pemeriksaan Pasien
                                </h2>

                                {patient?.id && (
                                    <Link
                                        to={`/medical-records/patients/${patient.id}`}
                                        className="
                                            inline-flex
                                            h-[40px]
                                            items-center
                                            justify-center
                                            rounded-[9px]
                                            border
                                            border-[#b9dcff]
                                            bg-white
                                            px-[14px]
                                            text-[12px]
                                            font-medium
                                            text-[#1688f8]
                                            transition
                                            hover:bg-[#f7fbff]
                                        "
                                    >
                                        Riwayat Medis
                                    </Link>
                                )}
                            </div>

                            <p
                                className="
                                    mt-[7px]
                                    text-[12px]
                                    text-[#999999]
                                "
                            >
                                Pemeriksaan dan catatan klinis pasien
                            </p>
                        </div>

                        <div
                            className="
                                flex
                                items-center
                                gap-[9px]
                            "
                        >
                            <span
                                className={`
                                    inline-flex
                                    min-h-[36px]
                                    items-center
                                    rounded-full
                                    px-[14px]
                                    text-[11px]
                                    font-medium

                                    ${
                                        isCompleted
                                            ? "bg-emerald-50 text-emerald-700"
                                            : examination
                                              ? "bg-[#eaf4ff] text-[#1688f8]"
                                              : "bg-amber-50 text-amber-700"
                                    }
                                `}
                            >
                                {statusLabel}
                            </span>

                            {isCompleted && (
                                <div
                                    className="
                                        flex
                                        h-[38px]
                                        w-[38px]
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#f1f1f1]
                                        text-[#888888]
                                    "
                                    title="Pemeriksaan dikunci"
                                >
                                    <FontAwesomeIcon
                                        icon={faLock}
                                        className="text-[13px]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* =========================================================
                    ALERT
                ========================================================== */}

                {error && (
                    <div
                        role="alert"
                        className="
                            mb-[16px]
                            rounded-[10px]
                            border
                            border-red-100
                            bg-red-50
                            px-[15px]
                            py-[12px]
                            text-[13px]
                            leading-[1.55]
                            text-red-600
                        "
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="
                            mb-[16px]
                            rounded-[10px]
                            border
                            border-emerald-100
                            bg-emerald-50
                            px-[15px]
                            py-[12px]
                            text-[13px]
                            leading-[1.55]
                            text-emerald-700
                        "
                    >
                        {success}
                    </div>
                )}

                {/* =========================================================
                    PATIENT INFORMATION
                ========================================================== */}

                <section
                    className="
                        mb-[18px]
                        rounded-[14px]
                        border
                        border-[#ececec]
                        bg-white
                        p-[20px]
                    "
                >
                    <SectionHeader
                        icon={faUserInjured}
                        title="Informasi Pasien"
                        subtitle="Data pasien dan kunjungan aktif"
                    />

                    <div
                        className="
                            mt-[20px]
                            grid
                            grid-cols-1
                            gap-x-[35px]
                            gap-y-[20px]
                            sm:grid-cols-2
                            xl:grid-cols-4
                        "
                    >
                        <Info label="Nama Pasien" value={patient?.name} />

                        <Info
                            label="No. Rekam Medis"
                            value={patient?.medical_record_number}
                        />

                        <Info
                            label="Jenis Kelamin"
                            value={genderLabel(patient?.gender)}
                        />

                        <Info label="NIK" value={patient?.nik} />

                        <Info
                            label="Nomor Kunjungan"
                            value={visit?.visit_number}
                        />

                        <Info
                            label="Jenis Kunjungan"
                            value={visitTypeLabel(visit?.visit_type)}
                        />

                        <Info label="Unit / Poli" value={visit?.unit?.name} />

                        <Info label="Dokter" value={doctorName} />
                    </div>
                </section>

                {/* =========================================================
                    VITAL SIGNS
                ========================================================== */}

                <section
                    className="
                        mb-[18px]
                        rounded-[14px]
                        border
                        border-[#ececec]
                        bg-white
                        p-[20px]
                    "
                >
                    <SectionHeader
                        icon={faHeartPulse}
                        title="Vital Signs"
                        subtitle="Tanda vital pasien saat pemeriksaan."
                    />

                    <div
                        className="
                            mt-[18px]
                            grid
                            grid-cols-1
                            gap-[14px]
                            sm:grid-cols-2
                            lg:grid-cols-4
                        "
                    >
                        <Input
                            label="Sistolik"
                            name="systolic"
                            value={form.systolic}
                            onChange={handleChange}
                            type="number"
                            suffix="mmHg"
                            disabled={isCompleted}
                        />

                        <Input
                            label="Diastolik"
                            name="diastolic"
                            value={form.diastolic}
                            onChange={handleChange}
                            type="number"
                            suffix="mmHg"
                            disabled={isCompleted}
                        />

                        <Input
                            label="Heart Rate"
                            name="heart_rate"
                            value={form.heart_rate}
                            onChange={handleChange}
                            type="number"
                            suffix="bpm"
                            disabled={isCompleted}
                        />

                        <Input
                            label="Respiratory Rate"
                            name="respiratory_rate"
                            value={form.respiratory_rate}
                            onChange={handleChange}
                            type="number"
                            suffix="/menit"
                            disabled={isCompleted}
                        />

                        <Input
                            label="Temperature"
                            name="temperature"
                            value={form.temperature}
                            onChange={handleChange}
                            type="number"
                            step="0.1"
                            suffix="°C"
                            disabled={isCompleted}
                        />

                        <Input
                            label="Weight"
                            name="weight"
                            value={form.weight}
                            onChange={handleChange}
                            type="number"
                            step="0.1"
                            suffix="kg"
                            disabled={isCompleted}
                        />

                        <Input
                            label="Height"
                            name="height"
                            value={form.height}
                            onChange={handleChange}
                            type="number"
                            step="0.1"
                            suffix="cm"
                            disabled={isCompleted}
                        />

                        <div>
                            <p
                                className="
                                    mb-[6px]
                                    text-[12px]
                                    font-medium
                                    text-[#555555]
                                "
                            >
                                Blood Pressure
                            </p>

                            <div
                                className="
                                    flex
                                    h-[42px]
                                    items-center
                                    rounded-[9px]
                                    border
                                    border-[#e0e0e0]
                                    bg-[#fafafa]
                                    px-[12px]
                                    text-[13px]
                                    text-[#555555]
                                "
                            >
                                {form.systolic || form.diastolic
                                    ? `${form.systolic || "-"} / ${form.diastolic || "-"} mmHg`
                                    : "-"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================================================
                    SOAP
                ========================================================== */}

                <section
                    className="
                        mb-[18px]
                        rounded-[14px]
                        border
                        border-[#ececec]
                        bg-white
                        p-[20px]
                    "
                >
                    <SectionHeader
                        icon={faNotesMedical}
                        title="SOAP"
                        subtitle="Catatan pemeriksaan medis terstruktur."
                    />

                    <div
                        className="
                            mt-[18px]
                            grid
                            grid-cols-1
                            gap-[16px]
                            xl:grid-cols-2
                        "
                    >
                        <Textarea
                            label="Subjective"
                            hint="Keluhan pasien, riwayat penyakit, gejala, dan informasi subjektif lainnya."
                            name="subjective"
                            value={form.subjective}
                            onChange={handleChange}
                            placeholder="Masukkan keluhan utama dan informasi subjektif pasien..."
                            disabled={isCompleted}
                        />

                        <Textarea
                            label="Objective"
                            hint="Temuan pemeriksaan objektif dan observasi klinis."
                            name="objective"
                            value={form.objective}
                            onChange={handleChange}
                            placeholder="Masukkan hasil pemeriksaan objektif..."
                            disabled={isCompleted}
                        />

                        <Textarea
                            label="Assessment"
                            hint="Penilaian klinis berdasarkan hasil anamnesis dan pemeriksaan."
                            name="assessment"
                            value={form.assessment}
                            onChange={handleChange}
                            placeholder="Masukkan assessment pasien..."
                            disabled={isCompleted}
                        />

                        <Textarea
                            label="Plan"
                            hint="Rencana terapi, pemeriksaan penunjang, tindakan, atau tindak lanjut."
                            name="plan"
                            value={form.plan}
                            onChange={handleChange}
                            placeholder="Masukkan rencana pelayanan pasien..."
                            disabled={isCompleted}
                        />
                    </div>
                </section>

                {/* =========================================================
                    PHYSICAL EXAMINATION
                ========================================================== */}

                <section
                    className="
                        mb-[18px]
                        rounded-[14px]
                        border
                        border-[#ececec]
                        bg-white
                        p-[20px]
                    "
                >
                    <SectionHeader
                        icon={faStethoscope}
                        title="Pemeriksaan Fisik"
                        subtitle="Temuan pemeriksaan fisik pasien."
                    />

                    <div className="mt-[18px]">
                        <Textarea
                            label="Physical Examination"
                            name="physical_examination"
                            value={form.physical_examination}
                            onChange={handleChange}
                            placeholder="Masukkan hasil pemeriksaan fisik pasien..."
                            disabled={isCompleted}
                            rows={5}
                        />
                    </div>
                </section>

                {/* =========================================================
                    CLINICAL CODING
                ========================================================== */}

                <div data-enter-ignore="true">
                    {examination ? (
                        <ClinicalCodingSection
                            examinationId={examination.id}
                            readOnly={isCompleted || !canUpdate}
                        />
                    ) : (
                        <section
                            className="
                                mb-[18px]
                                rounded-[14px]
                                border
                                border-[#ececec]
                                bg-white
                                p-[20px]
                            "
                        >
                            <h2
                                className="
                                    text-[15px]
                                    font-semibold
                                    text-[#343434]
                                "
                            >
                                Diagnosis & Tindakan
                            </h2>

                            <p
                                className="
                                    mt-[5px]
                                    text-[11px]
                                    text-[#999999]
                                "
                            >
                                Simpan draft pemeriksaan terlebih dahulu sebelum
                                menambahkan diagnosis ICD-10 dan tindakan
                                ICD-9-CM.
                            </p>
                        </section>
                    )}
                </div>

                {/* =========================================================
                    DOCTOR NOTES
                ========================================================== */}

                <section
                    className="
                        mb-[18px]
                        rounded-[14px]
                        border
                        border-[#ececec]
                        bg-white
                        p-[20px]
                    "
                >
                    <SectionHeader
                        icon={faUserDoctor}
                        title="Catatan Dokter"
                        subtitle="Catatan tambahan terkait pelayanan pasien."
                    />

                    <div className="mt-[18px]">
                        <Textarea
                            label="Doctor Notes"
                            name="doctor_notes"
                            value={form.doctor_notes}
                            onChange={handleChange}
                            placeholder="Masukkan catatan tambahan dokter..."
                            disabled={isCompleted}
                            rows={4}
                        />
                    </div>
                </section>

                {/* =========================================================
                    E-PRESCRIPTION
                ========================================================== */}

                <div data-enter-ignore="true">
                    {examination ? (
                        <PrescriptionSection
                            examinationId={examination.id}
                            readOnly={isCompleted || !canUpdate}
                        />
                    ) : (
                        <section
                            className="
                                mb-[18px]
                                rounded-[14px]
                                border
                                border-[#ececec]
                                bg-white
                                p-[20px]
                            "
                        >
                            <p
                                className="
                                    text-[11px]
                                    text-[#999999]
                                "
                            >
                                Simpan pemeriksaan terlebih dahulu sebelum
                                membuat resep.
                            </p>
                        </section>
                    )}
                </div>

                {/* =========================================================
                    COMPLETED INFORMATION
                ========================================================== */}

                {isCompleted && (
                    <section
                        className="
                            mb-[18px]
                            rounded-[14px]
                            border
                            border-emerald-100
                            bg-emerald-50
                            p-[18px]
                        "
                    >
                        <div
                            className="
                                flex
                                items-start
                                gap-[12px]
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-[36px]
                                    w-[36px]
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-emerald-100
                                    text-emerald-600
                                "
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </div>

                            <div>
                                <p
                                    className="
                                        text-[13px]
                                        font-semibold
                                        text-emerald-800
                                    "
                                >
                                    Pemeriksaan telah selesai
                                </p>

                                <p
                                    className="
                                        mt-[3px]
                                        text-[11px]
                                        text-emerald-700
                                    "
                                >
                                    Diselesaikan pada{" "}
                                    {formatDateTime(examination.completed_at)}.
                                    Data pemeriksaan telah dikunci.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* =========================================================
                    ACTION
                ========================================================== */}

                {!isCompleted && (
                    <div
                        className="
                            sticky
                            bottom-0
                            z-20
                            -mx-[30px]
                            mt-[20px]
                            flex
                            flex-wrap
                            items-center
                            justify-end
                            gap-[10px]
                            border-t
                            border-[#eeeeee]
                            bg-white/95
                            px-[30px]
                            py-[15px]
                            backdrop-blur-sm
                        "
                    >
                        {(examination ? canUpdate : canCreate) && (
                            <button
                                type="button"
                                data-enter-primary
                                onClick={handleSave}
                                disabled={saving || isCompleted}
                                className="
                                    inline-flex
                                    h-[40px]
                                    items-center
                                    gap-[8px]
                                    rounded-[9px]
                                    border
                                    border-[#dddddd]
                                    bg-white
                                    px-[16px]
                                    text-[12px]
                                    font-medium
                                    text-[#444444]
                                    transition
                                    hover:bg-[#f8f8f8]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                <FontAwesomeIcon
                                    icon={saving ? faSpinner : faFloppyDisk}
                                    spin={saving}
                                />

                                {saving ? "Menyimpan..." : "Simpan Draft"}
                            </button>
                        )}

                        {examination && canComplete && (
                            <button
                                type="button"
                                disabled={saving || completing}
                                onClick={handleComplete}
                                className="
                                        inline-flex
                                        h-[40px]
                                        items-center
                                        gap-[8px]
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
                                    "
                            >
                                <FontAwesomeIcon
                                    icon={
                                        completing ? faSpinner : faClipboardList
                                    }
                                    spin={completing}
                                />

                                {completing
                                    ? "Menyelesaikan..."
                                    : "Selesaikan Pemeriksaan"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| SECTION HEADER
|--------------------------------------------------------------------------
*/

function SectionHeader({ icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-[10px]">
            <div
                className="
                    flex
                    h-[38px]
                    w-[38px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[10px]
                    bg-[#eaf4ff]
                    text-[#1688f8]
                "
            >
                <FontAwesomeIcon icon={icon} className="text-[14px]" />
            </div>

            <div>
                <h2
                    className="
                        text-[15px]
                        font-semibold
                        text-[#343434]
                    "
                >
                    {title}
                </h2>

                <p
                    className="
                        mt-[1px]
                        text-[11px]
                        text-[#999999]
                    "
                >
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| INFO
|--------------------------------------------------------------------------
*/

function Info({ label, value }) {
    return (
        <div>
            <p
                className="
                    text-[11px]
                    text-[#999999]
                "
            >
                {label}
            </p>

            <p
                className="
                    mt-[3px]
                    break-words
                    text-[13px]
                    font-medium
                    text-[#444444]
                "
            >
                {value ?? "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

function Input({
    label,
    name,
    value,
    onChange,
    type = "text",
    suffix,
    disabled = false,
    step,
}) {
    return (
        <div>
            <label
                className="
                    mb-[6px]
                    block
                    text-[12px]
                    font-medium
                    text-[#555555]
                "
            >
                {label}
            </label>

            <div
                className={`
                    flex
                    h-[42px]
                    items-center
                    overflow-hidden
                    rounded-[9px]
                    border
                    border-[#dddddd]

                    ${
                        disabled
                            ? "bg-[#f7f7f7]"
                            : "bg-white focus-within:border-[#1688f8]"
                    }
                `}
            >
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    step={step}
                    className="
                        h-full
                        min-w-0
                        flex-1
                        bg-transparent
                        px-[12px]
                        text-[13px]
                        text-[#444444]
                        outline-none
                        disabled:text-[#777777]
                    "
                />

                {suffix && (
                    <span
                        className="
                            shrink-0
                            border-l
                            border-[#eeeeee]
                            bg-[#fafafa]
                            px-[10px]
                            text-[10px]
                            text-[#999999]
                        "
                    >
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| TEXTAREA
|--------------------------------------------------------------------------
*/

function Textarea({
    label,
    hint,
    name,
    value,
    onChange,
    placeholder,
    disabled = false,
    rows = 6,
}) {
    return (
        <div>
            <label
                className="
                    text-[13px]
                    font-semibold
                    text-[#444444]
                "
            >
                {label}
            </label>

            {hint && (
                <p
                    className="
                        mt-[2px]
                        text-[10px]
                        text-[#aaaaaa]
                    "
                >
                    {hint}
                </p>
            )}

            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className="
                    mt-[8px]
                    w-full
                    resize-y
                    rounded-[10px]
                    border
                    border-[#dddddd]
                    bg-white
                    px-[13px]
                    py-[11px]
                    text-[13px]
                    leading-[1.6]
                    text-[#444444]
                    outline-none
                    transition
                    placeholder:text-[#bbbbbb]
                    focus:border-[#1688f8]
                    disabled:cursor-not-allowed
                    disabled:bg-[#f7f7f7]
                    disabled:text-[#666666]
                "
            />
        </div>
    );
}
