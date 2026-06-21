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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const crypto_1 = __importDefault(require("crypto"));
const model_1 = require("../../model");
const Cache_1 = require("../../service/Cache");
const Endpoint_1 = require("../base/Endpoint");
const Auth_1 = require("../middlewares/Auth");
let Config = class Config {
    retrieve(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let admin = yield model_1.prisma.users.findFirst({ where: { role: 'admin' } });
            if (!admin && process.env.ADMIN_USERNAME) {
                admin = yield model_1.prisma.users.findFirst({ where: { username: process.env.ADMIN_USERNAME } });
                if (!admin) {
                    throw { status: 404, body: { error: 'Admin user not found' } };
                }
                yield model_1.prisma.users.update({
                    data: {
                        role: 'admin'
                    },
                    where: { id: admin.id }
                });
                yield Cache_1.Redis.connect().del(`auth:${req.authKey}`);
            }
            let config = yield model_1.prisma.config.findFirst();
            if (!config) {
                config = yield model_1.prisma.config.create({
                    data: {
                        disable_signup: false,
                        invitation_code: null
                    }
                });
            }
            return res.send({ config: Object.assign(Object.assign({}, config), { invitation_code: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin' ? config.invitation_code : undefined }) });
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin') {
                throw { status: 403, body: { error: 'Forbidden' } };
            }
            const { config } = req.body;
            if (!config) {
                throw { status: 400, body: { error: 'Invalid request' } };
            }
            const model = yield model_1.prisma.config.findFirst();
            yield model_1.prisma.config.update({
                data: Object.assign({ disable_signup: config.disable_signup }, config.clear_invitation_code ? { invitation_code: null } : {}),
                where: { id: model.id }
            });
            return res.send({ config: model });
        });
    }
    resetInvitationCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin') {
                throw { status: 403, body: { error: 'Forbidden' } };
            }
            const code = crypto_1.default.randomBytes(9).toString('base64url');
            const model = yield model_1.prisma.config.findFirst();
            yield model_1.prisma.config.update({
                data: {
                    invitation_code: code
                },
                where: { id: model.id }
            });
            return res.send({ config: model });
        });
    }
    validateInvitationCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = yield model_1.prisma.config.findFirst();
            if (!model.invitation_code) {
                return res.send({ valid: true });
            }
            const { code } = req.query;
            return res.send({
                valid: model.invitation_code === code
            });
        });
    }
};
__decorate([
    Endpoint_1.Endpoint.GET('/', { middlewares: [Auth_1.AuthMaybe] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Config.prototype, "retrieve", null);
__decorate([
    Endpoint_1.Endpoint.PATCH('/', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Config.prototype, "update", null);
__decorate([
    Endpoint_1.Endpoint.POST('/resetInvitationCode', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Config.prototype, "resetInvitationCode", null);
__decorate([
    Endpoint_1.Endpoint.POST('/validateInvitationCode'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Config.prototype, "validateInvitationCode", null);
Config = __decorate([
    Endpoint_1.Endpoint.API()
], Config);
exports.Config = Config;
//# sourceMappingURL=Config.js.map