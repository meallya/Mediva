import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faCapsules,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faRotate,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../../shared/components/layout/DashboardLayout";

import medicineService from "../services/medicineService";

import useAuth from "../../../auth/hooks/useAuth";

/*
|--------------------------------------------------------------------------
| EMPTY FORM
|--------------------------------------------------------------------------
*/

const emptyForm = {
  code: "",
  name: "",
  generic_name: "",
  dosage_form: "",
  strength: "",
  unit: "",
  manufacturer: "",

  halal_status: "unverified",

  halal_certificate_number: "",

  halal_valid_until: "",

  halal_notes: "",

  is_active: true,
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function MedicineListPage() {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission("medicine.create");

  const canUpdate = hasPermission("medicine.update");

  const canDelete = hasPermission("medicine.delete");

  const canChangeStatus = hasPermission("medicine.status");

  const canManage = canUpdate || canDelete || canChangeStatus;

  /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

  const [medicines, setMedicines] = useState([]);

  const [meta, setMeta] = useState(null);

  /*
    |--------------------------------------------------------------------------
    | FILTER
    |--------------------------------------------------------------------------
    */

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);

  /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingMedicine, setEditingMedicine] = useState(null);

  const [saving, setSaving] = useState(false);

  /*
    |--------------------------------------------------------------------------
    | FORM
    |--------------------------------------------------------------------------
    */

  const [form, setForm] = useState(emptyForm);

  /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedicines();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, page]);

  const loadMedicines = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await medicineService.getAll({
        search: search.trim(),

        status,

        page,

        per_page: 10,
      });

      /*
|--------------------------------------------------------------------------
| LARAVEL PAGINATION RESPONSE
|--------------------------------------------------------------------------
|
| api.js MEDIVA sudah mengembalikan parsed JSON secara langsung.
|
| Jadi response bentuknya:
|
| {
|     current_page: 1,
|     data: [...],
|     last_page: 1,
|     total: ...
| }
|
*/

      const payload = response ?? {};

      setMedicines(Array.isArray(payload.data) ? payload.data : []);

      setMeta({
        current_page: payload.current_page ?? 1,

        last_page: payload.last_page ?? 1,

        total: payload.total ?? 0,

        from: payload.from ?? 0,

        to: payload.to ?? 0,
      });
    } catch (error) {
      console.error("Load medicines:", error);

      setError(getErrorMessage(error, "Gagal mengambil data obat."));
    } finally {
      setLoading(false);
    }
  };

  /*
    |--------------------------------------------------------------------------
    | FORM CHANGE
    |--------------------------------------------------------------------------
    */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,

      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /*
    |--------------------------------------------------------------------------
    | CREATE MODAL
    |--------------------------------------------------------------------------
    */

  const openCreate = () => {
    setEditingMedicine(null);

    setForm(emptyForm);

    setError("");

    setSuccess("");

    setModalOpen(true);
  };

  /*
    |--------------------------------------------------------------------------
    | EDIT MODAL
    |--------------------------------------------------------------------------
    */

  const openEdit = (medicine) => {
    setEditingMedicine(medicine);

    setForm({
      code: medicine.code ?? "",

      name: medicine.name ?? "",

      generic_name: medicine.generic_name ?? "",

      dosage_form: medicine.dosage_form ?? "",

      strength: medicine.strength ?? "",

      unit: medicine.unit ?? "",

      manufacturer: medicine.manufacturer ?? "",

      halal_status: medicine.halal_status ?? "unverified",

      halal_certificate_number: medicine.halal_certificate_number ?? "",

      halal_valid_until: medicine.halal_valid_until
        ? String(medicine.halal_valid_until).slice(0, 10)
        : "",

      halal_notes: medicine.halal_notes ?? "",

      is_active: Boolean(medicine.is_active),
    });

    setError("");

    setSuccess("");

    setModalOpen(true);
  };

  /*
    |--------------------------------------------------------------------------
    | CLOSE MODAL
    |--------------------------------------------------------------------------
    */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingMedicine(null);

    setForm(emptyForm);
  };

  /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      setError("Kode dan nama obat wajib diisi.");

      return;
    }

    const payload = {
      /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

      code: form.code.trim(),

      name: form.name.trim(),

      generic_name: form.generic_name.trim() || null,

      dosage_form: form.dosage_form.trim() || null,

      strength: form.strength.trim() || null,

      unit: form.unit.trim() || null,

      manufacturer: form.manufacturer.trim() || null,

      /*
            |--------------------------------------------------------------------------
            | HALAL INFORMATION
            |--------------------------------------------------------------------------
            */

      halal_status: form.halal_status,

      halal_certificate_number:
        form.halal_status === "halal"
          ? form.halal_certificate_number.trim() || null
          : null,

      halal_valid_until:
        form.halal_status === "halal" ? form.halal_valid_until || null : null,

      halal_notes: form.halal_notes.trim() || null,

      /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

      is_active: form.is_active,
    };

    try {
      setSaving(true);

      setError("");

      setSuccess("");

      if (editingMedicine) {
        await medicineService.update(editingMedicine.id, payload);

        setSuccess("Data obat berhasil diperbarui.");
      } else {
        await medicineService.create(payload);

        setSuccess("Obat berhasil ditambahkan.");
      }

      setModalOpen(false);

      setEditingMedicine(null);

      setForm(emptyForm);

      await loadMedicines();
    } catch (error) {
      console.error("Save medicine:", error);

      setError(getValidationError(error));
    } finally {
      setSaving(false);
    }
  };

  /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

  const handleToggleStatus = async (medicine) => {
    const action = medicine.is_active ? "nonaktifkan" : "aktifkan";

    const confirmed = window.confirm(
      `${
        action.charAt(0).toUpperCase() + action.slice(1)
      } obat ${medicine.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setSuccess("");

      const response = await medicineService.toggleStatus(medicine.id);

      setSuccess(response?.data?.message ?? "Status obat berhasil diperbarui.");

      await loadMedicines();
    } catch (error) {
      setError(getErrorMessage(error, "Gagal mengubah status obat."));
    }
  };

  /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

  const handleDelete = async (medicine) => {
    const confirmed = window.confirm(
      `Hapus ${medicine.name} dari Master Medicine?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setSuccess("");

      const response = await medicineService.remove(medicine.id);

      setSuccess(response?.data?.message ?? "Obat berhasil dihapus.");

      await loadMedicines();
    } catch (error) {
      setError(getErrorMessage(error, "Obat tidak dapat dihapus."));
    }
  };

  /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
        {/* =========================================================
                    HEADER
                ========================================================== */}

        <div className="flex flex-wrap items-start justify-between gap-[16px]">
          <div>
            <h1 className="text-[24px] font-semibold text-[#212121]">
              Master Medicine
            </h1>

            <p className="mt-[5px] text-[12px] text-[#626262]">
              Kelola daftar obat yang tersedia di MEDIVA
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="
            inline-flex
            h-[40px]
            items-center
            justify-center
            gap-[7px]
            rounded-[9px]
            bg-[#047AF7]
            px-[15px]
            text-[11px]
            font-medium
            text-white
            transition
            hover:bg-[#006FE8]
        "
            >
              <FontAwesomeIcon icon={faPlus} />
              Tambah Obat
            </button>
          )}
        </div>

        {/* =========================================================
                    MESSAGE
                ========================================================== */}

        {error && <Message type="error" text={error} />}

        {success && <Message type="success" text={success} />}

        {/* =========================================================
                    FILTER
                ========================================================== */}

        <div className="mt-[22px] flex flex-wrap gap-[10px] rounded-[14px] border border-[#ececec] bg-white p-[15px]">
          {/* SEARCH */}

          <div className="relative min-w-[220px] flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[11px] text-[#B4B4B4]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);

                setPage(1);
              }}
              placeholder="Cari kode, nama, generik, produsen..."
              className="
                                h-[40px]
                                w-full
                                rounded-[9px]
                                border
                                border-[#e5e5e5]
                                bg-white
                                pl-[36px]
                                pr-[12px]
                                text-[12px]
                                text-[#212121]
                                outline-none
                                focus:border-[#7EBDEC]
                                focus:ring-2
                                focus:ring-[#C2E1F4]/35
                            "
            />
          </div>

          {/* STATUS */}

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);

              setPage(1);
            }}
            className="
                            h-[40px]
                            min-w-[150px]
                            rounded-[9px]
                            border
                            border-[#e5e5e5]
                            bg-white
                            px-[12px]
                            text-[12px]
                            text-[#626262]
                            outline-none
                            focus:border-[#7EBDEC]
                        "
          >
            <option value="all">Semua Status</option>

            <option value="active">Aktif</option>

            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* =========================================================
                    TABLE
                ========================================================== */}

        <div className="mt-[15px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-[#fafbfc]">
                <tr className="border-b border-[#eeeeee]">
                  <Th>Kode</Th>

                  <Th>Nama Obat</Th>

                  <Th>Generik</Th>

                  <Th>Bentuk</Th>

                  <Th>Kekuatan</Th>

                  <Th>Satuan</Th>

                  <Th>Produsen</Th>

                  <Th>Halal</Th>

                  <Th>Status</Th>

                  {canManage && <Th align="right">Aksi</Th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : 9}
                      className="px-[18px] py-[35px] text-center text-[11px] text-[#B4B4B4]"
                    >
                      Memuat data obat...
                    </td>
                  </tr>
                ) : medicines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : 9}
                      className="px-[18px] py-[40px] text-center"
                    >
                      <FontAwesomeIcon
                        icon={faCapsules}
                        className="text-[25px] text-[#C2E1F4]"
                      />

                      <p className="mt-[8px] text-[11px] text-[#B4B4B4]">
                        Belum ada data obat.
                      </p>
                    </td>
                  </tr>
                ) : (
                  medicines.map((medicine) => (
                    <tr
                      key={medicine.id}
                      className="border-b border-[#f1f1f1] last:border-b-0 hover:bg-[#fafbfc]"
                    >
                      {/* CODE */}

                      <Td>
                        <span className="font-medium text-[#047AF7]">
                          {medicine.code}
                        </span>
                      </Td>

                      {/* NAME */}

                      <Td>
                        <p className="font-medium text-[#212121]">
                          {medicine.name}
                        </p>
                      </Td>

                      {/* GENERIC */}

                      <Td>{medicine.generic_name || "-"}</Td>

                      {/* FORM */}

                      <Td>{medicine.dosage_form || "-"}</Td>

                      {/* STRENGTH */}

                      <Td>{medicine.strength || "-"}</Td>

                      {/* UNIT */}

                      <Td>{medicine.unit || "-"}</Td>

                      {/* MANUFACTURER */}

                      <Td>{medicine.manufacturer || "-"}</Td>

                      {/* HALAL */}

                      <Td>
                        <HalalBadge medicine={medicine} />
                      </Td>

                      {/* STATUS */}

                      <Td>
                        <span
                          className={`
                            rounded-full
                            px-[8px]
                            py-[4px]
                            text-[9px]
                            font-medium
                            ${
                              medicine.is_active
                                ? "bg-[#CDE8E5]/45 text-[#5f9292]"
                                : "bg-[#f1f1f1] text-[#999999]"
                            }
                        `}
                        >
                          {medicine.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </Td>

                      {/* ACTION */}

                      {canManage && (
                        <Td align="right">
                          <div className="flex justify-end gap-[5px]">
                            {canUpdate && (
                              <ActionButton
                                title="Edit"
                                icon={faPen}
                                onClick={() => openEdit(medicine)}
                              />
                            )}

                            {canChangeStatus && (
                              <ActionButton
                                title={
                                  medicine.is_active
                                    ? "Nonaktifkan"
                                    : "Aktifkan"
                                }
                                icon={faRotate}
                                onClick={() => handleToggleStatus(medicine)}
                              />
                            )}

                            {canDelete && (
                              <ActionButton
                                title="Hapus"
                                icon={faTrash}
                                danger
                                onClick={() => handleDelete(medicine)}
                              />
                            )}
                          </div>
                        </Td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =====================================================
                PAGINATION
            ====================================================== */}

          {meta && (
            <div className="flex flex-wrap items-center justify-between gap-[12px] border-t border-[#eeeeee] px-[18px] py-[13px]">
              <p className="text-[10px] text-[#B4B4B4]">
                {meta.total === 0
                  ? "0 data"
                  : `${meta.from}-${meta.to} dari ${meta.total} obat`}
              </p>

              <div className="flex gap-[6px]">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-[11px] text-[10px] text-[#626262] disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                <div className="flex h-[32px] items-center rounded-[7px] bg-[#C2E1F4]/25 px-[10px] text-[10px] font-medium text-[#047AF7]">
                  {meta.current_page} / {meta.last_page}
                </div>

                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-[32px] rounded-[7px] border border-[#e5e5e5] px-[11px] text-[10px] text-[#626262] disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
                MODAL
            ========================================================== */}

        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E0E0E]/30 px-[16px] backdrop-blur-[2px]">
            <div className="max-h-[90vh] w-full max-w-[650px] overflow-y-auto rounded-[16px] bg-white shadow-[0_25px_70px_rgba(14,14,14,0.18)]">
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-[#eeeeee] px-[22px] py-[17px]">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#212121]">
                    {editingMedicine ? "Edit Obat" : "Tambah Obat"}
                  </h2>

                  <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                    Data master obat MEDIVA
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#B4B4B4] hover:bg-[#f5f5f5] hover:text-[#626262]"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* FORM */}

              <form
                data-enter-scope
                onSubmit={handleSubmit}
                className="p-[22px]"
              >
                <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                  {/* BASIC */}

                  <InputField
                    label="Kode Obat"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="Masukkan kode obat"
                    required
                  />

                  <InputField
                    label="Nama Obat"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nama obat"
                    required
                  />

                  <InputField
                    label="Nama Generik"
                    name="generic_name"
                    value={form.generic_name}
                    onChange={handleChange}
                    placeholder="Opsional"
                  />

                  <InputField
                    label="Bentuk Sediaan"
                    name="dosage_form"
                    value={form.dosage_form}
                    onChange={handleChange}
                    placeholder="Tablet, kapsul, sirup, dll."
                  />

                  <InputField
                    label="Kekuatan"
                    name="strength"
                    value={form.strength}
                    onChange={handleChange}
                    placeholder="Diisi sesuai data obat"
                  />

                  <InputField
                    label="Satuan"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="Tablet, botol, tube, dll."
                  />

                  <div className="md:col-span-2">
                    <InputField
                      label="Produsen"
                      name="manufacturer"
                      value={form.manufacturer}
                      onChange={handleChange}
                      placeholder="Nama produsen / pabrik"
                    />
                  </div>

                  {/* =================================================
                                        HALAL INFORMATION
                                    ================================================== */}

                  <div className="md:col-span-2">
                    <div className="mt-[4px] border-t border-[#eeeeee] pt-[17px]">
                      <h3 className="text-[13px] font-semibold text-[#212121]">
                        Informasi Halal
                      </h3>

                      <p className="mt-[3px] text-[10px] text-[#B4B4B4]">
                        Informasi status dan sertifikasi halal obat.
                      </p>
                    </div>
                  </div>

                  {/* STATUS HALAL */}

                  <div className="md:col-span-2">
                    <label className="mb-[6px] block text-[11px] font-medium text-[#626262]">
                      Status Halal
                    </label>

                    <select
                      name="halal_status"
                      value={form.halal_status}
                      onChange={handleChange}
                      className="
                                                h-[41px]
                                                w-full
                                                rounded-[9px]
                                                border
                                                border-[#e5e5e5]
                                                bg-white
                                                px-[12px]
                                                text-[12px]
                                                text-[#212121]
                                                outline-none
                                                focus:border-[#7EBDEC]
                                                focus:ring-2
                                                focus:ring-[#C2E1F4]/35
                                            "
                    >
                      <option value="halal">Halal</option>

                      <option value="non_halal">Tidak Halal</option>

                      <option value="unverified">Belum Terverifikasi</option>

                      <option value="no_information">
                        Tidak Ada Informasi
                      </option>
                    </select>
                  </div>

                  {/* CERTIFICATE */}

                  {form.halal_status === "halal" && (
                    <>
                      <InputField
                        label="No. Sertifikat Halal"
                        name="halal_certificate_number"
                        value={form.halal_certificate_number}
                        onChange={handleChange}
                        placeholder="Nomor sertifikat halal"
                      />

                      <div>
                        <label className="mb-[6px] block text-[11px] font-medium text-[#626262]">
                          Berlaku Sampai
                        </label>

                        <input
                          type="date"
                          name="halal_valid_until"
                          value={form.halal_valid_until}
                          onChange={handleChange}
                          className="
                                                        h-[41px]
                                                        w-full
                                                        rounded-[9px]
                                                        border
                                                        border-[#e5e5e5]
                                                        bg-white
                                                        px-[12px]
                                                        text-[12px]
                                                        text-[#212121]
                                                        outline-none
                                                        focus:border-[#7EBDEC]
                                                        focus:ring-2
                                                        focus:ring-[#C2E1F4]/35
                                                    "
                        />
                      </div>
                    </>
                  )}

                  {/* NOTES */}

                  <div className="md:col-span-2">
                    <label className="mb-[6px] block text-[11px] font-medium text-[#626262]">
                      Catatan Halal
                    </label>

                    <textarea
                      name="halal_notes"
                      value={form.halal_notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Catatan tambahan mengenai informasi halal..."
                      className="
                                                w-full
                                                resize-none
                                                rounded-[9px]
                                                border
                                                border-[#e5e5e5]
                                                bg-white
                                                px-[12px]
                                                py-[10px]
                                                text-[12px]
                                                text-[#212121]
                                                outline-none
                                                placeholder:text-[#B4B4B4]
                                                focus:border-[#7EBDEC]
                                                focus:ring-2
                                                focus:ring-[#C2E1F4]/35
                                            "
                    />
                  </div>

                  {/* STATUS ACTIVE */}

                  <div className="md:col-span-2">
                    <div className="border-t border-[#eeeeee] pt-[15px]">
                      <label className="flex cursor-pointer items-center gap-[8px]">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={form.is_active}
                          onChange={handleChange}
                          className="h-[13px] w-[13px] accent-[#047AF7]"
                        />

                        <span className="text-[11px] font-medium text-[#626262]">
                          Obat aktif
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ACTION */}

                <div className="mt-[22px] flex justify-end gap-[8px] border-t border-[#eeeeee] pt-[17px]">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-[38px] rounded-[9px] border border-[#e5e5e5] bg-white px-[15px] text-[11px] font-medium text-[#626262]"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    data-enter-primary
                    disabled={saving}
                    className="
                                            h-[40px]
                                            rounded-[9px]
                                            bg-[#047AF7]
                                            px-[18px]
                                            text-[13px]
                                            font-medium
                                            text-white
                                            transition
                                            hover:bg-[#006FE8]
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                        "
                  >
                    {saving
                      ? "Menyimpan..."
                      : editingMedicine
                        ? "Simpan Perubahan"
                        : "Tambah Obat"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-[6px] block text-[11px] font-medium text-[#626262]">
        {label}

        {required && <span className="ml-[3px] text-red-400">*</span>}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
                    h-[41px]
                    w-full
                    rounded-[9px]
                    border
                    border-[#e5e5e5]
                    bg-white
                    px-[12px]
                    text-[12px]
                    text-[#212121]
                    outline-none
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
| TABLE
|--------------------------------------------------------------------------
*/

function Th({ children, align = "left" }) {
  return (
    <th
      className={`
                px-[16px]
                py-[12px]
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2px]
                text-[#999999]

                ${align === "right" ? "text-right" : "text-left"}
            `}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left" }) {
  return (
    <td
      className={`
                px-[16px]
                py-[13px]
                text-[11px]
                text-[#626262]

                ${align === "right" ? "text-right" : "text-left"}
            `}
    >
      {children}
    </td>
  );
}

/*
|--------------------------------------------------------------------------
| HALAL BADGE
|--------------------------------------------------------------------------
*/

function HalalBadge({ medicine }) {
  const configs = {
    halal: {
      label: "Halal",

      className: "bg-emerald-50 text-emerald-600",
    },

    non_halal: {
      label: "Tidak Halal",

      className: "bg-red-50 text-red-500",
    },

    unverified: {
      label: "Belum Terverifikasi",

      className: "bg-amber-50 text-amber-600",
    },

    no_information: {
      label: "Tidak Ada Informasi",

      className: "bg-[#f1f1f1] text-[#888888]",
    },
  };

  const config = configs[medicine.halal_status] ?? configs.unverified;

  return (
    <div>
      <span
        className={`
                    inline-flex
                    whitespace-nowrap
                    rounded-full
                    px-[8px]
                    py-[4px]
                    text-[9px]
                    font-medium

                    ${config.className}
                `}
      >
        {config.label}
      </span>

      {medicine.halal_status === "halal" &&
        medicine.halal_certificate_number && (
          <p
            title={medicine.halal_certificate_number}
            className="
                            mt-[4px]
                            max-w-[150px]
                            truncate
                            text-[9px]
                            text-[#999999]
                        "
          >
            {medicine.halal_certificate_number}
          </p>
        )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ACTION
|--------------------------------------------------------------------------
*/

function ActionButton({ icon, title, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`
                flex
                h-[30px]
                w-[30px]
                items-center
                justify-center
                rounded-[7px]
                text-[10px]
                transition

                ${
                  danger
                    ? "text-red-400 hover:bg-red-50 hover:text-red-500"
                    : "text-[#7AB2B2] hover:bg-[#CDE8E5]/30"
                }
            `}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function Message({ type, text }) {
  return (
    <div
      className={`
                mt-[15px]
                rounded-[9px]
                border
                px-[13px]
                py-[10px]
                text-[11px]

                ${
                  type === "error"
                    ? "border-red-100 bg-red-50 text-red-500"
                    : "border-[#CDE8E5] bg-[#CDE8E5]/25 text-[#626262]"
                }
            `}
    >
      {text}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ERRORS
|--------------------------------------------------------------------------
*/

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback;
}

function getValidationError(error) {
  const errors = error?.response?.data?.errors;

  if (errors) {
    const first = Object.values(errors).flat().find(Boolean);

    if (first) {
      return first;
    }
  }

  return getErrorMessage(error, "Gagal menyimpan data obat.");
}
