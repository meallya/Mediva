import React, { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faBoxesStacked,
    faClipboardCheck,
    faClockRotateLeft,
    faPen,
    faPlus,
    faRotate,
    faTrash,
    faTruck,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import inventoryService from "../services/inventoryService";

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function InventoryPage() {
    const [tab, setTab] = useState("stock");

    const tabs = [
        {
            id: "stock",
            label: "Stok Obat",
            icon: faBoxesStacked,
        },
        {
            id: "batch",
            label: "Batch & Expired",
            icon: faBoxesStacked,
        },
        {
            id: "movement",
            label: "Stock Movement",
            icon: faClockRotateLeft,
        },
        {
            id: "opname",
            label: "Stock Opname",
            icon: faClipboardCheck,
        },
        {
            id: "supplier",
            label: "Supplier",
            icon: faTruck,
        },
    ];

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <div>
                    <h1 className="text-[24px] font-semibold text-[#212121]">
                        Stok Obat
                    </h1>

                    <p className="mt-[5px] text-[12px] text-[#626262]">
                        Kelola stok, batch, expired date, stock movement,
                        opname, dan supplier.
                    </p>
                </div>

                <div className="mt-[22px] flex flex-wrap gap-[8px]">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={`
                                    inline-flex
                                    h-[40px]
                                    items-center
                                    gap-[7px]
                                    rounded-[9px]
                                    px-[14px]
                                    text-[13px]
                                    font-medium
                                    transition

                                    ${
                                        tab === item.id
                                            ? "bg-[#047AF7] text-white"
                                            : "border border-[#e5e5e5] bg-white text-[#626262] hover:bg-[#fafbfc]"
                                    }
                                `}
                        >
                            <FontAwesomeIcon icon={item.icon} />

                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="mt-[18px]">
                    {tab === "stock" && <StockTab />}

                    {tab === "batch" && <BatchTab />}

                    {tab === "movement" && <MovementTab />}

                    {tab === "opname" && <OpnameTab />}

                    {tab === "supplier" && <SupplierTab />}
                </div>
            </div>
        </DashboardLayout>
    );
}

/*
|--------------------------------------------------------------------------
| STOCK
|--------------------------------------------------------------------------
*/

function StockTab() {
    const [rows, setRows] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [message, setMessage] = useState("");

    const load = async () => {
        try {
            setLoading(true);

            const response = await inventoryService.getStocks({
                search,
                per_page: 100,
            });

            setRows(response?.data ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(load, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const updateMinimum = async (medicine) => {
        const input = window.prompt(
            `Minimum stock ${medicine.name}:`,
            medicine.minimum_stock ?? 0,
        );

        if (input === null) {
            return;
        }

        const value = Number(input);

        if (Number.isNaN(value) || value < 0) {
            return;
        }

        await inventoryService.updateMinimumStock(medicine.id, value);

        setMessage("Minimum stock berhasil diperbarui.");

        await load();
    };

    return (
        <Card
            title="Stok Obat"
            subtitle="Monitoring stock tersedia dan batas minimum."
        >
            {message && <Success text={message} />}

            <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari obat..."
                className="mb-[14px] h-[42px] w-full max-w-[360px] rounded-[9px] border border-[#e5e5e5] px-[12px] text-[13px] outline-none focus:border-[#7EBDEC]"
            />

            <Table>
                <thead>
                    <tr>
                        <Th>Kode</Th>
                        <Th>Obat</Th>
                        <Th>Stock</Th>
                        <Th>Harga Jual</Th>
                        <Th>Minimum</Th>
                        <Th>Status</Th>
                        <Th>Aksi</Th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <Empty colSpan={7} text="Memuat stok..." />
                    ) : rows.length === 0 ? (
                        <Empty colSpan={7} text="Data stok belum tersedia." />
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#f1f1f1]"
                            >
                                {/* KODE */}
                                <Td>{row.code}</Td>

                                {/* OBAT */}
                                <Td>
                                    <span className="font-medium text-[#212121]">
                                        {row.name}
                                    </span>

                                    {row.generic_name && (
                                        <p className="mt-[2px] text-[11px] text-[#999999]">
                                            {row.generic_name}
                                        </p>
                                    )}
                                </Td>

                                {/* STOCK */}
                                <Td>
                                    {formatStock(row.usable_stock)}{" "}
                                    {row.unit ?? ""}
                                </Td>

                                {/* HARGA JUAL */}
                                <Td>
                                    {row.current_selling_price !== null &&
                                    row.current_selling_price !== undefined ? (
                                        <span className="font-medium text-[#212121]">
                                            {formatPrice(
                                                row.current_selling_price,
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-[#B4B4B4]">
                                            -
                                        </span>
                                    )}
                                </Td>

                                {/* MINIMUM */}
                                <Td>
                                    {formatStock(row.minimum_stock)}{" "}
                                    {row.unit ?? ""}
                                </Td>

                                {/* STATUS */}
                                <Td>
                                    <span
                                        className={`
                                rounded-full
                                px-[9px]
                                py-[4px]
                                text-[11px]
                                font-medium
                                ${
                                    row.is_low_stock
                                        ? "bg-red-50 text-red-500"
                                        : "bg-emerald-50 text-emerald-600"
                                }
                            `}
                                    >
                                        {row.is_low_stock ? "Minimum" : "Aman"}
                                    </span>
                                </Td>

                                {/* AKSI */}
                                <Td>
                                    <button
                                        type="button"
                                        onClick={() => updateMinimum(row)}
                                        className="text-[12px] font-medium text-[#047AF7]"
                                    >
                                        Atur Minimum
                                    </button>
                                </Td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </Card>
    );
}

/*
|--------------------------------------------------------------------------
| BATCH
|--------------------------------------------------------------------------
*/

function BatchTab() {
    const [rows, setRows] = useState([]);

    const [medicines, setMedicines] = useState([]);

    const [suppliers, setSuppliers] = useState([]);

    const [filter, setFilter] = useState("");

    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        medicine_id: "",
        supplier_id: "",
        batch_number: "",
        expired_at: "",
        initial_stock: "",
        purchase_price: "",
        selling_price: "",
    });

    const load = async () => {
        const [batchResponse, medicineResponse, supplierResponse] =
            await Promise.all([
                inventoryService.getBatches({
                    per_page: 100,
                    ...(filter
                        ? {
                              status: filter,
                          }
                        : {}),
                }),

                inventoryService.getMedicines(),

                inventoryService.getSuppliers({
                    per_page: 100,
                }),
            ]);

        setRows(batchResponse?.data ?? []);

        setMedicines(medicineResponse?.data ?? []);

        setSuppliers(supplierResponse?.data ?? []);
    };

    useEffect(() => {
        load();
    }, [filter]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();

        await inventoryService.createBatch({
            medicine_id: Number(form.medicine_id),

            supplier_id: form.supplier_id ? Number(form.supplier_id) : null,

            batch_number: form.batch_number,

            expired_at: form.expired_at || null,

            initial_stock: Number(form.initial_stock),

            purchase_price: form.purchase_price
                ? Number(form.purchase_price)
                : null,

            selling_price: form.selling_price
                ? Number(form.selling_price)
                : null,
        });

        setForm({
            medicine_id: "",
            supplier_id: "",
            batch_number: "",
            expired_at: "",
            initial_stock: "",
            purchase_price: "",
            selling_price: "",
        });

        setMessage("Batch obat berhasil ditambahkan.");

        await load();
    };

    const receiveStock = async (batch) => {
        const input = window.prompt(
            `Tambah stock batch ${batch.batch_number}:`,
        );

        if (!input) {
            return;
        }

        const quantity = Number(input);

        if (Number.isNaN(quantity) || quantity <= 0) {
            return;
        }

        await inventoryService.receiveBatch(batch.id, {
            quantity,
            notes: "Penerimaan stock melalui MEDIVA.",
        });

        setMessage("Stock berhasil ditambahkan.");

        await load();
    };

    return (
        <div className="space-y-[18px]">
            <Card title="Tambah Batch" subtitle="Penerimaan batch obat baru.">
                {message && <Success text={message} />}

                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-[12px] md:grid-cols-2 xl:grid-cols-4"
                >
                    <Select
                        name="medicine_id"
                        value={form.medicine_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Pilih Obat</option>

                        {medicines.map((medicine) => (
                            <option key={medicine.id} value={medicine.id}>
                                {medicine.name}
                            </option>
                        ))}
                    </Select>

                    <Select
                        name="supplier_id"
                        value={form.supplier_id}
                        onChange={handleChange}
                    >
                        <option value="">Pilih Supplier</option>

                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </Select>

                    <Input
                        name="batch_number"
                        value={form.batch_number}
                        onChange={handleChange}
                        placeholder="Nomor Batch"
                        required
                    />

                    <Input
                        type="date"
                        name="expired_at"
                        value={form.expired_at}
                        onChange={handleChange}
                    />

                    <Input
                        type="number"
                        name="initial_stock"
                        value={form.initial_stock}
                        onChange={handleChange}
                        placeholder="Stock Awal"
                        required
                    />

                    <Input
                        type="number"
                        name="purchase_price"
                        value={form.purchase_price}
                        onChange={handleChange}
                        placeholder="Harga Beli"
                    />

                    <Input
                        type="number"
                        name="selling_price"
                        value={form.selling_price}
                        onChange={handleChange}
                        placeholder="Harga Jual"
                    />

                    <button
                        type="submit"
                        className="inline-flex h-[42px] items-center justify-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Tambah Batch
                    </button>
                </form>
            </Card>

            <Card
                title="Batch & Expired Date"
                subtitle="Monitoring batch dan masa berlaku obat."
            >
                <div className="mb-[14px] flex flex-wrap gap-[8px]">
                    {[
                        ["", "Semua"],
                        ["near_expiry", "Hampir Expired"],
                        ["expired", "Expired"],
                    ].map(([value, label]) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setFilter(value)}
                            className={`
                                    rounded-[8px]
                                    px-[11px]
                                    py-[7px]
                                    text-[12px]
                                    ${
                                        filter === value
                                            ? "bg-[#047AF7] text-white"
                                            : "border border-[#e5e5e5] text-[#626262]"
                                    }
                                `}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <Table>
                    <thead>
                        <tr>
                            <Th>Obat</Th>
                            <Th>Batch</Th>
                            <Th>Expired</Th>
                            <Th>Supplier</Th>
                            <Th>Stock</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 ? (
                            <Empty colSpan={7} text="Batch belum tersedia." />
                        ) : (
                            rows.map((batch) => (
                                <tr
                                    key={batch.id}
                                    className="border-b border-[#f1f1f1]"
                                >
                                    <Td>{batch?.medicine?.name ?? "-"}</Td>

                                    <Td>{batch.batch_number}</Td>

                                    <Td>{batch.expired_at ?? "-"}</Td>

                                    <Td>{batch?.supplier?.name ?? "-"}</Td>

                                    <Td>{formatStock(batch.stock)}</Td>

                                    <Td>
                                        <BatchStatus batch={batch} />
                                    </Td>

                                    <Td>
                                        <button
                                            type="button"
                                            onClick={() => receiveStock(batch)}
                                            className="inline-flex items-center gap-[6px] text-[12px] font-medium text-[#047AF7]"
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                            Tambah Stock
                                        </button>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| MOVEMENT
|--------------------------------------------------------------------------
*/

function MovementTab() {
    const [rows, setRows] = useState([]);

    const [type, setType] = useState("");

    const load = async () => {
        const response = await inventoryService.getMovements({
            per_page: 100,
            ...(type
                ? {
                      movement_type: type,
                  }
                : {}),
        });

        setRows(response?.data ?? []);
    };

    useEffect(() => {
        load();
    }, [type]);

    return (
        <Card
            title="Stock Movement"
            subtitle="Histori seluruh perubahan stock Farmasi."
        >
            <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mb-[14px] h-[40px] rounded-[8px] border border-[#e5e5e5] px-[11px] text-[12px]"
            >
                <option value="">Semua Movement</option>

                <option value="receive">Receive</option>

                <option value="dispense">Dispense</option>

                <option value="opname">Opname</option>

                <option value="adjustment">Adjustment</option>

                <option value="return">Return</option>
            </select>

            <Table>
                <thead>
                    <tr>
                        <Th>Waktu</Th>
                        <Th>Obat</Th>
                        <Th>Batch</Th>
                        <Th>Tipe</Th>
                        <Th>Perubahan</Th>
                        <Th>Sebelum</Th>
                        <Th>Sesudah</Th>
                    </tr>
                </thead>

                <tbody>
                    {rows.length === 0 ? (
                        <Empty colSpan={7} text="Belum ada stock movement." />
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#f1f1f1]"
                            >
                                <Td>{formatDateTime(row.created_at)}</Td>

                                <Td>{row?.medicine?.name ?? "-"}</Td>

                                <Td>{row?.batch?.batch_number ?? "-"}</Td>

                                <Td>{row.movement_type}</Td>

                                <Td>
                                    <span
                                        className={
                                            Number(row.quantity_change) < 0
                                                ? "font-semibold text-red-500"
                                                : "font-semibold text-emerald-600"
                                        }
                                    >
                                        {Number(row.quantity_change) > 0
                                            ? "+"
                                            : ""}
                                        {formatStock(row.quantity_change)}
                                    </span>
                                </Td>

                                <Td>{formatStock(row.stock_before)}</Td>

                                <Td>{formatStock(row.stock_after)}</Td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </Card>
    );
}

/*
|--------------------------------------------------------------------------
| STOCK OPNAME
|--------------------------------------------------------------------------
*/

function OpnameTab() {
    const [batches, setBatches] = useState([]);

    const [selectedBatchId, setSelectedBatchId] = useState("");

    const [physicalStock, setPhysicalStock] = useState("");

    const [items, setItems] = useState([]);

    const [notes, setNotes] = useState("");

    const [message, setMessage] = useState("");

    useEffect(() => {
        inventoryService
            .getBatches({
                per_page: 100,
            })
            .then((response) => setBatches(response?.data ?? []));
    }, []);

    const selectableBatches = useMemo(
        () =>
            batches.filter(
                (batch) =>
                    !items.some(
                        (item) => Number(item.batch_id) === Number(batch.id),
                    ),
            ),
        [batches, items],
    );

    const addItem = () => {
        const batch = batches.find(
            (item) => Number(item.id) === Number(selectedBatchId),
        );

        if (!batch || physicalStock === "") {
            return;
        }

        setItems((previous) => [
            ...previous,
            {
                batch_id: batch.id,

                batch,

                physical_stock: Number(physicalStock),
            },
        ]);

        setSelectedBatchId("");

        setPhysicalStock("");
    };

    const removeItem = (batchId) => {
        setItems((previous) =>
            previous.filter(
                (item) => Number(item.batch_id) !== Number(batchId),
            ),
        );
    };

    const submit = async () => {
        if (items.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Simpan stock opname? Stock sistem akan disesuaikan dengan stock fisik.",
        );

        if (!confirmed) {
            return;
        }

        await inventoryService.stockOpname({
            notes: notes.trim() || null,

            items: items.map((item) => ({
                batch_id: Number(item.batch_id),

                physical_stock: Number(item.physical_stock),
            })),
        });

        setItems([]);
        setNotes("");

        setMessage("Stock opname berhasil disimpan.");

        const response = await inventoryService.getBatches({
            per_page: 100,
        });

        setBatches(response?.data ?? []);
    };

    return (
        <Card
            title="Stock Opname"
            subtitle="Bandingkan stock sistem dengan stock fisik."
        >
            {message && <Success text={message} />}

            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-[1fr_180px_auto]">
                <select
                    value={selectedBatchId}
                    onChange={(event) => setSelectedBatchId(event.target.value)}
                    className="h-[42px] rounded-[9px] border border-[#e5e5e5] px-[12px] text-[13px]"
                >
                    <option value="">Pilih Batch</option>

                    {selectableBatches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                            {batch?.medicine?.name ?? "-"} —{" "}
                            {batch.batch_number} — System {batch.stock}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={physicalStock}
                    onChange={(event) => setPhysicalStock(event.target.value)}
                    placeholder="Stock fisik"
                    className="h-[42px] rounded-[9px] border border-[#e5e5e5] px-[12px] text-[13px]"
                />

                <button
                    type="button"
                    onClick={addItem}
                    className="h-[42px] rounded-[9px] border border-[#C2E1F4] px-[14px] text-[13px] font-medium text-[#047AF7]"
                >
                    Tambah
                </button>
            </div>

            {items.length > 0 && (
                <div className="mt-[16px] space-y-[8px]">
                    {items.map((item) => {
                        const difference =
                            Number(item.physical_stock) -
                            Number(item.batch?.stock ?? 0);

                        return (
                            <div
                                key={item.batch_id}
                                className="flex flex-wrap items-center justify-between gap-[10px] rounded-[9px] border border-[#eeeeee] bg-[#fafbfc] px-[12px] py-[10px]"
                            >
                                <div>
                                    <p className="text-[13px] font-semibold text-[#212121]">
                                        {item.batch?.medicine?.name ?? "-"}
                                    </p>

                                    <p className="mt-[2px] text-[11px] text-[#626262]">
                                        • System {formatStock(item.batch.stock)}
                                        • Fisik{" "}
                                        {formatStock(item.physical_stock)}•
                                        Selisih {formatStock(difference)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeItem(item.batch_id)}
                                    className="text-red-500"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Catatan stock opname..."
                className="mt-[15px] w-full resize-none rounded-[9px] border border-[#e5e5e5] px-[12px] py-[10px] text-[13px] outline-none"
            />

            <button
                type="button"
                onClick={submit}
                disabled={items.length === 0}
                className="mt-[12px] inline-flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white disabled:opacity-50"
            >
                <FontAwesomeIcon icon={faClipboardCheck} />
                Simpan Stock Opname
            </button>
        </Card>
    );
}

/*
|--------------------------------------------------------------------------
| SUPPLIER
|--------------------------------------------------------------------------
*/

function SupplierTab() {
    const emptyForm = {
        code: "",
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        is_active: true,
    };

    const [rows, setRows] = useState([]);

    const [form, setForm] = useState(emptyForm);

    const [editingId, setEditingId] = useState(null);

    const [message, setMessage] = useState("");

    const load = async () => {
        const response = await inventoryService.getSuppliers({
            per_page: 100,
        });

        setRows(response?.data ?? []);
    };

    useEffect(() => {
        load();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();

        if (editingId) {
            await inventoryService.updateSupplier(editingId, form);

            setMessage("Supplier berhasil diperbarui.");
        } else {
            await inventoryService.createSupplier(form);

            setMessage("Supplier berhasil ditambahkan.");
        }

        setForm(emptyForm);

        setEditingId(null);

        await load();
    };

    const edit = (supplier) => {
        setEditingId(supplier.id);

        setForm({
            code: supplier.code ?? "",

            name: supplier.name ?? "",

            contact_person: supplier.contact_person ?? "",

            phone: supplier.phone ?? "",

            email: supplier.email ?? "",

            address: supplier.address ?? "",

            is_active: Boolean(supplier.is_active),
        });
    };

    const remove = async (supplier) => {
        const confirmed = window.confirm(`Hapus supplier ${supplier.name}?`);

        if (!confirmed) {
            return;
        }

        await inventoryService.deleteSupplier(supplier.id);

        setMessage("Supplier berhasil dihapus.");

        await load();
    };

    return (
        <div className="space-y-[18px]">
            <Card title={editingId ? "Edit Supplier" : "Tambah Supplier"}>
                {message && <Success text={message} />}

                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-[12px] md:grid-cols-2"
                >
                    <Input
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        placeholder="Kode Supplier"
                        required
                    />

                    <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nama Supplier"
                        required
                    />

                    <Input
                        name="contact_person"
                        value={form.contact_person}
                        onChange={handleChange}
                        placeholder="Contact Person"
                    />

                    <Input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Telepon"
                    />

                    <Input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                    />

                    <Input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Alamat"
                    />

                    <div className="flex flex-wrap gap-[9px] md:col-span-2">
                        <button
                            type="submit"
                            className="inline-flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white"
                        >
                            <FontAwesomeIcon
                                icon={editingId ? faPen : faPlus}
                            />

                            {editingId ? "Simpan Perubahan" : "Tambah Supplier"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);

                                    setForm(emptyForm);
                                }}
                                className="h-[40px] rounded-[9px] border border-[#e5e5e5] px-[15px] text-[13px] text-[#626262]"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </Card>

            <Card title="Daftar Supplier">
                <Table>
                    <thead>
                        <tr>
                            <Th>Kode</Th>
                            <Th>Supplier</Th>
                            <Th>Kontak</Th>
                            <Th>Telepon</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 ? (
                            <Empty
                                colSpan={6}
                                text="Supplier belum tersedia."
                            />
                        ) : (
                            rows.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className="border-b border-[#f1f1f1]"
                                >
                                    <Td>{supplier.code}</Td>

                                    <Td>{supplier.name}</Td>

                                    <Td>{supplier.contact_person ?? "-"}</Td>

                                    <Td>{supplier.phone ?? "-"}</Td>

                                    <Td>
                                        {supplier.is_active
                                            ? "Aktif"
                                            : "Nonaktif"}
                                    </Td>

                                    <Td>
                                        <div className="flex gap-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => edit(supplier)}
                                                className="text-[#047AF7]"
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => remove(supplier)}
                                                className="text-red-500"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrash}
                                                />
                                            </button>
                                        </div>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SHARED COMPONENTS
|--------------------------------------------------------------------------
*/

function Card({ title, subtitle, children }) {
    return (
        <section className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
            <div className="border-b border-[#eeeeee] px-[20px] py-[16px]">
                <h2 className="text-[16px] font-semibold text-[#212121]">
                    {title}
                </h2>

                {subtitle && (
                    <p className="mt-[3px] text-[12px] text-[#626262]">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="p-[20px]">{children}</div>
        </section>
    );
}

function Table({ children }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">{children}</table>
        </div>
    );
}

function Th({ children }) {
    return (
        <th className="whitespace-nowrap bg-[#fafbfc] px-[12px] py-[11px] text-left text-[12px] font-semibold text-[#626262]">
            {children}
        </th>
    );
}

function Td({ children }) {
    return (
        <td className="whitespace-nowrap px-[12px] py-[12px] text-[13px] text-[#626262]">
            {children}
        </td>
    );
}

function Empty({ colSpan, text }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="py-[30px] text-center text-[12px] text-[#B4B4B4]"
            >
                {text}
            </td>
        </tr>
    );
}

function Input({ type = "text", ...props }) {
    return (
        <input
            type={type}
            {...props}
            className="h-[42px] rounded-[9px] border border-[#e5e5e5] bg-white px-[12px] text-[13px] text-[#212121] outline-none focus:border-[#7EBDEC]"
        />
    );
}

function Select(props) {
    return (
        <select
            {...props}
            className="h-[42px] rounded-[9px] border border-[#e5e5e5] bg-white px-[12px] text-[13px] text-[#212121] outline-none focus:border-[#7EBDEC]"
        />
    );
}

function Success({ text }) {
    return (
        <div className="mb-[14px] rounded-[9px] border border-emerald-100 bg-emerald-50 px-[12px] py-[10px] text-[13px] text-emerald-700">
            {text}
        </div>
    );
}

function BatchStatus({ batch }) {
    if (batch.is_expired) {
        return (
            <span className="rounded-full bg-red-50 px-[8px] py-[4px] text-[11px] font-medium text-red-500">
                Expired
            </span>
        );
    }

    if (batch.days_to_expiry !== null && Number(batch.days_to_expiry) <= 90) {
        return (
            <span className="rounded-full bg-amber-50 px-[8px] py-[4px] text-[11px] font-medium text-amber-600">
                Hampir Expired
            </span>
        );
    }

    return (
        <span className="rounded-full bg-emerald-50 px-[8px] py-[4px] text-[11px] font-medium text-emerald-600">
            Aman
        </span>
    );
}

function formatStock(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return 0;
    }

    return Math.round(number).toLocaleString("id-ID");
}

function formatPrice(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return "Rp 0,00";
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}
