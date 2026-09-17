import React, { useEffect, useMemo, useState } from "react";

const template = {
    preoperative: [
        ["identity", "Identitas pasien sudah dikonfirmasi"],
        ["procedure", "Prosedur operasi sudah dikonfirmasi"],
        [
            "site",
            "Lokasi operasi sudah dikonfirmasi / ditandai bila diperlukan",
        ],
        ["consent", "Persetujuan tindakan tersedia"],
        ["fasting", "Status puasa sudah diverifikasi"],
        ["supporting", "Pemeriksaan penunjang yang diperlukan tersedia"],
        ["preparation", "Persiapan pasien sudah selesai"],
    ],

    "sign-in": [
        ["identity", "Identitas pasien dikonfirmasi kembali"],
        ["procedure", "Prosedur dan lokasi operasi dikonfirmasi"],
        ["consent", "Persetujuan tindakan dikonfirmasi"],
        ["anesthesia", "Kesiapan anestesi dikonfirmasi"],
        ["allergy", "Alergi dan risiko pasien dikonfirmasi"],
    ],

    "time-out": [
        ["team", "Seluruh anggota tim memperkenalkan nama dan perannya"],
        ["identity", "Identitas pasien dikonfirmasi"],
        ["procedure", "Prosedur dan lokasi operasi dikonfirmasi"],
        ["critical", "Tahapan kritis / risiko khusus dibahas"],
        ["antibiotic", "Antibiotik profilaksis dikonfirmasi bila diperlukan"],
        ["imaging", "Pencitraan penting tersedia bila diperlukan"],
    ],

    "sign-out": [
        ["procedure", "Nama prosedur yang dilakukan dikonfirmasi"],
        ["count", "Hitung instrumen, kasa, dan jarum lengkap"],
        ["specimen", "Spesimen diberi label dengan benar bila ada"],
        ["equipment", "Masalah alat dicatat bila ada"],
        ["recovery", "Rencana pemulihan dan pasca operasi dibahas"],
    ],
};

/*
|--------------------------------------------------------------------------
| Build Checklist Items
|--------------------------------------------------------------------------
|
| Function ini dibuat di luar component supaya tidak dibuat ulang
| setiap render.
|
*/

function buildChecklistItems(phase, initialItems) {
    /*
     * Kalau backend sudah punya data checklist,
     * pakai data tersebut.
     */
    if (Array.isArray(initialItems) && initialItems.length > 0) {
        return initialItems.map((item) => ({
            ...item,
            checked: Boolean(item.checked),
            note: item.note ?? "",
        }));
    }

    /*
     * Kalau belum ada data dari backend,
     * buat checklist berdasarkan template.
     */
    return (template[phase] ?? []).map(([key, label]) => ({
        key,
        label,
        checked: false,
        note: "",
    }));
}

export default function SafetyChecklistPanel({
    phase,
    initialItems,
    onSave,
    disabled = false,
}) {
    /*
    |--------------------------------------------------------------------------
    | Stable Initial Items Key
    |--------------------------------------------------------------------------
    |
    | Jangan pakai initialItems = [] pada parameter component.
    |
    | JSON string dipakai supaya React hanya menganggap data berubah
    | ketika ISI checklist memang berubah, bukan hanya reference array.
    |
    */

    const initialItemsKey = JSON.stringify(
        Array.isArray(initialItems) ? initialItems : [],
    );

    /*
    |--------------------------------------------------------------------------
    | Seed
    |--------------------------------------------------------------------------
    */

    const seed = useMemo(
        () => buildChecklistItems(phase, initialItems),
        [phase, initialItemsKey],
    );

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const [items, setItems] = useState(() => seed);

    const [saving, setSaving] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Sync Backend Data
    |--------------------------------------------------------------------------
    |
    | Ini hanya berjalan kalau phase atau isi initialItems berubah.
    |
    | Tidak lagi berjalan setiap render.
    |
    */

    useEffect(() => {
        setItems(seed);
    }, [seed]);

    /*
    |--------------------------------------------------------------------------
    | Update Checklist Item
    |--------------------------------------------------------------------------
    */

    const updateItem = (index, patch) => {
        setItems((prev) =>
            prev.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          ...patch,
                      }
                    : item,
            ),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const save = async () => {
        if (saving || disabled || items.length === 0) {
            return;
        }

        try {
            setSaving(true);

            await onSave(items);
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Checklist Progress
    |--------------------------------------------------------------------------
    */

    const checkedCount = items.filter((item) => Boolean(item.checked)).length;

    const completed = items.length > 0 && checkedCount === items.length;

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <section className="rounded-[14px] border border-[#ececec] bg-white p-[18px]">
            {/* HEADER */}

            <div className="mb-[12px] flex items-center justify-between gap-[12px]">
                <p className="text-[11px] text-[#999999]">
                    {checkedCount}/{items.length} item terverifikasi
                </p>

                <span
                    className={`
                        rounded-full
                        px-[9px]
                        py-[4px]
                        text-[10px]
                        font-medium

                        ${
                            completed
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                        }
                    `}
                >
                    {completed ? "Lengkap" : "Belum lengkap"}
                </span>
            </div>

            {/* CHECKLIST */}

            <div className="space-y-[8px]">
                {items.map((item, index) => (
                    <div
                        key={item.key}
                        className="rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]"
                    >
                        {/* CHECKBOX */}

                        <label className="flex cursor-pointer items-start gap-[10px]">
                            <input
                                type="checkbox"
                                checked={Boolean(item.checked)}
                                disabled={disabled}
                                onChange={(event) =>
                                    updateItem(index, {
                                        checked: event.target.checked,
                                    })
                                }
                                className="
                                        mt-[2px]
                                        h-[16px]
                                        w-[16px]
                                        cursor-pointer
                                        accent-[#1688f8]
                                        disabled:cursor-not-allowed
                                    "
                            />

                            <span className="text-[12px] font-medium text-[#555555]">
                                {item.label}
                            </span>
                        </label>

                        {/* CATATAN */}

                        <input
                            type="text"
                            value={item.note ?? ""}
                            disabled={disabled}
                            onChange={(event) =>
                                updateItem(index, {
                                    note: event.target.value,
                                })
                            }
                            placeholder="Catatan (opsional)"
                            className="
                                    mt-[9px]
                                    h-[36px]
                                    w-full
                                    rounded-[8px]
                                    border
                                    border-[#eeeeee]
                                    bg-[#fafafa]
                                    px-[10px]
                                    text-[11px]
                                    text-[#555555]
                                    outline-none
                                    transition
                                    placeholder:text-[#bbbbbb]
                                    focus:border-[#1688f8]
                                    disabled:cursor-not-allowed
                                    disabled:bg-[#f5f5f5]
                                "
                        />
                    </div>
                ))}
            </div>

            {/* SAVE */}

            {!disabled && (
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || items.length === 0}
                    className="
                        mt-[14px]
                        inline-flex
                        h-[40px]
                        items-center
                        rounded-[9px]
                        bg-[#1688f8]
                        px-[15px]
                        text-[11px]
                        font-medium
                        text-white
                        transition
                        hover:bg-[#0f7be8]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    {saving ? "Menyimpan..." : "Simpan Checklist"}
                </button>
            )}
        </section>
    );
}
