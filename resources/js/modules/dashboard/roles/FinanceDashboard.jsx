import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCashRegister,
    faClock,
    faCoins,
    faReceipt,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";
import billingService from "../../billing/services/billingService";
import { formatCurrency } from "../../billing/utils/billingUtils";

export default function FinanceDashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        unpaid: 0,
        partial: 0,
        paid_today: 0,
        revenue_today: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | LOAD SUMMARY
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await billingService.getSummary();

                if (active) {
                    setSummary({
                        unpaid: response?.data?.unpaid ?? response?.unpaid ?? 0,
                        partial:
                            response?.data?.partial ?? response?.partial ?? 0,
                        paid_today:
                            response?.data?.paid_today ??
                            response?.paid_today ??
                            0,
                        revenue_today:
                            response?.data?.revenue_today ??
                            response?.revenue_today ??
                            0,
                    });
                }
            } catch (error) {
                console.error("Finance dashboard:", error);

                if (active) {
                    setError(
                        error?.message ?? "Gagal memuat dashboard keuangan.",
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            active = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                {/* =====================================================
            HEADER
        ====================================================== */}
                <div>
                    <h1 className="text-[24px] font-semibold text-[#343434]">
                        Dashboard Keuangan
                    </h1>
                    <p className="mt-[5px] text-[12px] text-[#999999]">
                        Selamat datang, Admin Kasir & Keuangan
                    </p>
                    <div className="mt-[15px] flex items-center gap-[8px]">
                        <span className="flex h-[26px] items-center rounded-full bg-[#eaf4ff] px-[12px] text-[11px] font-semibold text-[#1688f8]">
                            FIN
                        </span>
                        <span className="flex h-[26px] items-center rounded-full border border-[#ececec] bg-white px-[12px] text-[11px] font-medium text-[#999999]">
                            Finance & Billing
                        </span>
                    </div>
                </div>

                {/* =====================================================
            ERROR
        ====================================================== */}
                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-100 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                {/* =====================================================
            MONITORING SISTEM
        ====================================================== */}
                <div className="mt-[35px]">
                    <h2 className="text-[18px] font-semibold text-[#343434]">
                        Monitoring Sistem Keuangan
                    </h2>
                    <p className="mt-[4px] text-[12px] text-[#999999]">
                        Pantau tagihan, pembayaran, dan pendapatan pasien hari
                        ini.
                    </p>
                </div>

                {/* =====================================================
            CARDS & LOADING
        ====================================================== */}
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
                            icon={faClock}
                            label="Belum Bayar"
                            value={summary.unpaid}
                        />
                        <Card
                            icon={faReceipt}
                            label="Pembayaran Sebagian"
                            value={summary.partial}
                        />
                        <Card
                            icon={faCashRegister}
                            label="Lunas Hari Ini"
                            value={summary.paid_today}
                        />
                        <Card
                            icon={faCoins}
                            label="Pendapatan Hari Ini"
                            value={formatCurrency(summary.revenue_today)}
                        />
                    </div>
                )}

                {/* =====================================================
            AKSES CEPAT
        ====================================================== */}
                <div className="mt-[20px] rounded-[14px] border border-[#ececec] bg-white p-[22px]">
                    <h2 className="text-[15px] font-semibold text-[#343434]">
                        Akses Cepat
                    </h2>
                    <p className="mt-[4px] text-[12px] text-[#999999]">
                        Menu utama sesuai pekerjaan role aktif.
                    </p>
                    <div className="mt-[18px] flex flex-wrap gap-[10px]">
                        <button
                            onClick={() => navigate("/billing")}
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Kelola Tagihan
                        </button>
                        <button
                            onClick={() => navigate("/payments")}
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Riwayat Pembayaran
                        </button>
                        <button
                            onClick={() => navigate("/finance/reports")}
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Laporan Kasir
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| CARD (Desain Asli Buatan Anda)
|--------------------------------------------------------------------------
*/

function Card({ icon, label, value }) {
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
                {value}
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
