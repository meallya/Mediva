import api from "../../../shared/services/api";

const inventoryService = {
  /*
    |--------------------------------------------------------------------------
    | STOCK
    |--------------------------------------------------------------------------
    */

  getStocks(params = {}) {
    return api.get("/pharmacy/stocks", {
      params,
    });
  },

  updateMinimumStock(medicineId, minimumStock) {
    return api.patch(`/pharmacy/stocks/${medicineId}/minimum`, {
      minimum_stock: minimumStock,
    });
  },

  /*
    |--------------------------------------------------------------------------
    | BATCH
    |--------------------------------------------------------------------------
    */

  getBatches(params = {}) {
    return api.get("/pharmacy/batches", {
      params,
    });
  },

  createBatch(payload) {
    return api.post("/pharmacy/batches", payload);
  },

  receiveBatch(batchId, payload) {
    return api.post(`/pharmacy/batches/${batchId}/receive`, payload);
  },

  /*
    |--------------------------------------------------------------------------
    | MOVEMENT
    |--------------------------------------------------------------------------
    */

  getMovements(params = {}) {
    return api.get("/pharmacy/stock-movements", {
      params,
    });
  },

  /*
    |--------------------------------------------------------------------------
    | OPNAME
    |--------------------------------------------------------------------------
    */

  stockOpname(payload) {
    return api.post("/pharmacy/stock-opnames", payload);
  },

  /*
    |--------------------------------------------------------------------------
    | SUPPLIER
    |--------------------------------------------------------------------------
    */

  getSuppliers(params = {}) {
    return api.get("/pharmacy/suppliers", {
      params,
    });
  },

  createSupplier(payload) {
    return api.post("/pharmacy/suppliers", payload);
  },

  updateSupplier(id, payload) {
    return api.put(`/pharmacy/suppliers/${id}`, payload);
  },

  deleteSupplier(id) {
    return api.delete(`/pharmacy/suppliers/${id}`);
  },

  /*
    |--------------------------------------------------------------------------
    | MEDICINE OPTIONS
    |--------------------------------------------------------------------------
    */

  getMedicines(params = {}) {
    return api.get("/master/medicines", {
      params: {
        per_page: 100,
        status: "active",
        ...params,
      },
    });
  },
};

export default inventoryService;
