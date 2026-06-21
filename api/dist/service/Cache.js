"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class Redis {
    constructor() {
        this.redis = process.env.REDIS_URI ? new ioredis_1.default(process.env.REDIS_URI) : null;
    }
    static connect() {
        var _a, _b, _c;
        if (!this.client) {
            this.client = new Redis();
        }
        (_a = this.client.redis) === null || _a === void 0 ? void 0 : _a.on('connect', () => console.log('redis: connected'));
        (_b = this.client.redis) === null || _b === void 0 ? void 0 : _b.on('ready', () => console.log('redis: ready'));
        (_c = this.client.redis) === null || _c === void 0 ? void 0 : _c.on('error', console.error);
        return this.client;
    }
    get(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield ((_a = this.redis) === null || _a === void 0 ? void 0 : _a.get(key));
            if (!result)
                return null;
            try {
                return JSON.parse(result);
            }
            catch (error) {
                return result;
            }
        });
    }
    set(key, data, ex) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (ex) {
                    return (yield ((_a = this.redis) === null || _a === void 0 ? void 0 : _a.set(key, JSON.stringify(data), 'EX', ex))) === 'OK';
                }
                else {
                    return (yield ((_b = this.redis) === null || _b === void 0 ? void 0 : _b.set(key, JSON.stringify(data)))) === 'OK';
                }
            }
            catch (error) {
                if (ex) {
                    return (yield ((_c = this.redis) === null || _c === void 0 ? void 0 : _c.set(key, data, 'EX', ex))) === 'OK';
                }
                else {
                    return (yield ((_d = this.redis) === null || _d === void 0 ? void 0 : _d.set(key, data))) === 'OK';
                }
            }
        });
    }
    del(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return (yield ((_a = this.redis) === null || _a === void 0 ? void 0 : _a.del(key))) === 1;
        });
    }
    getFromCacheFirst(key, fn, ex) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.get(key);
                if (result)
                    return result;
                const data = yield fn();
                yield this.set(key, data, ex);
                return data;
            }
            catch (error) {
                return yield fn();
            }
        });
    }
}
exports.Redis = Redis;
//# sourceMappingURL=Cache.js.map