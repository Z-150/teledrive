"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILES_JWT_SECRET = exports.API_JWT_SECRET = exports.CACHE_FILES_LIMIT = exports.PROCESS_RETRY = exports.CONNECTION_RETRIES = exports.COOKIE_AGE = exports.TG_CREDS = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const human_format_1 = require("human-format");
exports.TG_CREDS = {
    apiId: Number(process.env.TG_API_ID),
    apiHash: process.env.TG_API_HASH
};
exports.COOKIE_AGE = 54e6;
exports.CONNECTION_RETRIES = 10;
exports.PROCESS_RETRY = 50;
exports.CACHE_FILES_LIMIT = (0, human_format_1.parse)(process.env.CACHE_FILES_LIMIT || '20GB');
const keys = (0, fs_1.existsSync)(`${__dirname}/../../keys`) ? (0, fs_1.readFileSync)(`${__dirname}/../../keys`, 'utf-8') : null;
const [apiSecret, filesSecret] = ((_a = keys === null || keys === void 0 ? void 0 : keys.toString()) === null || _a === void 0 ? void 0 : _a.split('\n')) || [
    (0, crypto_1.randomBytes)(48).toString('base64'),
    (0, crypto_1.randomBytes)(48).toString('base64')
];
if (!process.env.API_JWT_SECRET) {
    process.env.API_JWT_SECRET = apiSecret;
    (0, fs_1.writeFileSync)(`${__dirname}/../../keys`, process.env.API_JWT_SECRET);
}
if (!process.env.FILES_JWT_SECRET) {
    process.env.FILES_JWT_SECRET = filesSecret;
    (0, fs_1.appendFileSync)(`${__dirname}/../../keys`, `\n${process.env.FILES_JWT_SECRET}`);
}
exports.API_JWT_SECRET = process.env.API_JWT_SECRET;
exports.FILES_JWT_SECRET = process.env.FILES_JWT_SECRET;
//# sourceMappingURL=Constant.js.map