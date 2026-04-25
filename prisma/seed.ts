import { hashPassword } from '../lib/password'
import { prisma } from '@/lib/prisma'

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
    update: {
      vendorSubdomain: 'demo',
      vendorDomainStatus: 'VERIFIED',
      vendorDomainVerifiedAt: new Date(),
      storefrontTagline: 'Authentic Indian cuisine — delivered hot.',
      storefrontAccentColor: '#ea580c',
      storefrontWhatsappPhone: '+213771234567',
    },
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
      // Public storefront: https://demo.${BASE_DOMAIN} (e.g. demo.al-baz.app)
      vendorSubdomain: 'demo',
      vendorDomainStatus: 'VERIFIED',
      vendorDomainVerifiedAt: new Date(),
      storefrontTagline: 'Authentic Indian cuisine — delivered hot.',
      storefrontAccentColor: '#ea580c',
      storefrontWhatsappPhone: '+213771234567',
    },
  })
  console.log('✅ Vendor created:', vendor.email, '→ storefront slug "demo"')

  // Catalog categories (customer browse / store.categoryId)
  console.log('Seeding catalog categories...')
  const catalogRows = [
    {
      slug: 'shops',
      name: 'Shops',
      nameAr: 'متاجر',
      nameFr: 'Boutiques',
      iconImage: '/icons/gifts-icon.png',
      color: 'bg-gradient-to-br from-emerald-100 to-green-50',
      iconColor: 'text-emerald-600',
      sortOrder: 0,
    },
    {
      slug: 'pharmacy-beauty',
      name: 'Pharmacy & Beauty',
      nameAr: 'صيدلية وتجميل',
      nameFr: 'Pharmacie & Beauté',
      iconImage: '/icons/pharmacy-and-supplements-icon.png',
      color: 'bg-gradient-to-br from-pink-100 to-rose-50',
      iconColor: 'text-pink-500',
      sortOrder: 1,
    },
    {
      slug: 'groceries',
      name: 'Groceries',
      nameAr: 'بقالة',
      nameFr: 'Épicerie',
      iconImage: '/icons/shops-and-groceries-icon--cart-.png',
      color: 'bg-gradient-to-br from-orange-100 to-amber-50',
      iconColor: 'text-orange-500',
      sortOrder: 2,
    },
    {
      slug: 'food',
      name: 'Food',
      nameAr: 'طعام',
      nameFr: 'Nourriture',
      iconImage: '/icons/food-icon--pizza-and-burger--.png',
      color: 'bg-gradient-to-br from-orange-100 to-yellow-50',
      iconColor: 'text-orange-600',
      sortOrder: 3,
    },
    {
      slug: 'package-delivery',
      name: 'Package Delivery',
      nameAr: 'توصيل الطرود',
      nameFr: 'Livraison de colis',
      iconImage: '/icons/package-delivery-icon--motorcyle-.png',
      color: 'bg-gradient-to-br from-yellow-100 to-amber-50',
      iconColor: 'text-yellow-600',
      sortOrder: 4,
    },
  ]
  for (const c of catalogRows) {
    await prisma.catalogCategory.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        iconImage: c.iconImage,
        color: c.color,
        iconColor: c.iconColor,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      create: { ...c, isActive: true },
    })
  }
  console.log('✅ Catalog categories ready')

  // Sample vendor payouts (finance tab)
  await prisma.vendorPayout.deleteMany({ where: { vendorId: vendor.id } })
  await prisma.vendorPayout.createMany({
    data: [
      {
        vendorId: vendor.id,
        periodLabel: 'This week',
        grossAmount: 125000,
        feesAmount: 2500,
        netAmount: 122500,
        status: 'pending',
        etaLabel: 'Friday',
      },
      {
        vendorId: vendor.id,
        periodLabel: 'Last week',
        grossAmount: 98000,
        feesAmount: 2000,
        netAmount: 96000,
        status: 'settled',
        etaLabel: 'Paid',
      },
    ],
  })
  console.log('✅ Vendor payouts seeded')

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

  // Create Delivery Zones
  const deliveryZones = [
    { name: 'Alger Centre', city: 'Alger', deliveryFee: 400, estimatedTime: 30, coordinates: [{ lat: 36.7538, lng: 3.0588 }] },
    { name: 'Oran', city: 'Oran', deliveryFee: 500, estimatedTime: 45, coordinates: [{ lat: 35.6969, lng: -0.6331 }] },
    { name: 'Tamanrasset', city: 'Tamanrasset', deliveryFee: 800, estimatedTime: 60, coordinates: [{ lat: 22.7850, lng: 5.5228 }] },
  ]
  for (const zone of deliveryZones) {
    const existing = await prisma.deliveryZone.findFirst({ where: { city: zone.city } })
    if (!existing) {
      await prisma.deliveryZone.create({
        data: {
          name: zone.name,
          city: zone.city,
          coordinates: zone.coordinates,
          deliveryFee: zone.deliveryFee,
          estimatedTime: zone.estimatedTime,
        },
      })
    }
  }
  console.log(`✅ Delivery zones ensured`)

  // Create Promo Codes
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  const promoCodes = [
    { code: 'WELCOME10', discountType: 'percent', discountValue: 10, maxDiscount: 1000, minOrderAmount: 500, usageLimit: 1000 },
    { code: 'SAVE15', discountType: 'percent', discountValue: 15, maxDiscount: 1500, minOrderAmount: 1000, usageLimit: 500 },
    { code: 'FLAT500', discountType: 'fixed', discountValue: 500, minOrderAmount: 2000, usageLimit: 200 },
  ]
  for (const p of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        discountType: p.discountType,
        discountValue: p.discountValue,
        maxDiscount: p.maxDiscount ?? null,
        minOrderAmount: p.minOrderAmount ?? null,
        usageLimit: p.usageLimit ?? null,
        expiresAt,
      },
    })
  }
  console.log(`✅ ${promoCodes.length} promo codes created`)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Test Accounts:')
  console.log('─────────────────────────────────────────')
  console.log('Admin:    admin@albazdelivery.com / Admin123!')
  console.log('Customer: customer@test.com / Customer123!')
  console.log('Vendor:   vendor@test.com / Vendor123!')
  console.log('Driver:   driver@test.com / Driver123!')
  console.log('─────────────────────────────────────────')
  console.log('\n🛍  Demo storefront:')
  console.log(`   Subdomain: demo.${process.env.BASE_DOMAIN || 'al-baz.app'}`)
  console.log('   Local:     http://demo.localhost:3000/ (after hosts file setup)')
  console.log('   See docs/CUSTOM_DOMAINS_README.md for local testing.')
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
