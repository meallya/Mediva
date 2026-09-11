import api from "../../../shared/services/api";

function queryString(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            searchParams.set(key, value);
        }
    });

    const query = searchParams.toString();

    return query ? `?${query}` : "";
}

const reportService = {
    getOverview(params = {}) {
        return api.get(
            `/reports/overview${queryString(params)}`,
        );
    },

    getDaily(date) {
        return api.get(
            `/reports/daily${queryString({ date })}`,
        );
    },

    getMonthly(month) {
        return api.get(
            `/reports/monthly${queryString({ month })}`,
        );
    },

    exportCsv(params = {}) {
        const url = `/api/reports/export${queryString(params)}`;

        window.open(url, "_blank", "noopener,noreferrer");
    },
};

export default reportService;
