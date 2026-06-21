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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMaybe = exports.Auth = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const telegram_1 = require("telegram");
const Logger_1 = require("telegram/extensions/Logger");
const sessions_1 = require("telegram/sessions");
const model_1 = require("../../model");
const Cache_1 = require("../../service/Cache");
const Constant_1 = require("../../utils/Constant");
function Auth(req, _, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const authkey = (_a = (req.headers.authorization || req.cookies.authorization)) === null || _a === void 0 ? void 0 : _a.replace(/^Bearer\ /gi, '');
        if (!authkey) {
            throw { status: 401, body: { error: 'Auth key is required' } };
        }
        let data;
        try {
            data = (0, jsonwebtoken_1.verify)(authkey, Constant_1.API_JWT_SECRET);
        }
        catch (error) {
            throw { status: 401, body: { error: 'Access token is invalid' } };
        }
        try {
            const session = new sessions_1.StringSession(data.session);
            req.tg = new telegram_1.TelegramClient(session, Constant_1.TG_CREDS.apiId, Constant_1.TG_CREDS.apiHash, Object.assign({ connectionRetries: Constant_1.CONNECTION_RETRIES, useWSS: false }, process.env.ENV === 'production' ? { baseLogger: new telegram_1.Logger(Logger_1.LogLevel.NONE) } : {}));
        }
        catch (error) {
            throw { status: 401, body: { error: 'Invalid key' } };
        }
        yield req.tg.connect();
        req.authKey = authkey;
        const [userAuth, user] = yield Cache_1.Redis.connect().getFromCacheFirst(`auth:${authkey}`, () => __awaiter(this, void 0, void 0, function* () {
            let userAuth;
            try {
                userAuth = yield req.tg.getMe();
            }
            catch (error) {
                try {
                    yield new Promise((resolve) => setTimeout(resolve, 2000));
                    yield req.tg.connect();
                    userAuth = yield req.tg.getMe();
                }
                catch (error) {
                    yield new Promise((resolve) => setTimeout(resolve, 2000));
                    yield req.tg.connect();
                    userAuth = yield req.tg.getMe();
                }
            }
            const user = yield model_1.prisma.users.findFirst({ where: { tg_id: userAuth['id'].toString() } });
            if (!user) {
                throw { status: 401, body: { error: 'User not found' } };
            }
            return [userAuth, user];
        }), 54000);
        req.user = user;
        req.userAuth = userAuth;
        return next();
    });
}
exports.Auth = Auth;
function AuthMaybe(req, _, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const authkey = (_a = (req.headers.authorization || req.cookies.authorization)) === null || _a === void 0 ? void 0 : _a.replace(/^Bearer\ /gi, '');
        if (authkey) {
            let data;
            try {
                data = (0, jsonwebtoken_1.verify)(authkey, Constant_1.API_JWT_SECRET);
            }
            catch (error) {
                return next();
            }
            try {
                const session = new sessions_1.StringSession(data.session);
                req.tg = new telegram_1.TelegramClient(session, Constant_1.TG_CREDS.apiId, Constant_1.TG_CREDS.apiHash, Object.assign({ connectionRetries: Constant_1.CONNECTION_RETRIES, useWSS: false }, process.env.ENV === 'production' ? { baseLogger: new telegram_1.Logger(Logger_1.LogLevel.NONE) } : {}));
            }
            catch (error) {
                return next();
            }
            yield req.tg.connect();
            req.authKey = authkey;
            const [userAuth, user] = yield Cache_1.Redis.connect().getFromCacheFirst(`auth:${authkey}`, () => __awaiter(this, void 0, void 0, function* () {
                let userAuth = null;
                try {
                    userAuth = yield req.tg.getMe();
                }
                catch (error) {
                    try {
                        yield new Promise((resolve) => setTimeout(resolve, 2000));
                        yield req.tg.connect();
                        userAuth = yield req.tg.getMe();
                    }
                    catch (error) {
                        yield new Promise((resolve) => setTimeout(resolve, 2000));
                        yield req.tg.connect();
                        userAuth = yield req.tg.getMe();
                    }
                }
                const user = yield model_1.prisma.users.findFirst({ where: { tg_id: userAuth['id'].toString() } });
                if (!user) {
                    return [userAuth, null];
                }
                return [userAuth, user];
            }), 54000);
            req.user = user;
            req.userAuth = userAuth;
        }
        return next();
    });
}
exports.AuthMaybe = AuthMaybe;
//# sourceMappingURL=Auth.js.map