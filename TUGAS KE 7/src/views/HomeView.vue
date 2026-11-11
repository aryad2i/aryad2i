<script setup>
import { useCartStore } from '../stores/cart'
import ProductCard from '../components/ProductCard.vue'

const cartStore = useCartStore()
</script>

<template>
  <div class="page">
    <header class="site-header">
      <div class="header-inner">
        <router-link to="/" class="brand">Toko Aryad2i</router-link>
        <router-link to="/cart" class="cart-link">
          Keranjang <span class="cart-count">{{ cartStore.cartCount }}</span>
        </router-link>
      </div>
    </header>

    <main class="content">
      <section class="intro">
        <div>
          <p class="eyebrow">Pilihan untuk sehari-hari</p>
          <h1 class="page-title">Temukan favoritmu.</h1>
        </div>
        <p class="intro-copy">Produk pilihan dengan desain sederhana dan kualitas yang bisa diandalkan.</p>
      </section>

      <section class="product-list" aria-label="Katalog produk">
        <ProductCard
          v-for="product in cartStore.products"
          :key="product.id"
          :product="product"
        />
      </section>
    </main>
  </div>
</template>