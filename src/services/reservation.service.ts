import { prisma } from '@/lib/prisma'
import { Prisma, ReservationStatus } from '@prisma/client'

const RESERVATION_EXPIRY_MINUTES = parseInt(
  process.env.RESERVATION_EXPIRY_MINUTES || '5'
)

export class ReservationService {
  private static cleanupInterval: NodeJS.Timeout | null = null

  /**
   * Starts a background cleanup interval for local development.
   * In serverless environments, we rely on lazy cleanup (Hybrid Cleanup).
   */
  static startAutoCleanup() {
    if (this.cleanupInterval) return

    console.log('[Cleanup] Starting background cleanup interval (30s)...')
    this.cleanupInterval = setInterval(async () => {
      try {
        const count = await this.cleanupAllExpiredReservations()
        if (count > 0) {
          console.log(`[Background Cleanup] Auto-released ${count} expired reservations.`)
        }
      } catch (error) {
        console.error('[Background Cleanup Error]', error)
      }
    }, 30000)

    // Ensure it doesn't block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Cleans up ALL expired PENDING reservations globally.
   * Decrements reservedStock and sets status to RELEASED.
   */
  static async cleanupAllExpiredReservations() {
    const now = new Date()

    try {
      return await prisma.$transaction(async (tx) => {
        // Find all PENDING reservations that have passed their expiry time
        const expiredReservations = await tx.reservation.findMany({
          where: {
            status: 'PENDING' as ReservationStatus,
            expiresAt: {
              lt: now,
            },
          },
        })

        if (expiredReservations.length === 0) return 0

        console.log(`[Cleanup] Found ${expiredReservations.length} expired reservations.`)

        for (const expired of expiredReservations) {
          // Robustly decrement reserved stock
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

          // Mark as RELEASED
          await tx.reservation.update({
            where: { id: expired.id },
            data: {
              status: 'RELEASED' as ReservationStatus,
              releasedAt: now,
            },
          })
          
          console.log(`[Cleanup] Auto-released reservation ${expired.id} for product ${expired.productId}`)
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
    // Hybrid Cleanup: Run before creation
    await this.cleanupAllExpiredReservations()

    return await prisma.$transaction(async (tx) => {
      const now = new Date()
      const expiresAt = new Date(
        now.getTime() + RESERVATION_EXPIRY_MINUTES * 60 * 1000
      )

      // Get inventory with row-level locking
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
          status: 'PENDING' as ReservationStatus,
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
          status: 'CONFIRMED' as ReservationStatus,
          confirmedAt: new Date(),
        },
        include: { product: true },
      })

      return updated
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  /**
   * Manual release for both PENDING and CONFIRMED reservations.
   */
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

      // Allow release for both PENDING and CONFIRMED
      const updated = await this.releaseReservationInternal(tx, reservation)
      return updated
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  private static async releaseReservationInternal(
    tx: Prisma.TransactionClient,
    reservation: { id: string; productId: string; warehouseId: string; quantity: number; status: string }
  ) {
    // Decrement reserved stock for PENDING or CONFIRMED
    // (Both hold reserved stock in this system)
    if (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') {
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
        status: 'RELEASED' as ReservationStatus,
        releasedAt: new Date(),
      },
      include: { product: true },
    })

    return updated
  }

  static async getReservation(reservationId: string) {
    // Hybrid Cleanup: Run before fetching
    await this.cleanupAllExpiredReservations()

    return await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })
  }
}

