import api from "../../../shared/services/api";

const registrationService = {
    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    getRegistrations(params = {}) {
        const searchParams = new URLSearchParams();

        if (params.search) {
            searchParams.set("search", params.search);
        }

        if (params.status) {
            searchParams.set("status", params.status);
        }

        if (params.unit_id) {
            searchParams.set("unit_id", params.unit_id);
        }

        if (params.date) {
            searchParams.set("date", params.date);
        }

        if (params.page) {
            searchParams.set("page", params.page);
        }

        const query = searchParams.toString();

        return api.get(`/registrations${query ? `?${query}` : ""}`);
    },

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    getOptions() {
        return api.get("/registrations/options");
    },

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    getRegistration(id) {
        return api.get(`/registrations/${id}`);
    },

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    createRegistration(data) {
        return api.post("/registrations", data);
    },

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    updateRegistration(id, data) {
        return api.put(`/registrations/${id}`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | CANCEL - PENDAFTARAN
    |--------------------------------------------------------------------------
    */

    cancelRegistration(id) {
        return api.patch(`/registrations/${id}/cancel`, {});
    },

    /*
    |--------------------------------------------------------------------------
    | START SERVICE - DOKTER
    |--------------------------------------------------------------------------
    */

    startService(id) {
        return api.patch(`/registrations/${id}/start-service`, {});
    },

    /*
    |--------------------------------------------------------------------------
    | COMPLETE SERVICE - DOKTER
    |--------------------------------------------------------------------------
    */

    completeService(id) {
        return api.patch(`/registrations/${id}/complete-service`, {});
    },
};

export default registrationService;
