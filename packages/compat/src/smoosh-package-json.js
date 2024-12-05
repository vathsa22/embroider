"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const fs_1 = require("fs");
const path_1 = require("path");
const merges_1 = require("./merges");
class SmooshPackageJSON extends broccoli_plugin_1.default {
    constructor(inputTrees, opts = {}) {
        super(inputTrees, {
            annotation: `embroider:core:smoosh-package-json:${opts === null || opts === void 0 ? void 0 : opts.annotation}`,
            persistentOutput: true,
            needsCache: false,
        });
    }
    build() {
        let pkgs = this.inputPaths.map(p => {
            let pkgPath = (0, path_1.join)(p, 'package.json');
            if ((0, fs_1.existsSync)(pkgPath)) {
                return JSON.parse((0, fs_1.readFileSync)(pkgPath, 'utf8'));
            }
        });
        let pkg = (0, merges_1.mergeWithUniq)({}, ...pkgs);
        (0, fs_1.writeFileSync)((0, path_1.join)(this.outputPath, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
    }
}
exports.default = SmooshPackageJSON;
//# sourceMappingURL=smoosh-package-json.js.map