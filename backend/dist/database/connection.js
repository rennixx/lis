"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const database_config_1 = require("../config/database.config");
const gridfs_1 = require("../utils/gridfs");
const initializeDatabase = async () => {
    try {
        await (0, database_config_1.connectDatabase)();
        await (0, gridfs_1.initGridFS)();
        console.log('📁 GridFS initialized for PDF storage');
        console.log('🗄️ Database connection initialized');
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
