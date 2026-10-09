import api from "../../../../shared/services/api";

const BASE = "/hr";

export const hrService = {
    dashboard: () => api.get(`${BASE}/dashboard`),

    // ============ EMPLOYEES ============
    employees: (params = {}) => api.get(`${BASE}/employees`, { params }),
    employee: (id) => api.get(`${BASE}/employees/${id}`),
    createEmployee: (data) => api.post(`${BASE}/employees`, data),

    // ============ SCHEDULES ============
    schedules: (params = {}) => api.get(`${BASE}/schedules`, { params }),
    schedule: (id) => api.get(`${BASE}/schedules/${id}`),
    createSchedule: (data) => api.post(`${BASE}/schedules`, data),
    updateSchedule: (id, data) => api.put(`${BASE}/schedules/${id}`, data),
    deleteSchedule: (id) => api.delete(`${BASE}/schedules/${id}`),

    // ============ ATTENDANCES ============
    attendances: (params = {}) => api.get(`${BASE}/attendances`, { params }),
    attendance: (id) => api.get(`${BASE}/attendances/${id}`),
    createAttendance: (data) => api.post(`${BASE}/attendances`, data),
    updateAttendance: (id, data) => api.put(`${BASE}/attendances/${id}`, data),
    deleteAttendance: (id) => api.delete(`${BASE}/attendances/${id}`),

    // ============ ABSENCE / LEAVE REQUESTS ============
    absences: (params = {}) => api.get(`${BASE}/absences`, { params }),
    absence: (id) => api.get(`${BASE}/absences/${id}`),
    createAbsence: (data) => api.post(`${BASE}/absences`, data),
    updateAbsence: (id, data) => api.put(`${BASE}/absences/${id}`, data),
    deleteAbsence: (id) => api.delete(`${BASE}/absences/${id}`),
    approveAbsence: (id, data) =>
        api.post(`${BASE}/absences/${id}/approve`, data),
    rejectAbsence: (id, data) =>
        api.post(`${BASE}/absences/${id}/reject`, data),

    // ============ OTHER ============
    overtimes: (params = {}) => api.get(`${BASE}/overtimes`, { params }),
    performances: (params = {}) => api.get(`${BASE}/performances`, { params }),
    trainings: (params = {}) => api.get(`${BASE}/trainings`, { params }),
    offboard: (id, data) => api.post(`${BASE}/employees/${id}/offboard`, data),
};
