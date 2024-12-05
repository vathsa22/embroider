"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const compat_utils_1 = require("../compat-utils");
class default_1 extends v1_addon_1.default {
    get packageMeta() {
        let meta = super.packageMeta;
        // these get invoked from an inline script tag in content-for('test-body-footer')
        meta = (0, compat_utils_1.forceIncludeModule)(meta, './native-xhr');
        meta = (0, compat_utils_1.forceIncludeModule)(meta, './finalize');
        return meta;
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-percy.js.map