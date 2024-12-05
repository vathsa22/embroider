"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const broccoli_persistent_filter_1 = __importDefault(require("broccoli-persistent-filter"));
const core_1 = require("@embroider/core");
const path_1 = require("path");
class TemplateCompileTree extends broccoli_persistent_filter_1.default {
    constructor(inputTree) {
        super(inputTree, {
            name: `embroider-template-compile-stage1`,
            persist: true,
            extensions: ['hbs', 'handlebars'],
        });
    }
    getDestFilePath(relativePath, entry) {
        if (this.isDirectory(relativePath, entry)) {
            return null;
        }
        for (let ext of ['hbs', 'handlebars']) {
            if (relativePath.slice(-ext.length - 1) === '.' + ext) {
                // we deliberately don't chop off the .hbs before appending .js, because if
                // the user has both .js` and .hbs` side-by-side we don't want our new file
                // to collide with theirs.
                return relativePath + '.js';
            }
        }
        return null;
    }
    processString(source, relativePath) {
        return (0, core_1.hbsToJS)(source, { filename: relativePath });
    }
    baseDir() {
        return (0, path_1.join)(__dirname, '..');
    }
}
exports.default = TemplateCompileTree;
//# sourceMappingURL=hbs-to-js-broccoli-plugin.js.map