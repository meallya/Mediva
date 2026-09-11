import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faBan,
    faCheck,
    faPen,
    faPlay,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import useAuth from "../../auth/hooks/useAuth";

import registrationService from "../services/registrationService";

export default function RegistrationDetailPage() {
    const navigate = useNavigate();

    const { id } = useParams();

    const { hasPermission } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | PERMISSIONS
    |--------------------------------------------------------------------------
    */

    const canEdit = hasPermission("registration.update");

    const canCancel = hasPermission("registration.cancel");

    const canStartService = hasPermission("registration.start_service");

    const canCompleteService = hasPermission("registration.complete_service");

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [registration, setRegistration] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState(false);

    const [showCancelModal, setShowCancelModal] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | LOAD DETAIL
    |--------------------------------------------------------------------------
    */

    const loadRegistration = async () => {
        try {
            setLoading(true);

            setError("");

            const response = await registrationService.getRegistration(id);

            /*
            |--------------------------------------------------------------------------
            | Mendukung beberapa bentuk response API:
            |
            | { data: {...} }
            |
            | atau Axios:
            | { data: { data: {...} } }
            |--------------------------------------------------------------------------
            */

            const data = response?.data?.data ?? response?.data ?? response;

            setRegistration(data);
        } catch (error) {
            console.error("Gagal mengambil detail pendaftaran:", error);

            setError(
                error?.response?.data?.message ||
                    error?.message ||
                    "Gagal mengambil detail pendaftaran.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRegistration();
    }, [id]);

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    const handleCancel = async () => {
        try {
            setActionLoading(true);

            await registrationService.cancelRegistration(id);

            setShowCancelModal(false);

            await loadRegistration();
        } catch (error) {
            console.error("Gagal membatalkan pendaftaran:", error);

            alert(
                error?.response?.data?.message ||
                    error?.message ||
                    "Gagal membatalkan pendaftaran.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | START SERVICE
    |--------------------------------------------------------------------------
    */

    const handleStartService = async () => {
        try {
            setActionLoading(true);

            await registrationService.startService(id);

            await loadRegistration();
        } catch (error) {
            console.error("Gagal memulai pelayanan:", error);

            alert(
                error?.response?.data?.message ||
                    error?.message ||
                    "Gagal memulai pelayanan.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | COMPLETE SERVICE
    |--------------------------------------------------------------------------
    */

    const handleCompleteService = async () => {
        try {
            setActionLoading(true);

            await registrationService.completeService(id);

            await loadRegistration();
        } catch (error) {
            console.error("Gagal menyelesaikan pelayanan:", error);

            alert(
                error?.response?.data?.message ||
                    error?.message ||
                    "Gagal menyelesaikan pelayanan.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | FORMAT DATE
    |--------------------------------------------------------------------------
    */

    const formatDateTime = (value) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /*
    |--------------------------------------------------------------------------
    | VISIT TYPE
    |--------------------------------------------------------------------------
    */

    const getVisitLabel = (visitType) => {
        const labels = {
            outpatient: "Rawat Jalan",
            emergency: "IGD / Gawat Darurat",
            inpatient: "Rawat Inap",
            medical_checkup: "Medical Check Up",
            day_care: "Day Care",
            home_care: "Home Care",
            telemedicine: "Telemedicine",
        };

        return labels[visitType] ?? "-";
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
                    <p
                        className="
                            text-[13px]
                            text-[#888888]
                        "
                    >
                        Memuat detail pendaftaran...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    if (error) {
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
                            bg-red-50
                            p-[20px]
                        "
                    >
                        <p
                            className="
                                text-[13px]
                                text-red-500
                            "
                        >
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/registrations")}
                        className="
                            mt-[18px]
                            text-[12px]
                            font-medium
                            text-[#1688f8]
                        "
                    >
                        Kembali ke Pendaftaran
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    if (!registration) {
        return (
            <DashboardLayout>
                <div
                    className="
                        p-[30px]
                        text-[13px]
                        text-[#888888]
                    "
                >
                    Data pendaftaran tidak ditemukan.
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    const isWaiting = registration.status === "waiting";

    const isInService = registration.status === "in_service";

    return (
        <DashboardLayout>
            <div
                className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
            >
                {/* =====================================================
                    BACK
                ====================================================== */}

                <button
                    type="button"
                    onClick={() => navigate("/registrations")}
                    className="
                        inline-flex
                        items-center
                        gap-[8px]
                        text-[12px]
                        font-medium
                        text-[#777777]
                        transition
                        hover:text-[#1688f8]
                    "
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Kembali
                </button>

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    className="
                        mt-[18px]
                        flex
                        items-start
                        justify-between
                        gap-[20px]
                    "
                >
                    <div>
                        <div
                            className="
                                flex
                                items-center
                                gap-[12px]
                            "
                        >
                            <h1
                                className="
                                    text-[24px]
                                    font-semibold
                                    tracking-[-0.3px]
                                    text-[#343434]
                                "
                            >
                                Detail Pendaftaran
                            </h1>

                            <StatusBadge status={registration.status} />
                        </div>

                        <p
                            className="
                                mt-[5px]
                                text-[12px]
                                text-[#8f8f8f]
                            "
                        >
                            {registration.registration_number}
                        </p>
                    </div>

                    {/* =================================================
                        ACTIONS
                    ================================================== */}

                    <div
                        className="
                            flex
                            items-center
                            gap-[10px]
                        "
                    >
                        {/* =============================================
                            PENDAFTARAN
                            waiting → cancel
                        ============================================== */}

                        {isWaiting && canCancel && (
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(true)}
                                disabled={actionLoading}
                                className="
                                        inline-flex
                                        h-[42px]
                                        items-center
                                        gap-[8px]
                                        rounded-[10px]
                                        border
                                        border-red-200
                                        bg-white
                                        px-[15px]
                                        text-[12px]
                                        font-medium
                                        text-red-500
                                        transition
                                        hover:bg-red-50
                                        disabled:opacity-50
                                    "
                            >
                                <FontAwesomeIcon icon={faBan} />
                                Batalkan
                            </button>
                        )}

                        {/* =============================================
                            PENDAFTARAN
                            waiting → edit
                        ============================================== */}

                        {isWaiting && canEdit && (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/registrations/${registration.id}/edit`,
                                    )
                                }
                                className="
                                        inline-flex
                                        h-[42px]
                                        items-center
                                        gap-[8px]
                                        rounded-[10px]
                                        bg-[#1688f8]
                                        px-[15px]
                                        text-[12px]
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-[#0878e8]
                                    "
                            >
                                <FontAwesomeIcon icon={faPen} />
                                Edit Pendaftaran
                            </button>
                        )}

                        {/* =============================================
                            DOKTER
                            waiting → start
                        ============================================== */}

                        {isWaiting && canStartService && (
                            <button
                                type="button"
                                onClick={handleStartService}
                                disabled={actionLoading}
                                className="
                                        inline-flex
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
                                        disabled:opacity-50
                                    "
                            >
                                <FontAwesomeIcon icon={faPlay} />

                                {actionLoading
                                    ? "Memproses..."
                                    : "Mulai Pelayanan"}
                            </button>
                        )}

                        {/* =============================================
                            DOKTER
                            in_service → complete
                        ============================================== */}

                        {isInService && canCompleteService && (
                            <button
                                type="button"
                                onClick={handleCompleteService}
                                disabled={actionLoading}
                                className="
                                        inline-flex
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
                                        disabled:opacity-50
                                    "
                            >
                                <FontAwesomeIcon icon={faCheck} />

                                {actionLoading
                                    ? "Memproses..."
                                    : "Selesai Pelayanan"}
                            </button>
                        )}
                    </div>
                </div>

                {/* =====================================================
                    CONTENT GRID
                ====================================================== */}

                <div
                    className="
                        mt-[25px]
                        grid
                        grid-cols-1
                        gap-[20px]
                        xl:grid-cols-2
                    "
                >
                    {/* =================================================
                        PATIENT
                    ================================================== */}

                    <DetailCard title="Data Pasien">
                        <DetailRow
                            label="No. Rekam Medis"
                            value={registration.patient?.medical_record_number}
                        />

                        <DetailRow
                            label="Nama Pasien"
                            value={registration.patient?.name}
                        />

                        <DetailRow
                            label="NIK"
                            value={registration.patient?.nik}
                        />

                        <DetailRow
                            label="Jenis Kelamin"
                            value={
                                registration.patient?.gender === "male"
                                    ? "Laki-laki"
                                    : registration.patient?.gender === "female"
                                      ? "Perempuan"
                                      : "-"
                            }
                        />

                        <DetailRow
                            label="Tanggal Lahir"
                            value={
                                registration.patient?.date_of_birth ??
                                registration.patient?.birth_date
                            }
                        />

                        <DetailRow
                            label="No. Telepon"
                            value={registration.patient?.phone}
                        />
                    </DetailCard>

                    {/* =================================================
                        REGISTRATION
                    ================================================== */}

                    <DetailCard title="Informasi Kunjungan">
                        <DetailRow
                            label="No. Registrasi"
                            value={registration.registration_number}
                        />

                        <DetailRow
                            label="Unit Pelayanan"
                            value={registration.unit?.name}
                        />

                        <DetailRow
                            label="Jenis Kunjungan"
                            value={getVisitLabel(registration.visit_type)}
                        />

                        <DetailRow
                            label="Tanggal Pendaftaran"
                            value={formatDateTime(registration.registered_at)}
                        />

                        <DetailRow
                            label="Status"
                            value={<StatusBadge status={registration.status} />}
                        />
                    </DetailCard>
                </div>

                {/* =====================================================
                    COMPLAINT
                ====================================================== */}

                <div
                    className="
                        mt-[20px]
                        rounded-[15px]
                        border
                        border-[#e8e8e8]
                        bg-white
                    "
                >
                    <div
                        className="
                            border-b
                            border-[#eeeeee]
                            px-[24px]
                            py-[18px]
                        "
                    >
                        <h2
                            className="
                                text-[14px]
                                font-semibold
                                text-[#444444]
                            "
                        >
                            Keluhan Pasien
                        </h2>
                    </div>

                    <div
                        className="
                            min-h-[100px]
                            px-[24px]
                            py-[20px]
                        "
                    >
                        <p
                            className="
                                whitespace-pre-line
                                text-[13px]
                                leading-[1.7]
                                text-[#666666]
                            "
                        >
                            {registration.complaint ||
                                "Tidak ada keluhan yang dicatat."}
                        </p>
                    </div>
                </div>
            </div>

            {/* =========================================================
                CANCEL MODAL
            ========================================================== */}

            {showCancelModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        bg-black/30
                        px-[20px]
                    "
                >
                    <div
                        className="
                            w-full
                            max-w-[420px]
                            rounded-[16px]
                            bg-white
                            p-[24px]
                            shadow-xl
                        "
                    >
                        <h3
                            className="
                                text-[16px]
                                font-semibold
                                text-[#343434]
                            "
                        >
                            Batalkan Pendaftaran?
                        </h3>

                        <p
                            className="
                                mt-[8px]
                                text-[12px]
                                leading-[1.6]
                                text-[#777777]
                            "
                        >
                            Pendaftaran pasien akan diubah menjadi status
                            dibatalkan.
                        </p>

                        <div
                            className="
                                mt-[24px]
                                flex
                                justify-end
                                gap-[10px]
                            "
                        >
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                disabled={actionLoading}
                                className="
                                    h-[40px]
                                    rounded-[9px]
                                    border
                                    border-[#e5e5e5]
                                    px-[15px]
                                    text-[12px]
                                    font-medium
                                    text-[#666666]
                                "
                            >
                                Tidak
                            </button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="
                                    h-[40px]
                                    rounded-[9px]
                                    bg-red-500
                                    px-[15px]
                                    text-[12px]
                                    font-medium
                                    text-white
                                    disabled:opacity-50
                                "
                            >
                                {actionLoading
                                    ? "Memproses..."
                                    : "Ya, Batalkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| DETAIL CARD
|--------------------------------------------------------------------------
*/

function DetailCard({ title, children }) {
    return (
        <div
            className="
                overflow-hidden
                rounded-[15px]
                border
                border-[#e8e8e8]
                bg-white
            "
        >
            <div
                className="
                    border-b
                    border-[#eeeeee]
                    px-[24px]
                    py-[18px]
                "
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
            </div>

            <div>{children}</div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({ label, value }) {
    return (
        <div
            className="
                grid
                min-h-[62px]
                grid-cols-[170px_1fr]
                items-center
                border-b
                border-[#f1f1f1]
                px-[24px]
                last:border-b-0
            "
        >
            <p
                className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.2px]
                    text-[#999999]
                "
            >
                {label}
            </p>

            <div
                className="
                    text-[13px]
                    font-medium
                    text-[#4d4d4d]
                "
            >
                {value || "-"}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
    const config = {
        waiting: {
            label: "Menunggu",
            className: "bg-amber-50 text-amber-600",
        },

        in_service: {
            label: "Dilayani",
            className: "bg-blue-50 text-blue-600",
        },

        completed: {
            label: "Selesai",
            className: "bg-green-50 text-green-600",
        },

        cancelled: {
            label: "Dibatalkan",
            className: "bg-red-50 text-red-500",
        },
    };

    const item = config[status] ?? {
        label: "-",
        className: "bg-gray-100 text-gray-500",
    };

    return (
        <span
            className={`
                inline-flex
                rounded-[7px]
                px-[9px]
                py-[5px]
                text-[10px]
                font-medium
                ${item.className}
            `}
        >
            {item.label}
        </span>
    );
}
