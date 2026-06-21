"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.Auth = void 0;
const crypto_js_1 = require("crypto-js");
const jsonwebtoken_1 = require("jsonwebtoken");
const serialize_error_1 = require("serialize-error");
const telegram_1 = require("telegram");
const Logger_1 = require("telegram/extensions/Logger");
const Helpers_1 = require("telegram/Helpers");
const Password_1 = require("telegram/Password");
const sessions_1 = require("telegram/sessions");
const model_1 = require("../../model");
const Cache_1 = require("../../service/Cache");
const Constant_1 = require("../../utils/Constant");
const Endpoint_1 = require("../base/Endpoint");
const TGClient_1 = require("../middlewares/TGClient");
const TGSessionAuth_1 = require("../middlewares/TGSessionAuth");
let Auth = class Auth {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username } = req.body;
            if (!username)
                throw { status: 400, body: { error: 'Telegram username is required' } };
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const limitDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentRegs = yield model_1.prisma.registrations.count({
                where: {
                    ip_address: ipAddress.toString(),
                    created_at: { gte: limitDate }
                }
            });
            if (recentRegs >= 2) {
                throw { status: 429, body: { error: 'Limit registrasi tercapai untuk IP ini (Max 2 per minggu).' } };
            }
            const otp = require('crypto').randomBytes(3).toString('hex').toUpperCase();
            yield model_1.prisma.registrations.create({
                data: {
                    tg_username: username.replace('@', ''),
                    ip_address: ipAddress.toString(),
                    otp,
                    status: 'PENDING_OTP'
                }
            });
            return res.send({ success: true, otp });
        });
    }
    sendCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                throw { status: 400, body: { error: 'Phone number is required' } };
            }
            yield req.tg.connect();
            const { phoneCodeHash, timeout } = yield req.tg.invoke(new telegram_1.Api.auth.SendCode(Object.assign(Object.assign({}, Constant_1.TG_CREDS), { phoneNumber, settings: new telegram_1.Api.CodeSettings({
                    allowFlashcall: true,
                    currentNumber: true,
                    allowAppHash: true,
                }) })));
            const session = req.tg.session.save();
            const accessToken = (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '3h' });
            return res.cookie('authorization', `Bearer ${accessToken}`)
                .send({ phoneCodeHash, timeout, accessToken });
        });
    }
    reSendCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, phoneCodeHash } = req.body;
            if (!phoneNumber || !phoneCodeHash) {
                throw { status: 400, body: { error: 'Phone number and phone code hash are required' } };
            }
            yield req.tg.connect();
            const { phoneCodeHash: newPhoneCodeHash, timeout } = yield req.tg.invoke(new telegram_1.Api.auth.ResendCode({
                phoneNumber, phoneCodeHash
            }));
            const session = req.tg.session.save();
            const accessToken = (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '3h' });
            return res.cookie('authorization', `Bearer ${accessToken}`)
                .send({ phoneCodeHash: newPhoneCodeHash, timeout, accessToken });
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, phoneCode, phoneCodeHash, password, invitationCode } = req.body;
            if ((!phoneNumber || !phoneCode || !phoneCodeHash) && !password) {
                if (!password) {
                    throw { status: 400, body: { error: 'Password is required' } };
                }
                throw { status: 400, body: { error: 'Phone number, phone code, and phone code hash are required' } };
            }
            yield req.tg.connect();
            let signIn;
            if (password) {
                const data = yield req.tg.invoke(new telegram_1.Api.account.GetPassword());
                data.newAlgo['salt1'] = Buffer.concat([data.newAlgo['salt1'], (0, Helpers_1.generateRandomBytes)(32)]);
                signIn = yield req.tg.invoke(new telegram_1.Api.auth.CheckPassword({ password: yield (0, Password_1.computeCheck)(data, password) }));
            }
            else {
                signIn = yield req.tg.invoke(new telegram_1.Api.auth.SignIn({ phoneNumber, phoneCode, phoneCodeHash }));
            }
            const userAuth = signIn['user'];
            if (!userAuth) {
                throw { status: 400, body: { error: 'User not found/authorized' } };
            }
            let user = yield model_1.prisma.users.findFirst({ where: { OR: [{ tg_id: userAuth.id.toString() }, { username: userAuth.username }] } });
            const config = yield model_1.prisma.config.findFirst();
            const username = userAuth.username || userAuth.phone || phoneNumber;
            if (!user) {
                if (config === null || config === void 0 ? void 0 : config.disable_signup) {
                    throw { status: 403, body: { error: 'Signup is disabled' } };
                }
                if ((config === null || config === void 0 ? void 0 : config.invitation_code) && (config === null || config === void 0 ? void 0 : config.invitation_code) !== invitationCode) {
                    throw { status: 403, body: { error: 'Invalid invitation code' } };
                }
                user = yield model_1.prisma.users.create({
                    data: {
                        username,
                        plan: 'premium',
                        name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
                        tg_id: userAuth.id.toString()
                    }
                });
            }
            yield model_1.prisma.users.update({
                data: {
                    username,
                    tg_id: userAuth.id.toString()
                },
                where: { id: user.id }
            });
            const session = req.tg.session.save();
            const auth = {
                session,
                accessToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '15h' }),
                refreshToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '1y' }),
                expiredAfter: Date.now() + Constant_1.COOKIE_AGE
            };
            res
                .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: Constant_1.COOKIE_AGE, expires: new Date(auth.expiredAfter) })
                .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
                .send(Object.assign({ user }, auth));
            model_1.prisma.files.findMany({
                where: {
                    AND: [
                        { user_id: user.id },
                        {
                            NOT: { signed_key: null }
                        }
                    ]
                }
            }).then(files => files === null || files === void 0 ? void 0 : files.map(file => {
                const signedKey = crypto_js_1.AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), Constant_1.FILES_JWT_SECRET).toString();
                model_1.prisma.files.update({
                    data: { signed_key: signedKey },
                    where: { id: file.id }
                });
            }));
        });
    }
    refreshToken(req, res) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.refreshToken) || ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.refreshToken);
            if (!refreshToken) {
                throw { status: 400, body: { error: 'Refresh token is required' } };
            }
            let data;
            try {
                data = (0, jsonwebtoken_1.verify)(refreshToken, Constant_1.API_JWT_SECRET);
            }
            catch (error) {
                throw { status: 400, body: { error: 'Refresh token is invalid' } };
            }
            try {
                const session = new sessions_1.StringSession(data.session);
                req.tg = new telegram_1.TelegramClient(session, Constant_1.TG_CREDS.apiId, Constant_1.TG_CREDS.apiHash, Object.assign({ connectionRetries: Constant_1.CONNECTION_RETRIES, useWSS: false }, process.env.ENV === 'production' ? { baseLogger: new telegram_1.Logger(Logger_1.LogLevel.NONE) } : {}));
            }
            catch (error) {
                throw { status: 400, body: { error: 'Invalid key' } };
            }
            try {
                yield req.tg.connect();
                const userAuth = yield req.tg.getMe();
                const user = yield model_1.prisma.users.findFirst({ where: { OR: [{ tg_id: userAuth['id'].toString() }, { username: userAuth['username'] }] } });
                if (!user) {
                    throw { status: 404, body: { error: 'User not found' } };
                }
                yield model_1.prisma.users.update({
                    data: {
                        username: ((_c = req.userAuth) === null || _c === void 0 ? void 0 : _c.username) || ((_d = req.userAuth) === null || _d === void 0 ? void 0 : _d.phone) || user.username,
                        tg_id: userAuth['id'].toString()
                    },
                    where: { id: user.id }
                });
                const session = req.tg.session.save();
                const auth = {
                    session,
                    accessToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '15h' }),
                    refreshToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '100y' }),
                    expiredAfter: Date.now() + Constant_1.COOKIE_AGE
                };
                return res
                    .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: Constant_1.COOKIE_AGE, expires: new Date(auth.expiredAfter) })
                    .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
                    .send(Object.assign({ user }, auth));
            }
            catch (error) {
                throw { status: 400, body: { error: error.message || 'Something error', details: (0, serialize_error_1.serializeError)(error) } };
            }
        });
    }
    qrCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield req.tg.connect();
            const data = yield req.tg.invoke(new telegram_1.Api.auth.ExportLoginToken(Object.assign(Object.assign({}, Constant_1.TG_CREDS), { exceptIds: [] })));
            const session = req.tg.session.save();
            const auth = {
                session,
                accessToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '15h' }),
                refreshToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '100y' }),
                expiredAfter: Date.now() + Constant_1.COOKIE_AGE
            };
            return res
                .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: Constant_1.COOKIE_AGE, expires: new Date(auth.expiredAfter) })
                .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
                .send({ loginToken: Buffer.from(data['token'], 'utf8').toString('base64url'), accessToken: auth.accessToken });
        });
    }
    qrCodeSignIn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password, session: sessionString, invitationCode } = req.body;
            if (password && sessionString) {
                req.tg = new telegram_1.TelegramClient(new sessions_1.StringSession(sessionString), Constant_1.TG_CREDS.apiId, Constant_1.TG_CREDS.apiHash, Object.assign({ connectionRetries: Constant_1.CONNECTION_RETRIES, useWSS: false }, process.env.ENV === 'production' ? { baseLogger: new telegram_1.Logger(Logger_1.LogLevel.NONE) } : {}));
                yield req.tg.connect();
                const passwordData = yield req.tg.invoke(new telegram_1.Api.account.GetPassword());
                passwordData.newAlgo['salt1'] = Buffer.concat([passwordData.newAlgo['salt1'], (0, Helpers_1.generateRandomBytes)(32)]);
                const signIn = yield req.tg.invoke(new telegram_1.Api.auth.CheckPassword({
                    password: yield (0, Password_1.computeCheck)(passwordData, password)
                }));
                const userAuth = signIn['user'];
                if (!userAuth) {
                    throw { status: 400, body: { error: 'User not found/authorized' } };
                }
                let user = yield model_1.prisma.users.findFirst({ where: { OR: [{ tg_id: userAuth.id.toString() }, { username: userAuth['username'] }] } });
                const config = yield model_1.prisma.config.findFirst();
                if (!user) {
                    if (config === null || config === void 0 ? void 0 : config.disable_signup) {
                        throw { status: 403, body: { error: 'Signup is disabled' } };
                    }
                    if ((config === null || config === void 0 ? void 0 : config.invitation_code) && (config === null || config === void 0 ? void 0 : config.invitation_code) !== invitationCode) {
                        throw { status: 403, body: { error: 'Invalid invitation code' } };
                    }
                    const username = userAuth.username || userAuth.phone;
                    user = yield model_1.prisma.users.create({
                        data: {
                            username,
                            plan: 'premium',
                            name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
                            tg_id: userAuth.id.toString()
                        }
                    });
                }
                yield model_1.prisma.users.update({
                    data: {
                        username: userAuth.username || userAuth.phone,
                        plan: 'premium'
                    },
                    where: { id: user.id }
                });
                const session = req.tg.session.save();
                const auth = {
                    session,
                    accessToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '15h' }),
                    refreshToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '1y' }),
                    expiredAfter: Date.now() + Constant_1.COOKIE_AGE
                };
                res
                    .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: Constant_1.COOKIE_AGE, expires: new Date(auth.expiredAfter) })
                    .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
                    .send(Object.assign({ user }, auth));
                model_1.prisma.files.findMany({
                    where: {
                        AND: [
                            { user_id: user.id },
                            {
                                NOT: { signed_key: null }
                            }
                        ]
                    }
                }).then(files => files === null || files === void 0 ? void 0 : files.map(file => {
                    const signedKey = crypto_js_1.AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), Constant_1.FILES_JWT_SECRET).toString();
                    model_1.prisma.files.update({
                        data: { signed_key: signedKey },
                        where: { id: file.id }
                    });
                }));
                return;
            }
            yield req.tg.connect();
            try {
                const data = yield req.tg.invoke(new telegram_1.Api.auth.ExportLoginToken(Object.assign(Object.assign({}, Constant_1.TG_CREDS), { exceptIds: [] })));
                const buildResponse = (data) => {
                    var _a;
                    const session = req.tg.session.save();
                    const auth = {
                        session,
                        accessToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '15h' }),
                        refreshToken: (0, jsonwebtoken_1.sign)({ session }, Constant_1.API_JWT_SECRET, { expiresIn: '1y' }),
                        expiredAfter: Date.now() + Constant_1.COOKIE_AGE
                    };
                    res
                        .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: Constant_1.COOKIE_AGE, expires: new Date(auth.expiredAfter) })
                        .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
                        .send(Object.assign(Object.assign({}, data), auth));
                    if ((_a = data.user) === null || _a === void 0 ? void 0 : _a.id) {
                        model_1.prisma.files.findMany({
                            where: {
                                AND: [
                                    { user_id: data.user.id },
                                    {
                                        NOT: { signed_key: null }
                                    }
                                ]
                            }
                        }).then(files => files === null || files === void 0 ? void 0 : files.map(file => {
                            const signedKey = crypto_js_1.AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), Constant_1.FILES_JWT_SECRET).toString();
                            model_1.prisma.files.update({
                                data: { signed_key: signedKey },
                                where: { id: file.id }
                            });
                        }));
                    }
                    return;
                };
                if (data instanceof telegram_1.Api.auth.LoginTokenMigrateTo) {
                    yield req.tg._switchDC(data.dcId);
                    const result = yield req.tg.invoke(new telegram_1.Api.auth.ImportLoginToken({
                        token: data.token
                    }));
                    if (result instanceof telegram_1.Api.auth.LoginTokenSuccess && result.authorization instanceof telegram_1.Api.auth.Authorization) {
                        const userAuth = result.authorization.user;
                        let user = yield model_1.prisma.users.findFirst({ where: { OR: [{ tg_id: userAuth.id.toString() }, { username: userAuth['username'] }] } });
                        const config = yield model_1.prisma.config.findFirst();
                        if (!user) {
                            if (config === null || config === void 0 ? void 0 : config.disable_signup) {
                                throw { status: 403, body: { error: 'Signup is disabled' } };
                            }
                            if ((config === null || config === void 0 ? void 0 : config.invitation_code) && (config === null || config === void 0 ? void 0 : config.invitation_code) !== invitationCode) {
                                throw { status: 403, body: { error: 'Invalid invitation code' } };
                            }
                            const username = userAuth['username'] || userAuth['phone'];
                            user = yield model_1.prisma.users.create({
                                data: {
                                    username,
                                    plan: 'premium',
                                    name: `${userAuth['firstName'] || ''} ${userAuth['lastName'] || ''}`.trim() || username,
                                    tg_id: userAuth.id.toString()
                                }
                            });
                        }
                        yield model_1.prisma.users.update({
                            data: {
                                username: userAuth['username'] || userAuth['phone'],
                                plan: 'premium'
                            },
                            where: { id: user.id }
                        });
                        return buildResponse({ user });
                    }
                    return buildResponse({ data, result });
                }
                else if (data instanceof telegram_1.Api.auth.LoginTokenSuccess && data.authorization instanceof telegram_1.Api.auth.Authorization) {
                    const userAuth = data.authorization.user;
                    let user = yield model_1.prisma.users.findFirst({ where: { OR: [{ tg_id: userAuth.id.toString() }, { username: userAuth['username'] }] } });
                    const config = yield model_1.prisma.config.findFirst();
                    if (!user) {
                        if (config === null || config === void 0 ? void 0 : config.disable_signup) {
                            throw { status: 403, body: { error: 'Signup is disabled' } };
                        }
                        if ((config === null || config === void 0 ? void 0 : config.invitation_code) && (config === null || config === void 0 ? void 0 : config.invitation_code) !== invitationCode) {
                            throw { status: 403, body: { error: 'Invalid invitation code' } };
                        }
                        const username = userAuth['username'] || userAuth['phone'];
                        user = yield model_1.prisma.users.create({
                            data: {
                                username,
                                plan: 'premium',
                                name: `${userAuth['firstName'] || ''} ${userAuth['lastName'] || ''}`.trim() || username,
                                tg_id: userAuth.id.toString()
                            }
                        });
                    }
                    yield model_1.prisma.users.update({
                        data: {
                            username: userAuth['username'] || userAuth['phone'],
                            plan: 'premium'
                        },
                        where: { id: user.id }
                    });
                    return buildResponse({ user });
                }
                return buildResponse({
                    loginToken: Buffer.from(data['token'], 'utf8').toString('base64url')
                });
            }
            catch (error) {
                if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                    error.session = req.tg.session.save();
                }
                throw error;
            }
        });
    }
    me(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield req.tg.connect();
            const data = yield req.tg.getMe();
            return res.send({ user: data });
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            yield req.tg.connect();
            const success = req.query.destroySession === '1' ? yield req.tg.invoke(new telegram_1.Api.auth.LogOut()) : true;
            yield Cache_1.Redis.connect().del(`auth:${req.authKey}`);
            return res.clearCookie('authorization').clearCookie('refreshToken').send({ success });
        });
    }
};
__decorate([
    Endpoint_1.Endpoint.POST(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "register", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [TGClient_1.TGClient] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "sendCode", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [TGSessionAuth_1.TGSessionAuth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "reSendCode", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [TGSessionAuth_1.TGSessionAuth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "login", null);
__decorate([
    Endpoint_1.Endpoint.POST(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "refreshToken", null);
__decorate([
    Endpoint_1.Endpoint.GET({ middlewares: [TGClient_1.TGClient] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "qrCode", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [TGSessionAuth_1.TGSessionAuth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "qrCodeSignIn", null);
__decorate([
    Endpoint_1.Endpoint.GET({ middlewares: [TGSessionAuth_1.TGSessionAuth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "me", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [TGSessionAuth_1.TGSessionAuth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Auth.prototype, "logout", null);
Auth = __decorate([
    Endpoint_1.Endpoint.API()
], Auth);
exports.Auth = Auth;
//# sourceMappingURL=Auth.js.map