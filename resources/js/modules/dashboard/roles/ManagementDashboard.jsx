import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faChartColumn,
    faCoins,
    faPills,
    faSpinner,
    faTriangleExclamation,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import reportService from "../../reports/services/reportService";

export default function ManagementDashboard() {
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
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                    <div>
                        <h1 className="text-[24px] font-semibold text-[#343434]">
                            Dashboard Manajemen
                        </h1>

                        <p className="mt-[5px] text-[12px] text-[#999999]">
                            Ringkasan operasional, keuangan, dan farmasi MEDIVA.
                        </p>
                    </div>

                    <Link
                        to="/reports"
                        className="inline-flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white"
                    >
                        <FontAwesomeIcon icon={faChartColumn} />
                        Buka Laporan Lengkap
                    </Link>
                </div>

                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="text-[24px] text-[#047AF7]"
                        />
                    </div>
                ) : (
                    <>
                        <div className="mt-[24px]">
                            <h2 className="text-[18px] font-semibold text-[#343434]">
                                Ringkasan Bulan Berjalan
                            </h2>

                            <p className="mt-[4px] text-[12px] text-[#999999]">
                                Data real-time dari modul operasional MEDIVA.
                            </p>
                        </div>

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
                    </>
                )}
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

            <p className="mt-[3px] text-[11px] text-[#999999]">
                {label}
            </p>
        </div>
    );
}

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
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isNaN(number) ? 0 : number);
}
