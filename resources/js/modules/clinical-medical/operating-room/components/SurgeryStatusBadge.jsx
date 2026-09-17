import React from "react";

import { statusLabel } from "../utils/operatingRoom";

const classes = {
    requested: "bg-[#f3f4f6] text-[#666666]",
    scheduled: "bg-[#eaf4ff] text-[#1688f8]",
    preop: "bg-amber-50 text-amber-600",
    ready: "bg-cyan-50 text-cyan-600",
    in_progress: "bg-rose-50 text-rose-600",
    recovery: "bg-violet-50 text-violet-600",
    completed: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-red-50 text-red-500",
};

export default function SurgeryStatusBadge({ status }) {
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-[9px] py-[4px] text-[10px] font-medium ${
                classes[status] || classes.requested
            }`}
        >
            {statusLabel[status] || status || "-"}
        </span>
    );
}
