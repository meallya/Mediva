import React from "react";

import {
    Navigate,
    Outlet,
} from "react-router-dom";

import useAuth from "../modules/auth/hooks/useAuth";

export default function PermissionRoute({
    permission,
}) {
    const {
        loading,
        hasPermission,
    } = useAuth();

    /*
    |--------------------------------------------------------------------------
    | LOADING AUTH
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div
                className="
                    flex
                    min-h-screen
                    items-center
                    justify-center
                    bg-[#fafbfc]
                "
            >
                <p
                    className="
                        text-[13px]
                        text-[#888888]
                    "
                >
                    Memeriksa akses...
                </p>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PERMISSION
    |--------------------------------------------------------------------------
    */

    if (
        !hasPermission(
            permission
        )
    ) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return <Outlet />;
}