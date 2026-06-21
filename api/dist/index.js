"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
require("source-map-support/register");
require('dotenv').config({ path: '.env' });
const axios_1 = __importDefault(require("axios"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const curly_express_1 = require("curly-express");
const express_1 = __importStar(require("express"));
const express_list_endpoints_1 = __importDefault(require("express-list-endpoints"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const serialize_error_1 = require("serialize-error");
const serverless_http_1 = __importDefault(require("serverless-http"));
const api_1 = require("./api");
const Cache_1 = require("./service/Cache");
const StringParser_1 = require("./utils/StringParser");
BigInt.prototype.toJSON = function () {
    return this.toString();
};
require("./bot");
Cache_1.Redis.connect();
const curl = (0, curly_express_1.cURL)({ attach: true });
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)({
    credentials: true,
    origin: [
        /.*/
    ]
}));
app.use((0, express_1.json)({ limit: '100mb' }));
app.use((0, express_1.urlencoded)({ extended: true, limit: '100mb' }));
app.use((0, express_1.raw)({ limit: '100mb' }));
app.use((0, cookie_parser_1.default)());
if (process.env.ENV !== 'production') {
    app.use((0, morgan_1.default)('tiny'));
}
app.use(curl);
app.get('/ping', (_, res) => res.send({ pong: true }));
app.get('/security.txt', (_, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send('Contact: security@teledriveapp.com\nPreferred-Languages: en, id');
});
app.use('/api', api_1.API);
app.use((err, req, res, __) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.ENV !== 'production') {
        console.error(err);
    }
    if ((err.status || 500) >= 500) {
        if (process.env.TG_BOT_TOKEN && (process.env.TG_BOT_ERROR_REPORT_ID || process.env.TG_BOT_OWNER_ID)) {
            try {
                yield axios_1.default.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
                    chat_id: process.env.TG_BOT_ERROR_REPORT_ID || process.env.TG_BOT_OWNER_ID,
                    parse_mode: 'Markdown',
                    text: `🔥 *${(0, StringParser_1.markdownSafe)(err.body.error || err.message || 'Unknown error')}*\n\n\`[${err.status || 500}] ${(0, StringParser_1.markdownSafe)(req.protocol + '://' + req.get('host') + req.originalUrl)}\`\n\n\`\`\`\n${JSON.stringify((0, serialize_error_1.serializeError)(err), null, 2)}\n\`\`\`\n\n\`\`\`\n${req['_curl']}\n\`\`\``
                });
            }
            catch (error) {
                if (process.env.ENV !== 'production') {
                    console.error(error);
                }
            }
        }
    }
    return res.status(err.status || 500).send(err.body || { error: 'Something error', details: (0, serialize_error_1.serializeError)(err) });
}));
app.use((0, express_1.static)(path_1.default.join(__dirname, '..', '..', 'web', 'build')));
app.use((req, res) => {
    try {
        if (req.headers['accept'] !== 'application/json') {
            return res.sendFile(path_1.default.join(__dirname, '..', '..', 'web', 'build', 'index.html'));
        }
        return res.status(404).send({ error: 'Not found' });
    }
    catch (error) {
        return res.send({ empty: true });
    }
});
app.listen(process.env.PORT || 4000, () => console.log(`Running at :${process.env.PORT || 4000}...`));
console.log((0, express_list_endpoints_1.default)(app));
module.exports = app;
module.exports.handler = (0, serverless_http_1.default)(app);
//# sourceMappingURL=index.js.map