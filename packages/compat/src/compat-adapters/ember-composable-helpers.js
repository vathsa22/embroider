"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const path_1 = require("path");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const broccoli_funnel_1 = require("broccoli-funnel");
const core_1 = require("@babel/core");
const compat_utils_1 = require("../compat-utils");
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        // workaround for https://github.com/DockYard/ember-composable-helpers/issues/308
        // and https://github.com/DockYard/ember-composable-helpers/pull/302
        // and https://github.com/DockYard/ember-composable-helpers/pull/307
        return new MatchHelpers(super.v2Tree);
    }
}
exports.default = default_1;
class MatchHelpers extends broccoli_funnel_1.Funnel {
    constructor(inputTree) {
        super(inputTree, {});
    }
    async build() {
        await super.build();
        let appHelpersDir = (0, path_1.join)(this.outputPath, '_app_', 'helpers');
        let addonHelpersDir = (0, path_1.join)(this.inputPaths[0], 'helpers');
        for (let filename of (0, fs_1.readdirSync)(appHelpersDir)) {
            if (!(0, fs_extra_1.pathExistsSync)((0, path_1.join)(addonHelpersDir, filename))) {
                (0, fs_extra_1.removeSync)((0, path_1.join)(appHelpersDir, filename));
            }
        }
        let src = (0, fs_1.readFileSync)((0, path_1.join)(this.inputPaths[0], 'index.js'), 'utf8');
        let plugins = [(0, compat_utils_1.stripBadReexportsPlugin)({ resolveBase: this.outputPath })];
        (0, fs_1.writeFileSync)((0, path_1.join)(this.outputPath, 'index.js'), (0, core_1.transform)(src, { plugins, configFile: false }).code);
    }
}
//# sourceMappingURL=ember-composable-helpers.js.map