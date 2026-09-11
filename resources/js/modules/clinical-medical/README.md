# MEDIVA — Clinical / Medical

Existing stable modules tetap di lokasi lama agar import path, route, dan perilaku aplikasi tidak berubah.

Existing logical modules:
- ../patient
- ../registration
- ../medical
- ../medical-record
- ../pharmacy
- ../billing (shared dengan Finance)

New modules:
- nursing
- pharmacist
- laboratory
- radiology
- surgery
- emergency
- outpatient
- inpatient

Jangan memindahkan module existing tanpa refactor terencana.
