export const statusLabel = {
  requested: "Permintaan",
  scheduled: "Terjadwal",
  preop: "Pra Operasi",
  ready: "Siap Operasi",
  in_progress: "Sedang Operasi",
  recovery: "Pemulihan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const priorityLabel = {
  elective: "Elektif",
  urgent: "Urgent",
  emergency: "Emergensi",
};

export const dateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
