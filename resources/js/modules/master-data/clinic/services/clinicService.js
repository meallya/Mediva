import api from "../../../../shared/services/api";
import { buildQuery } from "../../shared/masterDataUtils";

const clinicService = {
    getAll(params = {}) {
        return api.get(`/master/clinics${buildQuery(params)}`);
    },

    getById(id) {
        return api.get(`/master/clinics/${id}`);
    },

    create(payload) {
        return api.post("/master/clinics", payload);
    },

    update(id, payload) {
        return api.put(`/master/clinics/${id}`, payload);
    },

    toggleStatus(id) {
        return api.patch(`/master/clinics/${id}/status`);
    },

};

export default clinicService;
