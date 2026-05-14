import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Delete existing data (for idempotency)
  await prisma.reservation.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.warehouse.deleteMany()

  console.log('Existing data cleared')

  // Create warehouses
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: { name: 'Mumbai Central Warehouse', location: 'Mumbai, Maharashtra' },
    }),
    prisma.warehouse.create({
      data: { name: 'Delhi Distribution Hub', location: 'Delhi, India' },
    }),
    prisma.warehouse.create({
      data: { name: 'Bengaluru Tech Warehouse', location: 'Bengaluru, Karnataka' },
    }),
    prisma.warehouse.create({
      data: { name: 'Hyderabad Storage Center', location: 'Hyderabad, Telangana' },
    }),
    prisma.warehouse.create({
      data: { name: 'Pune Fulfillment Center', location: 'Pune, Maharashtra' },
    }),
  ])

  console.log('Warehouses created')

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip',
        price: 129999,
        sku: 'IPHONE-15-PRO',
      },
    }),
    prisma.product.create({
      data: {
        name: 'OnePlus 12',
        description: 'Snapdragon 8 Gen 3, 16GB RAM',
        price: 64999,
        sku: 'ONEPLUS-12',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Boat Rockerz Headphones',
        description: 'Wireless bluetooth headphones',
        price: 1499,
        sku: 'BOAT-ROCKERZ',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Logitech Gaming Mouse',
        description: 'Wireless gaming mouse with RGB',
        price: 3999,
        sku: 'LOGI-MOUSE',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Dell 4K Monitor',
        description: '27" 4K IPS display, 144Hz',
        price: 28999,
        sku: 'DELL-4K-27',
      },
    }),
    prisma.product.create({
      data: {
        name: 'HP Pavilion Laptop',
        description: 'Intel Core i7, 16GB RAM, 512GB SSD',
        price: 74999,
        sku: 'HP-PAVILION',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Zebronics Mechanical Keyboard',
        description: 'RGB mechanical keyboard, Outemu Blue switches',
        price: 2499,
        sku: 'ZEB-MECH-KB',
      },
    }),
  ])

  console.log('Products created')

  // Create inventory for each product in randomized warehouses
  for (const product of products) {
    // Pick 2-3 random warehouses for each product to have inventory
    const shuffledWarehouses = warehouses.sort(() => 0.5 - Math.random()).slice(0, 3)
    
    for (const warehouse of shuffledWarehouses) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          totalStock: Math.floor(Math.random() * 50) + 20,
          reservedStock: 0,
        },
      })
    }
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
