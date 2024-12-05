"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const compat_utils_1 = require("../compat-utils");
class default_1 extends v1_addon_1.default {
    get packageJSON() {
        return (0, compat_utils_1.addPeerDependency)(super.packageJSON, 'ember-data');
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-cli-addon-docs.js.map