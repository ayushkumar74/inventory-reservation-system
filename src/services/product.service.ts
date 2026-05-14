import { prisma } from '@/lib/prisma'
import { ReservationService } from './reservation.service'

export class ProductService {
  static async getAllProducts() {
    // Clean up expired reservations first to ensure accurate stock counts
    await ReservationService.cleanupAllExpiredReservations()

    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      inventory: product.inventory.map((inv) => ({
        ...inv,
        availableStock: Math.max(0, inv.totalStock - inv.reservedStock),
      })),
    }))
  }

  static async getProductById(id: string) {
    // Clean up expired reservations first to ensure accurate stock counts
    await ReservationService.cleanupAllExpiredReservations()

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return {
      ...product,
      price: Number(product.price),
      inventory: product.inventory.map((inv) => ({
        ...inv,
        availableStock: Math.max(0, inv.totalStock - inv.reservedStock),
      })),
    }
  }
}
