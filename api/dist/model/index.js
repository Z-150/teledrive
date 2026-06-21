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
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
exports.prisma.$use((params, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (params.model === 'files') {
        if (params.action === 'create' || params.action === 'update') {
            if (params.args.data && params.args.data.sharing_options !== undefined) {
                if (Array.isArray(params.args.data.sharing_options)) {
                    params.args.data.sharing_options = JSON.stringify(params.args.data.sharing_options);
                }
            }
        }
        if (params.action === 'updateMany' || params.action === 'createMany') {
            if (params.args.data) {
                const dataArray = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
                for (const item of dataArray) {
                    if (item.sharing_options !== undefined && Array.isArray(item.sharing_options)) {
                        item.sharing_options = JSON.stringify(item.sharing_options);
                    }
                }
            }
        }
    }
    const result = yield next(params);
    if (params.model === 'files') {
        if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'create' || params.action === 'update') {
            if (result && typeof result.sharing_options === 'string') {
                try {
                    result.sharing_options = JSON.parse(result.sharing_options);
                }
                catch (e) { }
            }
        }
        if (params.action === 'findMany' || params.action === 'updateMany' || params.action === 'createMany') {
            if (Array.isArray(result)) {
                for (const file of result) {
                    if (file && typeof file.sharing_options === 'string') {
                        try {
                            file.sharing_options = JSON.parse(file.sharing_options);
                        }
                        catch (e) { }
                    }
                }
            }
        }
    }
    return result;
}));
//# sourceMappingURL=index.js.map