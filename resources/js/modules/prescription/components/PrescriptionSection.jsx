import React, { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faCapsules,
    faFloppyDisk,
    faMagnifyingGlass,
    faPaperPlane,
    faPlus,
    faPrescriptionBottleMedical,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import prescriptionService from "../services/prescriptionService";

export default function PrescriptionSection({
    examinationId,
    readOnly = false,
}) {
    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [prescription, setPrescription] = useState(null);

    const [loading, setLoading] = useState(true);

    const [creating, setCreating] = useState(false);

    const [savingNotes, setSavingNotes] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [addingItem, setAddingItem] = useState(false);

    const [deletingItemId, setDeletingItemId] = useState(null);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] = useState("");

    const [searchResults, setSearchResults] = useState([]);

    const [searching, setSearching] = useState(false);

    const [selectedMedicine, setSelectedMedicine] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | ITEM FORM
    |--------------------------------------------------------------------------
    */

    const [itemForm, setItemForm] = useState({
        dosage: "",
        frequency: "",
        quantity: "",
        unit: "",
        instruction: "",
    });

    const [doctorNotes, setDoctorNotes] = useState("");

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    const isDraft = prescription?.status === "draft";

    const canEdit = !readOnly && (!prescription || isDraft);

    /*
    |--------------------------------------------------------------------------
    | LOAD PRESCRIPTION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!examinationId) {
            setLoading(false);

            return;
        }

        loadPrescription();
    }, [examinationId]);

    const loadPrescription = async () => {
        try {
            setLoading(true);

            setError("");

            const response =
                await prescriptionService.getByExamination(examinationId);

            const data = response?.data?.data ?? response?.data ?? null;

            setPrescription(data);

            setDoctorNotes(data?.doctor_notes ?? "");
        } catch (error) {
            console.error("Load prescription:", error);

            setError(error?.message ?? "Gagal mengambil data resep.");
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | CREATE DRAFT
    |--------------------------------------------------------------------------
    */

    const handleCreatePrescription = async () => {
        if (!examinationId || readOnly) {
            return;
        }

        try {
            setCreating(true);

            setError("");

            setSuccess("");

            const response = await prescriptionService.create(examinationId);

            const data = response?.data?.data ?? response?.data ?? null;

            setPrescription(data);

            setDoctorNotes(data?.doctor_notes ?? "");

            setSuccess("Draft resep berhasil dibuat.");
        } catch (error) {
            console.error("Create prescription:", error);

            setError(getErrorMessage(error, "Gagal membuat draft resep."));
        } finally {
            setCreating(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SEARCH MEDICINE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!prescription || !isDraft || readOnly) {
            setSearchResults([]);

            return;
        }

        const query = search.trim();

        if (query.length < 2) {
            setSearchResults([]);

            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearching(true);

                const response =
                    await prescriptionService.searchMedicines(query);

                const data = response?.data?.data ?? response?.data ?? [];

                setSearchResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Search medicine:", error);

                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [search, prescription, isDraft, readOnly]);

    /*
    |--------------------------------------------------------------------------
    | SELECT MEDICINE
    |--------------------------------------------------------------------------
    */

    const handleSelectMedicine = (medicine) => {
        setSelectedMedicine(medicine);

        setSearch(medicine.name);

        setSearchResults([]);

        setItemForm((prev) => ({
            ...prev,

            unit: medicine.unit ?? "",
        }));

        setError("");

        setSuccess("");
    };

    /*
    |--------------------------------------------------------------------------
    | ITEM CHANGE
    |--------------------------------------------------------------------------
    */

    const handleItemChange = (event) => {
        const { name, value } = event.target;

        setItemForm((prev) => ({
            ...prev,

            [name]: value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | ADD ITEM
    |--------------------------------------------------------------------------
    */

    const handleAddItem = async () => {
        if (!prescription || !selectedMedicine) {
            setError("Pilih obat terlebih dahulu.");

            return;
        }

        if (!itemForm.quantity || Number(itemForm.quantity) <= 0) {
            setError("Jumlah obat wajib lebih dari 0.");

            return;
        }

        try {
            setAddingItem(true);

            setError("");

            setSuccess("");

            await prescriptionService.addItem(prescription.id, {
                medicine_id: selectedMedicine.id,

                dosage: itemForm.dosage.trim() || null,

                frequency: itemForm.frequency.trim() || null,

                quantity: Number(itemForm.quantity),

                unit: itemForm.unit.trim() || null,

                instruction: itemForm.instruction.trim() || null,
            });

            resetItemForm();

            await loadPrescription();

            setSuccess("Obat berhasil ditambahkan ke resep.");
        } catch (error) {
            console.error("Add prescription item:", error);

            setError(getErrorMessage(error, "Gagal menambahkan obat."));
        } finally {
            setAddingItem(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE ITEM
    |--------------------------------------------------------------------------
    */

    const handleDeleteItem = async (itemId) => {
        if (!prescription || !isDraft) {
            return;
        }

        const confirmed = window.confirm("Hapus obat ini dari draft resep?");

        if (!confirmed) {
            return;
        }

        try {
            setDeletingItemId(itemId);

            setError("");

            setSuccess("");

            await prescriptionService.deleteItem(prescription.id, itemId);

            await loadPrescription();

            setSuccess("Obat berhasil dihapus.");
        } catch (error) {
            console.error("Delete prescription item:", error);

            setError(getErrorMessage(error, "Gagal menghapus obat."));
        } finally {
            setDeletingItemId(null);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SAVE NOTES
    |--------------------------------------------------------------------------
    */

    const handleSaveNotes = async () => {
        if (!prescription || !isDraft) {
            return;
        }

        try {
            setSavingNotes(true);

            setError("");

            setSuccess("");

            const response = await prescriptionService.update(prescription.id, {
                doctor_notes: doctorNotes.trim() || null,
            });

            const data = response?.data?.data ?? response?.data ?? null;

            if (data) {
                setPrescription(data);
            }

            setSuccess("Catatan resep berhasil disimpan.");
        } catch (error) {
            console.error("Save prescription notes:", error);

            setError(getErrorMessage(error, "Gagal menyimpan catatan resep."));
        } finally {
            setSavingNotes(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmitPrescription = async () => {
        if (!prescription || !isDraft) {
            return;
        }

        if (!prescription.items || prescription.items.length === 0) {
            setError("Tambahkan minimal satu obat sebelum resep dikirim.");

            return;
        }

        const confirmed = window.confirm(
            "Kirim resep ke farmasi? Setelah dikirim, dokter tidak dapat mengubah item resep.",
        );

        if (!confirmed) {
            return;
        }

        try {
            setSubmitting(true);

            setError("");

            setSuccess("");

            /*
                |--------------------------------------------------------------------------
                | SAVE NOTES FIRST
                |--------------------------------------------------------------------------
                */

            await prescriptionService.update(prescription.id, {
                doctor_notes: doctorNotes.trim() || null,
            });

            /*
                |--------------------------------------------------------------------------
                | SUBMIT
                |--------------------------------------------------------------------------
                */

            const response = await prescriptionService.submit(prescription.id);

            const data = response?.data?.data ?? response?.data ?? null;

            setPrescription(data);

            setDoctorNotes(data?.doctor_notes ?? doctorNotes);

            resetItemForm();

            setSuccess("Resep berhasil dikirim ke farmasi.");
        } catch (error) {
            console.error("Submit prescription:", error);

            setError(
                getErrorMessage(error, "Gagal mengirim resep ke farmasi."),
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RESET ITEM
    |--------------------------------------------------------------------------
    */

    const resetItemForm = () => {
        setSelectedMedicine(null);

        setSearch("");

        setSearchResults([]);

        setItemForm({
            dosage: "",
            frequency: "",
            quantity: "",
            unit: "",
            instruction: "",
        });
    };

    /*
    |--------------------------------------------------------------------------
    | TOTAL ITEMS
    |--------------------------------------------------------------------------
    */

    const totalItems = useMemo(
        () => prescription?.items?.length ?? 0,
        [prescription],
    );

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <section
                data-enter-ignore="true"
                className="rounded-[14px] border border-[#ececec] bg-white p-[20px]"
            >
                <p className="text-[12px] text-[#B4B4B4]">Memuat resep...</p>
            </section>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EXAMINATION BELUM ADA
    |--------------------------------------------------------------------------
    */

    if (!examinationId) {
        return (
            <section
                data-enter-ignore="true"
                className="rounded-[14px] border border-[#ececec] bg-white p-[20px]"
            >
                <div className="flex items-center gap-[9px]">
                    <FontAwesomeIcon
                        icon={faPrescriptionBottleMedical}
                        className="text-[13px] text-[#047AF7]"
                    />

                    <h2 className="text-[14px] font-semibold text-[#212121]">
                        E-Resep
                    </h2>
                </div>

                <p className="mt-[8px] text-[11px] text-[#B4B4B4]">
                    Simpan pemeriksaan terlebih dahulu sebelum membuat resep.
                </p>
            </section>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BELUM ADA PRESCRIPTION
    |--------------------------------------------------------------------------
    */

    if (!prescription) {
        return (
            <section
                data-enter-ignore="true"
                className="rounded-[14px] border border-[#ececec] bg-white p-[20px]"
            >
                <div className="flex flex-wrap items-start justify-between gap-[15px]">
                    <div>
                        <div className="flex items-center gap-[9px]">
                            <FontAwesomeIcon
                                icon={faPrescriptionBottleMedical}
                                className="text-[13px] text-[#047AF7]"
                            />

                            <h2 className="text-[14px] font-semibold text-[#212121]">
                                E-Resep
                            </h2>
                        </div>

                        <p className="mt-[6px] text-[11px] text-[#B4B4B4]">
                            Belum ada resep untuk pemeriksaan ini.
                        </p>
                    </div>

                    {!readOnly && (
                        <button
                            type="button"
                            disabled={creating}
                            onClick={handleCreatePrescription}
                            className="
                                inline-flex
                                h-[38px]
                                items-center
                                justify-center
                                gap-[7px]
                                rounded-[9px]
                                bg-[#047AF7]
                                px-[14px]
                                text-[11px]
                                font-medium
                                text-white
                                transition
                                hover:bg-[#006FE8]
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            <FontAwesomeIcon icon={faPlus} />

                            {creating ? "Membuat..." : "Buat Resep"}
                        </button>
                    )}
                </div>

                {error && <ErrorMessage message={error} />}
            </section>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MAIN
    |--------------------------------------------------------------------------
    */

    return (
        <section
            data-enter-ignore="true"
            className="overflow-visible rounded-[14px] border border-[#ececec] bg-white"
        >
            {/* =============================================================
                HEADER
            ============================================================== */}

            <div className="flex flex-wrap items-start justify-between gap-[15px] border-b border-[#eeeeee] px-[20px] py-[17px]">
                <div>
                    <div className="flex items-center gap-[9px]">
                        <FontAwesomeIcon
                            icon={faPrescriptionBottleMedical}
                            className="text-[13px] text-[#047AF7]"
                        />

                        <h2 className="text-[14px] font-semibold text-[#212121]">
                            E-Resep
                        </h2>
                    </div>

                    <p className="mt-[5px] text-[11px] text-[#B4B4B4]">
                        {prescription.prescription_number ?? "-"}
                    </p>
                </div>

                <div className="flex items-center gap-[8px]">
                    <span
                        className={`
                            rounded-full
                            px-[10px]
                            py-[5px]
                            text-[10px]
                            font-medium
                            ${getStatusClasses(prescription.status)}
                        `}
                    >
                        {getStatusLabel(prescription.status)}
                    </span>

                    <span className="rounded-full bg-[#fafbfc] px-[10px] py-[5px] text-[10px] text-[#626262]">
                        {totalItems} obat
                    </span>
                </div>
            </div>

            {/* =============================================================
                MESSAGES
            ============================================================== */}

            <div className="px-[20px]">
                {error && <ErrorMessage message={error} />}

                {success && <SuccessMessage message={success} />}
            </div>

            {/* =============================================================
                SEARCH + ADD MEDICINE
            ============================================================== */}

            {canEdit && (
                <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                    <h3 className="text-[13px] font-semibold text-[#212121]">
                        Tambah Obat
                    </h3>

                    <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                        Pilih obat dari Master Medicine MEDIVA.
                    </p>

                    {/* SEARCH */}

                    <div className="relative mt-[14px]">
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[11px] text-[#B4B4B4]"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);

                                setSelectedMedicine(null);
                            }}
                            placeholder="Cari nama, kode, atau nama generik obat..."
                            className="
                                h-[42px]
                                w-full
                                rounded-[9px]
                                border
                                border-[#e5e5e5]
                                bg-white
                                pl-[36px]
                                pr-[14px]
                                text-[12px]
                                text-[#212121]
                                outline-none
                                transition
                                placeholder:text-[#B4B4B4]
                                focus:border-[#7EBDEC]
                                focus:ring-2
                                focus:ring-[#C2E1F4]/35
                            "
                        />

                        {/* RESULTS */}

                        {search.trim().length >= 2 && !selectedMedicine && (
                            <div className="absolute left-0 right-0 top-[48px] z-30 max-h-[240px] overflow-y-auto rounded-[10px] border border-[#e8e8e8] bg-white shadow-[0_15px_35px_rgba(33,33,33,0.12)]">
                                {searching ? (
                                    <p className="px-[14px] py-[13px] text-[11px] text-[#B4B4B4]">
                                        Mencari obat...
                                    </p>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((medicine) => (
                                        <button
                                            key={medicine.id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectMedicine(medicine)
                                            }
                                            className="
                                                        flex
                                                        w-full
                                                        items-start
                                                        gap-[10px]
                                                        border-b
                                                        border-[#f1f1f1]
                                                        px-[14px]
                                                        py-[11px]
                                                        text-left
                                                        transition
                                                        last:border-b-0
                                                        hover:bg-[#C2E1F4]/15
                                                    "
                                        >
                                            <div className="mt-[1px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#CDE8E5]/45 text-[#7AB2B2]">
                                                <FontAwesomeIcon
                                                    icon={faCapsules}
                                                    className="text-[11px]"
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold text-[#212121]">
                                                    {medicine.name}

                                                    {medicine.strength &&
                                                        ` ${medicine.strength}`}
                                                </p>

                                                <p className="mt-[2px] text-[10px] text-[#B4B4B4]">
                                                    {medicine.code}

                                                    {medicine.generic_name &&
                                                        ` • ${medicine.generic_name}`}

                                                    {medicine.dosage_form &&
                                                        ` • ${medicine.dosage_form}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-[14px] py-[13px]">
                                        <p className="text-[11px] text-[#626262]">
                                            Obat tidak ditemukan.
                                        </p>

                                        <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                                            Tambahkan obat yang benar melalui
                                            Master Data Obat.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SELECTED MEDICINE */}

                    {selectedMedicine && (
                        <div className="mt-[12px] rounded-[10px] border border-[#C2E1F4] bg-[#C2E1F4]/12 p-[13px]">
                            <p className="text-[12px] font-semibold text-[#212121]">
                                {selectedMedicine.name}

                                {selectedMedicine.strength &&
                                    ` ${selectedMedicine.strength}`}
                            </p>

                            <p className="mt-[3px] text-[10px] text-[#626262]">
                                {selectedMedicine.code}

                                {selectedMedicine.generic_name &&
                                    ` • ${selectedMedicine.generic_name}`}

                                {selectedMedicine.dosage_form &&
                                    ` • ${selectedMedicine.dosage_form}`}
                            </p>
                        </div>
                    )}

                    {/* FORM */}

                    {selectedMedicine && (
                        <div className="mt-[14px] grid grid-cols-1 gap-[12px] md:grid-cols-2 xl:grid-cols-4">
                            <Field
                                label="Dosis"
                                name="dosage"
                                value={itemForm.dosage}
                                onChange={handleItemChange}
                                placeholder="Diisi dokter"
                            />

                            <Field
                                label="Frekuensi"
                                name="frequency"
                                value={itemForm.frequency}
                                onChange={handleItemChange}
                                placeholder="Diisi dokter"
                            />

                            <Field
                                label="Jumlah"
                                name="quantity"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={itemForm.quantity}
                                onChange={handleItemChange}
                                placeholder="0"
                                required
                            />

                            <Field
                                label="Satuan"
                                name="unit"
                                value={itemForm.unit}
                                onChange={handleItemChange}
                                placeholder="Tablet, botol, dll."
                            />

                            <div className="md:col-span-2 xl:col-span-4">
                                <label className="mb-[6px] block text-[11px] font-medium text-[#626262]">
                                    Instruksi Pemakaian
                                </label>

                                <textarea
                                    name="instruction"
                                    value={itemForm.instruction}
                                    onChange={handleItemChange}
                                    rows={3}
                                    placeholder="Instruksi ditulis dokter..."
                                    className="
                                        w-full
                                        resize-none
                                        rounded-[9px]
                                        border
                                        border-[#e5e5e5]
                                        bg-white
                                        px-[13px]
                                        py-[10px]
                                        text-[12px]
                                        text-[#212121]
                                        outline-none
                                        transition
                                        placeholder:text-[#B4B4B4]
                                        focus:border-[#7EBDEC]
                                        focus:ring-2
                                        focus:ring-[#C2E1F4]/35
                                    "
                                />
                            </div>

                            <div className="md:col-span-2 xl:col-span-4">
                                <button
                                    type="button"
                                    disabled={addingItem}
                                    onClick={handleAddItem}
                                    className="
                                        inline-flex
                                        h-[38px]
                                        items-center
                                        justify-center
                                        gap-[7px]
                                        rounded-[9px]
                                        bg-[#047AF7]
                                        px-[14px]
                                        text-[11px]
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-[#006FE8]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >
                                    <FontAwesomeIcon icon={faPlus} />

                                    {addingItem
                                        ? "Menambahkan..."
                                        : "Tambahkan Obat"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* =============================================================
                PRESCRIPTION ITEMS
            ============================================================== */}

            <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                <h3 className="text-[13px] font-semibold text-[#212121]">
                    Daftar Obat
                </h3>

                {totalItems === 0 ? (
                    <div className="mt-[12px] rounded-[10px] bg-[#fafbfc] px-[14px] py-[16px] text-center">
                        <p className="text-[11px] text-[#B4B4B4]">
                            Belum ada obat dalam resep.
                        </p>
                    </div>
                ) : (
                    <div className="mt-[12px] space-y-[9px]">
                        {prescription.items.map((item, index) => (
                            <PrescriptionItem
                                key={item.id}
                                item={item}
                                index={index}
                                canDelete={canEdit}
                                deleting={deletingItemId === item.id}
                                onDelete={() => handleDeleteItem(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* =============================================================
                DOCTOR NOTES
            ============================================================== */}

            <div className="border-b border-[#eeeeee] px-[20px] py-[18px]">
                <label className="text-[13px] font-semibold text-[#212121]">
                    Catatan Resep
                </label>

                <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                    Catatan dokter terkait resep ini.
                </p>

                <textarea
                    value={doctorNotes}
                    onChange={(event) => setDoctorNotes(event.target.value)}
                    disabled={!canEdit}
                    rows={3}
                    placeholder="Catatan resep..."
                    className="
                        mt-[10px]
                        w-full
                        resize-none
                        rounded-[9px]
                        border
                        border-[#e5e5e5]
                        bg-white
                        px-[13px]
                        py-[10px]
                        text-[12px]
                        text-[#212121]
                        outline-none
                        transition
                        placeholder:text-[#B4B4B4]
                        focus:border-[#7EBDEC]
                        focus:ring-2
                        focus:ring-[#C2E1F4]/35
                        disabled:bg-[#fafbfc]
                        disabled:text-[#626262]
                    "
                />

                {canEdit && (
                    <button
                        type="button"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="
                            mt-[10px]
                            inline-flex
                            h-[36px]
                            items-center
                            justify-center
                            gap-[7px]
                            rounded-[8px]
                            border
                            border-[#C2E1F4]
                            bg-white
                            px-[13px]
                            text-[11px]
                            font-medium
                            text-[#047AF7]
                            transition
                            hover:bg-[#C2E1F4]/20
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        <FontAwesomeIcon icon={faFloppyDisk} />

                        {savingNotes ? "Menyimpan..." : "Simpan Catatan"}
                    </button>
                )}
            </div>

            {/* =============================================================
                SUBMIT
            ============================================================== */}

            {canEdit && (
                <div className="flex flex-wrap items-center justify-between gap-[12px] px-[20px] py-[17px]">
                    <div>
                        <p className="text-[11px] font-medium text-[#212121]">
                            Kirim ke Farmasi
                        </p>

                        <p className="mt-[2px] text-[10px] text-[#B4B4B4]">
                            Resep tidak dapat diedit oleh dokter setelah
                            dikirim.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={submitting || totalItems === 0}
                        onClick={handleSubmitPrescription}
                        className="
                            inline-flex
                            h-[38px]
                            items-center
                            justify-center
                            gap-[7px]
                            rounded-[9px]
                            bg-[#7AB2B2]
                            px-[15px]
                            text-[11px]
                            font-medium
                            text-white
                            transition
                            hover:bg-[#699f9f]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />

                        {submitting ? "Mengirim..." : "Kirim Resep"}
                    </button>
                </div>
            )}

            {!isDraft && (
                <div className="px-[20px] py-[15px]">
                    <div className="rounded-[9px] bg-[#CDE8E5]/35 px-[12px] py-[10px] text-[10px] text-[#626262]">
                        Resep telah dikirim dan sekarang bersifat read-only
                        untuk dokter.
                    </div>
                </div>
            )}
        </section>
    );
}

/*
|--------------------------------------------------------------------------
| PRESCRIPTION ITEM
|--------------------------------------------------------------------------
*/

function PrescriptionItem({ item, index, canDelete, deleting, onDelete }) {
    const medicine = item.medicine;

    return (
        <div className="flex flex-wrap items-start justify-between gap-[12px] rounded-[10px] border border-[#eeeeee] bg-[#fafbfc] p-[13px]">
            <div className="flex min-w-0 flex-1 gap-[11px]">
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#CDE8E5]/50 text-[#7AB2B2]">
                    <span className="text-[10px] font-semibold">
                        {index + 1}
                    </span>
                </div>

                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#212121]">
                        {medicine?.name ?? "Obat"}

                        {medicine?.strength && ` ${medicine.strength}`}
                    </p>

                    <p className="mt-[2px] text-[10px] text-[#B4B4B4]">
                        {medicine?.code ?? "-"}

                        {medicine?.dosage_form && ` • ${medicine.dosage_form}`}
                    </p>

                    <div className="mt-[9px] flex flex-wrap gap-x-[18px] gap-y-[5px]">
                        <ItemInfo label="Dosis" value={item.dosage} />

                        <ItemInfo label="Frekuensi" value={item.frequency} />

                        <ItemInfo
                            label="Jumlah"
                            value={`${formatQuantity(item.quantity)} ${
                                item.unit ?? ""
                            }`}
                        />
                    </div>

                    {item.instruction && (
                        <p className="mt-[8px] text-[10px] leading-[1.6] text-[#626262]">
                            {item.instruction}
                        </p>
                    )}
                </div>
            </div>

            {canDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    title="Hapus obat"
                    className="
                        flex
                        h-[30px]
                        w-[30px]
                        items-center
                        justify-center
                        rounded-[8px]
                        text-[10px]
                        text-red-400
                        transition
                        hover:bg-red-50
                        hover:text-red-500
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| FIELD
|--------------------------------------------------------------------------
*/

function Field({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    min,
    step,
}) {
    return (
        <div>
            <label className="mb-[6px] block text-[11px] font-medium text-[#626262]">
                {label}

                {required && <span className="ml-[3px] text-red-400">*</span>}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                min={min}
                step={step}
                className="
                    h-[40px]
                    w-full
                    rounded-[9px]
                    border
                    border-[#e5e5e5]
                    bg-white
                    px-[12px]
                    text-[12px]
                    text-[#212121]
                    outline-none
                    transition
                    placeholder:text-[#B4B4B4]
                    focus:border-[#7EBDEC]
                    focus:ring-2
                    focus:ring-[#C2E1F4]/35
                "
            />
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ITEM INFO
|--------------------------------------------------------------------------
*/

function ItemInfo({ label, value }) {
    return (
        <div>
            <p className="text-[9px] uppercase tracking-[0.2px] text-[#B4B4B4]">
                {label}
            </p>

            <p className="mt-[2px] text-[10px] font-medium text-[#626262]">
                {value || "-"}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| MESSAGES
|--------------------------------------------------------------------------
*/

function ErrorMessage({ message }) {
    return (
        <div className="mt-[12px] rounded-[9px] border border-red-100 bg-red-50 px-[12px] py-[9px] text-[10px] text-red-500">
            {message}
        </div>
    );
}

function SuccessMessage({ message }) {
    return (
        <div className="mt-[12px] rounded-[9px] border border-[#CDE8E5] bg-[#CDE8E5]/25 px-[12px] py-[9px] text-[10px] text-[#626262]">
            {message}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getStatusLabel(status) {
    const labels = {
        draft: "Draft",

        submitted: "Dikirim",

        processing: "Diproses Farmasi",

        ready: "Siap Diambil",

        dispensed: "Diserahkan",

        cancelled: "Dibatalkan",
    };

    return labels[status] ?? status ?? "-";
}

function getStatusClasses(status) {
    const classes = {
        draft: "bg-[#C2E1F4]/35 text-[#047AF7]",

        submitted: "bg-[#CDE8E5]/45 text-[#5c9292]",

        processing: "bg-amber-50 text-amber-600",

        ready: "bg-emerald-50 text-emerald-600",

        dispensed: "bg-green-50 text-green-600",

        cancelled: "bg-red-50 text-red-500",
    };

    return classes[status] ?? "bg-[#f4f4f4] text-[#626262]";
}

function formatQuantity(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return Number.isInteger(number) ? number : number.toString();
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message ?? error?.message ?? fallback;
}
