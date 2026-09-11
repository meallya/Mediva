export function formatCurrency(value) {
    const number = Number(value ?? 0);

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number.isNaN(number) ? 0 : number);
}

export function formatQuantity(value) {
    const number = Number(value ?? 0);

    if (Number.isNaN(number)) {
        return "0";
    }

    return Number.isInteger(number)
        ? number.toLocaleString("id-ID")
        : number.toLocaleString("id-ID", {
              maximumFractionDigits: 2,
          });
}

export function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function invoiceStatusLabel(status) {
    const labels = {
        unpaid: "Belum Bayar",
        partial: "Sebagian",
        paid: "Lunas",
        cancelled: "Dibatalkan",
    };

    return labels[status] ?? status ?? "-";
}

export function invoiceStatusClass(status) {
    const classes = {
        unpaid: "border-amber-200 bg-amber-50 text-amber-700",
        partial: "border-blue-200 bg-blue-50 text-blue-700",
        paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
        cancelled: "border-red-200 bg-red-50 text-red-700",
    };

    return classes[status] ?? "border-gray-200 bg-gray-50 text-gray-600";
}

export function categoryLabel(category) {
    const labels = {
        registration: "Pendaftaran",
        doctor_service: "Jasa Dokter",
        procedure: "Tindakan",
        medicine: "Obat",
        other_service: "Biaya Lain",
        laboratory: "Laboratorium",
        radiology: "Radiologi",
    };

    return labels[category] ?? category ?? "-";
}

export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function openPrintWindow(title, bodyHtml) {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
        return false;
    }

    printWindow.document.write(`
        <!doctype html>
        <html lang="id">
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(title)}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 32px;
                        color: #212121;
                        font-size: 12px;
                    }
                    h1 { font-size: 20px; margin: 0 0 4px; }
                    h2 { font-size: 15px; margin: 24px 0 8px; }
                    p { margin: 4px 0; }
                    .muted { color: #777; }
                    .row { display: flex; justify-content: space-between; gap: 24px; }
                    .box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin-top: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px; text-align: left; }
                    th { background: #fafafa; }
                    .right { text-align: right; }
                    .total { font-size: 14px; font-weight: 700; }
                </style>
            </head>
            <body>
                ${bodyHtml}
                <script>
                    window.onload = () => {
                        window.print();
                    };
                <\/script>
            </body>
        </html>
    `);

    printWindow.document.close();

    return true;
}
