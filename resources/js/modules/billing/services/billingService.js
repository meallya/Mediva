import api from "../../../shared/services/api";

function queryString(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "all"
        ) {
            searchParams.set(key, value);
        }
    });

    const query = searchParams.toString();

    return query ? `?${query}` : "";
}

const billingService = {
    getInvoices(params = {}) {
        return api.get(`/billing${queryString(params)}`);
    },

    getSummary() {
        return api.get("/billing/summary");
    },

    getCandidates(params = {}) {
        return api.get(`/billing/candidates${queryString(params)}`);
    },

    getInvoice(id) {
        return api.get(`/billing/${id}`);
    },

    generateBilling(visitId) {
        return api.post(`/billing/generate/${visitId}`);
    },

    addItem(invoiceId, payload) {
        return api.post(`/billing/${invoiceId}/items`, payload);
    },

    updateItem(invoiceId, itemId, payload) {
        return api.put(`/billing/${invoiceId}/items/${itemId}`, payload);
    },

    deleteItem(invoiceId, itemId) {
        return api.delete(`/billing/${invoiceId}/items/${itemId}`);
    },

    getPaymentMethods() {
        return api.get("/billing/payment-methods");
    },

    createPayment(invoiceId, payload) {
        return api.post(`/billing/${invoiceId}/payments`, payload);
    },

    voidPayment(invoiceId, paymentId, payload) {
        return api.patch(
            `/billing/${invoiceId}/payments/${paymentId}/void`,
            payload,
        );
    },

    cancelInvoice(invoiceId, payload) {
        return api.patch(`/billing/${invoiceId}/cancel`, payload);
    },

    getTransactions(params = {}) {
        return api.get(`/billing/transactions${queryString(params)}`);
    },

    getTariffOptions() {
        return api.get("/master/tariffs/options");
    },

    getTariffs(params = {}) {
        return api.get(`/master/tariffs${queryString(params)}`);
    },

    createTariff(payload) {
        return api.post("/master/tariffs", payload);
    },

    updateTariff(id, payload) {
        return api.put(`/master/tariffs/${id}`, payload);
    },

    toggleTariffStatus(id) {
        return api.patch(`/master/tariffs/${id}/status`);
    },
};

export default billingService;
