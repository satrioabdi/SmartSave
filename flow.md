# SmartSave — Flow Website (Mermaid)

Sumber tunggal: `SMARTSAVE_REQUIREMENT_WEBSITE_REVISI_V1_5_RAPI.docx` (versi yang sudah Anda benahi). Seluruh diagram mengikuti requirement. Prototype `.make` tidak dipakai sebagai acuan alur.

Cara membaca: kotak = halaman atau proses, belah ketupat = keputusan, kotak bulat = awal atau akhir. Label UI memakai bahasa Inggris (Bagian 19.3), keterangan memakai bahasa Indonesia. Angka bagian (misalnya "Bagian 9") merujuk ke nomor section di requirement.

| No | Diagram | Bagian requirement |
|---|---|---|
| 1 | Peta halaman dan hak akses | 2, 17 |
| 2 | Autentikasi | 12, 13, 17.1 |
| 3 | Otorisasi dan validasi di backend | 12, 13 |
| 4 | Register Food dan expiry otomatis | 3, 4, 9 |
| 5 | Pendaftaran ulang makanan | 9, 20 |
| 6 | Barcode, halaman publik, dan detail perhitungan | 5, 6 |
| 7 | Notifikasi dan tindak lanjut expiry | 10, 11 |
| 8 | Pengambilan makanan oleh User | 2.1, 17, 18 |
| 9 | Donasi dan permintaan Green Community | 10, 17.1 |
| 10 | Perhitungan CO₂e per peristiwa | 7, 18, 19 |
| 11 | Konfigurasi oleh Manager | 3, 11, 17.1 |
| 12 | Status makanan, donasi, dan permintaan | 4, 10, 17.1 |
| 13 | Dashboard, laporan, dan ekspor | 8 |
| 14 | Batas scope awal | 1, 14 |

---

## 1. Peta halaman dan hak akses (Bagian 2 dan 17)

```mermaid
flowchart TD
    G(["Guest"]) --> LAND["Landing / Home"]
    LAND --> ABOUT["About SmartSave"]
    LAND --> SIGNUP["Sign Up"]
    LAND --> SIGNIN["Sign In"]
    LAND --> PUBBC["Public Barcode Lookup"]
    PUBBC --> PUBCF["Public Carbon Footprint<br/>charts only, no personal data"]
    SIGNUP --> SIGNIN
    SIGNIN --> FORGOT["Forgot Password / Reset Password"]
    FORGOT --> SIGNIN
    SIGNIN --> ROLE{"Role?"}

    ROLE -->|User| UD["User Dashboard"]
    ROLE -->|Manager| MD["Manager Dashboard"]
    ROLE -->|Green Community| GD["Green Community Dashboard"]

    subgraph USER["Role: User"]
        UD --> U1["Register Food"]
        UD --> U2["My Food Inventory / Food Detail"]
        UD --> U3["Barcode / Print Label"]
        UD --> U4["Expiry Notifications"]
        UD --> U5["Food Donation / Donation History"]
        UD --> U6["Food Retrieval / Collection Status"]
        UD --> U7["Profile / Account Settings"]
    end

    subgraph MANAGER["Role: Manager"]
        MD --> M1["User and Role Management"]
        MD --> M2["Food & Inventory Management"]
        MD --> M3["Category & Subcategory Configuration"]
        MD --> M4["Shelf-Life Rule Configuration"]
        MD --> M5["Emission Factor Configuration"]
        MD --> M6["Barcode Management"]
        MD --> M7["Donation Management"]
        MD --> M8["Green Community Requests"]
        MD --> M9["Expiry / Website Notification Monitoring"]
        MD --> M10["Activity Logs"]
        MD --> M11["Environmental Reports"]
        MD --> M12["Profile / Settings"]
    end

    subgraph GC["Role: Green Community"]
        GD --> G1["Available Food Waste / Donations"]
        G1 --> G2["Donation Detail"]
        G2 --> G3["Submit Request"]
        GD --> G4["My Requests / Request Status"]
        GD --> G5["Received / Distributed Food History"]
        GD --> G6["Profile / Account Settings"]
    end

    SYS["Halaman sistem"] --> DENIED["Unauthorized / Access Denied"]
    SYS --> NF["Not Found"]
```

Catatan: Green Community tidak mendapat akses Manager walaupun nama tampilannya diubah dari "Food Waste Recipient" (Bagian 2.3). Halaman sistem lain yang wajib ada: state validasi form, empty, error, loading, dan success, serta navigasi responsif.

---

## 2. Autentikasi (Bagian 12, 13, 17.1)

```mermaid
flowchart TD
    S(["Mulai"]) --> A{"Sudah punya akun?"}
    A -->|Belum| SU["Sign Up<br/>role-aware, password confirmation,<br/>terms atau consent bila diperlukan"]
    SU --> V1{"Validasi form lolos?"}
    V1 -->|Tidak| SUE["Tampilkan validation state"] --> SU
    V1 -->|Ya| CR["Buat akun<br/>password di-hash"] --> SI
    A -->|Sudah| SI["Sign In<br/>email atau username + password"]
    SI --> V2{"Kredensial valid?"}
    V2 -->|Tidak| SIE["Failed-login state"] --> SI
    V2 -->|Lupa password| FP["Forgot Password<br/>kirim permintaan reset"]
    FP --> RP["Reset Password<br/>set password baru"]
    RP --> CONF["Tampilkan konfirmasi atau error"] --> SI
    V2 -->|Ya| TOK["Buat sesi aman atau access token"]
    TOK --> RD{"Redirect berdasarkan role"}
    RD -->|User| UD["User Dashboard"]
    RD -->|Manager| MD["Manager Dashboard"]
    RD -->|Green Community| GD["Green Community Dashboard"]
```

---

## 3. Otorisasi dan validasi di backend (Bagian 12 dan 13)

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend React
    participant API as Backend Express /api/v1
    participant DB as PostgreSQL via Prisma
    participant AUD as AuditLog

    FE->>API: Request dengan sesi atau token
    Note over API: HTTPS, CORS sesuai, rate limiting
    API->>API: Autentikasi sesi atau token
    alt Tidak terautentikasi
        API-->>FE: Unauthorized
    else Terautentikasi
        API->>API: Periksa role
        API->>API: Periksa ownership record
        alt Role atau ownership tidak sesuai
            API-->>FE: Access Denied
        else Diizinkan
            API->>API: Validasi input dengan Zod
            alt Input tidak valid
                API-->>FE: Validation error
            else Input valid
                API->>DB: Baca atau tulis data
                DB-->>API: Hasil
                API->>AUD: Catat perubahan penting
                API-->>FE: Respons sukses
            end
        end
    end
    Note over FE,API: localStorage tidak dipercaya untuk autentikasi, role, ownership, status transaksi, atau angka laporan
```

---

## 4. Register Food dan expiry otomatis — User (Bagian 3, 4, 5, 9)

```mermaid
flowchart TD
    S(["User membuka Register Food"]) --> C1["Pilih Food Category"]
    C1 --> C2["Pilih Food Subcategory<br/>dropdown bertingkat mengikuti kategori"]
    C2 --> F["Isi nama makanan dan massa dalam gram (g)"]
    F --> PH["Unggah foto makanan"]
    PH --> CHK{"Pemeriksaan foto<br/>simulasi pada prototype"}
    CHK -->|Terdeteksi basi atau expired| REJ["Makanan ditolak<br/>tidak dapat dimasukkan ke smart locker"]
    REJ --> END1(["Selesai tanpa record"])
    CHK -->|Layak| RULE["Sistem mengambil aturan masa simpan<br/>yang dikonfigurasi Manager"]
    RULE --> EXP["Expiration Date & Time =<br/>waktu pencatatan + durasi kategori<br/>terisi otomatis, tidak bisa diubah"]
    EXP --> SNAP["Simpan snapshot durasi atau aturan yang dipakai"]
    SNAP --> EF{"Faktor emisi valid untuk<br/>subkategori dan satuan?"}
    EF -->|Ya| EFOK["Simpan snapshot faktor, unit fungsi,<br/>sumber, dan versi metodologi"]
    EF -->|Tidak| EFNO["Tandai Emission factor not configured<br/>tidak menampilkan angka nol"]
    EFOK --> BAR["Buat Food ID dan barcode atau QR unik"]
    EFNO --> BAR
    BAR --> ST["Status = Stored<br/>Created / Stored At terisi otomatis"]
    ST --> LBL["Barcode / Print Label"]
    LBL --> DET["Food Detail dan My Food Inventory"]
    DET --> END2(["Selesai"])
```

Catatan: jika kategori berubah, waktu kedaluwarsa dihitung ulang otomatis (Bagian 9 butir 4). Setelah record tersimpan, User maupun Manager tidak dapat mengubah atau memperpanjang expiry.

---

## 5. Pendaftaran ulang makanan (Bagian 9 butir 5 dan Bagian 20 butir 4)

```mermaid
flowchart TD
    S(["User ingin menyimpan kembali makanan"]) --> EXT{"Minta perpanjang expiry manual?"}
    EXT -->|Ya| NO["Ditolak<br/>User dan Manager tidak dapat memperpanjang expiry"]
    EXT -->|Tidak| NEW["Unggah atau potret foto baru<br/>untuk pemeriksaan ulang"]
    NEW --> CHK{"Hasil pemeriksaan foto<br/>simulasi, deteksi AI nyata di luar scope awal"}
    CHK -->|Basi atau expired| REJ["Makanan ditolak"]
    CHK -->|Layak| REG["Masuk alur Register Food<br/>expiry dihitung dari aturan kategori"]
    NO --> END(["Selesai"])
    REJ --> END
    REG --> END
```

---

## 6. Barcode, halaman publik, dan detail perhitungan (Bagian 5 dan 6)

```mermaid
flowchart TD
    S(["Scan atau input barcode / QR"]) --> LK["Backend mencari record<br/>berdasarkan ID atau URL unik"]
    LK --> FOUND{"Record ditemukan?"}
    FOUND -->|Tidak| NF["Not Found"]
    FOUND -->|Ya| LOGIN{"Login dan berwenang<br/>atas record ini?"}

    LOGIN -->|Tidak| PUB["Halaman publik<br/>identifier, kategori, status"]
    PUB --> MSG["Pesan kontribusi bahasa Inggris:<br/>Thank you for contributing to carbon emission reduction<br/>through food waste prevention."]
    MSG --> PCF["Public Carbon Footprint<br/>grafik agregat non-pribadi,<br/>tanpa detail perhitungan per record"]
    PCF --> DISC1["Penjelasan: estimasi berdasarkan faktor emisi,<br/>bukan pengukuran langsung oleh sensor"]

    LOGIN -->|Ya| DET["Food Detail"]
    DET --> MSG2["Pesan kontribusi"]
    DET --> CALC["Detail perhitungan"]
    CALC --> MASS["Massa awal g dan hasil konversi ke kg"]
    CALC --> FAC["Faktor emisi + satuan + sumber + rumus"]
    CALC --> VAL{"Faktor valid dan satuan cocok?"}
    VAL -->|Ya| RES["Estimated CO₂e dalam kg CO₂e<br/>beserta tanggal atau periode dan status data"]
    VAL -->|Tidak| UNK["Emission factor not configured<br/>atau Unable to calculate"]
    RES --> DISC2["Disclosure estimasi"]
    UNK --> DISC2
```

Catatan: barcode tidak boleh memuat data pribadi atau data sensitif; barcode hanya berisi ID atau URL unik. Fitur scan yang masih simulasi wajib diberi label demo, dan pemindaian kamera nyata baru boleh diklaim setelah diimplementasikan dan diuji.

---

## 7. Notifikasi dan tindak lanjut expiry (Bagian 10 dan 11)

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SCH as Scheduler backend
    participant WEB as Website notification
    participant MGR as Manager
    participant LOG as Audit / Activity Log

    U->>SCH: Food tersimpan dengan expiry otomatis
    Note over SCH: Berjalan di backend, bukan timer browser.<br/>node-cron untuk deployment satu instance
    SCH->>SCH: Cek item yang expiry dalam 2 jam
    SCH->>WEB: Buat notifikasi pengingat 2 jam sebelum expiry
    WEB-->>U: Notifikasi di website saja
    SCH->>LOG: Catat status pengiriman atau kegagalan scheduler
    alt User menanggapi sebelum expiry
        U->>WEB: Donasikan atau ambil makanan
        WEB->>LOG: Catat tindakan
    else Makanan expired dan tidak ada respons
        SCH->>SCH: Tunggu 1 jam setelah expiry
        SCH->>MGR: Tandai perlu tindak lanjut
        MGR->>LOG: Tindak lanjut sesuai kebijakan yang disepakati, tercatat
    end
    Note over SCH,MGR: Sistem tidak boleh mengklaim proses otomatis berjalan bila scheduler belum diimplementasikan
```

---

## 8. Pengambilan makanan oleh User (Bagian 2.1, 17, 18)

```mermaid
flowchart TD
    S(["User membuka Food Retrieval / Collection Status<br/>atau Food Detail"]) --> CHK{"Aksi pengambilan diizinkan<br/>oleh status makanan?"}
    CHK -->|Tidak| BLK["Aksi tidak tersedia<br/>misalnya massa sudah didonasikan"]
    CHK -->|Ya| OWN{"User pemilik record?"}
    OWN -->|Tidak| DENY["Access Denied"]
    OWN -->|Ya| TAKE["User mengambil makanan"]
    TAKE --> REC["Catat massa yang diambil, waktu, status, dan pelaku"]
    REC --> ST["Status = Collected"]
    ST --> EV["Peristiwa CO₂e: makanan diambil User<br/>konsumsi diasumsikan, bukan terbukti<br/>lihat diagram 10"]
    EV --> UI["UI dan laporan menyebut sebagai asumsi<br/>makanan kemungkinan dikonsumsi"]
    BLK --> END(["Selesai"])
    DENY --> END
    UI --> END
```

---

## 9. Donasi dan permintaan Green Community (Bagian 10 dan 17.1)

```mermaid
flowchart TD
    subgraph USER["User"]
        U1["Register Food<br/>status Stored"] --> U2{"Memenuhi aturan donasi?"}
        U2 -->|Ya| U3["Food Donation<br/>donasi dibuat, status Pending"]
    end

    U2 -->|Tidak| X1(["Tidak ditawarkan"])
    U3 --> S1["Status makanan = Available for Donation"]

    subgraph GC["Green Community"]
        G1["Available Food Waste / Donations"] --> G2["Donation Detail"]
        G2 --> G3["Submit Request"]
        G3 --> G4["My Requests dan Request Status"]
    end

    S1 --> G1

    subgraph MGR["Manager"]
        M1["Green Community Requests<br/>tinjau donasi dan permintaan"] --> M2{"Setujui?"}
        M2 -->|Tidak| M3["Ditolak<br/>status dan alasan tercatat"]
        M2 -->|Ya| M4["Approved dan alokasi massa"]
        M4 --> M5["Distribusi kepada pemohon"]
        M5 --> M6["Catat massa yang benar-benar didonasikan atau diterima<br/>waktu, status, pelaku"]
    end

    G3 --> M1
    M3 --> G4
    M6 --> D1["Donasi Completed<br/>status makanan Donated"]
    M6 --> CO2["Peristiwa CO₂e: donasi selesai<br/>dan distribusi ke Green Community<br/>lihat diagram 10"]
    D1 --> H1["Donation History dan<br/>Received / Distributed Food History"]
    CO2 --> H1
    U3 -.->|"User membatalkan"| CAN["Donasi Cancelled"]
```

Catatan: massa yang sama tidak boleh dihitung dua kali saat berpindah tahap (Bagian 17.1, Food Donation / Donation History).

---

## 10. Perhitungan CO₂e per peristiwa (Bagian 7, 18, 19)

```mermaid
flowchart TD
    EV(["Peristiwa memenuhi syarat"]) --> T{"Jenis peristiwa"}
    T -->|"Makanan diambil User<br/>konsumsi diasumsikan, bukan terbukti"| E1["Massa yang diambil"]
    T -->|"Food waste yang sudah basi<br/>berhasil didonasikan"| E2["Massa yang benar-benar didonasikan"]
    T -->|"Food waste berhasil didistribusikan<br/>kepada pemohon / Green Community"| E3["Massa yang benar-benar diserahkan"]
    E1 --> DUP
    E2 --> DUP
    E3 --> DUP
    DUP{"Massa atau lot ini sudah diklaim<br/>pada peristiwa yang sama?"}
    DUP -->|Sudah| SKIP["Tidak dihitung lagi<br/>perubahan status tidak menambah massa"]
    DUP -->|Belum| MAP["Cari faktor emisi WRI<br/>berdasarkan subkategori"]
    MAP --> OK1{"Subkategori cocok dengan baris sumber?"}
    OK1 -->|Tidak| NC["Emission factor not configured"]
    OK1 -->|Ya| UNIT{"Satuan faktor kg CO₂e per kg?"}
    UNIT -->|"Tidak, misalnya per liter"| CONV{"Konversi densitas atau<br/>metodologi sudah disetujui?"}
    CONV -->|Tidak| UC["Unable to calculate<br/>perhitungan ditahan"]
    CONV -->|Ya| CALC
    UNIT -->|Ya| CALC["Estimated CO₂e kg =<br/>Food Mass g ÷ 1000 × Emission Factor"]
    CALC --> SAVE["Simpan CarbonImpactEvent<br/>record sumber, peristiwa, massa, faktor, satuan,<br/>sumber, versi metodologi, hasil, timestamp,<br/>penanda unik anti-duplikasi"]
    SAVE --> AGG["Dipakai sama oleh kartu, tabel,<br/>grafik, laporan, dan CSV"]
    NC --> SHOW["Tampilkan status, bukan angka nol"]
    UC --> SHOW
    SKIP --> END(["Selesai"])
    AGG --> END
    SHOW --> END
```

Catatan: pendaftaran makanan saja tidak berarti emisi telah dihindari; hanya peristiwa yang memenuhi syarat yang dihitung (Bagian 7). CO₂e adalah estimasi dalam kg CO₂e dan tidak boleh dipertukarkan dengan ppm sensor. Baris coklat hitam punya batas bawah negatif, jadi perlu tinjauan metodologi sebelum dipakai operasional (Bagian 19.2).

---

## 11. Konfigurasi oleh Manager (Bagian 3, 11, 17.1)

```mermaid
flowchart TD
    MD["Manager Dashboard"] --> CFG{"Pilih konfigurasi"}

    CFG --> CAT["Category & Subcategory Configuration<br/>CRUD kategori dan subkategori"]
    CFG --> SHELF["Shelf-Life Rule Configuration<br/>durasi per kategori"]
    CFG --> EF["Emission Factor Configuration<br/>sumber, pemetaan WRI, faktor, rentang,<br/>satuan atau unit fungsi, tanggal efektif"]

    CAT --> VAL1{"Valid dan konsisten dengan<br/>pemetaan WRI?"}
    SHELF --> VAL2{"Durasi valid?"}
    EF --> VAL3{"Subkategori dan satuan cocok<br/>dengan baris sumber?"}

    VAL1 -->|Ya| SAVE
    VAL2 -->|Ya| SAVE
    VAL3 -->|Ya| SAVE
    VAL1 -->|Tidak| ERR["Tolak dan tampilkan error"]
    VAL2 -->|Tidak| ERR
    VAL3 -->|Tidak| NCF["Simpan sebagai Emission factor not configured"]

    SAVE["Simpan konfigurasi"] --> APPLY["Berlaku untuk perhitungan atau record baru"]
    APPLY --> KEEP["Record dan laporan historis tidak berubah<br/>karena memakai snapshot"]
    SAVE --> AUD["Catat perubahan konfigurasi ke Audit Log"]
    NCF --> AUD
    ERR --> MD
    KEEP --> MD
    AUD --> MD

    MD --> INV["Food & Inventory Management<br/>cari, filter, lihat status dan audit trail"]
    INV --> BLOCK["Tidak tersedia: ubah atau perpanjang expiry<br/>pada item yang sudah terdaftar"]
```

---

## 12. Status makanan, donasi, dan permintaan (Bagian 4, 10, 17.1)

Status makanan (Bagian 4). Requirement memberi contoh: Stored, Available for Donation, Donated, Collected, Expired.

```mermaid
stateDiagram-v2
    direction LR
    state "Available for Donation" as Avail
    [*] --> Stored: Register Food berhasil
    Stored --> Avail: Donasi dibuat
    Stored --> Collected: Diambil User
    Stored --> Expired: Expiry terlewati
    Avail --> Donated: Donasi selesai
    Avail --> Expired: Expiry terlewati
    Donated --> [*]
    Collected --> [*]
    Expired --> [*]: Tindak lanjut Manager tercatat
```

Status donasi (Bagian 17.1: completed, cancelled, atau pending):

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Pending: User membuat donasi
    Pending --> Completed: Massa diterima atau didistribusikan
    Pending --> Cancelled: Dibatalkan
    Completed --> [*]
    Cancelled --> [*]
```

Status permintaan Green Community (Bagian 10: diajukan, ditinjau, disetujui atau ditolak, didistribusikan):

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Pending: Submit Request
    Pending --> Approved: Manager menyetujui
    Pending --> Rejected: Manager menolak
    Approved --> Completed: Makanan didistribusikan
    Rejected --> [*]
    Completed --> [*]
```

Catatan: nama status dan transisi di diagram ini adalah turunan dari teks requirement. Requirement belum mendaftar status permintaan secara resmi. Bagian 4 menyebut status makanan hanya sebagai "contoh", jadi daftar finalnya perlu Anda tetapkan sebelum implementasi.

---

## 13. Dashboard, laporan, dan ekspor (Bagian 8)

```mermaid
flowchart LR
    DATA[("FoodItem, Donation,<br/>GreenCommunityRequest,<br/>CarbonImpactEvent")] --> FIL["Filter periode:<br/>harian, bulanan, tahunan"]
    FIL --> AGG["Satu aturan agregasi<br/>bebas double counting"]
    AGG --> C1["Kartu ringkasan"]
    AGG --> C2["Tabel<br/>kolom Quantity + Estimated CO₂e Avoided kg CO₂e"]
    AGG --> C3["Grafik"]
    AGG --> C4["Ekspor CSV bila tersedia"]
    C1 --> R1["Dashboard User<br/>massa g, CO₂e terkait, inventori, status"]
    C1 --> R2["Dashboard Manager<br/>massa dikelola, donasi, permintaan, CO₂e, laporan"]
    C1 --> R3["Dashboard Green Community<br/>massa diterima, riwayat, CO₂e terkait"]
    C3 --> R4["Public Carbon Footprint<br/>grafik non-pribadi"]
    SENS["Sensor CO₂ ppm"] -.->|"hanya jika perangkat dan pengukuran nyata tersedia"| PPM["Measured CO₂ Concentration ppm<br/>ditampilkan terpisah dari CO₂e"]
```

Catatan: laporan User, Donor/Donasi, dan Green Community dipertahankan terpisah. Kartu, grafik, tabel, dan CSV memakai periode serta aturan agregasi yang sama.

---

## 14. Batas scope awal (Bagian 1 dan 14)

```mermaid
flowchart LR
    subgraph IN["14.1 Termasuk scope awal"]
        I1["Website responsif desktop dan mobile"]
        I2["Registrasi, login, dan tiga role"]
        I3["Makanan, kategori, masa simpan otomatis,<br/>barcode, label, Carbon Footprint"]
        I4["Donasi, permintaan Green Community,<br/>status, riwayat, pengelolaan Manager"]
        I5["Dashboard, grafik, tabel, filter, CSV bila ada"]
        I6["Estimasi CO₂e dengan faktor yang dapat dikonfigurasi<br/>dan snapshot historis"]
        I7["Backend API, PostgreSQL, Prisma, validasi,<br/>autentikasi, otorisasi, audit log dasar"]
        I8["Scheduler backend untuk expiry dan notifikasi website"]
    end

    subgraph OUT["14.2 Tidak otomatis termasuk"]
        O1["Smart locker fisik, Raspberry Pi, kamera AI,<br/>sensor suhu dan kelembapan, alarm, sterilisasi"]
        O2["Pengukuran CO₂ ppm langsung"]
        O3["Pesan eksternal, payment gateway,<br/>layanan pihak ketiga yang belum disepakati"]
        O4["Machine learning prediksi expiry dari foto"]
        O5["Fitur yang masih simulasi sampai<br/>diimplementasikan dan diuji"]
    end

    OUT -.->|"Tidak boleh dinyatakan aktif sebelum dibangun dan diuji"| IN
```
