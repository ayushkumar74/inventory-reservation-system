import { prisma } from '@/lib/prisma'
import { ReservationService } from './reservation.service'

export class ProductService {
  static async getAllProducts() {
    // Clean up expired reservations first
    await ReservationService.cleanupAllExpiredReservations()

    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true,
            // Include active reservations to recalculate reservedStock
            reservations: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED']
                }
              }
            }
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
      inventory: product.inventory.map((inv: any) => {
        // Recalculate reservedStock dynamically from active reservations
        const calculatedReservedStock = inv.reservations.reduce(
          (sum: number, res: any) => sum + res.quantity, 
          0
        )
        
        return {
          ...inv,
          reservedStock: calculatedReservedStock,
          availableStock: Math.max(0, inv.totalStock - calculatedReservedStock),
        }
      }),
    }))
  }

  static async getProductById(id: string) {
    // Clean up expired reservations first
    await ReservationService.cleanupAllExpiredReservations()

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            warehouse: true,
            // Include active reservations to recalculate reservedStock
            reservations: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED']
                }
              }
            }
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
      inventory: product.inventory.map((inv: any) => {
        // Recalculate reservedStock dynamically from active reservations
        const calculatedReservedStock = inv.reservations.reduce(
          (sum: number, res: any) => sum + res.quantity, 
          0
        )

        return {
          ...inv,
          reservedStock: calculatedReservedStock,
          availableStock: Math.max(0, inv.totalStock - calculatedReservedStock),
        }
      }),
    }
  }
}
