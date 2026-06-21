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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSort = exports.buildWhereQuery = exports.filterQuery = void 0;
const querystring_1 = require("querystring");
function filterQuery(base, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page, size } = query, filters = __rest(query, ["page", "size"]);
        for (const param of Object.keys(filters)) {
            const [column, op] = param.split(/(.+)\./).slice(1);
            if (param.match(/^sort\./gi)) {
                const col = param.replace(/^sort\./gi, '');
                base = base.order(col, {
                    ascending: filters[param].toLowerCase() === 'asc' || filters[param].toLowerCase() === 'ascending'
                });
            }
            else {
                base = base.filter(column, op || 'eq', filters[param]);
            }
        }
        if (page && size) {
            base = base.range(Number(size) * Number(page), Number(size) * Number(page) + Number(size) - 1);
        }
        const result = yield base;
        if (result.error) {
            throw { status: result.status, body: { error: result.error.message, details: result } };
        }
        return result.data;
    });
}
exports.filterQuery = filterQuery;
function buildWhereQuery(data, prefix = '', join = 'and') {
    const res = Object.keys(data).reduce((res, key) => {
        let item = '';
        const [column, op] = key.split(/(.+)\./).filter(Boolean);
        let value = data[key];
        try {
            value = value ? (0, querystring_1.unescape)(value) : value;
        }
        catch (error) {
        }
        if (!op) {
            item = `${prefix}${column} = '${value.trim()}'`;
        }
        else if (op === 'lt') {
            item = `${prefix}${column} < '${value.trim()}'`;
        }
        else if (op === 'lte') {
            item = `${prefix}${column} <= '${value.trim()}'`;
        }
        else if (op === 'gt') {
            item = `${prefix}${column} > '${value.trim()}'`;
        }
        else if (op === 'gte') {
            item = `${prefix}${column} >= '${value.trim()}'`;
        }
        else if (op === 'between') {
            const [from, to] = value.trim().split('_');
            item = `${prefix}${column} between '${from.trim()}' and '${to.trim()}'`;
        }
        else if (op === 'match') {
            item = `${prefix}${column} ~ '${value.trim()}'`;
        }
        else if (op === 'notmatch') {
            item = `${prefix}${column} !~ '${value.trim()}'`;
        }
        else if (op === 'like') {
            item = `${prefix}${column} like '${value.trim()}'`;
        }
        else if (op === 'ilike') {
            item = `${prefix}${column} ilike '${value.trim()}'`;
        }
        else {
            item = `${prefix}${column} ${op} ${value.trim()}`;
        }
        return [...res, item];
    }, []).join(` ${join} `);
    return res;
}
exports.buildWhereQuery = buildWhereQuery;
function buildSort(sort, prefix = '') {
    return (sort === null || sort === void 0 ? void 0 : sort.split(',').reduce((res, data) => {
        const [column, order] = data.split(':');
        return Object.assign(Object.assign({}, res), { [`${prefix}${column}`]: (order === null || order === void 0 ? void 0 : order.toLowerCase()) || 'asc' });
    }, {})) || {};
}
exports.buildSort = buildSort;
//# sourceMappingURL=FilterQuery.js.map