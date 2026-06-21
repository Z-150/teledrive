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
var Files_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Files = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const bcryptjs_1 = require("bcryptjs");
const check_disk_space_1 = __importDefault(require("check-disk-space"));
const content_disposition_1 = __importDefault(require("content-disposition"));
const crypto_js_1 = require("crypto-js");
const fs_1 = require("fs");
const moment_1 = __importDefault(require("moment"));
const multer_1 = __importDefault(require("multer"));
const telegram_1 = require("telegram");
const Logger_1 = require("telegram/extensions/Logger");
const sessions_1 = require("telegram/sessions");
const model_1 = require("../../model");
const Cache_1 = require("../../service/Cache");
const Constant_1 = require("../../utils/Constant");
const FilterQuery_1 = require("../../utils/FilterQuery");
const Endpoint_1 = require("../base/Endpoint");
const Auth_1 = require("../middlewares/Auth");
const CACHE_DIR = `${__dirname}/../../../../.cached`;
let Files = Files_1 = class Files {
    find(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const _c = req.query, { sort, offset, limit, shared, exclude_parts: excludeParts, full_properties: fullProperties, no_cache: noCache, t: _t } = _c, filters = __rest(_c, ["sort", "offset", "limit", "shared", "exclude_parts", "full_properties", "no_cache", "t"]);
            const parent = (filters === null || filters === void 0 ? void 0 : filters.parent_id) && filters.parent_id !== 'null' ? yield model_1.prisma.files.findFirst({ where: { id: filters.parent_id } }) : null;
            if ((filters === null || filters === void 0 ? void 0 : filters.parent_id) && filters.parent_id !== 'null' && !parent) {
                throw { status: 404, body: { error: 'Parent not found' } };
            }
            if (!req.user && !((_a = parent === null || parent === void 0 ? void 0 : parent.sharing_options) === null || _a === void 0 ? void 0 : _a.includes('*'))) {
                throw { status: 404, body: { error: 'Parent not found' } };
            }
            const getFiles = () => __awaiter(this, void 0, void 0, function* () {
                var _d, _e, _f, _g, _h, _j;
                let where = { user_id: (_d = req.user) === null || _d === void 0 ? void 0 : _d.id };
                if (shared) {
                    if (((_e = parent === null || parent === void 0 ? void 0 : parent.sharing_options) === null || _e === void 0 ? void 0 : _e.includes((_f = req.user) === null || _f === void 0 ? void 0 : _f.username)) || ((_g = parent === null || parent === void 0 ? void 0 : parent.sharing_options) === null || _g === void 0 ? void 0 : _g.includes('*'))) {
                        where = {};
                    }
                    else {
                        where = {
                            AND: [
                                {
                                    sharing_options: {
                                        contains: `"${(_h = req.user) === null || _h === void 0 ? void 0 : _h.username}"`
                                    }
                                },
                                {
                                    OR: [
                                        { parent_id: null },
                                        { parent: {
                                                sharing_options: undefined
                                            }
                                        },
                                        {
                                            parent: {
                                                sharing_options: {
                                                    equals: '[]'
                                                }
                                            }
                                        },
                                        {
                                            NOT: {
                                                parent: {
                                                    sharing_options: {
                                                        contains: `"${(_j = req.user) === null || _j === void 0 ? void 0 : _j.username}"`
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        };
                    }
                }
                let select = null;
                if (fullProperties !== 'true' && fullProperties !== '1') {
                    select = {
                        id: true,
                        name: true,
                        type: true,
                        size: true,
                        sharing_options: true,
                        upload_progress: true,
                        link_id: true,
                        user_id: true,
                        parent_id: true,
                        uploaded_at: true,
                        created_at: true,
                        password: true
                    };
                }
                if (shared && Object.keys(where).length) {
                    select['parent'] = true;
                }
                const whereQuery = {
                    AND: [
                        where,
                        ...Object.keys(filters).reduce((res, k) => {
                            let obj = { [k]: filters[k] };
                            if (filters[k] === 'null') {
                                obj = { [k]: null };
                            }
                            if (/\.in$/.test(k)) {
                                obj = { [k.replace(/\.in$/, '')]: {
                                        in: filters[k]
                                            .replace(/^\(/, '')
                                            .replace(/\'/g, '')
                                            .replace(/\)$/, '')
                                            .split(',')
                                    } };
                            }
                            if (/\.like$/.test(k)) {
                                obj = { [k.replace(/\.like$/, '')]: {
                                        startsWith: filters[k].toString()
                                    } };
                            }
                            return [...res, obj];
                        }, []),
                        ...excludeParts === 'true' || excludeParts === '1' ? [
                            {
                                OR: [
                                    {
                                        AND: [
                                            { name: { contains: '.part0' } },
                                            { name: { endsWith: '1' } },
                                            { NOT: { name: { endsWith: '11' } } },
                                            { NOT: { name: { endsWith: '111' } } },
                                            { NOT: { name: { endsWith: '1111' } } },
                                            { NOT: { name: { endsWith: '21' } } },
                                            { NOT: { name: { endsWith: '31' } } },
                                            { NOT: { name: { endsWith: '41' } } },
                                            { NOT: { name: { endsWith: '51' } } },
                                            { NOT: { name: { endsWith: '61' } } },
                                            { NOT: { name: { endsWith: '71' } } },
                                            { NOT: { name: { endsWith: '81' } } },
                                            { NOT: { name: { endsWith: '91' } } },
                                        ]
                                    },
                                    {
                                        NOT: { name: { contains: '.part' } }
                                    }
                                ]
                            }
                        ] : []
                    ],
                };
                return [
                    yield model_1.prisma.files.findMany(Object.assign(Object.assign({}, select ? { select } : {}), { where: whereQuery, skip: Number(offset) || 0, take: Number(limit) || 10, orderBy: (0, FilterQuery_1.buildSort)(sort) })),
                    yield model_1.prisma.files.count({ where: whereQuery })
                ];
            });
            const [files, length] = noCache === 'true' || noCache === '1' ? yield getFiles() : yield Cache_1.Redis.connect().getFromCacheFirst(`files:${((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || 'null'}:${JSON.stringify(req.query)}`, getFiles, 2);
            return res.send({ files: files.map(file => (Object.assign(Object.assign({}, file), { password: file.password ? '[REDACTED]' : null }))), length });
        });
    }
    stats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const totalFilesSize = yield model_1.prisma.files.aggregate({
                _sum: { size: true }
            });
            const totalUserFilesSize = yield model_1.prisma.files.aggregate({
                _sum: { size: true },
                where: {
                    user_id: req.user.id
                }
            });
            try {
                (0, fs_1.mkdirSync)(`${CACHE_DIR}`, { recursive: true });
            }
            catch (error) {
            }
            const cachedSize = (0, fs_1.readdirSync)(`${CACHE_DIR}`)
                .filter(filename => (0, fs_1.statSync)(`${CACHE_DIR}/${filename}`).isFile())
                .reduce((res, file) => res + (0, fs_1.statSync)(`${CACHE_DIR}/${file}`).size, 0);
            return res.send({
                stats: {
                    system: yield (0, check_disk_space_1.default)(__dirname),
                    totalFilesSize: totalFilesSize._sum.size,
                    totalUserFilesSize: totalUserFilesSize._sum.size,
                    cachedSize
                }
            });
        });
    }
    save(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            const { messageId } = req.query;
            const { file } = req.body;
            if (!file) {
                throw { status: 400, body: { error: 'File is required in body.' } };
            }
            let message = {};
            if (messageId) {
                if (!file.forward_info) {
                    throw { status: 400, body: { error: 'Forward info is required in body.' } };
                }
                let chat;
                if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
                    const [type, peerId, _id, accessHash] = file.forward_info.split('/');
                    let peer;
                    if (type === 'channel') {
                        peer = new telegram_1.Api.InputPeerChannel({
                            channelId: (0, big_integer_1.default)(peerId),
                            accessHash: (0, big_integer_1.default)(accessHash)
                        });
                        chat = yield req.tg.invoke(new telegram_1.Api.channels.GetMessages({
                            channel: peer,
                            id: [new telegram_1.Api.InputMessageID({ id: Number(messageId) })]
                        }));
                    }
                }
                else {
                    chat = (yield req.tg.invoke(new telegram_1.Api.messages.GetMessages({
                        id: [new telegram_1.Api.InputMessageID({ id: Number(messageId) })]
                    })));
                }
                if (!((_a = chat === null || chat === void 0 ? void 0 : chat['messages']) === null || _a === void 0 ? void 0 : _a[0])) {
                    throw { status: 404, body: { error: 'Message not found' } };
                }
                const mimeType = chat['messages'][0].media.photo ? 'image/jpeg' : chat['messages'][0].media.document.mimeType || 'unknown';
                const name = chat['messages'][0].media.photo ? `${chat['messages'][0].media.photo.id}.jpg` : ((_c = (_b = chat['messages'][0].media.document.attributes) === null || _b === void 0 ? void 0 : _b.find((atr) => atr.fileName)) === null || _c === void 0 ? void 0 : _c.fileName) || `${(_d = chat['messages'][0].media) === null || _d === void 0 ? void 0 : _d.document.id}.${mimeType.split('/').pop()}`;
                const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size;
                const size = chat['messages'][0].media.photo ? getSizes(chat['messages'][0].media.photo.sizes.pop()) : (_e = chat['messages'][0].media.document) === null || _e === void 0 ? void 0 : _e.size;
                let type = chat['messages'][0].media.photo || mimeType.match(/^image/gi) ? 'image' : null;
                if (((_f = chat['messages'][0].media.document) === null || _f === void 0 ? void 0 : _f.mimeType.match(/^video/gi)) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
                    type = 'video';
                }
                else if (((_g = chat['messages'][0].media.document) === null || _g === void 0 ? void 0 : _g.mimeType.match(/pdf$/gi)) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
                    type = 'document';
                }
                else if (((_h = chat['messages'][0].media.document) === null || _h === void 0 ? void 0 : _h.mimeType.match(/audio$/gi)) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
                    type = 'audio';
                }
                message = {
                    name,
                    message_id: chat['messages'][0].id.toString(),
                    mime_type: mimeType,
                    size,
                    user_id: req.user.id,
                    uploaded_at: new Date(chat['messages'][0].date * 1000),
                    type
                };
            }
            return res.send({ file: yield model_1.prisma.files.create({
                    data: Object.assign(Object.assign({}, file), message)
                }) });
        });
    }
    addFolder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { file: data } = req.body;
            const count = yield model_1.prisma.files.count({
                where: {
                    AND: [
                        { type: 'folder' },
                        { user_id: req.user.id },
                        { name: { startsWith: (data === null || data === void 0 ? void 0 : data.name) || 'New Folder' } },
                        { parent_id: (data === null || data === void 0 ? void 0 : data.parent_id) || null },
                        { link_id: (data === null || data === void 0 ? void 0 : data.link_id) || null }
                    ]
                }
            });
            const parent = (data === null || data === void 0 ? void 0 : data.parent_id) ? yield model_1.prisma.files.findUnique({
                where: { id: data.parent_id }
            }) : null;
            return res.send({ file: yield model_1.prisma.files.create({
                    data: Object.assign({ name: ((data === null || data === void 0 ? void 0 : data.name) || 'New Folder') + `${count ? ` (${count})` : ''}`, mime_type: 'teledrive/folder', user_id: req.user.id, type: 'folder', uploaded_at: new Date(), link_id: data === null || data === void 0 ? void 0 : data.link_id }, parent ? {
                        parent_id: parent.id,
                        sharing_options: parent.sharing_options,
                        signed_key: parent.signed_key
                    } : {})
                }) });
        });
    }
    cloneFile(req, res) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const { file: body } = req.body;
            const source = yield model_1.prisma.files.findUnique({ where: { id: body.key } });
            const files = yield model_1.prisma.files.findMany({
                where: {
                    AND: [
                        { name: source.name.endsWith('.part001') ? { startsWith: source.name.replace(/\.part0*\d+$/, '.part') } : source.name },
                        { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
                        { parent_id: source.parent_id },
                    ]
                }
            });
            const countExists = yield model_1.prisma.files.count({
                where: {
                    AND: [
                        { name: source.name.endsWith('.part001') ? { startsWith: source.name.replace(/\.part0*\d+$/, ''), endsWith: '.part001' } : { startsWith: source.name } },
                        { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id },
                        { parent_id: body.parent_id }
                    ]
                }
            });
            delete body.key;
            let countFiles = 0;
            for (const file of files) {
                const { forward_info: forwardInfo, message_id: messageId, mime_type: mimeType } = file;
                let peerFrom;
                let peerTo;
                if (forwardInfo && forwardInfo.match(/^channel\//gi)) {
                    const [type, peerId, _id, accessHash] = (_c = forwardInfo === null || forwardInfo === void 0 ? void 0 : forwardInfo.split('/')) !== null && _c !== void 0 ? _c : [];
                    if (type === 'channel') {
                        peerFrom = new telegram_1.Api.InputPeerChannel({
                            channelId: (0, big_integer_1.default)(peerId),
                            accessHash: accessHash ? (0, big_integer_1.default)(accessHash) : null
                        });
                    }
                    else if (type === 'user') {
                        peerFrom = new telegram_1.Api.InputPeerUser({
                            userId: (0, big_integer_1.default)(peerId),
                            accessHash: (0, big_integer_1.default)(accessHash)
                        });
                    }
                    else if (type === 'chat') {
                        peerFrom = new telegram_1.Api.InputPeerChat({
                            chatId: (0, big_integer_1.default)(peerId)
                        });
                    }
                }
                const [type, peerId, _, accessHash] = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {}).saved_location.split('/');
                if ((_d = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _d === void 0 ? void 0 : _d.saved_location) {
                    if (type === 'channel') {
                        peerTo = new telegram_1.Api.InputPeerChannel({
                            channelId: (0, big_integer_1.default)(peerId),
                            accessHash: accessHash ? (0, big_integer_1.default)(accessHash) : null
                        });
                    }
                    else if (type === 'user') {
                        peerTo = new telegram_1.Api.InputPeerUser({
                            userId: (0, big_integer_1.default)(peerId),
                            accessHash: (0, big_integer_1.default)(accessHash)
                        });
                    }
                    else if (type === 'chat') {
                        peerTo = new telegram_1.Api.InputPeerChat({
                            chatId: (0, big_integer_1.default)(peerId)
                        });
                    }
                }
                const chat = yield req.tg.invoke(new telegram_1.Api.messages.ForwardMessages({
                    fromPeer: peerFrom || 'me',
                    id: [Number(messageId)],
                    toPeer: peerTo || 'me',
                    randomId: [big_integer_1.default.randBetween('-1e100', '1e100')],
                    silent: true,
                    dropAuthor: true
                }));
                const newForwardInfo = peerTo ? `${type}/${peerId}/${chat.updates[0].id.toString()}/${accessHash}` : null;
                const message = {
                    size: Number(file.size),
                    message_id: chat.updates[0].id.toString(),
                    mime_type: mimeType,
                    forward_info: newForwardInfo,
                    uploaded_at: new Date(chat.date * 1000)
                };
                const response = yield model_1.prisma.files.create({
                    data: Object.assign(Object.assign(Object.assign({}, body), { name: files.length == 1 ? body.name + `${countExists ? ` (${countExists})` : ''}` : body.name.replace(/\.part0*\d+$/, '') + `${countExists ? ` (${countExists})` : ''}` + `.part${String(countFiles + 1).padStart(3, '0')}` }), message)
                });
                if (countFiles++ == 0)
                    res.send({ file: response });
            }
        });
    }
    retrieve(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { password } = req.query;
            const file = yield model_1.prisma.files.findUnique({
                where: { id }
            });
            const parent = (file === null || file === void 0 ? void 0 : file.parent_id) ? yield model_1.prisma.files.findUnique({
                where: { id: file.parent_id }
            }) : null;
            if (!file || file.user_id !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) && !((_b = file.sharing_options) === null || _b === void 0 ? void 0 : _b.includes('*')) && !((_c = file.sharing_options) === null || _c === void 0 ? void 0 : _c.includes((_d = req.user) === null || _d === void 0 ? void 0 : _d.username))) {
                if (!((_e = parent === null || parent === void 0 ? void 0 : parent.sharing_options) === null || _e === void 0 ? void 0 : _e.includes((_f = req.user) === null || _f === void 0 ? void 0 : _f.username)) && !((_g = parent === null || parent === void 0 ? void 0 : parent.sharing_options) === null || _g === void 0 ? void 0 : _g.includes('*'))) {
                    throw { status: 404, body: { error: 'File not found' } };
                }
            }
            file.signed_key = file.signed_key || (parent === null || parent === void 0 ? void 0 : parent.signed_key);
            if (file.password && ((_h = req.user) === null || _h === void 0 ? void 0 : _h.id) !== file.user_id) {
                if (!password) {
                    throw { status: 400, body: { error: 'Unauthorized' } };
                }
                if (!(0, bcryptjs_1.compareSync)(password, file.password)) {
                    throw { status: 400, body: { error: 'Wrong passphrase' } };
                }
            }
            let files = [file];
            if (/.*\.part0*1$/gi.test(file === null || file === void 0 ? void 0 : file.name)) {
                files = yield model_1.prisma.files.findMany({
                    where: {
                        AND: [
                            {
                                OR: [
                                    { id },
                                    { name: { startsWith: file.name.replace(/\.part0*1$/gi, '') } }
                                ]
                            },
                            { user_id: file.user_id },
                            { parent_id: file.parent_id || null }
                        ]
                    }
                });
                files[0].signed_key = file.signed_key = file.signed_key || (parent === null || parent === void 0 ? void 0 : parent.signed_key);
            }
            if (!req.user || file.user_id !== ((_j = req.user) === null || _j === void 0 ? void 0 : _j.id)) {
                yield Files_1.initiateSessionTG(req, files);
                yield req.tg.connect();
            }
            return yield Files_1.download(req, res, files);
        });
    }
    remove(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { deleteMessage } = req.query;
            const file = yield model_1.prisma.files.findFirst({
                where: {
                    AND: [{ id }, { user_id: req.user.id }]
                },
            });
            if (!file) {
                throw { status: 404, body: { error: 'File not found' } };
            }
            yield model_1.prisma.files.delete({ where: { id } });
            if (deleteMessage && ['true', '1'].includes(deleteMessage) && !(file === null || file === void 0 ? void 0 : file.forward_info)) {
                try {
                    yield req.tg.invoke(new telegram_1.Api.messages.DeleteMessages({ id: [Number(file.message_id)], revoke: true }));
                }
                catch (error) {
                    try {
                        yield req.tg.invoke(new telegram_1.Api.channels.DeleteMessages({ id: [Number(file.message_id)], channel: 'me' }));
                    }
                    catch (error) {
                    }
                }
            }
            if (/.*\.part0*1$/gi.test(file === null || file === void 0 ? void 0 : file.name)) {
                const files = yield model_1.prisma.files.findMany({
                    where: {
                        AND: [
                            {
                                OR: [
                                    { id },
                                    { name: { startsWith: file.name.replace(/\.part0*1$/gi, '') } }
                                ],
                            },
                            { user_id: file.user_id },
                            { parent_id: file.parent_id || null }
                        ]
                    }
                });
                files.map((file) => __awaiter(this, void 0, void 0, function* () {
                    yield model_1.prisma.files.delete({ where: { id: file.id } });
                    if (deleteMessage && ['true', '1'].includes(deleteMessage) && !(file === null || file === void 0 ? void 0 : file.forward_info)) {
                        try {
                            yield req.tg.invoke(new telegram_1.Api.messages.DeleteMessages({ id: [Number(file.message_id)], revoke: true }));
                        }
                        catch (error) {
                            try {
                                yield req.tg.invoke(new telegram_1.Api.channels.DeleteMessages({ id: [Number(file.message_id)], channel: 'me' }));
                            }
                            catch (error) {
                            }
                        }
                    }
                }));
            }
            return res.send({ file });
        });
    }
    update(req, res) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { file } = req.body;
            if (!file) {
                throw { status: 400, body: { error: 'File is required in body' } };
            }
            const currentFile = yield model_1.prisma.files.findFirst({
                where: {
                    AND: [{ id }, { user_id: req.user.id }]
                }
            });
            if (!currentFile) {
                throw { status: 404, body: { error: 'File not found' } };
            }
            const parent = file.parent_id ? yield model_1.prisma.files.findUnique({
                where: { id: file.parent_id }
            }) : null;
            let key = currentFile.signed_key || (parent === null || parent === void 0 ? void 0 : parent.signed_key);
            if (((_a = file.sharing_options) === null || _a === void 0 ? void 0 : _a.length) && !key) {
                key = crypto_js_1.AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), Constant_1.FILES_JWT_SECRET).toString();
            }
            if (!((_b = file.sharing_options) === null || _b === void 0 ? void 0 : _b.length) && !((_c = currentFile.sharing_options) === null || _c === void 0 ? void 0 : _c.length) && !((_d = parent === null || parent === void 0 ? void 0 : parent.sharing_options) === null || _d === void 0 ? void 0 : _d.length)) {
                key = null;
            }
            if (/.*\.part0*1$/gi.test(currentFile === null || currentFile === void 0 ? void 0 : currentFile.name)) {
                const files = yield model_1.prisma.files.findMany({
                    where: {
                        AND: [
                            {
                                OR: [
                                    { id },
                                    { name: { startsWith: currentFile.name.replace(/\.part0*1$/gi, '') } }
                                ]
                            },
                            { user_id: currentFile.user_id },
                            { parent_id: currentFile.parent_id || null }
                        ]
                    }
                });
                yield Promise.all(files.map((current) => __awaiter(this, void 0, void 0, function* () {
                    return yield model_1.prisma.files.update({
                        where: { id: current.id },
                        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, file.name ? { name: current.name.replace(current.name.replace(/\.part0*\d+$/gi, ''), file.name) } : {}), file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {}), file.parent_id !== undefined ? { parent_id: file.parent_id } : {}), parent && current.type === 'folder' ? {
                            sharing_options: parent.sharing_options
                        } : {}), { signed_key: key }), file.password !== undefined ? {
                            password: file.password !== null ? (0, bcryptjs_1.hashSync)(file.password, 10) : null
                        } : {})
                    });
                })));
            }
            else {
                yield model_1.prisma.files.updateMany({
                    where: {
                        AND: [
                            { id },
                            { user_id: req.user.id }
                        ],
                    },
                    data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, file.name ? { name: currentFile.name.replace(currentFile.name.replace(/\.part0*1$/gi, ''), file.name) } : {}), file.sharing_options !== undefined ? { sharing_options: file.sharing_options } : {}), file.parent_id !== undefined ? { parent_id: file.parent_id } : {}), parent && currentFile.type === 'folder' ? {
                        sharing_options: parent.sharing_options
                    } : {}), { signed_key: key }), file.password !== undefined ? {
                        password: file.password !== null ? (0, bcryptjs_1.hashSync)(file.password, 10) : null
                    } : {})
                });
            }
            if (file.sharing_options !== undefined && currentFile.type === 'folder') {
                const updateSharingOptions = (currentFile) => __awaiter(this, void 0, void 0, function* () {
                    const children = yield model_1.prisma.files.findMany({
                        where: {
                            AND: [
                                { parent_id: currentFile.id },
                                { type: 'folder' }
                            ]
                        }
                    });
                    for (const child of children) {
                        yield model_1.prisma.files.updateMany({
                            where: {
                                AND: [
                                    { id: child.id },
                                    { user_id: req.user.id }
                                ]
                            },
                            data: Object.assign({ sharing_options: file.sharing_options, signed_key: key || child.signed_key }, file.password !== undefined ? {
                                password: file.password !== null ? (0, bcryptjs_1.hashSync)(file.password, 10) : null
                            } : {})
                        });
                        yield updateSharingOptions(child);
                    }
                });
                yield updateSharingOptions(currentFile);
            }
            return res.send({ file: { id } });
        });
    }
    upload(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            const { name, size, mime_type: mimetype, parent_id: parentId, relative_path: relativePath, total_part: totalPart, part } = req.query;
            if (!name || !size || !mimetype || !part || !totalPart) {
                throw { status: 400, body: { error: 'Name, size, mimetype, part, and total part are required' } };
            }
            const file = req.file;
            if (!file) {
                throw { status: 400, body: { error: 'File upload is required' } };
            }
            const isPremium = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.plan) === 'premium' || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
            const maxSize = isPremium ? 4294967296 : 1073741824;
            if (Number(size) > maxSize) {
                if (!isPremium)
                    throw { status: 403, body: { error: 'Maksimal ukuran file 1GB. Silakan hubungi admin untuk upgrade ke Premium!' } };
                else
                    throw { status: 403, body: { error: 'Maksimal ukuran file Telegram telah terlewati.' } };
            }
            if (file.size > 512 * 1024) {
                throw { status: 400, body: { error: 'Maximum file part size is 500kB' } };
            }
            let model;
            if ((_c = req.params) === null || _c === void 0 ? void 0 : _c.id) {
                model = yield model_1.prisma.files.findUnique({
                    where: { id: req.params.id }
                });
                if (!model) {
                    throw { status: 404, body: { error: 'File not found' } };
                }
            }
            else {
                let type = null;
                if (mimetype.match(/^image/gi)) {
                    type = 'image';
                }
                else if (mimetype.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
                    type = 'video';
                }
                else if (mimetype.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
                    type = 'document';
                }
                else if (mimetype.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
                    type = 'audio';
                }
                else {
                    type = 'unknown';
                }
                let currentParentId = parentId;
                if (relativePath) {
                    const paths = relativePath.split('/').slice(0, -1) || [];
                    for (const i in paths) {
                        const path = paths[i];
                        const findFolder = yield model_1.prisma.files.findFirst({
                            where: {
                                AND: [
                                    { type: 'folder' },
                                    { name: path },
                                    { parent_id: currentParentId || null }
                                ]
                            }
                        });
                        if (findFolder) {
                            currentParentId = findFolder.id;
                        }
                        else {
                            const newFolder = yield model_1.prisma.files.create({
                                data: Object.assign({ name: path, type: 'folder', user_id: req.user.id, mime_type: 'teledrive/folder', uploaded_at: new Date() }, currentParentId ? { parent_id: currentParentId } : {})
                            });
                            currentParentId = newFolder.id;
                        }
                    }
                }
                model = yield model_1.prisma.files.findFirst({
                    where: {
                        name: name,
                        mime_type: mimetype,
                        size: Number(size),
                        user_id: req.user.id,
                        type: type,
                        parent_id: currentParentId || null,
                    }
                });
                if (model) {
                    yield model_1.prisma.files.update({
                        data: {
                            message_id: null,
                            uploaded_at: null,
                            upload_progress: 0
                        },
                        where: { id: model.id }
                    });
                }
                else {
                    model = yield model_1.prisma.files.create({
                        data: {
                            name: name,
                            mime_type: mimetype,
                            size: Number(size),
                            user_id: req.user.id,
                            type: type,
                            parent_id: currentParentId || null,
                            upload_progress: 0,
                            file_id: big_integer_1.default.randBetween('-1e100', '1e100').toString(),
                            forward_info: ((_d = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _d === void 0 ? void 0 : _d.saved_location) || null,
                        }
                    });
                }
            }
            let uploadPartStatus;
            const uploadPart = () => __awaiter(this, void 0, void 0, function* () {
                return yield req.tg.invoke(new telegram_1.Api.upload.SaveBigFilePart({
                    fileId: (0, big_integer_1.default)(model.file_id),
                    filePart: Number(part),
                    fileTotalParts: Number(totalPart),
                    bytes: file.buffer
                }));
            });
            try {
                uploadPartStatus = yield uploadPart();
            }
            catch (error) {
                try {
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                    yield ((_e = req.tg) === null || _e === void 0 ? void 0 : _e.connect());
                    uploadPartStatus = yield uploadPart();
                }
                catch (error) {
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                    yield ((_f = req.tg) === null || _f === void 0 ? void 0 : _f.connect());
                    uploadPartStatus = yield uploadPart();
                }
            }
            yield model_1.prisma.files.update({
                where: { id: model.id },
                data: {
                    upload_progress: (Number(part) + 1) / Number(totalPart)
                }
            });
            if (Number(part) < Number(totalPart) - 1) {
                return res.status(202).send({ accepted: true, file: { id: model.id }, uploadPartStatus });
            }
            const sendData = (forceDocument) => __awaiter(this, void 0, void 0, function* () {
                var _k;
                let peer;
                if ((_k = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _k === void 0 ? void 0 : _k.saved_location) {
                    const [type, peerId, _, accessHash] = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {}).saved_location.split('/');
                    if (type === 'channel') {
                        peer = new telegram_1.Api.InputPeerChannel({
                            channelId: (0, big_integer_1.default)(peerId),
                            accessHash: accessHash ? (0, big_integer_1.default)(accessHash) : null
                        });
                    }
                    else if (type === 'user') {
                        peer = new telegram_1.Api.InputPeerUser({
                            userId: (0, big_integer_1.default)(peerId),
                            accessHash: (0, big_integer_1.default)(accessHash)
                        });
                    }
                    else if (type === 'chat') {
                        peer = new telegram_1.Api.InputPeerChat({
                            chatId: (0, big_integer_1.default)(peerId)
                        });
                    }
                }
                return yield req.tg.sendFile(peer || 'me', {
                    file: new telegram_1.Api.InputFileBig({
                        id: (0, big_integer_1.default)(model.file_id),
                        parts: Number(totalPart),
                        name: model.name
                    }),
                    forceDocument,
                    caption: model.name,
                    fileSize: Number(model.size),
                    attributes: forceDocument ? [
                        new telegram_1.Api.DocumentAttributeFilename({ fileName: model.name })
                    ] : undefined,
                    workers: 1
                });
            });
            let data;
            try {
                data = yield sendData(false);
            }
            catch (error) {
                data = yield sendData(true);
            }
            let forwardInfo = null;
            if ((_g = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _g === void 0 ? void 0 : _g.saved_location) {
                const [type, peerId, _, accessHash] = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {}).saved_location.split('/');
                forwardInfo = `${type}/${peerId}/${(_h = data.id) === null || _h === void 0 ? void 0 : _h.toString()}/${accessHash}`;
            }
            yield model_1.prisma.files.update({
                data: Object.assign({ message_id: (_j = data.id) === null || _j === void 0 ? void 0 : _j.toString(), uploaded_at: data.date ? new Date(data.date * 1000) : null, upload_progress: null }, forwardInfo ? { forward_info: forwardInfo } : {}),
                where: { id: model.id }
            });
            return res.status(202).send({ accepted: true, file: { id: model.id } });
        });
    }
    uploadBeta(req, res) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const { name, size, mime_type: mimetype, parent_id: parentId, relative_path: relativePath, total_part: totalPart, part, message } = req.body;
            let model;
            if ((_a = req.params) === null || _a === void 0 ? void 0 : _a.id) {
                model = yield model_1.prisma.files.findUnique({
                    where: { id: req.params.id }
                });
                if (!model) {
                    throw { status: 404, body: { error: 'File not found' } };
                }
            }
            if (!message) {
                if (!model) {
                    let type = null;
                    if (mimetype.match(/^image/gi)) {
                        type = 'image';
                    }
                    else if (mimetype.match(/^video/gi) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
                        type = 'video';
                    }
                    else if (mimetype.match(/pdf$/gi) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
                        type = 'document';
                    }
                    else if (mimetype.match(/audio$/gi) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
                        type = 'audio';
                    }
                    else {
                        type = 'unknown';
                    }
                    let currentParentId = parentId;
                    if (relativePath) {
                        const paths = relativePath.split('/').slice(0, -1) || [];
                        for (const i in paths) {
                            const path = paths[i];
                            const findFolder = yield model_1.prisma.files.findFirst({
                                where: {
                                    AND: [
                                        { type: 'folder' },
                                        { name: path },
                                        { user_id: req.user.id },
                                        { parent_id: currentParentId || null }
                                    ]
                                }
                            });
                            if (findFolder) {
                                currentParentId = findFolder.id;
                            }
                            else {
                                const newFolder = yield model_1.prisma.files.create({
                                    data: Object.assign({ name: path, type: 'folder', user_id: req.user.id, mime_type: 'teledrive/folder' }, currentParentId ? { parent_id: currentParentId } : {})
                                });
                                currentParentId = newFolder.id;
                            }
                        }
                    }
                    model = yield model_1.prisma.files.findFirst({
                        where: {
                            name: name,
                            mime_type: mimetype,
                            size: Number(size),
                            user_id: req.user.id,
                            type: type,
                            parent_id: currentParentId || null,
                        }
                    });
                    if (model) {
                        yield model_1.prisma.files.update({
                            data: {
                                message_id: null,
                                uploaded_at: null,
                                upload_progress: 0
                            },
                            where: { id: model.id }
                        });
                    }
                    else {
                        model = yield model_1.prisma.files.create({
                            data: {
                                name: name,
                                mime_type: mimetype,
                                size: Number(size),
                                user_id: req.user.id,
                                type: type,
                                parent_id: currentParentId || null,
                                upload_progress: 0,
                                file_id: big_integer_1.default.randBetween('-1e100', '1e100').toString(),
                                forward_info: ((_b = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _b === void 0 ? void 0 : _b.saved_location) || null,
                            }
                        });
                    }
                }
                yield model_1.prisma.files.update({
                    data: {
                        upload_progress: (Number(part) + 1) / Number(totalPart)
                    },
                    where: { id: model.id }
                });
                if (!message) {
                    return res.status(202).send({ accepted: true, file: { id: model.id, file_id: model.file_id, name: model.name, size: model.size, type: model.type } });
                }
            }
            let forwardInfo;
            if ((_c = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _c === void 0 ? void 0 : _c.saved_location) {
                const [type, peerId, _, accessHash] = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {}).saved_location.split('/');
                forwardInfo = `${type}/${peerId}/${(_d = message.id) === null || _d === void 0 ? void 0 : _d.toString()}/${accessHash}`;
            }
            yield model_1.prisma.files.update({
                data: Object.assign({ message_id: (_e = message.id) === null || _e === void 0 ? void 0 : _e.toString(), uploaded_at: message.date ? new Date(message.date * 1000) : null, upload_progress: null }, forwardInfo ? { forward_info: forwardInfo } : {}),
                where: { id: model.id }
            });
            return res.status(202).send({ accepted: true, file: { id: model.id, file_id: model.file_id, name: model.name, size: model.size, type: model.type } });
        });
    }
    breadcrumbs(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            let folder = yield model_1.prisma.files.findUnique({ where: { id } });
            if (!folder) {
                throw { status: 404, body: { error: 'File not found' } };
            }
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== folder.user_id) {
                if (!((_b = folder.sharing_options) === null || _b === void 0 ? void 0 : _b.includes('*')) && !((_c = folder.sharing_options) === null || _c === void 0 ? void 0 : _c.includes((_d = req.user) === null || _d === void 0 ? void 0 : _d.username))) {
                    throw { status: 404, body: { error: 'File not found' } };
                }
            }
            const breadcrumbs = [folder];
            while (folder.parent_id) {
                folder = yield model_1.prisma.files.findUnique({ where: { id: folder.parent_id } });
                if (!req.user && ((_e = folder.sharing_options) === null || _e === void 0 ? void 0 : _e.includes('*')) || ((_f = folder.sharing_options) === null || _f === void 0 ? void 0 : _f.includes((_g = req.user) === null || _g === void 0 ? void 0 : _g.username)) || folder.user_id === ((_h = req.user) === null || _h === void 0 ? void 0 : _h.id)) {
                    breadcrumbs.push(folder);
                }
            }
            return res.send({ breadcrumbs: breadcrumbs.reverse() });
        });
    }
    sync(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { parent_id: parentId, limit } = req.query;
            let peer;
            if ((_a = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {})) === null || _a === void 0 ? void 0 : _a.saved_location) {
                const [type, peerId, _, accessHash] = ((typeof req.user.settings === 'string' ? JSON.parse(req.user.settings) : req.user.settings) || {}).saved_location.split('/');
                if (type === 'channel') {
                    peer = new telegram_1.Api.InputPeerChannel({
                        channelId: (0, big_integer_1.default)(peerId),
                        accessHash: accessHash ? (0, big_integer_1.default)(accessHash) : null
                    });
                }
                else if (type === 'user') {
                    peer = new telegram_1.Api.InputPeerUser({
                        userId: (0, big_integer_1.default)(peerId),
                        accessHash: (0, big_integer_1.default)(accessHash)
                    });
                }
                else if (type === 'chat') {
                    peer = new telegram_1.Api.InputPeerChat({
                        chatId: (0, big_integer_1.default)(peerId)
                    });
                }
            }
            let files = [];
            let found = true;
            let offsetId;
            while (files.length < (Number(limit) || 10) && found) {
                const messages = yield req.tg.invoke(new telegram_1.Api.messages.GetHistory({
                    peer: peer || 'me',
                    limit: Number(limit) || 10,
                    offsetId: offsetId || 0,
                }));
                if ((_b = messages['messages']) === null || _b === void 0 ? void 0 : _b.length) {
                    offsetId = messages['messages'][messages['messages'].length - 1].id;
                    files = [...files, ...messages['messages'].filter((msg) => { var _a, _b; return ((_a = msg === null || msg === void 0 ? void 0 : msg.media) === null || _a === void 0 ? void 0 : _a.photo) || ((_b = msg === null || msg === void 0 ? void 0 : msg.media) === null || _b === void 0 ? void 0 : _b.document); })];
                }
                else {
                    found = false;
                }
            }
            files = files.slice(0, Number(limit) || 10);
            if (files === null || files === void 0 ? void 0 : files.length) {
                const existFiles = yield model_1.prisma.files.findMany({
                    where: {
                        AND: [
                            {
                                message_id: {
                                    in: files.map(file => file.id.toString())
                                }
                            },
                            { parent_id: parentId || null },
                            { forward_info: null }
                        ]
                    }
                });
                const filesWantToSave = files.filter(file => !existFiles.find(e => e.message_id == file.id));
                if (filesWantToSave === null || filesWantToSave === void 0 ? void 0 : filesWantToSave.length) {
                    yield Promise.all(filesWantToSave.map(file => {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        const mimeType = file.media.photo ? 'image/jpeg' : file.media.document.mimeType || 'unknown';
                        const name = file.media.photo ? `${file.media.photo.id}.jpg` : ((_b = (_a = file.media.document.attributes) === null || _a === void 0 ? void 0 : _a.find((atr) => atr.fileName)) === null || _b === void 0 ? void 0 : _b.fileName) || `${(_c = file.media) === null || _c === void 0 ? void 0 : _c.document.id}.${mimeType.split('/').pop()}`;
                        const getSizes = ({ size, sizes }) => sizes ? sizes.pop() : size;
                        const size = file.media.photo ? getSizes(file.media.photo.sizes.pop()) : (_d = file.media.document) === null || _d === void 0 ? void 0 : _d.size;
                        let type = file.media.photo;
                        if (((_e = file.media.document) === null || _e === void 0 ? void 0 : _e.mimeType.match(/^video/gi)) || name.match(/\.mp4$/gi) || name.match(/\.mkv$/gi) || name.match(/\.mov$/gi)) {
                            type = 'video';
                        }
                        else if (((_f = file.media.document) === null || _f === void 0 ? void 0 : _f.mimeType.match(/pdf$/gi)) || name.match(/\.doc$/gi) || name.match(/\.docx$/gi) || name.match(/\.xls$/gi) || name.match(/\.xlsx$/gi)) {
                            type = 'document';
                        }
                        else if (((_g = file.media.document) === null || _g === void 0 ? void 0 : _g.mimeType.match(/audio$/gi)) || name.match(/\.mp3$/gi) || name.match(/\.ogg$/gi)) {
                            type = 'audio';
                        }
                        else if (((_h = file.media.document) === null || _h === void 0 ? void 0 : _h.mimeType.match(/^image/gi)) || name.match(/\.jpg$/gi) || name.match(/\.jpeg$/gi) || name.match(/\.png$/gi) || name.match(/\.gif$/gi)) {
                            type = 'image';
                        }
                        return model_1.prisma.files.create({
                            data: {
                                name,
                                message_id: file.id.toString(),
                                mime_type: mimeType,
                                size: size.value,
                                user_id: req.user.id,
                                uploaded_at: new Date(file.date * 1000),
                                type,
                                parent_id: parentId ? parentId.toString() : null
                            }
                        });
                    }));
                }
            }
            return res.send({ files });
        });
    }
    filesSync(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { files } = req.body;
            for (const file of files) {
                const existFile = yield model_1.prisma.files.findFirst({
                    where: {
                        AND: [
                            { name: file.name },
                            { type: file.type },
                            { size: Number(file.size) || null },
                            {
                                parent_id: file.parent_id ? { not: null } : null
                            }
                        ]
                    }
                });
                if (!existFile) {
                    try {
                        yield model_1.prisma.files.create({
                            data: Object.assign(Object.assign({}, file), { size: Number(file.size), user_id: req.user.id })
                        });
                    }
                    catch (error) {
                    }
                }
            }
            return res.status(202).send({ accepted: true });
        });
    }
    static download(req, res, files, onlyHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
            const { raw, dl, thumb, as_array: asArray } = req.query;
            let usage = yield model_1.prisma.usages.findFirst({
                where: {
                    key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] || req.ip}`
                }
            });
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
                usage = yield model_1.prisma.usages.update({
                    data: {
                        expire: (0, moment_1.default)().add(1, 'day').toDate(),
                        usage: 0
                    },
                    where: { key: usage.key }
                });
            }
            const totalFileSize = files.reduce((res, file) => res.add(file.size || 0), (0, big_integer_1.default)(0));
            if (!raw || Number(raw) === 0) {
                const _a = files[0], { signed_key: _ } = _a, result = __rest(_a, ["signed_key"]);
                return res.send({ file: Object.assign(Object.assign({}, result), { password: result.password ? '[REDACTED]' : null }) });
            }
            usage = yield model_1.prisma.usages.update({
                data: {
                    usage: (0, big_integer_1.default)(totalFileSize).add((0, big_integer_1.default)(usage.usage)).toJSNumber()
                },
                where: { key: usage.key }
            });
            if (asArray === '1') {
                return res.send({ files });
            }
            console.log(req.headers.range);
            let cancel = false;
            req.on('close', () => cancel = true);
            const ranges = req.headers.range ? req.headers.range.replace(/bytes\=/gi, '').split('-').map(Number) : null;
            if (onlyHeaders)
                return res.status(200);
            const filename = (prefix = '') => `${CACHE_DIR}/${prefix}${totalFileSize.toString()}_${files[0].name}`;
            try {
                (0, fs_1.mkdirSync)(`${CACHE_DIR}`, { recursive: true });
            }
            catch (error) {
            }
            const cachedFiles = () => (0, fs_1.readdirSync)(`${CACHE_DIR}`)
                .filter(filename => (0, fs_1.statSync)(`${CACHE_DIR}/${filename}`).isFile()).sort((a, b) => new Date((0, fs_1.statSync)(`${CACHE_DIR}/${a}`).birthtime).getTime()
                - new Date((0, fs_1.statSync)(`${CACHE_DIR}/${b}`).birthtime).getTime());
            const getCachedFilesSize = () => cachedFiles().reduce((res, file) => res + (0, fs_1.statSync)(`${CACHE_DIR}/${file}`).size, 0);
            if ((0, fs_1.existsSync)(filename())) {
                if (ranges) {
                    const start = ranges[0];
                    const end = ranges[1] ? ranges[1] : totalFileSize.toJSNumber() - 1;
                    const readStream = (0, fs_1.createReadStream)(filename(), { start, end });
                    res.writeHead(200, {
                        'Cache-Control': 'public, max-age=604800',
                        'ETag': Buffer.from(`${files[0].id}:${files[0].message_id}`).toString('base64'),
                        'Content-Range': `bytes ${start}-${end}/${totalFileSize}`,
                        'Content-Disposition': (0, content_disposition_1.default)(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }),
                        'Content-Type': files[0].mime_type,
                        'Content-Length': end - start + 1,
                        'Accept-Ranges': 'bytes',
                    });
                    readStream.pipe(res);
                }
                else {
                    res.writeHead(200, {
                        'Cache-Control': 'public, max-age=604800',
                        'ETag': Buffer.from(`${files[0].id}:${files[0].message_id}`).toString('base64'),
                        'Content-Range': `bytes */${totalFileSize}`,
                        'Content-Disposition': (0, content_disposition_1.default)(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }),
                        'Content-Type': files[0].mime_type,
                        'Content-Length': totalFileSize.toString(),
                        'Accept-Ranges': 'bytes',
                    });
                    const readStream = (0, fs_1.createReadStream)(filename());
                    readStream
                        .on('open', () => readStream.pipe(res))
                        .on('error', msg => res.end(msg));
                }
                return;
            }
            res.setHeader('Content-Range', `bytes */${totalFileSize}`);
            res.setHeader('Content-Disposition', (0, content_disposition_1.default)(files[0].name.replace(/\.part\d+$/gi, ''), { type: Number(dl) === 1 ? 'attachment' : 'inline' }));
            res.setHeader('Content-Type', files[0].mime_type);
            res.setHeader('Content-Length', totalFileSize.toString());
            res.setHeader('Accept-Ranges', 'bytes');
            let downloaded = 0;
            files.sort((a, b) => {
                var _a, _b;
                const aPart = Number(((_a = a.name.match(/\.part(\d+)$/i)) === null || _a === void 0 ? void 0 : _a[1]) || 0);
                const bPart = Number(((_b = b.name.match(/\.part(\d+)$/i)) === null || _b === void 0 ? void 0 : _b[1]) || 0);
                return aPart - bPart;
            });
            try {
                (0, fs_1.writeFileSync)(filename('process-'), '');
            }
            catch (error) {
            }
            let countFiles = 1;
            for (const file of files) {
                let chat;
                if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
                    const [type, peerId, id, accessHash] = file.forward_info.split('/');
                    let peer;
                    if (type === 'channel') {
                        peer = new telegram_1.Api.InputPeerChannel({
                            channelId: (0, big_integer_1.default)(peerId),
                            accessHash: (0, big_integer_1.default)(accessHash)
                        });
                        chat = yield req.tg.invoke(new telegram_1.Api.channels.GetMessages({
                            channel: peer,
                            id: [new telegram_1.Api.InputMessageID({ id: Number(id) })]
                        }));
                    }
                }
                else {
                    chat = yield req.tg.invoke(new telegram_1.Api.messages.GetMessages({
                        id: [new telegram_1.Api.InputMessageID({ id: Number(file.message_id) })]
                    }));
                }
                const getData = () => __awaiter(this, void 0, void 0, function* () {
                    return yield req.tg.downloadMedia(chat['messages'][0].media, Object.assign(Object.assign({}, thumb ? { thumb: 0 } : {}), { outputFile: {
                            write: (buffer) => {
                                downloaded += buffer.length;
                                if (cancel) {
                                    throw { status: 422, body: { error: 'canceled' } };
                                }
                                else {
                                    console.log(`${chat['messages'][0].id} ${downloaded}/${chat['messages'][0].media.document.size.value} (${downloaded / Number(totalFileSize) * 100 + '%'})`);
                                    try {
                                        (0, fs_1.appendFileSync)(filename('process-'), buffer);
                                    }
                                    catch (error) {
                                    }
                                    res.write(buffer);
                                }
                            },
                            close: () => {
                                console.log(`${chat['messages'][0].id} ${downloaded}/${chat['messages'][0].media.document.size.value} (${downloaded / Number(totalFileSize) * 100 + '%'})`, '-end-');
                                if (countFiles++ >= files.length) {
                                    try {
                                        const { size } = (0, fs_1.statSync)(filename('process-'));
                                        if (totalFileSize.gt((0, big_integer_1.default)(size))) {
                                            (0, fs_1.rmSync)(filename('process-'));
                                        }
                                        else {
                                            (0, fs_1.renameSync)(filename('process-'), filename());
                                        }
                                    }
                                    catch (error) {
                                    }
                                    res.end();
                                }
                            }
                        } }));
                });
                try {
                    yield getData();
                }
                catch (error) {
                    console.log(error);
                }
            }
            usage = yield model_1.prisma.usages.update({
                data: {
                    usage: (0, big_integer_1.default)(totalFileSize).add((0, big_integer_1.default)(usage.usage)).toJSNumber()
                },
                where: { key: usage.key }
            });
            while (Constant_1.CACHE_FILES_LIMIT < getCachedFilesSize()) {
                try {
                    (0, fs_1.rmSync)(`${CACHE_DIR}/${cachedFiles()[0]}`);
                }
                catch (_b) {
                }
            }
        });
    }
    static initiateSessionTG(req, files) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(files === null || files === void 0 ? void 0 : files.length)) {
                throw { status: 404, body: { error: 'File not found' } };
            }
            let data;
            try {
                data = JSON.parse(crypto_js_1.AES.decrypt(files[0].signed_key, Constant_1.FILES_JWT_SECRET).toString(crypto_js_1.enc.Utf8));
            }
            catch (error) {
                throw { status: 401, body: { error: 'Invalid token' } };
            }
            try {
                const session = new sessions_1.StringSession(data.session);
                req.tg = new telegram_1.TelegramClient(session, Constant_1.TG_CREDS.apiId, Constant_1.TG_CREDS.apiHash, Object.assign({ connectionRetries: Constant_1.CONNECTION_RETRIES, useWSS: false }, process.env.ENV === 'production' ? { baseLogger: new telegram_1.Logger(Logger_1.LogLevel.NONE) } : {}));
            }
            catch (error) {
                throw { status: 401, body: { error: 'Invalid key' } };
            }
            return files;
        });
    }
};
__decorate([
    Endpoint_1.Endpoint.GET('/', { middlewares: [Auth_1.AuthMaybe] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "find", null);
__decorate([
    Endpoint_1.Endpoint.GET('/stats', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "stats", null);
__decorate([
    Endpoint_1.Endpoint.POST('/', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "save", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "addFolder", null);
__decorate([
    Endpoint_1.Endpoint.POST({ middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "cloneFile", null);
__decorate([
    Endpoint_1.Endpoint.GET('/:id', { middlewares: [Auth_1.AuthMaybe] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "retrieve", null);
__decorate([
    Endpoint_1.Endpoint.DELETE('/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "remove", null);
__decorate([
    Endpoint_1.Endpoint.PATCH('/:id', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "update", null);
__decorate([
    Endpoint_1.Endpoint.POST('/upload/:id?', { middlewares: [Auth_1.Auth, (0, multer_1.default)().single('upload')] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "upload", null);
__decorate([
    Endpoint_1.Endpoint.POST('/uploadBeta/:id?', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "uploadBeta", null);
__decorate([
    Endpoint_1.Endpoint.GET('/breadcrumbs/:id', { middlewares: [Auth_1.AuthMaybe] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "breadcrumbs", null);
__decorate([
    Endpoint_1.Endpoint.POST('/sync', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "sync", null);
__decorate([
    Endpoint_1.Endpoint.POST('/filesSync', { middlewares: [Auth_1.Auth] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Files.prototype, "filesSync", null);
Files = Files_1 = __decorate([
    Endpoint_1.Endpoint.API()
], Files);
exports.Files = Files;
//# sourceMappingURL=Files.js.map