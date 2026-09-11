import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faBan,
  faCheck,
  faMagnifyingGlass,
  faRotate,
  faSpinner,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import pharmacyService from "../services/pharmacyService";

export default function PrescriptionVerificationPanel({
  prescription,
  onChanged,
}) {
  const [notes, setNotes] = useState(prescription?.verification_notes ?? "");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [verifying, setVerifying] = useState(false);

  const [cancelling, setCancelling] = useState(false);

  /*
    |--------------------------------------------------------------------------
    | SUBSTITUTION
    |--------------------------------------------------------------------------
    */

  const [substitutionItem, setSubstitutionItem] = useState(null);

  const [search, setSearch] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const [searching, setSearching] = useState(false);

  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [reason, setReason] = useState("");

  const [substituting, setSubstituting] = useState(false);

  /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

  const status = prescription?.status ?? "";

  const isSubmitted = status === "submitted";

  const isVerified = Boolean(prescription?.verified_at);

  const canCancel = ["submitted", "processing", "ready"].includes(status);

  /*
    |--------------------------------------------------------------------------
    | SYNC NOTES
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    setNotes(prescription?.verification_notes ?? "");
  }, [prescription?.verification_notes]);

  /*
    |--------------------------------------------------------------------------
    | SEARCH MEDICINE
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    if (!substitutionItem) {
      return;
    }

    const query = search.trim();

    if (query.length < 2 || selectedMedicine) {
      setSearchResults([]);

      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const response = await pharmacyService.searchMedicines(query);

        const data = response?.data ?? [];

        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search medicine:", error);

        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, substitutionItem, selectedMedicine]);

  /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    */

  const handleVerify = async () => {
    if (!isSubmitted) {
      return;
    }

    try {
      setVerifying(true);

      setError("");
      setSuccess("");

      await pharmacyService.verifyPrescription(prescription.id, {
        verification_notes: notes.trim() || null,
      });

      setSuccess("Resep berhasil diverifikasi.");

      await onChanged?.();
    } catch (error) {
      console.error("Verify prescription:", error);

      setError(getErrorMessage(error, "Gagal memverifikasi resep."));
    } finally {
      setVerifying(false);
    }
  };

  /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

  const handleCancel = async () => {
    if (!canCancel) {
      return;
    }

    const reason = window.prompt("Masukkan alasan pembatalan resep:");

    if (!reason?.trim()) {
      return;
    }

    const confirmed = window.confirm("Batalkan resep ini?");

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      setError("");
      setSuccess("");

      await pharmacyService.cancelPrescription(prescription.id, reason.trim());

      setSuccess("Resep berhasil dibatalkan.");

      await onChanged?.();
    } catch (error) {
      console.error("Cancel prescription:", error);

      setError(getErrorMessage(error, "Gagal membatalkan resep."));
    } finally {
      setCancelling(false);
    }
  };

  /*
    |--------------------------------------------------------------------------
    | SUBSTITUTION
    |--------------------------------------------------------------------------
    */

  const openSubstitution = (item) => {
    setSubstitutionItem(item);

    setSearch("");
    setSearchResults([]);
    setSelectedMedicine(null);
    setReason("");

    setError("");
    setSuccess("");
  };

  const closeSubstitution = () => {
    setSubstitutionItem(null);

    setSearch("");
    setSearchResults([]);
    setSelectedMedicine(null);
    setReason("");
  };

  const handleSubstitute = async () => {
    if (!selectedMedicine) {
      setError("Pilih obat pengganti terlebih dahulu.");

      return;
    }

    if (!reason.trim()) {
      setError("Alasan substitusi wajib diisi.");

      return;
    }

    try {
      setSubstituting(true);

      setError("");
      setSuccess("");

      await pharmacyService.substituteMedicine(
        prescription.id,
        substitutionItem.id,
        {
          medicine_id: selectedMedicine.id,

          reason: reason.trim(),
        },
      );

      closeSubstitution();

      setSuccess("Substitusi berhasil. Resep wajib diverifikasi kembali.");

      await onChanged?.();
    } catch (error) {
      console.error("Substitute medicine:", error);

      setError(getErrorMessage(error, "Gagal melakukan substitusi obat."));
    } finally {
      setSubstituting(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
        <div className="border-b border-[#eeeeee] px-[20px] py-[17px]">
          <h2 className="text-[16px] font-semibold text-[#212121]">
            Verifikasi Resep
          </h2>

          <p className="mt-[4px] text-[12px] text-[#626262]">
            Pemeriksaan resep sebelum obat diproses oleh Farmasi.
          </p>
        </div>

        <div className="p-[20px]">
          {error && <Alert type="error" text={error} />}

          {success && <Alert type="success" text={success} />}

          <div className="flex items-start gap-[12px]">
            <div
              className={`
                                flex
                                h-[38px]
                                w-[38px]
                                shrink-0
                                items-center
                                justify-center
                                rounded-full

                                ${
                                  isVerified
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-amber-50 text-amber-600"
                                }
                            `}
            >
              <FontAwesomeIcon
                icon={isVerified ? faCheck : faTriangleExclamation}
              />
            </div>

            <div>
              <p className="text-[14px] font-semibold text-[#212121]">
                {isVerified ? "Resep Terverifikasi" : "Belum Diverifikasi"}
              </p>

              <p className="mt-[3px] text-[12px] leading-[1.6] text-[#626262]">
                {isVerified
                  ? `Diverifikasi ${formatDateTime(prescription?.verified_at)}`
                  : "Resep harus diverifikasi sebelum masuk tahap Processing."}
              </p>
            </div>
          </div>

          {isSubmitted && (
            <>
              <div className="mt-[18px]">
                <label className="mb-[6px] block text-[13px] font-medium text-[#626262]">
                  Catatan Verifikasi
                </label>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Catatan verifikasi Farmasi..."
                  className="
                                        w-full
                                        resize-none
                                        rounded-[9px]
                                        border
                                        border-[#e5e5e5]
                                        bg-white
                                        px-[13px]
                                        py-[10px]
                                        text-[14px]
                                        text-[#212121]
                                        outline-none
                                        transition
                                        focus:border-[#7EBDEC]
                                        focus:ring-2
                                        focus:ring-[#C2E1F4]/35
                                    "
                />
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="
                                    mt-[12px]
                                    inline-flex
                                    h-[40px]
                                    items-center
                                    gap-[7px]
                                    rounded-[9px]
                                    bg-[#047AF7]
                                    px-[15px]
                                    text-[13px]
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-[#006FE8]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
              >
                <FontAwesomeIcon
                  icon={verifying ? faSpinner : faCheck}
                  spin={verifying}
                />

                {verifying
                  ? "Memverifikasi..."
                  : isVerified
                    ? "Verifikasi Ulang"
                    : "Verifikasi Resep"}
              </button>

              <div className="mt-[22px] border-t border-[#eeeeee] pt-[18px]">
                <h3 className="text-[14px] font-semibold text-[#212121]">
                  Substitusi Obat
                </h3>

                <p className="mt-[3px] text-[12px] text-[#626262]">
                  Gunakan bila obat perlu diganti sebelum Processing.
                </p>

                <div className="mt-[12px] space-y-[9px]">
                  {prescription?.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-[10px] rounded-[10px] border border-[#eeeeee] bg-[#fafbfc] px-[13px] py-[11px]"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-[#212121]">
                          {item?.medicine?.name ?? "-"}
                        </p>

                        <p className="mt-[2px] text-[12px] text-[#626262]">
                          {formatQuantity(item.quantity)} {item.unit ?? ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openSubstitution(item)}
                        className="inline-flex h-[34px] items-center gap-[6px] rounded-[8px] border border-[#C2E1F4] px-[11px] text-[12px] font-medium text-[#047AF7]"
                      >
                        <FontAwesomeIcon icon={faRotate} />
                        Substitusi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {canCancel && (
            <div className="mt-[18px] border-t border-[#eeeeee] pt-[16px]">
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="
                                    inline-flex
                                    h-[38px]
                                    items-center
                                    gap-[7px]
                                    rounded-[9px]
                                    border
                                    border-red-100
                                    bg-white
                                    px-[14px]
                                    text-[13px]
                                    font-medium
                                    text-red-500
                                    transition
                                    hover:bg-red-50
                                    disabled:opacity-50
                                "
              >
                <FontAwesomeIcon
                  icon={cancelling ? faSpinner : faBan}
                  spin={cancelling}
                />

                {cancelling ? "Membatalkan..." : "Batalkan Resep"}
              </button>
            </div>
          )}

          {status === "cancelled" && (
            <div className="mt-[15px] rounded-[10px] border border-red-100 bg-red-50 px-[13px] py-[11px]">
              <p className="text-[13px] font-semibold text-red-600">
                Resep Dibatalkan
              </p>

              <p className="mt-[3px] text-[12px] text-red-500">
                {prescription?.cancellation_reason ?? "-"}
              </p>
            </div>
          )}
        </div>
      </section>

      {substitutionItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-[20px]">
          <div className="w-full max-w-[520px] overflow-hidden rounded-[14px] bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-[#eeeeee] px-[20px] py-[16px]">
              <div>
                <h2 className="text-[16px] font-semibold text-[#212121]">
                  Substitusi Obat
                </h2>

                <p className="mt-[3px] text-[12px] text-[#626262]">
                  Obat awal: {substitutionItem?.medicine?.name ?? "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeSubstitution}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#626262] hover:bg-[#f4f4f4]"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="p-[20px]">
              <label className="mb-[6px] block text-[13px] font-medium text-[#626262]">
                Obat Pengganti
              </label>

              <div className="relative">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[12px] text-[#B4B4B4]"
                />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);

                    setSelectedMedicine(null);
                  }}
                  placeholder="Cari nama atau kode obat..."
                  className="h-[42px] w-full rounded-[9px] border border-[#e5e5e5] pl-[35px] pr-[12px] text-[14px] outline-none focus:border-[#7EBDEC]"
                />
              </div>

              {!selectedMedicine && search.trim().length >= 2 && (
                <div className="mt-[6px] max-h-[190px] overflow-y-auto rounded-[9px] border border-[#eeeeee]">
                  {searching ? (
                    <p className="px-[12px] py-[11px] text-[12px] text-[#B4B4B4]">
                      Mencari...
                    </p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((medicine) => (
                      <button
                        key={medicine.id}
                        type="button"
                        onClick={() => {
                          setSelectedMedicine(medicine);

                          setSearch(medicine.name);

                          setSearchResults([]);
                        }}
                        className="block w-full border-b border-[#f1f1f1] px-[12px] py-[10px] text-left transition last:border-0 hover:bg-[#fafbfc]"
                      >
                        <p className="text-[13px] font-semibold text-[#212121]">
                          {medicine.name}
                        </p>

                        <p className="mt-[2px] text-[11px] text-[#626262]">
                          {medicine.code ?? "-"}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="px-[12px] py-[11px] text-[12px] text-[#B4B4B4]">
                      Obat tidak ditemukan.
                    </p>
                  )}
                </div>
              )}

              {selectedMedicine && (
                <div className="mt-[9px] rounded-[9px] border border-[#C2E1F4] bg-[#C2E1F4]/15 px-[12px] py-[10px]">
                  <p className="text-[13px] font-semibold text-[#212121]">
                    {selectedMedicine.name}
                  </p>

                  <p className="mt-[2px] text-[11px] text-[#626262]">
                    {selectedMedicine.code ?? "-"}
                  </p>
                </div>
              )}

              <label className="mb-[6px] mt-[15px] block text-[13px] font-medium text-[#626262]">
                Alasan Substitusi
              </label>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Tuliskan alasan penggantian obat..."
                className="w-full resize-none rounded-[9px] border border-[#e5e5e5] px-[12px] py-[10px] text-[14px] outline-none focus:border-[#7EBDEC]"
              />

              <button
                type="button"
                onClick={handleSubstitute}
                disabled={substituting}
                className="mt-[14px] inline-flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white disabled:opacity-50"
              >
                <FontAwesomeIcon
                  icon={substituting ? faSpinner : faRotate}
                  spin={substituting}
                />

                {substituting ? "Menyimpan..." : "Simpan Substitusi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Alert({ type, text }) {
  return (
    <div
      className={`
                mb-[14px]
                rounded-[9px]
                border
                px-[13px]
                py-[10px]
                text-[13px]

                ${
                  type === "error"
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
                }
            `}
    >
      {text}
    </div>
  );
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

function formatQuantity(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value ?? "-";
  }

  return Number.isInteger(number) ? number : number.toString();
}

function getErrorMessage(error, fallback) {
  return (
    error?.data?.message ??
    error?.response?.data?.message ??
    error?.message ??
    fallback
  );
}
