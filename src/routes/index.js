const { json } = require('express');
const express = require('express');
const router = express.Router();

// Import routes
// const userRoutes = require('./v1/userRoutes');
// const customerRoutes = require('./v1/customerRoutes');

// API version 1 routes
// router.use('/users', userRoutes);
// router.use('/customers', customerRoutes);

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        projectName : 'Anonymous-project-14050620' ,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: 'v1'
    });
});

// Documentation
router.get('/docs', (req, res) => {
    res.json({
        name: 'Anonymous-project-14050620 Management API',
        version: '1.0.0',
        endpoints: {
            'GET /api/v1/users': 'Get all users',
            'GET /api/v1/users/:id': 'Get user by ID',
            'POST /api/v1/users': 'Create new user',
            'PUT /api/v1/users/:id': 'Update user',
            'DELETE /api/v1/users/:id': 'Delete user',
            'GET /api/v1/users/stats': 'Get user statistics',
            'GET /api/v1/users/age-range': 'Get users by age range'
        }
    });
});


router.use('/users', require('./v1/user.routes'));
// router.use('/products', require('./product.routes'));
// router.use('/orders', require('./order.routes'));
// router.use('/categories', require('./category.routes'));
// router.use('/carts', require('./cart.routes'));
// router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;