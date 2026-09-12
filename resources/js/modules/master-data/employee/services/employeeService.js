import api from "../../../../shared/services/api";
import { buildQuery } from "../../shared/masterDataUtils";

const employeeService = {
    getAll(params = {}) {
        return api.get(`/master/employees${buildQuery(params)}`);
    },

    getById(id) {
        return api.get(`/master/employees/${id}`);
    },

    create(payload) {
        return api.post("/master/employees", payload);
    },

    update(id, payload) {
        return api.put(`/master/employees/${id}`, payload);
    },

    toggleStatus(id) {
        return api.patch(`/master/employees/${id}/status`);
    },

};

export default employeeService;
