"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = void 0;
const express_1 = require("express");
const v1_1 = require("./v1");
exports.API = (0, express_1.Router)()
    .use('/v1', v1_1.V1);
//# sourceMappingURL=index.js.map