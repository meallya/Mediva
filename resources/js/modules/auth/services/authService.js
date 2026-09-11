import api from "../../../shared/services/api";

const authService = {
    login(credentials) {
        return api.post("/auth/login", credentials);
    },

    getCurrentUser() {
        return api.get("/auth/me");
    },

    switchRole(assignmentId) {
        return api.post("/auth/switch-role", {
            assignment_id: assignmentId,
        });
    },

    logout() {
        return api.post("/auth/logout");
    },
};

export default authService;
