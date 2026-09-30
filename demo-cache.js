// demo-cache.js
const cache = require('./src/services/cache.service');
const prisma = require('./src/config/prisma');

async function demo() {
  const start = Date.now();

  // بار اول: از MySQL می‌خواند
  const first = await cache.remember('products', 60, async () => {
    console.log('🔍 از MySQL خوانده می‌شود...');
    return prisma.product.findMany();
  });
  console.log(`بار اول: ${Date.now() - start}ms، تعداد: ${first.length}`);

  // بار دوم: از Redis می‌خواند
  const start2 = Date.now();
  const second = await cache.remember('products', 60, async () => {
    console.log('🔍 از MySQL خوانده می‌شود...');
    return prisma.product.findMany();
  });
  console.log(`بار دوم: ${Date.now() - start2}ms، تعداد: ${second.length}`);

  process.exit(0);
}

demo().catch(console.error);