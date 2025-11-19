"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const index_js_1 = require("../generated/prisma/index.js");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new index_js_1.PrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
