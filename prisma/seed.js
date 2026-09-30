// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع پر کردن دیتابیس...');

  // پاک کردن داده‌های قبلی (به ترتیب وابستگی)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany(); // ← جدید
  await prisma.user.deleteMany();
  console.log('🗑️  داده‌های قبلی پاک شدند.');

  // ============================
  // ۱. ساخت کاربران
  // ============================
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ادمین ثابت
  await prisma.user.create({
    data: {
      name: 'مدیر سیستم',
      phone: '09121234567',
      email: 'admin@example.com',
      password: hashedPassword,
      nationalCode: '0012345678',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
    },
  });

  // ۵۰ کاربر تصادفی
  const usersData = Array.from({ length: 50 }).map((_, i) => ({
    name: faker.person.fullName(),
    phone: '09' + String(100000000 + i).padStart(9, '0'),
    email: faker.internet.email(),
    password: hashedPassword,
    nationalCode: String(1000000000 + i).padStart(10, '0'),
    avatar: faker.image.avatar(),
    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
    role: 'CUSTOMER',
    isActive: faker.datatype.boolean(0.9),
    isVerified: faker.datatype.boolean(0.7),
    lastLoginAt: faker.date.recent({ days: 30 }),
  }));

  const result = await prisma.user.createMany({
    data: usersData,
    skipDuplicates: true,
  });
  console.log(`✅ ${result.count + 1} کاربر ساخته شد.`);

  // خواندن همه کاربران
  const users = await prisma.user.findMany();
  const customerUsers = users.filter((u) => u.role === 'CUSTOMER');

  // ============================
  // ۲. ساخت آدرس‌ها
  // ============================
  const addressTitles = ['خانه', 'محل کار', 'خانه پدری', 'ویلا'];
  const provinces = [
    'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی',
    'گیلان', 'مازندران', 'البرز', 'خوزستان', 'کرمان',
  ];

  const allAddresses = [];

  for (const user of customerUsers) {
    // هر کاربر بین ۱ تا ۳ آدرس دارد
    const addressCount = faker.number.int({ min: 1, max: 3 });

    // برای اطمینان از اینکه فقط یک آدرس پیش‌فرض وجود دارد
    const defaultIndex = faker.number.int({ min: 0, max: addressCount - 1 });

    for (let i = 0; i < addressCount; i++) {
      const address = await prisma.address.create({
        data: {
          userId: user.id,
          title: faker.helpers.arrayElement(addressTitles),
          receiverName: faker.person.fullName(),
          receiverPhone: '09' + faker.string.numeric(9),
          province: faker.helpers.arrayElement(provinces),
          city: faker.location.city(),
          postalCode: faker.string.numeric(10),
          fullAddress: faker.location.streetAddress({ useFullAddress: true }),
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
          isDefault: i === defaultIndex,
          isActive: true,
        },
      });

      allAddresses.push(address);
    }
  }
  console.log(`✅ ${allAddresses.length} آدرس ساخته شد.`);

  // ============================
  // ۳. ساخت دسته‌بندی‌ها
  // ============================
  const categoryNames = ['الکترونیک', 'پوشاک', 'کتاب', 'لوازم خانگی', 'ورزشی'];

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: {
          name,
          description: faker.commerce.productDescription(),
        },
      })
    )
  );
  console.log(`✅ ${categories.length} دسته‌بندی ساخته شد.`);

  // ============================
  // ۴. ساخت محصولات
  // ============================
  const products = await Promise.all(
    Array.from({ length: 30 }).map(() => {
      const category = faker.helpers.arrayElement(categories);
      return prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price({ min: 10000, max: 5000000 })),
          stock: faker.number.int({ min: 0, max: 100 }),
          imageUrl: faker.image.urlLoremFlickr({ category: 'product' }),
          isActive: faker.datatype.boolean(0.9),
          categoryId: category.id,
        },
      });
    })
  );
  console.log(`✅ ${products.length} محصول ساخته شد.`);

  // ============================
  // ۵. ساخت سبد خرید
  // ============================
  const carts = [];

  for (const user of customerUsers) {
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(products, itemCount);

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        items: {
          create: selectedProducts.map((product) => ({
            productId: product.id,
            quantity: faker.number.int({ min: 1, max: 3 }),
          })),
        },
      },
    });

    carts.push(cart);
  }
  console.log(`✅ ${carts.length} سبد خرید ساخته شد.`);

  // ============================
  // ۶. ساخت سفارش‌ها
  // ============================
  const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const allOrders = [];

  for (const user of customerUsers) {
    const orderCount = faker.number.int({ min: 0, max: 3 });

    // پیدا کردن آدرس پیش‌فرض کاربر (اگر وجود داشته باشد)
    const userDefaultAddress = await prisma.address.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    for (let i = 0; i < orderCount; i++) {
      const itemCount = faker.number.int({ min: 1, max: 4 });
      const selectedProducts = faker.helpers.arrayElements(products, itemCount);

      let totalAmount = 0;
      const orderItemsData = selectedProducts.map((product) => {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const price = Number(product.price);
        totalAmount += price * quantity;
        return { productId: product.id, quantity, price };
      });

      // استفاده از آدرس پیش‌فرض کاربر به عنوان آدرس سفارش
      const orderAddress = userDefaultAddress
        ? `${userDefaultAddress.province}، ${userDefaultAddress.city}، ${userDefaultAddress.fullAddress}`
        : faker.location.streetAddress({ useFullAddress: true });

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: faker.helpers.arrayElement(statuses),
          totalAmount,
          address: orderAddress,
          items: { create: orderItemsData },
        },
      });

      allOrders.push(order);
    }
  }
  console.log(`✅ ${allOrders.length} سفارش ساخته شد.`);

  console.log('\n🎉 پر کردن دیتابیس با موفقیت انجام شد!');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });