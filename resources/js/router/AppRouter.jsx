import React from "react";

import { Navigate, Route, Routes } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

import LoginPage from "../modules/auth/pages/LoginPage";

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

import DashboardPage from "../modules/dashboard/pages/DashboardPage";

/*
|--------------------------------------------------------------------------
| PATIENT
|--------------------------------------------------------------------------
*/

import PatientListPage from "../modules/patient/pages/PatientListPage";
import PatientFormPage from "../modules/patient/pages/PatientFormPage";
import PatientDetailPage from "../modules/patient/pages/PatientDetailPage";

/*
|--------------------------------------------------------------------------
| REGISTRATION
|--------------------------------------------------------------------------
*/

import RegistrationListPage from "../modules/registration/pages/RegistrationListPage";
import RegistrationFormPage from "../modules/registration/pages/RegistrationFormPage";
import RegistrationDetailPage from "../modules/registration/pages/RegistrationDetailPage";

/*
|--------------------------------------------------------------------------
| QUEUE
|--------------------------------------------------------------------------
*/

import QueueListPage from "../modules/queue/pages/QueueListPage";
import QueueDetailPage from "../modules/queue/pages/QueueDetailPage";

/*
|--------------------------------------------------------------------------
| EXAMINATION
|--------------------------------------------------------------------------
*/

import ExaminationPage from "../modules/examination/pages/ExaminationPage";
import DoctorQueuePage from "../modules/examination/pages/DoctorQueuePage";

/*
|--------------------------------------------------------------------------
| MEDICAL RECORD
|--------------------------------------------------------------------------
*/

import MedicalRecordPage from "../modules/medical-record/pages/MedicalRecordPage";

/*
|--------------------------------------------------------------------------
| MASTER DATA
|--------------------------------------------------------------------------
*/

import MedicineListPage from "../modules/master-data/medicine/pages/MedicineListPage";

import EmployeeListPage from "../modules/master-data/employee/pages/EmployeeListPage";
import DoctorListPage from "../modules/master-data/doctor/pages/DoctorListPage";
import ClinicListPage from "../modules/master-data/clinic/pages/ClinicListPage";
import RoomListPage from "../modules/master-data/room/pages/RoomListPage";
import InpatientRoomListPage from "../modules/master-data/inpatient-room/pages/InpatientRoomListPage";
import PaymentMethodListPage from "../modules/master-data/payment-method/pages/PaymentMethodListPage";

/*
|--------------------------------------------------------------------------
| PHARMACY
|--------------------------------------------------------------------------
*/

import PrescriptionQueuePage from "../modules/pharmacy/pages/PrescriptionQueuePage";
import PrescriptionDetailPage from "../modules/pharmacy/pages/PrescriptionDetailPage";
import InventoryPage from "../modules/pharmacy/pages/InventoryPage";

/*
|--------------------------------------------------------------------------
| OPERATIONAL HOSPITAL
|--------------------------------------------------------------------------
*/

import GeneralInventoryPage from "../modules/operational-hospital/inventory/pages/GeneralInventoryPage";

import AssetManagementPage from "../modules/operational-hospital/asset-management/pages/AssetManagementPage";

import ProcurementPage from "../modules/operational-hospital/procurement/pages/ProcurementPage";

/*
|--------------------------------------------------------------------------
| LABORATORY
|--------------------------------------------------------------------------
*/

import LaboratoryPage from "../modules/clinical-medical/laboratory/pages/LaboratoryPage";

/*
|--------------------------------------------------------------------------
| BILLING
|--------------------------------------------------------------------------
*/

import BillingListPage from "../modules/billing/pages/BillingListPage";
import BillingDetailPage from "../modules/billing/pages/BillingDetailPage";
import TransactionHistoryPage from "../modules/billing/pages/TransactionHistoryPage";
import TariffPage from "../modules/billing/pages/TariffPage";

/*
|--------------------------------------------------------------------------
| REPORT
|--------------------------------------------------------------------------
*/

import ReportPage from "../modules/reports/pages/ReportPage";

/*
|--------------------------------------------------------------------------
| OPERATING ROOM
|--------------------------------------------------------------------------
*/

import OperatingRoomDashboardPage from "../modules/clinical-medical/operating-room/pages/OperatingRoomDashboardPage";

import OperatingRoomMasterPage from "../modules/clinical-medical/operating-room/pages/OperatingRoomMasterPage";

import SurgeryListPage from "../modules/clinical-medical/operating-room/pages/SurgeryListPage";

import SurgeryFormPage from "../modules/clinical-medical/operating-room/pages/SurgeryFormPage";

import SurgeryDetailPage from "../modules/clinical-medical/operating-room/pages/SurgeryDetailPage";

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTE
|--------------------------------------------------------------------------
*/

import ProtectedRoute from "./ProtectedRoute";

/*
|--------------------------------------------------------------------------
| APP ROUTER
|--------------------------------------------------------------------------
*/

export default function AppRouter() {
    return (
        <Routes>
            {/*
            |--------------------------------------------------------------------------
            | PUBLIC
            |--------------------------------------------------------------------------
            */}

            <Route path="/login" element={<LoginPage />} />

            {/*
            |--------------------------------------------------------------------------
            | PROTECTED
            |--------------------------------------------------------------------------
            */}

            <Route element={<ProtectedRoute />}>
                {/*
                |--------------------------------------------------------------------------
                | DASHBOARD
                |--------------------------------------------------------------------------
                */}

                <Route path="/dashboard" element={<DashboardPage />} />

                {/*
                |--------------------------------------------------------------------------
                | OPERATIONAL HOSPITAL
                |--------------------------------------------------------------------------
                */}

                <Route path="/inventory" element={<GeneralInventoryPage />} />

                <Route path="/assets" element={<AssetManagementPage />} />

                <Route path="/procurement" element={<ProcurementPage />} />

                {/*
                |--------------------------------------------------------------------------
                | LABORATORY
                |--------------------------------------------------------------------------
                */}

                <Route path="/laboratory" element={<LaboratoryPage />} />

                {/*
                |--------------------------------------------------------------------------
                | PATIENT
                |--------------------------------------------------------------------------
                */}

                <Route path="/patients" element={<PatientListPage />} />

                <Route path="/patients/create" element={<PatientFormPage />} />

                <Route path="/patients/:id" element={<PatientDetailPage />} />

                <Route
                    path="/patients/:id/edit"
                    element={<PatientFormPage />}
                />

                {/*
                |--------------------------------------------------------------------------
                | REGISTRATION
                |--------------------------------------------------------------------------
                */}

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

                {/*
                |--------------------------------------------------------------------------
                | QUEUE
                |--------------------------------------------------------------------------
                */}

                <Route path="/queues" element={<QueueListPage />} />

                <Route path="/queues/:id" element={<QueueDetailPage />} />

                {/*
                |--------------------------------------------------------------------------
                | EXAMINATION
                |--------------------------------------------------------------------------
                */}

                <Route path="/examinations" element={<DoctorQueuePage />} />

                <Route
                    path="/examinations/visit/:visitId"
                    element={<ExaminationPage />}
                />

                {/*
                |--------------------------------------------------------------------------
                | MEDICAL RECORD
                |--------------------------------------------------------------------------
                */}

                <Route
                    path="/medical-records/patients/:patientId"
                    element={<MedicalRecordPage />}
                />

                {/*
                |--------------------------------------------------------------------------
                | MASTER DATA
                |--------------------------------------------------------------------------
                */}

                <Route
                    path="/master/employees"
                    element={<EmployeeListPage />}
                />

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

                <Route
                    path="/master/medicines"
                    element={<MedicineListPage />}
                />

                {/*
                |--------------------------------------------------------------------------
                | PHARMACY
                |--------------------------------------------------------------------------
                */}

                <Route
                    path="/pharmacy/prescriptions"
                    element={<PrescriptionQueuePage />}
                />

                <Route
                    path="/pharmacy/prescriptions/:id"
                    element={<PrescriptionDetailPage />}
                />

                <Route path="/pharmacy/inventory" element={<InventoryPage />} />

                {/*
                |--------------------------------------------------------------------------
                | BILLING
                |--------------------------------------------------------------------------
                */}

                <Route path="/billing" element={<BillingListPage />} />

                <Route
                    path="/billing/transactions"
                    element={<TransactionHistoryPage />}
                />

                <Route
                    path="/billing/:invoiceId"
                    element={<BillingDetailPage />}
                />

                <Route path="/master/tariffs" element={<TariffPage />} />

                {/*
                |--------------------------------------------------------------------------
                | REPORTS
                |--------------------------------------------------------------------------
                */}

                <Route path="/reports" element={<ReportPage />} />

                {/*
                |--------------------------------------------------------------------------
                | OPERATING ROOM
                |--------------------------------------------------------------------------
                */}

                <Route
                    path="/clinical/operating-room"
                    element={<OperatingRoomDashboardPage />}
                />

                <Route
                    path="/clinical/operating-room/surgeries"
                    element={<SurgeryListPage />}
                />

                <Route
                    path="/clinical/operating-room/surgeries/new"
                    element={<SurgeryFormPage />}
                />

                <Route
                    path="/clinical/operating-room/surgeries/:id"
                    element={<SurgeryDetailPage />}
                />

                <Route
                    path="/clinical/operating-room/master"
                    element={<OperatingRoomMasterPage />}
                />
            </Route>

            {/*
            |--------------------------------------------------------------------------
            | REDIRECT
            |--------------------------------------------------------------------------
            */}

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
