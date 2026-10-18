# SmartSave — Product Requirements Document (PRD)

Dokumen produk untuk platform **SmartSave — Food Waste Prevention, Donation & Carbon Impact Platform**. PRD ini merangkum kebutuhan produk dari sumber otoritatif di bawah, ditambah keputusan prototipe yang sudah disepakati. Istilah produk (label UI) memakai bahasa Inggris; dokumen memakai bahasa Indonesia.

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | 16 Oktober 2026 |
| Status | Draft untuk review |
| Sumber otoritatif | `SMARTSAVE_REQUIREMENT_WEBSITE_REVISI_V1_5_RAPI.docx` (v1.5) — disingkat **[Req §n]** |
| Sumber pendukung | `flow.md` (14 diagram alur), `style.md` (design token & aturan visual), `Create interactive prototype (7).make` (Figma Make — hanya untuk wizard & loker atas permintaan eksplisit) |
| Kondisi saat ini | Prototipe UI interaktif React + TypeScript + Vite dengan data demo di memori (bukan full-stack) |

---

## 1. Ringkasan produk

**Masalah.** Limbah makanan terjadi karena stok tidak terpantau, masa simpan tidak tercatat, dan makanan surplus tidak tersalurkan ke pihak yang bisa memakannya. Dampak lingkungannya sulit diukur karena tidak ada jejak data per batch.

**Solusi.** SmartSave adalah platform web yang: (1) mencatat setiap batch makanan dengan kategori, massa, dan **expiry otomatis** dari aturan masa simpan; (2) memberi **barcode unik** per record untuk pelacakan dan halaman publik; (3) menghubungkan surplus ke **Green Community** lewat alur donasi dan permintaan; (4) menghitung **estimasi CO₂e yang dihindari** memakai faktor emisi WRI yang dapat dikonfigurasi, dengan aturan ketat agar angka tidak menyesatkan; (5) mengingatkan pemilik sebelum expiry dan mendorong respons manual (donasi atau ambil).

**Prinsip kejujuran.** Sistem tidak boleh mengklaim kemampuan yang belum diimplementasikan dan diuji (AI, sensor, scheduler otomatis, kanal eksternal) **[Req §14.2]**. Setiap fitur simulasi diberi label simulasi di UI.

## 2. Tujuan dan sasaran

1. Mencegah limbah makanan dengan visibilitas stok, expiry, dan status per batch.
2. Menyalurkan makanan surplus ke Green Community melalui alur donasi yang tercatat dan dapat diaudit.
3. Menghitung serta melaporkan estimasi dampak karbon yang **konsisten, dapat ditelusuri, dan tidak digandakan**.
4. Memberi Manager alat konfigurasi (kategori, masa simpan, faktor emisi) dan monitoring tanpa hardcode.
5. Menjaga privasi: informasi personal hanya untuk pihak yang berkepentingan (pemilik record dan Manager).

**Non-tujuan (produk akhir di luar cakupan otomatis)** **[Req §14.2]**: smart locker fisik, Raspberry Pi, kamera AI, sensor suhu/kelembapan, alarm, pengukuran CO₂ ppm, payment gateway, pesan eksternal (email/push/SMS) dan machine learning prediksi expiry dari foto — tidak boleh dinyatakan aktif sebelum diimplementasikan dan diuji terpisah.

## 3. Peran pengguna dan hak akses **[Req §2, §17]**

| Peran | Kebutuhan utama | Hak akses ringkas |
|---|---|---|
| **User** | Daftar makanan, lihat inventori & detail, donasi surplus, ambil makanan, terima notifikasi expiry | Hanya record miliknya untuk data lengkap; halaman publik terbuka; wajib login untuk area aplikasi |
| **Manager** | Audit, konfigurasi kategori/masa simpan/faktor emisi, approve donasi & permintaan, monitoring expiry, laporan, activity log | Read-only atas semua record (tanpa kontrol ubah expiry); konfigurasi sistem; manajemen user & role |
| **Green Community** | Lihat donasi tersedia, submit permintaan, riwayat penerimaan | Hanya alur donasi/permintaan miliknya; tidak boleh membuka inventori user atau rute lain (Access Denied) |

Aturan istilah: label role selalu **"Green Community"** — larangan string "Food Waste Recipient" di UI **[style.md §5.13]**.

**Matriks akses informasi (wajib):**

| Informasi | Pemilik record | Manager | User lain | Green Community | Publik (tanpa login) |
|---|---|---|---|---|---|
| Nama, kategori, status, tanggal simpan | ✔ | ✔ | ✖ (peringatan) | ✖ | ✔ (tanpa nama pemilik) |
| Massa, locker, owner, expiry, detail CO₂e & faktor | ✔ | ✔ | ✖ | ✖ | ✖ |
| Grafik karbon agregat | ✔ | ✔ | ✔ | ✔ | ✔ (hanya agregat) |
| Barcode / ID record | ✔ | ✔ | ✔ (hasil scan → peringatan bila bukan miliknya) | ✖ | ✔ (lookup manual) |

## 4. Cakupan

### 4.1 Termasuk cakupan produk **[Req §14.1]**

- Website responsif desktop dan mobile.
- Registrasi, login, dan tiga role.
- Record makanan, kategori/subkategori, masa simpan otomatis, barcode, label, halaman Carbon Footprint.
- Donasi, permintaan Green Community, status, riwayat, pengelolaan oleh Manager.
- Dashboard, grafik, tabel, filter periode, ekspor CSV bila tersedia.
- Estimasi CO₂e dengan faktor yang dapat dikonfigurasi dan snapshot historis.
- Backend API, PostgreSQL, Prisma, validasi, autentikasi, otorisasi, audit log dasar.
- Scheduler backend untuk expiry dan notifikasi website.

### 4.2 Status prototipe saat ini (bukan produk akhir)

Prototipe yang berjalan sekarang adalah **UI interaktif frontend** (React 18 + TypeScript + Vite 5, state in-memori, data demo). Yang **masih simulasi** dan tidak boleh ditampilkan sebagai fitur aktif: autentikasi/otorisasi backend, database, scheduler notifikasi, deteksi freshness AI (berbasis nama berkas), pencetakan fisik, kanal notifikasi eksternal, dan sensor apa pun. Halaman lookup publik memang sengaja tanpa kamera; kamera scan hanya di area login (lihat FR-SCAN).

### 4.3 Ekstensi prototipe di luar requirement v1.5 (disetujui eksplisit)

1. **Wizard Register Food 5 langkah** (Choose compartment → Register food → Review estimate → Print label → Deposit complete) — dari `Create interactive prototype (7).make`.
2. **Virtual locker** — pemilihan compartment saat deposit, terikat ke record, kapasitas nyata di data demo; Manager dapat mengelola loker.
3. **Kamera browser** untuk scan barcode (User & Manager) dan foto saat Register Food.

Aturan requirement tetap menang di atas ekstensi ini: expiry otomatis/non-editable, faktor p90 per subkategori, foto = simulasi berlabel.

## 5. Sitemap **[Req §17, §17.1]**

| Kelompok | Halaman |
|---|---|
| Public | Landing / Home, About SmartSave, Sign Up / Sign In / Forgot–Reset, Public Barcode Lookup (`/barcode`), Public Carbon Footprint (`/carbon-footprint`) |
| User | User Dashboard, Register Food, My Food Inventory, Food Detail, Barcode / Print Label, Expiry Notifications, Food Donation, Donation History, Food Retrieval / Collection Status, Profile |
| Manager | Manager Dashboard, User & Role Management, Food & Inventory Management, Barcode Management, Donation Management, Green Community Requests, Expiry / Website Notification Monitoring, Category & Subcategory Configuration, Shelf-Life Rule Configuration, Emission Factor Configuration, Virtual Locker Management, Activity Logs, Environmental Reports, Profile |
| Green Community | GC Dashboard, Available Food Waste / Donations, My Requests / Request Status, Received / Distributed Food History, Profile |
| System | Unauthorized / Access Denied, Not Found |
| Prototipe | Scan Barcode (camera) — User & Manager saja |

Routing memakai pemeriksaan `canAccess` per role sebelum halaman dirender; pelanggaran → halaman Access Denied.

## 6. Fitur (functional requirements)

ID: `FR-<EPC>-<n>`. Rujukan bagian requirement disingkat `[Req §n]`.

### E1 — Autentikasi dan akun **[Req §12, §13]**

| ID | Kebutuhan |
|---|---|
| FR-AUTH-1 | Sign Up, Sign In, Forgot Password, Reset Password tersedia di shell publik/auth. |
| FR-AUTH-2 | Sesi demo memilih role (User/Manager/Green Community) untuk pratinjau; produk akhir memakai backend session/JWT. |
| FR-AUTH-3 | Area aplikasi wajib login; halaman publik tetap terbuka tanpa login. |
| FR-AUTH-4 | Otorisasi ditegakkan di routing dan di akses data per record (bukan sekadar sembunyikan menu). |

### E2 — Register Food **[Req §3, §4, §9, §19.1]**

| ID | Kebutuhan |
|---|---|
| FR-REG-1 | Formulir memakai cascading kategori → subkategori → subtype (bila kategori punya dependent subtype). |
| FR-REG-2 | Expiry dihitung otomatis dari aturan masa simpan kategori; **tidak dapat diedit atau diperpanjang**; perubahan kategori menghitung ulang expiry. |
| FR-REG-3 | Field buatan sistem (tanggal simpan, expiry, barcode) bersifat terkunci/readonly. |
| FR-REG-4 | Foto wajib; pemeriksaan freshness **berlabel simulasi** (tanpa klaim AI) **[Req §14.2]**; hasil pass/reject menentukan record boleh dibuat. |
| FR-REG-5 | Prototipe: Register Food adalah wizard 5 langkah; data record (kategori, nama, massa) diwajibkan di langkah "Register food"; filter di langkah locker bersifat opsional. |
| FR-REG-6 | Barcode unik dibuat per record (format demo `SS-nnnn`); label memuat ID, kategori, tanggal — tanpa data pribadi. |
| FR-REG-7 | Foto kamera (ekstensi): pengguna dapat membuka kamera inline dan menangkap frame sebagai foto; hasilnya melewati pemeriksaan simulasi yang sama seperti unggahan. |

### E3 — Virtual locker (ekstensi) **[prototype]**

| ID | Kebutuhan |
|---|---|
| FR-LOCK-1 | Setiap record dapat terikat ke compartment (`compartmentId` + label `RH-01 / A-01`). |
| FR-LOCK-2 | Compartment punya kategori, kapasitas (g), status (Available/Maintenance/Offline), suhu bertanda simulasi; pemilihan diblokir bila kategori tidak cocok, kapasitas kurang, atau status tidak tersedia. |
| FR-LOCK-3 | Kapasitas terpakai saat status record Stored / Available for Donation / Expired; dilepas saat Donated/Collected. |
| FR-LOCK-4 | Manager dapat mengelola loker (status, kapasitas, kategori); kapasitas tidak boleh diturunkan di bawah massa terisi. |
| FR-LOCK-5 | Kolom Locker tampil di inventori (dan CSV), Food Detail, dan label barcode. |

### E4 — Inventori dan Food Detail **[Req §4, §6.2, §17.1]**

| ID | Kebutuhan |
|---|---|
| FR-INV-1 | My Food Inventory: tabel dengan Quantity (g) + **Estimated CO₂e Avoided (kg CO₂e)** bersebelahan, status (termasuk turunan Expired dari waktu), pencarian, filter, ekspor CSV dengan kolom yang sama. |
| FR-INV-2 | Food Detail hanya untuk pemilik atau Manager; selain itu → Access Denied dengan pilihan kembali ke inventori atau membuka tampilan publik. |
| FR-INV-3 | Panel detail perhitungan (untuk yang berwenang): massa awal, massa terkonversi, faktor emisi, sumber & satuan faktor, rumus, estimasi CO₂e, tanggal, status data. |
| FR-INV-4 | Aksi status (Collect, Donasi) hanya untuk pemilik dan status yang sah; aksi tidak memperpanjang expiry. |

### E5 — Barcode, label, dan halaman publik **[Req §5, §6.1]**

| ID | Kebutuhan |
|---|---|
| FR-BC-1 | Setiap record punya barcode unik berkode **Code 128 nyata** (dapat dipindai kamera, bukan gambar hiasan); halaman Barcode / Print Label menampilkan label dan simulasi cetak. |
| FR-BC-2 | Public Barcode Lookup: input kode; hasil = identifier, kategori, status, tanggal simpan, pesan kontribusi, tautan ke Public Carbon Footprint. **Dilarang:** massa, owner, faktor, rumus, estimasi per record. |
| FR-BC-3 | Public Carbon Footprint: grafik agregat + disclosure estimasi; tanpa data per record dan tanpa data pribadi. |
| FR-BC-4 | Pesan kontribusi wajib (EN): "Thank you for contributing to carbon emission reduction through food waste prevention." |

### E6 — Scan barcode kamera (ekstensi) **[prototype; aturan privasi Req §5, §6.2]**

| ID | Kebutuhan |
|---|---|
| FR-SCAN-1 | Halaman Scan Barcode tersedia untuk **User dan Manager** (Green Community → Access Denied). |
| FR-SCAN-2 | Kamera memakai `getUserMedia` + Shape Detection API browser; tanpa API/izin/konteks aman → pesan jelas dan fallback input manual. |
| FR-SCAN-3 | Hasil scan: **pemilik record atau Manager** → panel verifikasi + detail lengkap + tautan Food Detail / Print Label. |
| FR-SCAN-4 | Hasil scan untuk **bukan pemilik** → peringatan "This barcode is not yours" dan hanya field non-pribadi yang tampil; massa, owner, locker, expiry, dan CO₂e tetap tersembunyi. |
| FR-SCAN-5 | Halaman lookup publik tetap input manual tanpa kamera. |

### E7 — Notifikasi expiry **[Req §10, §11]**

| ID | Kebutuhan |
|---|---|
| FR-NOTIF-1 | Pengingat **2 jam sebelum expiry** (bukan ½ jam), hanya jika scheduler dan kanal notifikasi dikonfigurasi. |
| FR-NOTIF-2 | Respons sebelum expiry bersifat **manual oleh User**: Donasi atau Ambil. **Tidak ada donasi otomatis** di requirement. |
| FR-NOTIF-3 | **1 jam setelah expiry tanpa respons** → tindak lanjut Manager wajib tercatat sesuai kebijakan yang disepakati. |
| FR-NOTIF-4 | Sistem dilarang mengklaim proses otomatis berjalan bila scheduler belum diimplementasikan. |
| FR-NOTIF-5 | Notifikasi hanya di dalam website (ikon bell + popover + halaman riwayat dengan status pengiriman). |
| FR-NOTIF-6 | Halaman User menampilkan record yang akan kedaluwarsa (countdown) dan yang sudah expired, plus contoh kebijakan §10/§11. |

### E8 — Donasi, permintaan, dan pengambilan **[Req §10, §17.1, §18]**

| ID | Kebutuhan |
|---|---|
| FR-DON-1 | User membuat donasi dari record eligible (Stored, belum expired); status donasi: Pending / Completed / Cancelled. |
| FR-DON-2 | Green Community melihat donasi tersedia, submit permintaan, dan melihat status/riwayat; permintaan: Pending / Approved / Rejected (+alasan). |
| FR-DON-3 | Manager mengelola donasi dan permintaan (approve/reject) dan mencatat distribusi. |
| FR-DON-4 | Pengambilan (collection) oleh User mencatat massa yang diambil dengan disclosure asumsi konsumsi (tidak terbukti). |
| FR-DON-5 | Perubahan status tidak menghitung ulang ulang event karbon yang sudah tercatat (lihat FR-CO2-4). |

### E9 — Manajemen Manager **[Req §3, §11, §17.1, §19]**

| ID | Kebutuhan |
|---|---|
| FR-MGR-1 | User & Role Management: daftar user, peran, organisasi (bila ada). |
| FR-MGR-2 | Category & Subcategory Configuration: CRUD kategori/subkategori termasuk dependent subtype. |
| FR-MGR-3 | Shelf-Life Rule Configuration: aturan masa simpan per kategori/subkategori; record lama **tetap memakai snapshot** aturan saat dibuat; label "demo rule" di UI. |
| FR-MGR-4 | Emission Factor Configuration: tabel faktor WRI (pemetaan, sumber, faktor, rentang persentil, satuan, tanggal berlaku, status); tanpa kontrol ubah expiry per item. |
| FR-MGR-5 | Food & Inventory Management: semua record read-only + audit; expiry hanya tampilan teks. |
| FR-MGR-6 | Expiry / Website Notification Monitoring: item, status notifikasi/pengiriman, tindak lanjut; expired > 1 jam tanpa respons diberi penanda danger. |
| FR-MGR-7 | Activity Logs dan Environmental Reports (grafik + tabel + filter periode + CSV bila tersedia). |

### E10 — Dashboard dan laporan **[Req §8]**

| ID | Kebutuhan |
|---|---|
| FR-DASH-1 | Dashboard per role: kartu massa (g) + Estimated CO₂e Avoided (kg CO₂e) + ringkasan role; grafik dan tabel Quantity + CO₂e. |
| FR-DASH-2 | Filter periode Daily / Monthly / Yearly berlaku serentak ke kartu, tabel, grafik, dan CSV. |
| FR-DASH-3 | Tidak ada kartu ppm kecuali sensor nyata tersedia **[Req §14.2]**. |

### E11 — Perhitungan CO₂e **[Req §7, §18, §19.2, §19.4]**

| ID | Kebutuhan |
|---|---|
| FR-CO2-1 | Estimasi = massa (g ÷ 1000) × faktor p90 per subkategori (WRI); faktor dan satuan disimpan sebagai snapshot pada record. |
| FR-CO2-2 | Faktor/unit tidak cocok atau tidak dikonfigurasi → tampil "Emission factor not configured" / "Unable to calculate" — **angka 0 dilarang**. |
| FR-CO2-3 | Hanya peristiwa yang memenuhi syarat (lihat aturan per peristiwa, §18) yang menghasilkan angka CO₂e. |
| FR-CO2-4 | `claimKey` per (record, jenis peristiwa) menjamin satu massa tidak dihitung dua kali meski status berubah. |
| FR-CO2-5 | Semua angka yang ditampilkan ke pengguna non-teknis diberi disclosure metodologi. |

### E12 — Status sistem dan pola UI **[Req §17.1, §15]**

| ID | Kebutuhan |
|---|---|
| FR-UI-1 | Setiap alur punya state loading, empty, error, success, dan unauthorized yang konsisten. |
| FR-UI-2 | Semua label UI berbahasa Inggris; istilah persis dari requirement (lihat `style.md` §7). |
| FR-UI-3 | Responsif: desktop dan mobile (sidebar menjadi drawer). |

## 7. Aturan bisnis kunci (ringkasan)

| ID | Aturan |
|---|---|
| BR-1 | Expiry = tanggal simpan + masa simpan kategori; tidak editable; snapshot aturan dipertahankan untuk record lama. |
| BR-2 | Timeline expiry: T-2 jam pengingat → respons manual User (donasi/ambil) → T+1 jam tanpa respons → tindak lanjut Manager tercatat. **Tanpa donasi otomatis.** |
| BR-3 | CO₂e hanya untuk peristiwa memenuhi syarat, faktor p90 per subkategori, satuan cocok, tanpa angka nol, tanpa double counting. |
| BR-4 | Data personal (nama pemilik, massa, locker, detail hitung) hanya untuk pemilik dan Manager; publik hanya non-pribadi. |
| BR-5 | Fitur yang belum diimplementasikan tidak boleh dinyatakan aktif; simulasi diberi label simulasi/demo. |
| BR-6 | "Green Community" adalah satu-satunya istilah untuk penerima donasi. |
| BR-7 | Kapasitas loker: terpakai saat record masih "di dalam loker" (Stored/Available for Donation/Expired); dilepas saat Donated/Collected. |

## 8. Kebutuhan non-fungsional

| ID | Kebutuhan |
|---|---|
| NFR-1 | Responsif pada desktop (≥1200px) dan mobile (≤760px); target dukung 360px. |
| NFR-2 | Keamanan produk akhir: autentikasi backend, otorisasi per record di API (bukan hanya UI), audit log, hash kata sandi, proteksi input. |
| NFR-3 | Privasi publik: endpoint publik tidak mengembalikan field pribadi sama sekali (enforce di API, bukan sekadar disembunyikan di UI). |
| NFR-4 | Konsistensi angka: massa `g`/`kg`, CO₂e `kg CO₂e`; CSV memakai label dan satuan yang sama dengan layar. |
| NFR-5 | Aksesibilitas dasar: label form, `role="alert"` untuk error, status tidak hanya dengan warna (teks selalu ada). |
| NFR-6 | Kinerja: prototipe cukup ringan (satu bundle); produk akhir memuat data per halaman. |
| NFR-7 | Jejak audit: perubahan konfigurasi Manager dan aksi status tercatat di Activity Logs. |

## 9. Model data ringkas

Entitas inti: `Account` (role, organisasi), `FoodItem` (kategori/sub/subtype, massa, storedAt, expiresAt + snapshot aturan, status, barcode, compartmentId, owner, factorSnapshot), `VirtualCompartment`, `Donation` (foodIds, status, allocatedTo), `GcRequest` (donationId, status, alasan), `CarbonImpactEvent` (claimKey, type, co2eKg, factorState, methodology), `NotificationEvent` (kind reminder-2h / expired-followup / system, delivery, read), `ActivityLog`.

Status makanan: `Stored → Available for Donation → Donated`, `Stored → Collected`, `Stored → Expired` (turunan waktu maupun eksplisit).

## 10. Kriteria penerimaan (ringkas) **[Req §15, §19.3]**

1. Seluruh sitemap dapat dibuka sesuai role; pelanggaran menampilkan Access Denied.
2. Register Food menghasilkan record dengan expiry otomatis yang benar per kategori dan barcode unik; expired tidak dapat diedit lewat UI apa pun, termasuk oleh Manager.
3. Public lookup dan Public Carbon Footprint tidak membocorkan massa, owner, faktor, atau estimasi per record (uji: bandingkan payload/layar dengan matriks §3 dokumen ini).
4. Alur donasi lengkap: User membuat donasi → GC request → Manager approve → status dan riwayat konsisten di ketiga role.
5. Perhitungan CO₂e konsisten di dashboard, detail, tabel, dan CSV; record tanpa faktor cocok menampilkan status tanpa angka.
6. Timeline notifikasi sesuai FR-NOTIF-1..4 (uji dengan record yang jatuh tempo 90 menit dan record yang kedaluwarsa 30 menit lalu di prototipe demo).
7. Scan barcode: pemilik/Manager melihat detail; user lain melihat peringatan + hanya field non-pribadi.
8. Tidak ada layar yang mengklaim fitur nonaktif (AI, sensor, notifikasi eksternal, kamera backend) sebagai berjalan.

## 11. Status prototipe (peta jujur)

| Area | Status di prototipe | Menuju produk akhir |
|---|---|---|
| UI, routing, role, sitemap | Aktif (in-memory) | Pertahankan; pindahkan state ke API |
| Data demo (akun, makanan, donasi) | Seed statis + aksi mengubah state sesi | Ganti PostgreSQL + Prisma |
| Expiry otomatis, snapshot aturan | Aktif | Pertahankan di backend |
| CO₂e p90 + claimKey | Aktif dengan dataset WRI | Faktor dari DB, validasi unit di API |
| Notifikasi 2 jam / tindak lanjut 1 jam | Simulasi tampilan + timeline kebijakan | Scheduler backend + kanal (tetap tanpa donasi otomatis) |
| Foto freshness | Simulasi nama berkas berlabel | Implementasi terpisah bila disetujui (**Req §14.2**) |
| Kamera scan barcode & foto | Aktif via API browser (Chromium); fallback manual | Pertahankan client-side; tanpa unggahan |
| Autentikasi | Demo role-switch | Backend session/JWT, hash kata sandi |
| Virtual locker | Aktif sebagai data demo | Kebutusan stakeholder: lanjut sebagai fitur resmi atau tidak |
| Cetak label | Simulasi layar | Integrasi cetak opsional |

## 12. Risiko, ketergantungan, dan pertanyaan terbuka

**Risiko**
- Ketergantungan API browser untuk scan (`BarcodeDetector` hanya di Chromium) — sudah dimitigasi dengan fallback manual.
- Ekspektasi "donasi otomatis" yang tidak ada di requirement — dikunci di BR-2 dan FR-NOTIF-4; perlu konfirmasi stakeholder bila diusulkan kembali.
- Angka CO₂e disalahartikan sebagai pengukuran nyata — dikunci dengan disclosure wajib dan larangan angka nol.

**Ketergantungan**
- Faktor emisi WRI dan unitnya (kg vs liter) — beberapa subkategori tidak akan pernah menghasilkan angka tanpa faktor unit yang cocok.
- Kebijakan internal (tindak lanjut Manager pasca-expiry, masa simpan per kategori) harus disepakati sebelum produksi.

**Pertanyaan terbuka**
1. Apakah virtual locker dan wizard 5 langkah dipertahankan sebagai fitur resmi di requirement berikutnya?
2. Kanal notifikasi website saja, atau ada rencana kanal eksternal di rilis terpisah?
3. Siapa pemilik kebijakan tindak lanjut Manager T+1 jam dan di mana kebijakan itu ditulis?

## 13. Referensi

| Berkas | Peran |
|---|---|
| `SMARTSAVE_REQUIREMENT_WEBSITE_REVISI_V1_5_RAPI.docx` | Sumber otoritatif kebutuhan (v1.5) |
| `flow.md` | 14 diagram alur Mermaid yang mengikuti requirement |
| `style.md` | Token desain, pola komponen, aturan copy, catatan di luar requirement |
| `Create interactive prototype (7).make` | Asal keputusan wizard & virtual locker |
| Prototipe React (`src/`) | Implementasi UI yang sedang berjalan |

---

*PRD ini adalah ringkasan produk yang dapat direview; untuk detail normatif (kata per kata) terus merujuk ke requirement DOCX v1.5.*
