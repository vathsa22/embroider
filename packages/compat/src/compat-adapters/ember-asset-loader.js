"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
// ember-asset-loader's ManifestGenerator (which is used as the Addon base class
// for by ember-engines) has an "all" postprocessTree hook. We can't / won't run
// those in embroider. The hook inserts the asset manifest into index.html.
//
// This patch removes the code that would explode if it tries to read from that
// manifest. ember-asset-loader itself has a mode that excludes these files, so
// it's tolerant of them being missing.
//
// We mostly just want ember-asset-loader to sit down and be quiet, because lazy
// loading is a thing that is natively handled by embroider.
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        return (0, broccoli_funnel_1.default)(super.v2Tree, {
            exclude: ['_app_/config/asset-manifest.js', '_app_/instance-initializers/load-asset-manifest.js'],
        });
    }
    get packageMeta() {
        let meta = super.packageMeta;
        if (meta['app-js']) {
            meta = (0, cloneDeep_1.default)(meta);
            delete meta['app-js']['./instance-initializers/load-asset-manifest.js'];
            delete meta['app-js']['./config/asset-manifest.js'];
        }
        return meta;
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-asset-loader.js.map