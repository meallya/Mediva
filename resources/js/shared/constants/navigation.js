import {
    faBed,
    faCapsules,
    faClipboardList,
    faCreditCard,
    faDatabase,
    faDoorOpen,
    faHospital,
    faHouse,
    faListOl,
    faMoneyBillWave,
    faStethoscope,
    faTruck,
    faUserDoctor,
    faUserInjured,
    faUsers,
    faBoxesStacked,
    faCashRegister,
    faReceipt,
    faChartColumn,
    faLaptopMedical,
    faCartShopping,
} from "@fortawesome/free-solid-svg-icons";

/*
|--------------------------------------------------------------------------
| MEDIVA NAVIGATION
|--------------------------------------------------------------------------
|
| Navigation hanya mengatur tampilan menu frontend.
|
| Backend tetap menjadi sumber authorization utama melalui middleware
| permission Laravel.
|
*/

const navigation = [
    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    {
        type: "link",

        label: "Dashboard",

        path: "/dashboard",

        icon: faHouse,

        permissions: [],

        available: true,
    },


    /*
    |--------------------------------------------------------------------------
    | GENERAL INVENTORY
    |--------------------------------------------------------------------------
    */

    {
        type: "link",

        label: "Inventaris Umum",

        path: "/inventory",

        icon: faBoxesStacked,

        permissions: ["inventory.view"],

        available: true,
    },

    {
        type: "link",
        label: "Asset & Alkes",
        path: "/assets",
        icon: faLaptopMedical,
        permissions: ["asset.view"],
        available: true,
    },

    {
        type: "link",
        label: "Procurement",
        path: "/procurement",
        icon: faCartShopping,
        permissions: ["procurement.view"],
        available: true,
    },

    /*
    |--------------------------------------------------------------------------
    | PELAYANAN
    |--------------------------------------------------------------------------
    */

    {
        type: "group",

        label: "Pelayanan",

        icon: faStethoscope,

        permissions: [],

        children: [
            {
                label: "Stok Obat",
                path: "/pharmacy/inventory",
                icon: faBoxesStacked,
                permissions: ["stock.view"],
                available: true,
            },

            {
                label: "Billing / Kasir",
                path: "/billing",
                icon: faCashRegister,
                permissions: ["billing.view"],
                available: true,
            },

            {
                label: "Riwayat Transaksi",
                path: "/billing/transactions",
                icon: faReceipt,
                permissions: ["billing.view"],
                available: true,
            },

            /*
|--------------------------------------------------------------------------
| FARMASI
|--------------------------------------------------------------------------
*/

            {
                label: "Farmasi",

                path: "/pharmacy/prescriptions",

                icon: faCapsules,

                permissions: ["pharmacy.dispense"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | PASIEN
            |--------------------------------------------------------------------------
            */

            {
                label: "Pasien",

                path: "/patients",

                icon: faUserInjured,

                permissions: ["patient.view"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | PENDAFTARAN
            |--------------------------------------------------------------------------
            */

            {
                label: "Pendaftaran",

                path: "/registrations",

                icon: faClipboardList,

                permissions: ["registration.view"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | ANTREAN
            |--------------------------------------------------------------------------
            */

            {
                label: "Antrean",

                path: "/queues",

                icon: faListOl,

                permissions: ["queue.view"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | MANAGEMENT LAPORAN
            |--------------------------------------------------------------------------
            */

            {
                type: "link",
                label: "Laporan",
                path: "/reports",
                icon: faChartColumn,
                permissions: ["report.view"],
                available: true,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | MASTER DATA
    |--------------------------------------------------------------------------
    |
    | Untuk sekarang Master Data dikelola melalui permission user.manage.
    |
    | Hanya Medicine yang sudah tersedia sebagai modul CRUD.
    | Item lainnya tetap ditampilkan sebagai "Soon" untuk IT.
    |
    */

    {
        type: "group",

        label: "Master Data",

        icon: faDatabase,

        permissions: ["user.manage", "medicine.view", "tariff.view"],

        children: [
            /*
            |--------------------------------------------------------------------------
            | EMPLOYEE
            |--------------------------------------------------------------------------
            */

            {
                label: "Pegawai",

                path: "/master/employees",

                icon: faUsers,

                permissions: ["user.manage"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | DOCTOR
            |--------------------------------------------------------------------------
            */

            {
                label: "Dokter",

                path: "/master/doctors",

                icon: faUserDoctor,

                permissions: ["user.manage"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | CLINIC / POLI
            |--------------------------------------------------------------------------
            */

            {
                label: "Poli",

                path: "/master/clinics",

                icon: faHospital,

                permissions: ["user.manage"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | ROOM
            |--------------------------------------------------------------------------
            */

            {
                label: "Ruangan RS",

                path: "/master/rooms",

                icon: faDoorOpen,

                permissions: ["user.manage"],

                available: true,
            },

            {
                label: "Kamar Rawat Inap",

                path: "/master/inpatient-rooms",

                icon: faBed,

                permissions: ["user.manage"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | TARIFF
            |--------------------------------------------------------------------------
            */

            {
                label: "Tarif",
                path: "/master/tariffs",
                icon: faMoneyBillWave,
                permissions: ["tariff.view"],
                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | MEDICINE
            |--------------------------------------------------------------------------
            */

            {
                label: "Obat",

                path: "/master/medicines",

                icon: faCapsules,

                permissions: ["medicine.view"],

                available: true,
            },

            /*
            |--------------------------------------------------------------------------
            | SUPPLIER
            |--------------------------------------------------------------------------
            */

            {
                label: "Supplier",

                path: "/master/suppliers",

                icon: faTruck,

                permissions: ["user.manage"],

                available: false,
            },

            /*
            |--------------------------------------------------------------------------
            | PAYMENT METHOD
            |--------------------------------------------------------------------------
            */

            {
                label: "Metode Bayar",

                path: "/master/payment-methods",

                icon: faCreditCard,

                permissions: ["user.manage"],

                available: true,
            },
        ],
    },
];

export default navigation;
