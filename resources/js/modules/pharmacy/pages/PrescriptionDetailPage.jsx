import React, { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowLeft,
  faCapsules,
  faCheck,
  faClipboardCheck,
  faPrescriptionBottleMedical,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import DashboardLayout from "../../../shared/components/layout/DashboardLayout";

import pharmacyService from "../services/pharmacyService";

import PrescriptionVerificationPanel from "../components/PrescriptionVerificationPanel";

export default function PrescriptionDetailPage() {
  const { id } = useParams();

  const [prescription, setPrescription] = useState(null);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

  const loadPrescription = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const response = await pharmacyService.getPrescription(id);

      const data = response?.data ?? response ?? null;

      setPrescription(data);
    } catch (error) {
      console.error("Load prescription:", error);

      setError(getErrorMessage(error, "Gagal mengambil detail resep."));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPrescription(true);
  }, [id]);

  /*
    |--------------------------------------------------------------------------
    | STATUS ACTION
    |--------------------------------------------------------------------------
    */

  const handleStatusAction = async () => {
    if (!prescription) {
      return;
    }

    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      let response;

      if (prescription.status === "submitted") {
        if (!prescription.verified_at) {
          setError("Verifikasi resep terlebih dahulu sebelum diproses.");

          return;
        }

        response = await pharmacyService.startProcessing(prescription.id);
      } else if (prescription.status === "processing") {
        response = await pharmacyService.markReady(prescription.id);
      } else if (prescription.status === "ready") {
        const confirmed = window.confirm(
          "Serahkan obat kepada pasien?\n\nStok obat akan dikurangi berdasarkan batch FEFO.",
        );

        if (!confirmed) {
          return;
        }

        response = await pharmacyService.dispense(prescription.id);
      } else {
        return;
      }

      setSuccess(response?.message ?? "Status resep berhasil diperbarui.");

      await loadPrescription(false);
    } catch (error) {
      console.error("Prescription action:", error);

      setError(getErrorMessage(error, "Gagal memproses resep."));
    } finally {
      setActionLoading(false);
    }
  };

  /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center bg-[#fafbfc]">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-[24px] text-[#047AF7]"
            />

            <p className="mt-[10px] text-[12px] text-[#B4B4B4]">
              Memuat resep...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!prescription) {
    return (
      <DashboardLayout>
        <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
          <p className="text-[13px] text-red-500">
            {error || "Resep tidak ditemukan."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const patient = prescription?.patient ?? {};

  const doctorName =
    prescription?.doctor?.employee?.name ?? prescription?.doctor?.name ?? "-";

  const unitName = prescription?.visit?.unit?.name ?? "-";

  const items = prescription?.items ?? [];

  const button = getActionButton(prescription);

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-88px)] bg-[#fafbfc] p-[30px]">
        {/* HEADER */}

        <div className="mb-[22px] flex flex-wrap items-start justify-between gap-[18px]">
          <div>
            <Link
              to="/pharmacy/prescriptions"
              className="inline-flex items-center gap-[7px] text-[12px] font-medium text-[#047AF7]"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Kembali ke Farmasi
            </Link>

            <h1 className="mt-[13px] text-[24px] font-semibold text-[#212121]">
              Detail Resep
            </h1>

            <p className="mt-[5px] text-[12px] text-[#626262]">
              {prescription.prescription_number}
            </p>
          </div>

          <StatusBadge status={prescription.status} />
        </div>

        {error && <Alert type="error" text={error} />}

        {success && <Alert type="success" text={success} />}

        {/* INFORMATION */}

        <section className="mb-[18px] rounded-[14px] border border-[#ececec] bg-white p-[20px]">
          <div className="flex items-center gap-[9px]">
            <FontAwesomeIcon
              icon={faPrescriptionBottleMedical}
              className="text-[14px] text-[#047AF7]"
            />

            <h2 className="text-[16px] font-semibold text-[#212121]">
              Informasi Resep
            </h2>
          </div>

          <div className="mt-[18px] grid grid-cols-1 gap-x-[30px] gap-y-[18px] sm:grid-cols-2 xl:grid-cols-4">
            <Info
              label="Nomor Resep"
              value={prescription.prescription_number}
            />

            <Info label="Nama Pasien" value={patient.name} />

            <Info
              label="No. Rekam Medis"
              value={patient.medical_record_number}
            />

            <Info label="Dokter" value={doctorName} />

            <Info label="Poli / Unit" value={unitName} />

            <Info
              label="Tanggal Dikirim"
              value={formatDateTime(prescription.submitted_at)}
            />

            <Info
              label="Tanggal Verifikasi"
              value={formatDateTime(prescription.verified_at)}
            />

            <Info
              label="Tanggal Diserahkan"
              value={formatDateTime(prescription.dispensed_at)}
            />
          </div>
        </section>

        {/* ITEMS */}

        <section className="mb-[18px] overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
          <div className="border-b border-[#eeeeee] px-[20px] py-[16px]">
            <div className="flex items-center gap-[9px]">
              <FontAwesomeIcon
                icon={faCapsules}
                className="text-[14px] text-[#7AB2B2]"
              />

              <h2 className="text-[16px] font-semibold text-[#212121]">
                Daftar Obat
              </h2>
            </div>
          </div>

          <div className="p-[20px]">
            <div className="space-y-[10px]">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[10px] border border-[#eeeeee] bg-[#fafbfc] p-[14px]"
                >
                  <div className="flex items-start gap-[11px]">
                    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#CDE8E5]/50 text-[11px] font-semibold text-[#7AB2B2]">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[#212121]">
                        {item?.medicine?.name ?? "-"}
                      </p>

                      <p className="mt-[3px] text-[12px] text-[#626262]">
                        {item?.medicine?.code ?? "-"}
                      </p>

                      {item?.original_medicine && (
                        <div className="mt-[7px] rounded-[8px] border border-amber-100 bg-amber-50 px-[10px] py-[7px]">
                          <p className="text-[11px] text-amber-700">
                            Substitusi dari{" "}
                            <span className="font-semibold">
                              {item.original_medicine.name}
                            </span>
                          </p>

                          <p className="mt-[2px] text-[11px] text-amber-600">
                            {item.substitution_reason ?? "-"}
                          </p>
                        </div>
                      )}

                      <div className="mt-[10px] grid grid-cols-2 gap-[10px] lg:grid-cols-4">
                        <ItemInfo label="Dosis" value={item.dosage} />

                        <ItemInfo label="Frekuensi" value={item.frequency} />

                        <ItemInfo
                          label="Jumlah"
                          value={`${formatQuantity(item.quantity)} ${
                            item.unit ?? ""
                          }`}
                        />

                        <ItemInfo label="Instruksi" value={item.instruction} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {prescription.doctor_notes && (
              <div className="mt-[15px] rounded-[10px] border border-[#eeeeee] px-[13px] py-[11px]">
                <p className="text-[12px] font-semibold text-[#626262]">
                  Catatan Dokter
                </p>

                <p className="mt-[4px] text-[13px] leading-[1.6] text-[#212121]">
                  {prescription.doctor_notes}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* VERIFICATION */}

        <div className="mb-[18px]">
          <PrescriptionVerificationPanel
            prescription={prescription}
            onChanged={() => loadPrescription(false)}
          />
        </div>

        {/* DISPENSE TRACE */}

        {prescription.status === "dispensed" &&
          prescription?.dispense_items?.length > 0 && (
            <section className="mb-[18px] rounded-[14px] border border-[#ececec] bg-white p-[20px]">
              <div className="flex items-center gap-[9px]">
                <FontAwesomeIcon
                  icon={faClipboardCheck}
                  className="text-[14px] text-emerald-600"
                />

                <h2 className="text-[16px] font-semibold text-[#212121]">
                  Batch Penyerahan
                </h2>
              </div>

              <div className="mt-[14px] space-y-[8px]">
                {prescription.dispense_items.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap justify-between gap-[10px] rounded-[9px] bg-[#fafbfc] px-[12px] py-[10px]"
                  >
                    <span className="text-[13px] text-[#626262]">
                      Batch {row?.batch?.batch_number}
                    </span>

                    <span className="text-[13px] font-semibold text-[#212121]">
                      {formatQuantity(row.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* ACTION */}

        {button && (
          <div className="sticky bottom-0 z-20 -mx-[30px] flex justify-end border-t border-[#eeeeee] bg-white/95 px-[30px] py-[15px] backdrop-blur-sm">
            <button
              type="button"
              disabled={actionLoading || button.disabled}
              onClick={handleStatusAction}
              className="
                                inline-flex
                                h-[42px]
                                items-center
                                gap-[8px]
                                rounded-[9px]
                                bg-[#047AF7]
                                px-[17px]
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
                icon={actionLoading ? faSpinner : faCheck}
                spin={actionLoading}
              />

              {actionLoading ? "Memproses..." : button.label}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function getActionButton(prescription) {
  if (prescription.status === "submitted") {
    return {
      label: prescription.verified_at
        ? "Mulai Proses"
        : "Verifikasi Terlebih Dahulu",

      disabled: !prescription.verified_at,
    };
  }

  if (prescription.status === "processing") {
    return {
      label: "Tandai Siap",
      disabled: false,
    };
  }

  if (prescription.status === "ready") {
    return {
      label: "Serahkan Obat",
      disabled: false,
    };
  }

  return null;
}

function StatusBadge({ status }) {
  const labels = {
    draft: "Draft",
    submitted: "Resep Masuk",
    processing: "Diproses",
    ready: "Siap",
    dispensed: "Diserahkan",
    cancelled: "Dibatalkan",
  };

  const classes = {
    draft: "bg-[#C2E1F4]/35 text-[#047AF7]",

    submitted: "bg-[#CDE8E5]/45 text-[#5c9292]",

    processing: "bg-amber-50 text-amber-600",

    ready: "bg-emerald-50 text-emerald-600",

    dispensed: "bg-green-50 text-green-600",

    cancelled: "bg-red-50 text-red-500",
  };

  return (
    <span
      className={`
                rounded-full
                px-[12px]
                py-[6px]
                text-[12px]
                font-medium

                ${classes[status] ?? "bg-[#f4f4f4] text-[#626262]"}
            `}
    >
      {labels[status] ?? status ?? "-"}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[12px] text-[#B4B4B4]">{label}</p>

      <p className="mt-[3px] break-words text-[14px] font-medium text-[#212121]">
        {value ?? "-"}
      </p>
    </div>
  );
}

function ItemInfo({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-[#B4B4B4]">{label}</p>

      <p className="mt-[2px] text-[12px] font-medium text-[#626262]">
        {value || "-"}
      </p>
    </div>
  );
}

function Alert({ type, text }) {
  return (
    <div
      className={`
                mb-[16px]
                rounded-[10px]
                border
                px-[15px]
                py-[12px]
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
