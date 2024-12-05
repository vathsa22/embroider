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
exports.EmberDataBase = void 0;
const v1_addon_1 = __importDefault(require("../v1-addon"));
const path_1 = require("path");
const typescript_memoize_1 = require("typescript-memoize");
const resolve_1 = require("resolve");
const semver_1 = __importDefault(require("semver"));
class EmberDataBase extends v1_addon_1.default {
    // May of the ember-data packages use rollup to try to hide their internal
    // structure. This is fragile and it breaks under embroider, and they should
    // really move this kind of "build-within-a-build" to prepublish time.
    //
    // This disables any custom implementation of `treeForAddon`. The stock
    // behavior is correct.
    customizes(...names) {
        return super.customizes(...names.filter(n => n !== 'treeForAddon'));
    }
    static shouldApplyAdapter(addonInstance) {
        return semver_1.default.lt(addonInstance.pkg.version, '4.11.1');
    }
}
exports.EmberDataBase = EmberDataBase;
class EmberData extends EmberDataBase {
    // ember-data needs its dynamically generated version module.
    get v2Trees() {
        let versionTree;
        try {
            // ember-data 3.10 and earlier kept the version module here.
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            versionTree = require((0, path_1.join)(this.root, 'lib/version'));
        }
        catch (err) {
            handleErr(err);
            try {
                // ember-data 3.11 to 3.14 keep the version module here.
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                versionTree = require((0, resolve_1.sync)('@ember-data/-build-infra/src/create-version-module', {
                    basedir: this.root,
                }));
            }
            catch (err) {
                handleErr(err);
                // ember-data 3.15+ keeps the version module here.
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                versionTree = require((0, resolve_1.sync)('@ember-data/private-build-infra/src/create-version-module', {
                    basedir: this.root,
                }));
            }
        }
        let trees = super.v2Trees;
        trees.push(versionTree());
        return trees;
    }
}
exports.default = EmberData;
__decorate([
    (0, typescript_memoize_1.Memoize)()
], EmberData.prototype, "v2Trees", null);
function handleErr(err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
        throw err;
    }
}
//# sourceMappingURL=ember-data.js.map