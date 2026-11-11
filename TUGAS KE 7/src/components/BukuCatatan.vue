<script setup>
import { ref, computed } from 'vue'

// Menyimpan data buku
const books = ref([])

// Menyimpan input dari pengguna
const judul = ref('')
const kategori = ref('')
const statusBaca = ref(false)

// Menambahkan buku
function tambahBuku() {
  if (!judul.value || !kategori.value) {
    alert('Judul dan kategori harus diisi!')
    return
  }

  books.value.push({
    id: Date.now(),
    judul: judul.value,
    kategori: kategori.value,
    sudahDibaca: statusBaca.value
  })

  // Mengosongkan form
  judul.value = ''
  kategori.value = ''
  statusBaca.value = false
}

// Menghitung jumlah buku yang sudah dibaca
const jumlahSelesai = computed(() => {
  return books.value.filter(
    buku => buku.sudahDibaca
  ).length
})
</script>

<template>
  <div class="container">
    <h1>Buku Catatan Saya</h1>
    <p>Catat buku yang sedang kamu baca.</p>

    <form @submit.prevent="tambahBuku">
      <label>Judul Buku</label>
      <input
        v-model="judul"
        type="text"
        placeholder="Masukkan judul buku"
      />

      <label>Kategori Buku</label>
      <select v-model="kategori">
        <option value="">Pilih kategori</option>
        <option value="Novel">Novel</option>
        <option value="Pendidikan">Pendidikan</option>
        <option value="Sejarah">Sejarah</option>
        <option value="Teknologi">Teknologi</option>
      </select>

      <label class="checkbox">
        <input
          v-model="statusBaca"
          type="checkbox"
        />
        Sudah selesai dibaca
      </label>

      <button type="submit">Tambah Buku</button>
    </form>

    <h2>Daftar Buku</h2>

    <p>
      Jumlah buku selesai dibaca:
      <strong>{{ jumlahSelesai }}</strong>
    </p>

    <div v-if="books.length === 0">
      Belum ada buku yang ditambahkan.
    </div>

    <div
      v-for="buku in books"
      :key="buku.id"
      class="book-card"
    >
      <h3>{{ buku.judul }}</h3>
      <p>Kategori: {{ buku.kategori }}</p>

      <label>
        <input
          type="checkbox"
          v-model="buku.sudahDibaca"
        />
        Tandai sudah dibaca
      </label>

      <p>
        Status:
        {{ buku.sudahDibaca ? 'Sudah dibaca' : 'Belum dibaca' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 30px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

input:not([type="checkbox"]),
select {
  display: block;
  width: 100%;
  padding: 10px;
  margin: 8px 0 15px;
  box-sizing: border-box;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

button {
  padding: 10px 18px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.book-card {
  padding: 12px;
  margin-top: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>