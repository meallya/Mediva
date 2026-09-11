import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faCashRegister,
  faClock,
  faCoins,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import billingService from "../../billing/services/billingService";

import { formatCurrency } from "../../billing/utils/billingUtils";

export default function FinanceDashboard() {
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

            partial: response?.data?.partial ?? response?.partial ?? 0,

            paid_today: response?.data?.paid_today ?? response?.paid_today ?? 0,

            revenue_today:
              response?.data?.revenue_today ?? response?.revenue_today ?? 0,
          });
        }
      } catch (error) {
        console.error("Finance dashboard:", error);

        if (active) {
          setError(error?.message ?? "Gagal memuat dashboard keuangan.");
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
      <div
        className="
                    min-h-[calc(100vh-88px)]
                    bg-[#fafbfc]
                    p-[30px]
                "
      >
        {/* HEADER */}

        <div>
          <h1 className="text-[24px] font-semibold text-[#343434]">
            Dashboard Keuangan
          </h1>

          <p className="mt-[5px] text-[12px] text-[#999999]">
            Ringkasan billing dan transaksi kasir MEDIVA.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="
                            mt-[18px]
                            rounded-[10px]
                            border
                            border-red-100
                            bg-red-50
                            px-[15px]
                            py-[12px]
                            text-[13px]
                            text-red-600
                        "
          >
            {error}
          </div>
        )}

        {/* SECTION */}

        <div className="mt-[24px]">
          <h2 className="text-[18px] font-semibold text-[#343434]">
            Ringkasan Keuangan Hari Ini
          </h2>

          <p className="mt-[4px] text-[12px] text-[#999999]">
            Pantau tagihan, pembayaran, dan pendapatan pasien.
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
            icon={faClock}
            label="Belum Bayar"
            value={loading ? "..." : summary.unpaid}
          />

          <Card
            icon={faReceipt}
            label="Pembayaran Sebagian"
            value={loading ? "..." : summary.partial}
          />

          <Card
            icon={faCashRegister}
            label="Lunas Hari Ini"
            value={loading ? "..." : summary.paid_today}
          />

          <Card
            icon={faCoins}
            label="Pendapatan Hari Ini"
            value={loading ? "..." : formatCurrency(summary.revenue_today)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| CARD
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
