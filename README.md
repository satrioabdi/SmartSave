# SmartSave

Food Waste Prevention, Donation & Carbon Impact Platform — prototype UI interaktif (React 18 + TypeScript + Vite 5) dengan data demo di memori, dibangun mengikuti `SMARTSAVE_REQUIREMENT_WEBSITE_REVISI_V1_5_RAPI.docx` (v1.5), `flow.md`, dan `style.md`.

## Fitur utama

- Tiga role: **User**, **Manager**, **Green Community** — routing dan akses dicek per role.
- **Register Food** wizard 5 langkah (Choose compartment → Register food → Review estimate → Print label → Deposit complete) dengan expiry otomatis yang tidak dapat diedit.
- **Virtual locker** (prototype extension): pemilihan compartment terikat ke record, kapasitas nyata di data demo, dikelola Manager.
- **Barcode & label** unik per record; halaman publik (lookup & carbon footprint) hanya menampilkan informasi non-pribadi.
- **Scan barcode dengan kamera** (User & Manager): hasil scan hanya menampilkan detail lengkap untuk pemilik record atau Manager; selain itu peringatan "This barcode is not yours".
- **Notifikasi expiry** sesuai requirement: pengingat 2 jam sebelum expiry, respons manual User (donasi/ambil), tindak lanjut Manager 1 jam setelah expiry tanpa respons — tanpa donasi otomatis.
- **Perhitungan CO₂e** memakai faktor p90 per subkategori (WRI), tanpa angka nol, anti double-counting (`claimKey`).
- Dashboard per role, filter Daily/Monthly/Yearly, ekspor CSV, laporan & activity log Manager.

Dokumen lengkap: [`PRD.md`](PRD.md) · alur: [`flow.md`](flow.md) · desain: [`style.md`](style.md).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # bundle produksi ke dist/
```

## Cakupan

Ini prototipe **UI** dengan data demo — bukan full-stack. Autentikasi backend, database, scheduler notifikasi, deteksi freshness AI, sensor, dan kanal notifikasi eksternal **tidak diimplementasikan** dan tidak boleh dinyatakan aktif (requirement §14.2). Fitur simulasi diberi label simulasi di UI.

## Akun demo

Buka aplikasi dan gunakan tombol role-switch pada halaman Sign In (tanpa backend): User (Nadia), Manager (Bagas), Green Community (Rumah Pangan Hijau). Coba contoh barcode `FD-1042` / `SS-1042`.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
