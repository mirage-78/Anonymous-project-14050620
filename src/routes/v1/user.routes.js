// src/routes/user.routes.js
const express = require('express');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.get('/', userController.list.bind(userController));
router.get('/:id', userController.getOne.bind(userController));
router.post('/', userController.create.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', userController.remove.bind(userController));

module.exports = router;