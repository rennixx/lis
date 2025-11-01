"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = exports.formatCurrency = exports.debounce = exports.groupBy = exports.deepClone = exports.generateRandomString = exports.isValidPhone = exports.isValidEmail = exports.createSearchQuery = exports.sanitizeSearchString = exports.formatDate = exports.calculateAge = exports.omit = exports.pick = exports.extractFields = exports.createPaginationMeta = exports.parseSort = exports.parsePagination = exports.toObjectId = exports.validateObjectId = exports.isValidObjectId = void 0;
const mongoose_1 = require("mongoose");
const ApiError_1 = require("./ApiError");
const isValidObjectId = (id) => {
    return mongoose_1.Types.ObjectId.isValid(id);
};
exports.isValidObjectId = isValidObjectId;
const validateObjectId = (id, fieldName = 'ID') => {
    if (!(0, exports.isValidObjectId)(id)) {
        throw new ApiError_1.ApiError(`Invalid ${fieldName}: ${id}`, 400);
    }
    return id;
};
exports.validateObjectId = validateObjectId;
const toObjectId = (id) => {
    (0, exports.validateObjectId)(id);
    return new mongoose_1.Types.ObjectId(id);
};
exports.toObjectId = toObjectId;
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.parsePagination = parsePagination;
const parseSort = (query, defaultSort = '-createdAt') => {
    const sort = query.sort || defaultSort;
    const order = query.order || 'desc';
    return { [sort]: order === 'desc' ? -1 : 1 };
};
exports.parseSort = parseSort;
const createPaginationMeta = (page, limit, total) => {
    return {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
    };
};
exports.createPaginationMeta = createPaginationMeta;
const extractFields = (fields) => {
    return fields.join(' ');
};
exports.extractFields = extractFields;
const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};
exports.pick = pick;
const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};
exports.omit = omit;
const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
exports.calculateAge = calculateAge;
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    switch (format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        default:
            return d.toISOString();
    }
};
exports.formatDate = formatDate;
const sanitizeSearchString = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};
exports.sanitizeSearchString = sanitizeSearchString;
const createSearchQuery = (searchTerm, fields) => {
    const sanitized = (0, exports.sanitizeSearchString)(searchTerm);
    const searchRegex = new RegExp(sanitized, 'i');
    return {
        $or: fields.map(field => ({ [field]: searchRegex }))
    };
};
exports.createSearchQuery = createSearchQuery;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};
exports.isValidPhone = isValidPhone;
const generateRandomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepClone = deepClone;
const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
};
exports.groupBy = groupBy;
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
exports.debounce = debounce;
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const generateSlug = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.generateSlug = generateSlug;
