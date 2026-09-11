import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowLeft,
    faDroplet,
    faFileMedical,
    faIdCard,
    faLocationDot,
    faMarsAndVenus,
    faPen,
    faPhone,
    faSpinner,
    faTrash,
    faTriangleExclamation,
    faUser,
    faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import useAuth from "../../auth/hooks/useAuth";

import patientService from "../services/patientService";

export default function PatientDetailPage() {
    const navigate = useNavigate();

    const { id } = useParams();

    const { hasPermission } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | PERMISSIONS
    |--------------------------------------------------------------------------
    |
    | IT:
    | patient.view
    |
    | Dokter:
    | patient.view
    |
    | Pendaftaran:
    | patient.view
    | patient.create
    | patient.update
    |
    */

    const canUpdate = hasPermission("patient.update");

    const canDelete = hasPermission("patient.delete");

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [patient, setPatient] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [deleting, setDeleting] = useState(false);

    const [deleteError, setDeleteError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD PATIENT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadPatient = async () => {
            try {
                setLoading(true);

                setError("");

                const response = await patientService.getPatient(id);

                const data = response?.data ?? response ?? null;

                setPatient(data);
            } catch (error) {
                console.error("Gagal mengambil detail pasien:", error);

                if (error.status === 404) {
                    setError("Data pasien tidak ditemukan.");

                    return;
                }

                setError(error.message || "Gagal mengambil detail pasien.");
            } finally {
                setLoading(false);
            }
        };

        loadPatient();
    }, [id]);

    /*
    |--------------------------------------------------------------------------
    | DELETE PATIENT
    |--------------------------------------------------------------------------
    |
    | Saat ini permission patient.delete tidak diberikan
    | ke IT, Dokter, maupun Pendaftaran.
    |
    | Kode tetap disiapkan kalau nanti ada role khusus
    | yang memang mempunyai izin tersebut.
    |
    */

    const handleDelete = async () => {
        if (!patient) {
            return;
        }

        try {
            setDeleting(true);

            setDeleteError("");

            await patientService.deletePatient(patient.id);

            navigate("/patients", {
                replace: true,
            });
        } catch (error) {
            console.error("Gagal menghapus pasien:", error);

            setDeleteError(
                error.data?.message ||
                    error.message ||
                    "Gagal menghapus data pasien.",
            );
        } finally {
            setDeleting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | GENDER
    |--------------------------------------------------------------------------
    */

    const getGenderLabel = (gender) => {
        if (gender === "male") {
            return "Laki-laki";
        }

        if (gender === "female") {
            return "Perempuan";
        }

        return "-";
    };

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    /*
    |--------------------------------------------------------------------------
    | AGE
    |--------------------------------------------------------------------------
    */

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) {
            return "-";
        }

        const birthDate = new Date(dateOfBirth);

        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();

        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (monthDifference === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        return `${age} tahun`;
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
                    <div
                        className="
                            flex
                            items-center
                            gap-[10px]
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

                        <p
                            className="
                                text-[13px]
                                text-[#888888]
                            "
                        >
                            Memuat detail pasien...
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR / NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (error || !patient) {
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
                        onClick={() => navigate("/patients")}
                        className="
                            flex
                            items-center
                            gap-[7px]
                            text-[12px]
                            font-medium
                            text-[#1688f8]
                        "
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Kembali ke Data Pasien
                    </button>

                    <div
                        className="
                            mt-[25px]
                            rounded-[14px]
                            border
                            border-red-100
                            bg-white
                            p-[35px]
                            text-center
                        "
                    >
                        <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            className="
                                text-[28px]
                                text-red-400
                            "
                        />

                        <p
                            className="
                                mt-[12px]
                                text-[13px]
                                text-red-500
                            "
                        >
                            {error || "Data pasien tidak ditemukan."}
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <>
            <DashboardLayout>
                <div
                    className="
                        min-h-[calc(100vh-88px)]
                        bg-[#fafbfc]
                        p-[30px]
                    "
                >
                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <div
                        className="
                            flex
                            items-start
                            justify-between
                            gap-[20px]
                        "
                    >
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate("/patients")}
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
                                Kembali ke Data Pasien
                            </button>

                            <h1
                                className="
                                    text-[24px]
                                    font-semibold
                                    tracking-[-0.3px]
                                    text-[#343434]
                                "
                            >
                                Detail Pasien
                            </h1>

                            <p
                                className="
                                    mt-[5px]
                                    text-[12px]
                                    leading-[1.5]
                                    text-[#8f8f8f]
                                "
                            >
                                Informasi lengkap pasien MEDIVA
                            </p>
                        </div>

                        {/* =================================================
                            ACTION
                        ================================================== */}

                        <div
                            className="
                                flex
                                items-center
                                gap-[10px]
                            "
                        >
                            {/* DELETE */}

                            {canDelete && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteError("");

                                        setShowDeleteModal(true);
                                    }}
                                    className="
                                        flex
                                        h-[42px]
                                        items-center
                                        gap-[8px]
                                        rounded-[10px]
                                        border
                                        border-red-200
                                        bg-white
                                        px-[16px]
                                        text-[12px]
                                        font-medium
                                        text-red-500
                                        transition
                                        hover:bg-red-50
                                    "
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                    Hapus
                                </button>
                            )}

                            {/* EDIT */}

                            {canUpdate && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(`/patients/${patient.id}/edit`)
                                    }
                                    className="
                                        flex
                                        h-[42px]
                                        items-center
                                        gap-[8px]
                                        rounded-[10px]
                                        bg-[#1688f8]
                                        px-[16px]
                                        text-[12px]
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-[#0878e8]
                                    "
                                >
                                    <FontAwesomeIcon icon={faPen} />
                                    Edit Pasien
                                </button>
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        PATIENT SUMMARY
                    ================================================== */}

                    <div
                        className="
                            mt-[25px]
                            rounded-[14px]
                            border
                            border-[#eeeeee]
                            bg-white
                            p-[22px]
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                gap-[16px]
                            "
                        >
                            {/* AVATAR */}

                            <div
                                className="
                                    flex
                                    h-[60px]
                                    w-[60px]
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#eaf4ff]
                                    text-[#1688f8]
                                "
                            >
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="
                                        text-[21px]
                                    "
                                />
                            </div>

                            {/* PROFILE */}

                            <div>
                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-[9px]
                                    "
                                >
                                    <h2
                                        className="
                                            text-[18px]
                                            font-semibold
                                            text-[#3d3d3d]
                                        "
                                    >
                                        {patient.name}
                                    </h2>

                                    <span
                                        className={`
                                            rounded-[6px]
                                            px-[8px]
                                            py-[4px]
                                            text-[10px]
                                            font-medium

                                            ${
                                                patient.is_active
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-gray-100 text-gray-500"
                                            }
                                        `}
                                    >
                                        {patient.is_active
                                            ? "Aktif"
                                            : "Nonaktif"}
                                    </span>
                                </div>

                                <div
                                    className="
                                        mt-[7px]
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-[10px]
                                        text-[12px]
                                        text-[#888888]
                                    "
                                >
                                    <span>
                                        {patient.medical_record_number || "-"}
                                    </span>

                                    <span>•</span>

                                    <span>
                                        {getGenderLabel(patient.gender)}
                                    </span>

                                    <span>•</span>

                                    <span>
                                        {calculateAge(patient.date_of_birth)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        DETAILS
                    ================================================== */}

                    <div
                        className="
                            mt-[20px]
                            grid
                            grid-cols-1
                            gap-[20px]
                            xl:grid-cols-2
                        "
                    >
                        {/* =================================================
                            IDENTITY
                        ================================================== */}

                        <DetailCard
                            title="Identitas Pasien"
                            description="Informasi identitas utama pasien"
                        >
                            <DetailItem
                                icon={faFileMedical}
                                label="No. Rekam Medis"
                                value={patient.medical_record_number || "-"}
                            />

                            <DetailItem
                                icon={faIdCard}
                                label="NIK"
                                value={patient.nik || "-"}
                            />

                            <DetailItem
                                icon={faMarsAndVenus}
                                label="Jenis Kelamin"
                                value={getGenderLabel(patient.gender)}
                            />

                            <DetailItem
                                icon={faUser}
                                label="Tanggal Lahir"
                                value={`${formatDate(
                                    patient.date_of_birth,
                                )} (${calculateAge(patient.date_of_birth)})`}
                            />

                            <DetailItem
                                icon={faDroplet}
                                label="Golongan Darah"
                                value={patient.blood_type || "-"}
                            />
                        </DetailCard>

                        {/* =================================================
                            CONTACT
                        ================================================== */}

                        <DetailCard
                            title="Kontak & Alamat"
                            description="Informasi komunikasi pasien"
                        >
                            <DetailItem
                                icon={faPhone}
                                label="Nomor Telepon"
                                value={patient.phone || "-"}
                            />

                            <DetailItem
                                icon={faLocationDot}
                                label="Alamat"
                                value={patient.address || "-"}
                            />

                            <DetailItem
                                icon={faUserShield}
                                label="Kontak Darurat"
                                value={patient.emergency_contact || "-"}
                            />
                        </DetailCard>
                    </div>

                    {/* =================================================
                        SYSTEM INFO
                    ================================================== */}

                    <div className="mt-[20px]">
                        <DetailCard
                            title="Informasi Sistem"
                            description="Informasi data pasien di MEDIVA"
                        >
                            <DetailItem
                                icon={faFileMedical}
                                label="IHS Number"
                                value={patient.ihs_number || "Belum tersedia"}
                            />

                            <DetailItem
                                icon={faUser}
                                label="Tanggal Dibuat"
                                value={formatDate(patient.created_at)}
                            />

                            <DetailItem
                                icon={faUser}
                                label="Terakhir Diubah"
                                value={formatDate(patient.updated_at)}
                            />
                        </DetailCard>
                    </div>
                </div>
            </DashboardLayout>

            {/* =============================================================
                DELETE MODAL
            ============================================================== */}

            {showDeleteModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[9999]
                        flex
                        items-center
                        justify-center
                        bg-black/30
                        px-[20px]
                        backdrop-blur-[1px]
                    "
                >
                    <div
                        className="
                            w-full
                            max-w-[430px]
                            overflow-hidden
                            rounded-[16px]
                            border
                            border-[#eeeeee]
                            bg-white
                            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
                        "
                    >
                        {/* =============================================
                            MODAL CONTENT
                        ============================================== */}

                        <div
                            className="
                                px-[26px]
                                pb-[22px]
                                pt-[26px]
                                text-center
                            "
                        >
                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-[52px]
                                    w-[52px]
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-red-50
                                    text-red-500
                                "
                            >
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className="
                                        text-[21px]
                                    "
                                />
                            </div>

                            <h3
                                className="
                                    mt-[16px]
                                    text-[17px]
                                    font-semibold
                                    text-[#3d3d3d]
                                "
                            >
                                Hapus Data Pasien?
                            </h3>

                            <p
                                className="
                                    mt-[8px]
                                    text-[12px]
                                    leading-[1.6]
                                    text-[#888888]
                                "
                            >
                                Data pasien{" "}
                                <span
                                    className="
                                        font-semibold
                                        text-[#555555]
                                    "
                                >
                                    {patient.name}
                                </span>{" "}
                                akan dihapus dari daftar pasien.
                            </p>

                            {/* MEDICAL RECORD NUMBER */}

                            <div
                                className="
                                    mt-[15px]
                                    rounded-[9px]
                                    bg-[#fafafa]
                                    px-[12px]
                                    py-[10px]
                                "
                            >
                                <p
                                    className="
                                        text-[11px]
                                        text-[#888888]
                                    "
                                >
                                    No. Rekam Medis
                                </p>

                                <p
                                    className="
                                        mt-[2px]
                                        text-[13px]
                                        font-semibold
                                        text-[#555555]
                                    "
                                >
                                    {patient.medical_record_number}
                                </p>
                            </div>

                            {/* ERROR */}

                            {deleteError && (
                                <div
                                    className="
                                        mt-[15px]
                                        rounded-[9px]
                                        bg-red-50
                                        px-[12px]
                                        py-[9px]
                                        text-[11px]
                                        text-red-500
                                    "
                                >
                                    {deleteError}
                                </div>
                            )}
                        </div>

                        {/* =============================================
                            MODAL FOOTER
                        ============================================== */}

                        <div
                            className="
                                flex
                                items-center
                                justify-end
                                gap-[10px]
                                border-t
                                border-[#eeeeee]
                                bg-[#fafbfc]
                                px-[20px]
                                py-[15px]
                            "
                        >
                            {/* CANCEL */}

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => {
                                    setShowDeleteModal(false);

                                    setDeleteError("");
                                }}
                                className="
                                    h-[40px]
                                    rounded-[9px]
                                    border
                                    border-[#dddddd]
                                    bg-white
                                    px-[16px]
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

                            {/* DELETE */}

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="
                                    flex
                                    h-[40px]
                                    items-center
                                    gap-[7px]
                                    rounded-[9px]
                                    bg-red-500
                                    px-[16px]
                                    text-[12px]
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-red-600
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            >
                                <FontAwesomeIcon
                                    icon={deleting ? faSpinner : faTrash}
                                    spin={deleting}
                                />

                                {deleting ? "Menghapus..." : "Hapus Pasien"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/*
|--------------------------------------------------------------------------
| DETAIL CARD
|--------------------------------------------------------------------------
*/

function DetailCard({ title, description, children }) {
    return (
        <div
            className="
                overflow-hidden
                rounded-[14px]
                border
                border-[#eeeeee]
                bg-white
            "
        >
            {/* HEADER */}

            <div
                className="
                    border-b
                    border-[#eeeeee]
                    px-[20px]
                    py-[16px]
                "
            >
                <h3
                    className="
                        text-[14px]
                        font-semibold
                        text-[#444444]
                    "
                >
                    {title}
                </h3>

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

            {/* CONTENT */}

            <div
                className="
                    divide-y
                    divide-[#f2f2f2]
                    px-[20px]
                "
            >
                {children}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| DETAIL ITEM
|--------------------------------------------------------------------------
*/

function DetailItem({ icon, label, value }) {
    return (
        <div
            className="
                flex
                gap-[13px]
                py-[15px]
            "
        >
            {/* ICON */}

            <div
                className="
                    flex
                    h-[34px]
                    w-[34px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[8px]
                    bg-[#f4f8fc]
                    text-[#1688f8]
                "
            >
                <FontAwesomeIcon
                    icon={icon}
                    className="
                        text-[13px]
                    "
                />
            </div>

            {/* VALUE */}

            <div className="min-w-0">
                <p
                    className="
                        text-[11px]
                        font-medium
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
                        leading-[1.5]
                        text-[#555555]
                    "
                >
                    {value}
                </p>
            </div>
        </div>
    );
}
