import api from "../../../shared/services/api";

const medicalRecordService = {
    /*
    |--------------------------------------------------------------------------
    | PATIENT RECORD
    |--------------------------------------------------------------------------
    */

    getPatientRecord(patientId) {
        return api.get(`/medical-records/patients/${patientId}`);
    },

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    getRecord(recordId) {
        return api.get(`/medical-records/${recordId}`);
    },

    /*
    |--------------------------------------------------------------------------
    | ADDENDUM
    |--------------------------------------------------------------------------
    */

    addRevision(recordId, payload) {
        return api.post(`/medical-records/${recordId}/revisions`, payload);
    },
};

export default medicalRecordService;
