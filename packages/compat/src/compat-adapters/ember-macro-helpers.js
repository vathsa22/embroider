"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
class default_1 extends v1_addon_1.default {
    get packageMeta() {
        let meta = super.packageMeta;
        if (!meta.externals) {
            meta.externals = [];
        }
        meta.externals.push('./-computed-store');
        return meta;
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-macro-helpers.js.map