"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
class EmberCliBabel extends v1_addon_1.default {
    // the only copy of ember-cli-babel that might need to do something is the
    // first one that wants to emit babel polyfills. No other copy is allowed to
    // emit anything into the build.
    reduceInstances(copies) {
        let polyfillCopy = copies.find(c => {
            let instance = c.addonInstance;
            return typeof instance._shouldIncludePolyfill === 'function' && instance._shouldIncludePolyfill();
        });
        if (polyfillCopy) {
            return [polyfillCopy];
        }
        else {
            return [];
        }
    }
}
exports.default = EmberCliBabel;
//# sourceMappingURL=ember-cli-babel.js.map