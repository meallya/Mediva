import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowLeft,
    faMagnifyingGlass,
    faSpinner,
    faUserCheck,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import patientService from "../../patient/services/patientService";

import registrationService from "../services/registrationService";

export default function RegistrationFormPage() {
    const navigate = useNavigate();

    const { id } = useParams();

    const isEditMode = Boolean(id);

    /*
    |--------------------------------------------------------------------------
    | PATIENT
    |--------------------------------------------------------------------------
    */

    const [patientSearch, setPatientSearch] = useState("");

    const [patientResults, setPatientResults] = useState([]);

    const [selectedPatient, setSelectedPatient] = useState(null);

    const [searchingPatient, setSearchingPatient] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    const [units, setUnits] = useState([]);

    const [visitTypes, setVisitTypes] = useState([]);

    /*
    |--------------------------------------------------------------------------
    | FORM
    |--------------------------------------------------------------------------
    */

    const [formData, setFormData] = useState({
        unit_id: "",
        visit_type: "",
        complaint: "",
    });

    const [loading, setLoading] = useState(false);

    const [loadingPage, setLoadingPage] = useState(true);

    const [error, setError] = useState("");

    const [fieldErrors, setFieldErrors] = useState({});

    /*
    |--------------------------------------------------------------------------
    | INITIAL DATA
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingPage(true);

                /*
                |--------------------------------------------------------------------------
                | OPTIONS
                |--------------------------------------------------------------------------
                */

                const options = await registrationService.getOptions();

                setUnits(options?.units ?? []);

                setVisitTypes(options?.visit_types ?? []);

                /*
                |--------------------------------------------------------------------------
                | EDIT DATA
                |--------------------------------------------------------------------------
                */

                if (isEditMode) {
                    const response =
                        await registrationService.getRegistration(id);

                    const registration = response?.data ?? response;

                    setSelectedPatient(registration.patient);

                    setFormData({
                        unit_id: String(registration.unit_id ?? ""),

                        visit_type: registration.visit_type ?? "outpatient",

                        complaint: registration.complaint ?? "",
                    });
                }
            } catch (error) {
                console.error("Gagal memuat form:", error);

                setError(error.message || "Gagal memuat data pendaftaran.");
            } finally {
                setLoadingPage(false);
            }
        };

        loadData();
    }, [id, isEditMode]);

    /*
    |--------------------------------------------------------------------------
    | SEARCH PATIENT
    |--------------------------------------------------------------------------
    */

    const handleSearchPatient = async () => {
        const keyword = patientSearch.trim();

        if (!keyword) {
            return;
        }

        try {
            setSearchingPatient(true);

            const response = await patientService.getPatients({
                search: keyword,
            });

            setPatientResults(response?.data ?? []);
        } catch (error) {
            console.error("Gagal mencari pasien:", error);
        } finally {
            setSearchingPatient(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SELECT PATIENT
    |--------------------------------------------------------------------------
    */

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);

        setPatientResults([]);

        setPatientSearch("");
    };

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

        setError("");

        setFieldErrors({});

        if (!selectedPatient) {
            setFieldErrors({
                patient_id: ["Pasien wajib dipilih."],
            });

            return;
        }

        try {
            setLoading(true);

            const payload = {
                unit_id: formData.unit_id,

                visit_type: formData.visit_type,

                complaint: formData.complaint || null,
            };

            let response;

            if (isEditMode) {
                response = await registrationService.updateRegistration(
                    id,
                    payload,
                );
            } else {
                response = await registrationService.createRegistration({
                    patient_id: selectedPatient.id,

                    ...payload,
                });
            }

            const registration = response?.data ?? response;

            navigate(`/registrations/${registration?.id ?? id}`, {
                replace: true,
            });
        } catch (error) {
            console.error("Gagal menyimpan pendaftaran:", error);

            if (error.status === 422) {
                setFieldErrors(error.data?.errors ?? {});

                setError(
                    error.data?.message || "Periksa kembali data pendaftaran.",
                );

                return;
            }

            setError(error.message || "Gagal menyimpan pendaftaran.");
        } finally {
            setLoading(false);
        }
    };

    const getFieldError = (field) => fieldErrors[field]?.[0];

    if (loadingPage) {
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
                            text-[13px]
                            text-[#888888]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="
                                text-[#1688f8]
                            "
                        />
                        Memuat pendaftaran...
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
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            isEditMode
                                ? `/registrations/${id}`
                                : "/registrations",
                        )
                    }
                    className="
                        mb-[10px]
                        flex
                        items-center
                        gap-[7px]
                        text-[12px]
                        font-medium
                        text-[#1688f8]
                    "
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Kembali
                </button>

                <h1
                    className="
                        text-[24px]
                        font-semibold
                        text-[#343434]
                    "
                >
                    {isEditMode ? "Edit Pendaftaran" : "Pendaftaran Pasien"}
                </h1>

                <p
                    className="
                        mt-[5px]
                        text-[12px]
                        text-[#8f8f8f]
                    "
                >
                    {isEditMode
                        ? "Perbarui informasi kunjungan pasien"
                        : "Daftarkan pasien untuk mendapatkan pelayanan"}
                </p>

                {error && (
                    <div
                        className="
                            mt-[20px]
                            rounded-[10px]
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

                <form
                    onSubmit={handleSubmit}
                    className="
                        mt-[25px]
                        overflow-hidden
                        rounded-[15px]
                        border
                        border-[#eeeeee]
                        bg-white
                    "
                >
                    <SectionHeader
                        title="Pasien"
                        description={
                            isEditMode
                                ? "Pasien pada pendaftaran ini tidak dapat diganti"
                                : "Cari pasien berdasarkan No. RM, NIK, atau nama"
                        }
                    />

                    <div className="p-[25px]">
                        {selectedPatient ? (
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    rounded-[12px]
                                    border
                                    border-[#cfe6ff]
                                    bg-[#f7fbff]
                                    p-[16px]
                                "
                            >
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-[13px]
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            h-[42px]
                                            w-[42px]
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-[#1688f8]
                                            text-white
                                        "
                                    >
                                        <FontAwesomeIcon icon={faUserCheck} />
                                    </div>

                                    <div>
                                        <p
                                            className="
                                                text-[14px]
                                                font-semibold
                                                text-[#444444]
                                            "
                                        >
                                            {selectedPatient.name}
                                        </p>

                                        <p
                                            className="
                                                mt-[3px]
                                                text-[11px]
                                                text-[#888888]
                                            "
                                        >
                                            {
                                                selectedPatient.medical_record_number
                                            }

                                            {" • NIK "}

                                            {selectedPatient.nik || "-"}
                                        </p>
                                    </div>
                                </div>

                                {!isEditMode && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPatient(null)}
                                        className="
                                            text-[11px]
                                            font-medium
                                            text-[#1688f8]
                                        "
                                    >
                                        Ganti Pasien
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-[10px]
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            h-[44px]
                                            max-w-[500px]
                                            flex-1
                                            items-center
                                            gap-[10px]
                                            rounded-[10px]
                                            bg-[#f7f8fa]
                                            px-[14px]
                                        "
                                    >
                                        <FontAwesomeIcon
                                            icon={faMagnifyingGlass}
                                            className="
                                                text-[13px]
                                                text-[#aaaaaa]
                                            "
                                        />

                                        <input
                                            type="text"
                                            value={patientSearch}
                                            onChange={(event) =>
                                                setPatientSearch(
                                                    event.target.value,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();

                                                    handleSearchPatient();
                                                }
                                            }}
                                            placeholder="Cari pasien..."
                                            className="
                                                flex-1
                                                bg-transparent
                                                text-[13px]
                                                outline-none
                                            "
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSearchPatient}
                                        disabled={searchingPatient}
                                        className="
                                            h-[44px]
                                            rounded-[10px]
                                            bg-[#1688f8]
                                            px-[18px]
                                            text-[12px]
                                            font-medium
                                            text-white
                                        "
                                    >
                                        {searchingPatient
                                            ? "Mencari..."
                                            : "Cari"}
                                    </button>
                                </div>

                                {patientResults.length > 0 && (
                                    <div
                                        className="
                                            mt-[12px]
                                            max-w-[650px]
                                            overflow-hidden
                                            rounded-[11px]
                                            border
                                            border-[#eeeeee]
                                        "
                                    >
                                        {patientResults.map((patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectPatient(patient)
                                                }
                                                className="
                                                        flex
                                                        w-full
                                                        items-center
                                                        justify-between
                                                        border-b
                                                        border-[#eeeeee]
                                                        px-[15px]
                                                        py-[12px]
                                                        text-left
                                                        last:border-b-0
                                                        hover:bg-[#fafcff]
                                                    "
                                            >
                                                <div>
                                                    <p
                                                        className="
                                                                text-[13px]
                                                                font-medium
                                                                text-[#444444]
                                                            "
                                                    >
                                                        {patient.name}
                                                    </p>

                                                    <p
                                                        className="
                                                                mt-[3px]
                                                                text-[11px]
                                                                text-[#999999]
                                                            "
                                                    >
                                                        {
                                                            patient.medical_record_number
                                                        }

                                                        {" • "}

                                                        {patient.nik || "NIK -"}
                                                    </p>
                                                </div>

                                                <span
                                                    className="
                                                            text-[11px]
                                                            font-medium
                                                            text-[#1688f8]
                                                        "
                                                >
                                                    Pilih
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {getFieldError("patient_id") && (
                                    <p
                                        className="
                                            mt-[7px]
                                            text-[11px]
                                            text-red-500
                                        "
                                    >
                                        {getFieldError("patient_id")}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    <SectionHeader
                        title="Informasi Kunjungan"
                        description="Tujuan dan pelayanan pasien"
                        secondary
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
                        {/* =========================================================
                            UNIT PELAYANAN
                            ========================================================== */}

                        <FormGroup
                            label="Poli / Unit Pelayanan"
                            required
                            error={getFieldError("unit_id")}
                        >
                            <select
                                name="unit_id"
                                value={formData.unit_id}
                                onChange={handleChange}
                                className={getInputClass(
                                    getFieldError("unit_id"),
                                )}
                            >
                                <option value="">
                                    Pilih poli / unit pelayanan
                                </option>

                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                        </FormGroup>

                        {/* =========================================================
                            JENIS KUNJUNGAN
                            ========================================================== */}

                        <FormGroup
                            label="Jenis Kunjungan"
                            required
                            error={getFieldError("visit_type")}
                        >
                            <select
                                name="visit_type"
                                value={formData.visit_type}
                                onChange={handleChange}
                                className={getInputClass(
                                    getFieldError("visit_type"),
                                )}
                            >
                                <option value="">Pilih jenis kunjungan</option>

                                {visitTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </FormGroup>

                        {/* =========================================================
                            KELUHAN AWAL
                            ========================================================== */}

                        <div className="md:col-span-2">
                            <FormGroup
                                label="Keluhan Awal"
                                error={getFieldError("complaint")}
                            >
                                <textarea
                                    name="complaint"
                                    rows="4"
                                    value={formData.complaint}
                                    onChange={handleChange}
                                    placeholder="Masukkan keluhan awal pasien..."
                                    className={`${getInputClass(
                                        getFieldError("complaint"),
                                    )} h-auto resize-none py-[11px]`}
                                />
                            </FormGroup>
                        </div>
                    </div>

                    <div
                        className="
                            flex
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
                            onClick={() =>
                                navigate(
                                    isEditMode
                                        ? `/registrations/${id}`
                                        : "/registrations",
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
                                text-[#666666]
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
                                disabled:opacity-60
                            "
                        >
                            {loading && (
                                <FontAwesomeIcon icon={faSpinner} spin />
                            )}

                            {loading
                                ? "Menyimpan..."
                                : isEditMode
                                  ? "Simpan Perubahan"
                                  : "Daftarkan Pasien"}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

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
            <h2 className="text-[14px] font-semibold text-[#444444]">
                {title}
            </h2>

            <p className="mt-[4px] text-[11px] text-[#999999]">{description}</p>
        </div>
    );
}

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
                <p className="mt-[5px] text-[11px] text-red-500">{error}</p>
            )}
        </div>
    );
}

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

        ${error ? "border-red-300" : "border-[#e5e5e5] focus:border-[#1688f8]"}
    `;
}
