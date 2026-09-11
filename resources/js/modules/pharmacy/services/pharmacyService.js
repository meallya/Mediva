import api from "../../../shared/services/api";

const pharmacyService = {
  /*
    |--------------------------------------------------------------------------
    | PRESCRIPTION QUEUE
    |--------------------------------------------------------------------------
    */

  getPrescriptions(params = {}) {
    return api.get("/pharmacy/prescriptions", {
      params,
    });
  },

  /*
    |--------------------------------------------------------------------------
    | PRESCRIPTION DETAIL
    |--------------------------------------------------------------------------
    */

  getPrescription(id) {
    return api.get(`/pharmacy/prescriptions/${id}`);
  },

  /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    */

  verifyPrescription(id, payload = {}) {
    return api.patch(`/pharmacy/prescriptions/${id}/verify`, payload);
  },

  /*
    |--------------------------------------------------------------------------
    | SUBSTITUTE MEDICINE
    |--------------------------------------------------------------------------
    */

  substituteMedicine(prescriptionId, itemId, payload) {
    return api.patch(
      `/pharmacy/prescriptions/${prescriptionId}/items/${itemId}/substitute`,
      payload,
    );
  },

  /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

  cancelPrescription(id, reason) {
    return api.patch(`/pharmacy/prescriptions/${id}/cancel`, {
      reason,
    });
  },

  /*
    |--------------------------------------------------------------------------
    | PROCESSING
    |--------------------------------------------------------------------------
    */

  startProcessing(id) {
    return api.patch(`/pharmacy/prescriptions/${id}/processing`);
  },

  /*
    |--------------------------------------------------------------------------
    | READY
    |--------------------------------------------------------------------------
    */

  markReady(id) {
    return api.patch(`/pharmacy/prescriptions/${id}/ready`);
  },

  /*
    |--------------------------------------------------------------------------
    | DISPENSE
    |--------------------------------------------------------------------------
    */

  dispense(id) {
    return api.patch(`/pharmacy/prescriptions/${id}/dispense`);
  },

  /*
    |--------------------------------------------------------------------------
    | MEDICINE SEARCH
    |--------------------------------------------------------------------------
    */

  searchMedicines(search) {
    return api.get("/medicines/search", {
      params: {
        search,
      },
    });
  },
};

export default pharmacyService;
