import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  
  // Initialize lightweight background cleanup for local development
  // We use dynamic import to avoid potential circular dependencies
  import('@/services/reservation.service').then(({ ReservationService }) => {
    ReservationService.startAutoCleanup()
  }).catch(err => {
    console.error('Failed to start auto-cleanup:', err)
  })
}
