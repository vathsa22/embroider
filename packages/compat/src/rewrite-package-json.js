"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const fs_1 = require("fs");
const path_1 = require("path");
class RewritePackageJSON extends broccoli_plugin_1.default {
    constructor(inputTree, getPackageJSON) {
        super([inputTree], {
            annotation: 'embroider:core:rewrite-package-json',
            persistentOutput: true,
            needsCache: false,
        });
        this.getPackageJSON = getPackageJSON;
    }
    build() {
        (0, fs_1.writeFileSync)((0, path_1.join)(this.outputPath, 'package.json'), JSON.stringify(this.getPackageJSON(), null, 2), 'utf8');
    }
}
exports.default = RewritePackageJSON;
//# sourceMappingURL=rewrite-package-json.js.map