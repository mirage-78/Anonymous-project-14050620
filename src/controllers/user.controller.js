// src/controllers/user.controller.js
const userService = require('../services/user.service');

class UserController {
  async list(req, res, next) {
    try {
      const result = await userService.getAll({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        search: req.query.search || '',
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err); // ارسال به errorHandler
    }
  }

  async getOne(req, res, next) {
    try {
      const user = await userService.getById(Number(req.params.id));
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await userService.delete(Number(req.params.id));
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();