import React from "react";

import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "../modules/auth/pages/LoginPage";

import DashboardPage from "../modules/dashboard/pages/DashboardPage";

import PatientListPage from "../modules/patient/pages/PatientListPage";
import PatientFormPage from "../modules/patient/pages/PatientFormPage";
import PatientDetailPage from "../modules/patient/pages/PatientDetailPage";

import RegistrationListPage from "../modules/registration/pages/RegistrationListPage";
import RegistrationFormPage from "../modules/registration/pages/RegistrationFormPage";
import RegistrationDetailPage from "../modules/registration/pages/RegistrationDetailPage";

import QueueListPage from "../modules/queue/pages/QueueListPage";
import QueueDetailPage from "../modules/queue/pages/QueueDetailPage";

import ExaminationPage from "../modules/examination/pages/ExaminationPage";

import DoctorQueuePage from "../modules/examination/pages/DoctorQueuePage";

import MedicalRecordPage from "../modules/medical-record/pages/MedicalRecordPage";

import MedicineListPage from "../modules/master-data/medicine/pages/MedicineListPage";

import EmployeeListPage from "../modules/master-data/employee/pages/EmployeeListPage";
import DoctorListPage from "../modules/master-data/doctor/pages/DoctorListPage";
import ClinicListPage from "../modules/master-data/clinic/pages/ClinicListPage";
import RoomListPage from "../modules/master-data/room/pages/RoomListPage";
import InpatientRoomListPage from "../modules/master-data/inpatient-room/pages/InpatientRoomListPage";
import PaymentMethodListPage from "../modules/master-data/payment-method/pages/PaymentMethodListPage";

import PrescriptionQueuePage from "../modules/pharmacy/pages/PrescriptionQueuePage";

import PrescriptionDetailPage from "../modules/pharmacy/pages/PrescriptionDetailPage";

import InventoryPage from "../modules/pharmacy/pages/InventoryPage";

import GeneralInventoryPage from "../modules/operational-hospital/inventory/pages/GeneralInventoryPage";
import AssetManagementPage from "../modules/operational-hospital/asset-management/pages/AssetManagementPage";
import ProcurementPage from "../modules/operational-hospital/procurement/pages/ProcurementPage";

import BillingListPage from "../modules/billing/pages/BillingListPage";

import BillingDetailPage from "../modules/billing/pages/BillingDetailPage";

import TransactionHistoryPage from "../modules/billing/pages/TransactionHistoryPage";

import TariffPage from "../modules/billing/pages/TariffPage";

import ReportPage from "../modules/reports/pages/ReportPage";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route path="/inventory" element={<GeneralInventoryPage />} />
                <Route path="/assets" element={<AssetManagementPage />} />
                <Route path="/procurement" element={<ProcurementPage />} />

                {/* PATIENT */}

                <Route path="/patients" element={<PatientListPage />} />

                <Route path="/patients/create" element={<PatientFormPage />} />

                <Route path="/patients/:id" element={<PatientDetailPage />} />

                <Route
                    path="/patients/:id/edit"
                    element={<PatientFormPage />}
                />

                {/* REGISTRATION */}

                <Route
                    path="/registrations"
                    element={<RegistrationListPage />}
                />

                <Route
                    path="/registrations/create"
                    element={<RegistrationFormPage />}
                />

                <Route
                    path="/registrations/:id"
                    element={<RegistrationDetailPage />}
                />

                <Route
                    path="/registrations/:id/edit"
                    element={<RegistrationFormPage />}
                />

                {/* QUEUE */}

                <Route path="/queues" element={<QueueListPage />} />

                <Route path="/queues/:id" element={<QueueDetailPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />

            {/* EXAMINATIONS */}

            <Route
                path="/examinations/visit/:visitId"
                element={<ExaminationPage />}
            />

            {/* DOCTOR QUEUE PAGE */}
            <Route path="/examinations" element={<DoctorQueuePage />} />

            {/* MEDICAL RECORD */}
            <Route
                path="/medical-records/patients/:patientId"
                element={<MedicalRecordPage />}
            />

            {/* MASTER DATA */}
            <Route path="/master/employees" element={<EmployeeListPage />} />
            <Route path="/master/doctors" element={<DoctorListPage />} />
            <Route path="/master/clinics" element={<ClinicListPage />} />
            <Route path="/master/rooms" element={<RoomListPage />} />
            <Route
                path="/master/inpatient-rooms"
                element={<InpatientRoomListPage />}
            />
            <Route
                path="/master/payment-methods"
                element={<PaymentMethodListPage />}
            />

            {/* MEDICINE */}
            <Route path="/master/medicines" element={<MedicineListPage />} />

            <Route
                path="/pharmacy/prescriptions"
                element={<PrescriptionQueuePage />}
            />

            <Route
                path="/pharmacy/prescriptions/:id"
                element={<PrescriptionDetailPage />}
            />

            <Route path="/pharmacy/inventory" element={<InventoryPage />} />

            <Route path="/billing" element={<BillingListPage />} />
            <Route
                path="/billing/transactions"
                element={<TransactionHistoryPage />}
            />
            <Route path="/billing/:invoiceId" element={<BillingDetailPage />} />
            <Route path="/master/tariffs" element={<TariffPage />} />

            <Route path="/reports" element={<ReportPage />} />
        </Routes>
    );
}
