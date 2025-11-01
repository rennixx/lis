"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const database_config_1 = require("../config/database.config");
const initializeDatabase = async () => {
    try {
        await (0, database_config_1.connectDatabase)();
        console.log('🗄️ Database connection initialized');
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
