import api from "../../../../shared/services/api";
import { buildQuery } from "../../shared/masterDataUtils";

const paymentMethodService = {
    getAll(params = {}) {
        return api.get(`/master/payment-methods${buildQuery(params)}`);
    },

    getById(id) {
        return api.get(`/master/payment-methods/${id}`);
    },

    create(payload) {
        return api.post("/master/payment-methods", payload);
    },

    update(id, payload) {
        return api.put(`/master/payment-methods/${id}`, payload);
    },

    toggleStatus(id) {
        return api.patch(`/master/payment-methods/${id}/status`);
    },

};

export default paymentMethodService;
