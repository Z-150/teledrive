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
exports.Messages = void 0;
const telegram_1 = require("telegram");
const big_integer_1 = __importDefault(require("big-integer"));
const Cache_1 = require("../../service/Cache");
const Endpoint_1 = require("../base/Endpoint");
const Auth_1 = require("../middlewares/Auth");
let Messages = class Messages {
    history(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            const { offset, limit, accessHash } = req.query;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
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
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            const result = yield Cache_1.Redis.connect().getFromCacheFirst(`history:${req.user.id}:${JSON.stringify(req.params)}:${JSON.stringify(req.query)}`, () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const messages = yield req.tg.invoke(new telegram_1.Api.messages.GetHistory({
                    peer: peer,
                    limit: Number(limit) || 0,
                    offsetId: Number(offset) || 0,
                }));
                const result = JSON.parse(JSON.stringify(messages));
                result.messages = (_a = result.messages) === null || _a === void 0 ? void 0 : _a.map((msg, i) => { var _a, _b; return (Object.assign(Object.assign({}, msg), { action: Object.assign(Object.assign({}, msg.action), { className: (_b = (_a = messages['messages'][i]) === null || _a === void 0 ? void 0 : _a.action) === null || _b === void 0 ? void 0 : _b.className }) })); });
                return result;
            }), 2);
            return res.send({ messages: result });
        });
    }
    sponsoredMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            const { accessHash } = req.query;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            else {
                return res.send({ messages: {
                        messages: [],
                        chats: [],
                        users: []
                    } });
            }
            const messages = yield req.tg.invoke(new telegram_1.Api.channels.GetSponsoredMessages({ channel: peer }));
            return res.send({ messages });
        });
    }
    readSponsoredMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            const { accessHash } = req.query;
            const { random_id: randomId } = req.body;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            else {
                return res.status(202).send({ accepted: true });
            }
            const accepted = yield req.tg.invoke(new telegram_1.Api.channels.ViewSponsoredMessage({
                channel: peer, randomId: Buffer.from(randomId)
            }));
            return res.status(202).send({ accepted });
        });
    }
    read(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            const { accessHash } = req.query;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
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
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            try {
                yield req.tg.invoke(new telegram_1.Api.messages.ReadHistory({ peer }));
            }
            catch (error) {
                yield req.tg.invoke(new telegram_1.Api.channels.ReadHistory({ channel: peer }));
            }
            return res.status(202).send({ accepted: true });
        });
    }
    send(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id } = req.params;
            const { accessHash } = req.query;
            const { message, replyToMsgId } = req.body;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
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
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            const result = yield req.tg.invoke(new telegram_1.Api.messages.SendMessage(Object.assign({ peer,
                message }, replyToMsgId ? { replyToMsgId: replyToMsgId } : {})));
            return res.send({ message: result });
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id, msgId } = req.params;
            const { accessHash } = req.query;
            const { message } = req.body;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
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
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            const result = yield req.tg.invoke(new telegram_1.Api.messages.EditMessage({
                id: Number(msgId),
                peer,
                message
            }));
            return res.send({ message: result });
        });
    }
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id, msgId } = req.params;
            const { accessHash } = req.query;
            let peer;
            if (type === 'channel') {
                peer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(id),
                    accessHash: (0, big_integer_1.default)(accessHash)
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
                    accessHash: (0, big_integer_1.default)(accessHash)
                });
            }
            try {
                yield req.tg.invoke(new telegram_1.Api.messages.DeleteMessages({ id: [Number(msgId)], revoke: true }));
            }
            catch (error) {
                yield req.tg.invoke(new telegram_1.Api.channels.DeleteMessages({ id: [Number(msgId)], channel: peer }));
            }
            return res.status(202).send({ accepted: true });
        });
    }
    forward(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { msgId } = req.params;
            const { from, to } = req.body;
            let fromPeer;
            let toPeer;
            if (!from) {
                fromPeer = 'me';
            }
            else if (from.type === 'channel') {
                fromPeer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(from.id),
                    accessHash: (0, big_integer_1.default)(from.accessHash)
                });
            }
            else if (from.type === 'chat') {
                fromPeer = new telegram_1.Api.InputPeerChat({
                    chatId: (0, big_integer_1.default)(from.id)
                });
            }
            else if (from.type === 'user') {
                fromPeer = new telegram_1.Api.InputPeerUser({
                    userId: (0, big_integer_1.default)(from.id),
                    accessHash: (0, big_integer_1.default)(from.accessHash)
                });
            }
            if (typeof to === 'string') {
                toPeer = to;
            }
            else if (to.type === 'channel') {
                toPeer = new telegram_1.Api.InputPeerChannel({
                    channelId: (0, big_integer_1.default)(to.id),
                    accessHash: (0, big_integer_1.default)(to.accessHash)
                });
            }
            else if (to.type === 'chat') {
                toPeer = new telegram_1.Api.InputPeerChat({
                    chatId: (0, big_integer_1.default)(to.id)
                });
            }
            else if (to.type === 'user') {
                toPeer = new telegram_1.Api.InputPeerUser({
                    userId: (0, big_integer_1.default)(to.id),
                    accessHash: (0, big_integer_1.default)(to.accessHash)
                });
            }
            const result = yield req.tg.invoke(new telegram_1.Api.messages.ForwardMessages({
                id: [Number(msgId)],
                fromPeer,
                toPeer,
                randomId: [big_integer_1.default.randBetween('-1e100', '1e100')]
            }));
            return res.send({ message: result });
        });
    }
    search(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { q, offset, limit } = req.query;
            if (!q) {
                throw { status: 400, body: { error: 'q is required' } };
            }
            const messages = yield req.tg.invoke(new telegram_1.Api.messages.Search({
                q: q,
                filter: new telegram_1.Api.InputMessagesFilterEmpty(),
                peer: new telegram_1.Api.InputPeerEmpty(),
                limit: Number(limit) || 0,
                minDate: 0,
                maxDate: 0,
                offsetId: 0,
                addOffset: Number(offset) || 0,
                maxId: 0,
                minId: 0,
                hash: (0, big_integer_1.default)(0),
            }));
            return res.send({ messages });
        });
    }
    globalSearch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { q, limit } = req.query;
            if (!q) {
                throw { status: 400, body: { error: 'q is required' } };
            }
            const messages = yield req.tg.invoke(new telegram_1.Api.messages.SearchGlobal({
                q: q,
                filter: new telegram_1.Api.InputMessagesFilterEmpty(),
                offsetPeer: new telegram_1.Api.InputPeerEmpty(),
                limit: Number(limit) || 0
            }));
            return res.send({ messages });
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
    Endpoint_1.Endpoint.GET('/history/:type/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "history", null);
__decorate([
    Endpoint_1.Endpoint.GET('/sponsoredMessages/:type/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "sponsoredMessages", null);
__decorate([
    Endpoint_1.Endpoint.POST('/readSponsoredMessages/:type/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "readSponsoredMessages", null);
__decorate([
    Endpoint_1.Endpoint.POST('/read/:type/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "read", null);
__decorate([
    Endpoint_1.Endpoint.POST('/send/:type/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "send", null);
__decorate([
    Endpoint_1.Endpoint.PATCH('/:type/:id/:msgId', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "update", null);
__decorate([
    Endpoint_1.Endpoint.DELETE('/:type/:id/:msgId', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "delete", null);
__decorate([
    Endpoint_1.Endpoint.POST('/forward/:msgId', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "forward", null);
__decorate([
    Endpoint_1.Endpoint.GET('/search', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "search", null);
__decorate([
    Endpoint_1.Endpoint.GET('/globalSearch', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "globalSearch", null);
__decorate([
    Endpoint_1.Endpoint.GET('/:type/:id/avatar.jpg', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Messages.prototype, "avatar", null);
Messages = __decorate([
    Endpoint_1.Endpoint.API()
], Messages);
exports.Messages = Messages;
//# sourceMappingURL=Messages.js.map