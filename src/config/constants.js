
require('dotenv').config();

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,
    
    // Database
    DB: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        multipleStatements: false
    },
    
    // Session
    SESSION: {
        secret: process.env.SESSION_SECRET,
        expire: parseInt(process.env.SESSION_EXPIRE, 10) || 86400000
    },
    
    // Pagination defaults
    PAGINATION: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100
    },
    
    // JWT
    JWT: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRE || '7d'
    }
};