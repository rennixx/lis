"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApiResponse_1 = require("../utils/ApiResponse");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const patient_routes_1 = __importDefault(require("./patient.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const test_routes_1 = __importDefault(require("./test.routes"));
const sample_routes_1 = __importDefault(require("./sample.routes"));
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    ApiResponse_1.ApiResponse.success(res, JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'LIS Backend API',
        version: '1.0.0',
    }));
});
router.use('/auth', auth_routes_1.default);
router.use('/patients', patient_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/tests', test_routes_1.default);
router.use('/samples', sample_routes_1.default);
exports.default = router;
