"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../../v1-addon"));
const semver_1 = __importDefault(require("semver"));
class EmberDataDebug extends v1_addon_1.default {
    get packageMeta() {
        var _a;
        let meta = super.packageMeta;
        // See also the compat-adapter for @ember-data/store where we make this an
        // implicit-module.
        meta.externals = [...((_a = meta.externals) !== null && _a !== void 0 ? _a : []), '@ember-data/store'];
        return meta;
    }
    static shouldApplyAdapter(addonInstance) {
        return semver_1.default.lt(addonInstance.pkg.version, '4.11.1');
    }
}
exports.default = EmberDataDebug;
//# sourceMappingURL=debug.js.map