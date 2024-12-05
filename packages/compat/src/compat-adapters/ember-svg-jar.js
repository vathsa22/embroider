"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
class FixSVGJar extends broccoli_plugin_1.default {
    build() {
        let helperFile = (0, path_1.join)(this.inputPaths[0], '_app_', 'helpers', 'svg-jar.js');
        if ((0, fs_extra_1.pathExistsSync)(helperFile)) {
            let source = (0, fs_extra_1.readFileSync)(helperFile, 'utf8');
            source = `import { importSync } from '@embroider/macros';\n` + source.replace(/\brequire\b/g, 'importSync');
            (0, fs_extra_1.ensureDirSync)((0, path_1.join)(this.outputPath, '_app_', 'helpers'));
            (0, fs_extra_1.writeFileSync)((0, path_1.join)(this.outputPath, '_app_', 'helpers', 'svg-jar.js'), source);
        }
    }
}
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        let orig = super.v2Tree;
        return (0, broccoli_merge_trees_1.default)([orig, new FixSVGJar([orig], { annotation: 'fix-svg-jar' })], { overwrite: true });
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-svg-jar.js.map