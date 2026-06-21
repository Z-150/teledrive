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
exports.Endpoint = void 0;
const express_1 = require("express");
const serialize_error_1 = require("serialize-error");
exports.Endpoint = {
    _handlers: [],
    register: function (..._classes) {
        var _a;
        const router = (0, express_1.Router)();
        for (const route of (_a = this._handlers) === null || _a === void 0 ? void 0 : _a.filter((handler) => !!handler.basepath)) {
            router[route.method](`${route.basepath}${route.path}`, ...(route.middlewares || []).map((middleware) => this.RequestWrapper(middleware)), route.handler);
        }
        return router;
    },
    API: function (basepath) {
        return (cls) => {
            this._handlers = this._handlers.map((handler) => (Object.assign(Object.assign({}, handler), { basepath: handler.basepath || basepath || `/${cls.name[0].toLowerCase()}${cls.name.slice(1)}` })));
        };
    },
    USE: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('use', method, descriptor, ...args));
        };
    },
    GET: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('get', method, descriptor, ...args));
        };
    },
    HEAD: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('head', method, descriptor, ...args));
        };
    },
    POST: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('post', method, descriptor, ...args));
        };
    },
    PATCH: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('patch', method, descriptor, ...args));
        };
    },
    PUT: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('put', method, descriptor, ...args));
        };
    },
    DELETE: function (...args) {
        return (_, method, descriptor) => {
            this._handlers.push(this._buildRouteHandler('delete', method, descriptor, ...args));
        };
    },
    RequestWrapper: (target) => {
        return function (req, res, next) {
            return __awaiter(this, void 0, void 0, function* () {
                let trial = 0;
                const execute = () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    try {
                        return yield target(req, res, next);
                    }
                    catch (error) {
                        if (/.*You need to call \.connect\(\)/gi.test(error.message) && trial < 5) {
                            yield new Promise(res => setTimeout(res, ++trial * 1000));
                            (_a = req.tg) === null || _a === void 0 ? void 0 : _a.connect();
                            return yield execute();
                        }
                        if (process.env.ENV !== 'production') {
                            console.error('RequestWrapper', error);
                        }
                        (_b = req.tg) === null || _b === void 0 ? void 0 : _b.disconnect();
                        const isValidCode = error.code && Number(error.code) > 99 && Number(error.code) < 599;
                        return next(error.code ? {
                            status: isValidCode ? error.code : 500, body: {
                                error: error.message, details: (0, serialize_error_1.serializeError)(error)
                            }
                        } : error);
                    }
                });
                return yield execute();
            });
        };
    },
    _buildRouteHandler: function (method, route, descriptor, ...args) {
        var _a, _b;
        let path = `/${route[0].toLowerCase()}${route.slice(1)}`;
        if (args[0]) {
            if (typeof args[0] === 'string') {
                path = args[0];
            }
            else if ((_a = args[0]) === null || _a === void 0 ? void 0 : _a.path) {
                path = args[0].path;
            }
        }
        else if ((_b = args[1]) === null || _b === void 0 ? void 0 : _b.path) {
            path = args[1].path;
        }
        let opts = {};
        if (args[0] && typeof args[0] === 'object') {
            opts = args[0];
        }
        else if (args[1]) {
            opts = args[1];
        }
        return Object.assign(Object.assign({}, opts), { method, basepath: null, path, handler: function (req, res, next) {
                return __awaiter(this, void 0, void 0, function* () {
                    let trial = 0;
                    const execute = () => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b, _c;
                        try {
                            yield descriptor.value(req, res, next);
                            (_a = req.tg) === null || _a === void 0 ? void 0 : _a.disconnect();
                        }
                        catch (error) {
                            if (/.*You need to call \.connect\(\)/gi.test(error.message) && trial < 5) {
                                yield new Promise(res => setTimeout(res, ++trial * 1000));
                                (_b = req.tg) === null || _b === void 0 ? void 0 : _b.connect();
                                return yield execute();
                            }
                            if (process.env.ENV !== 'production') {
                                console.error('handler', error.message);
                            }
                            (_c = req.tg) === null || _c === void 0 ? void 0 : _c.disconnect();
                            const isValidCode = error.code && Number(error.code) > 99 && Number(error.code) < 599;
                            return next(error.code ? {
                                status: isValidCode ? error.code : 500, body: {
                                    error: error.message, details: (0, serialize_error_1.serializeError)(error)
                                }
                            } : error);
                        }
                    });
                    return yield execute();
                });
            } });
    }
};
//# sourceMappingURL=Endpoint.js.map