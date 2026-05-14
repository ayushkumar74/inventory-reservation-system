export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  sku: string
  createdAt: Date
  updatedAt: Date
}

export interface Warehouse {
  id: string
  name: string
  location: string
  createdAt: Date
  updatedAt: Date
}

export interface Inventory {
  id: string
  productId: string
  warehouseId: string
  totalStock: number
  reservedStock: number
  availableStock: number
  createdAt: Date
  updatedAt: Date

  product?: Product | null
  warehouse?: Warehouse | null
}

export interface Reservation {
  id: string
  productId: string
  warehouseId: string
  quantity: number

  status: 'PENDING' | 'CONFIRMED' | 'RELEASED'

  expiresAt: Date
  confirmedAt: Date | null
  releasedAt: Date | null

  createdAt: Date
  updatedAt: Date

  product?: Product | null
  warehouse?: Warehouse | null
}

export interface ProductWithInventory extends Product {
  inventory: Array<
    Inventory & {
      warehouse: Warehouse
    }
  >
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}