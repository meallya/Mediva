import React, { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faMagnifyingGlass, faRotate } from "@fortawesome/free-solid-svg-icons";

import { operatingRoomService } from "../services/operatingRoomService";

const initialForm = {
    usage_type: "medicine",

    medicine_id: null,
    inventory_item_id: null,

    item_name: "",
    quantity: 1,
    unit: "",
    unit_price: 0,

    billable: true,
    notes: "",
};

export default function UsageForm({ onSubmit }) {
    const [form, setForm] = useState(initialForm);

    const [keyword, setKeyword] = useState("");

    const [results, setResults] = useState([]);

    const [selectedItem, setSelectedItem] = useState(null);

    const [searching, setSearching] = useState(false);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | RESET ITEM
    |--------------------------------------------------------------------------
    */

    const resetItem = () => {
        setSelectedItem(null);
        setKeyword("");
        setResults([]);
        setError("");

        setForm((prev) => ({
            ...prev,

            medicine_id: null,
            inventory_item_id: null,

            item_name: "",
            quantity: 1,
            unit: "",
            unit_price: 0,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | CHANGE USAGE TYPE
    |--------------------------------------------------------------------------
    */

    const handleUsageType = (event) => {
        const value = event.target.value;

        setForm({
            ...initialForm,
            usage_type: value,
        });

        setSelectedItem(null);
        setKeyword("");
        setResults([]);
        setError("");
    };

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE API RESPONSE
    |--------------------------------------------------------------------------
    */

    const extractArray = (response) => {
        const candidates = [response?.data?.data, response?.data];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }

            if (Array.isArray(candidate?.data)) {
                return candidate.data;
            }
        }

        return [];
    };

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const query = keyword.trim();

        if (query.length < 2 || selectedItem) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearching(true);

                setError("");

                let response;

                if (form.usage_type === "medicine") {
                    response =
                        await operatingRoomService.getMedicineStocks(query);
                }

                if (form.usage_type === "medical_material") {
                    response =
                        await operatingRoomService.getInventoryStocks(query);
                }

                const data = extractArray(response);

                setResults(data);
            } catch (err) {
                console.error("Gagal mencari item:", err);

                setResults([]);

                setError(err?.response?.data?.message ?? "Gagal mencari item.");
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [keyword, form.usage_type, selectedItem]);

    /*
    |--------------------------------------------------------------------------
    | HELPERS ITEM
    |--------------------------------------------------------------------------
    */

    const getItemId = (item) =>
        item?.id ?? item?.medicine_id ?? item?.inventory_item_id ?? null;

    const getItemName = (item) =>
        item?.name ??
        item?.medicine_name ??
        item?.item_name ??
        item?.product_name ??
        "-";

    const getItemCode = (item) =>
        item?.code ??
        item?.medicine_code ??
        item?.item_code ??
        item?.sku ??
        null;

    const getItemUnit = (item) =>
        item?.unit ??
        item?.uom?.name ??
        item?.uom_name ??
        item?.unit_name ??
        item?.base_unit ??
        "";

    const getItemPrice = (item) => {
        return Number(
            item?.current_selling_price ??
                item?.selling_price ??
                item?.sale_price ??
                item?.price ??
                item?.unit_price ??
                item?.selling_unit_price ??
                0,
        );
    };

    const getItemStock = (item) => {
        if (form.usage_type === "medicine") {
            return Number(item?.usable_stock ?? 0);
        }

        return Number(item?.quantity ?? item?.total_stock ?? 0);
    };

    const selectItem = (item) => {
        const id = getItemId(item);
        const name = getItemName(item);
        const unit = getItemUnit(item);
        const price = getItemPrice(item);
        const stock = getItemStock(item);

        const normalized = {
            ...item,

            resolved_id: id,
            resolved_name: name,
            resolved_unit: unit,
            resolved_price: price,
            resolved_stock: stock,

            resolved_warehouse_id:
                form.usage_type === "medical_material"
                    ? (item?.warehouse?.id ?? item?.warehouse_id ?? null)
                    : null,
        };

        setSelectedItem(normalized);

        setKeyword("");
        setResults([]);

        setForm((prev) => ({
            ...prev,

            medicine_id: prev.usage_type === "medicine" ? id : null,

            inventory_item_id:
                prev.usage_type === "medical_material" ? id : null,

            item_name: name,

            unit,

            unit_price: price,

            quantity: 1,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | QUANTITY
    |--------------------------------------------------------------------------
    */

    const changeQuantity = (event) => {
        setForm((prev) => ({
            ...prev,

            quantity: event.target.value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

    const totalPrice = useMemo(() => {
        return Number(form.quantity || 0) * Number(form.unit_price || 0);
    }, [form.quantity, form.unit_price]);

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const submit = async (event) => {
        event.preventDefault();

        if (!selectedItem) {
            setError("Silakan pilih item terlebih dahulu.");

            return;
        }

        const quantity = Number(form.quantity);

        if (!quantity || quantity <= 0) {
            setError("Jumlah pemakaian harus lebih dari 0.");

            return;
        }

        /*
         * Validasi frontend jika API
         * sudah menyediakan stok.
         */
        if (
            selectedItem.resolved_stock > 0 &&
            quantity > selectedItem.resolved_stock
        ) {
            setError(
                `Stok tidak mencukupi. Stok tersedia ${selectedItem.resolved_stock} ${selectedItem.resolved_unit ?? ""}.`,
            );

            return;
        }

        try {
            setSaving(true);
            setError("");

            await onSubmit({
                usage_type: form.usage_type,

                medicine_id:
                    form.usage_type === "medicine"
                        ? Number(form.medicine_id)
                        : null,

                inventory_item_id:
                    form.usage_type === "medical_material"
                        ? Number(form.inventory_item_id)
                        : null,

                asset_id: null,

                item_name: form.item_name,

                quantity,

                unit: form.unit,

                unit_price: Number(form.unit_price || 0),

                billable: Boolean(form.billable),

                notes: form.notes,
            });

            setForm({
                ...initialForm,
                usage_type: form.usage_type,
            });

            setSelectedItem(null);

            setKeyword("");
            setResults([]);
        } catch (err) {
            console.error("Gagal mencatat pemakaian:", err);

            setError(
                err?.response?.data?.message ??
                    err?.message ??
                    "Pemakaian gagal dicatat.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-[14px] rounded-[14px] border border-[#ececec] bg-white p-[18px] md:grid-cols-2"
        >
            {/* JENIS PEMAKAIAN */}

            <Field label="Jenis Pemakaian">
                <select
                    value={form.usage_type}
                    onChange={handleUsageType}
                    className={inputClass}
                >
                    <option value="medicine">Obat</option>

                    <option value="medical_material">Bahan Medis</option>
                </select>
            </Field>

            {/* SEARCH ITEM */}

            <div className="relative">
                <Field label="Cari Item">
                    {!selectedItem ? (
                        <div className="relative">
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[12px] text-[#aaaaaa]"
                            />

                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) =>
                                    setKeyword(event.target.value)
                                }
                                placeholder={
                                    form.usage_type === "medicine"
                                        ? "Cari nama / kode obat..."
                                        : "Cari bahan medis..."
                                }
                                autoComplete="off"
                                className={`${inputClass} pl-[36px]`}
                            />
                        </div>
                    ) : (
                        <div className="flex min-h-[42px] items-center justify-between rounded-[9px] border border-[#cfe5ff] bg-[#f7fbff] px-[12px]">
                            <div>
                                <p className="text-[12px] font-medium text-[#444444]">
                                    {selectedItem.resolved_name}
                                </p>

                                {getItemCode(selectedItem) && (
                                    <p className="mt-[1px] text-[10px] text-[#999999]">
                                        {getItemCode(selectedItem)}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={resetItem}
                                className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#1688f8]"
                            >
                                <FontAwesomeIcon icon={faRotate} />
                                Ganti
                            </button>
                        </div>
                    )}
                </Field>

                {/* SEARCH RESULT */}

                {!selectedItem && keyword.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 z-30 mt-[4px] max-h-[260px] overflow-y-auto rounded-[9px] border border-[#e5e5e5] bg-white shadow-lg">
                        {searching ? (
                            <div className="px-[13px] py-[12px] text-[11px] text-[#999999]">
                                Mencari item...
                            </div>
                        ) : results.length > 0 ? (
                            results.map((item, index) => {
                                const id = getItemId(item);

                                const name = getItemName(item);

                                const unit = getItemUnit(item);

                                const stock = getItemStock(item);

                                const price = getItemPrice(item);

                                return (
                                    <button
                                        key={id ?? index}
                                        type="button"
                                        onClick={() => selectItem(item)}
                                        className="block w-full border-b border-[#eeeeee] px-[13px] py-[10px] text-left transition last:border-b-0 hover:bg-[#f7faff]"
                                    >
                                        <p className="text-[12px] font-medium text-[#444444]">
                                            {name}
                                        </p>

                                        <div className="mt-[3px] flex flex-wrap gap-x-[12px] gap-y-[2px] text-[10px] text-[#999999]">
                                            {unit && (
                                                <span>Satuan: {unit}</span>
                                            )}

                                            <span>Stok: {stock}</span>

                                            {price > 0 && (
                                                <span>
                                                    Rp {formatNumber(price)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-[13px] py-[12px] text-[11px] text-[#999999]">
                                Item tidak ditemukan.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DETAIL ITEM */}

            {selectedItem && (
                <div className="md:col-span-2 grid grid-cols-1 gap-[10px] rounded-[10px] border border-[#eeeeee] bg-[#fafafa] p-[13px] sm:grid-cols-3">
                    <Info
                        label="Stok Tersedia"
                        value={`${selectedItem.resolved_stock} ${selectedItem.resolved_unit || ""}`}
                    />

                    <Info
                        label="Satuan"
                        value={selectedItem.resolved_unit || "-"}
                    />

                    <Info
                        label="Harga Satuan"
                        value={
                            selectedItem.resolved_price > 0
                                ? `Rp ${formatNumber(
                                      selectedItem.resolved_price,
                                  )}`
                                : "-"
                        }
                    />
                </div>
            )}

            {/* JUMLAH */}

            <Field label="Jumlah">
                <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.quantity}
                    onChange={changeQuantity}
                    disabled={!selectedItem}
                    className={inputClass}
                />
            </Field>

            {/* TOTAL */}

            <Field label="Estimasi Total">
                <div className="flex h-[42px] items-center rounded-[9px] border border-[#eeeeee] bg-[#fafafa] px-[12px] text-[12px] font-medium text-[#555555]">
                    Rp {formatNumber(totalPrice)}
                </div>
            </Field>

            {/* BILLABLE */}

            <label className="flex items-center gap-[9px] rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]">
                <input
                    type="checkbox"
                    checked={form.billable}
                    onChange={(event) =>
                        setForm((prev) => ({
                            ...prev,

                            billable: event.target.checked,
                        }))
                    }
                    className="h-[16px] w-[16px] accent-[#1688f8]"
                />

                <span className="text-[12px] text-[#555555]">
                    Masuk tagihan pasien
                </span>
            </label>

            {/* NOTES */}

            <div className="md:col-span-2">
                <Field label="Catatan">
                    <textarea
                        value={form.notes}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,

                                notes: event.target.value,
                            }))
                        }
                        rows="4"
                        placeholder="Catatan pemakaian (opsional)"
                        className="w-full resize-y rounded-[9px] border border-[#dddddd] bg-white px-[12px] py-[10px] text-[13px] text-[#444444] outline-none transition placeholder:text-[#bbbbbb] focus:border-[#1688f8]"
                    />
                </Field>
            </div>

            {/* ERROR */}

            {error && (
                <div className="md:col-span-2 rounded-[9px] border border-red-100 bg-red-50 px-[12px] py-[9px] text-[11px] text-red-600">
                    {error}
                </div>
            )}

            {/* SUBMIT */}

            <button
                type="submit"
                disabled={saving || !selectedItem}
                className="inline-flex h-[42px] items-center justify-center rounded-[9px] bg-[#1688f8] px-[17px] text-[12px] font-medium text-white transition hover:bg-[#0f7be8] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
            >
                {saving ? "Menyimpan..." : "Catat Pemakaian"}
            </button>
        </form>
    );
}

const inputClass = `
    h-[42px]
    w-full
    rounded-[9px]
    border
    border-[#dddddd]
    bg-white
    px-[12px]
    text-[13px]
    text-[#444444]
    outline-none
    transition
    placeholder:text-[#bbbbbb]
    focus:border-[#1688f8]
    disabled:cursor-not-allowed
    disabled:bg-[#f6f6f6]
`;

function Field({ label, children }) {
    return (
        <div>
            <label className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                {label}
            </label>

            {children}
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <p className="text-[10px] text-[#999999]">{label}</p>

            <p className="mt-[3px] text-[12px] font-medium text-[#444444]">
                {value}
            </p>
        </div>
    );
}

function formatNumber(value) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}
