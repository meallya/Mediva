import api from "../../../../shared/services/api";

/*
|--------------------------------------------------------------------------
| BASE URL
|--------------------------------------------------------------------------
*/

const BASE_URL = "/operating-room";

/*
|--------------------------------------------------------------------------
| OPERATING ROOM SERVICE
|--------------------------------------------------------------------------
*/

const operatingRoomService = {
    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    getDashboard() {
        return api.get(`${BASE_URL}/dashboard`);
    },

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    getOptions() {
        return api.get(`${BASE_URL}/options`);
    },

    searchPatients(keyword) {
        return api.get("/operating-room/patients/search", {
            params: {
                q: keyword,
            },
        });
    },

    getPatientVisits(patientId) {
        return api.get(`/operating-room/patients/${patientId}/visits`);
    },

    /*
    |--------------------------------------------------------------------------
    | SURGERIES
    |--------------------------------------------------------------------------
    */

    getSurgeries(params = {}) {
        const searchParams = new URLSearchParams();

        if (params.search) {
            searchParams.set("search", params.search);
        }

        if (params.status) {
            searchParams.set("status", params.status);
        }

        if (params.priority) {
            searchParams.set("priority", params.priority);
        }

        if (params.operating_room_id) {
            searchParams.set("operating_room_id", params.operating_room_id);
        }

        if (params.date_from) {
            searchParams.set("date_from", params.date_from);
        }

        if (params.date_to) {
            searchParams.set("date_to", params.date_to);
        }

        if (params.page) {
            searchParams.set("page", params.page);
        }

        if (params.per_page) {
            searchParams.set("per_page", params.per_page);
        }

        const query = searchParams.toString();

        return api.get(`${BASE_URL}/surgeries${query ? `?${query}` : ""}`);
    },

    getSurgery(id) {
        return api.get(`${BASE_URL}/surgeries/${id}`);
    },

    createSurgery(data) {
        return api.post(`${BASE_URL}/surgeries`, data);
    },

    updateSurgery(id, data) {
        return api.put(`${BASE_URL}/surgeries/${id}`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | SCHEDULE
    |--------------------------------------------------------------------------
    */

    scheduleSurgery(id, data) {
        return api.patch(`${BASE_URL}/surgeries/${id}/schedule`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | TEAM
    |--------------------------------------------------------------------------
    */

    saveTeam(id, data) {
        return api.put(`${BASE_URL}/surgeries/${id}/team`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | CHECKLIST
    |--------------------------------------------------------------------------
    */

    saveChecklist(id, phase, data) {
        return api.put(`${BASE_URL}/surgeries/${id}/checklist/${phase}`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | START OPERATION
    |--------------------------------------------------------------------------
    */

    startSurgery(id, data = {}) {
        return api.post(`${BASE_URL}/surgeries/${id}/start`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | FINISH OPERATION
    |--------------------------------------------------------------------------
    */

    finishSurgery(id, data = {}) {
        return api.post(`${BASE_URL}/surgeries/${id}/finish`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | COMPLETE
    |--------------------------------------------------------------------------
    */

    completeSurgery(id, data = {}) {
        return api.post(`${BASE_URL}/surgeries/${id}/complete`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    cancelSurgery(id, data = {}) {
        return api.post(`${BASE_URL}/surgeries/${id}/cancel`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | USAGE
    |--------------------------------------------------------------------------
    */

    addUsage(id, data) {
        return api.post(`${BASE_URL}/surgeries/${id}/usages`, data);
    },

    getMedicineStocks(keyword) {
        return api.get("/pharmacy/stocks", {
            params: {
                search: keyword,
                per_page: 20,
            },
        });
    },

    getInventoryStocks(keyword) {
        return api.get("/inventory/stocks", {
            params: {
                search: keyword,
                per_page: 20,
            },
        });
    },

    getPharmacyStocks(params = {}) {
        return api.get("/pharmacy/stocks", {
            params,
        });
    },

    getInventoryItems(params = {}) {
        return api.get("/inventory/items", {
            params,
        });
    },

    getInventoryStocks(params = {}) {
        return api.get("/inventory/stocks", {
            params,
        });
    },

    /*
    |--------------------------------------------------------------------------
    | RECOVERY
    |--------------------------------------------------------------------------
    */

    saveRecovery(id, data) {
        return api.put(`${BASE_URL}/surgeries/${id}/recovery`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | MASTER - OPERATION TYPES
    |--------------------------------------------------------------------------
    */

    getOperationTypes() {
        return api.get(`${BASE_URL}/operation-types`);
    },

    createOperationType(data) {
        return api.post(`${BASE_URL}/operation-types`, data);
    },

    updateOperationType(id, data) {
        return api.put(`${BASE_URL}/operation-types/${id}`, data);
    },

    /*
    |--------------------------------------------------------------------------
    | MASTER - OPERATING ROOMS
    |--------------------------------------------------------------------------
    */

    getRooms() {
        return api.get(`${BASE_URL}/rooms`);
    },

    createRoom(data) {
        return api.post(`${BASE_URL}/rooms`, data);
    },

    updateRoom(id, data) {
        return api.put(`${BASE_URL}/rooms/${id}`, data);
    },
};

/*
|--------------------------------------------------------------------------
| COMPATIBILITY ALIASES
|--------------------------------------------------------------------------
|
| Alias ini dibuat supaya file page Operating Room versi awal tetap jalan
| walaupun masih memakai nama method lama.
|
*/

operatingRoomService.dashboard = operatingRoomService.getDashboard;

operatingRoomService.options = operatingRoomService.getOptions;

operatingRoomService.list = operatingRoomService.getSurgeries;

operatingRoomService.detail = operatingRoomService.getSurgery;

operatingRoomService.create = operatingRoomService.createSurgery;

operatingRoomService.update = operatingRoomService.updateSurgery;

operatingRoomService.schedule = operatingRoomService.scheduleSurgery;

operatingRoomService.team = operatingRoomService.saveTeam;

operatingRoomService.checklist = operatingRoomService.saveChecklist;

operatingRoomService.start = operatingRoomService.startSurgery;

operatingRoomService.finish = operatingRoomService.finishSurgery;

operatingRoomService.complete = operatingRoomService.completeSurgery;

operatingRoomService.cancel = operatingRoomService.cancelSurgery;

operatingRoomService.usage = operatingRoomService.addUsage;

operatingRoomService.recovery = operatingRoomService.saveRecovery;

operatingRoomService.operationTypes = operatingRoomService.getOperationTypes;

operatingRoomService.rooms = operatingRoomService.getRooms;

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
|
| Support dua gaya import:
|
| import operatingRoomService from "...";
|
| dan
|
| import { operatingRoomService } from "...";
|
*/

export { operatingRoomService };

export default operatingRoomService;
