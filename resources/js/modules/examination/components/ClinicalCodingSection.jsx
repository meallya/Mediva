import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faMagnifyingGlass,
    faPlus,
    faSpinner,
    faStethoscope,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import examinationService from "../services/examinationService";

export default function ClinicalCodingSection({
    examinationId,
    readOnly = false,
}) {
    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [diagnoses, setDiagnoses] = useState([]);

    const [procedures, setProcedures] = useState([]);

    const [diagnosisSearch, setDiagnosisSearch] = useState("");

    const [procedureSearch, setProcedureSearch] = useState("");

    const [diagnosisResults, setDiagnosisResults] = useState([]);

    const [procedureResults, setProcedureResults] = useState([]);

    const [diagnosisType, setDiagnosisType] = useState("primary");

    const [searchingDiagnosis, setSearchingDiagnosis] = useState(false);

    const [searchingProcedure, setSearchingProcedure] = useState(false);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD CODING
    |--------------------------------------------------------------------------
    */

    const loadCoding = async () => {
        if (!examinationId) {
            return;
        }

        try {
            const response = await examinationService.getCoding(examinationId);

            const data = response?.data ?? response;

            setDiagnoses(data?.diagnoses ?? []);

            setProcedures(data?.procedures ?? []);
        } catch (error) {
            console.error("Gagal memuat clinical coding:", error);
        }
    };

    useEffect(() => {
        loadCoding();
    }, [examinationId]);

    /*
    |--------------------------------------------------------------------------
    | SEARCH ICD-10
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (readOnly || diagnosisSearch.trim().length < 2) {
            setDiagnosisResults([]);

            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingDiagnosis(true);

                const response =
                    await examinationService.searchIcd10(diagnosisSearch);

                setDiagnosisResults(response?.data ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setSearchingDiagnosis(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [diagnosisSearch, readOnly]);

    /*
    |--------------------------------------------------------------------------
    | SEARCH ICD-9-CM
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (readOnly || procedureSearch.trim().length < 2) {
            setProcedureResults([]);

            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingProcedure(true);

                const response =
                    await examinationService.searchIcd9cm(procedureSearch);

                setProcedureResults(response?.data ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setSearchingProcedure(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [procedureSearch, readOnly]);

    /*
    |--------------------------------------------------------------------------
    | ADD DIAGNOSIS
    |--------------------------------------------------------------------------
    */

    const handleAddDiagnosis = async (code) => {
        try {
            setSaving(true);

            setError("");

            await examinationService.addDiagnosis(examinationId, {
                icd10_code_id: code.id,

                type: diagnosisType,

                notes: null,
            });

            setDiagnosisSearch("");

            setDiagnosisResults([]);

            if (diagnosisType === "primary") {
                setDiagnosisType("secondary");
            }

            await loadCoding();
        } catch (error) {
            setError(error?.message ?? "Gagal menambahkan diagnosis.");
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE DIAGNOSIS
    |--------------------------------------------------------------------------
    */

    const handleDeleteDiagnosis = async (diagnosisId) => {
        const confirmed = window.confirm("Hapus diagnosis ini?");

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            setError("");

            await examinationService.deleteDiagnosis(
                examinationId,
                diagnosisId,
            );

            await loadCoding();
        } catch (error) {
            setError(error?.message ?? "Gagal menghapus diagnosis.");
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | ADD PROCEDURE
    |--------------------------------------------------------------------------
    */

    const handleAddProcedure = async (code) => {
        try {
            setSaving(true);

            setError("");

            await examinationService.addProcedure(examinationId, {
                icd9cm_code_id: code.id,

                notes: null,
            });

            setProcedureSearch("");

            setProcedureResults([]);

            await loadCoding();
        } catch (error) {
            setError(error?.message ?? "Gagal menambahkan tindakan.");
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE PROCEDURE
    |--------------------------------------------------------------------------
    */

    const handleDeleteProcedure = async (procedureId) => {
        const confirmed = window.confirm("Hapus tindakan ini?");

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            setError("");

            await examinationService.deleteProcedure(
                examinationId,
                procedureId,
            );

            await loadCoding();
        } catch (error) {
            setError(error?.message ?? "Gagal menghapus tindakan.");
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <section
            data-enter-ignore="true"
            className="
                mb-[18px]
                rounded-[14px]
                border
                border-[#ececec]
                bg-white
                p-[20px]
            "
        >
            {/* =============================================================
                HEADER
            ============================================================== */}

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
                    <FontAwesomeIcon
                        icon={faStethoscope}
                        className="text-[14px]"
                    />
                </div>

                <div>
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
                            mt-[1px]
                            text-[11px]
                            text-[#999999]
                        "
                    >
                        ICD-10 dan ICD-9-CM
                    </p>
                </div>
            </div>

            {/* =============================================================
                READ ONLY INFORMATION
            ============================================================== */}

            {readOnly && (
                <div
                    className="
                        mt-[18px]
                        rounded-[9px]
                        bg-[#eaf4ff]
                        px-[14px]
                        py-[11px]
                        text-[12px]
                        leading-[1.5]
                        text-[#555555]
                    "
                >
                    Pemeriksaan telah selesai atau Anda hanya memiliki akses
                    melihat.
                </div>
            )}

            {/* =============================================================
                ERROR
            ============================================================== */}

            {error && (
                <div
                    className="
                        mt-[18px]
                        rounded-[9px]
                        border
                        border-red-100
                        bg-red-50
                        px-[14px]
                        py-[11px]
                        text-[12px]
                        leading-[1.5]
                        text-red-600
                    "
                >
                    {error}
                </div>
            )}

            {/* =============================================================
                CONTENT
            ============================================================== */}

            <div
                className="
                    mt-[20px]
                    grid
                    grid-cols-1
                    gap-[22px]
                    xl:grid-cols-2
                "
            >
                {/* =========================================================
                    ICD-10
                ========================================================== */}

                <div>
                    <div
                        className="
                            flex
                            items-start
                            justify-between
                            gap-[12px]
                        "
                    >
                        <div>
                            <p
                                className="
                                    text-[13px]
                                    font-semibold
                                    text-[#343434]
                                "
                            >
                                Diagnosis ICD-10
                            </p>

                            <p
                                className="
                                    mt-[2px]
                                    text-[11px]
                                    text-[#999999]
                                "
                            >
                                Diagnosis utama dan sekunder
                            </p>
                        </div>

                        {!readOnly && (
                            <select
                                value={diagnosisType}
                                onChange={(event) =>
                                    setDiagnosisType(event.target.value)
                                }
                                className="
                                    h-[34px]
                                    rounded-[8px]
                                    border
                                    border-[#dddddd]
                                    bg-white
                                    px-[9px]
                                    text-[11px]
                                    text-[#555555]
                                    outline-none
                                    transition
                                    focus:border-[#1688f8]
                                "
                            >
                                <option value="primary">Diagnosis Utama</option>

                                <option value="secondary">
                                    Diagnosis Sekunder
                                </option>
                            </select>
                        )}
                    </div>

                    {/* =====================================================
                        SEARCH ICD-10
                    ====================================================== */}

                    {!readOnly && (
                        <div className="relative mt-[12px]">
                            <div
                                className="
                                    flex
                                    h-[42px]
                                    items-center
                                    rounded-[9px]
                                    border
                                    border-[#dddddd]
                                    bg-white
                                    px-[12px]
                                    transition
                                    focus-within:border-[#1688f8]
                                "
                            >
                                <FontAwesomeIcon
                                    icon={
                                        searchingDiagnosis
                                            ? faSpinner
                                            : faMagnifyingGlass
                                    }
                                    spin={searchingDiagnosis}
                                    className="
                                        text-[12px]
                                        text-[#999999]
                                    "
                                />

                                <input
                                    value={diagnosisSearch}
                                    onChange={(event) =>
                                        setDiagnosisSearch(event.target.value)
                                    }
                                    placeholder="Cari kode atau diagnosis..."
                                    className="
                                        ml-[9px]
                                        h-full
                                        flex-1
                                        bg-transparent
                                        text-[12px]
                                        text-[#444444]
                                        outline-none
                                        placeholder:text-[#bbbbbb]
                                    "
                                />
                            </div>

                            {/* =================================================
                                RESULTS ICD-10
                            ================================================== */}

                            {diagnosisResults.length > 0 && (
                                <div
                                    className="
                                        absolute
                                        left-0
                                        right-0
                                        top-[47px]
                                        z-30
                                        max-h-[250px]
                                        overflow-y-auto
                                        rounded-[10px]
                                        border
                                        border-[#ececec]
                                        bg-white
                                        p-[5px]
                                        shadow-lg
                                    "
                                >
                                    {diagnosisResults.map((code) => (
                                        <button
                                            key={code.id}
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                handleAddDiagnosis(code)
                                            }
                                            className="
                                                    flex
                                                    w-full
                                                    items-start
                                                    gap-[9px]
                                                    rounded-[7px]
                                                    px-[10px]
                                                    py-[9px]
                                                    text-left
                                                    transition
                                                    hover:bg-[#eaf4ff]
                                                "
                                        >
                                            <FontAwesomeIcon
                                                icon={faPlus}
                                                className="
                                                        mt-[3px]
                                                        text-[10px]
                                                        text-[#1688f8]
                                                    "
                                            />

                                            <div>
                                                <p
                                                    className="
                                                            text-[11px]
                                                            font-semibold
                                                            text-[#343434]
                                                        "
                                                >
                                                    {code.code}
                                                </p>

                                                <p
                                                    className="
                                                            mt-[2px]
                                                            text-[10px]
                                                            text-[#666666]
                                                        "
                                                >
                                                    {code.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* =====================================================
                        DIAGNOSIS LIST
                    ====================================================== */}

                    <div className="mt-[14px] space-y-[8px]">
                        {diagnoses.length === 0 ? (
                            <div
                                className="
                                    rounded-[9px]
                                    bg-[#fafafa]
                                    px-[12px]
                                    py-[14px]
                                    text-[11px]
                                    text-[#aaaaaa]
                                "
                            >
                                Belum ada diagnosis.
                            </div>
                        ) : (
                            diagnoses.map((diagnosis) => (
                                <div
                                    key={diagnosis.id}
                                    className="
                                            flex
                                            items-start
                                            justify-between
                                            gap-[12px]
                                            rounded-[9px]
                                            border
                                            border-[#ececec]
                                            bg-white
                                            p-[12px]
                                        "
                                >
                                    <div>
                                        <div
                                            className="
                                                    flex
                                                    flex-wrap
                                                    items-center
                                                    gap-[7px]
                                                "
                                        >
                                            <p
                                                className="
                                                        text-[12px]
                                                        font-semibold
                                                        text-[#343434]
                                                    "
                                            >
                                                {diagnosis?.code?.code}
                                            </p>

                                            <span
                                                className={`
                                                        rounded-full
                                                        px-[8px]
                                                        py-[3px]
                                                        text-[9px]
                                                        font-medium

                                                        ${
                                                            diagnosis.type ===
                                                            "primary"
                                                                ? "bg-[#eaf4ff] text-[#1688f8]"
                                                                : "bg-[#f0f8f7] text-[#6d9696]"
                                                        }
                                                    `}
                                            >
                                                {diagnosis.type === "primary"
                                                    ? "Utama"
                                                    : "Sekunder"}
                                            </span>
                                        </div>

                                        <p
                                            className="
                                                    mt-[4px]
                                                    text-[11px]
                                                    text-[#666666]
                                                "
                                        >
                                            {diagnosis?.code?.description}
                                        </p>
                                    </div>

                                    {!readOnly && (
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                handleDeleteDiagnosis(
                                                    diagnosis.id,
                                                )
                                            }
                                            className="
                                                    flex
                                                    h-[30px]
                                                    w-[30px]
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-[7px]
                                                    text-[#aaaaaa]
                                                    transition
                                                    hover:bg-red-50
                                                    hover:text-red-500
                                                "
                                        >
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="
                                                        text-[10px]
                                                    "
                                            />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* =========================================================
                    ICD-9-CM
                ========================================================== */}

                <div>
                    <div>
                        <p
                            className="
                                text-[13px]
                                font-semibold
                                text-[#343434]
                            "
                        >
                            Tindakan ICD-9-CM
                        </p>

                        <p
                            className="
                                mt-[2px]
                                text-[11px]
                                text-[#999999]
                            "
                        >
                            Prosedur atau tindakan pelayanan
                        </p>
                    </div>

                    {/* =====================================================
                        SEARCH ICD-9-CM
                    ====================================================== */}

                    {!readOnly && (
                        <div className="relative mt-[12px]">
                            <div
                                className="
                                    flex
                                    h-[42px]
                                    items-center
                                    rounded-[9px]
                                    border
                                    border-[#dddddd]
                                    bg-white
                                    px-[12px]
                                    transition
                                    focus-within:border-[#1688f8]
                                "
                            >
                                <FontAwesomeIcon
                                    icon={
                                        searchingProcedure
                                            ? faSpinner
                                            : faMagnifyingGlass
                                    }
                                    spin={searchingProcedure}
                                    className="
                                        text-[12px]
                                        text-[#999999]
                                    "
                                />

                                <input
                                    value={procedureSearch}
                                    onChange={(event) =>
                                        setProcedureSearch(event.target.value)
                                    }
                                    placeholder="Cari kode atau tindakan..."
                                    className="
                                        ml-[9px]
                                        h-full
                                        flex-1
                                        bg-transparent
                                        text-[12px]
                                        text-[#444444]
                                        outline-none
                                        placeholder:text-[#bbbbbb]
                                    "
                                />
                            </div>

                            {/* =================================================
                                RESULTS ICD-9-CM
                            ================================================== */}

                            {procedureResults.length > 0 && (
                                <div
                                    className="
                                        absolute
                                        left-0
                                        right-0
                                        top-[47px]
                                        z-30
                                        max-h-[250px]
                                        overflow-y-auto
                                        rounded-[10px]
                                        border
                                        border-[#ececec]
                                        bg-white
                                        p-[5px]
                                        shadow-lg
                                    "
                                >
                                    {procedureResults.map((code) => (
                                        <button
                                            key={code.id}
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                handleAddProcedure(code)
                                            }
                                            className="
                                                    flex
                                                    w-full
                                                    items-start
                                                    gap-[9px]
                                                    rounded-[7px]
                                                    px-[10px]
                                                    py-[9px]
                                                    text-left
                                                    transition
                                                    hover:bg-[#f0f8f7]
                                                "
                                        >
                                            <FontAwesomeIcon
                                                icon={faPlus}
                                                className="
                                                        mt-[3px]
                                                        text-[10px]
                                                        text-[#7AB2B2]
                                                    "
                                            />

                                            <div>
                                                <p
                                                    className="
                                                            text-[11px]
                                                            font-semibold
                                                            text-[#343434]
                                                        "
                                                >
                                                    {code.code}
                                                </p>

                                                <p
                                                    className="
                                                            mt-[2px]
                                                            text-[10px]
                                                            text-[#666666]
                                                        "
                                                >
                                                    {code.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* =====================================================
                        PROCEDURE LIST
                    ====================================================== */}

                    <div className="mt-[14px] space-y-[8px]">
                        {procedures.length === 0 ? (
                            <div
                                className="
                                    rounded-[9px]
                                    bg-[#fafafa]
                                    px-[12px]
                                    py-[14px]
                                    text-[11px]
                                    text-[#aaaaaa]
                                "
                            >
                                Belum ada tindakan.
                            </div>
                        ) : (
                            procedures.map((procedure) => (
                                <div
                                    key={procedure.id}
                                    className="
                                            flex
                                            items-start
                                            justify-between
                                            gap-[12px]
                                            rounded-[9px]
                                            border
                                            border-[#ececec]
                                            bg-white
                                            p-[12px]
                                        "
                                >
                                    <div>
                                        <p
                                            className="
                                                    text-[12px]
                                                    font-semibold
                                                    text-[#343434]
                                                "
                                        >
                                            {procedure?.code?.code}
                                        </p>

                                        <p
                                            className="
                                                    mt-[4px]
                                                    text-[11px]
                                                    text-[#666666]
                                                "
                                        >
                                            {procedure?.code?.description}
                                        </p>
                                    </div>

                                    {!readOnly && (
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                handleDeleteProcedure(
                                                    procedure.id,
                                                )
                                            }
                                            className="
                                                    flex
                                                    h-[30px]
                                                    w-[30px]
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-[7px]
                                                    text-[#aaaaaa]
                                                    transition
                                                    hover:bg-red-50
                                                    hover:text-red-500
                                                "
                                        >
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="
                                                        text-[10px]
                                                    "
                                            />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
