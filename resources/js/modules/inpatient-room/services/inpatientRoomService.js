import api from "../../../../shared/services/api";
import { buildQuery } from "../../shared/masterDataUtils";

const inpatientRoomService = {
    getAll(params = {}) {
        return api.get(`/master/inpatient-rooms${buildQuery(params)}`);
    },

    getById(id) {
        return api.get(`/master/inpatient-rooms/${id}`);
    },

    create(payload) {
        return api.post("/master/inpatient-rooms", payload);
    },

    update(id, payload) {
        return api.put(`/master/inpatient-rooms/${id}`, payload);
    },

    toggleStatus(id) {
        return api.patch(`/master/inpatient-rooms/${id}/status`);
    },

    getOptions() {
        return api.get("/master/inpatient-rooms/options");
    },
};

export default inpatientRoomService;
