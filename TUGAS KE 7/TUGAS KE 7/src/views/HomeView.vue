<script setup>
import { useCartStore } from '../stores/cart'
import ProductCard from '../components/ProductCard.vue'

const cartStore = useCartStore()

const products = [
  {
    id: 1,
    name: 'Headphone Bluetooth',
    price: 250000,
    icon: '🎧'
  },
  {
    id: 2,
    name: 'Smartwatch',
    price: 350000,
    icon: '⌚'
  },
  {
    id: 3,
    name: 'Wireless Mouse',
    price: 100000,
    icon: '🖱️'
  }
]
</script>

<template>
  <div class="home-page">
    <header class="header">
      <h1>TOKO ARYAD2I</h1>
      <p>Temukan produk favoritmu!</p>

      <router-link to="/cart" class="cart-link">
        🛒 Keranjang ({{ cartStore.cartCount }})
      </router-link>
    </header>

    <main class="container">
      <h2>Katalog Produk</h2>

      <div class="product-list">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f3f4f6;
  padding-bottom: 40px;
}

.header {
  background: #2563eb;
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 30px;
}

.cart-link {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 18px;
  background: white;
  color: #2563eb;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
}

.container {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
}

.container h2 {
  color: #1f2937;
  margin-bottom: 20px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
</style>