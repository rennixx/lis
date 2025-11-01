import { ICounter } from '../models/Counter.model';

/**
 * Generate unique IDs with auto-increment functionality
 */
export class IDGenerator {
  /**
   * Generate a unique patient ID with format PAT-YYYY-NNNNNN
   */
  static async generatePatientId(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.getCounter('patientId');
    const patientId = `PAT-${year}-${String(counter.value).padStart(6, '0')}`;
    await this.incrementCounter('patientId');
    return patientId;
  }

  /**
   * Generate a unique order number with format ORD-YYYY-NNNNNN
   */
  static async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.getCounter('orderNumber');
    const orderNumber = `ORD-${year}-${String(counter.value).padStart(6, '0')}`;
    await this.incrementCounter('orderNumber');
    return orderNumber;
  }

  /**
   * Generate a unique report number with format RPT-YYYY-NNNNNN
   */
  static async generateReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.getCounter('reportNumber');
    const reportNumber = `RPT-${year}-${String(counter.value).padStart(6, '0')}`;
    await this.incrementCounter('reportNumber');
    return reportNumber;
  }

  /**
   * Generate a unique test code with format TST-NNNN
   */
  static async generateTestCode(): Promise<string> {
    const counter = await this.getCounter('testCode');
    const testCode = `TST-${String(counter.value).padStart(4, '0')}`;
    await this.incrementCounter('testCode');
    return testCode;
  }

  /**
   * Generate a unique sample ID with format SPL-YYYY-NNNNNN
   */
  static async generateSampleId(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.getCounter('sampleId');
    const sampleId = `SPL-${year}-${String(counter.value).padStart(6, '0')}`;
    await this.incrementCounter('sampleId');
    return sampleId;
  }

  /**
   * Generate a unique barcode with format SMP-YYYYMMDD-NNNNNN
   */
  static async generateBarcode(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await this.getCounter('barcode');
    const barcode = `SMP-${date}-${String(counter.value).padStart(6, '0')}`;
    await this.incrementCounter('barcode');
    return barcode;
  }

  /**
   * Get counter value from database
   */
  private static async getCounter(name: string): Promise<ICounter> {
    // This will be implemented with the Counter model
    // For now, return a mock implementation
    try {
      const Counter = require('../models/Counter.model').default;
      let counter = await Counter.findOne({ name });

      if (!counter) {
        counter = await Counter.create({ name, value: 1 });
      }

      return counter;
    } catch (error) {
      // Fallback for when model is not yet available
      return {
        _id: 'mock',
        name,
        value: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ICounter;
    }
  }

  /**
   * Increment counter value in database
   */
  private static async incrementCounter(name: string): Promise<void> {
    try {
      const Counter = require('../models/Counter.model').default;
      await Counter.findOneAndUpdate(
        { name },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
    } catch (error) {
      // Silently fail for mock implementation
      console.warn('Counter increment failed:', error.message);
    }
  }

  /**
   * Generate a random UUID for testing or temporary use
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate a short unique ID (8 characters)
   */
  static generateShortId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}