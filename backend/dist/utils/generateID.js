"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDGenerator = void 0;
class IDGenerator {
    static async generatePatientId() {
        const year = new Date().getFullYear();
        const counter = await this.getCounter('patientId');
        const patientId = `PAT-${year}-${String(counter.value).padStart(6, '0')}`;
        await this.incrementCounter('patientId');
        return patientId;
    }
    static async generateOrderNumber() {
        const year = new Date().getFullYear();
        const counter = await this.getCounter('orderNumber');
        const orderNumber = `ORD-${year}-${String(counter.value).padStart(6, '0')}`;
        await this.incrementCounter('orderNumber');
        return orderNumber;
    }
    static async generateReportNumber() {
        const year = new Date().getFullYear();
        const counter = await this.getCounter('reportNumber');
        const reportNumber = `RPT-${year}-${String(counter.value).padStart(6, '0')}`;
        await this.incrementCounter('reportNumber');
        return reportNumber;
    }
    static async generateTestCode() {
        const counter = await this.getCounter('testCode');
        const testCode = `TST-${String(counter.value).padStart(4, '0')}`;
        await this.incrementCounter('testCode');
        return testCode;
    }
    static async generateSampleId() {
        const year = new Date().getFullYear();
        const counter = await this.getCounter('sampleId');
        const sampleId = `SPL-${year}-${String(counter.value).padStart(6, '0')}`;
        await this.incrementCounter('sampleId');
        return sampleId;
    }
    static async generateBarcode() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const counter = await this.getCounter('barcode');
        const barcode = `SMP-${date}-${String(counter.value).padStart(6, '0')}`;
        await this.incrementCounter('barcode');
        return barcode;
    }
    static async getCounter(name) {
        try {
            const Counter = require('../models/Counter.model').default;
            let counter = await Counter.findOne({ name });
            if (!counter) {
                counter = await Counter.create({ name, value: 1 });
            }
            return counter;
        }
        catch (error) {
            return {
                _id: 'mock',
                name,
                value: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
    }
    static async incrementCounter(name) {
        try {
            const Counter = require('../models/Counter.model').default;
            await Counter.findOneAndUpdate({ name }, { $inc: { value: 1 } }, { upsert: true, new: true });
        }
        catch (error) {
            console.warn('Counter increment failed:', error.message);
        }
    }
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    static generateShortId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
exports.IDGenerator = IDGenerator;
