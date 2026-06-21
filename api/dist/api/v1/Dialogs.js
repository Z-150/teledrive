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
exports.Dialogs = void 0;
const telegram_1 = require("telegram");
const big_integer_1 = __importDefault(require("big-integer"));
const Cache_1 = require("../../service/Cache");
const ObjectParser_1 = require("../../utils/ObjectParser");
const Endpoint_1 = require("../base/Endpoint");
const Auth_1 = require("../middlewares/Auth");
let Dialogs = class Dialogs {
    find(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { offset, limit } = req.query;
            const dialogs = yield Cache_1.Redis.connect().getFromCacheFirst(`dialogs:${req.user.id}:${JSON.stringify(req.query)}`, () => __awaiter(this, void 0, void 0, function* () {
                return (0, ObjectParser_1.objectParser)(yield req.tg.getDialogs({
                    limit: Number(limit) || 0,
                    offsetDate: Number(offset) || undefined,
                    ignorePinned: false
                }));
            }), 2);
            return res.send({ dialogs });
        });
    }
    retrieve(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(req.query.accessHash)
                });
            }
            else if (type === 'chat') {
                peer = new telegram_1.Api.InputPeerChat({
                    chatId: (0, big_integer_1.default)(id)
                });
            }
            else if (type === 'user') {
                peer = new telegram_1.Api.InputPeerUser({
                    userId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(req.query.accessHash)
                });
            }
            const dialogs = yield req.tg.invoke(new telegram_1.Api.messages.GetPeerDialogs({
                peers: [new telegram_1.Api.InputDialogPeer({ peer })]
            }));
            const result = (0, ObjectParser_1.objectParser)(dialogs);
            return res.send({ dialog: Object.assign(Object.assign({}, result), { dialog: result.dialogs[0], message: result.messages[0], chat: result.chats[0], user: result.users[0], dialogs: undefined, messages: undefined, chats: undefined, users: undefined }) });
        });
    }
    avatar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(req.query.accessHash)
                });
            }
            else if (type === 'chat') {
                peer = new telegram_1.Api.InputPeerChat({
                    chatId: (0, big_integer_1.default)(id)
                });
            }
            else if (type === 'user') {
                peer = new telegram_1.Api.InputPeerUser({
                    userId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(req.query.accessHash)
                });
            }
            try {
                const file = yield req.tg.downloadProfilePhoto(peer);
                if (!(file === null || file === void 0 ? void 0 : file.length)) {
                    return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
                }
                res.setHeader('Content-Disposition', `inline; filename=avatar-${id}.jpg`);
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Content-Length', file.length);
                res.write(file);
                return res.end();
            }
            catch (error) {
                return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
            }
        });
    }
};
__decorate([
    Endpoint_1.Endpoint.GET('/', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Dialogs.prototype, "find", null);
__decorate([
    Endpoint_1.Endpoint.GET('/:type/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Dialogs.prototype, "retrieve", null);
__decorate([
    Endpoint_1.Endpoint.GET('/:type/:id/avatar.jpg', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Dialogs.prototype, "avatar", null);
Dialogs = __decorate([
    Endpoint_1.Endpoint.API()
], Dialogs);
exports.Dialogs = Dialogs;
//# sourceMappingURL=Dialogs.js.map