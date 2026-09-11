import api from "../../../shared/services/api";

const prescriptionService = {
    getByExamination(examinationId) {
        return api.get(`/examinations/${examinationId}/prescription`);
    },

    create(examinationId) {
        return api.post("/prescriptions", {
            examination_id: examinationId,
        });
    },

    update(prescriptionId, payload) {
        return api.put(`/prescriptions/${prescriptionId}`, payload);
    },

    searchMedicines(search) {
        return api.get("/medicines/search", {
            params: {
                search,
            },
        });
    },

    addItem(prescriptionId, payload) {
        return api.post(`/prescriptions/${prescriptionId}/items`, payload);
    },

    deleteItem(prescriptionId, itemId) {
        return api.delete(`/prescriptions/${prescriptionId}/items/${itemId}`);
    },

    submit(prescriptionId) {
        return api.patch(`/prescriptions/${prescriptionId}/submit`);
    },
};

export default prescriptionService;
