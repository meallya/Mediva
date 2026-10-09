import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faUserCheck,
    faUserClock,
    faCalendarMinus,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import { hrService } from "../services/hrService";

export default function HrDashboardPage() {
    const navigate = useNavigate();
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        hrService
            .dashboard()
            .then((res) => setData(res?.data ?? res ?? {}))
            .catch((err) => console.error("Gagal memuat dashboard HR:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                {/* HEADER */}
                <div>
                    <h1 className="text-[24px] font-semibold text-[#343434]">
                        Dashboard HR & SDM
                    </h1>
                    <p className="mt-[5px] text-[12px] text-[#999999]">
                        Selamat datang, Admin HRD
                    </p>
                    <div className="mt-[15px] flex items-center gap-[8px]">
                        <span className="flex h-[26px] items-center rounded-full bg-[#eaf4ff] px-[12px] text-[11px] font-semibold text-[#1688f8]">
                            HR
                        </span>
                        <span className="flex h-[26px] items-center rounded-full border border-[#ececec] bg-white px-[12px] text-[11px] font-medium text-[#999999]">
                            Human Resources
                        </span>
                    </div>
                </div>

                {/* MONITORING SISTEM */}
                <div className="mt-[35px]">
                    <h2 className="text-[18px] font-semibold text-[#343434]">
                        Monitoring Sistem SDM
                    </h2>
                    <p className="mt-[4px] text-[12px] text-[#999999]">
                        Pantau aktivitas kehadiran, cuti, dan kepegawaian hari
                        ini.
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
                            icon={faUsers}
                            label="Total Pegawai"
                            value={data.total_employees ?? 0}
                        />
                        <Card
                            icon={faUserCheck}
                            label="Pegawai Aktif"
                            value={data.active_employees ?? 0}
                        />
                        <Card
                            icon={faUserClock}
                            label="Hadir Hari Ini"
                            value={data.attendance_today ?? 0}
                        />
                        <Card
                            icon={faCalendarMinus}
                            label="Cuti Hari Ini"
                            value={data.on_leave_today ?? 0}
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
                            onClick={() => navigate("/master-data/employees")}
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Kelola Pegawai
                        </button>
                        <button
                            onClick={() =>
                                navigate("/corporate-office/hr-sdm/attendances")
                            }
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Data Kehadiran
                        </button>
                        <button
                            onClick={() =>
                                navigate("/corporate-office/hr-sdm/absences")
                            }
                            className="rounded-[8px] border border-[#ececec] bg-white px-[16px] py-[9px] text-[12px] font-medium text-[#666666] transition hover:bg-[#fafbfc]"
                        >
                            Pengajuan Cuti
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
