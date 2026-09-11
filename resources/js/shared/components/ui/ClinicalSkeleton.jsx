import React from "react";

export default function ClinicalSkeleton() {
    return (
        <div className="mediva-clinical p-[30px]">
            {/* HEADER */}

            <div className="animate-pulse">
                <div className="h-[14px] w-[130px] rounded-full bg-[#e8edf2]" />

                <div className="mt-[15px] h-[30px] w-[270px] rounded-[8px] bg-[#e4eaf0]" />

                <div className="mt-[9px] h-[15px] w-[360px] max-w-full rounded-full bg-[#eef1f4]" />
            </div>

            {/* PATIENT */}

            <div className="mt-[26px] animate-pulse rounded-[15px] border border-[#e8e8e8] bg-white p-[22px]">
                <div className="flex items-center gap-[12px]">
                    <div className="h-[44px] w-[44px] rounded-[10px] bg-[#e6eef5]" />

                    <div className="flex-1">
                        <div className="h-[18px] w-[180px] rounded-full bg-[#e3e9ef]" />

                        <div className="mt-[8px] h-[12px] w-[245px] rounded-full bg-[#eef1f4]" />
                    </div>
                </div>

                <div className="mt-[25px] grid grid-cols-2 gap-[18px] lg:grid-cols-4">
                    {Array.from({
                        length: 8,
                    }).map((_, index) => (
                        <div key={index}>
                            <div className="h-[11px] w-[75px] rounded-full bg-[#eef1f4]" />

                            <div className="mt-[8px] h-[15px] w-[125px] rounded-full bg-[#e4e9ee]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* FORM */}

            {Array.from({
                length: 3,
            }).map((_, index) => (
                <div
                    key={index}
                    className="mt-[18px] animate-pulse rounded-[15px] border border-[#e8e8e8] bg-white p-[22px]"
                >
                    <div className="h-[20px] w-[155px] rounded-full bg-[#e5ebf0]" />

                    <div className="mt-[20px] grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({
                            length: 4,
                        }).map((_, field) => (
                            <div key={field}>
                                <div className="h-[11px] w-[90px] rounded-full bg-[#eef1f4]" />

                                <div className="mt-[8px] h-[45px] rounded-[9px] bg-[#f0f3f5]" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
