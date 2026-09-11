import api from "../../../shared/services/api";

const queueService = {
    /*
    |--------------------------------------------------------------------------
    | LIST QUEUE
    |--------------------------------------------------------------------------
    */

    getQueues(params = {}) {
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

        if (params.service_type) {
            searchParams.set("service_type", params.service_type);
        }

        if (params.date) {
            searchParams.set("date", params.date);
        }

        if (params.page) {
            searchParams.set("page", params.page);
        }

        const query = searchParams.toString();

        return api.get(`/queues${query ? `?${query}` : ""}`);
    },

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    getOptions() {
        return api.get("/queues/options");
    },

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    getQueue(id) {
        return api.get(`/queues/${id}`);
    },

    /*
    |--------------------------------------------------------------------------
    | CALL PATIENT
    |--------------------------------------------------------------------------
    */

    callPatient(id) {
        return api.patch(`/queues/${id}/call`, {});
    },

    /*
    |--------------------------------------------------------------------------
    | START SERVICE
    |--------------------------------------------------------------------------
    */

    startService(id) {
        return api.patch(`/queues/${id}/start-service`, {});
    },

    /*
    |--------------------------------------------------------------------------
    | COMPLETE QUEUE
    |--------------------------------------------------------------------------
    |
    | Masih dipertahankan di service untuk backend/API.
    | Tapi flow dokter sekarang selesai melalui Examination.
    |
    |--------------------------------------------------------------------------
    */

    completeQueue(id) {
        return api.patch(`/queues/${id}/complete`, {});
    },
};

export default queueService;
