// tugas-es6.mjs
// Praktikum: Pengolahan data transaksi menggunakan ES6

// 1. Array of objects berisi minimal 6 transaksi
const transaksi = [
  { id: 1, barang: "Beras 5 kg", harga: 75000, qty: 2, kategori: "Sembako" },
  { id: 2, barang: "Minyak Goreng", harga: 18000, qty: 3, kategori: "Sembako" },
  { id: 3, barang: "Sabun Mandi", harga: 5000, qty: 4, kategori: "Kebutuhan Rumah" },
  { id: 4, barang: "Gula 1 kg", harga: 16000, qty: 2, kategori: "Sembako" },
  { id: 5, barang: "Pasta Gigi", harga: 12000, qty: 1, kategori: "Kebutuhan Rumah" },
  { id: 6, barang: "Kopi", harga: 14000, qty: 2, kategori: "Minuman" }
];

// 2. Destructuring dan arrow function untuk memfilter kategori tertentu
const kategoriDipilih = "Sembako";

const transaksiTerpilih = transaksi.filter(
  ({ kategori }) => kategori === kategoriDipilih
);

// 3. map() untuk menghitung subtotal setiap barang
const daftarSubtotal = transaksiTerpilih.map(
  ({ id, barang, harga, qty, kategori }) => ({
    id,
    barang,
    kategori,
    harga,
    qty,
    subtotal: harga * qty
  })
);

// 4. reduce() untuk menghitung total keseluruhan transaksi terpilih
const totalKeseluruhan = daftarSubtotal.reduce(
  (total, { subtotal }) => total + subtotal,
  0
);

// 5. Menampilkan hasil ke terminal
const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(angka);

console.log(`=== DAFTAR TRANSAKSI KATEGORI ${kategoriDipilih} ===`);

daftarSubtotal.forEach(
  ({ barang, harga, qty, subtotal }) => {
    console.log(
      `${barang}: ${qty} x ${formatRupiah(harga)} = ${formatRupiah(subtotal)}`
    );
  }
);

console.log("-----------------------------------");
console.log(`Total keseluruhan: ${formatRupiah(totalKeseluruhan)}`);
