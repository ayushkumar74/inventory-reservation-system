import { prisma } from '@/lib/prisma'

export class WarehouseService {
  static async getAllWarehouses() {
    return await prisma.warehouse.findMany({
      orderBy: {
        name: 'asc',
      },
    })
  }

  static async getWarehouseById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!warehouse) {
      throw new Error('Warehouse not found')
    }

    return {
      ...warehouse,
      inventory: warehouse.inventory.map((inv: any) => ({
        ...inv,
        availableStock: inv.totalStock - inv.reservedStock,
      })),
    }
  }
}
