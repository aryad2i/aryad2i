<script setup>
import { useCartStore } from '../stores/cart'
import { formatRupiah } from '../utils/formatCurrency'

const cartStore = useCartStore()
</script>

<template>
  <div class="page">
    <header class="site-header">
      <div class="header-inner">
        <router-link to="/" class="brand">Toko Aryad2i</router-link>
        <router-link to="/cart" class="cart-link" aria-current="page">
          Keranjang <span class="cart-count">{{ cartStore.cartCount }}</span>
        </router-link>
      </div>
    </header>

    <main class="content cart-content">
      <router-link to="/" class="back-link">← Kembali ke katalog</router-link>
      <p class="eyebrow">Ringkasan pesanan</p>
      <h1 class="page-title">Keranjang belanja</h1>
      <p class="page-subtitle">Produk yang kamu pilih, siap untuk dibawa pulang.</p>

      <section v-if="!cartStore.items.length && cartStore.lastOrder" class="order-success" aria-live="polite">
        <p class="success-icon" aria-hidden="true">✓</p>
        <p class="eyebrow">Pembelian berhasil</p>
        <h2>Terima kasih sudah berbelanja!</h2>
        <p class="order-date">Struk #{{ cartStore.lastOrder.id }} · {{ cartStore.lastOrder.date }}</p>
        <div class="receipt-lines">
          <div v-for="item in cartStore.lastOrder.items" :key="item.id" class="receipt-line">
            <span>
              {{ item.name }}
              <small>{{ formatRupiah(item.price) }} × {{ item.quantity }}</small>
            </span>
            <strong>{{ formatRupiah(item.price * item.quantity) }}</strong>
          </div>
        </div>
        <div class="receipt-total">
          <span>Total ({{ cartStore.lastOrder.count }} barang)</span>
          <strong>{{ formatRupiah(cartStore.lastOrder.total) }}</strong>
        </div>
        <router-link to="/" class="primary-button">Kembali belanja</router-link>
      </section>

      <section v-else-if="!cartStore.items.length" class="empty-cart">
        <p class="empty-icon" aria-hidden="true">🛒</p>
        <h2>Keranjang masih kosong</h2>
        <p>Temukan sesuatu yang kamu suka di katalog.</p>
        <router-link to="/" class="primary-button">Mulai belanja</router-link>
      </section>

      <template v-else>
        <section class="cart-items" aria-label="Produk di keranjang">
          <article v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <div>
              <h2>{{ item.icon }} {{ item.name }}</h2>
              <p>{{ formatRupiah(item.price) }} · {{ item.quantity }} barang</p>
              <strong>Subtotal {{ formatRupiah(item.price * item.quantity) }}</strong>
            </div>
            <button class="remove-button" @click="cartStore.removeFromCart(item.id)">Hapus</button>
          </article>
        </section>

        <section class="cart-summary receipt" aria-label="Rincian belanja">
          <p class="receipt-label">Rincian belanja</p>
          <h2>Ringkasan pesanan</h2>
          <div class="receipt-lines">
            <div v-for="item in cartStore.items" :key="item.id" class="receipt-line">
              <span>
                {{ item.name }}
                <small>{{ formatRupiah(item.price) }} × {{ item.quantity }}</small>
              </span>
              <strong>{{ formatRupiah(item.price * item.quantity) }}</strong>
            </div>
          </div>
          <div class="receipt-total">
            <span>Total ({{ cartStore.cartCount }} barang)</span>
            <strong>{{ formatRupiah(cartStore.cartTotal) }}</strong>
          </div>
          <div class="cart-actions">
            <button class="primary-button" @click="cartStore.checkout()">Beli sekarang</button>
            <button class="secondary-button" @click="cartStore.clearCart()">Kosongkan keranjang</button>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>