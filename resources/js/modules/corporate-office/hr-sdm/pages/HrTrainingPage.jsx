import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import { hrService } from "../services/hrService";
export default function HrTrainingPage() {
    const [rows, setRows] = useState([]);
    useEffect(() => {
        hrService.trainings({}).then((r) => setRows(r?.data ?? []));
    }, []);
    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <h1 className="text-[24px] font-semibold text-[#343434]">
                    Pelatihan
                </h1>
                <p className="mt-[5px] text-[12px] text-[#999]">
                    Modul Pelatihan HR / SDM MEDIVA.
                </p>
                <div className="mt-[18px] rounded-[14px] border border-[#ececec] bg-white p-[18px]">
                    <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-[#555]">
                        {JSON.stringify(rows, null, 2)}
                    </pre>
                </div>
            </div>
        </DashboardLayout>
    );
}
