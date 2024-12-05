"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_addon_1 = __importDefault(require("../v1-addon"));
const add_to_tree_1 = __importDefault(require("../add-to-tree"));
const fs_1 = require("fs");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const semver_1 = __importDefault(require("semver"));
const makeConfigurable = `
if (EmberENV.EXTEND_PROTOTYPES === true || EmberENV.EXTEND_PROTOTYPES.String) {
  Object.defineProperty(String.prototype, 'pluralize', { configurable: true });
  Object.defineProperty(String.prototype, 'singularize', { configurable: true });
  Object.defineProperty(Ember, 'Inflector', { configurable: true });
  Object.defineProperty(Ember.String, 'singularize', { configurable: true });
  Object.defineProperty(Ember.String, 'pluralize', { configurable: true });
}
`;
const patch = `import './make-configurable';`;
class default_1 extends v1_addon_1.default {
    get v2Tree() {
        return new add_to_tree_1.default(super.v2Tree, outputDir => {
            let target = (0, path_1.join)(outputDir, 'index.js');
            let source = (0, fs_1.readFileSync)(target);
            // we need to remove first because we might be dealing with a
            // broccoli-produced symlink to a file we really don't want to alter.
            (0, fs_extra_1.removeSync)(target);
            (0, fs_1.writeFileSync)(target, patch + source);
            (0, fs_1.writeFileSync)((0, path_1.join)(outputDir, 'make-configurable.js'), makeConfigurable);
        });
    }
    static shouldApplyAdapter(addonInstance) {
        return semver_1.default.lt(addonInstance.pkg.version, '4.0.0');
    }
}
exports.default = default_1;
//# sourceMappingURL=ember-inflector.js.map