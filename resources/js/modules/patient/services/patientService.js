import api from "../../../shared/services/api";

const patientService = {
    /*
    |--------------------------------------------------------------------------
    | GET PATIENT LIST
    |--------------------------------------------------------------------------
    */

    getPatients(params = {}) {
        const searchParams = new URLSearchParams();

        if (params.search) {
            searchParams.set("search", params.search);
        }

        if (params.page) {
            searchParams.set("page", params.page);
        }

        const queryString = searchParams.toString();

        return api.get(`/patients${queryString ? `?${queryString}` : ""}`);
    },

    /*
    |--------------------------------------------------------------------------
    | GET PATIENT DETAIL
    |--------------------------------------------------------------------------
    */

    getPatient(id) {
        return api.get(`/patients/${id}`);
    },

    /*
    |--------------------------------------------------------------------------
    | CREATE PATIENT
    |--------------------------------------------------------------------------
    */

    createPatient(data) {
        return api.post("/patients", data);
    },

    /*
    |--------------------------------------------------------------------------
    | UPDATE PATIENT
    |--------------------------------------------------------------------------
    */

    updatePatient(id, data) {
        return api.put(`/patients/${id}`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | DELETE PATIENT
    |--------------------------------------------------------------------------
    */

    deletePatient(id) {
        return api.delete(`/patients/${id}`);
    },
};

export default patientService;
