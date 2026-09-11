import React, { useContext, useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import { AuthContext } from "../../../shared/context/AuthContext";

import queueService from "../services/queueService";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getData(response) {
    if (response?.data?.data) {
        return response.data.data;
    }

    if (response?.data) {
        return response.data;
    }

    return response;
}

function getStatusLabel(status) {
    const labels = {
        waiting: "Menunggu",
        called: "Dipanggil",
        in_service: "Dilayani",
        completed: "Selesai",
        skipped: "Dilewati",
    };

    return labels[status] ?? status ?? "-";
}

function getVisitTypeLabel(type) {
    const labels = {
        outpatient: "Rawat Jalan",
        emergency: "IGD",
        inpatient: "Rawat Inap",
    };

    return labels[type] ?? type ?? "-";
}

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

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

/*
|--------------------------------------------------------------------------
| INFO COMPONENT
|--------------------------------------------------------------------------
*/

function Info({ label, value }) {
    return (
        <div>
            <p className="text-[11px] text-[#999999]">{label}</p>

            <p className="mt-[3px] text-[13px] font-medium text-[#444444]">
                {value ?? "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function QueueDetailPage() {
    const { id } = useParams();

    const { permissions = [] } = useContext(AuthContext);

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [queue, setQueue] = useState(null);

    const [loading, setLoading] = useState(true);

    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | PERMISSIONS
    |--------------------------------------------------------------------------
    */

    const canCall = permissions.includes("queue.call");

    const canStart = permissions.includes("queue.start_service");

    /*
    |--------------------------------------------------------------------------
    | MEDICAL EXAMINATION
    |--------------------------------------------------------------------------
    */

    const canExamine = permissions.includes("examination.view");

    /*
    |--------------------------------------------------------------------------
    | LOAD QUEUE DETAIL
    |--------------------------------------------------------------------------
    */

    const loadQueue = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await queueService.getQueue(id);

            setQueue(getData(response));
        } catch (error) {
            console.error("Gagal mengambil detail antrean:", error);

            setError(error?.message ?? "Gagal mengambil detail antrean.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, [id]);

    /*
    |--------------------------------------------------------------------------
    | ACTION HELPER
    |--------------------------------------------------------------------------
    */

    const executeAction = async (callback) => {
        try {
            setActionLoading(true);

            setError("");

            await callback();

            await loadQueue();
        } catch (error) {
            console.error("Aksi antrean gagal:", error);

            setError(error?.message ?? "Aksi antrean gagal dilakukan.");
        } finally {
            setActionLoading(false);
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
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                    <p className="text-[12px] text-[#999999]">
                        Memuat detail antrean...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!queue) {
        return (
            <DashboardLayout>
                <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                    <p className="text-[13px] text-red-600">
                        {error || "Data antrean tidak ditemukan."}
                    </p>

                    <Link
                        to="/queues"
                        className="mt-[15px] inline-block text-[12px] font-medium text-[#1688f8]"
                    >
                        Kembali ke Antrean
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RELATION DATA
    |--------------------------------------------------------------------------
    */

    const visit = queue?.visit;

    const patient = visit?.patient;

    const registration = visit?.registration;

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

                <div className="mb-[24px] flex flex-wrap items-start justify-between gap-[15px]">
                    <div>
                        <Link
                            to="/queues"
                            className="text-[11px] font-medium text-[#527873]"
                        >
                            ← Kembali ke Antrean
                        </Link>

                        <h1 className="mt-[8px] text-[24px] font-semibold text-[#343434]">
                            Detail Antrean
                        </h1>

                        <p className="mt-[5px] text-[12px] text-[#999999]">
                            Informasi antrean dan pelayanan pasien
                        </p>
                    </div>

                    {/* QUEUE NUMBER */}

                    <div className="min-w-[120px] rounded-[14px] border border-[#e9e9e9] bg-white px-[20px] py-[13px] text-center">
                        <p className="text-[24px] font-semibold text-[#343434]">
                            {queue.queue_number}
                        </p>

                        <p className="mt-[2px] text-[11px] text-[#888888]">
                            {getStatusLabel(queue.status)}
                        </p>
                    </div>
                </div>

                {/* =========================================================
                    ERROR
                ========================================================== */}

                {error && (
                    <div className="mb-[18px] rounded-[10px] bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                {/* =========================================================
                    INFORMATION GRID
                ========================================================== */}

                <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
                    {/* =====================================================
                        PATIENT
                    ====================================================== */}

                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                        <h2 className="mb-[18px] text-[15px] font-semibold text-[#343434]">
                            Informasi Pasien
                        </h2>

                        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                            <Info label="Nama Pasien" value={patient?.name} />

                            <Info
                                label="No. Rekam Medis"
                                value={patient?.medical_record_number}
                            />

                            <Info label="NIK" value={patient?.nik} />

                            <Info
                                label="Jenis Kelamin"
                                value={getGenderLabel(patient?.gender)}
                            />
                        </div>
                    </section>

                    {/* =====================================================
                        VISIT
                    ====================================================== */}

                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px]">
                        <h2 className="mb-[18px] text-[15px] font-semibold text-[#343434]">
                            Informasi Kunjungan
                        </h2>

                        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                            <Info
                                label="Nomor Kunjungan"
                                value={visit?.visit_number}
                            />

                            <Info
                                label="Nomor Pendaftaran"
                                value={registration?.registration_number}
                            />

                            <Info
                                label="Unit / Poli"
                                value={queue?.unit?.name}
                            />

                            <Info
                                label="Jenis Kunjungan"
                                value={getVisitTypeLabel(visit?.visit_type)}
                            />
                        </div>
                    </section>

                    {/* =====================================================
                        QUEUE
                    ====================================================== */}

                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px] lg:col-span-2">
                        <h2 className="mb-[18px] text-[15px] font-semibold text-[#343434]">
                            Informasi Antrean
                        </h2>

                        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
                            <Info
                                label="Nomor Antrean"
                                value={queue.queue_number}
                            />

                            <Info
                                label="Status"
                                value={getStatusLabel(queue.status)}
                            />

                            <Info label="Prioritas" value={queue.priority} />

                            <Info label="Loket" value={queue.counter} />
                        </div>
                    </section>

                    {/* =====================================================
                        TIME
                    ====================================================== */}

                    <section className="rounded-[14px] border border-[#ececec] bg-white p-[20px] lg:col-span-2">
                        <h2 className="mb-[18px] text-[15px] font-semibold text-[#343434]">
                            Waktu Pelayanan
                        </h2>

                        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
                            <Info
                                label="Ambil Antrean"
                                value={formatDateTime(queue.taken_at)}
                            />

                            <Info
                                label="Dipanggil"
                                value={formatDateTime(queue.called_at)}
                            />

                            <Info
                                label="Mulai Pelayanan"
                                value={formatDateTime(queue.started_at)}
                            />

                            <Info
                                label="Selesai"
                                value={formatDateTime(queue.completed_at)}
                            />
                        </div>
                    </section>
                </div>

                {/* =========================================================
                    ACTION BUTTONS
                ========================================================== */}

                <div className="mt-[20px] flex flex-wrap justify-end gap-[10px]">
                    {/* =====================================================
                        CALL PATIENT

                        waiting
                        →
                        called
                    ====================================================== */}

                    {canCall && queue.status === "waiting" && (
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                                executeAction(() =>
                                    queueService.callPatient(queue.id),
                                )
                            }
                            className="
                                    rounded-[9px]
                                    border
                                    border-[#dcdcdc]
                                    bg-white
                                    px-[16px]
                                    py-[10px]
                                    text-[12px]
                                    font-medium
                                    text-[#555555]
                                    transition
                                    hover:bg-[#f7f7f7]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                        >
                            {actionLoading ? "Memproses..." : "Panggil Pasien"}
                        </button>
                    )}

                    {/* =====================================================
                        START SERVICE

                        waiting / called
                        →
                        in_service
                    ====================================================== */}

                    {canStart &&
                        ["waiting", "called"].includes(queue.status) && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() =>
                                    executeAction(() =>
                                        queueService.startService(queue.id),
                                    )
                                }
                                className="
                                    rounded-[9px]
                                    bg-[#315f5a]
                                    px-[16px]
                                    py-[10px]
                                    text-[12px]
                                    font-medium
                                    text-white
                                    transition
                                    hover:opacity-90
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {actionLoading
                                    ? "Memproses..."
                                    : "Mulai Pelayanan"}
                            </button>
                        )}

                    {/* =====================================================
                        OPEN MEDICAL EXAMINATION

                        in_service
                        →
                        buka SOAP
                    ====================================================== */}

                    {canExamine &&
                        visit?.id &&
                        queue.status === "in_service" && (
                            <Link
                                to={`/examinations/visit/${visit.id}`}
                                className="
                                    rounded-[9px]
                                    bg-[#1688f8]
                                    px-[16px]
                                    py-[10px]
                                    text-[12px]
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-[#0f7be8]
                                "
                            >
                                Buka Pemeriksaan
                            </Link>
                        )}

                    {/* =====================================================
                        VIEW COMPLETED EXAMINATION
                    ====================================================== */}

                    {canExamine &&
                        visit?.id &&
                        queue.status === "completed" && (
                            <Link
                                to={`/examinations/visit/${visit.id}`}
                                className="
                                    rounded-[9px]
                                    border
                                    border-[#1688f8]
                                    bg-white
                                    px-[16px]
                                    py-[10px]
                                    text-[12px]
                                    font-medium
                                    text-[#1688f8]
                                    transition
                                    hover:bg-[#eaf4ff]
                                "
                            >
                                Lihat Pemeriksaan
                            </Link>
                        )}
                </div>
            </div>
        </DashboardLayout>
    );
}
