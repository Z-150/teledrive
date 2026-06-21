"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownSafe = void 0;
const markdownSafe = (str) => str
    .replaceAll('_', '\\_')
    .replaceAll('*', '\\*')
    .replaceAll('[', '\\[')
    .replaceAll('`', '\\`');
exports.markdownSafe = markdownSafe;
//# sourceMappingURL=StringParser.js.map