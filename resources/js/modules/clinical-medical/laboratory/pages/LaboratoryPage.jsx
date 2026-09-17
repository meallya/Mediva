import React, { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartSimple,
    faClipboardList,
    faFlask,
    faMicroscope,
    faPlus,
    faRotate,
    faVial,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";
import laboratoryService from "../services/laboratoryService";

const tabs = [
    { id: "dashboard", label: "Dashboard", icon: faChartSimple },
    { id: "orders", label: "Permintaan Pemeriksaan", icon: faClipboardList },
    { id: "process", label: "Sampel & Proses", icon: faVial },
    { id: "results", label: "Hasil Laboratorium", icon: faMicroscope },
    { id: "master", label: "Master Laboratorium", icon: faFlask },
];

export default function LaboratoryPage() {
    const [tab, setTab] = useState("dashboard");
    const [options, setOptions] = useState(emptyOptions());
    const [optionsLoading, setOptionsLoading] = useState(true);

    const loadOptions = async () => {
        try {
            setOptionsLoading(true);
            const response = await laboratoryService.getOptions();
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
                        Laboratorium
                    </h1>
                    <p className="mt-[5px] text-[12px] text-[#626262]">
                        Kelola permintaan pemeriksaan, sampel, proses, hasil,
                        verifikasi, dan master pemeriksaan laboratorium.
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
                    {tab === "orders" && (
                        <OrdersTab
                            options={options}
                            optionsLoading={optionsLoading}
                            refreshOptions={loadOptions}
                        />
                    )}
                    {tab === "process" && <ProcessTab />}
                    {tab === "results" && <ResultsTab />}
                    {tab === "master" && (
                        <MasterTab
                            options={options}
                            refreshOptions={loadOptions}
                        />
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
            const response = await laboratoryService.getDashboard();
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

            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-6">
                <SummaryCard label="Permintaan Hari Ini" value={summary.today_orders ?? 0} />
                <SummaryCard label="Menunggu Sampel" value={summary.waiting_sample ?? 0} />
                <SummaryCard label="Sedang Diproses" value={summary.in_process ?? 0} />
                <SummaryCard
                    label="Menunggu Verifikasi"
                    value={summary.pending_verification ?? 0}
                />
                <SummaryCard
                    label="Selesai Hari Ini"
                    value={summary.completed_today ?? 0}
                />
                <SummaryCard
                    label="Hasil Kritis"
                    value={summary.critical_results ?? 0}
                />
            </div>

            <Card
                title="Permintaan Terbaru"
                subtitle="Aktivitas pemeriksaan laboratorium terbaru."
            >
                <Table>
                    <thead>
                        <tr>
                            <Th>No. Lab</Th>
                            <Th>Pasien</Th>
                            <Th>Dokter</Th>
                            <Th>Unit</Th>
                            <Th>Status</Th>
                            <Th>Waktu</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <Empty colSpan={6} text="Memuat dashboard..." />
                        ) : (data?.recent_orders ?? []).length === 0 ? (
                            <Empty colSpan={6} text="Belum ada permintaan laboratorium." />
                        ) : (
                            data.recent_orders.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1f1f1]">
                                    <Td>{row.lab_number}</Td>
                                    <Td>{row?.patient?.name ?? "-"}</Td>
                                    <Td>{row?.doctor?.employee?.name ?? "-"}</Td>
                                    <Td>{row?.requesting_unit?.name ?? "-"}</Td>
                                    <Td><StatusBadge status={row.status} /></Td>
                                    <Td>{formatDateTime(row.created_at)}</Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}

function OrdersTab({ options, optionsLoading, refreshOptions }) {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        visit_id: "",
        test_type_ids: [],
        clinical_notes: "",
    });

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await laboratoryService.getOrders({
                search,
                status,
                page,
                per_page: 10,
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
    }, [search, status, page]);

    const toggleTest = (id) => {
        setForm((current) => {
            const exists = current.test_type_ids.includes(id);
            return {
                ...current,
                test_type_ids: exists
                    ? current.test_type_ids.filter((item) => item !== id)
                    : [...current.test_type_ids, id],
            };
        });
    };

    const submit = async (isDraft) => {
        setError("");
        setMessage("");

        if (!form.visit_id || form.test_type_ids.length === 0) {
            setError("Pilih kunjungan dan minimal satu pemeriksaan.");
            return;
        }

        try {
            await laboratoryService.createOrder({
                visit_id: Number(form.visit_id),
                test_type_ids: form.test_type_ids,
                clinical_notes: form.clinical_notes || null,
                is_draft: isDraft,
            });
            setMessage(
                isDraft
                    ? "Draf permintaan berhasil disimpan."
                    : "Permintaan laboratorium berhasil diajukan.",
            );
            setForm({ visit_id: "", test_type_ids: [], clinical_notes: "" });
            await Promise.all([load(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const submitDraft = async (row) => {
        try {
            setError("");
            setMessage("");
            await laboratoryService.submitOrder(row.id);
            setMessage("Permintaan berhasil diajukan.");
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const cancel = async (row) => {
        const reason = window.prompt("Alasan pembatalan:");
        if (!reason) return;
        try {
            await laboratoryService.cancelOrder(row.id, reason);
            setMessage("Permintaan berhasil dibatalkan.");
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-[18px]">
            {message && <SuccessBox text={message} />}
            {error && <ErrorBox text={error} />}

            <Card
                title="Buat Permintaan Pemeriksaan"
                subtitle="Pilih kunjungan pasien dan jenis pemeriksaan yang dibutuhkan."
            >
                <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-2">
                    <Field label="Kunjungan Pasien">
                        <Select
                            value={form.visit_id}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    visit_id: event.target.value,
                                }))
                            }
                            disabled={optionsLoading}
                        >
                            <option value="">Pilih kunjungan</option>
                            {(options.visits ?? []).map((visit) => (
                                <option key={visit.id} value={visit.id}>
                                    {visit.visit_number} — {visit?.patient?.name ?? "-"} — {visit?.unit?.name ?? "-"}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Catatan Klinis">
                        <Input
                            value={form.clinical_notes}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    clinical_notes: event.target.value,
                                }))
                            }
                            placeholder="Contoh: demam 3 hari"
                        />
                    </Field>
                </div>

                <div className="mt-[16px]">
                    <p className="text-[11px] font-medium text-[#626262]">
                        Jenis Pemeriksaan
                    </p>
                    <div className="mt-[8px] grid grid-cols-1 gap-[8px] md:grid-cols-2 xl:grid-cols-3">
                        {(options.test_types ?? []).map((test) => {
                            const checked = form.test_type_ids.includes(test.id);
                            return (
                                <label
                                    key={test.id}
                                    className={`cursor-pointer rounded-[10px] border p-[12px] transition ${
                                        checked
                                            ? "border-[#047AF7] bg-[#C2E1F4]/20"
                                            : "border-[#ececec] bg-white"
                                    }`}
                                >
                                    <div className="flex items-start gap-[9px]">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleTest(test.id)}
                                            className="mt-[2px]"
                                        />
                                        <div>
                                            <p className="text-[12px] font-semibold text-[#212121]">
                                                {test.name}
                                            </p>
                                            <p className="mt-[2px] text-[10px] text-[#999999]">
                                                {test.code} · {formatRupiah(test.price)} · {test?.sample_type?.name ?? "Sampel belum diatur"}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-[16px] flex flex-wrap gap-[8px]">
                    <Button onClick={() => submit(true)} variant="secondary">
                        Simpan Draf
                    </Button>
                    <Button onClick={() => submit(false)}>Ajukan Permintaan</Button>
                </div>
            </Card>

            <Card title="Daftar Permintaan" subtitle="Cari dan pantau status permintaan laboratorium.">
                <div className="mb-[14px] grid grid-cols-1 gap-[10px] md:grid-cols-2">
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Cari no. lab, nama pasien, atau no. RM"
                    />
                    <Select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">Semua Status</option>
                        {orderStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </Select>
                </div>

                <Table>
                    <thead>
                        <tr>
                            <Th>No. Lab</Th>
                            <Th>Pasien</Th>
                            <Th>Pemeriksaan</Th>
                            <Th>Status</Th>
                            <Th>Dibuat</Th>
                            <Th>Aksi</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <Empty colSpan={6} text="Memuat permintaan..." />
                        ) : rows.length === 0 ? (
                            <Empty colSpan={6} text="Belum ada permintaan." />
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1f1f1]">
                                    <Td>{row.lab_number}</Td>
                                    <Td>
                                        <div>
                                            <p className="font-medium text-[#212121]">{row?.patient?.name ?? "-"}</p>
                                            <p className="mt-[2px] text-[10px] text-[#999999]">{row?.patient?.medical_record_number ?? "-"}</p>
                                        </div>
                                    </Td>
                                    <Td>{(row.items ?? []).map((item) => item?.test_type?.name).filter(Boolean).join(", ") || "-"}</Td>
                                    <Td><StatusBadge status={row.status} /></Td>
                                    <Td>{formatDateTime(row.created_at)}</Td>
                                    <Td>
                                        <div className="flex flex-wrap gap-[6px]">
                                            {row.status === "draft" && (
                                                <SmallButton onClick={() => submitDraft(row)}>Ajukan</SmallButton>
                                            )}
                                            {!["completed", "cancelled"].includes(row.status) && (
                                                <SmallButton variant="danger" onClick={() => cancel(row)}>Batalkan</SmallButton>
                                            )}
                                        </div>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>

                <Pagination meta={meta} page={page} setPage={setPage} />
            </Card>
        </div>
    );
}

function ProcessTab() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const response = await laboratoryService.getOrders({
                per_page: 100,
            });
            const allowed = ["submitted", "collected", "in_process", "pending_verification"];
            setRows((response?.data ?? []).filter((row) => allowed.includes(row.status)));
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const action = async (callback, successText) => {
        try {
            setError("");
            setMessage("");
            await callback();
            setMessage(successText);
            await load();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const reject = async (specimen) => {
        const reason = window.prompt("Alasan penolakan sampel:");
        if (!reason) return;
        await action(
            () => laboratoryService.rejectSpecimen(specimen.id, reason),
            "Sampel berhasil ditolak.",
        );
    };

    return (
        <div className="space-y-[18px]">
            {message && <SuccessBox text={message} />}
            {error && <ErrorBox text={error} />}

            <Card title="Sampel & Proses Pemeriksaan" subtitle="Kelola pengambilan sampel sampai pemeriksaan siap diinput hasilnya.">
                <Table>
                    <thead>
                        <tr>
                            <Th>No. Lab</Th>
                            <Th>Pasien</Th>
                            <Th>Pemeriksaan</Th>
                            <Th>Sampel</Th>
                            <Th>Status</Th>
                            <Th>Aksi</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <Empty colSpan={6} text="Memuat proses laboratorium..." />
                        ) : rows.length === 0 ? (
                            <Empty colSpan={6} text="Tidak ada proses laboratorium aktif." />
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1f1f1] align-top">
                                    <Td>{row.lab_number}</Td>
                                    <Td>{row?.patient?.name ?? "-"}</Td>
                                    <Td>{(row.items ?? []).map((item) => item?.test_type?.name).filter(Boolean).join(", ") || "-"}</Td>
                                    <Td>
                                        <div className="space-y-[5px]">
                                            {(row.specimens ?? []).length === 0 ? (
                                                <span className="text-[#999999]">Belum ada sampel</span>
                                            ) : (
                                                row.specimens.map((specimen) => (
                                                    <div key={specimen.id} className="rounded-[8px] bg-[#fafbfc] px-[8px] py-[6px]">
                                                        <p className="font-medium text-[#212121]">{specimen.specimen_number}</p>
                                                        <p className="mt-[1px] text-[9px] text-[#999999]">{specimen?.sample_type?.name ?? "-"} · {sampleStatusLabel(specimen.status)}</p>
                                                        {["collected", "received"].includes(specimen.status) && (
                                                            <button type="button" onClick={() => reject(specimen)} className="mt-[4px] text-[9px] font-medium text-red-500">Tolak Sampel</button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Td>
                                    <Td><StatusBadge status={row.status} /></Td>
                                    <Td>
                                        <div className="flex flex-wrap gap-[6px]">
                                            {row.status === "submitted" && (
                                                <SmallButton onClick={() => action(() => laboratoryService.collectSamples(row.id), "Pengambilan sampel berhasil dicatat.")}>Ambil Sampel</SmallButton>
                                            )}
                                            {row.status === "collected" && (row.specimens ?? []).some((item) => item.status === "collected") && (
                                                <SmallButton onClick={() => action(() => laboratoryService.receiveSamples(row.id), "Sampel berhasil diterima.")}>Terima Sampel</SmallButton>
                                            )}
                                            {row.status === "collected" && (row.specimens ?? []).length > 0 && (row.specimens ?? []).filter((item) => item.status !== "rejected").every((item) => item.status === "received") && (
                                                <SmallButton onClick={() => action(() => laboratoryService.startProcessing(row.id), "Pemeriksaan mulai diproses.")}>Mulai Proses</SmallButton>
                                            )}
                                            {row.status === "in_process" && (
                                                <span className="text-[10px] text-[#7AB2B2]">Siap input hasil</span>
                                            )}
                                            {row.status === "pending_verification" && (
                                                <span className="text-[10px] text-[#047AF7]">Menunggu verifikasi</span>
                                            )}
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

function ResultsTab() {
    const [orders, setOrders] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await laboratoryService.getOrders({ per_page: 100 });
            setOrders((response?.data ?? []).filter((row) => ["in_process", "pending_verification", "completed"].includes(row.status)));
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const loadDetail = async (id) => {
        if (!id) {
            setSelected(null);
            return;
        }
        try {
            setError("");
            const response = await laboratoryService.getOrder(id);
            setSelected(response?.data ?? null);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        loadDetail(selectedId);
    }, [selectedId]);

    const refresh = async () => {
        await Promise.all([loadOrders(), loadDetail(selectedId)]);
    };

    const submitVerification = async () => {
        try {
            setError("");
            setMessage("");
            await laboratoryService.submitVerification(selected.id);
            setMessage("Hasil berhasil diajukan untuk verifikasi.");
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const verify = async () => {
        if (!window.confirm("Verifikasi hasil laboratorium ini? Setelah diverifikasi hasil dianggap final.")) return;
        try {
            setError("");
            setMessage("");
            await laboratoryService.verify(selected.id);
            setMessage("Hasil laboratorium berhasil diverifikasi.");
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-[18px]">
            {message && <SuccessBox text={message} />}
            {error && <ErrorBox text={error} />}

            <Card title="Input & Verifikasi Hasil" subtitle="Input hasil sesuai parameter dan nilai rujukan pasien.">
                <Field label="Pilih Permintaan Laboratorium">
                    <Select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                        <option value="">Pilih permintaan</option>
                        {orders.map((order) => (
                            <option key={order.id} value={order.id}>
                                {order.lab_number} — {order?.patient?.name ?? "-"} — {statusLabel(order.status)}
                            </option>
                        ))}
                    </Select>
                </Field>

                {loading && <p className="mt-[12px] text-[11px] text-[#999999]">Memuat data...</p>}

                {selected && (
                    <div className="mt-[18px] space-y-[14px]">
                        <div className="grid grid-cols-1 gap-[12px] rounded-[10px] bg-[#fafbfc] p-[14px] md:grid-cols-4">
                            <Info label="No. Lab" value={selected.lab_number} />
                            <Info label="Pasien" value={selected?.patient?.name} />
                            <Info label="No. RM" value={selected?.patient?.medical_record_number} />
                            <Info label="Status" value={statusLabel(selected.status)} />
                        </div>

                        {(selected.items ?? []).filter((item) => item.status !== "cancelled").map((item) => (
                            <ResultEditor
                                key={item.id}
                                item={item}
                                orderStatus={selected.status}
                                onSaved={async () => {
                                    setMessage(`Hasil ${item?.test_type?.name ?? "pemeriksaan"} berhasil disimpan.`);
                                    await refresh();
                                }}
                                onError={(text) => setError(text)}
                            />
                        ))}

                        <div className="flex flex-wrap gap-[8px]">
                            {selected.status === "in_process" && (
                                <Button onClick={submitVerification}>Ajukan Verifikasi</Button>
                            )}
                            {selected.status === "pending_verification" && (
                                <Button onClick={verify}>Verifikasi Hasil</Button>
                            )}
                            {selected.status === "completed" && (
                                <span className="rounded-[9px] bg-[#CDE8E5]/40 px-[12px] py-[8px] text-[11px] font-medium text-[#7AB2B2]">
                                    Hasil final dan sudah masuk riwayat rekam medis.
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

function ResultEditor({ item, orderStatus, onSaved, onError }) {
    const parameters = item?.test_type?.parameters ?? [];
    const existing = item?.results ?? [];
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const next = {};
        parameters.forEach((parameter) => {
            const result = existing.find((row) => row.parameter_id === parameter.id);
            next[parameter.id] = {
                value: result?.value ?? "",
                flag: result?.flag ?? "",
                notes: result?.notes ?? "",
            };
        });
        setValues(next);
    }, [item?.id, item?.results?.length]);

    const save = async () => {
        try {
            setSaving(true);
            const results = parameters.map((parameter) => ({
                parameter_id: parameter.id,
                value: values?.[parameter.id]?.value ?? "",
                flag: parameter.data_type === "text"
                    ? values?.[parameter.id]?.flag || null
                    : null,
                notes: values?.[parameter.id]?.notes || null,
            }));
            await laboratoryService.saveResults(item.id, results);
            await onSaved();
        } catch (err) {
            onError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white">
            <div className="border-b border-[#eeeeee] px-[16px] py-[13px]">
                <p className="text-[13px] font-semibold text-[#212121]">{item?.test_type?.name ?? "Pemeriksaan"}</p>
                <p className="mt-[2px] text-[10px] text-[#999999]">{item?.test_type?.code ?? "-"}</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[11px]">
                    <thead className="bg-[#fafbfc] text-[#626262]">
                        <tr>
                            <Th>Parameter</Th>
                            <Th>Hasil</Th>
                            <Th>Satuan</Th>
                            <Th>Nilai Rujukan</Th>
                            <Th>Flag</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {parameters.map((parameter) => {
                            const result = existing.find((row) => row.parameter_id === parameter.id);
                            const ranges = parameter.reference_ranges ?? [];
                            return (
                                <tr key={parameter.id} className="border-b border-[#f1f1f1]">
                                    <Td>{parameter.name}</Td>
                                    <Td>
                                        <Input
                                            value={values?.[parameter.id]?.value ?? ""}
                                            onChange={(event) => setValues((current) => ({
                                                ...current,
                                                [parameter.id]: {
                                                    ...(current[parameter.id] ?? {}),
                                                    value: event.target.value,
                                                },
                                            }))}
                                            disabled={orderStatus !== "in_process"}
                                            placeholder={parameter.data_type === "numeric" ? "0" : "Hasil"}
                                        />
                                    </Td>
                                    <Td>{parameter.unit || "-"}</Td>
                                    <Td>{result ? formatReference(result) : formatParameterRanges(ranges)}</Td>
                                    <Td>
                                        {parameter.data_type === "text" && orderStatus === "in_process" ? (
                                            <Select
                                                value={values?.[parameter.id]?.flag ?? ""}
                                                onChange={(event) => setValues((current) => ({
                                                    ...current,
                                                    [parameter.id]: {
                                                        ...(current[parameter.id] ?? {}),
                                                        flag: event.target.value,
                                                    },
                                                }))}
                                            >
                                                <option value="">Otomatis / Normal</option>
                                                <option value="normal">Normal</option>
                                                <option value="abnormal">Abnormal</option>
                                                <option value="critical">Kritis</option>
                                            </Select>
                                        ) : (
                                            <ResultFlag flag={result?.flag} />
                                        )}
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {orderStatus === "in_process" && (
                <div className="px-[16px] py-[13px]">
                    <Button onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Hasil"}</Button>
                </div>
            )}
        </div>
    );
}

function MasterTab({ options, refreshOptions }) {
    const [sampleTypes, setSampleTypes] = useState([]);
    const [testTypes, setTestTypes] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState("");
    const [selectedParameterId, setSelectedParameterId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [sampleForm, setSampleForm] = useState({ code: "", name: "", container: "", description: "", is_active: true });
    const [testForm, setTestForm] = useState({ code: "", name: "", category: "", sample_type_id: "", price: "0", turnaround_minutes: "", description: "", is_active: true });
    const [parameterForm, setParameterForm] = useState({ code: "", name: "", data_type: "numeric", unit: "", sort_order: "0", is_active: true });
    const [rangeForm, setRangeForm] = useState({ gender: "all", age_min_months: "", age_max_months: "", min_value: "", max_value: "", reference_text: "", critical_min: "", critical_max: "", notes: "", is_active: true });

    const loadMaster = async () => {
        try {
            const [samples, tests] = await Promise.all([
                laboratoryService.getSampleTypes(),
                laboratoryService.getTestTypes({ per_page: 100 }),
            ]);
            setSampleTypes(samples?.data ?? []);
            setTestTypes(tests?.data ?? []);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    useEffect(() => {
        loadMaster();
    }, []);

    const selectedTest = useMemo(
        () => testTypes.find((row) => String(row.id) === String(selectedTestId)),
        [testTypes, selectedTestId],
    );

    const selectedParameter = useMemo(
        () => selectedTest?.parameters?.find((row) => String(row.id) === String(selectedParameterId)),
        [selectedTest, selectedParameterId],
    );

    const run = async (callback, successText, after = null) => {
        try {
            setError("");
            setMessage("");
            await callback();
            setMessage(successText);
            if (after) after();
            await Promise.all([loadMaster(), refreshOptions()]);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const createSample = () => run(
        () => laboratoryService.createSampleType(sampleForm),
        "Jenis sampel berhasil ditambahkan.",
        () => setSampleForm({ code: "", name: "", container: "", description: "", is_active: true }),
    );

    const createTest = () => run(
        () => laboratoryService.createTestType({
            ...testForm,
            sample_type_id: testForm.sample_type_id ? Number(testForm.sample_type_id) : null,
            price: Number(testForm.price || 0),
            turnaround_minutes: testForm.turnaround_minutes ? Number(testForm.turnaround_minutes) : null,
        }),
        "Jenis pemeriksaan berhasil ditambahkan.",
        () => setTestForm({ code: "", name: "", category: "", sample_type_id: "", price: "0", turnaround_minutes: "", description: "", is_active: true }),
    );

    const createParameter = () => {
        if (!selectedTestId) {
            setError("Pilih jenis pemeriksaan terlebih dahulu.");
            return;
        }
        run(
            () => laboratoryService.createParameter(selectedTestId, {
                ...parameterForm,
                sort_order: Number(parameterForm.sort_order || 0),
            }),
            "Parameter berhasil ditambahkan.",
            () => setParameterForm({ code: "", name: "", data_type: "numeric", unit: "", sort_order: "0", is_active: true }),
        );
    };

    const createRange = () => {
        if (!selectedParameterId) {
            setError("Pilih parameter terlebih dahulu.");
            return;
        }
        const nullableNumber = (value) => value === "" ? null : Number(value);
        run(
            () => laboratoryService.createReferenceRange(selectedParameterId, {
                ...rangeForm,
                age_min_months: nullableNumber(rangeForm.age_min_months),
                age_max_months: nullableNumber(rangeForm.age_max_months),
                min_value: nullableNumber(rangeForm.min_value),
                max_value: nullableNumber(rangeForm.max_value),
                critical_min: nullableNumber(rangeForm.critical_min),
                critical_max: nullableNumber(rangeForm.critical_max),
                reference_text: rangeForm.reference_text || null,
                notes: rangeForm.notes || null,
            }),
            "Nilai rujukan berhasil ditambahkan.",
            () => setRangeForm({ gender: "all", age_min_months: "", age_max_months: "", min_value: "", max_value: "", reference_text: "", critical_min: "", critical_max: "", notes: "", is_active: true }),
        );
    };

    return (
        <div className="space-y-[18px]">
            {message && <SuccessBox text={message} />}
            {error && <ErrorBox text={error} />}

            <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                <Card title="Jenis Sampel" subtitle="Master sampel dan wadah pemeriksaan.">
                    <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                        <Field label="Kode"><Input value={sampleForm.code} onChange={(e) => setSampleForm((c) => ({ ...c, code: e.target.value }))} placeholder="EDTA" /></Field>
                        <Field label="Nama"><Input value={sampleForm.name} onChange={(e) => setSampleForm((c) => ({ ...c, name: e.target.value }))} placeholder="Darah EDTA" /></Field>
                        <Field label="Wadah"><Input value={sampleForm.container} onChange={(e) => setSampleForm((c) => ({ ...c, container: e.target.value }))} placeholder="Tabung ungu" /></Field>
                        <Field label="Keterangan"><Input value={sampleForm.description} onChange={(e) => setSampleForm((c) => ({ ...c, description: e.target.value }))} /></Field>
                    </div>
                    <div className="mt-[12px]"><Button onClick={createSample}><FontAwesomeIcon icon={faPlus} /> Tambah Jenis Sampel</Button></div>
                    <div className="mt-[14px] space-y-[7px]">
                        {sampleTypes.map((row) => <MiniRow key={row.id} title={`${row.code} — ${row.name}`} subtitle={row.container || "-"} />)}
                    </div>
                </Card>

                <Card title="Jenis Pemeriksaan & Tarif" subtitle="Master pemeriksaan dan harga yang masuk ke billing.">
                    <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
                        <Field label="Kode"><Input value={testForm.code} onChange={(e) => setTestForm((c) => ({ ...c, code: e.target.value }))} placeholder="LAB-DL" /></Field>
                        <Field label="Nama"><Input value={testForm.name} onChange={(e) => setTestForm((c) => ({ ...c, name: e.target.value }))} placeholder="Darah Lengkap" /></Field>
                        <Field label="Kategori"><Input value={testForm.category} onChange={(e) => setTestForm((c) => ({ ...c, category: e.target.value }))} placeholder="Hematologi" /></Field>
                        <Field label="Jenis Sampel">
                            <Select value={testForm.sample_type_id} onChange={(e) => setTestForm((c) => ({ ...c, sample_type_id: e.target.value }))}>
                                <option value="">Pilih sampel</option>
                                {sampleTypes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                            </Select>
                        </Field>
                        <Field label="Tarif"><Input type="number" value={testForm.price} onChange={(e) => setTestForm((c) => ({ ...c, price: e.target.value }))} /></Field>
                        <Field label="Target Selesai (menit)"><Input type="number" value={testForm.turnaround_minutes} onChange={(e) => setTestForm((c) => ({ ...c, turnaround_minutes: e.target.value }))} /></Field>
                    </div>
                    <div className="mt-[12px]"><Button onClick={createTest}><FontAwesomeIcon icon={faPlus} /> Tambah Pemeriksaan</Button></div>
                </Card>
            </div>

            <Card title="Parameter Pemeriksaan" subtitle="Pilih pemeriksaan, lalu kelola parameter hasil.">
                <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2 xl:grid-cols-5">
                    <Field label="Jenis Pemeriksaan">
                        <Select value={selectedTestId} onChange={(e) => { setSelectedTestId(e.target.value); setSelectedParameterId(""); }}>
                            <option value="">Pilih pemeriksaan</option>
                            {testTypes.map((row) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Kode Parameter"><Input value={parameterForm.code} onChange={(e) => setParameterForm((c) => ({ ...c, code: e.target.value }))} placeholder="HB" /></Field>
                    <Field label="Nama Parameter"><Input value={parameterForm.name} onChange={(e) => setParameterForm((c) => ({ ...c, name: e.target.value }))} placeholder="Hemoglobin" /></Field>
                    <Field label="Tipe Data">
                        <Select value={parameterForm.data_type} onChange={(e) => setParameterForm((c) => ({ ...c, data_type: e.target.value }))}>
                            <option value="numeric">Angka</option>
                            <option value="text">Teks</option>
                        </Select>
                    </Field>
                    <Field label="Satuan"><Input value={parameterForm.unit} onChange={(e) => setParameterForm((c) => ({ ...c, unit: e.target.value }))} placeholder="g/dL" /></Field>
                </div>
                <div className="mt-[12px]"><Button onClick={createParameter}>Tambah Parameter</Button></div>

                {selectedTest && (
                    <div className="mt-[14px] grid grid-cols-1 gap-[8px] md:grid-cols-2 xl:grid-cols-3">
                        {(selectedTest.parameters ?? []).map((row) => (
                            <button
                                type="button"
                                key={row.id}
                                onClick={() => setSelectedParameterId(String(row.id))}
                                className={`rounded-[10px] border p-[11px] text-left ${String(row.id) === String(selectedParameterId) ? "border-[#047AF7] bg-[#C2E1F4]/20" : "border-[#ececec] bg-white"}`}
                            >
                                <p className="text-[11px] font-semibold text-[#212121]">{row.code} — {row.name}</p>
                                <p className="mt-[2px] text-[10px] text-[#999999]">{row.data_type === "numeric" ? "Angka" : "Teks"} · {row.unit || "Tanpa satuan"}</p>
                            </button>
                        ))}
                    </div>
                )}
            </Card>

            {selectedParameter && (
                <Card title={`Nilai Rujukan — ${selectedParameter.name}`} subtitle="Atur rujukan berdasarkan jenis kelamin dan usia (bulan).">
                    <div className="grid grid-cols-1 gap-[10px] md:grid-cols-3 xl:grid-cols-5">
                        <Field label="Jenis Kelamin">
                            <Select value={rangeForm.gender} onChange={(e) => setRangeForm((c) => ({ ...c, gender: e.target.value }))}>
                                <option value="all">Semua</option>
                                <option value="male">Laki-laki</option>
                                <option value="female">Perempuan</option>
                            </Select>
                        </Field>
                        <Field label="Usia Min (bulan)"><Input type="number" value={rangeForm.age_min_months} onChange={(e) => setRangeForm((c) => ({ ...c, age_min_months: e.target.value }))} /></Field>
                        <Field label="Usia Maks (bulan)"><Input type="number" value={rangeForm.age_max_months} onChange={(e) => setRangeForm((c) => ({ ...c, age_max_months: e.target.value }))} /></Field>
                        <Field label="Nilai Min"><Input type="number" step="any" value={rangeForm.min_value} onChange={(e) => setRangeForm((c) => ({ ...c, min_value: e.target.value }))} /></Field>
                        <Field label="Nilai Maks"><Input type="number" step="any" value={rangeForm.max_value} onChange={(e) => setRangeForm((c) => ({ ...c, max_value: e.target.value }))} /></Field>
                        <Field label="Kritis Min"><Input type="number" step="any" value={rangeForm.critical_min} onChange={(e) => setRangeForm((c) => ({ ...c, critical_min: e.target.value }))} /></Field>
                        <Field label="Kritis Maks"><Input type="number" step="any" value={rangeForm.critical_max} onChange={(e) => setRangeForm((c) => ({ ...c, critical_max: e.target.value }))} /></Field>
                        <Field label="Rujukan Teks"><Input value={rangeForm.reference_text} onChange={(e) => setRangeForm((c) => ({ ...c, reference_text: e.target.value }))} placeholder="Negatif / Nonreaktif" /></Field>
                    </div>
                    <div className="mt-[12px]"><Button onClick={createRange}>Tambah Nilai Rujukan</Button></div>
                    <div className="mt-[14px] space-y-[7px]">
                        {(selectedParameter.reference_ranges ?? []).map((row) => (
                            <MiniRow
                                key={row.id}
                                title={`${genderLabel(row.gender)} · ${rangeText(row)}`}
                                subtitle={`Usia: ${ageRangeText(row)}${row.critical_min || row.critical_max ? ` · Kritis: ${row.critical_min ?? "-"} s/d ${row.critical_max ?? "-"}` : ""}`}
                            />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

function Card({ title, subtitle, children }) {
    return (
        <section className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
            <div className="border-b border-[#eeeeee] px-[18px] py-[15px]">
                <h2 className="text-[14px] font-semibold text-[#212121]">{title}</h2>
                {subtitle && <p className="mt-[3px] text-[10px] text-[#999999]">{subtitle}</p>}
            </div>
            <div className="p-[18px]">{children}</div>
        </section>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-[14px] border border-[#ececec] bg-white p-[16px]">
            <p className="text-[10px] text-[#999999]">{label}</p>
            <p className="mt-[6px] text-[22px] font-semibold text-[#212121]">{value}</p>
        </div>
    );
}

function Table({ children }) {
    return <div className="overflow-x-auto"><table className="min-w-full text-left text-[11px]">{children}</table></div>;
}

function Th({ children }) {
    return <th className="whitespace-nowrap bg-[#fafbfc] px-[12px] py-[10px] text-[10px] font-semibold text-[#626262]">{children}</th>;
}

function Td({ children }) {
    return <td className="px-[12px] py-[11px] text-[11px] text-[#626262]">{children}</td>;
}

function Empty({ colSpan, text }) {
    return <tr><td colSpan={colSpan} className="px-[12px] py-[28px] text-center text-[11px] text-[#999999]">{text}</td></tr>;
}

function Field({ label, children }) {
    return <label className="block"><span className="mb-[5px] block text-[10px] font-medium text-[#626262]">{label}</span>{children}</label>;
}

function Input(props) {
    return <input {...props} className={`h-[42px] w-full rounded-[9px] border border-[#e5e5e5] bg-white px-[11px] text-[11px] text-[#212121] outline-none transition focus:border-[#047AF7] disabled:bg-[#fafbfc] ${props.className ?? ""}`} />;
}

function Select(props) {
    return <select {...props} className={`h-[42px] w-full rounded-[9px] border border-[#e5e5e5] bg-white px-[11px] text-[11px] text-[#212121] outline-none transition focus:border-[#047AF7] disabled:bg-[#fafbfc] ${props.className ?? ""}`}>{props.children}</select>;
}

function Button({ children, onClick, variant = "primary", disabled = false }) {
    const style = variant === "secondary"
        ? "border border-[#dcdcdc] bg-white text-[#626262] hover:bg-[#fafbfc]"
        : "bg-[#047AF7] text-white hover:bg-[#046bd8]";
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-[40px] items-center gap-[7px] rounded-[9px] px-[14px] text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}>{children}</button>;
}

function SmallButton({ children, onClick, variant = "primary" }) {
    const style = variant === "danger" ? "border-red-200 text-red-500" : "border-[#C2E1F4] text-[#047AF7]";
    return <button type="button" onClick={onClick} className={`rounded-[7px] border bg-white px-[8px] py-[5px] text-[9px] font-medium ${style}`}>{children}</button>;
}

function SuccessBox({ text }) {
    return <div className="rounded-[10px] border border-[#CDE8E5] bg-[#CDE8E5]/25 px-[14px] py-[11px] text-[11px] font-medium text-[#527b7b]">{text}</div>;
}

function ErrorBox({ text }) {
    return <div className="rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[11px] font-medium text-red-600">{text}</div>;
}

function Info({ label, value }) {
    return <div><p className="text-[9px] uppercase tracking-[0.2px] text-[#999999]">{label}</p><p className="mt-[4px] text-[11px] font-medium text-[#212121]">{value || "-"}</p></div>;
}

function MiniRow({ title, subtitle }) {
    return <div className="rounded-[9px] bg-[#fafbfc] px-[11px] py-[9px]"><p className="text-[11px] font-medium text-[#212121]">{title}</p><p className="mt-[2px] text-[9px] text-[#999999]">{subtitle}</p></div>;
}

function Pagination({ meta, page, setPage }) {
    if ((meta?.last_page ?? 1) <= 1) return null;
    return (
        <div className="mt-[14px] flex items-center justify-between">
            <p className="text-[10px] text-[#999999]">Halaman {meta.current_page} dari {meta.last_page}</p>
            <div className="flex gap-[6px]">
                <SmallButton onClick={() => setPage(Math.max(1, page - 1))}>Sebelumnya</SmallButton>
                <SmallButton onClick={() => setPage(Math.min(meta.last_page, page + 1))}>Berikutnya</SmallButton>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const completed = status === "completed";
    const cancelled = status === "cancelled";
    const className = cancelled
        ? "bg-red-50 text-red-500"
        : completed
            ? "bg-[#CDE8E5]/40 text-[#527b7b]"
            : "bg-[#C2E1F4]/35 text-[#047AF7]";
    return <span className={`inline-flex rounded-full px-[9px] py-[4px] text-[9px] font-medium ${className}`}>{statusLabel(status)}</span>;
}

function ResultFlag({ flag }) {
    if (!flag) return <span className="text-[#999999]">-</span>;
    const cls = flag === "normal"
        ? "bg-[#CDE8E5]/40 text-[#527b7b]"
        : flag === "critical"
            ? "bg-red-100 text-red-600"
            : "bg-amber-50 text-amber-600";
    return <span className={`rounded-full px-[8px] py-[4px] text-[9px] font-medium ${cls}`}>{flagLabel(flag)}</span>;
}

const orderStatusOptions = [
    { value: "draft", label: "Draf" },
    { value: "submitted", label: "Diajukan" },
    { value: "collected", label: "Sampel Diambil" },
    { value: "in_process", label: "Diproses" },
    { value: "pending_verification", label: "Menunggu Verifikasi" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
];

function statusLabel(value) {
    return orderStatusOptions.find((item) => item.value === value)?.label ?? value ?? "-";
}

function sampleStatusLabel(value) {
    return ({ pending: "Menunggu", collected: "Diambil", received: "Diterima", rejected: "Ditolak" })[value] ?? value ?? "-";
}

function flagLabel(value) {
    return ({ normal: "Normal", low: "Rendah", high: "Tinggi", critical: "Kritis", abnormal: "Abnormal" })[value] ?? value ?? "-";
}

function genderLabel(value) {
    return ({ all: "Semua", male: "Laki-laki", female: "Perempuan" })[value] ?? value;
}

function rangeText(row) {
    if (row.reference_text) return row.reference_text;
    if (row.min_value !== null || row.max_value !== null) return `${row.min_value ?? "-"} s/d ${row.max_value ?? "-"}`;
    return "Belum diatur";
}

function ageRangeText(row) {
    if (row.age_min_months === null && row.age_max_months === null) return "Semua usia";
    return `${row.age_min_months ?? 0} - ${row.age_max_months ?? "∞"} bulan`;
}

function formatReference(result) {
    if (result.reference_text) return result.reference_text;
    if (result.reference_low !== null || result.reference_high !== null) return `${result.reference_low ?? "-"} - ${result.reference_high ?? "-"}`;
    return "-";
}

function formatParameterRanges(ranges) {
    if (!Array.isArray(ranges) || ranges.length === 0) return "-";
    const row = ranges[0];
    return rangeText(row);
}

function formatDateTime(value) {
    if (!value) return "-";
    try {
        return new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function getErrorMessage(error) {
    const payload = error?.response?.data;
    if (payload?.message) return payload.message;
    const errors = payload?.errors;
    if (errors && typeof errors === "object") {
        const first = Object.values(errors).flat()?.[0];
        if (first) return first;
    }
    return error?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

function emptyOptions() {
    return {
        sample_types: [],
        test_types: [],
        visits: [],
        units: [],
        doctors: [],
    };
}
