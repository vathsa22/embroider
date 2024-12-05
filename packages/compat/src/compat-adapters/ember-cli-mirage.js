"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
class default_1 extends v1_addon_1.default {
    get packageMeta() {
        if (this.addonInstance._shouldIncludeFiles()) {
            return super.packageMeta;
        }
        return {
            type: 'addon',
            version: 2,
            'auto-upgraded': true,
        };
    }
    get v2Tree() {
        let tree = super.v2Tree;
        if (this.addonInstance._shouldIncludeFiles()) {
            return tree;
        }
        return (0, broccoli_funnel_1.default)(tree, {
            include: ['package.json'],
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-cli-mirage.js.map