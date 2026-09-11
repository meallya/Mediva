import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faCapsules,
    faCircleCheck,
    faClock,
    faPrescriptionBottleMedical,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import useAuth from "../../auth/hooks/useAuth";

import pharmacyService from "../../pharmacy/services/pharmacyService";

/*
|--------------------------------------------------------------------------
| TODAY
|--------------------------------------------------------------------------
*/

function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| TOTAL
|--------------------------------------------------------------------------
*/

function total(response) {
    return Number(response?.total ?? 0);
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export default function PharmacyDashboard() {
    const { user, activeRole } = useAuth();

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        submitted: 0,
        processing: 0,
        ready: 0,
        dispensed: 0,
    });

    /*
    |--------------------------------------------------------------------------
    | LOAD STATS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                const date = today();

                const [submitted, processing, ready, dispensed] =
                    await Promise.all([
                        pharmacyService.getPrescriptions({
                            date,
                            status: "submitted",
                            page: 1,
                        }),

                        pharmacyService.getPrescriptions({
                            date,
                            status: "processing",
                            page: 1,
                        }),

                        pharmacyService.getPrescriptions({
                            date,
                            status: "ready",
                            page: 1,
                        }),

                        pharmacyService.getPrescriptions({
                            date,
                            status: "dispensed",
                            page: 1,
                        }),
                    ]);

                setStats({
                    submitted: total(submitted),

                    processing: total(processing),

                    ready: total(ready),

                    dispensed: total(dispensed),
                });
            } catch (error) {
                console.error("Pharmacy dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <DashboardLayout>
            <div
                className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
            >
                {/* HEADER */}

                <div>
                    <h1
                        className="
                            text-[24px]
                            font-semibold
                            text-[#343434]
                        "
                    >
                        Dashboard Farmasi
                    </h1>

                    <p
                        className="
                            mt-[5px]
                            text-[12px]
                            text-[#999999]
                        "
                    >
                        Selamat datang, {user?.name ?? "Petugas Farmasi"}
                    </p>

                    <div
                        className="
                            mt-[10px]
                            flex
                            gap-[8px]
                        "
                    >
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
                            {activeRole?.name ?? "Farmasi"}
                        </span>

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

                {/* TITLE */}

                <div className="mt-[24px]">
                    <h2
                        className="
                            text-[18px]
                            font-semibold
                            text-[#343434]
                        "
                    >
                        Pelayanan Farmasi Hari Ini
                    </h2>

                    <p
                        className="
                            mt-[4px]
                            text-[12px]
                            text-[#999999]
                        "
                    >
                        Pantau resep masuk, proses penyiapan obat, dan
                        penyerahan obat kepada pasien.
                    </p>
                </div>

                {/* CARDS */}

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
                    <Card
                        label="Resep Masuk"
                        value={stats.submitted}
                        loading={loading}
                        icon={faPrescriptionBottleMedical}
                    />

                    <Card
                        label="Sedang Diproses"
                        value={stats.processing}
                        loading={loading}
                        icon={faClock}
                    />

                    <Card
                        label="Siap Diserahkan"
                        value={stats.ready}
                        loading={loading}
                        icon={faCapsules}
                    />

                    <Card
                        label="Diserahkan Hari Ini"
                        value={stats.dispensed}
                        loading={loading}
                        icon={faCircleCheck}
                    />
                </div>

                {/* QUICK ACCESS */}

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
                        Menu utama pelayanan farmasi.
                    </p>

                    <div
                        className="
                            mt-[15px]
                            flex
                            flex-wrap
                            gap-[9px]
                        "
                    >
                        <Link
                            to="/pharmacy/prescriptions"
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
                            Resep Farmasi
                        </Link>
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

function Card({ label, value, loading, icon }) {
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
