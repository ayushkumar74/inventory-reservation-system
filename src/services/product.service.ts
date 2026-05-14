import { prisma } from '@/lib/prisma'

export class ProductService {
  static async getAllProducts() {
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
        availableStock: inv.totalStock - inv.reservedStock,
      })),
    }))
  }

  static async getProductById(id: string) {
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
        availableStock: inv.totalStock - inv.reservedStock,
      })),
    }
  }
}
