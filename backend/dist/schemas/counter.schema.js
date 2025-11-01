"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const counterSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    value: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
}, {
    timestamps: true,
    collection: 'counters',
});
exports.default = (0, mongoose_1.model)('Counter', counterSchema);
