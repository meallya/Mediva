import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faCalendarCheck,
    faCircleCheck,
    faClock,
    faListOl,
    faStethoscope,
    faUserInjured,
    faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import useAuth from "../../auth/hooks/useAuth";

import api from "../../../shared/services/api";

import AdministrationDashboard from "../roles/AdministrationDashboard";

import PharmacyDashboard from "../roles/PharmacyDashboard";

import FinanceDashboard from "../roles/FinanceDashboard";

import ManagementDashboard from "../roles/ManagementDashboard";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function total(response) {
    return Number(response?.total ?? 0);
}

export default function DashboardPage() {
    const { activeRole } = useAuth();

    const role = activeRole?.slug ?? "";

    console.log("ACTIVE ROLE DASHBOARD:", activeRole);

    if (role === "administration") {
        return <AdministrationDashboard />;
    }

    if (role === "pharmacy") {
        return <PharmacyDashboard />;
    }

    if (role === "finance") {
        return <FinanceDashboard />;
    }

    if (role === "management") {
        return <ManagementDashboard />;
    }

    return <OperationalDashboard />;
}

/*
|--------------------------------------------------------------------------
| OPERATIONAL DASHBOARD
|--------------------------------------------------------------------------
|
| Existing dashboard:
|
| - Doctor
| - Registration
| - IT
|
*/

function OperationalDashboard() {
    const { user, activeRole } = useAuth();

    const role = activeRole?.slug ?? "";

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        patients: 0,

        registrations: 0,

        cancelled: 0,

        waiting: 0,

        called: 0,

        inService: 0,

        completed: 0,
    });

    /*
    |--------------------------------------------------------------------------
    | LOAD DASHBOARD STATISTICS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                const date = today();

                const [
                    patients,

                    registrations,

                    cancelled,

                    waiting,

                    called,

                    inService,

                    completed,
                ] = await Promise.all([
                    /*
                                |--------------------------------------------------------------------------
                                | PATIENTS
                                |--------------------------------------------------------------------------
                                */

                    api.get("/patients?page=1"),

                    /*
                                |--------------------------------------------------------------------------
                                | REGISTRATIONS
                                |--------------------------------------------------------------------------
                                */

                    api.get(`/registrations?date=${date}&page=1`),

                    api.get(
                        `/registrations?date=${date}&status=cancelled&page=1`,
                    ),

                    /*
                                |--------------------------------------------------------------------------
                                | QUEUES
                                |--------------------------------------------------------------------------
                                */

                    api.get(
                        `/queues?date=${date}&service_type=clinic&status=waiting&page=1`,
                    ),

                    api.get(
                        `/queues?date=${date}&service_type=clinic&status=called&page=1`,
                    ),

                    api.get(
                        `/queues?date=${date}&service_type=clinic&status=in_service&page=1`,
                    ),

                    api.get(
                        `/queues?date=${date}&service_type=clinic&status=completed&page=1`,
                    ),
                ]);

                /*
                    |--------------------------------------------------------------------------
                    | SET STATISTICS
                    |--------------------------------------------------------------------------
                    */

                setStats({
                    patients: total(patients),

                    registrations: total(registrations),

                    cancelled: total(cancelled),

                    waiting: total(waiting),

                    called: total(called),

                    inService: total(inService),

                    completed: total(completed),
                });
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [role]);

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD CONFIG
    |--------------------------------------------------------------------------
    */

    const config = getDashboard(role, stats);

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

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
                    HEADER
                ====================================================== */}

                <div>
                    <h1
                        className="
                            text-[24px]
                            font-semibold
                            text-[#343434]
                        "
                    >
                        {config.title}
                    </h1>

                    <p
                        className="
                            mt-[5px]
                            text-[12px]
                            text-[#999999]
                        "
                    >
                        Selamat datang, {user?.name ?? "Staff MEDIVA"}
                    </p>

                    <div
                        className="
                            mt-[10px]
                            flex
                            gap-[8px]
                        "
                    >
                        {/* ROLE */}

                        <span
                            className="
                                rounded-full
                                bg-[#eaf4ff]
                                px-[10px]
                                py-[5px]
                                text-[10px]
                                font-medium
                                text-[#1688f8]
                            "
                        >
                            {activeRole?.name ?? "-"}
                        </span>

                        {/* UNIT */}

                        <span
                            className="
                                rounded-full
                                bg-white
                                px-[10px]
                                py-[5px]
                                text-[10px]
                                text-[#888888]
                                shadow-sm
                            "
                        >
                            {activeRole?.unit?.name ?? "-"}
                        </span>
                    </div>
                </div>

                {/* =====================================================
                    DESCRIPTION
                ====================================================== */}

                <div className="mt-[24px]">
                    <h2
                        className="
                            text-[18px]
                            font-semibold
                            text-[#343434]
                        "
                    >
                        {config.sectionTitle}
                    </h2>

                    <p
                        className="
                            mt-[4px]
                            text-[12px]
                            text-[#999999]
                        "
                    >
                        {config.description}
                    </p>
                </div>

                {/* =====================================================
                    CARDS
                ====================================================== */}

                <div
                    className="
                        mt-[18px]
                        grid
                        grid-cols-1
                        gap-[14px]
                        sm:grid-cols-2
                        xl:grid-cols-4
                    "
                >
                    {config.cards.map((card) => (
                        <Card key={card.label} {...card} loading={loading} />
                    ))}
                </div>

                {/* =====================================================
                    QUICK ACCESS
                ====================================================== */}

                <section
                    className="
                        mt-[20px]
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
                        Akses Cepat
                    </h2>

                    <p
                        className="
                            mt-[3px]
                            text-[11px]
                            text-[#999999]
                        "
                    >
                        Menu utama sesuai pekerjaan role aktif.
                    </p>

                    <div
                        className="
                            mt-[15px]
                            flex
                            flex-wrap
                            gap-[9px]
                        "
                    >
                        {config.links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="
                                        rounded-[9px]
                                        border
                                        border-[#dddddd]
                                        px-[14px]
                                        py-[9px]
                                        text-[12px]
                                        font-medium
                                        text-[#555555]
                                        transition
                                        hover:bg-[#f7f9fb]
                                    "
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| CARD
|--------------------------------------------------------------------------
*/

function Card({ label, value, icon, loading }) {
    return (
        <div
            className="
                rounded-[14px]
                border
                border-[#ececec]
                bg-white
                p-[18px]
            "
        >
            <div
                className="
                    flex
                    h-[38px]
                    w-[38px]
                    items-center
                    justify-center
                    rounded-[10px]
                    bg-[#eaf4ff]
                    text-[#1688f8]
                "
            >
                <FontAwesomeIcon icon={icon} className="text-[14px]" />
            </div>

            <p
                className="
                    mt-[17px]
                    text-[24px]
                    font-semibold
                    text-[#343434]
                "
            >
                {loading ? "..." : value}
            </p>

            <p
                className="
                    mt-[3px]
                    text-[11px]
                    text-[#999999]
                "
            >
                {label}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| DASHBOARD CONFIG
|--------------------------------------------------------------------------
*/

function getDashboard(role, stats) {
    /*
    |--------------------------------------------------------------------------
    | DOCTOR
    |--------------------------------------------------------------------------
    */

    if (role === "doctor") {
        return {
            title: "Dashboard Dokter",

            sectionTitle: "Pelayanan Pasien Hari Ini",

            description:
                "Pantau pasien yang menunggu, dipanggil, dan sedang diperiksa.",

            cards: [
                {
                    label: "Pasien Menunggu",

                    value: stats.waiting,

                    icon: faClock,
                },

                {
                    label: "Pasien Dipanggil",

                    value: stats.called,

                    icon: faListOl,
                },

                {
                    label: "Sedang Dilayani",

                    value: stats.inService,

                    icon: faStethoscope,
                },

                {
                    label: "Selesai Hari Ini",

                    value: stats.completed,

                    icon: faCircleCheck,
                },
            ],

            links: [
                {
                    label: "Antrean Pasien",

                    path: "/queues",
                },

                {
                    label: "Data Pasien",

                    path: "/patients",
                },

                {
                    label: "Daftar Kunjungan",

                    path: "/registrations",
                },
            ],
        };
    }

    /*
    |--------------------------------------------------------------------------
    | REGISTRATION
    |--------------------------------------------------------------------------
    */

    if (role === "registration") {
        return {
            title: "Dashboard Pendaftaran",

            sectionTitle: "Pelayanan Front Office",

            description:
                "Kelola pasien baru, kunjungan, dan pendaftaran pelayanan.",

            cards: [
                {
                    label: "Total Pasien",

                    value: stats.patients,

                    icon: faUserInjured,
                },

                {
                    label: "Pendaftaran Hari Ini",

                    value: stats.registrations,

                    icon: faCalendarCheck,
                },

                {
                    label: "Menunggu Pelayanan",

                    value: stats.waiting,

                    icon: faClock,
                },

                {
                    label: "Dibatalkan Hari Ini",

                    value: stats.cancelled,

                    icon: faListOl,
                },
            ],

            links: [
                {
                    label: "Tambah Pasien",

                    path: "/patients/create",
                },

                {
                    label: "Buat Pendaftaran",

                    path: "/registrations/create",
                },

                {
                    label: "Data Pasien",

                    path: "/patients",
                },

                {
                    label: "Pantau Antrean",

                    path: "/queues",
                },
            ],
        };
    }

    /*
    |--------------------------------------------------------------------------
    | IT
    |--------------------------------------------------------------------------
    */

    return {
        title: "Dashboard IT",

        sectionTitle: "Monitoring Sistem MEDIVA",

        description:
            "Pantau aktivitas operasional dan kondisi sistem rumah sakit.",

        cards: [
            {
                label: "Total Pasien",

                value: stats.patients,

                icon: faUserInjured,
            },

            {
                label: "Pendaftaran Hari Ini",

                value: stats.registrations,

                icon: faCalendarCheck,
            },

            {
                label: "Antrean Aktif",

                value: stats.waiting + stats.called + stats.inService,

                icon: faListOl,
            },

            {
                label: "Role Sistem",

                value: "IT",

                icon: faUserShield,
            },
        ],

        links: [
            {
                label: "Monitoring Pasien",

                path: "/patients",
            },

            {
                label: "Monitoring Pendaftaran",

                path: "/registrations",
            },

            {
                label: "Monitoring Antrean",

                path: "/queues",
            },
        ],
    };
}
