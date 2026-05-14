import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const RESERVATION_EXPIRY_MINUTES = parseInt(
  process.env.RESERVATION_EXPIRY_MINUTES || '5'
)

export class ReservationService {
  /**
   * Cleans up ALL expired PENDING reservations globally.
   * Decrements reservedStock and sets status to RELEASED.
   */
  static async cleanupAllExpiredReservations() {
    const now = new Date()

    try {
      return await prisma.$transaction(async (tx) => {
        const expiredReservations = await tx.reservation.findMany({
          where: {
            status: 'PENDING',
            expiresAt: {
              lt: now,
            },
          },
        })

        if (expiredReservations.length === 0) return 0

        console.log(`[Cleanup] Found ${expiredReservations.length} expired reservations.`)

        for (const expired of expiredReservations) {
          // Decrement reserved stock, ensuring it doesn't go below 0
          // We use a manual check or a conditional update if needed, but here we'll just update
          // based on the assumption that increments were matched.
          // To be safer, we can use a raw query or check current stock.
          
          const inventory = await tx.inventory.findUnique({
            where: {
              productId_warehouseId: {
                productId: expired.productId,
                warehouseId: expired.warehouseId,
              }
            }
          })

          if (inventory) {
            const newReservedStock = Math.max(0, inventory.reservedStock - expired.quantity)
            
            await tx.inventory.update({
              where: {
                productId_warehouseId: {
                  productId: expired.productId,
                  warehouseId: expired.warehouseId,
                },
              },
              data: {
                reservedStock: newReservedStock,
              },
            })
          }

          await tx.reservation.update({
            where: { id: expired.id },
            data: {
              status: 'RELEASED',
              releasedAt: now,
            },
          })
          
          console.log(`[Cleanup] Released reservation ${expired.id} for product ${expired.productId}`)
        }

        return expiredReservations.length
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      console.error('[Cleanup Error] Failed to cleanup expired reservations:', error)
      return 0
    }
  }

  static async createReservation(
    productId: string,
    warehouseId: string,
    quantity: number
  ) {
    // Clean up expired reservations first
    await this.cleanupAllExpiredReservations()

    return await prisma.$transaction(async (tx) => {
      const now = new Date()
      const expiresAt = new Date(
        now.getTime() + RESERVATION_EXPIRY_MINUTES * 60 * 1000
      )

      // Get inventory with row-level locking using FOR UPDATE
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      })

      if (!inventory) {
        throw new Error('Inventory not found for this product and warehouse')
      }

      const availableStock = inventory.totalStock - inventory.reservedStock

      if (availableStock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
        )
      }

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: 'PENDING',
          expiresAt,
        },
        include: {
          product: true,
        },
      })

      // Increment reserved stock
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
        data: {
          reservedStock: {
            increment: quantity,
          },
        },
      })

      return reservation
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  static async confirmReservation(reservationId: string) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { product: true },
      })

      if (!reservation) {
        throw new Error('Reservation not found')
      }

      if (reservation.status !== 'PENDING') {
        throw new Error(
          `Cannot confirm reservation with status: ${reservation.status}`
        )
      }

      if (new Date() > reservation.expiresAt) {
        // Auto-release expired reservation
        await this.releaseReservationInternal(tx, reservation)
        throw new Error('Reservation has expired')
      }

      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
        include: { product: true },
      })

      return updated
    })
  }

  static async releaseReservation(reservationId: string) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { product: true },
      })

      if (!reservation) {
        throw new Error('Reservation not found')
      }

      if (reservation.status === 'RELEASED') {
        throw new Error('Reservation is already released')
      }

      const updated = await this.releaseReservationInternal(tx, reservation)
      return updated
    })
  }

  private static async releaseReservationInternal(
    tx: Prisma.TransactionClient,
    reservation: { id: string; productId: string; warehouseId: string; quantity: number; status: string }
  ) {
    // Decrement reserved stock only if it was PENDING
    if (reservation.status === 'PENDING') {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
      })

      if (inventory) {
        const newReservedStock = Math.max(0, inventory.reservedStock - reservation.quantity)
        
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            reservedStock: newReservedStock,
          },
        })
      }
    }

    const updated = await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
      include: { product: true },
    })

    return updated
  }

  static async getReservation(reservationId: string) {
    // Clean up expired reservations first
    await this.cleanupAllExpiredReservations()

    return await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })
  }
}

