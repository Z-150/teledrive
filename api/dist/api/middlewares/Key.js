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
exports.AuthKey = void 0;
function AuthKey(req, _, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authkey = req.headers['token'] || req.query['token'];
        if (authkey !== process.env.UTILS_API_KEY) {
            throw { status: 401, body: { error: 'Invalid key' } };
        }
        return next();
    });
}
exports.AuthKey = AuthKey;
//# sourceMappingURL=Key.js.map