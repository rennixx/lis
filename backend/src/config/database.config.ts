import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Use simple MongoDB connection for development
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const dbName = process.env.MONGODB_DB_NAME || '';
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10');

    // For development, ensure no replica set configuration
    if (process.env.NODE_ENV !== 'production') {
      // Remove any replicaSet parameters from the URI
      const url = new URL(mongoUri);
      url.searchParams.delete('replicaSet');
      mongoUri = url.toString();
    }

    // Configure mongoose options
    const options = {
      maxPoolSize,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV === 'development',
      connectTimeoutMS: 10000,
    };

    // Connect to MongoDB
    await mongoose.connect(mongoUri, options);

    // Connection name is set automatically from the URI
    logger.debug('MongoDB connection name:', mongoose.connection.name);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('✅ Connected to MongoDB', {
        uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
        database: dbName,
        maxPoolSize,
      });

      // Log actual database name for debugging
      console.log('🔗 Connected to MongoDB database:', mongoose.connection.name || 'default database');

      // Log collections for debugging
      const db = mongoose.connection.db;
      db.listCollections().toArray().then(collections => {
        console.log('📁 Available collections:', collections.map(c => c.name));

        // Check if reports collection exists
        const hasReports = collections.some(c => c.name === 'reports');
        console.log('📊 Reports collection exists:', hasReports);
      }).catch(err => {
        console.error('Error listing collections:', err);
      });
    });

    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error.message);
      // Attempt to reconnect after delay
      setTimeout(() => {
        logger.info('🔄 Attempting to reconnect to MongoDB...');
        connectDatabase().catch(err => {
          logger.error('MongoDB reconnection failed:', err.message);
        });
      }, 5000); // 5 seconds delay
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected successfully');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug('MongoDB Query:', { collectionName, method, query, doc });
      });
    }

    // Performance monitoring - bufferMaxEntries is now deprecated in Mongoose 7+
    // mongoose.set('bufferMaxEntries', 0); // Disable buffer

    logger.info('MongoDB connection established successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed successfully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};