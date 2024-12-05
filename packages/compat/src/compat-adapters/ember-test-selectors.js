"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const compat_utils_1 = require("../compat-utils");
const semver_1 = __importDefault(require("semver"));
class default_1 extends v1_addon_1.default {
    // v6.0.0 of ember-test-selectors dropped the attribute binding for classic components
    static shouldApplyAdapter(addonInstance) {
        return semver_1.default.lt(addonInstance.pkg.version, '6.0.0') && !addonInstance._stripTestSelectors;
    }
    get packageMeta() {
        return (0, compat_utils_1.forceIncludeModule)(super.packageMeta, './utils/bind-data-test-attributes');
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-test-selectors.js.map