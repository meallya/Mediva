export function buildQuery(params = {}) {
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

export function getErrorMessage(error, fallback) {
    const validationErrors = error?.data?.errors;

    if (validationErrors && typeof validationErrors === "object") {
        const first = Object.values(validationErrors)
            .flat()
            .find(Boolean);

        if (first) {
            return first;
        }
    }

    return error?.message || fallback;
}

export function normalizeMeta(response) {
    return {
        current_page: response?.current_page ?? 1,
        last_page: response?.last_page ?? 1,
        total: response?.total ?? 0,
        from: response?.from ?? 0,
        to: response?.to ?? 0,
    };
}

export const inputClass =
    "h-[42px] w-full rounded-[9px] border border-[#dddddd] bg-white px-[12px] text-[13px] text-[#343434] outline-none transition focus:border-[#7EBDEC] focus:ring-2 focus:ring-[#C2E1F4]/40";

export const textareaClass =
    "min-h-[96px] w-full resize-y rounded-[9px] border border-[#dddddd] bg-white px-[12px] py-[10px] text-[13px] text-[#343434] outline-none transition focus:border-[#7EBDEC] focus:ring-2 focus:ring-[#C2E1F4]/40";
