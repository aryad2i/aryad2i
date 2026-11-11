import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    lastOrder: null,
    products: [
      { id: 1, name: 'Headphone Bluetooth', price: 250000, stock: 18, icon: '🎧' },
      { id: 2, name: 'Smartwatch', price: 350000, stock: 12, icon: '⌚' },
      { id: 3, name: 'Mouse Gaming', price: 250000, stock: 25, icon: '🖱️' },
      { id: 4, name: 'Laptop ASUS ROG Strix', price: 25000000, stock: 5, icon: '💻' },
      { id: 5, name: 'Keyboard Gaming', price: 750000, stock: 20, icon: '⌨️' },
      { id: 6, name: 'Kursi Gaming', price: 2500000, stock: 8, icon: '🪑' }
    ]
  }),

  getters: {
    cartCount: (state) =>
      state.items.reduce((total, item) => total + item.quantity, 0),

    cartTotal: (state) =>
      state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      )
  },

  actions: {
    addToCart(product) {
      const inventoryItem = this.products.find(item => item.id === product.id)
      const existingItem = this.items.find(item => item.id === product.id)
      if (!inventoryItem || (existingItem?.quantity ?? 0) >= inventoryItem.stock) return false

      this.lastOrder = null
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.items.push({
          ...inventoryItem,
          quantity: 1
        })
      }

      return true
    },

    checkout() {
      if (!this.items.length) return false

      this.lastOrder = {
        id: Date.now(),
        date: new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(new Date()),
        items: this.items.map(item => ({ ...item })),
        count: this.cartCount,
        total: this.cartTotal
      }

      this.items.forEach(item => {
        const product = this.products.find(product => product.id === item.id)
        if (product) product.stock -= item.quantity
      })
      this.items = []
      return true
    },

    removeFromCart(productId) {
      this.items = this.items.filter(
        item => item.id !== productId
      )
    },

    clearCart() {
      this.items = []
    }
  }
})