<script setup>
import { computed, ref } from 'vue'

const books = ref([])
const title = ref('')
const category = ref('')
const isRead = ref(false)
let nextBookId = 0

const completedCount = computed(
  () => books.value.filter((book) => book.isRead).length,
)

function addBook() {
  const cleanTitle = title.value.trim()

  if (!cleanTitle || !category.value) return

  books.value.unshift({
    id: `${Date.now()}-${nextBookId++}`,
    title: cleanTitle,
    category: category.value,
    isRead: isRead.value,
  })

  title.value = ''
  category.value = ''
  isRead.value = false
}
</script>

<template>
  <main class="page-shell">
    <header class="page-header">
      <p class="eyebrow">RUANG BACA</p>
      <h1>Catatan bacaan</h1>
      <p class="intro">Simpan buku pilihanmu, lalu tandai setiap cerita yang selesai.</p>
    </header>

    <section class="summary" aria-label="Ringkasan bacaan">
      <div class="summary-item">
        <span class="summary-number">{{ books.length }}</span>
        <span class="summary-label">Total buku</span>
      </div>
      <div class="summary-divider" aria-hidden="true"></div>
      <div class="summary-item">
        <span class="summary-number">{{ completedCount }}</span>
        <span class="summary-label">Selesai dibaca</span>
      </div>
    </section>

    <section class="panel add-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">KOLEKSI PRIBADI</p>
          <h2>Tambahkan buku</h2>
        </div>
      </div>

      <form class="book-form" @submit.prevent="addBook">
        <div class="form-field">
          <label for="book-title">Judul buku</label>
          <input
            id="book-title"
            v-model="title"
            type="text"
            placeholder="Contoh: Laskar Pelangi"
            autocomplete="off"
            required
          />
        </div>

        <div class="form-field">
          <label for="book-category">Kategori</label>
          <select id="book-category" v-model="category" required>
            <option disabled value="">Pilih kategori</option>
            <option>Novel</option>
            <option>Pendidikan</option>
            <option>Sejarah</option>
            <option>Teknologi</option>
          </select>
        </div>

        <label class="read-option">
          <input v-model="isRead" type="checkbox" />
          <span>Sudah selesai dibaca</span>
        </label>

        <button class="add-button" type="submit">Tambah buku <span aria-hidden="true">+</span></button>
      </form>
    </section>

    <section class="library" aria-labelledby="library-title">
      <div class="library-heading">
        <div>
          <p class="eyebrow">DAFTAR BACAAN</p>
          <h2 id="library-title">Buku-bukumu</h2>
        </div>
        <span v-if="books.length" class="book-count">{{ books.length }} buku</span>
      </div>

      <div v-if="books.length === 0" class="empty-state">
        <span class="empty-mark" aria-hidden="true">B</span>
        <h3>Belum ada buku di sini</h3>
        <p>Tambahkan bacaan pertamamu untuk mulai membuat koleksi.</p>
      </div>

      <ul v-else class="book-list">
        <li v-for="book in books" :key="book.id" class="book-item">
          <div class="book-mark" aria-hidden="true">{{ book.title.charAt(0).toUpperCase() }}</div>
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p>{{ book.category }}</p>
          </div>
          <label class="book-status">
            <input v-model="book.isRead" type="checkbox" />
            <span>{{ book.isRead ? 'Selesai' : 'Belum dibaca' }}</span>
          </label>
        </li>
      </ul>
    </section>

    <footer class="page-footer">Sedikit demi sedikit, satu buku demi satu buku.</footer>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap');

:root {
  font-family: 'DM Sans', sans-serif;
  color: #26352d;
  background: #f7f7f2;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
  font-weight: 400;

  --green: #355c49;
  --muted: #78827b;
  --line: #e8e9e2;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

button,
input,
select {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid #aec5b5;
  outline-offset: 2px;
}

.page-shell {
  width: min(100% - 40px, 720px);
  margin: 0 auto;
  padding: 72px 0 32px;
}

.page-header {
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #718477;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1,
h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
}

h1 {
  margin-bottom: 8px;
  font-size: clamp(2.4rem, 7vw, 3.35rem);
  letter-spacing: -0.045em;
  line-height: 1.1;
}

.intro {
  margin-bottom: 0;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.summary {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 24px;
  padding: 18px 22px;
  border: 1px solid #e8ece5;
  border-radius: 14px;
  background: #eef2eb;
}

.summary-item {
  display: grid;
  gap: 2px;
}

.summary-number {
  color: var(--green);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-label {
  color: var(--muted);
  font-size: 0.75rem;
}

.summary-divider {
  width: 1px;
  height: 34px;
  background: #d7dfd5;
}

.panel {
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 26px rgb(35 54 42 / 4%);
}

.section-heading,
.library-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-heading {
  margin-bottom: 22px;
}

h2 {
  margin-bottom: 0;
  font-size: 1.55rem;
  letter-spacing: -0.025em;
}

.book-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  gap: 16px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field label {
  color: #4a574f;
  font-size: 0.8rem;
  font-weight: 600;
}

.form-field input,
.form-field select {
  width: 100%;
  min-height: 46px;
  padding: 0 13px;
  border: 1px solid #e1e5df;
  border-radius: 9px;
  background: #fff;
  color: #26352d;
  font-size: 0.88rem;
}

.form-field input::placeholder {
  color: #a4aaa5;
}

.read-option {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  align-self: center;
  color: #68746c;
  cursor: pointer;
  font-size: 0.82rem;
}

.read-option input,
.book-status input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--green);
}

.add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 9px;
  background: var(--green);
  color: #fff;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 600;
  transition: background 160ms ease, transform 160ms ease;
}

.add-button:hover {
  transform: translateY(-1px);
  background: #284b38;
}

.add-button span {
  font-size: 1.1rem;
  font-weight: 400;
}

.library {
  margin-top: 38px;
}

.library-heading {
  margin-bottom: 16px;
}

.book-count {
  padding: 6px 10px;
  border-radius: 20px;
  background: #edf1eb;
  color: #586d5e;
  font-size: 0.72rem;
  font-weight: 600;
}

.empty-state {
  padding: 38px 20px;
  border: 1px dashed #dce2da;
  border-radius: 14px;
  background: rgb(255 255 255 / 55%);
  text-align: center;
}

.empty-mark,
.book-mark {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 11px;
  background: #eef2eb;
  color: #4b6a54;
  font-family: 'Playfair Display', Georgia, serif;
}

.empty-mark {
  width: 42px;
  height: 42px;
  margin: 0 auto 13px;
  font-size: 1.25rem;
}

.empty-state h3 {
  margin-bottom: 5px;
  font-size: 0.95rem;
  font-weight: 600;
}

.empty-state p {
  margin-bottom: 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.book-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.book-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 78px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
}

.book-mark {
  width: 42px;
  height: 46px;
  font-size: 1.15rem;
}

.book-info {
  min-width: 0;
  flex: 1;
}

.book-info h3 {
  overflow: hidden;
  margin-bottom: 3px;
  font-size: 0.9rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-info p {
  margin-bottom: 0;
  color: var(--muted);
  font-size: 0.76rem;
}

.book-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #6d786f;
  cursor: pointer;
  font-size: 0.75rem;
  white-space: nowrap;
}

.page-footer {
  margin-top: 36px;
  color: #929a93;
  font-size: 0.75rem;
  text-align: center;
}

@media (max-width: 560px) {
  .page-shell {
    width: min(100% - 32px, 720px);
    padding-top: 48px;
  }

  .panel {
    padding: 21px 18px;
  }

  .book-form {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .add-button {
    width: 100%;
  }

  .book-item {
    gap: 11px;
    padding: 12px;
  }

  .book-status {
    flex-direction: column;
    gap: 5px;
    font-size: 0.67rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>