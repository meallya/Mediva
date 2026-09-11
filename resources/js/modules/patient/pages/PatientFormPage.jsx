import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowLeft,
    faFloppyDisk,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import patientService from "../services/patientService";

export default function PatientFormPage() {
    const navigate = useNavigate();

    const { id } = useParams();

    /*
    |--------------------------------------------------------------------------
    | MODE
    |--------------------------------------------------------------------------
    */

    const isEditMode = Boolean(id);

    /*
    |--------------------------------------------------------------------------
    | FORM STATE
    |--------------------------------------------------------------------------
    */

    const [formData, setFormData] = useState({
        nik: "",
        name: "",
        gender: "",
        date_of_birth: "",
        address: "",
        phone: "",
        blood_type: "",
        emergency_contact: "",
    });

    /*
    |--------------------------------------------------------------------------
    | UI STATE
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(false);

    const [loadingPatient, setLoadingPatient] = useState(isEditMode);

    const [error, setError] = useState("");

    const [fieldErrors, setFieldErrors] = useState({});

    const [medicalRecordNumber, setMedicalRecordNumber] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD PATIENT FOR EDIT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!isEditMode) {
            return;
        }

        const loadPatient = async () => {
            try {
                setLoadingPatient(true);

                setError("");

                const response = await patientService.getPatient(id);

                const patient = response?.data ?? response;

                setMedicalRecordNumber(patient?.medical_record_number ?? "");

                setFormData({
                    nik: patient?.nik ?? "",

                    name: patient?.name ?? "",

                    gender: patient?.gender ?? "",

                    date_of_birth: patient?.date_of_birth
                        ? patient.date_of_birth.substring(0, 10)
                        : "",

                    address: patient?.address ?? "",

                    phone: patient?.phone ?? "",

                    blood_type: patient?.blood_type ?? "",

                    emergency_contact: patient?.emergency_contact ?? "",
                });
            } catch (error) {
                console.error("Gagal mengambil pasien:", error);

                if (error.status === 404) {
                    setError("Data pasien tidak ditemukan.");

                    return;
                }

                setError(error.message || "Gagal mengambil data pasien.");
            } finally {
                setLoadingPatient(false);
            }
        };

        loadPatient();
    }, [id, isEditMode]);

    /*
    |--------------------------------------------------------------------------
    | HANDLE INPUT
    |--------------------------------------------------------------------------
    */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        /*
        | Hapus validation error
        | setelah field mulai diperbaiki.
        */

        if (fieldErrors[name]) {
            setFieldErrors((previous) => ({
                ...previous,
                [name]: undefined,
            }));
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);

            setError("");

            setFieldErrors({});

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE PAYLOAD
            |--------------------------------------------------------------------------
            */

            const payload = {
                ...formData,

                nik: formData.nik || null,

                address: formData.address || null,

                phone: formData.phone || null,

                blood_type: formData.blood_type || null,

                emergency_contact: formData.emergency_contact || null,
            };

            /*
            |--------------------------------------------------------------------------
            | CREATE / UPDATE
            |--------------------------------------------------------------------------
            */

            let response;

            if (isEditMode) {
                response = await patientService.updatePatient(id, payload);
            } else {
                response = await patientService.createPatient(payload);
            }

            const patient = response?.data ?? response;

            /*
            |--------------------------------------------------------------------------
            | SUCCESS
            |--------------------------------------------------------------------------
            */

            const patientId = patient?.id ?? id;

            navigate(`/patients/${patientId}`, {
                replace: true,
            });
        } catch (error) {
            console.error(
                isEditMode ? "Gagal mengubah pasien:" : "Gagal membuat pasien:",
                error,
            );

            /*
            |--------------------------------------------------------------------------
            | VALIDATION ERROR
            |--------------------------------------------------------------------------
            */

            if (error.status === 422) {
                setFieldErrors(error.data?.errors ?? {});

                setError("Periksa kembali data pasien.");

                return;
            }

            setError(
                error.message ||
                    (isEditMode
                        ? "Gagal mengubah data pasien."
                        : "Gagal menyimpan data pasien."),
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | FIELD ERROR
    |--------------------------------------------------------------------------
    */

    const getFieldError = (field) => {
        return fieldErrors[field]?.[0];
    };

    /*
    |--------------------------------------------------------------------------
    | LOADING EDIT DATA
    |--------------------------------------------------------------------------
    */

    if (loadingPatient) {
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
                    <div
                        className="
                            flex
                            items-center
                            gap-[10px]
                            text-[#888888]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="
                                text-[18px]
                                text-[#1688f8]
                            "
                        />

                        <span
                            className="
                                text-[13px]
                            "
                        >
                            Memuat data pasien...
                        </span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div
                className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
            >
                {/* =====================================
                    BACK
                ====================================== */}

                <button
                    type="button"
                    onClick={() =>
                        navigate(isEditMode ? `/patients/${id}` : "/patients")
                    }
                    className="
                        mb-[10px]
                        flex
                        items-center
                        gap-[7px]
                        text-[12px]
                        font-medium
                        text-[#1688f8]
                        transition
                        hover:opacity-70
                    "
                >
                    <FontAwesomeIcon icon={faArrowLeft} />

                    {isEditMode
                        ? "Kembali ke Detail Pasien"
                        : "Kembali ke Data Pasien"}
                </button>

                {/* =====================================
                    HEADER
                ====================================== */}

                <div>
                    <h1
                        className="
                            text-[24px]
                            font-semibold
                            tracking-[-0.3px]
                            text-[#343434]
                        "
                    >
                        {isEditMode ? "Edit Pasien" : "Tambah Pasien"}
                    </h1>

                    <p
                        className="
                            mt-[5px]
                            text-[12px]
                            leading-[1.5]
                            text-[#8f8f8f]
                        "
                    >
                        {isEditMode
                            ? "Perbarui informasi pasien MEDIVA"
                            : "Masukkan informasi pasien baru MEDIVA"}
                    </p>
                </div>

                {/* =====================================
                    ERROR
                ====================================== */}

                {error && (
                    <div
                        className="
                            mt-[20px]
                            rounded-[10px]
                            border
                            border-red-100
                            bg-red-50
                            px-[15px]
                            py-[11px]
                            text-[12px]
                            text-red-500
                        "
                    >
                        {error}
                    </div>
                )}

                {/* =====================================
                    FORM
                ====================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="
                        mt-[25px]
                        overflow-hidden
                        rounded-[14px]
                        border
                        border-[#eeeeee]
                        bg-white
                    "
                >
                    <SectionHeader
                        title="Identitas Pasien"
                        description="Informasi identitas utama pasien"
                    />

                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-[20px]
                            p-[25px]
                            md:grid-cols-2
                        "
                    >
                        {/* =================================
                            NO RM - EDIT ONLY
                        ================================== */}

                        {isEditMode && (
                            <FormGroup label="No. Rekam Medis">
                                <input
                                    type="text"
                                    value={medicalRecordNumber}
                                    disabled
                                    className="
                                        h-[42px]
                                        w-full
                                        cursor-not-allowed
                                        rounded-[9px]
                                        border
                                        border-[#e5e5e5]
                                        bg-[#f7f8fa]
                                        px-[13px]
                                        text-[13px]
                                        font-medium
                                        text-[#777777]
                                        outline-none
                                    "
                                />
                            </FormGroup>
                        )}

                        {/* =================================
                            NIK
                        ================================== */}

                        <FormGroup label="NIK" error={getFieldError("nik")}>
                            <input
                                type="text"
                                name="nik"
                                value={formData.nik}
                                onChange={handleChange}
                                maxLength="16"
                                placeholder="16 digit NIK"
                                className={getInputClass(getFieldError("nik"))}
                            />
                        </FormGroup>

                        {/* =================================
                            NAME
                        ================================== */}

                        <FormGroup
                            label="Nama Lengkap"
                            required
                            error={getFieldError("name")}
                        >
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nama lengkap pasien"
                                className={getInputClass(getFieldError("name"))}
                            />
                        </FormGroup>

                        {/* =================================
                            GENDER
                        ================================== */}

                        <FormGroup
                            label="Jenis Kelamin"
                            required
                            error={getFieldError("gender")}
                        >
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={getInputClass(
                                    getFieldError("gender"),
                                )}
                            >
                                <option value="">Pilih jenis kelamin</option>

                                <option value="male">Laki-laki</option>

                                <option value="female">Perempuan</option>
                            </select>
                        </FormGroup>

                        {/* =================================
                            DATE OF BIRTH
                        ================================== */}

                        <FormGroup
                            label="Tanggal Lahir"
                            required
                            error={getFieldError("date_of_birth")}
                        >
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className={getInputClass(
                                    getFieldError("date_of_birth"),
                                )}
                            />
                        </FormGroup>

                        {/* =================================
                            BLOOD TYPE
                        ================================== */}

                        <FormGroup
                            label="Golongan Darah"
                            error={getFieldError("blood_type")}
                        >
                            <select
                                name="blood_type"
                                value={formData.blood_type}
                                onChange={handleChange}
                                className={getInputClass(
                                    getFieldError("blood_type"),
                                )}
                            >
                                <option value="">Pilih golongan darah</option>

                                <option value="A">A</option>

                                <option value="B">B</option>

                                <option value="AB">AB</option>

                                <option value="O">O</option>
                            </select>
                        </FormGroup>

                        {/* =================================
                            PHONE
                        ================================== */}

                        <FormGroup
                            label="Nomor Telepon"
                            error={getFieldError("phone")}
                        >
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="08xxxxxxxxxx"
                                className={getInputClass(
                                    getFieldError("phone"),
                                )}
                            />
                        </FormGroup>

                        {/* =================================
                            ADDRESS
                        ================================== */}

                        <div className="md:col-span-2">
                            <FormGroup
                                label="Alamat"
                                error={getFieldError("address")}
                            >
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Alamat lengkap pasien"
                                    className={`${getInputClass(
                                        getFieldError("address"),
                                    )} h-auto resize-none py-[11px]`}
                                />
                            </FormGroup>
                        </div>
                    </div>

                    {/* =====================================
                        EMERGENCY CONTACT
                    ====================================== */}

                    <SectionHeader
                        title="Kontak Darurat"
                        description="Keluarga atau penanggung jawab pasien"
                        secondary
                    />

                    <div className="p-[25px]">
                        <FormGroup
                            label="Kontak Darurat"
                            error={getFieldError("emergency_contact")}
                        >
                            <input
                                type="text"
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleChange}
                                placeholder="Contoh: Ibu - 081234567890"
                                className={getInputClass(
                                    getFieldError("emergency_contact"),
                                )}
                            />
                        </FormGroup>
                    </div>

                    {/* =====================================
                        FOOTER
                    ====================================== */}

                    <div
                        className="
                            flex
                            items-center
                            justify-end
                            gap-[10px]
                            border-t
                            border-[#eeeeee]
                            bg-[#fafbfc]
                            px-[25px]
                            py-[16px]
                        "
                    >
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                navigate(
                                    isEditMode
                                        ? `/patients/${id}`
                                        : "/patients",
                                )
                            }
                            className="
                                h-[42px]
                                rounded-[9px]
                                border
                                border-[#dddddd]
                                bg-white
                                px-[17px]
                                text-[12px]
                                font-medium
                                text-[#666666]
                                transition
                                hover:bg-[#f5f5f5]
                                disabled:opacity-50
                            "
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                flex
                                h-[42px]
                                items-center
                                gap-[8px]
                                rounded-[9px]
                                bg-[#1688f8]
                                px-[18px]
                                text-[12px]
                                font-medium
                                text-white
                                transition
                                hover:bg-[#0878e8]
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            <FontAwesomeIcon
                                icon={loading ? faSpinner : faFloppyDisk}
                                spin={loading}
                            />

                            {loading
                                ? "Menyimpan..."
                                : isEditMode
                                  ? "Simpan Perubahan"
                                  : "Simpan Pasien"}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| SECTION HEADER
|--------------------------------------------------------------------------
*/

function SectionHeader({ title, description, secondary = false }) {
    return (
        <div
            className={`
                border-b
                border-[#eeeeee]
                px-[25px]
                py-[18px]

                ${secondary ? "border-t bg-[#fafbfc]" : ""}
            `}
        >
            <h2
                className="
                    text-[14px]
                    font-semibold
                    text-[#444444]
                "
            >
                {title}
            </h2>

            <p
                className="
                    mt-[4px]
                    text-[11px]
                    text-[#999999]
                "
            >
                {description}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| FORM GROUP
|--------------------------------------------------------------------------
*/

function FormGroup({ label, required = false, error, children }) {
    return (
        <div>
            <label
                className="
                    mb-[7px]
                    block
                    text-[12px]
                    font-medium
                    text-[#555555]
                "
            >
                {label}

                {required && <span className="ml-[3px] text-red-500">*</span>}
            </label>

            {children}

            {error && (
                <p
                    className="
                        mt-[5px]
                        text-[11px]
                        text-red-500
                    "
                >
                    {error}
                </p>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| INPUT CLASS
|--------------------------------------------------------------------------
*/

function getInputClass(error) {
    return `
        h-[42px]
        w-full
        rounded-[9px]
        border
        bg-white
        px-[13px]
        text-[13px]
        text-[#555555]
        outline-none
        transition
        placeholder:text-[#aaaaaa]

        ${
            error
                ? "border-red-300 focus:border-red-400"
                : "border-[#e5e5e5] focus:border-[#1688f8]"
        }
    `;
}
