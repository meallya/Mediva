import api from "../../../../shared/services/api";
import { buildQuery } from "../../shared/masterDataUtils";

const doctorService = {
    getAll(params = {}) {
        return api.get(`/master/doctors${buildQuery(params)}`);
    },

    getById(id) {
        return api.get(`/master/doctors/${id}`);
    },

    create(payload) {
        return api.post("/master/doctors", payload);
    },

    update(id, payload) {
        return api.put(`/master/doctors/${id}`, payload);
    },

    toggleStatus(id) {
        return api.patch(`/master/doctors/${id}/status`);
    },

    getOptions(doctorId = null) {
        return api.get(
            `/master/doctors/options${buildQuery({
                doctor_id: doctorId,
            })}`,
        );
    },

};

export default doctorService;
