"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWithAppend = mergeWithAppend;
exports.mergeWithUniq = mergeWithUniq;
const mergeWith_1 = __importDefault(require("lodash/mergeWith"));
const uniq_1 = __importDefault(require("lodash/uniq"));
function mergeWithAppend(dest, ...srcs) {
    return (0, mergeWith_1.default)(dest, ...srcs, appendArrays);
}
function mergeWithUniq(dest, ...srcs) {
    return (0, mergeWith_1.default)(dest, ...srcs, appendArraysUniq);
}
function appendArrays(objValue, srcValue) {
    if (Array.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
}
function appendArraysUniq(objValue, srcValue) {
    if (Array.isArray(objValue)) {
        return (0, uniq_1.default)(objValue.concat(srcValue));
    }
}
//# sourceMappingURL=merges.js.map