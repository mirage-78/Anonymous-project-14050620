const prisma = require('./../config/prisma');
const logger = require('./../utils/logger');

class Repository {
  /**
   * یافتن یا ساختن کاربر بر اساس شماره موبایل
  //  * @param {string} phone
  //  * @returns {Promise<Object>} user
   */
  async findOrCreateUser(phone) {
    try {
      const user = await prisma.user.upsert({
        where: { phone },
        update: {
          lastLoginAt: new Date(),
        },
        create: {
          phone,
          name: `کاربر ${phone.slice(-4)}`,
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user.isActive) {
        throw new ApiError('حساب کاربری شما غیرفعال است', 403);
      }

      return user;
    } catch (err) {
      logger.error('UserRepository.findOrCreateByPhone failed', {
        phone,
        error: err.message,
        code: err.code,
      });

      // اگر همزمان دو درخواست کاربر ساختند
      if (err.code === 'P2002') {
        return prisma.user.findUnique({
          where: { phone },
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            isActive: true,
          },
        });
      }

      throw new ApiError('خطا در ایجاد کاربر', 500);
    }
  }

  /**
   * یافتن کاربر بر اساس شماره موبایل
   */
  async findByPhone(phone) {
    return prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * یافتن کاربر بر اساس شناسه
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * به‌روزرسانی زمان آخرین ورود
   */
  async updateLastLogin(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
      select: { id: true, lastLoginAt: true },
    });
  }
}

module.exports = new Repository();