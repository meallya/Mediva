import api from "../../../shared/services/api";

const examinationService = {
    /*
    |--------------------------------------------------------------------------
    | EXAMINATION
    |--------------------------------------------------------------------------
    */

    getVisit(visitId) {
        return api.get(`/examinations/visit/${visitId}`);
    },

    getExamination(examinationId) {
        return api.get(`/examinations/${examinationId}`);
    },

    createExamination(payload) {
        return api.post("/examinations", payload);
    },

    updateExamination(examinationId, payload) {
        return api.put(`/examinations/${examinationId}`, payload);
    },

    completeExamination(examinationId) {
        return api.patch(`/examinations/${examinationId}/complete`, {});
    },

    /*
    |--------------------------------------------------------------------------
    | SEARCH ICD-10
    |--------------------------------------------------------------------------
    */

    searchIcd10(search = "") {
        const params = new URLSearchParams();

        if (search) {
            params.set("search", search);
        }

        return api.get(`/medical-codes/icd10?${params.toString()}`);
    },

    /*
    |--------------------------------------------------------------------------
    | SEARCH ICD-9-CM
    |--------------------------------------------------------------------------
    */

    searchIcd9cm(search = "") {
        const params = new URLSearchParams();

        if (search) {
            params.set("search", search);
        }

        return api.get(`/medical-codes/icd9cm?${params.toString()}`);
    },

    /*
    |--------------------------------------------------------------------------
    | CODING
    |--------------------------------------------------------------------------
    */

    getCoding(examinationId) {
        return api.get(`/examinations/${examinationId}/coding`);
    },

    /*
    |--------------------------------------------------------------------------
    | DIAGNOSIS
    |--------------------------------------------------------------------------
    */

    addDiagnosis(examinationId, payload) {
        return api.post(`/examinations/${examinationId}/diagnoses`, payload);
    },

    deleteDiagnosis(examinationId, diagnosisId) {
        return api.delete(
            `/examinations/${examinationId}/diagnoses/${diagnosisId}`,
        );
    },

    /*
    |--------------------------------------------------------------------------
    | PROCEDURE
    |--------------------------------------------------------------------------
    */

    addProcedure(examinationId, payload) {
        return api.post(`/examinations/${examinationId}/procedures`, payload);
    },

    deleteProcedure(examinationId, procedureId) {
        return api.delete(
            `/examinations/${examinationId}/procedures/${procedureId}`,
        );
    },
};

export default examinationService;
