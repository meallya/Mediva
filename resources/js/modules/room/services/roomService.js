import api from "../../../../shared/services/api";
import { buildQuery } from "../../shared/masterDataUtils";

const roomService = {
    getAll(params = {}) {
        return api.get(`/master/rooms${buildQuery(params)}`);
    },

    getById(id) {
        return api.get(`/master/rooms/${id}`);
    },

    create(payload) {
        return api.post("/master/rooms", payload);
    },

    update(id, payload) {
        return api.put(`/master/rooms/${id}`, payload);
    },

    toggleStatus(id) {
        return api.patch(`/master/rooms/${id}/status`);
    },

    getOptions() {
        return api.get("/master/rooms/options");
    },

};

export default roomService;
