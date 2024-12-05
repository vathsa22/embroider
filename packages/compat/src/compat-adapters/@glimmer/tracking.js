"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../../v1-addon"));
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
/*
  @glimmer/tracking is a real package but it has no working implementation. The
  real implementation is in ember-source.

  Since embroider prioritizes real packages, it's best to provide a compat
  adapter here to make it into a valid package. It's easy enough for it to
  reexport the things from ember that are needed.
*/
class RedirectToEmber extends broccoli_plugin_1.default {
    build() {
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(this.inputPaths[0], 'package.json'), (0, path_1.join)(this.outputPath, 'package.json'));
        (0, fs_extra_1.outputFileSync)((0, path_1.join)(this.outputPath, 'index.js'), 
        // Prior to ember-source 4.1, cached didn't exist
        // using this way of importing from metal, cached will be undefined if pre 4.1
        `import * as metal from "@ember/-internals/metal";
    const { cached, tracked } = metal;
    export { cached, tracked };`);
        (0, fs_extra_1.outputFileSync)((0, path_1.join)(this.outputPath, 'primitives', 'cache.js'), `export { createCache, getValue, isConst } from "@ember/-internals/metal";`);
    }
}
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        return new RedirectToEmber([super.v2Tree]);
    }
}
exports.default = default_1;
//# sourceMappingURL=tracking.js.map