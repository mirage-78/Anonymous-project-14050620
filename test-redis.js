// test-redis.js
const redis = require('./src/config/redis');

async function test() {
  await redis.set('test-key', 'سلام Redis');
  const value = await redis.get('test-key');
  console.log('مقدار از Redis:', value);

  // تست کش Prisma
  const cache = require('./src/services/cache.service');
  await cache.set('demo', { name: 'علی', age: 30 }, 60);
  const cached = await cache.get('demo');
  console.log('مقدار از کش:', cached);

  process.exit(0);
}

test().catch(console.error);