# Drive Kuliah

Pengelola folder dan file kuliah berbasis Vue 3 dan Vite.

## Fitur

- Buat, ubah nama, pindahkan, dan hapus folder, termasuk folder bertingkat
- Upload banyak file atau foto ke folder atau ke Drive saya
- Pratinjau gambar dan PDF, serta unduh file
- Ubah nama, pindahkan, cari, dan hapus file
- Metadata disimpan di `localStorage`; isi file disimpan di IndexedDB pada browser ini

File hanya tersedia di browser dan perangkat tempat file diunggah; aplikasi ini belum memakai penyimpanan cloud atau server.

## Menjalankan

```bash
npm install
npm run dev
```

## Struktur

- `src/DriveWorkspace.vue`: antarmuka dan alur pengelolaan file
- `src/attachments.js`: penyimpanan file di IndexedDB
- `src/main.js`: entry point Vue

## Teknologi

Vue 3 (Composition API, `<script setup>`), Vite
