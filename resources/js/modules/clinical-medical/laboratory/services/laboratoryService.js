import api from "../../../../shared/services/api";

const laboratoryService = {
    getDashboard() {
        return api.get("/laboratory/dashboard");
    },

    getOptions() {
        return api.get("/laboratory/options");
    },

    getSampleTypes() {
        return api.get("/laboratory/sample-types");
    },

    createSampleType(payload) {
        return api.post("/laboratory/sample-types", payload);
    },

    updateSampleType(id, payload) {
        return api.put(`/laboratory/sample-types/${id}`, payload);
    },

    getTestTypes(params = {}) {
        return api.get("/laboratory/test-types", { params });
    },

    createTestType(payload) {
        return api.post("/laboratory/test-types", payload);
    },

    updateTestType(id, payload) {
        return api.put(`/laboratory/test-types/${id}`, payload);
    },

    updateTestTypeStatus(id, isActive) {
        return api.patch(`/laboratory/test-types/${id}/status`, {
            is_active: isActive,
        });
    },

    getParameters(testTypeId) {
        return api.get(`/laboratory/test-types/${testTypeId}/parameters`);
    },

    createParameter(testTypeId, payload) {
        return api.post(
            `/laboratory/test-types/${testTypeId}/parameters`,
            payload,
        );
    },

    updateParameter(id, payload) {
        return api.put(`/laboratory/parameters/${id}`, payload);
    },

    getReferenceRanges(parameterId) {
        return api.get(
            `/laboratory/parameters/${parameterId}/reference-ranges`,
        );
    },

    createReferenceRange(parameterId, payload) {
        return api.post(
            `/laboratory/parameters/${parameterId}/reference-ranges`,
            payload,
        );
    },

    updateReferenceRange(id, payload) {
        return api.put(`/laboratory/reference-ranges/${id}`, payload);
    },

    getOrders(params = {}) {
        return api.get("/laboratory/orders", { params });
    },

    getOrder(id) {
        return api.get(`/laboratory/orders/${id}`);
    },

    createOrder(payload) {
        return api.post("/laboratory/orders", payload);
    },

    submitOrder(id) {
        return api.patch(`/laboratory/orders/${id}/submit`, {});
    },

    cancelOrder(id, reason) {
        return api.patch(`/laboratory/orders/${id}/cancel`, { reason });
    },

    collectSamples(id) {
        return api.post(`/laboratory/orders/${id}/collect-samples`, {});
    },

    receiveSamples(id) {
        return api.post(`/laboratory/orders/${id}/receive-samples`, {});
    },

    rejectSpecimen(id, reason) {
        return api.patch(`/laboratory/specimens/${id}/reject`, { reason });
    },

    startProcessing(id) {
        return api.post(`/laboratory/orders/${id}/start-processing`, {});
    },

    saveResults(orderItemId, results) {
        return api.post(`/laboratory/order-items/${orderItemId}/results`, {
            results,
        });
    },

    submitVerification(id) {
        return api.post(
            `/laboratory/orders/${id}/submit-verification`,
            {},
        );
    },

    verify(id) {
        return api.post(`/laboratory/orders/${id}/verify`, {});
    },
};

export default laboratoryService;
