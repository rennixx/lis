import { connectDatabase } from '../config/database.config';
import { initGridFS } from '../utils/gridfs';

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await connectDatabase();

    // Initialize GridFS for PDF storage
    await initGridFS();
    console.log('📁 GridFS initialized for PDF storage');

    console.log('🗄️ Database connection initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};