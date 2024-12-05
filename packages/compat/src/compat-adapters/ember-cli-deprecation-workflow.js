"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const path_1 = require("path");
const broccoli_source_1 = require("broccoli-source");
const resolve_1 = __importDefault(require("resolve"));
const typescript_memoize_1 = require("typescript-memoize");
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const semver_1 = __importDefault(require("semver"));
class default_1 extends v1_addon_1.default {
    // v2.0.0 removes the usage of `ember-debug-handlers-polyfill`, so we only need to apply the adapter if we're working
    // with a version that is older than that
    static shouldApplyAdapter(addonInstance) {
        return semver_1.default.lt(addonInstance.pkg.version, '2.0.0');
    }
    get v2Trees() {
        // ember-cli-deprecation-workflow does `app.import` of a file that isn't in
        // its own vendor tree, the file is in ember-debug-handlers-polyfill's
        // vendor tree. It presumably does this because (1) it fails to call super
        // in `included()`, so the ember-debug-handlers-polyfill won't be able to do
        // its own app.import, and (2) even if you fix that,
        // ember-debug-handlers-polyfill itself has a bug that makes it not work as
        // a second-level addon.
        let polyfillDir = (0, path_1.dirname)(resolve_1.default.sync('ember-debug-handlers-polyfill/package.json', { basedir: this.addonInstance.root }));
        let tree = (0, broccoli_funnel_1.default)(new broccoli_source_1.UnwatchedDir((0, path_1.join)(polyfillDir, 'vendor')), {
            destDir: 'vendor',
        });
        let trees = super.v2Trees;
        trees.push(tree);
        return trees;
    }
}
exports.default = default_1;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], default_1.prototype, "v2Trees", null);
//# sourceMappingURL=ember-cli-deprecation-workflow.js.map