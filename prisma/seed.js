// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs'); // برای هش کردن رمز عبور

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع پر کردن دیتابیس...');

  // پاک کردن داده‌های قبلی (به ترتیب وابستگی‌ها)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  داده‌های قبلی پاک شدند.');

  // ============================
  // ۱. ساخت کاربران
  // ============================
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // یک ادمین ثابت
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'مدیر سیستم',
        phone: '9121234567',
        password: hashedPassword,
        role: 'ADMIN',
      },
    }),
    // ۱۰ کاربر تصادفی
    ...Array.from({ length: 50 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          // تبدیل عدد به رشته با فرمت شماره موبایل ایران
          phone: '09' + faker.string.numeric(9),
          password: hashedPassword,
          role: 'CUSTOMER',
        },
      })
    ),
  ]);
  console.log(`✅ ${users.length} کاربر ساخته شد.`);

  // ============================
  // ۲. ساخت دسته‌بندی‌ها
  // ============================
  const categoryNames = [
    'الکترونیک',
    'پوشاک',
    'کتاب',
    'لوازم خانگی',
    'ورزشی',
  ];

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
  // ۳. ساخت محصولات
  // ============================
  const products = await Promise.all(
    Array.from({ length: 50 }).map(() => {
      const category = faker.helpers.arrayElement(categories);
      return prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price({ min: 10000, max: 5000000 })),
          stock: faker.number.int({ min: 0, max: 100 }),
          imageUrl: faker.image.urlLoremFlickr({ category: 'product' }),
          isActive: faker.datatype.boolean(0.9), // ۹۰٪ فعال
          categoryId: category.id,
        },
      });
    })
  );
  console.log(`✅ ${products.length} محصول ساخته شد.`);

  // ============================
  // ۴. ساخت سبد خرید برای هر کاربر
  // ============================
  // const customerUsers = users.filter((u) => u.role === 'CUSTOMER');

  // const carts = await Promise.all(
  //   customerUsers.map((user) =>
  //     prisma.cart.create({
  //       data: {
  //         userId: user.id,
  //         items: {
  //           create: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(() => {
  //             const product = faker.helpers.arrayElement(products);
  //             return {
  //               productId: product.id,
  //               quantity: faker.number.int({ min: 1, max: 3 }),
  //             };
  //           }),
  //         },
  //       },
  //     })
  //   )
  // );
  // console.log(`✅ ${carts.length} سبد خرید ساخته شد.`);
  // ============================
  // ۴. ساخت سبد خرید
  // ============================
  const customerUsers = users.filter((u) => u.role === 'CUSTOMER');
  
  const carts = await Promise.all(
    customerUsers.map(async (user) => {
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, itemCount);
    
      return prisma.cart.create({
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
    })
  );
  
  console.log(`✅ ${carts.length} سبد خرید ساخته شد.`);
  // ============================
  // ۵. ساخت سفارش‌ها
  // ============================
  const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const orders = await Promise.all(
    customerUsers.map((user) => {
      // هر کاربر بین ۰ تا ۳ سفارش دارد
      const orderCount = faker.number.int({ min: 0, max: 3 });
      return Promise.all(
        Array.from({ length: orderCount }).map(async () => {
          // انتخاب ۱ تا ۴ محصول برای این سفارش
          const itemCount = faker.number.int({ min: 1, max: 4 });
          const selectedProducts = faker.helpers.arrayElements(products, itemCount);

          // محاسبه مجموع
          let totalAmount = 0;
          const orderItemsData = selectedProducts.map((product) => {
            const quantity = faker.number.int({ min: 1, max: 3 });
            const price = Number(product.price);
            totalAmount += price * quantity;
            return {
              productId: product.id,
              quantity,
              price: price,
            };
          });

          return prisma.order.create({
            data: {
              userId: user.id,
              status: faker.helpers.arrayElement(statuses),
              totalAmount: totalAmount,
              address: faker.location.streetAddress({ useFullAddress: true }),
              items: {
                create: orderItemsData,
              },
            },
          });
        })
      );
    })
  );

  const flatOrders = orders.flat();
  console.log(`✅ ${flatOrders.length} سفارش ساخته شد.`);

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