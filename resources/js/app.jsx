import React from "react";

import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import AppRouter from "./router/AppRouter";

import { AuthProvider } from "./shared/context/AuthContext";

import { ToastProvider } from "./shared/context/ToastContext";

import KeyboardSubmit from "./shared/components/ui/KeyboardSubmit";

import "../css/app.css";

ReactDOM.createRoot(document.getElementById("app")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <KeyboardSubmit />

                    <AppRouter />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
