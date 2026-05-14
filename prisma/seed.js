require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Delete existing data (for idempotency)
  await prisma.reservation.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.warehouse.deleteMany()

  console.log('Existing data cleared')

  // Create warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      location: 'New York, USA',
    },
  })

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'West Coast Warehouse',
      location: 'Los Angeles, USA',
    },
  })

  console.log('Warehouses created')

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip',
        price: 999.99,
        sku: 'IPHONE-15-PRO',
      },
    }),
    prisma.product.create({
      data: {
        name: 'MacBook Pro 14"',
        description: 'M3 Pro chip, 18GB RAM, 512GB SSD',
        price: 1999.99,
        sku: 'MBP-14-M3',
      },
    }),
    prisma.product.create({
      data: {
        name: 'AirPods Pro 2',
        description: 'Active Noise Cancellation, USB-C',
        price: 249.99,
        sku: 'AIRPODS-PRO-2',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gaming Mouse',
        description: 'Wireless gaming mouse with RGB',
        price: 79.99,
        sku: 'GAMING-MOUSE-WL',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard, Cherry MX switches',
        price: 149.99,
        sku: 'MECH-KB-RGB',
      },
    }),
    prisma.product.create({
      data: {
        name: '4K Monitor',
        description: '27" 4K IPS display, 144Hz',
        price: 449.99,
        sku: 'MONITOR-4K-27',
      },
    }),
  ])

  console.log('Products created')

  // Create inventory for each product in each warehouse
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse1.id,
        totalStock: Math.floor(Math.random() * 20) + 10,
        reservedStock: 0,
      },
    })

    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse2.id,
        totalStock: Math.floor(Math.random() * 20) + 5,
        reservedStock: 0,
      },
    })
  }

  console.log('Inventory created successfully')
  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
