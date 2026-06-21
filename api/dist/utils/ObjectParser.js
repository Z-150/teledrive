"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectParser = void 0;
const serialize_error_1 = require("serialize-error");
function objectParser(obj) {
    return JSON.parse(JSON.stringify((0, serialize_error_1.serializeError)(obj), (key, value) => key.match(/^_/gi) ? undefined : value));
}
exports.objectParser = objectParser;
//# sourceMappingURL=ObjectParser.js.map