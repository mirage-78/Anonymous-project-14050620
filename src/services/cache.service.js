// src/services/cache.service.js
const redis = require('./../config/redis');

class CacheService {
  constructor(prefix = 'app') {
    this.prefix = prefix;
  }

  key(name) {
    return `${this.prefix}:${name}`;
  }

  async get(name) {
    const data = await redis.get(this.key(name));
    return data ? JSON.parse(data) : null;
  }

  async set(name, value, ttl = 300) {
    await redis.setex(this.key(name), ttl, JSON.stringify(value));
  }

  async delete(name) {
    await redis.del(this.key(name));
  }

  async remember(name, ttl, callback) {
    let data = await this.get(name);
    if (data === null) {
      data = await callback();
      await this.set(name, data, ttl);
    }
    return data;
  }

  async flush(pattern = '*') {
    const keys = await redis.keys(this.key(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

module.exports = new CacheService();