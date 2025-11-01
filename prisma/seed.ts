import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Admin User
  console.log('Creating admin user...')
  const adminPassword = await hashPassword('Admin123!')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@albazdelivery.com' },
    update: {},
    create: {
      name: 'Admin AL-baz',
      email: 'admin@albazdelivery.com',
      phone: '0551234567',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      city: 'Algiers',
      address: '123 Admin Street, Algiers',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create Test Customer
  console.log('Creating test customer...')
  const customerPassword = await hashPassword('Customer123!')
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '0661234567',
      password: customerPassword,
      role: 'CUSTOMER',
      status: 'APPROVED',
      city: 'Algiers',
      address: '456 Customer Avenue, Algiers',
    },
  })

  // Create loyalty account for customer
  await prisma.loyaltyAccount.upsert({
    where: { customerId: customer.id },
    update: {},
    create: {
      customerId: customer.id,
      points: 100,
      totalPointsEarned: 100,
    },
  })

  // Create wallet for customer
  await prisma.wallet.upsert({
    where: { customerId: customer.id },
    update: {},
    create: {
      customerId: customer.id,
      balance: 1000.0,
      totalEarned: 1000.0,
    },
  })
  console.log('✅ Customer created:', customer.email)

  // Create Test Vendor
  console.log('Creating test vendor...')
  const vendorPassword = await hashPassword('Vendor123!')
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@test.com' },
    update: {},
    create: {
      name: 'Le Taj Mahal Restaurant',
      email: 'vendor@test.com',
      phone: '0771234567',
      password: vendorPassword,
      role: 'VENDOR',
      status: 'APPROVED',
      shopType: 'Restaurant',
      city: 'Algiers',
      address: '789 Restaurant Street, Algiers',
    },
  })
  console.log('✅ Vendor created:', vendor.email)

  // Create Store for Vendor
  console.log('Creating vendor store...')
  const store = await prisma.store.upsert({
    where: { id: 'store-taj-mahal' },
    update: {},
    create: {
      id: 'store-taj-mahal',
      name: 'Le Taj Mahal',
      type: 'Cuisine Indienne',
      categoryId: 1,
      vendorId: vendor.id,
      address: '789 Restaurant Street, Algiers',
      city: 'Algiers',
      phone: '0771234567',
      rating: 4.5,
      deliveryTime: '30-45 min',
      isActive: true,
    },
  })
  console.log('✅ Store created:', store.name)

  // Create Products for Store
  console.log('Creating products...')
  const products = [
    {
      id: 'prod-chicken-biryani',
      name: 'Chicken Biryani',
      description: 'Authentic Indian rice dish with tender chicken and aromatic spices',
      price: 1200.0,
      category: 'Main Course',
      rating: 4.8,
    },
    {
      id: 'prod-butter-chicken',
      name: 'Butter Chicken',
      description: 'Creamy tomato-based curry with succulent chicken pieces',
      price: 1400.0,
      category: 'Main Course',
      rating: 4.7,
    },
    {
      id: 'prod-naan-bread',
      name: 'Garlic Naan',
      description: 'Fresh baked flatbread with garlic and butter',
      price: 250.0,
      category: 'Bread',
      rating: 4.9,
    },
    {
      id: 'prod-mango-lassi',
      name: 'Mango Lassi',
      description: 'Refreshing yogurt-based drink with mango',
      price: 300.0,
      category: 'Beverages',
      rating: 4.6,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...product,
        storeId: store.id,
        available: true,
      },
    })
  }
  console.log(`✅ ${products.length} products created`)

  // Create Test Driver
  console.log('Creating test driver...')
  const driverPassword = await hashPassword('Driver123!')
  const driver = await prisma.user.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      name: 'Mohamed Delivery',
      email: 'driver@test.com',
      phone: '0561234567',
      password: driverPassword,
      role: 'DRIVER',
      status: 'APPROVED',
      licenseNumber: 'DL123456789',
      vehicleType: 'Motorcycle',
      city: 'Algiers',
      address: '321 Driver Road, Algiers',
    },
  })

  // Create driver performance record
  await prisma.driverPerformance.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      totalDeliveries: 0,
      averageDeliveryTime: 0,
      onTimePercentage: 100,
      rating: 5.0,
      earnings: 0,
    },
  })
  console.log('✅ Driver created:', driver.email)

  // Create Delivery Zones
  console.log('Creating delivery zones...')
  const zones = [
    {
      id: 'zone-algiers-center',
      name: 'Algiers Center',
      city: 'Algiers',
      deliveryFee: 200.0,
      estimatedTime: 30,
      coordinates: [
        { lat: 36.7538, lng: 3.0588 },
        { lat: 36.7538, lng: 3.0788 },
        { lat: 36.7338, lng: 3.0788 },
        { lat: 36.7338, lng: 3.0588 },
      ],
    },
    {
      id: 'zone-algiers-west',
      name: 'Algiers West',
      city: 'Algiers',
      deliveryFee: 300.0,
      estimatedTime: 45,
      coordinates: [
        { lat: 36.7538, lng: 3.0388 },
        { lat: 36.7538, lng: 3.0588 },
        { lat: 36.7338, lng: 3.0588 },
        { lat: 36.7338, lng: 3.0388 },
      ],
    },
  ]

  for (const zone of zones) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      update: {},
      create: {
        ...zone,
        coordinates: zone.coordinates,
        activeDrivers: 5,
        isActive: true,
      },
    })
  }
  console.log(`✅ ${zones.length} delivery zones created`)

  // Create Loyalty Rewards
  console.log('Creating loyalty rewards...')
  const rewards = [
    {
      id: 'reward-10-percent',
      name: '10% Off Next Order',
      description: 'Get 10% discount on your next order',
      pointsCost: 100,
      discount: 10,
      category: 'DISCOUNT' as const,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
    {
      id: 'reward-free-delivery',
      name: 'Free Delivery',
      description: 'Get free delivery on your next order',
      pointsCost: 50,
      discount: 0,
      category: 'DISCOUNT' as const,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'reward-bonus-points',
      name: 'Double Points',
      description: 'Earn double points on your next order',
      pointsCost: 200,
      discount: 0,
      category: 'BONUS_POINTS' as const,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const reward of rewards) {
    await prisma.loyaltyReward.upsert({
      where: { id: reward.id },
      update: {},
      create: reward,
    })
  }
  console.log(`✅ ${rewards.length} loyalty rewards created`)

  // Create Sample Order
  console.log('Creating sample order...')
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      vendorId: vendor.id,
      storeId: store.id,
      status: 'PENDING',
      subtotal: 1450.0,
      deliveryFee: 200.0,
      total: 1650.0,
      paymentMethod: 'CASH',
      deliveryAddress: '456 Customer Avenue, Algiers',
      city: 'Algiers',
      customerPhone: customer.phone,
      items: {
        create: [
          {
            productId: 'prod-chicken-biryani',
            quantity: 1,
            price: 1200.0,
          },
          {
            productId: 'prod-naan-bread',
            quantity: 1,
            price: 250.0,
          },
        ],
      },
    },
  })
  console.log('✅ Sample order created:', order.id)

  // Create inventory products for vendor ERP
  console.log('Creating inventory products...')
  const supplier = await prisma.supplier.create({
    data: {
      vendorId: vendor.id,
      name: 'Fresh Foods Supplier',
      contactPerson: 'Ahmed Supplier',
      phone: '0551112233',
      email: 'supplier@freshfoods.dz',
      address: 'Wholesale Market, Algiers',
    },
  })

  const inventoryProducts = [
    {
      sku: 'INV-001',
      name: 'Basmati Rice - 25kg',
      category: 'Grains',
      costPrice: 3000.0,
      sellingPrice: 3500.0,
      stock: 50,
      lowStockThreshold: 10,
    },
    {
      sku: 'INV-002',
      name: 'Chicken Breast - 1kg',
      category: 'Meat',
      costPrice: 800.0,
      sellingPrice: 1000.0,
      stock: 30,
      lowStockThreshold: 5,
    },
    {
      sku: 'INV-003',
      name: 'Tomato Paste - 2kg',
      category: 'Sauces',
      costPrice: 400.0,
      sellingPrice: 500.0,
      stock: 20,
      lowStockThreshold: 5,
    },
  ]

  for (const invProduct of inventoryProducts) {
    await prisma.inventoryProduct.create({
      data: {
        ...invProduct,
        vendorId: vendor.id,
        supplierId: supplier.id,
      },
    })
  }
  console.log(`✅ ${inventoryProducts.length} inventory products created`)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Test Accounts:')
  console.log('─────────────────────────────────────────')
  console.log('Admin:    admin@albazdelivery.com / Admin123!')
  console.log('Customer: customer@test.com / Customer123!')
  console.log('Vendor:   vendor@test.com / Vendor123!')
  console.log('Driver:   driver@test.com / Driver123!')
  console.log('─────────────────────────────────────────')
}

main()
  .then(async () => {
    if (prisma.$disconnect) await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    if (prisma.$disconnect) await prisma.$disconnect()
    process.exit(1)
  })
