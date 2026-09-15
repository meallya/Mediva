import React, { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowUp,
    faBoxesStacked,
    faBuilding,
    faChartSimple,
    faClipboardCheck,
    faClockRotateLeft,
    faLayerGroup,
    faPen,
    faPlus,
    faRotate,
    faWarehouse,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import generalInventoryService from "../services/generalInventoryService";

const tabs = [
    { id: "dashboard", label: "Dashboard", icon: faChartSimple },
    { id: "items", label: "Item Master", icon: faBoxesStacked },
    { id: "master", label: "Kategori & Satuan", icon: faLayerGroup },
    { id: "warehouse", label: "Gudang", icon: faWarehouse },
    { id: "stock", label: "Stok", icon: faBuilding },
    { id: "movement", label: "Stock Movement", icon: faClockRotateLeft },
    { id: "request", label: "Permintaan Unit", icon: faRotate },
    { id: "opname", label: "Stock Opname", icon: faClipboardCheck },
];

export default function GeneralInventoryPage() {
    const [tab, setTab] = useState("dashboard");
    const [options, setOptions] = useState(emptyOptions());
    const [optionsLoading, setOptionsLoading] = useState(true);

    const loadOptions = async () => {
        try {
            setOptionsLoading(true);
            const response = await generalInventoryService.getOptions();
            setOptions(response?.data ?? emptyOptions());
        } finally {
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
                <div>
                    <h1 className="text-[24px] font-semibold text-[#212121]">
                        General Inventory
                    </h1>
                    <p className="mt-[5px] text-[12px] text-[#626262]">
                        Kelola inventaris umum non-obat untuk ATK, IT, MFK,
                        housekeeping, consumable alkes, spare part, dan kebutuhan
                        operasional rumah sakit.
                    </p>
                </div>

                <div className="mt-[22px] flex flex-wrap gap-[8px]">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={`inline-flex h-[40px] items-center gap-[7px] rounded-[9px] px-[14px] text-[13px] font-medium transition ${
                                tab === item.id
                                    ? "bg-[#047AF7] text-white"
                                    : "border border-[#e5e5e5] bg-white text-[#626262] hover:bg-[#fafbfc]"
                            }`}
                        >
                            <FontAwesomeIcon icon={item.icon} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="mt-[18px]">
                    {tab === "dashboard" && <DashboardTab />}
                    {tab === "items" && (
                        <ItemsTab
                            options={options}
                            optionsLoading={optionsLoading}
                            refreshOptions={loadOptions}
                        />
                    )}
                    {tab === "master" && (
                        <MasterTab refreshOptions={loadOptions} />
                    )}
                    {tab === "warehouse" && (
                        <WarehouseTab
                            options={options}
                            refreshOptions={loadOptions}
                        />
                    )}
                    {tab === "stock" && (
                        <StockTab
                            options={options}
                            refreshOptions={loadOptions}
                        />
                    )}
                    {tab === "movement" && (
                        <MovementTab options={options} />
                    )}
                    {tab === "request" && (
                        <RequestTab
                            options={options}
                            refreshOptions={loadOptions}
                        />
                    )}
                    {tab === "opname" && (
                        <OpnameTab options={options} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function DashboardTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await generalInventoryService.getDashboard();
            setData(response?.data ?? null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const summary = data?.summary ?? {};

    return (
        <div className="space-y-[18px]">
            {error && <ErrorBox text={error} />}

            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Item Aktif" value={summary.active_items ?? 0} />
                <SummaryCard
                    label="Gudang Aktif"
                    value={summary.active_warehouses ?? 0}
                />
                <SummaryCard
                    label="Stok Minimum"
                    value={summary.low_stock_count ?? 0}
                />
                <SummaryCard
                    label="Permintaan Menunggu"
                    value={summary.pending_requests ?? 0}
                />
            </div>

            <Card
                title="Aktivitas Stok Terbaru"
                subtitle="Perubahan stok General Inventory paling baru."
            >
                <Table>
                    <thead>
                        <tr>
                            <Th>Waktu</Th>
                            <Th>Barang</Th>
                            <Th>Gudang</Th>
                            <Th>Tipe</Th>
                            <Th>Perubahan</Th>
                            <Th>Tujuan</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <Empty colSpan={6} text="Memuat dashboard..." />
                        ) : (data?.recent_movements ?? []).length === 0 ? (
                            <Empty colSpan={6} text="Belum ada aktivitas stok." />
                        ) : (
                            data.recent_movements.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-[#f1f1f1]"
                                >
                                    <Td>{formatDateTime(row.created_at)}</Td>
                                    <Td>{row?.item?.name ?? "-"}</Td>
                                    <Td>{row?.warehouse?.name ?? "-"}</Td>
                                    <Td>{movementLabel(row.movement_type)}</Td>
                                    <Td>
                                        <QuantityChange value={row.quantity_change} />
                                    </Td>
                                    <Td>{row?.destination_unit?.name ?? "-"}</Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

function ItemsTab({ options, optionsLoading, refreshOptions }) {
    const emptyForm = {
        code: "",
        name: "",
        description: "",
        category_id: "",
        uom_id: "",
        default_supplier_id: "",
        minimum_stock: "0",
        is_active: true,
    };

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [categoryId, setCategoryId] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await generalInventoryService.getItems({
                search,
                status,
                category_id: categoryId || undefined,
                per_page: 10,
                page,
            });
            setRows(response?.data ?? []);
            setMeta({
                current_page: response?.current_page ?? 1,
                last_page: response?.last_page ?? 1,
            });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [search, status, categoryId, page]);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const payload = {
            ...form,
            category_id: form.category_id ? Number(form.category_id) : null,
            uom_id: Number(form.uom_id),
            default_supplier_id: form.default_supplier_id
                ? Number(form.default_supplier_id)
                : null,
            minimum_stock: Number(form.minimum_stock || 0),
        };

        try {
            if (editingId) {
                await generalInventoryService.updateItem(editingId, payload);
                setMessage("Barang inventaris berhasil diperbarui.");
            } else {
                await generalInventoryService.createItem(payload);
                setMessage("Barang inventaris berhasil ditambahkan.");
            }

            setForm(emptyForm);
            setEditingId(null);
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const edit = (row) => {
        setEditingId(row.id);
        setForm({
            code: row.code ?? "",
            name: row.name ?? "",
            description: row.description ?? "",
            category_id: row.category_id ? String(row.category_id) : "",
            uom_id: row.uom_id ? String(row.uom_id) : "",
            default_supplier_id: row.default_supplier_id
                ? String(row.default_supplier_id)
                : "",
            minimum_stock: String(formatNumberInput(row.minimum_stock)),
            is_active: Boolean(row.is_active),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggle = async (row) => {
        try {
            await generalInventoryService.updateItemStatus(
                row.id,
                !row.is_active,
            );
            setMessage("Status barang berhasil diperbarui.");
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-[18px]">
            <Card
                title={editingId ? "Edit Item Inventory" : "Tambah Item Inventory"}
                subtitle="Master barang non-obat untuk kebutuhan operasional rumah sakit."
            >
                {message && <Success text={message} />}
                {error && <ErrorBox text={error} />}

                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-[12px] md:grid-cols-2 xl:grid-cols-4"
                >
                    <Input
                        value={form.code}
                        onChange={(event) =>
                            setForm({ ...form, code: event.target.value })
                        }
                        placeholder="Kode Barang"
                        required
                    />
                    <Input
                        value={form.name}
                        onChange={(event) =>
                            setForm({ ...form, name: event.target.value })
                        }
                        placeholder="Nama Barang"
                        required
                    />
                    <Select
                        value={form.category_id}
                        onChange={(event) =>
                            setForm({ ...form, category_id: event.target.value })
                        }
                    >
                        <option value="">Pilih Kategori</option>
                        {options.categories.map((row) => (
                            <option key={row.id} value={row.id}>
                                {row.name}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={form.uom_id}
                        onChange={(event) =>
                            setForm({ ...form, uom_id: event.target.value })
                        }
                        required
                        disabled={optionsLoading}
                    >
                        <option value="">Pilih Satuan</option>
                        {options.uoms.map((row) => (
                            <option key={row.id} value={row.id}>
                                {row.name} {row.symbol ? `(${row.symbol})` : ""}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={form.default_supplier_id}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                default_supplier_id: event.target.value,
                            })
                        }
                    >
                        <option value="">Supplier Default</option>
                        {options.suppliers.map((row) => (
                            <option key={row.id} value={row.id}>
                                {row.name}
                            </option>
                        ))}
                    </Select>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.minimum_stock}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                minimum_stock: event.target.value,
                            })
                        }
                        placeholder="Minimum Stock"
                    />
                    <Input
                        value={form.description}
                        onChange={(event) =>
                            setForm({ ...form, description: event.target.value })
                        }
                        placeholder="Keterangan"
                    />
                    <div className="flex gap-[8px]">
                        <button
                            type="submit"
                            className="inline-flex h-[42px] flex-1 items-center justify-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white"
                        >
                            <FontAwesomeIcon icon={editingId ? faPen : faPlus} />
                            {editingId ? "Simpan" : "Tambah"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setForm(emptyForm);
                                }}
                                className="h-[42px] rounded-[9px] border border-[#e5e5e5] px-[14px] text-[13px] text-[#626262]"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </Card>

            <Card title="Daftar Item Inventory" subtitle="Search, filter, dan monitoring stock total.">
                <div className="mb-[14px] grid grid-cols-1 gap-[10px] md:grid-cols-3">
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Cari kode / nama barang..."
                    />
                    <Select
                        value={categoryId}
                        onChange={(event) => {
                            setCategoryId(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Semua Kategori</option>
                        {options.categories.map((row) => (
                            <option key={row.id} value={row.id}>
                                {row.name}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </Select>
                </div>

                <Table>
                    <thead>
                        <tr>
                            <Th>Kode</Th>
                            <Th>Barang</Th>
                            <Th>Kategori</Th>
                            <Th>Satuan</Th>
                            <Th>Stock Total</Th>
                            <Th>Minimum</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <Empty colSpan={8} text="Memuat item inventory..." />
                        ) : rows.length === 0 ? (
                            <Empty colSpan={8} text="Item inventory belum tersedia." />
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1f1f1]">
                                    <Td>{row.code}</Td>
                                    <Td>
                                        <span className="font-medium text-[#212121]">
                                            {row.name}
                                        </span>
                                    </Td>
                                    <Td>{row?.category?.name ?? "-"}</Td>
                                    <Td>{row?.uom?.symbol || row?.uom?.name || "-"}</Td>
                                    <Td>{formatStock(row.total_stock)}</Td>
                                    <Td>{formatStock(row.minimum_stock)}</Td>
                                    <Td>
                                        <StatusBadge active={row.is_active} />
                                    </Td>
                                    <Td>
                                        <div className="flex gap-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => edit(row)}
                                                className="text-[12px] font-medium text-[#047AF7]"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggle(row)}
                                                className="text-[12px] font-medium text-[#626262]"
                                            >
                                                {row.is_active ? "Nonaktifkan" : "Aktifkan"}
                                            </button>
                                        </div>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
                <Pagination meta={meta} onChange={setPage} />
            </Card>
        </div>
    );
}

function MasterTab({ refreshOptions }) {
    return (
        <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">
            <CategoryPanel refreshOptions={refreshOptions} />
            <UomPanel refreshOptions={refreshOptions} />
        </div>
    );
}

function CategoryPanel({ refreshOptions }) {
    const emptyForm = { code: "", name: "", description: "", is_active: true };
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const response = await generalInventoryService.getCategories();
            setRows(response?.data ?? []);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        try {
            if (editingId) {
                await generalInventoryService.updateCategory(editingId, form);
                setMessage("Kategori berhasil diperbarui.");
            } else {
                await generalInventoryService.createCategory(form);
                setMessage("Kategori berhasil ditambahkan.");
            }
            setEditingId(null);
            setForm(emptyForm);
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <Card title="Kategori Barang" subtitle="Contoh: ATK, IT, MFK, Housekeeping, Alkes Consumable.">
            {message && <Success text={message} />}
            {error && <ErrorBox text={error} />}
            <form onSubmit={submit} className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                <Input
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                    placeholder="Kode Kategori"
                    required
                />
                <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Nama Kategori"
                    required
                />
                <Input
                    value={form.description}
                    onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Keterangan"
                />
                <Select
                    value={form.is_active ? "1" : "0"}
                    onChange={(event) =>
                        setForm({ ...form, is_active: event.target.value === "1" })
                    }
                >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </Select>
                <button
                    type="submit"
                    className="h-[42px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white"
                >
                    {editingId ? "Simpan Kategori" : "Tambah Kategori"}
                </button>
            </form>

            <div className="mt-[16px] space-y-[8px]">
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="flex items-center justify-between rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]"
                    >
                        <div>
                            <p className="text-[13px] font-semibold text-[#212121]">
                                {row.code} — {row.name}
                            </p>
                            <p className="mt-[2px] text-[11px] text-[#626262]">
                                {row.is_active ? "Aktif" : "Nonaktif"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(row.id);
                                setForm({
                                    code: row.code ?? "",
                                    name: row.name ?? "",
                                    description: row.description ?? "",
                                    is_active: Boolean(row.is_active),
                                });
                            }}
                            className="text-[#047AF7]"
                        >
                            <FontAwesomeIcon icon={faPen} />
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function UomPanel({ refreshOptions }) {
    const emptyForm = { code: "", name: "", symbol: "", is_active: true };
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const response = await generalInventoryService.getUoms();
            setRows(response?.data ?? []);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        try {
            if (editingId) {
                await generalInventoryService.updateUom(editingId, form);
                setMessage("Satuan berhasil diperbarui.");
            } else {
                await generalInventoryService.createUom(form);
                setMessage("Satuan berhasil ditambahkan.");
            }
            setEditingId(null);
            setForm(emptyForm);
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <Card title="Unit of Measure" subtitle="Satuan barang seperti pcs, box, rim, botol, roll, unit.">
            {message && <Success text={message} />}
            {error && <ErrorBox text={error} />}
            <form onSubmit={submit} className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                <Input
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                    placeholder="Kode Satuan"
                    required
                />
                <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Nama Satuan"
                    required
                />
                <Input
                    value={form.symbol}
                    onChange={(event) => setForm({ ...form, symbol: event.target.value })}
                    placeholder="Simbol (pcs / box / unit)"
                />
                <Select
                    value={form.is_active ? "1" : "0"}
                    onChange={(event) =>
                        setForm({ ...form, is_active: event.target.value === "1" })
                    }
                >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </Select>
                <button
                    type="submit"
                    className="h-[42px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white"
                >
                    {editingId ? "Simpan Satuan" : "Tambah Satuan"}
                </button>
            </form>

            <div className="mt-[16px] space-y-[8px]">
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="flex items-center justify-between rounded-[9px] border border-[#eeeeee] px-[12px] py-[10px]"
                    >
                        <div>
                            <p className="text-[13px] font-semibold text-[#212121]">
                                {row.code} — {row.name}
                            </p>
                            <p className="mt-[2px] text-[11px] text-[#626262]">
                                {row.symbol || "Tanpa simbol"} • {row.is_active ? "Aktif" : "Nonaktif"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(row.id);
                                setForm({
                                    code: row.code ?? "",
                                    name: row.name ?? "",
                                    symbol: row.symbol ?? "",
                                    is_active: Boolean(row.is_active),
                                });
                            }}
                            className="text-[#047AF7]"
                        >
                            <FontAwesomeIcon icon={faPen} />
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function WarehouseTab({ options, refreshOptions }) {
    const emptyForm = {
        code: "",
        name: "",
        unit_id: "",
        location: "",
        is_active: true,
    };
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const response = await generalInventoryService.getWarehouses();
            setRows(response?.data ?? []);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        const payload = {
            ...form,
            unit_id: form.unit_id ? Number(form.unit_id) : null,
        };
        try {
            if (editingId) {
                await generalInventoryService.updateWarehouse(editingId, payload);
                setMessage("Gudang berhasil diperbarui.");
            } else {
                await generalInventoryService.createWarehouse(payload);
                setMessage("Gudang berhasil ditambahkan.");
            }
            setEditingId(null);
            setForm(emptyForm);
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-[18px]">
            <Card title={editingId ? "Edit Gudang" : "Tambah Gudang"}>
                {message && <Success text={message} />}
                {error && <ErrorBox text={error} />}
                <form onSubmit={submit} className="grid grid-cols-1 gap-[12px] md:grid-cols-2 xl:grid-cols-4">
                    <Input
                        value={form.code}
                        onChange={(event) => setForm({ ...form, code: event.target.value })}
                        placeholder="Kode Gudang"
                        required
                    />
                    <Input
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Nama Gudang"
                        required
                    />
                    <Select
                        value={form.unit_id}
                        onChange={(event) => setForm({ ...form, unit_id: event.target.value })}
                    >
                        <option value="">Unit Pengelola (opsional)</option>
                        {options.units.map((row) => (
                            <option key={row.id} value={row.id}>
                                {row.name}
                            </option>
                        ))}
                    </Select>
                    <Input
                        value={form.location}
                        onChange={(event) => setForm({ ...form, location: event.target.value })}
                        placeholder="Lokasi Gudang"
                    />
                    <Select
                        value={form.is_active ? "1" : "0"}
                        onChange={(event) =>
                            setForm({ ...form, is_active: event.target.value === "1" })
                        }
                    >
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </Select>
                    <div className="flex gap-[8px] md:col-span-2 xl:col-span-4">
                        <button
                            type="submit"
                            className="h-[40px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white"
                        >
                            {editingId ? "Simpan Perubahan" : "Tambah Gudang"}
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

            <Card title="Daftar Gudang">
                <Table>
                    <thead>
                        <tr>
                            <Th>Kode</Th>
                            <Th>Gudang</Th>
                            <Th>Unit Pengelola</Th>
                            <Th>Lokasi</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <Empty colSpan={6} text="Gudang belum tersedia." />
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1f1f1]">
                                    <Td>{row.code}</Td>
                                    <Td>{row.name}</Td>
                                    <Td>{row?.unit?.name ?? "-"}</Td>
                                    <Td>{row.location ?? "-"}</Td>
                                    <Td><StatusBadge active={row.is_active} /></Td>
                                    <Td>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingId(row.id);
                                                setForm({
                                                    code: row.code ?? "",
                                                    name: row.name ?? "",
                                                    unit_id: row.unit_id ? String(row.unit_id) : "",
                                                    location: row.location ?? "",
                                                    is_active: Boolean(row.is_active),
                                                });
                                            }}
                                            className="text-[#047AF7]"
                                        >
                                            <FontAwesomeIcon icon={faPen} />
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

function StockTab({ options, refreshOptions }) {
    const emptyIn = { item_id: "", warehouse_id: "", quantity: "", supplier_id: "", notes: "" };
    const emptyOut = { item_id: "", warehouse_id: "", quantity: "", destination_unit_id: "", notes: "" };
    const [stockInForm, setStockInForm] = useState(emptyIn);
    const [stockOutForm, setStockOutForm] = useState(emptyOut);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const response = await generalInventoryService.getStocks({
                search,
                warehouse_id: warehouseId || undefined,
                per_page: 10,
                page,
            });
            setRows(response?.data ?? []);
            setMeta({
                current_page: response?.current_page ?? 1,
                last_page: response?.last_page ?? 1,
            });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [search, warehouseId, page]);

    const submitIn = async (event) => {
        event.preventDefault();
        setError("");
        try {
            await generalInventoryService.stockIn({
                item_id: Number(stockInForm.item_id),
                warehouse_id: Number(stockInForm.warehouse_id),
                quantity: Number(stockInForm.quantity),
                supplier_id: stockInForm.supplier_id ? Number(stockInForm.supplier_id) : null,
                notes: stockInForm.notes || null,
            });
            setStockInForm(emptyIn);
            setMessage("Barang masuk berhasil disimpan.");
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const submitOut = async (event) => {
        event.preventDefault();
        setError("");
        try {
            await generalInventoryService.stockOut({
                item_id: Number(stockOutForm.item_id),
                warehouse_id: Number(stockOutForm.warehouse_id),
                quantity: Number(stockOutForm.quantity),
                destination_unit_id: stockOutForm.destination_unit_id
                    ? Number(stockOutForm.destination_unit_id)
                    : null,
                notes: stockOutForm.notes || null,
            });
            setStockOutForm(emptyOut);
            setMessage("Barang keluar berhasil disimpan.");
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-[18px]">
            {message && <Success text={message} />}
            {error && <ErrorBox text={error} />}

            <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                <Card title="Barang Masuk" subtitle="Tambah stock ke gudang dari supplier.">
                    <form onSubmit={submitIn} className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                        <OptionSelect
                            value={stockInForm.item_id}
                            onChange={(value) => setStockInForm({ ...stockInForm, item_id: value })}
                            options={options.items}
                            placeholder="Pilih Barang"
                            getLabel={(row) => `${row.code} — ${row.name}`}
                            required
                        />
                        <OptionSelect
                            value={stockInForm.warehouse_id}
                            onChange={(value) => setStockInForm({ ...stockInForm, warehouse_id: value })}
                            options={options.warehouses}
                            placeholder="Pilih Gudang"
                            getLabel={(row) => row.name}
                            required
                        />
                        <Input
                            type="number"
                            min="1"
                            step="1"
                            value={stockInForm.quantity}
                            onChange={(event) => setStockInForm({ ...stockInForm, quantity: event.target.value })}
                            placeholder="Jumlah Masuk"
                            required
                        />
                        <OptionSelect
                            value={stockInForm.supplier_id}
                            onChange={(value) => setStockInForm({ ...stockInForm, supplier_id: value })}
                            options={options.suppliers}
                            placeholder="Supplier (opsional)"
                            getLabel={(row) => row.name}
                        />
                        <Input
                            value={stockInForm.notes}
                            onChange={(event) => setStockInForm({ ...stockInForm, notes: event.target.value })}
                            placeholder="Catatan"
                        />
                        <ActionButton icon={faArrowDown} text="Simpan Barang Masuk" />
                    </form>
                </Card>

                <Card title="Barang Keluar" subtitle="Keluarkan stock langsung ke unit atau kebutuhan operasional.">
                    <form onSubmit={submitOut} className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                        <OptionSelect
                            value={stockOutForm.item_id}
                            onChange={(value) => setStockOutForm({ ...stockOutForm, item_id: value })}
                            options={options.items}
                            placeholder="Pilih Barang"
                            getLabel={(row) => `${row.code} — ${row.name}`}
                            required
                        />
                        <OptionSelect
                            value={stockOutForm.warehouse_id}
                            onChange={(value) => setStockOutForm({ ...stockOutForm, warehouse_id: value })}
                            options={options.warehouses}
                            placeholder="Pilih Gudang"
                            getLabel={(row) => row.name}
                            required
                        />
                        <Input
                            type="number"
                            min="1"
                            step="1"
                            value={stockOutForm.quantity}
                            onChange={(event) => setStockOutForm({ ...stockOutForm, quantity: event.target.value })}
                            placeholder="Jumlah Keluar"
                            required
                        />
                        <OptionSelect
                            value={stockOutForm.destination_unit_id}
                            onChange={(value) => setStockOutForm({ ...stockOutForm, destination_unit_id: value })}
                            options={options.units}
                            placeholder="Unit Tujuan (opsional)"
                            getLabel={(row) => row.name}
                        />
                        <Input
                            value={stockOutForm.notes}
                            onChange={(event) => setStockOutForm({ ...stockOutForm, notes: event.target.value })}
                            placeholder="Catatan"
                        />
                        <ActionButton icon={faArrowUp} text="Simpan Barang Keluar" />
                    </form>
                </Card>
            </div>

            <Card title="Current Stock" subtitle="Stock barang per gudang.">
                <div className="mb-[14px] grid grid-cols-1 gap-[10px] md:grid-cols-2">
                    <Input
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                        placeholder="Cari barang..."
                    />
                    <OptionSelect
                        value={warehouseId}
                        onChange={(value) => { setWarehouseId(value); setPage(1); }}
                        options={options.warehouses}
                        placeholder="Semua Gudang"
                        getLabel={(row) => row.name}
                    />
                </div>
                <Table>
                    <thead>
                        <tr>
                            <Th>Gudang</Th>
                            <Th>Kode</Th>
                            <Th>Barang</Th>
                            <Th>Stock</Th>
                            <Th>Minimum</Th>
                            <Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <Empty colSpan={6} text="Memuat stock..." />
                        ) : rows.length === 0 ? (
                            <Empty colSpan={6} text="Stock belum tersedia. Lakukan barang masuk terlebih dahulu." />
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1f1f1]">
                                    <Td>{row?.warehouse?.name ?? "-"}</Td>
                                    <Td>{row?.item?.code ?? "-"}</Td>
                                    <Td>{row?.item?.name ?? "-"}</Td>
                                    <Td>{formatStock(row.quantity)} {row?.item?.uom?.symbol ?? ""}</Td>
                                    <Td>{formatStock(row?.item?.minimum_stock)}</Td>
                                    <Td>
                                        <span className={`rounded-full px-[9px] py-[4px] text-[11px] font-medium ${row.is_low_stock ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                                            {row.is_low_stock ? "Minimum" : "Aman"}
                                        </span>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
                <Pagination meta={meta} onChange={setPage} />
            </Card>
        </div>
    );
}

function MovementTab({ options }) {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const response = await generalInventoryService.getMovements({
                search,
                movement_type: type || undefined,
                warehouse_id: warehouseId || undefined,
                per_page: 10,
                page,
            });
            setRows(response?.data ?? []);
            setMeta({ current_page: response?.current_page ?? 1, last_page: response?.last_page ?? 1 });
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [search, type, warehouseId, page]);

    return (
        <Card title="Stock Movement" subtitle="Audit trail seluruh perubahan stock General Inventory.">
            {error && <ErrorBox text={error} />}
            <div className="mb-[14px] grid grid-cols-1 gap-[10px] md:grid-cols-3">
                <Input
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    placeholder="Cari barang..."
                />
                <Select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
                    <option value="">Semua Movement</option>
                    <option value="stock_in">Barang Masuk</option>
                    <option value="stock_out">Barang Keluar</option>
                    <option value="distribution">Distribusi</option>
                    <option value="opname">Opname</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="return">Return</option>
                </Select>
                <OptionSelect
                    value={warehouseId}
                    onChange={(value) => { setWarehouseId(value); setPage(1); }}
                    options={options.warehouses}
                    placeholder="Semua Gudang"
                    getLabel={(row) => row.name}
                />
            </div>
            <Table>
                <thead>
                    <tr>
                        <Th>Waktu</Th>
                        <Th>Barang</Th>
                        <Th>Gudang</Th>
                        <Th>Tipe</Th>
                        <Th>Perubahan</Th>
                        <Th>Sebelum</Th>
                        <Th>Sesudah</Th>
                        <Th>Tujuan / Supplier</Th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <Empty colSpan={8} text="Belum ada stock movement." />
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id} className="border-b border-[#f1f1f1]">
                                <Td>{formatDateTime(row.created_at)}</Td>
                                <Td>{row?.item?.name ?? "-"}</Td>
                                <Td>{row?.warehouse?.name ?? "-"}</Td>
                                <Td>{movementLabel(row.movement_type)}</Td>
                                <Td><QuantityChange value={row.quantity_change} /></Td>
                                <Td>{formatStock(row.stock_before)}</Td>
                                <Td>{formatStock(row.stock_after)}</Td>
                                <Td>{row?.destination_unit?.name || row?.supplier?.name || "-"}</Td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
            <Pagination meta={meta} onChange={setPage} />
        </Card>
    );
}

function RequestTab({ options, refreshOptions }) {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [unitId, setUnitId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [notes, setNotes] = useState("");
    const [itemId, setItemId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [requestItems, setRequestItems] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const response = await generalInventoryService.getRequests({
                search,
                status: status || undefined,
                per_page: 10,
                page,
            });
            setRows(response?.data ?? []);
            setMeta({ current_page: response?.current_page ?? 1, last_page: response?.last_page ?? 1 });
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [search, status, page]);

    const availableItems = useMemo(
        () => options.items.filter((row) => !requestItems.some((item) => Number(item.item_id) === Number(row.id))),
        [options.items, requestItems],
    );

    const addRequestItem = () => {
        const selected = options.items.find((row) => Number(row.id) === Number(itemId));
        const qty = Number(quantity);
        if (!selected || !qty || qty <= 0) return;
        setRequestItems((previous) => [...previous, { item_id: selected.id, item: selected, quantity: qty }]);
        setItemId("");
        setQuantity("");
    };

    const submitRequest = async () => {
        if (!unitId || !warehouseId || requestItems.length === 0) return;
        setError("");
        try {
            await generalInventoryService.createRequest({
                unit_id: Number(unitId),
                warehouse_id: Number(warehouseId),
                notes: notes || null,
                items: requestItems.map((row) => ({ item_id: row.item_id, quantity: row.quantity })),
            });
            setUnitId("");
            setWarehouseId("");
            setNotes("");
            setRequestItems([]);
            setMessage("Permintaan unit berhasil dibuat.");
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const approve = async (row) => {
        if (!window.confirm(`Setujui ${row.request_number} sesuai jumlah permintaan?`)) return;
        try {
            await generalInventoryService.approveRequest(row.id);
            setMessage("Permintaan berhasil disetujui.");
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const reject = async (row) => {
        const reason = window.prompt(`Alasan penolakan ${row.request_number}:`);
        if (!reason?.trim()) return;
        try {
            await generalInventoryService.rejectRequest(row.id, reason.trim());
            setMessage("Permintaan berhasil ditolak.");
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const distribute = async (row) => {
        if (!window.confirm(`Distribusikan seluruh barang approved untuk ${row.request_number}? Stock gudang akan berkurang.`)) return;
        try {
            await generalInventoryService.distributeRequest(row.id);
            setMessage("Barang berhasil didistribusikan.");
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-[18px]">
            <Card title="Buat Permintaan Unit" subtitle="Unit meminta barang dari gudang General Inventory.">
                {message && <Success text={message} />}
                {error && <ErrorBox text={error} />}
                <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                    <OptionSelect value={unitId} onChange={setUnitId} options={options.units} placeholder="Pilih Unit Peminta" getLabel={(row) => row.name} />
                    <OptionSelect value={warehouseId} onChange={setWarehouseId} options={options.warehouses} placeholder="Pilih Gudang Sumber" getLabel={(row) => row.name} />
                </div>
                <div className="mt-[10px] grid grid-cols-1 gap-[10px] md:grid-cols-[1fr_180px_auto]">
                    <OptionSelect value={itemId} onChange={setItemId} options={availableItems} placeholder="Pilih Barang" getLabel={(row) => `${row.code} — ${row.name}`} />
                    <Input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Jumlah" />
                    <button type="button" onClick={addRequestItem} className="h-[42px] rounded-[9px] border border-[#C2E1F4] px-[14px] text-[13px] font-medium text-[#047AF7]">
                        Tambah Barang
                    </button>
                </div>
                {requestItems.length > 0 && (
                    <div className="mt-[12px] space-y-[7px]">
                        {requestItems.map((row) => (
                            <div key={row.item_id} className="flex items-center justify-between rounded-[9px] border border-[#eeeeee] bg-[#fafbfc] px-[12px] py-[10px]">
                                <div>
                                    <p className="text-[13px] font-semibold text-[#212121]">{row.item.name}</p>
                                    <p className="text-[11px] text-[#626262]">Jumlah {formatStock(row.quantity)} {row?.item?.uom?.symbol ?? ""}</p>
                                </div>
                                <button type="button" onClick={() => setRequestItems((previous) => previous.filter((item) => item.item_id !== row.item_id))} className="text-[12px] text-red-500">
                                    Hapus
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Catatan permintaan..." className="mt-[12px] w-full resize-none rounded-[9px] border border-[#e5e5e5] px-[12px] py-[10px] text-[13px] outline-none focus:border-[#7EBDEC]" />
                <button type="button" onClick={submitRequest} disabled={!unitId || !warehouseId || requestItems.length === 0} className="mt-[10px] h-[40px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white disabled:opacity-50">
                    Kirim Permintaan
                </button>
            </Card>

            <Card title="Daftar Permintaan" subtitle="Approval dan distribusi barang ke unit.">
                <div className="mb-[14px] grid grid-cols-1 gap-[10px] md:grid-cols-2">
                    <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nomor / unit..." />
                    <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                        <option value="">Semua Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="distributed">Distributed</option>
                    </Select>
                </div>
                <div className="space-y-[10px]">
                    {rows.length === 0 ? (
                        <p className="py-[24px] text-center text-[12px] text-[#B4B4B4]">Belum ada permintaan unit.</p>
                    ) : rows.map((row) => (
                        <div key={row.id} className="rounded-[12px] border border-[#ececec] p-[14px]">
                            <div className="flex flex-wrap items-start justify-between gap-[10px]">
                                <div>
                                    <p className="text-[13px] font-semibold text-[#212121]">{row.request_number}</p>
                                    <p className="mt-[3px] text-[11px] text-[#626262]">{row?.unit?.name ?? "-"} • {row?.warehouse?.name ?? "-"} • {formatDateTime(row.created_at)}</p>
                                </div>
                                <RequestStatus status={row.status} />
                            </div>
                            <div className="mt-[10px] grid grid-cols-1 gap-[6px] md:grid-cols-2">
                                {(row.items ?? []).map((item) => (
                                    <div key={item.id} className="rounded-[8px] bg-[#fafbfc] px-[10px] py-[8px] text-[12px] text-[#626262]">
                                        <span className="font-medium text-[#212121]">{item?.item?.name ?? "-"}</span>
                                        {" — "}{formatStock(item.requested_quantity)} diminta
                                        {item.approved_quantity !== null && ` • ${formatStock(item.approved_quantity)} disetujui`}
                                        {Number(item.distributed_quantity) > 0 && ` • ${formatStock(item.distributed_quantity)} didistribusi`}
                                    </div>
                                ))}
                            </div>
                            {row.rejection_reason && <p className="mt-[8px] text-[12px] text-red-500">Alasan: {row.rejection_reason}</p>}
                            <div className="mt-[12px] flex flex-wrap gap-[8px]">
                                {row.status === "submitted" && (
                                    <>
                                        <SmallButton onClick={() => approve(row)} text="Approve" primary />
                                        <SmallButton onClick={() => reject(row)} text="Reject" />
                                    </>
                                )}
                                {row.status === "approved" && (
                                    <SmallButton onClick={() => distribute(row)} text="Distribusikan" primary />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <Pagination meta={meta} onChange={setPage} />
            </Card>
        </div>
    );
}

function OpnameTab({ options }) {
    const [warehouseId, setWarehouseId] = useState("");
    const [itemId, setItemId] = useState("");
    const [physicalStock, setPhysicalStock] = useState("");
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const availableItems = useMemo(
        () => options.items.filter((row) => !items.some((item) => Number(item.item_id) === Number(row.id))),
        [options.items, items],
    );

    const add = () => {
        const selected = options.items.find((row) => Number(row.id) === Number(itemId));
        if (!selected || physicalStock === "") return;
        setItems((previous) => [...previous, { item_id: selected.id, item: selected, physical_stock: Number(physicalStock) }]);
        setItemId("");
        setPhysicalStock("");
    };

    const submit = async () => {
        if (!warehouseId || items.length === 0) return;
        if (!window.confirm("Simpan stock opname? Stock sistem akan disesuaikan dengan stock fisik.")) return;
        setError("");
        try {
            await generalInventoryService.stockOpname({
                warehouse_id: Number(warehouseId),
                notes: notes || null,
                items: items.map((row) => ({ item_id: row.item_id, physical_stock: row.physical_stock })),
            });
            setItems([]);
            setNotes("");
            setMessage("Stock opname berhasil disimpan.");
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <Card title="Stock Opname" subtitle="Sesuaikan stock sistem dengan hasil hitung fisik per gudang.">
            {message && <Success text={message} />}
            {error && <ErrorBox text={error} />}
            <OptionSelect value={warehouseId} onChange={setWarehouseId} options={options.warehouses} placeholder="Pilih Gudang" getLabel={(row) => row.name} />
            <div className="mt-[10px] grid grid-cols-1 gap-[10px] md:grid-cols-[1fr_180px_auto]">
                <OptionSelect value={itemId} onChange={setItemId} options={availableItems} placeholder="Pilih Barang" getLabel={(row) => `${row.code} — ${row.name}`} />
                <Input type="number" min="0" step="1" value={physicalStock} onChange={(event) => setPhysicalStock(event.target.value)} placeholder="Stock Fisik" />
                <button type="button" onClick={add} className="h-[42px] rounded-[9px] border border-[#C2E1F4] px-[14px] text-[13px] font-medium text-[#047AF7]">
                    Tambah
                </button>
            </div>
            {items.length > 0 && (
                <div className="mt-[14px] space-y-[8px]">
                    {items.map((row) => (
                        <div key={row.item_id} className="flex items-center justify-between rounded-[9px] border border-[#eeeeee] bg-[#fafbfc] px-[12px] py-[10px]">
                            <div>
                                <p className="text-[13px] font-semibold text-[#212121]">{row.item.name}</p>
                                <p className="text-[11px] text-[#626262]">Stock fisik: {formatStock(row.physical_stock)} {row?.item?.uom?.symbol ?? ""}</p>
                            </div>
                            <button type="button" onClick={() => setItems((previous) => previous.filter((item) => item.item_id !== row.item_id))} className="text-[12px] text-red-500">Hapus</button>
                        </div>
                    ))}
                </div>
            )}
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Catatan stock opname..." className="mt-[12px] w-full resize-none rounded-[9px] border border-[#e5e5e5] px-[12px] py-[10px] text-[13px] outline-none focus:border-[#7EBDEC]" />
            <button type="button" onClick={submit} disabled={!warehouseId || items.length === 0} className="mt-[10px] h-[40px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white disabled:opacity-50">
                Simpan Stock Opname
            </button>
        </Card>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[18px]">
            <p className="text-[12px] text-[#626262]">{label}</p>
            <p className="mt-[7px] text-[24px] font-semibold text-[#212121]">
                {Number(value ?? 0).toLocaleString("id-ID")}
            </p>
        </div>
    );
}

function Card({ title, subtitle, children }) {
    return (
        <section className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
            <div className="border-b border-[#eeeeee] px-[20px] py-[16px]">
                <h2 className="text-[16px] font-semibold text-[#212121]">{title}</h2>
                {subtitle && <p className="mt-[3px] text-[12px] text-[#626262]">{subtitle}</p>}
            </div>
            <div className="p-[20px]">{children}</div>
        </section>
    );
}

function Table({ children }) {
    return <div className="overflow-x-auto"><table className="w-full border-collapse">{children}</table></div>;
}

function Th({ children }) {
    return <th className="whitespace-nowrap bg-[#fafbfc] px-[12px] py-[11px] text-left text-[12px] font-semibold text-[#626262]">{children}</th>;
}

function Td({ children }) {
    return <td className="whitespace-nowrap px-[12px] py-[12px] text-[13px] text-[#626262]">{children}</td>;
}

function Empty({ colSpan, text }) {
    return <tr><td colSpan={colSpan} className="py-[30px] text-center text-[12px] text-[#B4B4B4]">{text}</td></tr>;
}

function Input({ type = "text", ...props }) {
    return <input type={type} {...props} className="h-[42px] w-full rounded-[9px] border border-[#e5e5e5] bg-white px-[12px] text-[13px] text-[#212121] outline-none focus:border-[#7EBDEC] disabled:bg-[#f7f7f7]" />;
}

function Select(props) {
    return <select {...props} className="h-[42px] w-full rounded-[9px] border border-[#e5e5e5] bg-white px-[12px] text-[13px] text-[#212121] outline-none focus:border-[#7EBDEC]" />;
}

function OptionSelect({ value, onChange, options, placeholder, getLabel, required = false }) {
    return (
        <Select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
            <option value="">{placeholder}</option>
            {options.map((row) => <option key={row.id} value={row.id}>{getLabel(row)}</option>)}
        </Select>
    );
}

function ActionButton({ icon, text }) {
    return (
        <button type="submit" className="inline-flex h-[42px] items-center justify-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[14px] text-[13px] font-medium text-white">
            <FontAwesomeIcon icon={icon} />
            {text}
        </button>
    );
}

function SmallButton({ onClick, text, primary = false }) {
    return (
        <button type="button" onClick={onClick} className={`h-[34px] rounded-[8px] px-[12px] text-[12px] font-medium ${primary ? "bg-[#047AF7] text-white" : "border border-[#e5e5e5] text-[#626262]"}`}>
            {text}
        </button>
    );
}

function Success({ text }) {
    return <div className="mb-[14px] rounded-[9px] border border-emerald-100 bg-emerald-50 px-[12px] py-[10px] text-[13px] text-emerald-700">{text}</div>;
}

function ErrorBox({ text }) {
    return <div className="mb-[14px] rounded-[9px] border border-red-100 bg-red-50 px-[12px] py-[10px] text-[13px] text-red-600">{text}</div>;
}

function Pagination({ meta, onChange }) {
    const current = Number(meta?.current_page ?? 1);
    const last = Number(meta?.last_page ?? 1);
    if (last <= 1) return null;
    return (
        <div className="mt-[14px] flex items-center justify-end gap-[8px]">
            <button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)} className="h-[34px] rounded-[8px] border border-[#e5e5e5] px-[12px] text-[12px] text-[#626262] disabled:opacity-40">Sebelumnya</button>
            <span className="text-[12px] text-[#626262]">{current} / {last}</span>
            <button type="button" disabled={current >= last} onClick={() => onChange(current + 1)} className="h-[34px] rounded-[8px] border border-[#e5e5e5] px-[12px] text-[12px] text-[#626262] disabled:opacity-40">Berikutnya</button>
        </div>
    );
}

function StatusBadge({ active }) {
    return <span className={`rounded-full px-[9px] py-[4px] text-[11px] font-medium ${active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{active ? "Aktif" : "Nonaktif"}</span>;
}

function RequestStatus({ status }) {
    const map = {
        submitted: "bg-amber-50 text-amber-600",
        approved: "bg-blue-50 text-[#047AF7]",
        rejected: "bg-red-50 text-red-500",
        distributed: "bg-emerald-50 text-emerald-600",
        cancelled: "bg-slate-100 text-slate-500",
    };
    return <span className={`rounded-full px-[9px] py-[4px] text-[11px] font-medium ${map[status] ?? "bg-slate-100 text-slate-500"}`}>{status ?? "-"}</span>;
}

function QuantityChange({ value }) {
    const number = Number(value ?? 0);
    return <span className={number < 0 ? "font-semibold text-red-500" : "font-semibold text-emerald-600"}>{number > 0 ? "+" : ""}{formatStock(number)}</span>;
}

function movementLabel(value) {
    const labels = {
        stock_in: "Barang Masuk",
        stock_out: "Barang Keluar",
        distribution: "Distribusi",
        opname: "Opname",
        adjustment: "Adjustment",
        return: "Return",
    };
    return labels[value] ?? value ?? "-";
}

function formatStock(value) {
    const number = Number(value ?? 0);
    if (Number.isNaN(number)) return "0";
    return Math.round(number).toLocaleString("id-ID");
}

function formatNumberInput(value) {
    const number = Number(value ?? 0);
    return Number.isNaN(number) ? 0 : Math.round(number);
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function getErrorMessage(error) {
    if (error?.data?.errors) {
        const first = Object.values(error.data.errors).flat()[0];
        if (first) return first;
    }
    return error?.message || "Terjadi kesalahan saat memproses General Inventory.";
}

function emptyOptions() {
    return {
        categories: [],
        uoms: [],
        warehouses: [],
        suppliers: [],
        units: [],
        items: [],
    };
}
