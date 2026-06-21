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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const telegram_1 = require("telegram");
const model_1 = require("../../model");
const Cache_1 = require("../../service/Cache");
const FilterQuery_1 = require("../../utils/FilterQuery");
const StringParser_1 = require("../../utils/StringParser");
const Endpoint_1 = require("../base/Endpoint");
const Auth_1 = require("../middlewares/Auth");
let Users = class Users {
    search(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, limit } = req.query;
            if (!username) {
                throw { status: 400, body: { error: 'Username is required' } };
            }
            const data = yield req.tg.invoke(new telegram_1.Api.contacts.Search({
                q: username,
                limit: Number(limit) || 10
            }));
            return res.send({ users: data.users });
        });
    }
    usage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let usage = yield model_1.prisma.usages.findUnique({ where: { key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] || req.ip}` } });
            if (!usage) {
                usage = yield model_1.prisma.usages.create({
                    data: {
                        key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] || req.ip}`,
                        usage: 0,
                        expire: (0, moment_1.default)().add(1, 'day').toDate()
                    }
                });
            }
            if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {
                yield model_1.prisma.usages.update({
                    where: { key: usage.key },
                    data: {
                        expire: (0, moment_1.default)().add(1, 'day').toDate(),
                        usage: 0,
                    }
                });
            }
            return res.send({ usage });
        });
    }
    find(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = req.query, { sort, offset, limit, search } = _a, filters = __rest(_a, ["sort", "offset", "limit", "search"]);
            const where = Object.assign({}, search ? {
                OR: [
                    { username: { contains: search } },
                    { name: { contains: search } },
                ]
            } : filters);
            return res.send({ users: yield model_1.prisma.users.findMany({
                    where,
                    select: req.user.role === 'admin' ? {
                        id: true,
                        username: true,
                        name: true,
                        role: true,
                        created_at: true,
                    } : { username: true },
                    skip: Number(offset) || undefined,
                    take: Number(limit) || undefined,
                    orderBy: (0, FilterQuery_1.buildSort)(sort)
                }), length: yield model_1.prisma.users.count({ where }) });
        });
    }
    settings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { settings } = req.body;
            const currentSettings = typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings || {};
            const newSettings = Object.assign(Object.assign({}, currentSettings), settings);
            req.user.settings = JSON.stringify(newSettings);
            yield model_1.prisma.users.update({
                where: { id: req.user.id },
                data: req.user
            });
            yield Cache_1.Redis.connect().del(`auth:${req.authKey}`);
            return res.send({ settings: newSettings });
        });
    }
    remove(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { reason, agreement } = req.body;
            if (agreement !== 'permanently removed') {
                throw { status: 400, body: { error: 'Invalid agreement' } };
            }
            if (reason && process.env.TG_BOT_TOKEN && process.env.TG_BOT_OWNER_ID) {
                yield axios_1.default.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
                    chat_id: process.env.TG_BOT_OWNER_ID,
                    parse_mode: 'Markdown',
                    text: `😭 ${(0, StringParser_1.markdownSafe)(req.user.name)} (@${(0, StringParser_1.markdownSafe)(req.user.username)}) removed their account.\n\nReason: ${(0, StringParser_1.markdownSafe)(reason)}\n\nfrom: \`${(0, StringParser_1.markdownSafe)(req.headers['cf-connecting-ip'] || req.ip)}\`\ndomain: \`${req.headers['authority'] || req.headers.origin}\`${req.user ? `\nplan: ${req.user.plan}` : ''}`
                });
            }
            yield model_1.prisma.files.deleteMany({
                where: { user_id: req.user.id }
            });
            yield model_1.prisma.users.delete({ where: { id: req.user.id } });
            const success = yield req.tg.invoke(new telegram_1.Api.auth.LogOut());
            return res.clearCookie('authorization').clearCookie('refreshToken').send({ success });
        });
    }
    retrieve(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, param } = req.params;
            if (param === 'photo') {
                const file = yield req.tg.downloadProfilePhoto(username, { isBig: false });
                if (!(file === null || file === void 0 ? void 0 : file.length)) {
                    return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
                }
                res.setHeader('Cache-Control', 'public, max-age=604800');
                res.setHeader('ETag', Buffer.from(file).toString('base64').slice(10, 50));
                res.setHeader('Content-Disposition', `inline; filename=${username === 'me' ? req.user.username : username}.jpg`);
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Content-Length', file.length);
                res.write(file);
                return res.end();
            }
            const user = username === 'me' || username === req.user.username ? req.user : yield model_1.prisma.users.findFirst({
                where: {
                    OR: [
                        { username },
                        { id: username }
                    ]
                }
            });
            if (!user) {
                throw { status: 404, body: { error: 'User not found' } };
            }
            return res.send({ user });
        });
    }
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin') {
                throw { status: 403, body: { error: 'You are not allowed to do this' } };
            }
            const { id } = req.params;
            yield model_1.prisma.files.deleteMany({
                where: { user_id: id }
            });
            yield model_1.prisma.users.delete({ where: { id } });
            return res.send({});
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin') {
                throw { status: 403, body: { error: 'You are not allowed to do this' } };
            }
            const { id } = req.params;
            const { user } = req.body;
            if (!user) {
                throw { status: 400, body: { error: 'User is required' } };
            }
            yield model_1.prisma.users.update({
                where: { id },
                data: { role: user === null || user === void 0 ? void 0 : user.role }
            });
            return res.send({});
        });
    }
};
__decorate([
    Endpoint_1.Endpoint.GET({ middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "search", null);
__decorate([
    Endpoint_1.Endpoint.GET('/me/usage', { middlewares: [Auth_1.AuthMaybe] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "usage", null);
__decorate([
    Endpoint_1.Endpoint.GET('/', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "find", null);
__decorate([
    Endpoint_1.Endpoint.PATCH('/me/settings', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "settings", null);
__decorate([
    Endpoint_1.Endpoint.POST('/me/delete', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "remove", null);
__decorate([
    Endpoint_1.Endpoint.GET('/:username/:param?', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "retrieve", null);
__decorate([
    Endpoint_1.Endpoint.DELETE('/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "delete", null);
__decorate([
    Endpoint_1.Endpoint.PATCH('/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Users.prototype, "update", null);
Users = __decorate([
    Endpoint_1.Endpoint.API()
], Users);
exports.Users = Users;
//# sourceMappingURL=Users.js.map