"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_plugin_1 = __importDefault(require("broccoli-plugin"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
class default_1 extends broccoli_plugin_1.default {
    constructor(originalPackage) {
        super([], {
            annotation: 'empty-package-tree',
            persistentOutput: true,
            needsCache: false,
        });
        this.originalPackage = originalPackage;
        this.built = false;
    }
    build() {
        if (!this.built) {
            (0, fs_extra_1.writeJSONSync)((0, path_1.join)(this.outputPath, 'package.json'), {
                name: this.originalPackage.name,
                version: this.originalPackage.version,
                keywords: ['ember-addon'],
                'ember-addon': {
                    version: 2,
                    type: 'addon',
                    'auto-upgraded': true,
                },
                '//': 'This empty package was created by embroider. See https://github.com/embroider-build/embroider/blob/main/docs/empty-package-output.md',
            });
        }
    }
}
exports.default = default_1;
//# sourceMappingURL=empty-package-tree.js.map