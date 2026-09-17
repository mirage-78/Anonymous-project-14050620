// src/services/user.service.js
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

class UserService {
  // دریافت همه کاربران با صفحه‌بندی
  async getAll({ page = 1, limit = 10, search = '' }) {
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // دریافت یک کاربر
  async getById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    if (!user) throw ApiError.notFound('کاربر یافت نشد');
    return user;
  }

  // ایجاد کاربر
  async create({ email, name, phone, password, role = 'CUSTOMER' }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw ApiError.conflict('این ایمیل قبلاً ثبت شده');

    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
      data: { email, name, phone, password: hashedPassword, role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  // به‌روزرسانی
  async update(id, data) {
    await this.getById(id); // بررسی وجود
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, phone: true },
    });
  }

  // حذف
  async delete(id) {
    await this.getById(id);
    await prisma.user.delete({ where: { id } });
    return { message: 'کاربر حذف شد' };
  }
}

module.exports = new UserService();