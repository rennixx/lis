import { Router } from 'express';
import { appConfig } from '../config/app.config';
import { ApiResponse } from '../utils/ApiResponse';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import orderRoutes from './order.routes';
import testRoutes from './test.routes';
import sampleRoutes from './sample.routes';
import resultRoutes from './result.routes';
import reportRoutes from './report.routes';
import analyticsRoutes from './analytics.routes';
import sampleDataRoutes from './sampleData.routes';

const router = Router();


// Health check
router.get('/health', (req, res) => {
  ApiResponse.success(res, JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'LIS Backend API',
    version: '1.0.0',
  }));
});

// Database info endpoint
router.get('/db-info', (req, res) => {
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;

  if (db) {
    db.listCollections().toArray().then(collections => {
      res.json({
        database: mongoose.connection.name || 'default database',
        collections: collections.map(c => c.name),
        reportsCollection: collections.some(c => c.name === 'reports')
      });
    }).catch(err => {
      res.status(500).json({ error: 'Error listing collections', details: err.message });
    });
  } else {
    res.status(500).json({ error: 'Database not connected' });
  }
});

// API routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/orders', orderRoutes);
router.use('/tests', testRoutes);
router.use('/samples', sampleRoutes);
router.use('/results', resultRoutes);
router.use('/reports', reportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/sample-data', sampleDataRoutes);

export default router;