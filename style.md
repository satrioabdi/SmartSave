# SmartSave — Style Guide

Dua sumber, dengan pembagian tugas yang jelas:

- **Tampilan (token, tipografi, spasi, pola komponen)** diambil dari `Create interactive prototype 7.make` (Figma Make, React 19 + Vite + Tailwind CSS v4), terutama `src/index.css` dan `src/App.tsx`.
- **Isi, halaman, role, dan aturan tampil** mengikuti `SMARTSAVE_REQUIREMENT_WEBSITE_REVISI_V1_5_RAPI.docx`. Jika prototype dan requirement berbeda, requirement yang dipakai.

Yang sengaja **tidak** dibawa dari prototype karena tidak ada di requirement: scanner kamera, akun demo, ilustrasi locker di halaman auth, faktor emisi tunggal 0,76, dan nama role "Food Waste Recipient". Pemilihan compartment locker, stepper deposit 5 langkah, dan kartu locker/maintenance **kini dibawa dari prototype** atas permintaan eksplisit (Bagian 5.15) — tetap diberi label simulasi karena tidak ada hardware.

Angka bagian (misalnya "Bagian 8") merujuk ke nomor section di requirement. Hal yang saya tambahkan di luar requirement ditandai **[tambahan]** dan dikumpulkan di bagian 9.

---

## 1. Prinsip dari requirement

| Aturan | Sumber |
|---|---|
| Seluruh UI berbahasa Inggris: Sign Up, Sign In, dashboard, Register Food, tabel, grafik, notifikasi, laporan | 19.3 |
| Website responsif untuk desktop dan mobile | 1 |
| Role tampil sebagai **User**, **Manager**, **Green Community** di navigasi, dashboard, formulir, riwayat, dan laporan | 2.3, 15 |
| Massa selalu dalam gram (**g**), dampak selalu dalam **kg CO₂e**, dengan satuan eksplisit | 4, 8 |
| Jika faktor emisi belum valid: tampilkan "Emission factor not configured" atau "Unable to calculate", bukan angka nol | 6.2, 7 |
| CO₂e adalah estimasi; sertakan penjelasan bahwa ini bukan pengukuran langsung | 6, 7 |
| CO₂ ppm tidak boleh tampil kecuali ada sensor nyata, dan jika ada, diberi label terpisah "Measured CO₂ Concentration (ppm)" | 7, 8 |
| Halaman publik tidak menampilkan data pribadi | 5, 6.1 |
| Fitur simulasi diberi label demo | 5, 14.2 |
| Kamera AI, sensor, Raspberry Pi, alarm, dan smart locker fisik tidak boleh tampil seolah aktif | 1, 13, 14.2 |
| Expiry terisi otomatis dan tidak dapat diubah oleh User maupun Manager | 9, 15 |
| Setiap tabel ber-kolom Quantity wajib punya kolom Estimated CO₂e Avoided (kg CO₂e) di dekatnya | 8 |
| Nilai CO₂e dihitung dari data, bukan ditulis statis | 8, 15 |

---

## 2. Design tokens (dari prototype)

### 2.1 Warna inti

| Token | Hex | Pemakaian |
|---|---|---|
| `--green` | `#186b4d` | Aksen utama, tombol primary, link, item aktif, ikon sukses |
| `--green-dark` | `#10563d` | Hover tombol primary |
| `--green-soft` | `#eaf4ee` | Latar item aktif, badge sukses, avatar |
| `--navy` | `#142d3e` | Judul, angka metrik, teks tebal, toast |
| `--ink` | `#263e4c` | Teks isi |
| `--muted` | `#607480` | Teks sekunder, label, header tabel |
| `--line` | `#dfe7e8` | Border dan pemisah |
| `--canvas` | `#f5f7f8` | Latar halaman, hover, header tabel |
| `--white` | `#ffffff` | Kartu, panel, sidebar, input |
| `--blue` | `#49728e` | Info, role Manager, notice |
| `--blue-soft` | `#edf3f7` | Latar info |
| `--amber` | `#94620c` | Peringatan, role Green Community, expiring |
| `--amber-soft` | `#fff5de` | Latar peringatan |
| `--red` | `#af3e3e` | Bahaya, expired, error |
| `--red-soft` | `#fceded` | Latar error |

Warna pendukung: `#225f43` (teks badge sukses), `#bddac9` (border strip sukses), `#ead59e` (border panel amber), `#efc7c7` (border pesan error), `#378766` / `#78a988` / `#75ab91` (gradasi daun dan batang grafik), `#edf5ef` / `#dceee4` (latar pratinjau makanan), `#0f573e` / `#123b35` (gradasi panel visual halaman auth), `#b8ddca` / `#c9ddd5` / `#9fc5b5` / `#80bda0` (teks dan ornamen di atas hijau gelap).

### 2.2 Warna per role

| Role | Warna | Pemakaian |
|---|---|---|
| User | `--green` / `--green-soft` | Avatar, penanda role, badge role |
| Manager | `--blue` / `--blue-soft` | Sama |
| Green Community | `--amber` / `--amber-soft` | Sama |

### 2.3 Warna per status

Komponen `.badge` memakai lima varian. Pemetaan status requirement (Bagian 4 dan 17.1) ke varian:

| Varian | Latar | Teks | Status |
|---|---|---|---|
| `success` | `--green-soft` | `#225f43` | Stored, Approved, Completed |
| `info` | `--blue-soft` | `--blue` | Available for Donation, Pending (donasi), label "Simulation" |
| `warning` | `--amber-soft` | `--amber` | Expiring Soon (dalam jendela pengingat 2 jam), Pending (permintaan), Emission factor not configured |
| `danger` | `--red-soft` | `--red` | Expired, Rejected, Cancelled |
| `neutral` | `--canvas` | `--muted` | Donated, Collected, status lain yang sudah selesai |

Pemetaan ini mengikuti pola prototype (Stored = success, Expiring Soon = warning, Expired = danger, lainnya neutral; Approved dan Completed = success, Rejected = danger, lainnya warning). Status "Available for Donation", "Donated", "Collected", dan "Cancelled" tidak ada di prototype, jadi pemetaannya **[tambahan]**.

### 2.4 Tipografi

Font: **Inter** (400, 600, 700), fallback `Arial, sans-serif`. Prototype memuatnya dari host statis Figma dengan nama family terpisah per bobot (`Inter:Regular`, `Inter:Semi Bold`, `Inter:Bold`). Untuk proyek baru cukup satu family `Inter` dengan tiga bobot.

| Peran | Ukuran | Bobot | Catatan |
|---|---|---|---|
| H1 halaman | 30px | 600 | letter-spacing -0.025em, line-height 1.25, navy |
| H1 hero (auth, landing) | `clamp(38px, 4.2vw, 64px)` | 600 | letter-spacing -0.045em, line-height 1.03 |
| Judul kartu auth | 30px | 600 | letter-spacing -0.03em |
| Judul halaman sukses | 27px | 600 | |
| Nilai besar (misalnya tanggal expiry) | 28px | 600 | |
| Angka metrik | 25px | 600 | |
| Judul label barcode | 24px | 600 | |
| Brand | 22px (app), 24px (auth) | 700 | letter-spacing -0.03em |
| H2 panel | 21px | 600 | |
| Judul kartu | 18px | 600 | |
| H3 | 16px | 600 | |
| Isi dan form | 13px | 400 | line-height 1.55 untuk paragraf |
| Tombol, nav | 13px | 600 (nav aktif), 400 | |
| Teks tabel, detail | 11–12px | 400 | |
| Label field | 11px | 600 | muted |
| Badge | 10px | 600 | |
| Eyebrow, kicker | 10px | 600 | letter-spacing 0.1em, hijau |
| Header tabel | 9px | 600 | uppercase, letter-spacing 0.04em |

### 2.5 Spasi, radius, bayangan, z-index, gerak

| Kelompok | Nilai |
|---|---|
| Gap | 4px (nav, detail), 8px (tombol, ikon), 12px, 16px (metrik), 18px (form), 20px (grid utama) |
| Padding kartu | 20px (metrik), 24px, 26px (expiration), 28px (panel) |
| Padding halaman | 32px desktop; `22px 16px 30px` mobile |
| Sidebar | 224px (210px ≤1080px; drawer 275px ≤760px), padding `28px 24px` |
| Topbar | 76px desktop, 66px mobile, padding `0 32px` / `0 16px` |
| Lebar konten maks | 1440px |
| Radius | 7px select kecil; 8px tombol, input, nav, notice; 9–10px toast, role option; 12px kartu, panel, tabel, popover; 14px modal; 999px badge; 50% avatar dan dot |
| `--card-shadow` | `0 2px 5px rgba(20, 45, 62, 0.04)` |
| `--shadow` | `0 10px 30px rgba(20, 45, 62, 0.08)` (popover, modal, toast, drawer) |
| Kartu terpilih | border `--green` + `0 0 0 2px rgba(24, 107, 77, 0.08)` |
| Ring fokus | `outline: 3px solid rgba(24, 107, 77, 0.2); outline-offset: 2px` |
| Z-index | topbar 20, backdrop 25, sidebar 30, popover 40, modal 60, toast 80 |
| Transisi | 160ms ease; drawer 220ms; munculnya konten `reveal` 280ms (`opacity 0 → 1`, `translateY(8px → 0)`); tombol ditekan `translateY(1px)` |

---

## 3. Shell dan layout

### 3.1 App shell (setelah login: User, Manager, Green Community)

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │ Topbar 76px: breadcrumb ... bell | profil │
│ 224px    ├──────────────────────────────────────────┤
│ fixed    │ .page (maks 1440px, padding 32px)        │
│          │  eyebrow + H1 + deskripsi ...  [aksi]    │
│ brand    │  konten (grid gap 20px)                  │
│ nav      │  footer 10px muted                       │
│ meta     │                                          │
└──────────┴──────────────────────────────────────────┘
```

- Sidebar putih, border kanan `--line`; brand "SmartSave" 22px bold navy; item nav 13px; item aktif berteks hijau semibold dengan dot hijau 8px.
- Topbar: breadcrumb 12px muted di kiri; di kanan tombol notifikasi (ikon bell 20px, dot merah 8px bila ada notifikasi belum dibaca) dan trigger profil (avatar 30px + nama). Popover muncul 12px di bawah trigger.
- Di layar ≤760px sidebar menjadi drawer dengan backdrop dan tombol menu tiga garis.

### 3.2 Navigasi per role (dari sitemap Bagian 17)

| Role | Item navigasi |
|---|---|
| User | User Dashboard · Register Food · My Food Inventory · Barcode / Print Label · Expiry Notifications · Food Donation · Donation History · Food Retrieval / Collection Status · Profile / Account Settings |
| Manager | Manager Dashboard · User and Role Management · Food & Inventory Management · Category & Subcategory Configuration · Shelf-Life Rule Configuration · Emission Factor Configuration · Barcode Management · Donation Management · Green Community Requests · Expiry / Website Notification Monitoring · Activity Logs · Environmental Reports · Profile / Settings |
| Green Community | Green Community Dashboard · Available Food Waste / Donations · My Requests · Request Status · Received / Distributed Food History · Profile / Account Settings |

Food Detail dan Donation Detail dibuka dari daftar, bukan sebagai item nav. Manager memiliki 13 item, jadi kelompokkan di sidebar dengan eyebrow (misalnya Operations, Configuration, Reports) **[tambahan]**.

### 3.3 Shell publik (tanpa sidebar)

Dipakai untuk Landing / Home, About SmartSave, Public Barcode Lookup, dan Public Carbon Footprint.

- Topbar sederhana: brand di kiri; tautan Sign In dan Sign Up (tombol secondary dan primary) di kanan.
- Konten terpusat dalam `.page` (maks 1440px; untuk halaman baca gunakan maks 800px **[tambahan]**).
- Tidak ada elemen data pribadi, nama User, atau nama penerima.

### 3.4 Shell auth (Sign Up, Sign In, Forgot / Reset Password)

Dua kolom `0.9fr / 1.1fr`:

- **Kiri:** panel hijau gelap (gradasi `#0f573e` → `#123b35` + radial putih 13% di kanan atas), padding `46px 56px`. Isi: brand 24px, kicker `#b8ddca` 10px letter-spacing 0.13em, H1 hero, paragraf 15px `#c9ddd5`. Ilustrasi locker di prototype diganti ilustrasi netral (misalnya bentuk daun dari komponen `.leaf`) karena smart locker fisik di luar scope **[tambahan]**.
- **Kanan:** latar `--canvas`, kartu maks 500px. Judul 30px, deskripsi 13px muted, field `.control`, tautan "Forgot password" hijau 11px rata kanan, tombol submit penuh lebar.
- Sign Up: pilihan role memakai `.role-option` (kartu putih, aktif = `--green-soft` + border hijau) dengan nama role sesuai requirement; kolom password confirmation; consent bila diperlukan.
- State: `.auth-error` (merah-soft) untuk gagal login atau validasi; `.auth-message` (hijau-soft) untuk konfirmasi reset password.
- ≤760px: panel kiri disembunyikan atau diperkecil, form satu kolom.

### 3.5 Pola grid

| Class | Kolom | Dipakai untuk |
|---|---|---|
| `form-layout` | `1.55fr / 0.65fr` | Form + panel foto (Register Food) |
| `review-layout`, `label-layout` | `0.8fr / 1.2fr` | Ringkasan expiry, label cetak |
| `dashboard-grid` | `1.5fr / 0.7fr` | Grafik + aktivitas |
| `metrics-grid` | 4 kolom (varian 3) | Kartu metrik |
| `donation-grid` | 3 kolom | Kartu donasi tersedia |
| `alert-grid`, `report-grid` | 2 kolom | Kartu expiry, grafik laporan |
| `form-grid` | 2 kolom, gap 18px | Field form (`.control--wide` = lebar penuh) |

### 3.6 Breakpoint

| Lebar | Perubahan |
|---|---|
| ≤ 1080px | Sidebar 210px; grid 3 kolom menjadi 2; metrik menjadi 2 kolom |
| ≤ 760px | Sidebar menjadi drawer; breadcrumb dan nama profil disembunyikan; padding halaman 22/16px; form, laporan, toolbar menjadi satu kolom; tombol aksi penuh lebar |
| print | Sidebar, topbar, judul halaman, panel cetak, baris aksi, dan footer disembunyikan; kartu label dicetak sendiri dengan border navy tanpa bayangan |

---

## 4. Komponen dasar

### 4.1 Tombol (`.button`)

Tinggi min 42px, padding `0 16px`, radius 8px, 13px semibold, gap 8px, ikon 16px.

| Varian | Latar | Border | Teks | Hover |
|---|---|---|---|---|
| `primary` | `--green` | `--green` | putih | `--green-dark` |
| `secondary` | putih | `--line` | `--navy` | `--canvas` |
| `ghost` | transparan | transparan | `--muted` | `--canvas` |
| disabled | `--canvas` | `--line` | `--muted` | `not-allowed` |

Tombol di dalam tabel: tinggi 34px, teks 10px, padding `0 11px`.

### 4.2 Form (`.control`)

Label 11px semibold muted di atas input. Input, select, dan textarea: putih, border `--line`, radius 8px, tinggi min 46px, padding `11px 13px`, teks 13px navy; fokus mengganti border menjadi `--green`. Sufiks satuan (`.input-suffix`, misalnya `g`) 12px muted di kanan. Checkbox dan switch memakai `accent-color: var(--green)`, ukuran 17px.

### 4.3 Kartu dan panel

`.panel`, `.estimate-card`, `.label-card`, `.metric-card`: putih, border `--line`, radius 12px, `--card-shadow`. Kartu metrik: tinggi min 152px, padding 20px, ikon bulat 22px dengan ring 6px warna soft (hijau, amber, biru), angka 25px semibold navy, keterangan 10px muted.

### 4.4 Badge, notice, dan pesan

| Komponen | Gaya | Dipakai untuk |
|---|---|---|
| `.badge` | Pill, 10px semibold, padding `6px 9px`, 5 varian | Status makanan, donasi, permintaan, role |
| `.notice` | Latar `--blue-soft`, teks `--blue`, radius 8px, padding 16px | Informasi umum |
| `.simulation-banner` | Latar `--blue-soft`, teks `--blue`, 11px | Label demo untuk fitur simulasi (pemeriksaan foto, scan) |
| `.analytics-note` | Sama dengan banner | Disclosure estimasi CO₂e |
| `.safety-notice` | Latar `--amber-soft`, teks `--amber`, 11px | Peringatan (misalnya aturan masa simpan adalah aturan demo) |
| `.policy-box` | Latar `--red-soft`, teks `--red`, 11px | Aturan yang melarang (misalnya expiry tidak dapat diperpanjang) |
| `.success-strip` | Latar `--green-soft`, border `#bddac9`, teks hijau | Hasil sukses inline |
| `.confirmation-panel` | Latar `--amber-soft`, border `#ead59e`, teks amber | Konfirmasi tindakan |
| `.scan-error`, `.auth-error` | Latar `--red-soft` (+ border `#efc7c7` untuk scan) | Error |
| `.toast` | Latar navy, teks putih 12px, radius 9px, tengah bawah 24px | Hasil aksi singkat |
| `.empty-state` | Border putus-putus `--line`, 11px muted, tinggi min 180px | Daftar atau tabel kosong |

### 4.5 Tabel (`.table-wrap` + `.data-table`)

Pembungkus putih, border, radius 12px, `--card-shadow`, `overflow-x: auto`. Tabel lebar min 780px. Header: latar `--canvas`, 9px semibold muted uppercase, padding `13px 16px`. Sel: 11px ink, border-top `--line`, padding `15px 16px`. Baris kosong: padding 34px, teks tengah muted. Toolbar pencarian dan filter (`.toolbar`): putih, border, radius 10px, padding 12px, input berlatar `--canvas`.

### 4.6 Indikator dan lainnya

- `.countdown`: tiga kotak (jam, menit, detik) berlatar `--canvas`, angka 22px semibold, label 8px uppercase.
- `.mini-chart`: batang vertikal, gradasi `--green` → `#75ab91`, radius atas 4px, gap 9px, tinggi 175px (120px pada laporan), garis dasar `--line`; legenda 10px muted.
- `.activity-item`: dot 8px (hijau, biru, amber), judul 11px navy, waktu 9px muted, pemisah `--line`.
- `.checklist`: lingkaran 26px `--green-soft` berisi centang hijau + teks 12px.
- Modal: overlay `rgba(20, 45, 62, 0.4)` + blur 5px; kartu putih maks 440px, radius 14px, padding 32px, `--shadow`.

---

## 5. Komponen khusus SmartSave (berdasarkan requirement)

Komponen berikut disusun dari pola dan token di atas. Bentuk visualnya **[tambahan]** karena prototype tidak punya padanan langsung; aturan isinya berasal dari requirement.

### 5.1 Cascading category select (Register Food, Bagian 3 dan 19.1)

- Dua `.control` select berurutan: **Food Category**, lalu **Food Subcategory** (nonaktif sampai kategori dipilih; opsi mengikuti kategori terpilih).
- Untuk kategori Prepared and Cooked Food, subkategori Protein dan Carbohydrate memiliki pilihan turunan (dependent subtype); tampilkan sebagai select ketiga atau grup bertingkat.
- Opsi memakai nama bahasa Inggris dari tabel Bagian 3 (Fruit, Vegetables, Beverages, Prepared and Cooked Food, Dark Chocolate, Black Coffee Beans, Cane Sugar, Beet Sugar, Palm Oil, Soybean Oil, Olive Oil, Canola and Sunflower Oil, Spices, Onions and Related Items).

### 5.2 Field otomatis dan terkunci (Bagian 4 dan 9)

Created / Stored At dan Expiration Date & Time bersifat otomatis dan tidak dapat diubah.

- Tampilkan di `.estimate-card`: label eyebrow hijau, nilai 28px semibold navy, jam 12px muted.
- Di bawahnya `.policy-box`: "Expiry is calculated automatically from the category rule and cannot be edited or extended."
- Jangan gunakan input yang bisa diedit untuk dua field ini.

### 5.3 Upload foto dan pemeriksaan foto (Bagian 9)

- Tombol upload (`.button--secondary`) dengan input file tersembunyi; status berkas memakai `.file-status` (latar `--green-soft`, ikon centang 18px).
- Hasil pemeriksaan foto adalah simulasi: tampilkan `.simulation-banner` dengan teks "Simulation only. Real AI freshness detection is not part of the initial scope."
- Jika terdeteksi basi atau expired: `.scan-error` (merah-soft) dengan pesan penolakan dan tidak ada tombol lanjut.

### 5.4 Nilai CO₂e (`CarbonValue`)

Satu komponen tunggal untuk semua tempat yang menampilkan CO₂e: kartu, tabel, label, dan detail.

| Keadaan | Tampilan |
|---|---|
| Valid | Angka + satuan, misalnya `0.60 kg CO₂e`, navy semibold |
| Faktor belum valid | `.badge--warning` berteks "Emission factor not configured" |
| Satuan faktor tidak cocok dengan massa | `.badge--warning` berteks "Unable to calculate" |
| Dilarang | `0`, `0.00`, tanda strip kosong tanpa penjelasan |

Format angka bahasa Inggris (titik desimal, misalnya `2.40`), dua desimal untuk CO₂e **[tambahan]**.

### 5.5 Disclosure estimasi (`.analytics-note`)

Dipasang dekat setiap angka CO₂e. Teks: "Estimate based on the configured emission factor; not a direct measurement." Pada peristiwa konsumsi tambahkan: "Food taken by a User is assumed to be consumed; this is not proof of actual consumption." (Bagian 18).

### 5.6 Barcode dan label (Bagian 5)

- `.label-card`: border-top 5px hijau, maks 510px, padding 28px. Isi: brand, nama makanan 24px, meta (Food ID, kategori, tanggal), barcode, pesan kontribusi.
- Barcode: batang **Code 128 asli** (render SVG via JsBarcode) warna navy, tinggi 78px, maks lebar 360px — harus benar-benar dapat dipindai kamera, bukan hiasan. ID di bawahnya 11px, letter-spacing 0.24em. Barcode hanya berisi ID atau URL unik, tanpa data pribadi.
- Pesan kontribusi (wajib bahasa Inggris): "Thank you for contributing to carbon emission reduction through food waste prevention."
- Halaman detail makanan untuk pengguna berwenang menambahkan di bawah pesan: `Estimated carbon contribution: 2.40 kg CO₂e` (komponen `CarbonValue`), rumus, faktor, satuan, sumber, dan disclosure.
- Cetak: lihat aturan print di bagian 3.6.

### 5.7 Halaman publik: barcode lookup dan Carbon Footprint (Bagian 5 dan 6.1)

| Halaman | Isi yang boleh | Yang dilarang |
|---|---|---|
| Public Barcode Lookup | Input atau scan ID, hasil: identifier, kategori, status, pesan kontribusi, tautan ke Public Carbon Footprint | Massa, faktor, rumus, estimasi per record, nama User atau penerima |
| Public Carbon Footprint | Grafik kontribusi karbon agregat (`.mini-chart` atau grafik setara), disclosure estimasi | Tabel per record, data pribadi, detail perhitungan |

Input scan memakai `.scan-controls` (input + tombol). Halaman publik tetap input manual tanpa kamera; pemindaian kamera untuk User dan Manager ada di halaman Scan Barcode (bagian 5.16).

### 5.8 Detail perhitungan (Bagian 6.2)

Panel `.panel` di Food Detail untuk pengguna berwenang, berisi daftar `.summary-list` (label muted kiri, nilai navy semibold kanan):

| Baris | Contoh nilai |
|---|---|
| Initial mass | `2,000 g` |
| Converted mass | `2.00 kg` |
| Emission factor | `1.2 kg CO₂e/kg` |
| Factor source and unit | `WRI Indonesia, per kg food` |
| Formula | `(Food Mass (g) ÷ 1000) × Emission Factor` |
| Estimated CO₂e | `CarbonValue` |
| Period / date | tanggal peristiwa |
| Data status | badge status data |

### 5.9 Tabel Quantity + CO₂e (Bagian 8)

Setiap tabel yang punya kolom Quantity (inventori, donasi, permintaan, riwayat, laporan) menaruh kolom **Estimated CO₂e Avoided (kg CO₂e)** tepat di sebelahnya. Header kolom Quantity memakai "Quantity (g)". Sel CO₂e memakai `CarbonValue`. Ekspor CSV memakai label dan satuan yang sama.

### 5.10 Dashboard (Bagian 8)

- Baris `metrics-grid` per role: massa (g) dan Estimated CO₂e Avoided (kg CO₂e), ditambah ringkasan role (inventori dan status untuk User; donasi dan permintaan untuk Manager; massa diterima untuk Green Community).
- Filter periode **Daily / Monthly / Yearly**: segmented control atau select di `.toolbar`, berlaku untuk kartu, tabel, grafik, dan CSV sekaligus. Tombol "Export CSV" (secondary) hanya tampil bila fitur tersedia.
- Jangan tampilkan kartu ppm kecuali sensor nyata tersedia; jika ada, kartu terpisah berlabel "Measured CO₂ Concentration (ppm)".

### 5.11 Notifikasi website (Bagian 10 dan 11)

- Notifikasi hanya di dalam website; tidak ada mockup email atau push.
- Ikon bell di topbar + popover berisi daftar (`.popover` dengan judul, item `strong` 12px navy + `span` 11px muted, `popover-empty` bila kosong).
- Halaman Expiry Notifications: daftar `.expiration-card` (border-top amber untuk pengingat, merah untuk expired), `.countdown`, badge status, dan riwayat notifikasi dengan status pengiriman.
- Halaman Manager Expiry / Website Notification Monitoring: `.data-table` berisi item, expiry, status notifikasi, status pengiriman, dan tindak lanjut; baris expired lebih dari 1 jam tanpa respons diberi `badge--danger`.

### 5.12 Halaman konfigurasi Manager

| Halaman | Tampilan |
|---|---|
| Category & Subcategory Configuration | `.data-table` + modal tambah atau ubah; aksi CRUD sebagai tombol di baris |
| Shelf-Life Rule Configuration | `.data-table` kategori dan durasi hari (input angka di baris atau modal), `.safety-notice` "Demo shelf-life rules, not real food-safety guidance" |
| Emission Factor Configuration | `.data-table` kolom: WRI food mapping, source, factor, 5–95 percentile range, unit / functional unit, effective date, status; baris tanpa faktor valid memakai `badge--warning` "Emission factor not configured" |

Tidak ada kontrol apa pun di halaman Manager untuk mengubah atau memperpanjang expiry per item (Food & Inventory Management hanya menampilkan expiry sebagai teks).

### 5.13 Donasi dan permintaan

- Green Community: kartu donasi (`donation-grid`, 3 kolom; judul 18px, massa 22px hijau, tombol "Submit Request" di dasar kartu) dan halaman Donation Detail.
- Daftar permintaan dan riwayat memakai `.data-table` dengan badge status (bagian 2.3).
- Manager: Donation Management dan Green Community Requests memakai `.data-table` dengan tombol aksi Approve dan Reject.
- Teks role selalu "Green Community"; jangan ada string "Food Waste Recipient" di UI.

### 5.14 Halaman sistem

| Halaman | Tampilan |
|---|---|
| Unauthorized / Access Denied | Panel terpusat gaya `.success-panel`, ikon bulat `--red-soft`/`--red`, judul 27px, tombol kembali ke dashboard |
| Not Found | Sama, ikon netral `--canvas`/`--muted` |
| Loading | Blok placeholder berlatar `--canvas` pada kartu dan tabel **[tambahan]** |
| Error | `.scan-error` / `.auth-error` dengan tombol "Try again" **[tambahan]** |
| Empty | `.empty-state` |
| Success | `.success-strip` atau `.toast` |

### 5.15 Deposit wizard dan virtual locker (dari prototype; di luar requirement)

Dibawa dari `Create interactive prototype 7.make` atas permintaan eksplisit. Aturan requirement tetap menang: expiry otomatis dan tidak editable, CO₂e memakai faktor p90 per subkategori, foto = simulasi berlabel.

- **Register Food** adalah wizard 5 langkah: Choose compartment → Register food → Review estimate → Print label → Deposit complete.
  - Chrome `.stepper` horizontal: `.stepper-item` (todo `--muted`, active border `--green`, done hijau penuh), `.stepper-dot` 26px berisi nomor atau centang, `.stepper-label` 11px.
  - Langkah 1: `.locker-grid` (auto-fill min 240px) berisi `.locker-card` — kepala `.locker-card-head` + `.locker-card-id` mono 12px, meter `.locker-meter` 6px (terisi `--green`), `SummaryList` kapasitas / terisi / sisa / suhu, tombol pilih. Kartu yang tidak tersedia memakai badge alasan (Maintenance, Offline, Incompatible category, Insufficient capacity) dan tombol nonaktif.
  - Suhu compartment selalu diberi badge `Simulated`; `.simulation-banner` menyatakan tidak ada sensor atau hardware.
- **Virtual Locker Management (Manager)** memakai `.locker-grid` yang sama: badge status Available (success) / Maintenance (warning) / Offline (danger), daftar penghuni, form Edit (kategori, kapasitas g, suhu °C, status). Kapasitas tidak boleh diturunkan di bawah massa terisi.
- **Perekatan ke record:** setiap record menyimpan `compartmentId` + `compartmentLabel` (contoh `RH-01 / A-01`). Kolom **Locker** tampil di My Food Inventory / Food & Inventory Management dan di CSV; baris **Compartment** di Food Detail dan pada label barcode. Kapasitas dilepas otomatis saat record berstatus Donated atau Collected.

### 5.16 Scan Barcode (kamera) dan foto kamera (dari prototype; di luar requirement)

- **Scan Barcode (camera)** — route `scan-barcode`, hanya untuk role **User** dan **Manager** (Green Community → Access Denied via `canAccess`). Layout `.scan-layout` (grid 2 kolom, satu kolom di bawah 900px): panel kamera + panel input manual `.scan-controls`.
  - Kamera: komponen `CameraScanner` (`.camera-frame`, `.camera-video`, `.camera-placeholder`) memakai `getUserMedia` + Shape Detection API (`window.BarcodeDetector`) bila tersedia; jika API tidak ada, preview tetap hidup dan copy mengarahkan ke input manual. Butuh konteks aman (https/localhost); izin ditolak atau tanpa kamera → `.scan-error` dengan jalan alternatif mengetik kode.
  - **Aturan akses hasil scan:** pemilik record atau Manager → panel "Barcode verified" dengan `SummaryList` lengkap (nama, kategori, status, massa, stored, expiry, locker, owner) plus tombol Open Food Detail dan Print Label. Pihak lain → `.scan-error` peringatan **"This barcode is not yours"** + panel "Public information only" (identifier, kategori, status, tanggal) + tautan ke public barcode view. Massa, owner, locker, faktor, dan CO₂e tidak pernah tampil ke pihak yang tidak berkepentingan.
  - `.simulation-banner` menyatakan decoding berjalan di browser dan tidak ada unggahan ke server (prototype UI dengan data demo).
- **Foto kamera di Register Food langkah 2:** tombol "Open camera" membuka `CameraCapture` inline (preview, Capture, Cancel); frame dijadikan `File` lalu melewati pemeriksaan freshness simulasi yang sama seperti unggahan berkas.
- Nav: "Scan Barcode (camera)" memakai ikon kamera di grup **Food** (User) dan **Operations** (Manager), setelah halaman barcode masing-masing.

---

## 6. Peta komponen ke halaman (Bagian 17.1)

| Halaman | Komponen utama |
|---|---|
| Landing / Home | Shell publik, H1 hero, tombol Sign Up (primary) dan Sign In (secondary), ringkasan tujuan platform |
| About SmartSave | Shell publik, `.panel` teks: problem statement, alur pencegahan limbah dan donasi, scope dan batasan |
| Sign Up / Sign In / Forgot–Reset Password | Shell auth (bagian 3.4) |
| User Dashboard | `metrics-grid`, `.mini-chart`, tabel inventori ringkas, filter periode |
| Register Food | Wizard 5 langkah (5.15): `.stepper`, pilihan compartment, cascading select, upload foto, field otomatis terkunci, tinjauan estimasi, label, konfirmasi deposit |
| My Food Inventory / Food Detail | `.toolbar`, `.data-table` dengan Quantity + CO₂e, badge status, aksi sesuai status; detail perhitungan (5.8) |
| Barcode / Print Label | `label-layout`, label card (5.6), tombol cetak |
| Scan Barcode (camera) | `.scan-layout`, `CameraScanner`, hasil: panel verifikasi `.summary-list` atau `.scan-error` peringatan (5.16) |
| Public Carbon Footprint | Shell publik, grafik agregat, disclosure |
| Expiry Notifications | 5.11 |
| Food Donation / Donation History | Form donasi `.panel`, `.data-table` status Completed, Cancelled, Pending |
| Manager Dashboard | `metrics-grid`, grafik, filter harian, bulanan, tahunan |
| Manager Food & Inventory | `.toolbar` + `.data-table`, audit trail; tanpa kontrol ubah expiry |
| Category / Shelf-Life / Emission Factor Configuration | 5.12 |
| Donation Management / Green Community Requests | 5.13 |
| Green Community Dashboard | `metrics-grid` massa diterima, daftar permintaan, riwayat |
| Reports / Activity Logs | `.data-table`, `report-grid`, filter periode, CSV bila ada |
| Profile / Account Settings | `.panel` + `form-grid`, ganti password sesuai hak role |

---

## 7. Aturan copy UI

- Bahasa Inggris untuk semua label, tombol, judul, pesan, dan notifikasi.
- Gunakan istilah persis dari requirement: Register Food, My Food Inventory, Food Detail, Barcode / Print Label, Expiry Notifications, Food Donation, Donation History, Food Retrieval / Collection Status, Green Community, Estimated CO₂e Avoided, Emission factor not configured, Unable to calculate.
- Satuan: `g`, `kg`, `kg CO₂e`; jangan campur `gram` dan `g` dalam satu layar.
- Hindari klaim fitur nonaktif: jangan menulis "AI-verified", "sensor reading", "locker temperature", atau "alarm" kecuali fitur itu benar-benar ada. Fitur simulasi diberi label "Simulation" atau "Demo".
- Aturan masa simpan diberi keterangan "demo rule", bukan saran keamanan pangan.

---

## 8. Cuplikan token siap salin

```css
:root {
  --green: #186b4d;
  --green-dark: #10563d;
  --green-soft: #eaf4ee;
  --navy: #142d3e;
  --ink: #263e4c;
  --muted: #607480;
  --line: #dfe7e8;
  --canvas: #f5f7f8;
  --white: #ffffff;
  --blue: #49728e;
  --blue-soft: #edf3f7;
  --amber: #94620c;
  --amber-soft: #fff5de;
  --red: #af3e3e;
  --red-soft: #fceded;
  --shadow: 0 10px 30px rgba(20, 45, 62, 0.08);
  --card-shadow: 0 2px 5px rgba(20, 45, 62, 0.04);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --font-sans: "Inter", Arial, sans-serif;
}
```

Untuk Tailwind v4 **[tambahan]**: pindahkan token ke `@theme { --color-green: #186b4d; ... }` di `src/index.css` agar tersedia sebagai utilitas.

---

## 9. Catatan di luar requirement dan prototype

Hal berikut tidak diminta requirement dan tidak ada di prototype. Terapkan hanya jika Anda setuju.

1. **Ukuran font.** Prototype memakai 8–11px pada banyak teks (header tabel 9px, keterangan 8–9px, badge 10px, isi tabel 11px). Untuk website final saya sarankan minimum 12px untuk teks informatif dan 14px untuk teks isi.
2. **Kontras.** Pasangan `--muted` di atas `--canvas` dan `--amber` di atas `--amber-soft` perlu diuji terhadap WCAG AA, terutama pada teks kecil.
3. **Status tidak hanya dengan warna.** Badge sudah berteks; pertahankan teks pada setiap indikator status.
4. **Font.** Prototype memuat Inter dari host statis Figma. Untuk produksi, muat dari host sendiri atau penyedia font yang Anda pilih.
5. **Komponen bertanda [tambahan]** di atas (pemetaan status baru, loading, error, shell publik, ilustrasi auth pengganti locker, format angka dua desimal) adalah usulan visual yang konsisten dengan token prototype, bukan sesuatu yang dinyatakan requirement.
6. **Wizard deposit dan virtual locker** (Bagian 5.15) juga di luar requirement v1.5; keduanya dibawa dari prototype atas permintaan eksplisit. Jika requirement berubah, keputusan ini bisa dibatalkan tanpa menyentuh komponen lain — record menyimpan compartment sebagai field opsional.
7. **Pemindaian barcode kamera dan foto kamera** (Bagian 5.16) memakai API browser (`getUserMedia` dan Shape Detection API) atas permintaan eksplisit, di luar requirement v1.5. Ketersediaan decoding tergantung browser (Chromium); tanpa API atau izin kamera, fitur jatuh ke input manual / unggahan berkas. Halaman lookup publik tetap input manual.
