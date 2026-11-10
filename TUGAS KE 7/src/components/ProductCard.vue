<script setup>
import { useCartStore } from '../stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartStore = useCartStore()

function beliProduk() {
  cartStore.addToCart(props.product)
}

function formatRupiah(harga) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(harga)
}
</script>

<template>
  <div class="product-card">
    <div class="product-icon">
      {{ product.icon }}
    </div>

    <h3>{{ product.name }}</h3>

    <p class="product-price">
      {{ formatRupiah(product.price) }}
    </p>

    <button @click="beliProduk">
      + Tambahkan Ke Keranjang
    </button>
  </div>
</template>

<style scoped>
.product-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
}

.product-icon {
  font-size: 65px;
  margin-bottom: 12px;
}

.product-card h3 {
  color: #1f2937;
  margin-bottom: 10px;
}

.product-price {
  color: #2563eb;
  font-weight: bold;
  margin-bottom: 15px;
}

.product-card button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 11px 18px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
}

.product-card button:hover {
  background: #1d4ed8;
}
</style>