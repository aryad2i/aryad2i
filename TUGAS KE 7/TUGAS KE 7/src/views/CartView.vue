<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()

function formatRupiah(harga) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(harga)
}

const totalBelanja = computed(() => {
  return cartStore.items.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
})

const jumlahBarang = computed(() => {
  return cartStore.items.reduce((total, item) => {
    return total + item.quantity
  }, 0)
})
</script>

<template>
  <div class="cart-page">
    <header class="cart-header">
      <h1>Keranjang Belanja</h1>
      <p>Daftar produk yang kamu beli</p>
    </header>

    <main class="cart-container">

      <router-link to="/" class="back-link">
        ← Kembali ke Katalog
      </router-link>

      <div v-if="cartStore.items.length === 0"
           class="empty-cart">
        <h2>🛒</h2>
        <h3>Keranjang masih kosong</h3>
        <p>Silakan pilih produk terlebih dahulu.</p>
        <router-link to="/" class="shop-button">
          Mulai Belanja
        </router-link>
      </div>

      <div v-else>
        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="cart-item"
        >
          <div>
            <h3>{{ item.icon }} {{ item.name }}</h3>
            <p>Harga: {{ formatRupiah(item.price) }}</p>
            <p>Jumlah: {{ item.quantity }}</p>
            <strong>
              Subtotal:
              {{ formatRupiah(item.price * item.quantity) }}
            </strong>
          </div>

          <button
            class="remove-button"
            @click="cartStore.removeFromCart(item.id)"
          >
            Hapus
          </button>
        </div>

        <div class="cart-summary">
          <p>Total barang: {{ jumlahBarang }}</p>
          <h2>Total Belanja: {{ formatRupiah(totalBelanja) }}</h2>

          <button
            class="clear-button"
            @click="cartStore.clearCart()"
          >
            Kosongkan Keranjang
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.cart-page {
  min-height: 100vh;
  background: #f3f4f6;
}

.cart-header {
  background: #2563eb;
  color: white;
  text-align: center;
  padding: 30px 15px;
}

.cart-container {
  max-width: 850px;
  margin: 30px auto;
  padding: 20px;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #2563eb;
  text-decoration: none;
  font-weight: bold;
}

.empty-cart {
  background: white;
  padding: 40px 20px;
  border-radius: 12px;
  text-align: center;
}

.empty-cart h2 {
  font-size: 55px;
}

.shop-button {
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 15px;
}

.cart-item {
  background: white;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.cart-item h3 {
  color: #1f2937;
}

.cart-item p {
  margin: 8px 0;
}

.cart-summary {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
}

.cart-summary h2 {
  color: #2563eb;
}

.remove-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 7px;
  cursor: pointer;
}

.clear-button {
  background: #374151;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 7px;
  cursor: pointer;
}

@media (max-width: 500px) {
  .cart-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>