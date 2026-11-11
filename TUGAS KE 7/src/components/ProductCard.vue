<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'
import { formatRupiah } from '../utils/formatCurrency'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})
const cartStore = useCartStore()
const jumlahDiKeranjang = computed(() =>
  cartStore.items.find(item => item.id === props.product.id)?.quantity ?? 0
)
const sisaStok = computed(() => props.product.stock - jumlahDiKeranjang.value)
</script>

<template>
  <div class="product-card">
    <div class="product-icon" aria-hidden="true">
      {{ product.icon }}
    </div>

    <div class="product-info">
      <h2>{{ product.name }}</h2>
      <p class="product-price">{{ formatRupiah(product.price) }}</p>
      <p class="stock-info" :class="{ 'stock-empty': sisaStok === 0 }">
        {{ sisaStok ? `Stok tersedia: ${sisaStok}` : 'Stok habis' }}
      </p>
      <button
        class="primary-button"
        :disabled="sisaStok === 0"
        @click="cartStore.addToCart(product)"
      >
        {{ sisaStok ? 'Tambah ke keranjang' : 'Stok habis' }}
      </button>
    </div>
  </div>
</template>