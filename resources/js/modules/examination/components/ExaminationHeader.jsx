import React from "react";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faArrowLeft,
    faCheck,
    faClipboardList,
    faLock,
} from "@fortawesome/free-solid-svg-icons";

/*
|--------------------------------------------------------------------------
| EXAMINATION HEADER
|--------------------------------------------------------------------------
|
| Header hanya berisi:
|
| - Kembali ke Antrean
| - Pemeriksaan Dokter
| - Subtitle
| - Status pemeriksaan
|
| Riwayat Medis TIDAK ada di sini.
| Riwayat Medis berada di PatientInfoCard.
|
*/

export default function ExaminationHeader({ status = "unsaved" }) {
    const config = getStatusConfig(status);

    return (
        <div
            className="
                mb-[22px]
                flex
                flex-wrap
                items-start
                justify-between
                gap-[18px]
            "
        >
            {/* =============================================================
                LEFT
            ============================================================== */}

            <div>
                {/* =========================================================
                    BACK
                ========================================================== */}

                <Link
                    to="/queues"
                    className="
                        inline-flex
                        min-h-[34px]
                        items-center
                        gap-[8px]
                        rounded-[8px]
                        text-[13px]
                        font-medium
                        text-[#047AF7]
                        transition-all
                        duration-200

                        hover:text-[#006FE8]

                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[#7EBDEC]/50
                    "
                >
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        className="text-[12px]"
                    />
                    Kembali ke Antrean
                </Link>

                {/* =========================================================
                    TITLE
                ========================================================== */}

                <h1
                    className="
                        mt-[7px]
                        text-[26px]
                        font-semibold
                        leading-[1.3]
                        tracking-[-0.3px]
                        text-[#212121]
                    "
                >
                    Pemeriksaan Dokter
                </h1>

                {/* =========================================================
                    SUBTITLE
                ========================================================== */}

                <p
                    className="
                        mt-[6px]
                        text-[13px]
                        leading-[1.5]
                        text-[#626262]
                    "
                >
                    SOAP, tanda vital, pemeriksaan fisik, diagnosis, tindakan,
                    dan resep pasien
                </p>
            </div>

            {/* =============================================================
                STATUS
            ============================================================== */}

            <div
                className="
                    flex
                    items-center
                    gap-[8px]
                    pt-[5px]
                "
            >
                <span
                    className={`
                        inline-flex
                        min-h-[38px]
                        items-center
                        gap-[8px]
                        rounded-full
                        border
                        px-[14px]
                        text-[12px]
                        font-semibold

                        ${config.className}
                    `}
                >
                    <FontAwesomeIcon
                        icon={config.icon}
                        className="text-[11px]"
                    />

                    {config.label}
                </span>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| STATUS CONFIG
|--------------------------------------------------------------------------
*/

function getStatusConfig(status) {
    const configs = {
        unsaved: {
            label: "Belum Disimpan",

            icon: faClipboardList,

            className: "border-amber-100 bg-amber-50 text-amber-700",
        },

        draft: {
            label: "Draft",

            icon: faClipboardList,

            className: "border-[#C2E1F4] bg-[#C2E1F4]/25 text-[#047AF7]",
        },

        completed: {
            label: "Pemeriksaan Selesai",

            icon: faLock,

            className: "border-emerald-100 bg-emerald-50 text-emerald-700",
        },
    };

    return (
        configs[status] ?? {
            label: status ?? "Belum Disimpan",

            icon: faCheck,

            className: "border-[#eeeeee] bg-white text-[#626262]",
        }
    );
}
