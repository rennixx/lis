import { connectDatabase } from '../config/database.config';

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log('🗄️ Database connection initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};