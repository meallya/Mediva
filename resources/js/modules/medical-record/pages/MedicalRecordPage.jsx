import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowLeft,
    faCapsules,
    faClipboardList,
    faFileMedical,
    faFlask,
    faHeartPulse,
    faPrescriptionBottleMedical,
    faStethoscope,
    faUser,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import medicalRecordService from "../services/medicalRecordService";

export default function MedicalRecordPage() {
    const navigate = useNavigate();

    const { patientId } = useParams();

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [record, setRecord] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadRecord();
    }, [patientId]);

    const loadRecord = async () => {
        try {
            setLoading(true);

            setError("");

            const response =
                await medicalRecordService.getPatientRecord(patientId);

            /*
                |--------------------------------------------------------------------------
                | SUPPORT API RESPONSE
                |--------------------------------------------------------------------------
                |
                | Bisa membaca:
                |
                | { data: { patient... } }
                |
                | atau axios:
                |
                | { data: { data: { patient... } } }
                |
                */

            const payload =
                response?.data?.data ?? response?.data ?? response ?? null;

            setRecord(payload);
        } catch (error) {
            console.error("Medical Record:", error);

            setError(
                getErrorMessage(error, "Gagal mengambil rekam medis pasien."),
            );
        } finally {
            setLoading(false);
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
                <div className="flex min-h-[calc(100vh-88px)] items-center justify-center bg-[#fafbfc]">
                    <div className="text-center">
                        <FontAwesomeIcon
                            icon={faFileMedical}
                            className="text-[25px] text-[#C2E1F4]"
                        />

                        <p className="mt-[10px] text-[12px] text-[#B4B4B4]">
                            Memuat rekam medis...
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    if (error || !record) {
        return (
            <DashboardLayout>
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-[7px] text-[11px] font-medium text-[#047AF7]"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Kembali
                    </button>

                    <div className="mt-[20px] rounded-[14px] border border-red-100 bg-white p-[20px]">
                        <p className="text-[12px] text-red-500">
                            {error || "Data rekam medis tidak ditemukan."}
                        </p>
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

    const patient = record?.patient ?? {};

    const visits = Array.isArray(record?.visits) ? record.visits : [];

    const medications = Array.isArray(record?.medications)
        ? record.medications
        : [];

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                {/* =========================================================
                    HEADER
                ========================================================== */}

                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-[7px] text-[11px] font-medium text-[#047AF7]"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Kembali
                        </button>

                        <h1 className="mt-[10px] text-[24px] font-semibold text-[#212121]">
                            Rekam Medis Pasien
                        </h1>

                        <p className="mt-[5px] text-[12px] text-[#626262]">
                            Riwayat kunjungan, pemeriksaan, diagnosis, tindakan,
                            dan resep pasien
                        </p>
                    </div>

                    <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-[#C2E1F4]/35 text-[#047AF7]">
                        <FontAwesomeIcon
                            icon={faFileMedical}
                            className="text-[17px]"
                        />
                    </div>
                </div>

                {/* =========================================================
                    PATIENT
                ========================================================== */}

                <section className="mt-[22px] rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                    <div className="flex flex-wrap items-start justify-between gap-[15px]">
                        <div className="flex items-center gap-[11px]">
                            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#C2E1F4]/35 text-[#047AF7]">
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="text-[13px]"
                                />
                            </div>

                            <div>
                                <h2 className="text-[18px] font-semibold text-[#212121]">
                                    {patient.name || "-"}
                                </h2>

                                <p className="mt-[2px] text-[11px] text-[#B4B4B4]">
                                    {patient.medical_record_number ||
                                        "No. RM belum tersedia"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-[20px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
                        <Info
                            label="No. Rekam Medis"
                            value={patient.medical_record_number}
                        />

                        <Info label="NIK" value={patient.nik} />

                        <Info
                            label="Jenis Kelamin"
                            value={getGenderLabel(patient.gender)}
                        />

                        <Info
                            label="Tanggal Lahir"
                            value={formatDate(patient.date_of_birth)}
                        />
                    </div>
                </section>

                {/* =========================================================
                    SUMMARY
                ========================================================== */}

                <div className="mt-[16px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                    <SummaryCard
                        label="Total Kunjungan"
                        value={record?.summary?.total_visits ?? visits.length}
                    />

                    <SummaryCard
                        label="Kunjungan Selesai"
                        value={record?.summary?.completed_visits ?? 0}
                    />
                </div>

                {/* =========================================================
                    VISIT HISTORY
                ========================================================== */}

                <section className="mt-[20px]">
                    <div>
                        <h2 className="text-[15px] font-semibold text-[#212121]">
                            Riwayat Kunjungan
                        </h2>

                        <p className="mt-[3px] text-[11px] text-[#B4B4B4]">
                            Riwayat klinis pasien berdasarkan kunjungan
                        </p>
                    </div>

                    {visits.length === 0 ? (
                        <div className="mt-[12px] rounded-[14px] border border-[#ececec] bg-white p-[28px] text-center">
                            <FontAwesomeIcon
                                icon={faClipboardList}
                                className="text-[23px] text-[#C2E1F4]"
                            />

                            <p className="mt-[9px] text-[11px] text-[#B4B4B4]">
                                Belum ada riwayat kunjungan.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-[12px] space-y-[15px]">
                            {visits.map((visit, index) => (
                                <VisitCard
                                    key={visit?.id ?? index}
                                    visit={visit}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* =========================================================
                    MEDICATION HISTORY
                ========================================================== */}

                <section className="mt-[18px] rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                    <div className="flex flex-wrap items-start justify-between gap-[12px]">
                        <div>
                            <div className="flex items-center gap-[8px]">
                                <FontAwesomeIcon
                                    icon={faCapsules}
                                    className="text-[12px] text-[#7AB2B2]"
                                />

                                <h2 className="text-[14px] font-semibold text-[#212121]">
                                    Riwayat Obat
                                </h2>
                            </div>

                            <p className="mt-[4px] text-[10px] text-[#B4B4B4]">
                                Obat berdasarkan resep yang tersimpan pada
                                kunjungan pasien
                            </p>
                        </div>

                        <span className="rounded-full bg-[#C2E1F4]/30 px-[10px] py-[5px] text-[9px] font-medium text-[#047AF7]">
                            {medications.length} item
                        </span>
                    </div>

                    {medications.length === 0 ? (
                        <div className="mt-[14px] rounded-[10px] bg-[#fafbfc] px-[14px] py-[18px] text-center">
                            <p className="text-[11px] text-[#B4B4B4]">
                                Belum ada riwayat obat pasien.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-[14px] space-y-[8px]">
                            {medications.map((item, index) => (
                                <MedicationHistoryItem
                                    key={`${item?.prescription_id ?? "rx"}-${item?.medicine_id ?? "med"}-${index}`}
                                    item={item}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| VISIT CARD
|--------------------------------------------------------------------------
*/

function VisitCard({ visit }) {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | INI YANG MEMPERBAIKI:
    |
    | ReferenceError: prescription is not defined
    |
    */

    const examination = visit?.examination ?? null;

    const prescription = visit?.prescription ?? null;

    const laboratory = Array.isArray(visit?.laboratory)
        ? visit.laboratory
        : [];

    const medicalRecord = visit?.medical_record ?? null;

    const revisions = Array.isArray(medicalRecord?.revisions)
        ? medicalRecord.revisions
        : [];

    return (
        <article className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
            {/* =============================================================
                HEADER
            ============================================================== */}

            <div className="flex flex-wrap items-start justify-between gap-[15px] border-b border-[#eeeeee] bg-[#fafbfc] px-[20px] py-[15px]">
                <div>
                    <div className="flex flex-wrap items-center gap-[8px]">
                        <p className="text-[13px] font-semibold text-[#212121]">
                            {visit?.visit_number || "-"}
                        </p>

                        {medicalRecord?.record_number && (
                            <span className="rounded-full bg-white px-[8px] py-[4px] text-[9px] text-[#626262]">
                                {medicalRecord.record_number}
                            </span>
                        )}
                    </div>

                    <p className="mt-[4px] text-[10px] text-[#B4B4B4]">
                        {formatDateTime(
                            visit?.registration?.registered_at ??
                                visit?.started_at ??
                                medicalRecord?.finalized_at,
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-[7px]">
                    <span className="rounded-full bg-[#C2E1F4]/35 px-[10px] py-[5px] text-[9px] font-medium text-[#047AF7]">
                        {getVisitTypeLabel(visit?.visit_type)}
                    </span>

                    <StatusBadge status={visit?.status} />
                </div>
            </div>

            {/* =============================================================
                VISIT INFO
            ============================================================== */}

            <div className="grid grid-cols-1 gap-[15px] border-b border-[#eeeeee] px-[20px] py-[16px] sm:grid-cols-2 xl:grid-cols-4">
                <Info label="Unit / Poli" value={visit?.unit?.name} />

                <Info label="Dokter" value={visit?.doctor?.name} />

                <Info
                    label="Spesialisasi"
                    value={visit?.doctor?.specialization}
                />

                <Info
                    label="Keluhan Awal"
                    value={visit?.registration?.complaint}
                />
            </div>

            {/* =============================================================
                EXAMINATION
            ============================================================== */}

            {!examination ? (
                <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                    <p className="text-[11px] text-[#B4B4B4]">
                        Belum ada data pemeriksaan pada kunjungan ini.
                    </p>
                </div>
            ) : (
                <>
                    {/* =====================================================
                        SOAP
                    ====================================================== */}

                    <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                        <div className="mb-[13px] flex items-center gap-[8px]">
                            <FontAwesomeIcon
                                icon={faClipboardList}
                                className="text-[12px] text-[#047AF7]"
                            />

                            <h3 className="text-[13px] font-semibold text-[#212121]">
                                SOAP
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-[12px] xl:grid-cols-2">
                            <ClinicalText
                                label="Subjective"
                                value={examination.subjective}
                            />

                            <ClinicalText
                                label="Objective"
                                value={examination.objective}
                            />

                            <ClinicalText
                                label="Assessment"
                                value={examination.assessment}
                            />

                            <ClinicalText
                                label="Plan"
                                value={examination.plan}
                            />
                        </div>
                    </div>

                    {/* =====================================================
                        VITAL SIGNS
                    ====================================================== */}

                    <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                        <div className="mb-[13px] flex items-center gap-[8px]">
                            <FontAwesomeIcon
                                icon={faHeartPulse}
                                className="text-[12px] text-[#7AB2B2]"
                            />

                            <h3 className="text-[13px] font-semibold text-[#212121]">
                                Vital Signs
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4 xl:grid-cols-6">
                            <Info
                                label="Tekanan Darah"
                                value={
                                    examination.systolic &&
                                    examination.diastolic
                                        ? `${examination.systolic}/${examination.diastolic} mmHg`
                                        : "-"
                                }
                            />

                            <Info
                                label="Heart Rate"
                                value={
                                    examination.heart_rate
                                        ? `${examination.heart_rate} bpm`
                                        : "-"
                                }
                            />

                            <Info
                                label="Respiratory Rate"
                                value={
                                    examination.respiratory_rate
                                        ? `${examination.respiratory_rate} / menit`
                                        : "-"
                                }
                            />

                            <Info
                                label="Temperature"
                                value={
                                    examination.temperature
                                        ? `${examination.temperature} °C`
                                        : "-"
                                }
                            />

                            <Info
                                label="Berat Badan"
                                value={
                                    examination.weight
                                        ? `${examination.weight} kg`
                                        : "-"
                                }
                            />

                            <Info
                                label="Tinggi Badan"
                                value={
                                    examination.height
                                        ? `${examination.height} cm`
                                        : "-"
                                }
                            />
                        </div>
                    </div>

                    {/* =====================================================
                        PHYSICAL EXAMINATION
                    ====================================================== */}

                    <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                        <h3 className="text-[13px] font-semibold text-[#212121]">
                            Pemeriksaan Fisik
                        </h3>

                        <p className="mt-[8px] whitespace-pre-line text-[11px] leading-[1.7] text-[#626262]">
                            {examination.physical_examination || "-"}
                        </p>
                    </div>

                    {/* =====================================================
                        DIAGNOSIS + PROCEDURE
                    ====================================================== */}

                    <div className="grid grid-cols-1 gap-[20px] border-b border-[#eeeeee] px-[20px] py-[18px] xl:grid-cols-2">
                        {/* DIAGNOSIS */}

                        <div>
                            <div className="mb-[11px] flex items-center gap-[8px]">
                                <FontAwesomeIcon
                                    icon={faStethoscope}
                                    className="text-[11px] text-[#047AF7]"
                                />

                                <h3 className="text-[13px] font-semibold text-[#212121]">
                                    Diagnosis ICD-10
                                </h3>
                            </div>

                            {!Array.isArray(examination.diagnoses) ||
                            examination.diagnoses.length === 0 ? (
                                <EmptyText>Tidak ada diagnosis.</EmptyText>
                            ) : (
                                <div className="space-y-[7px]">
                                    {examination.diagnoses.map(
                                        (diagnosis, index) => (
                                            <div
                                                key={diagnosis?.id ?? index}
                                                className="rounded-[9px] bg-[#fafbfc] p-[11px]"
                                            >
                                                <div className="flex flex-wrap items-center gap-[7px]">
                                                    <strong className="text-[11px] text-[#212121]">
                                                        {diagnosis?.code || "-"}
                                                    </strong>

                                                    <span className="rounded-full bg-[#C2E1F4]/40 px-[7px] py-[3px] text-[9px] font-medium text-[#047AF7]">
                                                        {diagnosis?.type ===
                                                        "primary"
                                                            ? "Utama"
                                                            : "Sekunder"}
                                                    </span>
                                                </div>

                                                <p className="mt-[4px] text-[10px] leading-[1.5] text-[#626262]">
                                                    {diagnosis?.description ||
                                                        "-"}
                                                </p>

                                                {diagnosis?.notes && (
                                                    <p className="mt-[5px] text-[9px] text-[#999999]">
                                                        {diagnosis.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PROCEDURE */}

                        <div>
                            <h3 className="mb-[11px] text-[13px] font-semibold text-[#212121]">
                                Tindakan ICD-9-CM
                            </h3>

                            {!Array.isArray(examination.procedures) ||
                            examination.procedures.length === 0 ? (
                                <EmptyText>Tidak ada tindakan.</EmptyText>
                            ) : (
                                <div className="space-y-[7px]">
                                    {examination.procedures.map(
                                        (procedure, index) => (
                                            <div
                                                key={procedure?.id ?? index}
                                                className="rounded-[9px] bg-[#fafbfc] p-[11px]"
                                            >
                                                <strong className="text-[11px] text-[#212121]">
                                                    {procedure?.code || "-"}
                                                </strong>

                                                <p className="mt-[4px] text-[10px] leading-[1.5] text-[#626262]">
                                                    {procedure?.description ||
                                                        "-"}
                                                </p>

                                                {procedure?.notes && (
                                                    <p className="mt-[5px] text-[9px] text-[#999999]">
                                                        {procedure.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =====================================================
                        DOCTOR NOTES
                    ====================================================== */}

                    <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                        <h3 className="text-[13px] font-semibold text-[#212121]">
                            Catatan Dokter
                        </h3>

                        <p className="mt-[8px] whitespace-pre-line text-[11px] leading-[1.7] text-[#626262]">
                            {examination.doctor_notes || "-"}
                        </p>
                    </div>
                </>
            )}

            {/* =============================================================
                PRESCRIPTION

                IMPORTANT:
                prescription SUDAH didefinisikan di atas:
                const prescription = visit?.prescription ?? null;
            ============================================================== */}

            <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                <div className="mb-[12px] flex flex-wrap items-start justify-between gap-[10px]">
                    <div>
                        <div className="flex items-center gap-[8px]">
                            <FontAwesomeIcon
                                icon={faPrescriptionBottleMedical}
                                className="text-[12px] text-[#7AB2B2]"
                            />

                            <h3 className="text-[13px] font-semibold text-[#212121]">
                                Riwayat Resep
                            </h3>
                        </div>

                        <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                            Resep pada kunjungan ini
                        </p>
                    </div>

                    {prescription && (
                        <div className="flex flex-wrap items-center gap-[7px]">
                            <span className="rounded-full bg-[#CDE8E5]/40 px-[9px] py-[4px] text-[9px] font-medium text-[#7AB2B2]">
                                {prescription.prescription_number || "-"}
                            </span>

                            <PrescriptionStatus status={prescription.status} />
                        </div>
                    )}
                </div>

                {!prescription ? (
                    <EmptyText>Tidak ada resep pada kunjungan ini.</EmptyText>
                ) : !Array.isArray(prescription.items) ||
                  prescription.items.length === 0 ? (
                    <EmptyText>Resep belum memiliki item obat.</EmptyText>
                ) : (
                    <div className="space-y-[8px]">
                        {prescription.items.map((item, index) => (
                            <PrescriptionItem
                                key={item?.id ?? index}
                                item={item}
                                index={index}
                            />
                        ))}
                    </div>
                )}

                {prescription?.doctor_notes && (
                    <div className="mt-[12px] rounded-[9px] border border-[#eeeeee] bg-[#fafbfc] p-[11px]">
                        <p className="text-[9px] font-medium uppercase tracking-[0.2px] text-[#B4B4B4]">
                            Catatan Resep
                        </p>

                        <p className="mt-[5px] whitespace-pre-line text-[10px] leading-[1.6] text-[#626262]">
                            {prescription.doctor_notes}
                        </p>
                    </div>
                )}
            </div>

            {/* =============================================================
                LABORATORY
            ============================================================== */}

            <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                <div className="mb-[12px] flex flex-wrap items-start justify-between gap-[10px]">
                    <div>
                        <div className="flex items-center gap-[8px]">
                            <FontAwesomeIcon
                                icon={faFlask}
                                className="text-[12px] text-[#047AF7]"
                            />

                            <h3 className="text-[13px] font-semibold text-[#212121]">
                                Hasil Laboratorium
                            </h3>
                        </div>

                        <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                            Hasil laboratorium pada kunjungan ini
                        </p>
                    </div>
                </div>

                {laboratory.length === 0 ? (
                    <EmptyText>Tidak ada hasil laboratorium pada kunjungan ini.</EmptyText>
                ) : (
                    <div className="space-y-[10px]">
                        {laboratory.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-[10px] border border-[#eeeeee] bg-[#fafbfc] p-[12px]"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-[8px]">
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#212121]">
                                            {order.lab_number || "-"}
                                        </p>
                                        <p className="mt-[2px] text-[9px] text-[#999999]">
                                            {formatDateTime(order.verified_at ?? order.ordered_at)}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-[#CDE8E5]/40 px-[8px] py-[4px] text-[9px] font-medium text-[#527b7b]">
                                        {order.status === "completed" ? "Selesai" : order.status}
                                    </span>
                                </div>

                                <div className="mt-[10px] space-y-[8px]">
                                    {(order.items ?? []).map((item) => (
                                        <div key={item.id} className="rounded-[9px] bg-white p-[10px]">
                                            <p className="text-[10px] font-semibold text-[#212121]">
                                                {item.code ? `${item.code} — ` : ""}{item.name || "Pemeriksaan"}
                                            </p>

                                            {(item.results ?? []).length === 0 ? (
                                                <p className="mt-[5px] text-[9px] text-[#999999]">
                                                    Belum ada hasil.
                                                </p>
                                            ) : (
                                                <div className="mt-[7px] grid grid-cols-1 gap-[6px] md:grid-cols-2">
                                                    {(item.results ?? []).map((result) => (
                                                        <div
                                                            key={result.id}
                                                            className="rounded-[8px] border border-[#f0f0f0] px-[9px] py-[7px]"
                                                        >
                                                            <div className="flex items-center justify-between gap-[8px]">
                                                                <span className="text-[9px] text-[#999999]">
                                                                    {result.parameter || "Parameter"}
                                                                </span>
                                                                <span className={`text-[8px] font-medium ${
                                                                    result.flag === "critical"
                                                                        ? "text-red-600"
                                                                        : ["high", "low", "abnormal"].includes(result.flag)
                                                                            ? "text-amber-600"
                                                                            : "text-[#527b7b]"
                                                                }`}>
                                                                    {result.flag === "critical"
                                                                        ? "Kritis"
                                                                        : result.flag === "high"
                                                                            ? "Tinggi"
                                                                            : result.flag === "low"
                                                                                ? "Rendah"
                                                                                : result.flag === "abnormal"
                                                                                    ? "Abnormal"
                                                                                    : "Normal"}
                                                                </span>
                                                            </div>

                                                            <p className="mt-[3px] text-[11px] font-semibold text-[#212121]">
                                                                {result.value ?? "-"} {result.unit ?? ""}
                                                            </p>

                                                            <p className="mt-[2px] text-[8px] text-[#B4B4B4]">
                                                                Rujukan: {result.reference_text ||
                                                                    (result.reference_low !== null || result.reference_high !== null
                                                                        ? `${result.reference_low ?? "-"} - ${result.reference_high ?? "-"}`
                                                                        : "-")}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* =============================================================
                REVISION / ADDENDUM
            ============================================================== */}

            <div className="px-[20px] py-[18px]">
                <h3 className="text-[13px] font-semibold text-[#212121]">
                    Addendum / Revisi
                </h3>

                <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                    Perubahan dicatat tanpa mengubah snapshot rekam medis asli.
                </p>

                {revisions.length === 0 ? (
                    <div className="mt-[10px]">
                        <EmptyText>Belum ada addendum atau revisi.</EmptyText>
                    </div>
                ) : (
                    <div className="mt-[11px] space-y-[8px]">
                        {revisions.map((revision, index) => (
                            <div
                                key={revision?.id ?? index}
                                className="rounded-[9px] border border-[#eeeeee] bg-[#fafbfc] p-[11px]"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-[10px]">
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#212121]">
                                            Revisi #
                                            {revision?.revision_number ??
                                                index + 1}
                                        </p>

                                        <p className="mt-[2px] text-[9px] text-[#B4B4B4]">
                                            Bagian:{" "}
                                            {getRevisionSectionLabel(
                                                revision?.section,
                                            )}
                                        </p>
                                    </div>

                                    <p className="text-[9px] text-[#B4B4B4]">
                                        {formatDateTime(revision?.created_at)}
                                    </p>
                                </div>

                                <div className="mt-[8px]">
                                    <p className="text-[9px] font-medium text-[#999999]">
                                        Alasan
                                    </p>

                                    <p className="mt-[2px] text-[10px] text-[#626262]">
                                        {revision?.reason || "-"}
                                    </p>
                                </div>

                                <div className="mt-[7px]">
                                    <p className="text-[9px] font-medium text-[#999999]">
                                        Addendum
                                    </p>

                                    <p className="mt-[2px] whitespace-pre-line text-[10px] leading-[1.6] text-[#626262]">
                                        {revision?.note || "-"}
                                    </p>
                                </div>

                                {revision?.created_by && (
                                    <p className="mt-[7px] text-[9px] text-[#B4B4B4]">
                                        Oleh: {revision.created_by}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}

/*
|--------------------------------------------------------------------------
| PRESCRIPTION ITEM
|--------------------------------------------------------------------------
*/

function PrescriptionItem({ item, index }) {
    return (
        <div className="rounded-[10px] bg-[#fafbfc] p-[12px]">
            <div className="flex items-start gap-[10px]">
                <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-[7px] bg-[#CDE8E5]/45 text-[9px] font-semibold text-[#7AB2B2]">
                    {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#212121]">
                        {item?.name || "Obat"}

                        {item?.strength && ` ${item.strength}`}
                    </p>

                    <p className="mt-[2px] text-[9px] text-[#B4B4B4]">
                        {item?.code || "-"}

                        {item?.generic_name && ` • ${item.generic_name}`}

                        {item?.dosage_form && ` • ${item.dosage_form}`}
                    </p>

                    <div className="mt-[8px] grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                        <MiniInfo label="Dosis" value={item?.dosage} />

                        <MiniInfo label="Frekuensi" value={item?.frequency} />

                        <MiniInfo
                            label="Jumlah"
                            value={`${formatQuantity(item?.quantity)} ${
                                item?.unit ?? ""
                            }`}
                        />
                    </div>

                    {item?.instruction && (
                        <div className="mt-[8px] rounded-[8px] bg-white px-[10px] py-[8px]">
                            <p className="text-[9px] font-medium text-[#999999]">
                                Instruksi Pemakaian
                            </p>

                            <p className="mt-[3px] whitespace-pre-line text-[10px] leading-[1.6] text-[#626262]">
                                {item.instruction}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| MEDICATION HISTORY ITEM
|--------------------------------------------------------------------------
*/

function MedicationHistoryItem({ item }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-[12px] rounded-[10px] border border-[#eeeeee] bg-[#fafbfc] p-[12px]">
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#212121]">
                    {item?.name || "-"}

                    {item?.strength && ` ${item.strength}`}
                </p>

                <p className="mt-[3px] text-[9px] text-[#B4B4B4]">
                    {item?.visit_number || "-"}

                    {" • "}

                    {item?.prescription_number || "-"}
                </p>

                <div className="mt-[7px] flex flex-wrap gap-x-[18px] gap-y-[6px]">
                    <MiniInfo label="Dosis" value={item?.dosage} />

                    <MiniInfo label="Frekuensi" value={item?.frequency} />

                    <MiniInfo
                        label="Jumlah"
                        value={`${formatQuantity(item?.quantity)} ${
                            item?.unit ?? ""
                        }`}
                    />
                </div>

                {item?.instruction && (
                    <p className="mt-[7px] whitespace-pre-line text-[10px] leading-[1.6] text-[#626262]">
                        {item.instruction}
                    </p>
                )}
            </div>

            <PrescriptionStatus status={item?.prescription_status} />
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
            <p className="text-[10px] font-medium uppercase tracking-[0.2px] text-[#B4B4B4]">
                {label}
            </p>

            <p className="mt-[4px] text-[12px] font-medium text-[#212121]">
                {hasValue(value) ? value : "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| MINI INFO
|--------------------------------------------------------------------------
*/

function MiniInfo({ label, value }) {
    return (
        <div>
            <p className="text-[9px] text-[#B4B4B4]">{label}</p>

            <p className="mt-[2px] text-[10px] font-medium text-[#626262]">
                {hasValue(value) ? value : "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[18px]">
            <p className="text-[24px] font-semibold text-[#212121]">
                {value ?? 0}
            </p>

            <p className="mt-[3px] text-[11px] text-[#B4B4B4]">{label}</p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| CLINICAL TEXT
|--------------------------------------------------------------------------
*/

function ClinicalText({ label, value }) {
    return (
        <div className="rounded-[9px] bg-[#fafbfc] p-[12px]">
            <p className="text-[10px] font-semibold text-[#626262]">{label}</p>

            <p className="mt-[5px] whitespace-pre-line text-[11px] leading-[1.7] text-[#212121]">
                {value || "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| EMPTY
|--------------------------------------------------------------------------
*/

function EmptyText({ children }) {
    return (
        <div className="rounded-[9px] bg-[#fafbfc] px-[12px] py-[11px]">
            <p className="text-[10px] text-[#B4B4B4]">{children}</p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
    const labels = {
        waiting: "Menunggu",

        called: "Dipanggil",

        in_service: "Dalam Pelayanan",

        completed: "Selesai",

        cancelled: "Dibatalkan",
    };

    const classes = {
        waiting: "bg-amber-50 text-amber-600",

        called: "bg-[#C2E1F4]/40 text-[#047AF7]",

        in_service: "bg-[#CDE8E5]/45 text-[#5c9292]",

        completed: "bg-emerald-50 text-emerald-600",

        cancelled: "bg-red-50 text-red-500",
    };

    return (
        <span
            className={`
                rounded-full
                px-[9px]
                py-[5px]
                text-[9px]
                font-medium

                ${classes[status] ?? "bg-[#f1f1f1] text-[#626262]"}
            `}
        >
            {labels[status] ?? status ?? "-"}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| PRESCRIPTION STATUS
|--------------------------------------------------------------------------
*/

function PrescriptionStatus({ status }) {
    const labels = {
        draft: "Draft",

        submitted: "Dikirim",

        processing: "Diproses",

        ready: "Siap Diambil",

        dispensed: "Diserahkan",

        cancelled: "Dibatalkan",
    };

    const classes = {
        draft: "bg-[#C2E1F4]/35 text-[#047AF7]",

        submitted: "bg-[#CDE8E5]/45 text-[#5c9292]",

        processing: "bg-amber-50 text-amber-600",

        ready: "bg-emerald-50 text-emerald-600",

        dispensed: "bg-green-50 text-green-600",

        cancelled: "bg-red-50 text-red-500",
    };

    return (
        <span
            className={`
                shrink-0
                rounded-full
                px-[9px]
                py-[4px]
                text-[9px]
                font-medium

                ${classes[status] ?? "bg-[#f1f1f1] text-[#626262]"}
            `}
        >
            {labels[status] ?? status ?? "-"}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE TIME
|--------------------------------------------------------------------------
*/

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/*
|--------------------------------------------------------------------------
| VISIT TYPE
|--------------------------------------------------------------------------
*/

function getVisitTypeLabel(type) {
    const labels = {
        outpatient: "Rawat Jalan",

        emergency: "IGD / Gawat Darurat",

        inpatient: "Rawat Inap",

        medical_checkup: "Medical Check Up",

        day_care: "Day Care",

        home_care: "Home Care",

        telemedicine: "Telemedicine",
    };

    return labels[type] ?? type ?? "-";
}

/*
|--------------------------------------------------------------------------
| GENDER
|--------------------------------------------------------------------------
*/

function getGenderLabel(gender) {
    const labels = {
        male: "Laki-laki",

        female: "Perempuan",

        M: "Laki-laki",

        F: "Perempuan",

        L: "Laki-laki",

        P: "Perempuan",
    };

    return labels[gender] ?? gender ?? "-";
}

/*
|--------------------------------------------------------------------------
| REVISION SECTION
|--------------------------------------------------------------------------
*/

function getRevisionSectionLabel(section) {
    const labels = {
        general: "Umum",

        subjective: "Subjective",

        objective: "Objective",

        assessment: "Assessment",

        plan: "Plan",

        physical_examination: "Pemeriksaan Fisik",

        diagnosis: "Diagnosis",

        procedure: "Tindakan",

        doctor_notes: "Catatan Dokter",
    };

    return labels[section] ?? section ?? "-";
}

/*
|--------------------------------------------------------------------------
| QUANTITY
|--------------------------------------------------------------------------
*/

function formatQuantity(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return Number.isInteger(number) ? String(number) : String(number);
}

/*
|--------------------------------------------------------------------------
| VALUE
|--------------------------------------------------------------------------
*/

function hasValue(value) {
    return !(value === null || value === undefined || value === "");
}

/*
|--------------------------------------------------------------------------
| ERROR
|--------------------------------------------------------------------------
*/

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message ?? error?.message ?? fallback;
}
