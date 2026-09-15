import api from "../../../../shared/services/api";

const generalInventoryService = {
    getDashboard() {
        return api.get("/inventory/dashboard");
    },

    getOptions() {
        return api.get("/inventory/options");
    },

    getItems(params = {}) {
        return api.get("/inventory/items", { params });
    },

    createItem(payload) {
        return api.post("/inventory/items", payload);
    },

    updateItem(id, payload) {
        return api.put(`/inventory/items/${id}`, payload);
    },

    updateItemStatus(id, isActive) {
        return api.patch(`/inventory/items/${id}/status`, {
            is_active: isActive,
        });
    },

    getCategories() {
        return api.get("/inventory/categories");
    },

    createCategory(payload) {
        return api.post("/inventory/categories", payload);
    },

    updateCategory(id, payload) {
        return api.put(`/inventory/categories/${id}`, payload);
    },

    getUoms() {
        return api.get("/inventory/uoms");
    },

    createUom(payload) {
        return api.post("/inventory/uoms", payload);
    },

    updateUom(id, payload) {
        return api.put(`/inventory/uoms/${id}`, payload);
    },

    getWarehouses() {
        return api.get("/inventory/warehouses");
    },

    createWarehouse(payload) {
        return api.post("/inventory/warehouses", payload);
    },

    updateWarehouse(id, payload) {
        return api.put(`/inventory/warehouses/${id}`, payload);
    },

    getStocks(params = {}) {
        return api.get("/inventory/stocks", { params });
    },

    stockIn(payload) {
        return api.post("/inventory/stock-in", payload);
    },

    stockOut(payload) {
        return api.post("/inventory/stock-out", payload);
    },

    getMovements(params = {}) {
        return api.get("/inventory/movements", { params });
    },

    getRequests(params = {}) {
        return api.get("/inventory/requests", { params });
    },

    createRequest(payload) {
        return api.post("/inventory/requests", payload);
    },

    approveRequest(id, payload = {}) {
        return api.patch(`/inventory/requests/${id}/approve`, payload);
    },

    rejectRequest(id, reason) {
        return api.patch(`/inventory/requests/${id}/reject`, {
            reason,
        });
    },

    distributeRequest(id) {
        return api.post(`/inventory/requests/${id}/distribute`, {});
    },

    stockOpname(payload) {
        return api.post("/inventory/stock-opnames", payload);
    },
};

export default generalInventoryService;
