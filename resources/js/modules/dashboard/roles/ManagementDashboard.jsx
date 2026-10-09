import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCoins,
    faPills,
    faSpinner,
    faTriangleExclamation,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import reportService from "../../reports/services/reportService";

function formatStock(value) {
    const number = Number(value ?? 0);
    return Number.isNaN(number)
        ? "0"
        : Math.round(number).toLocaleString("id-ID");
}

function formatMoney(value) {
    const number = Number(value ?? 0);
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number.isNaN(number) ? 0 : number);
}

export default function ManagementDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await reportService.getOverview();
                setData(response?.data ?? response ?? null);
            } catch (error) {
                console.error("Management dashboard:", error);
                setError(
                    error?.data?.message ??
                        error?.message ??
                        "Gagal memuat dashboard manajemen.",
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const metrics = data?.management_metrics ?? {};

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                {/* HEADER */}
                <div>
                    <h1 className="text-[24px] font-semibold text-[#343434]">
                        Dashboard Manajemen
                    </h1>
                    <p className="mt-[5px] text-[12px] text-[#999999]">
                        Selamat datang, Admin Manajemen
                    </p>
                    <div className="mt-[15px] flex items-center gap-[8px]">
                        <span className="flex h-[26px] items-center rounded-full bg-[#eaf4ff] px-[12px] text-[11px] font-semibold text-[#1688f8]">
                            MGT
                        </span>
                        <span className="flex h-[26px] items-center rounded-full border border-[#ececec] bg-white px-[12px] text-[11px] font-medium text-[#999999]">
                            Manajemen & Operasional
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                {/* MONITORING SISTEM */}
                <div className="mt-[35px]">
                    <h2 className="text-[18px] font-semibold text-[#343434]">
                        Monitoring Sistem Manajemen
                    </h2>
                    <p className="mt-[4px] text-[12px] text-[#999999]">
                        Pantau aktivitas operasional, keuangan, dan ketersediaan
                        farmasi.
                    </p>
                </div>

                {loading ? (
                    <div className="mt-[18px] flex min-h-[150px] items-center justify-center">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="text-[24px] text-[#1688f8]"
                        />
                    </div>
                ) : (
                    <div className="mt-[18px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
                        <Card
                            icon={faUserGroup}
                            label="Total Kunjungan"
                            value={formatStock(metrics.total_visits)}
                        />
                        <Card
                            icon={faCoins}
                            label="Pendapatan"
                            value={formatMoney(metrics.total_revenue)}
                        />
                        <Card
                            icon={faPills}
                            label="Resep Diserahkan"
                            value={formatStock(metrics.dispensed_prescriptions)}
                        />
                        <Card
                            icon={faTriangleExclamation}
                            label="Obat Stok Minimum"
                            value={formatStock(metrics.low_stock_count)}
                        />
                    </div>
                )}

                {/* AKSES CEPAT */}
                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[22px]">
                    <h2 className="text-[15px] font-semibold text-[#343434]">
                        Akses Cepat
                    </h2>
                    <p className="mt-[4px] text-[12px] text-[#999999]">
                        Menu utama sesuai pekerjaan role aktif.
                    </p>
                    <div className="mt-[18px] flex flex-wrap gap-[10px]">
                        <button
                            onClick={() => navigate("/reports")}
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Laporan Operasional
                        </button>
                        <button
                            onClick={() => navigate("/reports/finance")}
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Laporan Keuangan
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Card({ icon, label, value }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[18px]">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#eaf4ff] text-[#1688f8]">
                <FontAwesomeIcon icon={icon} className="text-[14px]" />
            </div>
            <p className="mt-[17px] text-[22px] font-semibold text-[#343434]">
                {value}
            </p>
            <p className="mt-[3px] text-[11px] text-[#999999]">{label}</p>
        </div>
    );
}
