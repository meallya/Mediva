import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";

import { operatingRoomService } from "../services/operatingRoomService";

const initialForm = {
    patient_id: "",
    visit_id: "",
    requesting_doctor_id: "",
    operator_doctor_id: "",
    anesthesiologist_doctor_id: "",
    operation_type_id: "",
    priority: "elective",
    preoperative_diagnosis: "",
    planned_procedure: "",
    consent_obtained: false,
    fasting_status: "not_started",
    supporting_examinations: "",
    patient_preparation: "",
};

export default function SurgeryFormPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);

    const [options, setOptions] = useState({
        operation_types: [],
        priorities: [],
    });

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | Patient Search
    |--------------------------------------------------------------------------
    */

    const [patientKeyword, setPatientKeyword] = useState("");
    const [patientResults, setPatientResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientVisits, setPatientVisits] = useState([]);
    const [searchingPatient, setSearchingPatient] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Load Operating Room Options
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setLoadingOptions(true);
                setError("");

                const response = await operatingRoomService.getOptions();

                setOptions(response?.data ?? {});
            } catch (err) {
                setError(
                    err?.response?.data?.message ??
                        err?.data?.message ??
                        err?.message ??
                        "Gagal memuat pilihan operasi.",
                );
            } finally {
                setLoadingOptions(false);
            }
        };

        loadOptions();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Search Patient
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const keyword = patientKeyword.trim();

        if (keyword.length < 2) {
            setPatientResults([]);
            setSearchingPatient(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingPatient(true);

                const response =
                    await operatingRoomService.searchPatients(keyword);

                const results = response?.data?.data ?? response?.data ?? [];

                setPatientResults(Array.isArray(results) ? results : []);
            } catch (err) {
                console.error("Gagal mencari pasien:", err);

                setPatientResults([]);
            } finally {
                setSearchingPatient(false);
            }
        }, 400);

        return () => {
            clearTimeout(timer);
        };
    }, [patientKeyword]);

    /*
    |--------------------------------------------------------------------------
    | General Form Change
    |--------------------------------------------------------------------------
    */

    const change = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Select Patient
    |--------------------------------------------------------------------------
    */

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setPatientKeyword("");
        setPatientResults([]);
        setPatientVisits([]);
        setError("");

        setForm((prev) => ({
            ...prev,
            patient_id: patient.id,
            visit_id: "",
        }));

        try {
            const response = await operatingRoomService.getPatientVisits(
                patient.id,
            );

            const visitsData = response?.data?.data ?? response?.data ?? [];

            const visits = Array.isArray(visitsData) ? visitsData : [];

            setPatientVisits(visits);

            if (visits.length === 1) {
                setForm((prev) => ({
                    ...prev,
                    visit_id: visits[0].id,
                }));
            }
        } catch (err) {
            console.error("Gagal mengambil kunjungan pasien:", err);

            setPatientVisits([]);

            setError(
                err?.response?.data?.message ??
                    "Gagal mengambil data kunjungan pasien.",
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Change Patient
    |--------------------------------------------------------------------------
    */

    const handleChangePatient = () => {
        setSelectedPatient(null);
        setPatientKeyword("");
        setPatientResults([]);
        setPatientVisits([]);
        setError("");

        setForm((prev) => ({
            ...prev,
            patient_id: "",
            visit_id: "",
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Submit Surgery Request
    |--------------------------------------------------------------------------
    */

    const submit = async (event) => {
        event.preventDefault();

        /*
         * Validasi dasar frontend.
         */
        if (!form.patient_id) {
            setError("Silakan pilih pasien terlebih dahulu.");

            return;
        }

        if (!form.visit_id) {
            setError("Silakan pilih kunjungan pasien.");

            return;
        }

        if (!form.operation_type_id) {
            setError("Silakan pilih jenis operasi.");

            return;
        }

        try {
            setSaving(true);
            setError("");

            /*
             * Convert seluruh field dengan suffix _id
             * menjadi number jika tidak kosong.
             */
            const payload = Object.fromEntries(
                Object.entries(form).map(([key, value]) => [
                    key,
                    key.endsWith("_id") && value !== "" ? Number(value) : value,
                ]),
            );

            const response = await operatingRoomService.createSurgery(payload);

            /*
             * Mendukung response:
             *
             * response.data.id
             *
             * maupun:
             *
             * response.data.data.id
             */
            const surgery = response?.data?.data ?? response?.data ?? null;

            if (surgery?.id) {
                navigate(`/clinical/operating-room/surgeries/${surgery.id}`);

                return;
            }

            navigate("/clinical/operating-room/surgeries");
        } catch (err) {
            console.error("Gagal membuat permintaan operasi:", err);

            setError(
                err?.response?.data?.message ??
                    err?.data?.message ??
                    err?.message ??
                    "Permintaan operasi gagal disimpan.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                {/* =========================
                    HEADER
                ========================== */}

                <div className="flex flex-wrap items-center justify-between gap-[12px]">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#343434]">
                            Permintaan Operasi
                        </h1>

                        <p className="mt-[5px] text-[12px] text-[#999999]">
                            Buat permintaan operasi berdasarkan pasien dan
                            kunjungan aktif.
                        </p>
                    </div>

                    <Link
                        to="/clinical/operating-room/surgeries"
                        className="
                            inline-flex
                            h-[40px]
                            items-center
                            gap-[7px]
                            rounded-[9px]
                            border
                            border-[#dddddd]
                            bg-white
                            px-[14px]
                            text-[11px]
                            font-medium
                            text-[#666666]
                            transition
                            hover:border-[#1688f8]
                            hover:text-[#1688f8]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className="text-[10px]"
                        />
                        Kembali ke Daftar Operasi
                    </Link>
                </div>

                {/* =========================
                    ERROR
                ========================== */}

                {error && (
                    <div className="mt-[18px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={submit} className="mt-[22px]">
                    {/* =========================
                        INFORMASI PERMINTAAN
                    ========================== */}

                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                        <SectionTitle
                            title="Informasi Permintaan"
                            subtitle="Lengkapi data pasien, kunjungan, dan rencana operasi."
                        />

                        <div className="mt-[18px] grid grid-cols-1 gap-[16px] lg:grid-cols-2">
                            {/* =========================
                                CARI PASIEN
                            ========================== */}

                            <div className="relative">
                                <label className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                                    Cari Pasien
                                    <span className="ml-[3px] text-red-400">
                                        *
                                    </span>
                                </label>

                                {!selectedPatient ? (
                                    <>
                                        <div className="relative">
                                            <FontAwesomeIcon
                                                icon={faMagnifyingGlass}
                                                className="
                                                    absolute
                                                    left-[13px]
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-[12px]
                                                    text-[#aaaaaa]
                                                "
                                            />

                                            <input
                                                type="text"
                                                value={patientKeyword}
                                                onChange={(event) =>
                                                    setPatientKeyword(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Cari nama pasien atau No. RM..."
                                                autoComplete="off"
                                                className="
                                                    h-[42px]
                                                    w-full
                                                    rounded-[9px]
                                                    border
                                                    border-[#dddddd]
                                                    bg-white
                                                    pl-[36px]
                                                    pr-[12px]
                                                    text-[13px]
                                                    text-[#444444]
                                                    outline-none
                                                    transition
                                                    placeholder:text-[#bbbbbb]
                                                    focus:border-[#1688f8]
                                                "
                                            />
                                        </div>

                                        {/* SEARCH RESULT */}

                                        {patientKeyword.trim().length >= 2 && (
                                            <div
                                                className="
                                                    absolute
                                                    left-0
                                                    right-0
                                                    z-30
                                                    mt-[6px]
                                                    max-h-[250px]
                                                    overflow-y-auto
                                                    rounded-[9px]
                                                    border
                                                    border-[#e5e5e5]
                                                    bg-white
                                                    shadow-lg
                                                "
                                            >
                                                {searchingPatient ? (
                                                    <div className="px-[14px] py-[12px] text-[12px] text-[#999999]">
                                                        Mencari pasien...
                                                    </div>
                                                ) : patientResults.length >
                                                  0 ? (
                                                    patientResults.map(
                                                        (patient) => (
                                                            <button
                                                                key={patient.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleSelectPatient(
                                                                        patient,
                                                                    )
                                                                }
                                                                className="
                                                                    block
                                                                    w-full
                                                                    border-b
                                                                    border-[#eeeeee]
                                                                    px-[14px]
                                                                    py-[11px]
                                                                    text-left
                                                                    transition
                                                                    last:border-b-0
                                                                    hover:bg-[#f7faff]
                                                                "
                                                            >
                                                                <p className="text-[12px] font-medium text-[#444444]">
                                                                    {
                                                                        patient.name
                                                                    }
                                                                </p>

                                                                <p className="mt-[2px] text-[10px] text-[#999999]">
                                                                    No. RM:{" "}
                                                                    {
                                                                        patient.medical_record_number
                                                                    }
                                                                </p>
                                                            </button>
                                                        ),
                                                    )
                                                ) : (
                                                    <div className="px-[14px] py-[12px] text-[12px] text-[#999999]">
                                                        Pasien tidak ditemukan.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* =========================
                                        SELECTED PATIENT
                                    ========================== */

                                    <div
                                        className="
                                            flex
                                            min-h-[58px]
                                            items-center
                                            justify-between
                                            gap-[12px]
                                            rounded-[9px]
                                            border
                                            border-[#cfe5ff]
                                            bg-[#f7fbff]
                                            px-[13px]
                                            py-[8px]
                                        "
                                    >
                                        <div>
                                            <p className="text-[12px] font-medium text-[#444444]">
                                                {selectedPatient.name}
                                            </p>

                                            <p className="mt-[2px] text-[10px] text-[#999999]">
                                                No. RM:{" "}
                                                {
                                                    selectedPatient.medical_record_number
                                                }
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleChangePatient}
                                            className="
                                                shrink-0
                                                text-[11px]
                                                font-medium
                                                text-[#1688f8]
                                                transition
                                                hover:opacity-70
                                            "
                                        >
                                            Ganti Pasien
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* =========================
                                KUNJUNGAN
                            ========================== */}

                            <Field label="Kunjungan" required>
                                <select
                                    value={form.visit_id}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            visit_id: event.target.value,
                                        }))
                                    }
                                    disabled={!selectedPatient}
                                    className={inputClass}
                                >
                                    <option value="">
                                        {!selectedPatient
                                            ? "Pilih pasien terlebih dahulu"
                                            : patientVisits.length === 0
                                              ? "Tidak ada kunjungan"
                                              : "Pilih kunjungan"}
                                    </option>

                                    {patientVisits.map((visit) => (
                                        <option key={visit.id} value={visit.id}>
                                            Kunjungan #{visit.id}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {/* =========================
                                DOKTER PEMINTA
                            ========================== */}

                            <Field label="ID Dokter Peminta">
                                <input
                                    name="requesting_doctor_id"
                                    type="number"
                                    min="1"
                                    value={form.requesting_doctor_id}
                                    onChange={change}
                                    placeholder="Opsional"
                                    className={inputClass}
                                />
                            </Field>

                            {/* =========================
                                JENIS OPERASI
                            ========================== */}

                            <Field label="Jenis Operasi" required>
                                <select
                                    name="operation_type_id"
                                    value={form.operation_type_id}
                                    onChange={change}
                                    disabled={loadingOptions}
                                    className={inputClass}
                                >
                                    <option value="">
                                        {loadingOptions
                                            ? "Memuat jenis operasi..."
                                            : "Pilih Jenis Operasi"}
                                    </option>

                                    {options.operation_types?.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {/* =========================
                                PRIORITAS
                            ========================== */}

                            <Field label="Prioritas" required>
                                <select
                                    name="priority"
                                    value={form.priority}
                                    onChange={change}
                                    className={inputClass}
                                >
                                    {(options.priorities?.length
                                        ? options.priorities
                                        : [
                                              {
                                                  value: "elective",
                                                  label: "Elektif",
                                              },
                                              {
                                                  value: "urgent",
                                                  label: "Urgent",
                                              },
                                              {
                                                  value: "emergency",
                                                  label: "Emergensi",
                                              },
                                          ]
                                    ).map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {/* =========================
                                STATUS PUASA
                            ========================== */}

                            <Field label="Status Puasa">
                                <select
                                    name="fasting_status"
                                    value={form.fasting_status}
                                    onChange={change}
                                    className={inputClass}
                                >
                                    <option value="not_required">
                                        Tidak Diperlukan
                                    </option>

                                    <option value="not_started">
                                        Belum Mulai
                                    </option>

                                    <option value="in_progress">
                                        Sedang Puasa
                                    </option>

                                    <option value="adequate">Adekuat</option>

                                    <option value="not_adequate">
                                        Belum Adekuat
                                    </option>
                                </select>
                            </Field>
                        </div>
                    </section>

                    {/* =========================
                        INFORMASI KLINIS
                    ========================== */}

                    <section className="mt-[18px] rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                        <SectionTitle
                            title="Informasi Klinis Pra Operasi"
                            subtitle="Catat diagnosis, rencana tindakan, pemeriksaan penunjang, dan persiapan pasien."
                        />

                        <div className="mt-[18px] space-y-[16px]">
                            <TextArea
                                label="Diagnosis Pra Operasi"
                                name="preoperative_diagnosis"
                                value={form.preoperative_diagnosis}
                                onChange={change}
                                placeholder="Masukkan diagnosis pra operasi"
                            />

                            <TextArea
                                label="Rencana Tindakan"
                                name="planned_procedure"
                                value={form.planned_procedure}
                                onChange={change}
                                placeholder="Masukkan rencana tindakan operasi"
                            />

                            <TextArea
                                label="Pemeriksaan Penunjang"
                                name="supporting_examinations"
                                value={form.supporting_examinations}
                                onChange={change}
                                placeholder="Laboratorium, radiologi, atau pemeriksaan lain yang relevan"
                                rows={4}
                            />

                            <TextArea
                                label="Persiapan Pasien"
                                name="patient_preparation"
                                value={form.patient_preparation}
                                onChange={change}
                                placeholder="Catat persiapan pasien sebelum operasi"
                                rows={4}
                            />

                            {/* =========================
                                CONSENT
                            ========================== */}

                            <label className="flex cursor-pointer items-start gap-[10px] rounded-[10px] border border-[#eeeeee] bg-[#fafafa] px-[13px] py-[12px]">
                                <input
                                    type="checkbox"
                                    name="consent_obtained"
                                    checked={form.consent_obtained}
                                    onChange={change}
                                    className="mt-[2px] h-[16px] w-[16px] accent-[#1688f8]"
                                />

                                <div>
                                    <p className="text-[12px] font-medium text-[#444444]">
                                        Persetujuan tindakan sudah diperoleh
                                    </p>

                                    <p className="mt-[2px] text-[10px] text-[#999999]">
                                        Tandai jika informed consent telah
                                        dikonfirmasi.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* =========================
                        SUBMIT
                    ========================== */}

                    <div className="mt-[18px] flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="
                                inline-flex
                                h-[42px]
                                min-w-[190px]
                                items-center
                                justify-center
                                rounded-[9px]
                                bg-[#1688f8]
                                px-[18px]
                                text-[12px]
                                font-medium
                                text-white
                                transition
                                hover:bg-[#0f7be8]
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            {saving
                                ? "Menyimpan..."
                                : "Simpan Permintaan Operasi"}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Shared Input Style
|--------------------------------------------------------------------------
*/

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
    disabled:cursor-not-allowed
    disabled:bg-[#f7f7f7]
`;

/*
|--------------------------------------------------------------------------
| Section Title
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Field
|--------------------------------------------------------------------------
*/

function Field({ label, required = false, children }) {
    return (
        <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                {label}

                {required && <span className="ml-[3px] text-red-400">*</span>}
            </label>

            {children}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Text Area
|--------------------------------------------------------------------------
*/

function TextArea({ label, rows = 5, ...props }) {
    return (
        <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                {label}
            </label>

            <textarea
                {...props}
                rows={rows}
                className="
                    w-full
                    resize-y
                    rounded-[9px]
                    border
                    border-[#dddddd]
                    bg-white
                    px-[12px]
                    py-[10px]
                    text-[13px]
                    leading-[1.6]
                    text-[#444444]
                    outline-none
                    transition
                    placeholder:text-[#bbbbbb]
                    focus:border-[#1688f8]
                "
            />
        </div>
    );
}
