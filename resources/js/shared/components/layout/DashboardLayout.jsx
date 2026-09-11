import React from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
    return (
        <div className="mediva-app min-h-screen bg-[#fafbfc]">
            <Sidebar />

            <div className="ml-[255px] min-h-screen">
                <Topbar />

                <main className="min-h-screen pt-[88px]">{children}</main>
            </div>
        </div>
    );
}
