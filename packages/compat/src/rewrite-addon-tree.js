"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rewriteAddonTree;
const broccoli_funnel_1 = __importDefault(require("broccoli-funnel"));
const broccoli_merge_trees_1 = __importDefault(require("broccoli-merge-trees"));
const snitch_1 = __importDefault(require("./snitch"));
const add_to_tree_1 = __importDefault(require("./add-to-tree"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function rewriteAddonTree(tree, name, moduleName) {
    let renamed = {};
    tree = new add_to_tree_1.default(tree, outputPath => {
        for (let file of (0, fs_extra_1.readdirSync)(outputPath)) {
            if (!file.endsWith('.js')) {
                continue;
            }
            const filePath = (0, path_1.join)(outputPath, file);
            if (!(0, fs_extra_1.statSync)(filePath).isFile()) {
                continue;
            }
            (0, fs_extra_1.moveSync)(filePath, (0, path_1.join)(outputPath, (0, path_1.basename)(file, '.js'), 'index.js'));
        }
    });
    let goodParts = new snitch_1.default(tree, {
        allowedPaths: new RegExp(`^${moduleName}/`),
        foundBadPaths: (badPaths) => {
            for (let badPath of badPaths) {
                renamed[badPath] = `${name}/${badPath}`;
            }
        },
    }, {
        srcDir: moduleName,
        allowEmpty: true,
    });
    let badParts = (0, broccoli_funnel_1.default)(tree, {
        exclude: [`${moduleName}/**`],
    });
    return {
        tree: (0, broccoli_merge_trees_1.default)([goodParts, badParts]),
        getMeta: () => ({ 'renamed-modules': renamed }),
    };
}
//# sourceMappingURL=rewrite-addon-tree.js.map