import React from "react";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faClockRotateLeft,
    faUserDoctor,
} from "@fortawesome/free-solid-svg-icons";

/*
|--------------------------------------------------------------------------
| PATIENT INFO CARD
|--------------------------------------------------------------------------
*/

export default function PatientInfoCard({ visit, examination }) {
    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const patient = visit?.patient ?? {};

    const doctorName =
        examination?.doctor?.employee?.name ??
        examination?.doctor?.name ??
        visit?.doctor?.employee?.name ??
        visit?.doctor?.name ??
        "-";

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <section
            className="
                mb-[18px]
                rounded-[14px]
                border
                border-[#e7e7e7]
                bg-white
                px-[22px]
                py-[21px]
            "
        >
            {/* =============================================================
                HEADER
            ============================================================== */}

            <div
                className="
                    flex
                    flex-wrap
                    items-start
                    justify-between
                    gap-[16px]
                "
            >
                {/* =========================================================
                    LEFT
                ========================================================== */}

                <div
                    className="
                        flex
                        items-center
                        gap-[12px]
                    "
                >
                    {/* ICON */}

                    <div
                        className="
                            flex
                            h-[44px]
                            w-[44px]
                            shrink-0
                            items-center
                            justify-center
                            rounded-[11px]
                            bg-[#C2E1F4]/40
                            text-[#047AF7]
                        "
                    >
                        <FontAwesomeIcon
                            icon={faUserDoctor}
                            className="text-[16px]"
                        />
                    </div>

                    {/* TITLE */}

                    <div>
                        <h2
                            className="
                                text-[17px]
                                font-semibold
                                leading-[1.35]
                                text-[#212121]
                            "
                        >
                            Informasi Pasien
                        </h2>

                        <p
                            className="
                                mt-[3px]
                                text-[12px]
                                leading-[1.4]
                                text-[#626262]
                            "
                        >
                            Data pasien dan kunjungan aktif
                        </p>
                    </div>
                </div>

                {/* =========================================================
                    MEDICAL RECORD
                ========================================================== */}

                {patient?.id && (
                    <Link
                        to={`/medical-records/patients/${patient.id}`}
                        className="
                            inline-flex
                            h-[42px]
                            items-center
                            justify-center
                            gap-[8px]
                            rounded-[9px]
                            border
                            border-[#C2E1F4]
                            bg-white
                            px-[15px]
                            text-[13px]
                            font-semibold
                            text-[#047AF7]

                            transition-all
                            duration-200

                            hover:border-[#7EBDEC]
                            hover:bg-[#C2E1F4]/20
                            hover:shadow-[0_5px_16px_rgba(4,122,247,0.08)]

                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[#7EBDEC]/50
                        "
                    >
                        <FontAwesomeIcon
                            icon={faClockRotateLeft}
                            className="text-[12px]"
                        />
                        Riwayat Medis
                    </Link>
                )}
            </div>

            {/* =============================================================
                INFORMATION
            ============================================================== */}

            <div
                className="
                    mt-[24px]
                    grid
                    grid-cols-1
                    gap-x-[32px]
                    gap-y-[20px]
                    sm:grid-cols-2
                    xl:grid-cols-4
                "
            >
                {/* =========================================================
                    ROW 1
                ========================================================== */}

                <Info label="Nama Pasien" value={patient?.name} important />

                <Info
                    label="No. Rekam Medis"
                    value={patient?.medical_record_number}
                    important
                />

                <Info
                    label="Jenis Kelamin"
                    value={getGenderLabel(patient?.gender)}
                />

                <Info label="NIK" value={patient?.nik} />

                {/* =========================================================
                    ROW 2
                ========================================================== */}

                <Info label="Nomor Kunjungan" value={visit?.visit_number} />

                <Info
                    label="Jenis Kunjungan"
                    value={getVisitTypeLabel(visit?.visit_type)}
                />

                <Info label="Unit / Poli" value={visit?.unit?.name} />

                <Info label="Dokter" value={doctorName} />
            </div>
        </section>
    );
}

/*
|--------------------------------------------------------------------------
| INFO
|--------------------------------------------------------------------------
*/

function Info({ label, value, important = false }) {
    return (
        <div
            className="
                min-w-0
            "
        >
            <p
                className="
                    text-[12px]
                    font-medium
                    leading-[1.4]
                    text-[#747474]
                "
            >
                {label}
            </p>

            <p
                className={`
                    mt-[5px]
                    break-words
                    leading-[1.45]
                    text-[#212121]

                    ${
                        important
                            ? "text-[15px] font-semibold"
                            : "text-[14px] font-medium"
                    }
                `}
            >
                {hasValue(value) ? value : "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| GENDER
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| VISIT TYPE
|--------------------------------------------------------------------------
*/

function getVisitTypeLabel(type) {
    const labels = {
        outpatient: "Rawat Jalan",

        emergency: "IGD / Gawat Darurat",

        inpatient: "Rawat Inap",

        medical_checkup: "Medical Check Up",

        day_care: "Day Care",

        home_care: "Home Care",

        telemedicine: "Telemedicine",
    };

    return labels[type] ?? type ?? "-";
}

/*
|--------------------------------------------------------------------------
| HAS VALUE
|--------------------------------------------------------------------------
*/

function hasValue(value) {
    return !(value === null || value === undefined || value === "");
}
